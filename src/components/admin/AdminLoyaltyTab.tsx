import React, {useEffect, useRef, useState} from 'react';
import {Plus, Trash2, Save, RefreshCw, Gift, Users, Receipt} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {apiClient, extractErrorMessage} from '../../lib/api';
import {useOutletEvents} from '../../lib/useOutletEvents';
import {formatNPR} from '../../lib/utils';

type Tier = {name:string; threshold:string; percent:string};
type LoyaltyData = {enabled:boolean; version:number; tiers:Tier[]; can_manage:boolean; customer_count:number;
  customers:{phone:string;name:string;total_spent:string;paid_orders:number;tier:Tier|null}[];
  discounts:{order_number:string;phone:string;source:string;discount:string;created_at:string;loyalty:{name:string;percent:string}}[]};

export const AdminLoyaltyTab:React.FC = () => {
  const {currentOutlet} = useApp();
  const outlet = String(currentOutlet?.id || '');
  const [data,setData] = useState<LoyaltyData|null>(null);
  const [tiers,setTiers] = useState<Tier[]>([]);
  const [enabled,setEnabled] = useState(false);
  const [version,setVersion] = useState(1);
  const [dirty,setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [tab,setTab] = useState<'rules'|'customers'|'discounts'>('rules');
  const [search,setSearch] = useState('');
  const generation = useRef(0);
  const outletRef = useRef(outlet);
  outletRef.current = outlet;
  const path = `/loyalty/?outlet_id=${encodeURIComponent(outlet)}`;
  const edit = () => {dirtyRef.current=true;setDirty(true);setNotice('');};
  const refresh = async () => {
    if(!outlet)return;
    const sequence=++generation.current;
    try {
      const result=await apiClient.get<LoyaltyData>(`${path}&search=${encodeURIComponent(search)}`);
      if(sequence!==generation.current)return;
      setData(result);setError('');
      if(!dirtyRef.current){setTiers(result.tiers);setEnabled(result.enabled);setVersion(result.version);}
    }catch(e){if(sequence===generation.current)setError(extractErrorMessage(e));}
  };
  useEffect(()=>{
    generation.current++;setData(null);setTiers([]);setEnabled(false);dirtyRef.current=false;setDirty(false);setError('');setNotice('');
    void refresh();return()=>{generation.current++;};
  },[outlet]);
  useEffect(()=>{const timer=setTimeout(()=>void refresh(),250);return()=>clearTimeout(timer);},[search]);
  const live=useOutletEvents(outlet,!!outlet,()=>void refresh());
  const save=async()=>{
    setSaving(true);setError('');setNotice('');
    const scope=outlet;
    try {
      const result=await apiClient.put<{enabled:boolean;tiers:Tier[];version:number}>(path,{enabled,tiers,version});
      if(scope!==outletRef.current)return;
      setTiers(result.tiers);setEnabled(result.enabled);setVersion(result.version);dirtyRef.current=false;setDirty(false);
      setNotice('Loyalty rules saved. Eligible discounts apply automatically to new orders and unbilled orders.');
      await refresh();
    }catch(e){if(scope===outletRef.current)setError(extractErrorMessage(e));}
    finally{setSaving(false);}
  };
  const input='w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm rounded';
  const button='inline-flex items-center justify-center gap-2 border border-zinc-300 dark:border-zinc-700 px-3 py-2 rounded text-sm font-semibold disabled:opacity-40';
  return <div className="space-y-5 text-zinc-900 dark:text-zinc-100" data-testid="loyalty-page">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-xl font-bold flex items-center gap-2"><Gift className="h-5 w-5 text-amber-500"/>Customer loyalty</h1>
      <p className="mt-1 text-sm text-zinc-500">One phone number. Shared rewards across POS, web, table QR, and kiosk.</p></div>
      <button className={button} onClick={()=>void refresh()}><RefreshCw size={15}/>Refresh data</button>
    </header>
    {error && <div role="alert" className="border border-red-300 bg-red-50 dark:bg-red-950/30 text-red-600 p-3 text-sm">{error}{dirty && <button className="ml-3 underline" onClick={()=>{dirtyRef.current=false;setDirty(false);void refresh();}}>Discard edits and reload saved rules</button>}</div>}
    {notice && <p role="status" className="p-3 bg-emerald-500/10 text-emerald-600 text-sm">{notice}</p>}
    {!data ? <p role="status" className="p-8 text-center text-zinc-500">{error?'Loyalty data is unavailable. Use Refresh data to retry.':'Loading loyalty...'}</p> : <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[['Program',data.enabled?'Enabled':'Disabled'],['Saved tiers',String(data.tiers.length)],['Customers',String(data.customer_count)]].map(([label,value])=><div key={label} className="border border-zinc-200 dark:border-zinc-800 rounded p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Loyalty sections">
        {([['rules','Spending tiers',Gift],['customers','Customers',Users],['discounts','Applied discounts',Receipt]] as const).map(([key,label,Icon])=><button key={key} onClick={()=>setTab(key)} aria-pressed={tab===key} className={`${button} ${tab===key?'bg-amber-500 text-black border-amber-500':''}`}><Icon size={15}/>{label}</button>)}
      </nav>
      {tab==='rules' && <section className="border border-zinc-200 dark:border-zinc-800 rounded p-4 space-y-4">
        <div className="flex flex-wrap justify-between gap-3"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={enabled} disabled={!data.can_manage||saving} onChange={e=>{setEnabled(e.target.checked);edit();}}/>Enable automatic loyalty discounts</label>
        <span className="text-xs text-zinc-500">{currentOutlet?.name} - Rules shared across this restaurant</span></div>
        <p className="text-sm text-zinc-500">Set cumulative lifetime spending thresholds. For example, another Rs 12,000 after Rs 10,000 means a threshold of Rs 22,000. The highest eligible tier applies to the next purchase.</p>
        <p className="text-xs text-zinc-500">Only fully paid purchases earn rewards. Refunds reduce the balance; tips and unpaid credit do not count. Loyalty and manual discounts do not stack: the larger discount applies. Existing bills and submitted web payments keep their prices.</p>
        {!tiers.length && <div className="border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center"><Gift className="mx-auto mb-2 text-zinc-400"/><h2 className="font-semibold">No loyalty tiers yet</h2><p className="text-sm text-zinc-500 mt-1">Add a spending threshold and discount percentage to start.</p></div>}
        {tiers.map((tier,index)=><div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <label className="text-xs space-y-1"><span>Tier name</span><input aria-label={`Tier ${index+1} name`} className={input} value={tier.name} maxLength={80} disabled={!data.can_manage||saving} onChange={e=>{setTiers(tiers.map((t,i)=>i===index?{...t,name:e.target.value}:t));edit();}}/></label>
          <label className="text-xs space-y-1"><span>Lifetime paid spend from (Rs)</span><input aria-label={`Tier ${index+1} threshold`} className={input} type="number" min="0" step="0.01" value={tier.threshold} disabled={!data.can_manage||saving} onChange={e=>{setTiers(tiers.map((t,i)=>i===index?{...t,threshold:e.target.value}:t));edit();}}/></label>
          <label className="text-xs space-y-1"><span>Discount (%)</span><input aria-label={`Tier ${index+1} percent`} className={input} type="number" min="0" max="100" step="0.01" value={tier.percent} disabled={!data.can_manage||saving} onChange={e=>{setTiers(tiers.map((t,i)=>i===index?{...t,percent:e.target.value}:t));edit();}}/></label>
          {data.can_manage && <button aria-label={`Remove tier ${index+1}`} className={button} disabled={saving} onClick={()=>{setTiers(tiers.filter((_,i)=>i!==index));edit();}}><Trash2 size={16}/></button>}
        </div>)}
        {data.can_manage && <div className="flex justify-between gap-3"><button className={button} disabled={saving||tiers.length>=50} onClick={()=>{setTiers([...tiers,{name:'',threshold:'',percent:''}]);edit();}}><Plus size={16}/>Add tier</button><button className={`${button} bg-amber-500 text-black`} disabled={!dirty||saving} onClick={()=>void save()}><Save size={16}/>{saving?'Saving...':'Save rules'}</button></div>}
      </section>}
      {tab==='customers' && <section className="space-y-3"><input className={input} aria-label="Search loyalty customers" placeholder="Search by name or phone" value={search} onChange={e=>setSearch(e.target.value)}/>
        <p className="text-xs text-zinc-500">Customers at this outlet; spending combines their paid purchases across the restaurant. Showing up to 200 results.</p>
        {!data.customers.length?<p className="p-8 text-center text-zinc-500">No matching customers. Customers appear automatically when an order includes a valid phone number.</p>:<div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b dark:border-zinc-700">{['Customer','Phone','Paid purchases','Lifetime paid spend','Eligible discount'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{data.customers.map(c=><tr key={c.phone} className="border-b dark:border-zinc-800"><td className="p-3">{c.name||'Customer'}</td><td className="p-3 font-mono">{c.phone}</td><td className="p-3">{c.paid_orders}</td><td className="p-3">{formatNPR(Number(c.total_spent))}</td><td className="p-3">{c.tier?`${c.tier.percent}% - ${c.tier.name}`:'No tier yet'}</td></tr>)}</tbody></table></div>}
      </section>}
      {tab==='discounts' && <section>{!data.discounts.length?<p className="p-8 text-center text-zinc-500">No loyalty discounts applied yet.</p>:<div className="overflow-x-auto"><p className="text-xs text-zinc-500 mb-3">Latest 100 orders with loyalty discounts at this outlet.</p><table className="w-full text-sm text-left"><thead><tr className="border-b dark:border-zinc-700">{['Order','Phone','Channel','Tier','Discount'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{data.discounts.map(o=><tr key={o.order_number} className="border-b dark:border-zinc-800"><td className="p-3 font-mono">{o.order_number}</td><td className="p-3">{o.phone}</td><td className="p-3">{o.source.replace('_',' ')}</td><td className="p-3">{o.loyalty?.name} ({o.loyalty?.percent}%)</td><td className="p-3">{formatNPR(Number(o.discount))}</td></tr>)}</tbody></table></div>}</section>}
      <p className="text-xs text-zinc-500">{live?'Live order updates connected':'Connecting to live order updates...'}</p>
    </>}
  </div>;
};
