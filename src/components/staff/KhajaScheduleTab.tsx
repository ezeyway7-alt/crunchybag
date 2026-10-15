import React, {useEffect, useRef, useState} from 'react';
import {CalendarDays, Pencil, RefreshCw, Search} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {apiClient, extractErrorMessage} from '../../lib/api';
import {daybookPath} from '../../lib/daybookApi';
import {Modal} from '../common/Modal';

type MenuProduct = {id:string; name:string; category:string; archived:boolean};
type ScheduleDay = {weekday:number; name:string; revision:number; products:MenuProduct[]; updated_at:string|null; updated_by:string|null};
type Schedule = {days:ScheduleDay[]; products:MenuProduct[]};
const button='inline-flex items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1 text-xs font-semibold disabled:opacity-40';
const input='w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1 text-xs';

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
  return <section className="space-y-3 text-zinc-900 dark:text-zinc-100" data-testid="khaja-schedule">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div><h1 className="flex items-center gap-1.5 text-lg font-bold"><CalendarDays className="h-4 w-4 text-amber-500"/>Khaja Schedule</h1>
        <p className="text-xs text-zinc-500">{currentOutlet?.name} - A repeating weekly khaja routine.</p></div>
      <button className={button} disabled={loading||saving} onClick={()=>void refresh()}><RefreshCw size={14}/>Refresh schedule</button>
    </header>
    {error&&<p role="alert" className="border border-rose-400/40 bg-rose-500/10 p-2 text-xs text-rose-500">{error}</p>}
    {notice&&<p role="status" className="p-2 text-xs bg-emerald-500/10 text-emerald-600">{notice}</p>}
    {!outlet?<p className="text-xs text-zinc-400">Select an outlet to manage its khaja routine.</p>:!data?<p role="status" className="py-8 text-center text-xs text-zinc-500">{loading?'Loading weekly schedule...':'Unable to load the schedule. Use Refresh schedule to retry.'}</p>:<>
      <div className="flex flex-wrap items-center justify-between gap-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40 px-3 py-1.5 text-xs">
        <span className="text-zinc-400 text-xs">Choose menu products for each day. Repeats every week.</span>
        <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">{scheduled} of 7 days planned</span>
      </div>
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-xs" aria-label="Weekly khaja schedule">
          <thead className="bg-zinc-50 dark:bg-zinc-900 text-[11px] text-zinc-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="py-1 px-2.5 font-medium">Day</th>
              <th scope="col" className="py-1 px-2.5 font-medium">Khaja menu</th>
              <th scope="col" className="py-1 px-2.5 font-medium">Last updated</th>
              <th scope="col" className="py-1 px-2.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>{data.days.map(day=><tr key={day.weekday} className="border-t border-zinc-200 dark:border-zinc-800 align-middle hover:bg-zinc-800/30">
            <th scope="row" className="py-1.5 px-2.5 font-semibold text-xs whitespace-nowrap">{day.name}</th>
            <td className="py-1.5 px-2.5 min-w-44">{day.products.length?<ul className="flex flex-wrap gap-1">{day.products.map(product=><li key={product.id} className="border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-800 dark:text-amber-300 font-medium">{product.name}{product.archived&&<span className="text-[10px] text-zinc-500"> (archived)</span>}</li>)}</ul>:<span className="text-xs text-zinc-500">Not planned</span>}</td>
            <td className="py-1.5 px-2.5 text-[11px] text-zinc-500 whitespace-nowrap">{day.updated_at?<><time dateTime={day.updated_at}>{new Date(day.updated_at).toLocaleString('en-GB',{timeZone:'Asia/Kathmandu',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</time><span className="block text-[10px]">{day.updated_by}</span></>:'-'}</td>
            <td className="py-1.5 px-2.5"><button className={button} disabled={loading} aria-label={`Edit ${day.name} khaja`} onClick={()=>edit(day)}><Pencil size={12}/>{day.products.length?'Edit':'Plan'}</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="text-[11px] text-zinc-500">Times shown in Nepal time. Editing one day keeps the other days unchanged.</p>
    </>}
    <Modal isOpen={!!editing} onClose={close} title={`${editing?.name||''} Khaja Schedule`} maxWidth="lg">
      <form className="p-3.5 space-y-3" onSubmit={save}>
        <p className="text-xs text-zinc-500">Select any number of menu products for {editing?.name}. Remove all selections to leave the day unplanned.</p>
        <fieldset disabled={saving} className="space-y-2.5">
          <label className="block space-y-0.5 text-xs font-medium"><span className="flex items-center gap-1 text-[11px] text-zinc-400"><Search size={12}/>Search menu products</span><input autoFocus className={input} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Product or category"/></label>
          <div className="flex justify-between items-center text-xs"><span>{selected.length} selected</span><button type="button" className="underline text-amber-500" onClick={()=>setSelected([])}>Clear selections</button></div>
          <div className="max-h-64 overflow-y-auto border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
            {visible.map(product=><label key={product.id} className="flex items-center gap-2.5 py-1.5 px-2.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs">
              <input type="checkbox" checked={selected.includes(product.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,product.id]:old.filter(id=>id!==product.id))}/>
              <span>{product.name}<span className="block text-[10px] text-zinc-500">{product.category}{product.archived?' - Archived':''}</span></span>
            </label>)}
            {!visible.length&&<p className="p-4 text-center text-xs text-zinc-500">{choices.length?'No matching products.':'No menu products available. Add products to this outlet menu first.'}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-1"><button type="button" className={button} onClick={close}>Cancel</button><button type="submit" className={`${button} bg-amber-500 border-amber-500 text-black font-semibold`}>{saving?'Saving...':'Save day'}</button></div>
        </fieldset>
        {saveError&&<p role="alert" className="text-xs text-rose-500">{saveError}</p>}
      </form>
    </Modal>
  </section>;
};
