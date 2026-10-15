import React, {useEffect, useRef, useState} from 'react';
import {CalendarCheck, ChevronLeft, ChevronRight, RefreshCw} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {apiClient, extractErrorMessage} from '../../lib/api';
import {daybookPath} from '../../lib/daybookApi';
import {Modal} from '../common/Modal';

type Status='PRESENT'|'ABSENT'|'FIRST_HALF'|'SECOND_HALF'|'UNMARKED';
type Cell={status:Status;revision:number;updated_at:string;updated_by:string};
type Staff={id:number;name:string;active:boolean;cells:Record<string,Cell>;present:number;absent:number;half_days:number;unmarked:number};
type Day={day:number;date:string;weekday:string;future:boolean;today:boolean};
type Month={year:number;month:number;month_name:string;months:string[];min_year:number;max_year:number;today:{year:number;month:number;day:number};days:Day[];total_days:number;staff:Staff[]};
const statuses:Record<Status,{label:string;short:string;color:string}>={
  PRESENT:{label:'Present',short:'P',color:'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'},
  ABSENT:{label:'Absent',short:'A',color:'bg-rose-500/15 text-rose-700 dark:text-rose-400'},
  FIRST_HALF:{label:'First half present',short:'H1',color:'bg-amber-500/15 text-amber-700 dark:text-amber-400'},
  SECOND_HALF:{label:'Second half present',short:'H2',color:'bg-sky-500/15 text-sky-700 dark:text-sky-400'},
  UNMARKED:{label:'Unmarked',short:'-',color:'text-zinc-400'},
};
const control='rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-xs disabled:opacity-40';
export const StaffAttendanceTab:React.FC=()=>{
  const {currentOutlet}=useApp();const outlet=String(currentOutlet?.id||'');
  const [period,setPeriod]=useState<{year:number;month:number}|null>(null);
  const [data,setData]=useState<Month|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [search,setSearch]=useState(''),[notice,setNotice]=useState('');
  const [editing,setEditing]=useState<{staff:Staff;day:number}|null>(null);
  const [status,setStatus]=useState<Status>('PRESENT'),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState('');
  const sequence=useRef(0),mounted=useRef(true),locked=useRef(false);
  const refresh=async()=>{
    if(!outlet){setLoading(false);return;}
    const seq=++sequence.current;setLoading(true);setError('');
    try{
      const params=period?`&year=${period.year}&month=${period.month}`:'';
      const result=await apiClient.get<Month>(daybookPath(outlet,'attendance/')+params);
      if(mounted.current&&seq===sequence.current)setData(result);
    }catch(e){if(mounted.current&&seq===sequence.current)setError(extractErrorMessage(e));}
    finally{if(mounted.current&&seq===sequence.current)setLoading(false);}
  };
  useEffect(()=>{mounted.current=true;setData(null);void refresh();return()=>{mounted.current=false;sequence.current++;};},[outlet,period?.year,period?.month]);
  const changeMonth=(year:number,month:number)=>{setEditing(null);setNotice('');setPeriod({year,month});};
  const shift=(offset:number)=>{if(!data)return;const index=data.year*12+data.month-1+offset;changeMonth(Math.floor(index/12),index%12+1);};
  const open=(staff:Staff,day?:number)=>{
    if(!data||loading)return;
    const selected=day??data.days.find(d=>d.today&&(staff.active||staff.cells[String(d.day)]))?.day??data.days.find(d=>!d.future&&(staff.active||staff.cells[String(d.day)]))?.day;
    if(!selected)return;
    setEditing({staff,day:selected});setStatus(staff.cells[String(selected)]?.status||'PRESENT');setSaveError('');setNotice('');
  };
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();if(!editing||!data||locked.current)return;
    locked.current=true;setSaving(true);setSaveError('');
    try{
      await apiClient.post(daybookPath(outlet,'attendance/'),{staff_id:editing.staff.id,year:data.year,month:data.month,day:editing.day,status,revision:editing.staff.cells[String(editing.day)]?.revision||0});
      if(mounted.current){setNotice(`${editing.staff.name}: ${statuses[status].label} saved.`);setEditing(null);await refresh();}
    }catch(e){if(mounted.current)setSaveError(extractErrorMessage(e));}
    finally{locked.current=false;if(mounted.current)setSaving(false);}
  };
  const rows=data?.staff.filter(staff=>staff.name.toLowerCase().includes(search.trim().toLowerCase()))||[];
  const editable=editing&&data?.days.filter(day=>!day.future&&(editing.staff.active||editing.staff.cells[String(day.day)]));
  return <section className="space-y-3 text-zinc-900 dark:text-zinc-100" data-testid="staff-attendance">
    <header><h1 className="flex items-center gap-2 text-lg font-bold"><CalendarCheck size={19} className="text-amber-500"/>Staff Attendance</h1><p className="mt-1 text-xs text-zinc-500">{currentOutlet?.name} - Nepali calendar (B.S.)</p></header>
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1" aria-label="Attendance filters">
      <button className={control} aria-label="Previous Nepali month" disabled={!data||loading||(data.year===data.min_year&&data.month===1)} onClick={()=>shift(-1)}><ChevronLeft size={14}/></button>
      <select aria-label="Nepali month" className={`${control} shrink-0`} value={data?.month||''} disabled={!data||loading} onChange={e=>data&&changeMonth(data.year,Number(e.target.value))}>{!data&&<option value="">Month</option>}{data?.months.map((name,i)=><option key={name} value={i+1}>{name}</option>)}</select>
      <select aria-label="Nepali year" className={`${control} shrink-0`} value={data?.year||''} disabled={!data||loading} onChange={e=>data&&changeMonth(Number(e.target.value),data.month)}>{!data&&<option value="">Year</option>}{data&&Array.from({length:data.max_year-data.min_year+1},(_,i)=>data.min_year+i).map(year=><option key={year}>{year}</option>)}</select>
      <button className={control} aria-label="Next Nepali month" disabled={!data||loading||(data.year===data.max_year&&data.month===12)} onClick={()=>shift(1)}><ChevronRight size={14}/></button>
      <button className={`${control} whitespace-nowrap shrink-0`} disabled={loading} onClick={()=>{setPeriod(null);setNotice('');if(!period)void refresh();}}>Current month</button>
      <input className={`${control} min-w-36 w-48 shrink-0`} aria-label="Search attendance staff" placeholder="Search staff..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <button className={control} aria-label="Refresh attendance" disabled={loading||saving} onClick={()=>void refresh()}><RefreshCw size={14}/></button>
    </div>
    {error&&<p role="alert" className="text-xs text-rose-500">{error}</p>}
    {notice&&<p role="status" className="text-xs text-emerald-600">{notice}</p>}
    {!data?<p role="status" className="py-8 text-center text-sm text-zinc-500">{loading?'Loading attendance...':'Unable to load attendance. Select an outlet or refresh to retry.'}</p>:<>
      <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="font-semibold">{data.month_name} {data.year} B.S. - {data.total_days} days</span><span className="text-zinc-500">Today: {data.today.year}/{String(data.today.month).padStart(2,'0')}/{String(data.today.day).padStart(2,'0')} B.S.</span></div>
      <div className="max-h-[65vh] overflow-auto rounded border border-zinc-200 dark:border-zinc-800" tabIndex={0} role="region" aria-label="Scrollable attendance table">
        <table className="border-collapse text-center text-[11px] whitespace-nowrap w-max min-w-full" aria-label="Monthly staff attendance">
          <thead className="sticky top-0 z-20 bg-zinc-100 dark:bg-zinc-900"><tr>
            <th scope="col" className="sticky left-0 z-30 bg-zinc-100 dark:bg-zinc-900 text-left px-2 py-2 min-w-32 max-w-40">Staff</th>
            {data.days.map(day=><th key={day.day} scope="col" className={`px-0.5 py-1 min-w-8 ${day.today?'bg-amber-500/25':''}`} title={`${data.year}/${data.month}/${day.day} B.S. (${day.date})`}><span className="block">{day.day}</span><span className="block text-[9px] font-normal text-zinc-500">{day.weekday.slice(0,2)}</span></th>)}
            {['Days','Present','Absent','Half','Unmarked'].map(label=><th key={label} scope="col" className="px-2 border-l border-zinc-200 dark:border-zinc-800">{label}</th>)}
          </tr></thead>
          <tbody>{rows.map(staff=><tr key={staff.id} className="border-t border-zinc-200 dark:border-zinc-800">
            <th scope="row" className="sticky left-0 z-10 bg-white dark:bg-zinc-950 text-left px-2 py-1 max-w-40"><button className="block w-full text-left truncate hover:text-amber-600" aria-label={`Mark attendance for ${staff.name}`} disabled={loading||!data.days.some(day=>!day.future&&(staff.active||staff.cells[String(day.day)]))} onClick={()=>open(staff)} title={staff.name}>{staff.name}</button>{!staff.active&&<span className="block text-[9px] text-zinc-500">Inactive / previous staff</span>}</th>
            {data.days.map(day=>{const cell=staff.cells[String(day.day)],value=statuses[cell?.status||'UNMARKED'];return <td key={day.day} className={`p-0.5 ${day.today?'bg-amber-500/10':''}`}><button className={`w-7 h-7 rounded text-[10px] font-semibold ${value.color} disabled:opacity-30 hover:ring-1 hover:ring-amber-500`} disabled={loading||day.future||(!staff.active&&!cell)} aria-label={`${staff.name}, ${data.year}/${data.month}/${day.day} BS: ${value.label}`} title={cell?`${value.label} - ${cell.updated_by}`:day.future?'Future date':value.label} onClick={()=>open(staff,day.day)}>{value.short}</button></td>;})}
            <td className="px-2 border-l border-zinc-200 dark:border-zinc-800">{data.total_days}</td><td className="px-2 font-semibold text-emerald-600">{staff.present}</td><td className="px-2 font-semibold text-rose-500">{staff.absent}</td><td className="px-2">{staff.half_days}</td><td className="px-2 text-zinc-500">{staff.unmarked}</td>
          </tr>)}
          {!rows.length&&<tr><td colSpan={data.total_days+6} className="p-8 text-left text-zinc-500">{search?'No staff match your search.':'No staff assigned to this outlet or attendance recorded for this month.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-zinc-500">P = Present; A = Absent; H1 = First half present; H2 = Second half present; - = Unmarked. Half days count as 0.5 present + 0.5 absent. Unmarked counts only elapsed dates, including today. Future dates are disabled.</p>
      <p className="text-[11px] text-zinc-500">Click a staff name to mark today, or a date cell to edit that day. Scroll sideways for all dates and totals.</p>
    </>}
    <Modal isOpen={!!editing} onClose={()=>{if(!locked.current)setEditing(null);}} title={`Attendance - ${editing?.staff.name||''}`} maxWidth="sm">
      <form className="p-4 space-y-4" onSubmit={save}><fieldset disabled={saving} className="space-y-4">
        <label className="block text-xs space-y-1"><span>Nepali date (B.S.)</span><select className={`${control} w-full`} aria-label="Attendance Nepali date" value={editing?.day||''} onChange={e=>{if(editing){const day=Number(e.target.value);setEditing({...editing,day});setStatus(editing.staff.cells[String(day)]?.status||'PRESENT');setSaveError('');}}}>{editable?.map(day=><option key={day.day} value={day.day}>{data?.year}/{data?.month}/{day.day} - {day.weekday}{day.today?' (Today)':''}</option>)}</select></label>
        <label className="block text-xs space-y-1"><span>Attendance status</span><select className={`${control} w-full`} aria-label="Attendance status" value={status} onChange={e=>setStatus(e.target.value as Status)}>{Object.entries(statuses).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></label>
        {editing?.staff.cells[String(editing.day)]&&<p className="text-xs text-zinc-500">Last recorded by {editing.staff.cells[String(editing.day)].updated_by}. Corrections are retained in attendance history.</p>}
        <div className="flex justify-end gap-2"><button type="button" className={control} onClick={()=>setEditing(null)}>Cancel</button><button className={`${control} bg-amber-500 text-black`}>{saving?'Saving...':'Save attendance'}</button></div>
      </fieldset>{saveError&&<p role="alert" className="text-xs text-rose-500">{saveError}</p>}</form>
    </Modal>
  </section>;
};
