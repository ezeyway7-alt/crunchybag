import React, {useEffect, useRef, useState} from 'react';
import {BookOpen, Plus, Minus, Download, RefreshCw, ChevronLeft, ChevronRight, Ban} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {Modal} from '../common/Modal';
import {apiClient, extractErrorMessage} from '../../lib/api';
import {todayNepal} from '../../lib/posApi';
import {formatNPR} from '../../lib/utils';
import {DaybookEntry, DaybookLedger, DaybookPreview, daybookMethods, daybookPath, useDaybookCommand, useDaybookLive} from '../../lib/daybookApi';

const input='w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm disabled:opacity-50';
const button='inline-flex items-center justify-center gap-2 rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const label='block space-y-1 text-xs font-medium';
const localTime=(value:string)=>new Date(value).toLocaleTimeString('en-GB',{timeZone:'Asia/Kathmandu',hour:'2-digit',minute:'2-digit'});
const categories={IN:['Sales received','Customer payment','Capital deposit','Opening balance','Other income'],OUT:['Cash withdrawal','Store expense','Supplier payment','Staff wage / advance','Sales refund','Other payment']};
type Form={date:string;direction:'IN'|'OUT';amount:string;payment_method:string;category:string;party:string;description:string;reference:string};
const blank=(date:string,direction:'IN'|'OUT'):Form=>({date,direction,amount:'',payment_method:'CASH',category:direction==='IN'?'Other income':'Cash withdrawal',party:'',description:'',reference:''});

