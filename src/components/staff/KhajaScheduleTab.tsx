import React, {useEffect, useRef, useState} from 'react';
import {CalendarDays, Pencil, RefreshCw, Search} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {apiClient, extractErrorMessage} from '../../lib/api';
import {daybookPath} from '../../lib/daybookApi';
import {Modal} from '../common/Modal';

type MenuProduct = {id:string; name:string; category:string; archived:boolean};
type ScheduleDay = {weekday:number; name:string; revision:number; products:MenuProduct[]; updated_at:string|null; updated_by:string|null};
type Schedule = {days:ScheduleDay[]; products:MenuProduct[]};
const button='inline-flex items-center justify-center gap-2 rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-semibold disabled:opacity-40';
const input='w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm';

export const KhajaScheduleTab:React.FC=()=>{
  const {currentOutlet}=useApp();
  const outlet=String(currentOutlet?.id||'');
  const [data,setData]=useState<Schedule|null>(null);
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
  const [error,setError]=useState(''),[saveError,setSaveError]=useState(''),[notice,setNotice]=useState('');
  const [editing,setEditing]=useState<ScheduleDay|null>(null);
  const [selected,setSelected]=useState<string[]>([]),[search,setSearch]=useState('');
  const mounted=useRef(true),locked=useRef(false),sequence=useRef(0);
  const refresh=async()=>{
    if(!outlet){setLoading(false);return;}
    const request=++sequence.current;
    setLoading(true);setError('');
    try{
      const result=await apiClient.get<Schedule>(daybookPath(outlet,'khaja-schedule/'));
      if(mounted.current&&request===sequence.current)setData(result);
    }catch(e){if(mounted.current&&request===sequence.current)setError(extractErrorMessage(e));}
    finally{if(mounted.current&&request===sequence.current)setLoading(false);}
  };
  useEffect(()=>{mounted.current=true;void refresh();return()=>{mounted.current=false;sequence.current++;};},[outlet]);
  const edit=(day:ScheduleDay)=>{setEditing(day);setSelected(day.products.map(p=>p.id));setSearch('');setSaveError('');setNotice('');};
  const close=()=>{if(!locked.current)setEditing(null);};
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();if(!editing||locked.current)return;
    locked.current=true;setSaving(true);setSaveError('');sequence.current++;
    try{
      const result=await apiClient.post<Schedule>(daybookPath(outlet,'khaja-schedule/'),{weekday:editing.weekday,revision:editing.revision,product_ids:selected});
      if(mounted.current){setData(result);setNotice(`${editing.name} khaja schedule saved.`);setEditing(null);}
    }catch(e){if(mounted.current)setSaveError(extractErrorMessage(e));}
    finally{locked.current=false;if(mounted.current)setSaving(false);}
  };
  const choices=Array.from(new Map([...(data?.products||[]),...(editing?.products||[])].map(p=>[p.id,p])).values());
  const visible=choices.filter(p=>`${p.name} ${p.category}`.toLowerCase().includes(search.trim().toLowerCase()));
  const scheduled=data?.days.filter(day=>day.products.length).length||0;
  return <section className="space-y-5 text-zinc-900 dark:text-zinc-100" data-testid="khaja-schedule">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-xl font-bold"><CalendarDays className="h-5 w-5 text-amber-500"/>Khaja Schedule</h1>
        <p className="mt-1 text-sm text-zinc-500">{currentOutlet?.name} - A repeating weekly khaja routine.</p></div>
      <button className={button} disabled={loading||saving} onClick={()=>void refresh()}><RefreshCw size={16}/>Refresh schedule</button>
    </header>
    {error&&<p role="alert" className="rounded bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p>}
    {notice&&<p role="status" className="rounded bg-emerald-500/10 p-3 text-sm text-emerald-600">{notice}</p>}
    {!outlet?<p>Select an outlet to manage its khaja routine.</p>:!data?<p role="status" className="py-10 text-center text-zinc-500">{loading?'Loading weekly schedule...':'Unable to load the schedule. Use Refresh schedule to retry.'}</p>:<>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-200 dark:border-zinc-800 p-4">
        <p className="text-sm">Choose one or more menu products for each day. This routine repeats every week.</p>
        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{scheduled} of 7 days planned</span>
      </div>
      <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm" aria-label="Weekly khaja schedule">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500"><tr><th scope="col" className="p-4">Day</th><th scope="col" className="p-4">Khaja menu</th><th scope="col" className="p-4">Last updated</th><th scope="col" className="p-4">Action</th></tr></thead>
          <tbody>{data.days.map(day=><tr key={day.weekday} className="border-t border-zinc-200 dark:border-zinc-800 align-top">
            <th scope="row" className="p-4 font-semibold">{day.name}</th>
            <td className="p-4 min-w-52">{day.products.length?<ul className="flex flex-wrap gap-2">{day.products.map(product=><li key={product.id} className="rounded bg-amber-500/10 px-3 py-1 text-amber-800 dark:text-amber-300">{product.name}{product.archived&&<span className="text-xs"> (archived)</span>}</li>)}</ul>:<span className="text-zinc-500">Not planned</span>}</td>
            <td className="p-4 text-xs text-zinc-500">{day.updated_at?<><time dateTime={day.updated_at}>{new Date(day.updated_at).toLocaleString('en-GB',{timeZone:'Asia/Kathmandu',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</time><span className="block mt-1">{day.updated_by}</span></>:'-'}</td>
            <td className="p-4"><button className={button} disabled={loading} aria-label={`Edit ${day.name} khaja`} onClick={()=>edit(day)}><Pencil size={14}/>{day.products.length?'Edit':'Plan'}</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">Times shown in Nepal time. Editing one day keeps the other days unchanged.</p>
    </>}
    <Modal isOpen={!!editing} onClose={close} title={`${editing?.name||''} Khaja Schedule`} maxWidth="lg">
      <form className="p-4 space-y-4" onSubmit={save}>
        <p className="text-sm text-zinc-500">Select any number of menu products for {editing?.name}. Remove all selections to leave the day unplanned.</p>
        <fieldset disabled={saving} className="space-y-3">
          <label className="block space-y-1 text-xs font-medium"><span className="flex items-center gap-1"><Search size={14}/>Search menu products</span><input autoFocus className={input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Product or category"/></label>
          <div className="flex justify-between items-center text-xs"><span>{selected.length} selected</span><button type="button" className="underline" onClick={()=>setSelected([])}>Clear selections</button></div>
          <div className="max-h-72 overflow-y-auto rounded border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
            {visible.map(product=><label key={product.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <input type="checkbox" checked={selected.includes(product.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,product.id]:old.filter(id=>id!==product.id))}/>
              <span className="text-sm">{product.name}<span className="block text-xs text-zinc-500">{product.category}{product.archived?' - Archived':''}</span></span>
            </label>)}
            {!visible.length&&<p className="p-6 text-center text-sm text-zinc-500">{choices.length?'No matching products.':'No menu products available. Add products to this outlet menu first.'}</p>}
          </div>
          <div className="flex justify-end gap-2"><button type="button" className={button} onClick={close}>Cancel</button><button type="submit" className={`${button} bg-amber-500 border-amber-500 text-black`}>{saving?'Saving...':'Save day'}</button></div>
        </fieldset>
        {saveError&&<p role="alert" className="text-sm text-rose-500">{saveError}</p>}
      </form>
    </Modal>
  </section>;
};
