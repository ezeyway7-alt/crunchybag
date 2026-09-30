import React,{useEffect,useState} from 'react';
import {useApp} from '../../context/AppContext';
import {apiClient,extractErrorMessage} from '../../lib/api';
import {useOutletEvents} from '../../lib/useOutletEvents';
import {Input} from '../common/Input';
import {Button} from '../common/Button';

const channelName:Record<string,string>={WEBSITE:'Web',TABLE_QR:'Table QR',KIOSK:'Kiosk'};
const date=(value:string)=>value?new Date(value).toLocaleString('en-GB',{timeZone:'Asia/Kathmandu',dateStyle:'medium',timeStyle:'short'}):'-';
export const AdminAudienceTab:React.FC<{mode:'analytics'|'customers'}>=({mode})=>{
  const {currentOutlet}=useApp();const outlet=String(currentOutlet?.id||'');
  const [days,setDays]=useState('30'),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(1),[revision,setRevision]=useState(0);
  const [state,setState]=useState<{scope:string,data:any,error:string}>({scope:'',data:null,error:''});
  const scope=`${mode}:${outlet}:${days}:${query}:${page}`;
  const valid=/^\d+$/.test(outlet);
  const live=useOutletEvents(outlet,valid,()=>setRevision(n=>n+1),undefined,'analytics');
  useEffect(()=>{const timer=setTimeout(()=>{setQuery(search);setPage(1);},300);return()=>clearTimeout(timer);},[search]);
  useEffect(()=>{setPage(1);},[outlet,mode]);
  useEffect(()=>{
    if(!valid)return;let active=true;const abort=new AbortController();
    const path=mode==='analytics'?`analytics/?outlet_id=${outlet}&days=${days}`:`directory/?outlet_id=${outlet}&page=${page}&search=${encodeURIComponent(query)}`;
    apiClient.get<any>(`/customer/${path}`,{signal:abort.signal}).then(data=>{if(active)setState({scope,data,error:''});}).catch(e=>{if(active)setState({scope,data:null,error:extractErrorMessage(e)});});
    return()=>{active=false;abort.abort();};
  },[scope,revision]);
  const data=state.scope===scope?state.data:null,error=state.scope===scope?state.error:'';
  return <section className="space-y-4" aria-label={mode==='analytics'?'Website Analytics':'Customers'}>
    <header className="flex flex-wrap justify-between items-center gap-3"><div><h1 className="text-lg font-bold">{mode==='analytics'?'Website Analytics':'Customers'}</h1><p className="text-xs text-zinc-500 mt-1">{currentOutlet?.name} - {live?'Connected':'Connecting'}</p></div>
      {mode==='analytics'?<select aria-label="Traffic period" value={days} onChange={e=>setDays(e.target.value)} className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-xs"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>:<Input aria-label="Search customers" placeholder="Search name, mobile or email" value={search} onChange={e=>setSearch(e.target.value)} className="text-xs w-full sm:w-72"/>}
    </header>
    {!valid&&<p className="text-sm text-zinc-400">Select an outlet to view its data.</p>}
    {error&&<div role="alert" className="text-sm text-rose-400">{error}<button onClick={()=>setRevision(n=>n+1)} className="ml-3 underline">Retry</button></div>}
    {valid&&!data&&!error&&<p role="status" className="text-sm text-zinc-500">Loading...</p>}
    {data&&mode==='analytics'&&<>
      <div className="grid grid-cols-3 gap-2">{[['Visitors',data.visitors],['Sessions',data.sessions],['Page views',data.page_views]].map(([label,value])=><div key={label} className="bg-[#121214] border border-zinc-800 p-3"><p className="text-[11px] text-zinc-400">{label}</p><p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">{Number(value).toLocaleString()}</p></div>)}</div>
      <div className="bg-[#121214] border border-zinc-800 p-4"><h2 className="text-sm font-bold mb-4">Daily visitors</h2>
        {data.page_views===0?<div className="h-44 grid place-items-center text-xs text-zinc-500">No visits recorded yet. Traffic appears after customers open the site.</div>:<TrafficChart rows={data.daily}/>}
        <p className="text-[11px] text-zinc-500 mt-3">Visitors are distinct browsers, not identified people. Dates use Nepal time. Tracking starts with this release and respects browser privacy signals.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-[#121214] border border-zinc-800 p-4"><h2 className="text-sm font-bold mb-3">Page views by channel</h2>{data.channels.map((row:any)=><div key={row.channel} className="flex justify-between text-xs py-2 border-b border-zinc-800"><span>{channelName[row.channel]||row.channel}</span><span>{row.page_views}</span></div>)}{!data.channels.length&&<p className="text-xs text-zinc-500">No data yet</p>}</div>
        <div className="bg-[#121214] border border-zinc-800 p-4"><h2 className="text-sm font-bold mb-3">Popular pages</h2>{data.pages.map((row:any)=><div key={row.path} className="flex justify-between text-xs py-2 border-b border-zinc-800"><span>{row.path==='/'?'Home':row.path}</span><span>{row.page_views}</span></div>)}{!data.pages.length&&<p className="text-xs text-zinc-500">No data yet</p>}</div>
      </div>
    </>}
    {data&&mode==='customers'&&<>
      <p className="text-xs text-zinc-400">{data.count} contacts - Web accounts and mobiles supplied with web, table QR or kiosk orders.</p>
      <div className="border border-zinc-800 overflow-x-auto"><table className="w-full text-xs text-left whitespace-nowrap"><thead className="bg-zinc-900 text-zinc-400"><tr>{['Customer','Mobile','Account','Source','Orders','Order value','Last activity'].map(title=><th key={title} className="p-3 font-medium">{title}</th>)}</tr></thead><tbody>
        {data.results.map((row:any)=><tr key={row.id} className="border-t border-zinc-800 hover:bg-zinc-900/50"><td className="p-3"><div className="font-semibold">{row.name}</div>{row.email&&<div className="text-[10px] text-zinc-500 mt-1">{row.email}</div>}</td><td className="p-3"><a className="text-amber-400" href={`tel:${row.phone}`}>{row.phone}</a></td><td className="p-3"><span className={row.registered?'text-emerald-400':'text-zinc-400'}>{row.registered?'Registered':'Guest'}</span>{row.last_login&&<div className="text-[10px] text-zinc-500 mt-1">Login: {date(row.last_login)}</div>}</td><td className="p-3">{row.sources.map((source:string)=><span key={source} className="inline-block bg-zinc-800 px-1.5 py-1 mr-1 text-[10px]">{channelName[source]||source}</span>)}</td><td className="p-3">{row.orders}</td><td className="p-3 font-mono">NPR {Number(row.order_total).toLocaleString('en-NP',{minimumFractionDigits:2})}</td><td className="p-3 text-zinc-400">{date(row.last_seen)}</td></tr>)}
        {!data.results.length&&<tr><td colSpan={7} className="p-8 text-center text-zinc-500">{query?'No customers match your search.':'No customer contacts recorded yet.'}</td></tr>}
      </tbody></table></div>
      <footer className="flex flex-wrap justify-between gap-3 items-center"><p className="text-[11px] text-zinc-500">Order value excludes cancelled orders; it is not a paid balance.</p><div className="flex items-center gap-3 text-xs"><Button size="sm" variant="outline" disabled={page===1} onClick={()=>setPage(n=>n-1)}>Previous</Button><span>Page {page} of {Math.max(1,Math.ceil(data.count/25))}</span><Button size="sm" variant="outline" disabled={page*25>=data.count} onClick={()=>setPage(n=>n+1)}>Next</Button></div></footer>
    </>}
  </section>;
};
const TrafficChart:React.FC<{rows:any[]}>=({rows})=>{
  const max=Math.max(1,...rows.map(row=>row.visitors));
  return <div><svg viewBox="0 0 720 210" role="img" aria-label="Daily website visitors" className="w-full h-52"><line x1="28" x2="715" y1="185" y2="185" stroke="#3f3f46"/><text x="0" y="16" fill="#71717a" fontSize="11">{max}</text><text x="10" y="185" fill="#71717a" fontSize="11">0</text>{rows.map((row,index)=>{const width=680/rows.length,height=row.visitors/max*165;return <rect key={row.date} x={30+index*width} y={185-height} width={Math.max(2,width-3)} height={height} fill="#f59e0b"><title>{row.date}: {row.visitors} visitors, {row.page_views} page views</title></rect>;})}</svg><div className="flex justify-between text-[10px] text-zinc-500"><span>{rows[0]?.date}</span><span>{rows.at(-1)?.date}</span></div></div>;
};