export const StaffDaybookTab:React.FC=()=>{
  const {currentOutlet}=useApp();
  const outlet=String(currentOutlet?.id||'');
  const [date,setDate]=useState(todayNepal),[direction,setDirection]=useState('ALL'),[method,setMethod]=useState('ALL');
  const [search,setSearch]=useState(''),[query,setQuery]=useState(''),[showVoided,setShowVoided]=useState(false),[page,setPage]=useState(1);
  const [data,setData]=useState<{scope:string;value:DaybookLedger}|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[notice,setNotice]=useState('');
  const [modal,setModal]=useState<'entry'|'import'|'void'|null>(null),[form,setForm]=useState<Form>(()=>blank(todayNepal(),'IN'));
  const [importDate,setImportDate]=useState(todayNepal),[kind,setKind]=useState<'SALE'|'REFUND'>('SALE');
  const [preview,setPreview]=useState<DaybookPreview|null>(null),[importLoading,setImportLoading]=useState(false),[importError,setImportError]=useState('');
  const [selected,setSelected]=useState<Set<number>>(new Set());
  const [voidEntry,setVoidEntry]=useState<DaybookEntry|null>(null),[voidReason,setVoidReason]=useState('');
  const sequence=useRef(0),importSequence=useRef(0);
  const scope=`${outlet}:${date}:${direction}:${method}:${query}:${showVoided}:${page}`;
  const ledger=data?.scope===scope?data.value:null;
  const command=useDaybookCommand(outlet);
  const blocked=command.busy||!!command.pending;
  const refresh=async()=>{
    if(!/^\d+$/.test(outlet)||!date)return;
    const seq=++sequence.current;setLoading(true);
    try {
      const params=new URLSearchParams({date,direction,payment_method:method,search:query,include_voided:String(showVoided),page:String(page)});
      const value=await apiClient.get<DaybookLedger>(`${daybookPath(outlet)}&${params}`);
      if(seq!==sequence.current)return;
      const last=Math.max(1,Math.ceil(value.count/value.page_size));
      if(page>last){setPage(last);return;}
      setData({scope,value});setError('');
    }catch(e){if(seq===sequence.current)setError(extractErrorMessage(e));}
    finally{if(seq===sequence.current)setLoading(false);}
  };
  const loadPreview=async(reset=true)=>{
    if(!importDate)return;
    const seq=++importSequence.current;setImportLoading(true);setImportError('');
    try {
      const result=await apiClient.get<DaybookPreview>(`${daybookPath(outlet,'import/')}&date=${importDate}&kind=${kind}`);
      if(seq!==importSequence.current)return;
      setPreview(result);
      const eligible=new Set(result.results.filter(row=>!row.imported).map(row=>row.id));
      setSelected(old=>reset?eligible:new Set([...old].filter(id=>eligible.has(id))));
    }catch(e){if(seq===importSequence.current)setImportError(extractErrorMessage(e));}
    finally{if(seq===importSequence.current)setImportLoading(false);}
  };
  useEffect(()=>{const timer=setTimeout(()=>{setQuery(search);setPage(1);},250);return()=>clearTimeout(timer);},[search]);
  useEffect(()=>{void refresh();return()=>{sequence.current++;};},[scope]);
  useEffect(()=>{setModal(null);setPreview(null);setNotice('');setPage(1);importSequence.current++;},[outlet]);
  useEffect(()=>{if(modal==='import'){setPreview(null);setSelected(new Set());void loadPreview();}return()=>{importSequence.current++;};},[modal,importDate,kind,outlet]);
  const live=useDaybookLive(outlet,()=>{void refresh();if(modal==='import')void loadPreview(false);});
  const openEntry=(value:'IN'|'OUT')=>{setForm(blank(date,value));setNotice('');setModal('entry');};
  const openImport=(value:'SALE'|'REFUND')=>{setKind(value);setImportDate(todayNepal());setNotice('');setModal('import');};
  const finish=(result:any)=>{if(!result)return;setModal(null);setNotice(result.created!==undefined?`${result.created} payment entries imported; ${result.skipped} already recorded. Date: ${result.date}.`:`Entry saved for ${result.date}.`);void refresh();};
  const submit=async(e:React.FormEvent)=>{e.preventDefault();finish(await command.run('',form));};
  const importSelected=async()=>{if(!preview||!selected.size||importLoading)return;finish(await command.run('import/',{date:importDate,kind,payment_ids:[...selected].sort((a,b)=>a-b)}));};
  const submitVoid=async(e:React.FormEvent)=>{e.preventDefault();if(voidEntry)finish(await command.run(`${voidEntry.id}/void/`,{reason:voidReason}));};
  const eligible=preview?.results.filter(row=>!row.imported)||[];
  const allSelected=eligible.length>0&&eligible.every(row=>selected.has(row.id));
  const selectedTotal=(preview?.results||[]).filter(row=>selected.has(row.id)&&!row.imported).reduce((sum,row)=>sum+Number(row.amount),0);
  const update=(key:keyof Form,value:string)=>setForm(old=>({...old,[key]:value}));
  const changeFilter=(setter:(value:string)=>void,value:string)=>{setter(value);setPage(1);};

  return <div className="space-y-5 text-zinc-900 dark:text-zinc-100" data-testid="daybook-page">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-xl font-bold"><BookOpen className="h-5 w-5 text-amber-500"/>Daybook</h1><p className="mt-1 text-sm text-zinc-500">{currentOutlet?.name} - Record money received and money paid out.</p></div>
      <div className="flex flex-wrap gap-2"><button className={`${button} bg-emerald-600 text-white border-emerald-600`} disabled={blocked} onClick={()=>openEntry('IN')}><Plus size={16}/>Money in</button><button className={`${button} bg-rose-600 text-white border-rose-600`} disabled={blocked} onClick={()=>openEntry('OUT')}><Minus size={16}/>Money out</button><button className={`${button} bg-amber-500 text-black border-amber-500`} disabled={blocked} onClick={()=>openImport('SALE')}><Download size={16}/>Import today's sales</button></div>
    </header>
    {(error||command.error) && <p role="alert" className="border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-500">{command.error||error}</p>}
    {command.pending&&!command.busy && <div role="alert" className="border border-amber-400/40 bg-amber-500/10 p-3 text-sm">The last request has not been confirmed. Retry it safely before adding another entry.<button className={`${button} ml-3`} onClick={async()=>finish(await command.retry())}>Retry pending entry</button></div>}
    {notice && <p role="status" className="p-3 text-sm bg-emerald-500/10 text-emerald-600">{notice}</p>}
    <div className="flex flex-wrap items-end gap-3 rounded border border-zinc-200 dark:border-zinc-800 p-3">
      <label className={label}><span>Daybook date (Nepal)</span><input type="date" aria-label="Daybook date" className={input} value={date} max={todayNepal()} onChange={e=>changeFilter(setDate,e.target.value||todayNepal())}/></label>
      <button className={button} onClick={()=>changeFilter(setDate,todayNepal())}>Today</button>
      <label className={label}><span>Direction</span><select aria-label="Filter direction" className={input} value={direction} onChange={e=>changeFilter(setDirection,e.target.value)}><option value="ALL">All entries</option><option value="IN">Money in</option><option value="OUT">Money out</option></select></label>
      <label className={label}><span>Payment method</span><select aria-label="Filter payment method" className={input} value={method} onChange={e=>changeFilter(setMethod,e.target.value)}><option value="ALL">All methods</option>{daybookMethods.map(m=><option key={m}>{m}</option>)}</select></label>
      <label className={`${label} grow`}><span>Search</span><input className={input} aria-label="Search daybook" placeholder="Person, category, note, or reference" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <button aria-label="Refresh daybook" className={button} disabled={loading} onClick={()=>void refresh()}><RefreshCw size={16}/></button>
    </div>
    {ledger && <>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">{([['Opening balance','opening'],['Money in','income'],['Money out','expense'],['Closing balance','closing'],['Cash balance','cash_closing']] as const).map(([name,key])=><div key={key} className="border border-zinc-200 dark:border-zinc-800 rounded p-4"><p className="text-xs text-zinc-500">{name}</p><p className={`mt-1 text-lg font-bold font-mono ${key==='income'?'text-emerald-500':key==='expense'?'text-rose-500':''}`} data-testid={`daybook-${key}`}>{formatNPR(Number(ledger.summary[key]))}</p></div>)}</div>
      <p className="text-xs text-zinc-500">Balances use recorded entries only. Opening balance carries forward earlier dates. Cash balance excludes digital payments. These are money movements, not profit. To record starting funds, use Money in with the Opening balance category.</p>
    </>}
    <section className="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-3 p-3 border-b border-zinc-200 dark:border-zinc-800"><h2 className="font-semibold">Entries {ledger?`(${ledger.count})`:''}</h2><div className="flex gap-4 items-center"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showVoided} onChange={e=>{setShowVoided(e.target.checked);setPage(1);}}/>Show voided entries</label><button className="text-xs underline" disabled={blocked} onClick={()=>openImport('REFUND')}>Import refunds</button></div></div>
      {!ledger?<p role="status" className="p-10 text-center text-zinc-500">{error?'Unable to load entries. Retry with Refresh daybook.':'Loading daybook...'}</p>:!ledger.results.length?<div className="p-10 text-center"><BookOpen className="mx-auto mb-3 text-zinc-400"/><h3 className="font-semibold">No entries for these filters</h3><p className="mt-1 text-sm text-zinc-500">Add money in, record money out, or select paid sales to import.</p></div>:<div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500"><tr>{['Entry / time','Details','Payment','Money in','Money out','Recorded by',''].map((h,i)=><th key={i} className="p-3 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{ledger.results.map(entry=><tr key={entry.id} className={`border-t border-zinc-200 dark:border-zinc-800 ${entry.voided_at?'opacity-55':''}`}>
        <td className="p-3 whitespace-nowrap"><span className="font-mono">DB-{entry.id}</span><span className="block text-xs text-zinc-500">{localTime(entry.created_at)}</span><span className="block text-xs text-zinc-500">{entry.source==='MANUAL'?'Manual':entry.source==='SALE'?'Imported sale':'Imported refund'}</span></td>
        <td className="p-3 min-w-56"><p className="font-semibold">{entry.category}{entry.voided_at&&<span className="ml-2 text-rose-500">Voided</span>}</p><p className="text-xs">{entry.party}</p><p className="text-xs text-zinc-500 break-words">{entry.description}</p>{entry.reference&&<p className="font-mono text-xs text-zinc-500 break-all">{entry.reference}</p>}{entry.voided_at&&<p className="mt-1 text-xs text-rose-500">{entry.void_reason} - {entry.voided_by}</p>}</td>
        <td className="p-3 text-xs">{entry.payment_method.replace('_',' ')}</td><td className={`p-3 font-mono whitespace-nowrap text-emerald-500 ${entry.voided_at?'line-through':''}`}>{entry.direction==='IN'?formatNPR(Number(entry.amount)):'-'}</td><td className={`p-3 font-mono whitespace-nowrap text-rose-500 ${entry.voided_at?'line-through':''}`}>{entry.direction==='OUT'?formatNPR(Number(entry.amount)):'-'}</td><td className="p-3 text-xs">{entry.recorded_by}</td><td className="p-3">{ledger.can_void&&!entry.voided_at&&<button aria-label={`Void entry DB-${entry.id}`} className={button} disabled={blocked} onClick={()=>{setVoidEntry(entry);setVoidReason('');setModal('void');}}><Ban size={15}/></button>}</td>
      </tr>)}</tbody></table></div>}
      {ledger&&ledger.count>ledger.page_size&&<div className="flex items-center justify-end gap-3 p-3 border-t dark:border-zinc-800"><button className={button} aria-label="Previous page" disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/></button><span className="text-xs">Page {page} of {Math.ceil(ledger.count/ledger.page_size)}</span><button className={button} aria-label="Next page" disabled={page*ledger.page_size>=ledger.count||loading} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button></div>}
    </section>
    <p className="text-xs text-zinc-500">{live?'Live daybook updates connected':'Connecting to live updates...'} {ledger&&'Summary totals cover the whole selected day, regardless of search filters.'}</p>

    <Modal isOpen={modal==='entry'} onClose={()=>{if(!command.busy)setModal(null);}} title={form.direction==='IN'?'Record money in':'Record money out'} maxWidth="lg">
      <form onSubmit={submit} className="p-4 space-y-4">
        <p className="text-xs text-zinc-500">{form.direction==='OUT'?'Use this for cash withdrawals, expenses, supplier payments, and other money paid out.':'Use this for actual receipts or starting funds. If a sale is recorded here manually, leave it unticked when importing sales.'}</p>
        <fieldset disabled={blocked} className="space-y-4">
          <div className="grid grid-cols-2 gap-3"><label className={label}><span>Date</span><input aria-label="Entry date" className={input} type="date" value={form.date} max={todayNepal()} required onChange={e=>update('date',e.target.value)}/></label><label className={label}><span>Amount (Rs)</span><input aria-label="Entry amount" className={input} type="number" min="0.01" max="9999999999.99" step="0.01" value={form.amount} required onChange={e=>update('amount',e.target.value)}/></label></div>
          <div className="grid grid-cols-2 gap-3"><label className={label}><span>Category</span><select aria-label="Entry category" className={input} value={form.category} onChange={e=>update('category',e.target.value)}>{categories[form.direction].map(c=><option key={c}>{c}</option>)}</select></label><label className={label}><span>Payment method</span><select aria-label="Entry payment method" className={input} value={form.payment_method} onChange={e=>update('payment_method',e.target.value)}>{daybookMethods.map(m=><option key={m}>{m}</option>)}</select></label></div>
          <label className={label}><span>{form.direction==='IN'?'Received from':'Paid to / taken by'} (optional)</span><input aria-label="Entry person" className={input} value={form.party} maxLength={150} onChange={e=>update('party',e.target.value)}/></label>
          <label className={label}><span>Description / reason</span><textarea aria-label="Entry description" className={input} value={form.description} required maxLength={1000} onChange={e=>update('description',e.target.value)}/></label>
          <label className={label}><span>Receipt / reference (optional)</span><input aria-label="Entry reference" className={input} value={form.reference} maxLength={128} onChange={e=>update('reference',e.target.value)}/></label>
          <button type="submit" className={`${button} w-full bg-amber-500 text-black`}>{command.busy?'Saving...':'Save entry'}</button>
        </fieldset>
        {command.error&&<p role="alert" className="text-sm text-rose-500">{command.error}</p>}
        {command.pending&&!command.busy&&<button type="button" className={button} onClick={async()=>finish(await command.retry())}>Retry pending entry</button>}
      </form>
    </Modal>
    <Modal isOpen={modal==='import'} onClose={()=>{if(!command.busy)setModal(null);}} title={kind==='SALE'?'Import sales received':'Import refunds paid'} maxWidth="4xl">
      <div className="p-4 space-y-4">
        <p className="text-sm text-zinc-500">{kind==='SALE'?'Choose actual payments received on this date. All unimported payments start selected; untick any already entered manually. Split payments appear separately. Unpaid orders and credit are excluded.':'Refund payments become money-out entries. Previously imported payments cannot be imported again, including voided entries.'}</p>
        <div className="flex flex-wrap items-end gap-3"><label className={label}><span>Payment date (Nepal)</span><input aria-label="Import date" className={input} type="date" max={todayNepal()} value={importDate} disabled={blocked} onChange={e=>setImportDate(e.target.value||todayNepal())}/></label><label className={label}><span>Type</span><select aria-label="Import type" className={input} value={kind} disabled={blocked} onChange={e=>setKind(e.target.value as 'SALE'|'REFUND')}><option value="SALE">Sales received (IN)</option><option value="REFUND">Refunds paid (OUT)</option></select></label><button className={button} disabled={importLoading||blocked} onClick={()=>void loadPreview()}>Reload list</button></div>
        {importError&&<p role="alert" className="text-rose-500 text-sm">{importError}</p>}
        {command.error&&<p role="alert" className="text-rose-500 text-sm">{command.error}</p>}
        {importLoading&&!preview?<p role="status">Loading payments...</p>:preview&&!preview.results.length?<p className="py-8 text-center text-zinc-500">No {kind==='SALE'?'received sales payments':'refund payments'} for this date.</p>:preview&&<div className="max-h-96 overflow-auto border border-zinc-200 dark:border-zinc-800"><table className="w-full text-sm text-left"><thead className="bg-zinc-100 dark:bg-zinc-900 sticky top-0"><tr><th className="p-3"><input aria-label="Select all eligible payments" type="checkbox" checked={allSelected} disabled={blocked||importLoading} onChange={e=>setSelected(e.target.checked?new Set(eligible.map(row=>row.id)):new Set())}/></th>{['Order / payment','Customer / channel','Method','Amount','Status'].map(h=><th key={h} className="p-3 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{preview.results.map(row=><tr key={row.id} className="border-t border-zinc-200 dark:border-zinc-800"><td className="p-3"><input type="checkbox" aria-label={`Select payment ${row.transaction_id}`} checked={selected.has(row.id)&&!row.imported} disabled={row.imported||blocked||importLoading} onChange={e=>setSelected(old=>{const next=new Set(old);e.target.checked?next.add(row.id):next.delete(row.id);return next;})}/></td><td className="p-3"><p className="font-mono">{row.order_number}</p><p className="text-xs text-zinc-500 break-all">{row.transaction_id}</p><p className="text-xs text-zinc-500">{localTime(row.created_at)}</p></td><td className="p-3 text-xs">{row.customer}<span className="block text-zinc-500">{row.source.replace('_',' ')}</span></td><td className="p-3 text-xs">{row.payment_method}</td><td className="p-3 font-mono whitespace-nowrap">{formatNPR(Number(row.amount))}</td><td className="p-3 text-xs">{row.voided?'Imported, then voided':row.imported?'Already imported':kind==='SALE'?'Money in':'Money out'}</td></tr>)}</tbody></table></div>}
        {preview?.truncated&&<p className="text-xs text-amber-500">Showing up to 5,000 payments, with unimported payments first. Import this batch and reload for the remaining payments.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold">{selected.size} selected - {formatNPR(selectedTotal)} {kind==='SALE'?'IN':'OUT'}</p><button className={`${button} bg-amber-500 text-black`} disabled={blocked||importLoading||!!importError||!selected.size} onClick={()=>void importSelected()}>{command.busy?'Importing...':`Import ${selected.size} selected`}</button></div>
        {command.pending&&!command.busy&&<button className={button} onClick={async()=>finish(await command.retry())}>Retry pending entry</button>}
      </div>
    </Modal>
    <Modal isOpen={modal==='void'} onClose={()=>{if(!command.busy)setModal(null);}} title={`Void entry DB-${voidEntry?.id}`}>
      <form className="p-4 space-y-4" onSubmit={submitVoid}><p className="text-sm text-zinc-500">This removes the entry from balances and keeps its original details in the audit history. It does not refund or change an order payment. To correct an entry, void it and record its replacement manually.</p><label className={label}><span>Reason for voiding</span><textarea aria-label="Void reason" required maxLength={500} className={input} value={voidReason} disabled={blocked} onChange={e=>setVoidReason(e.target.value)}/></label><button className={`${button} w-full bg-rose-600 text-white`} disabled={blocked||!voidReason.trim()}>{command.busy?'Saving...':'Void entry'}</button>{command.error&&<p role="alert" className="text-rose-500 text-sm">{command.error}</p>}{command.pending&&!command.busy&&<button type="button" className={button} onClick={async()=>finish(await command.retry())}>Retry pending entry</button>}</form>
    </Modal>
  </div>;
};
