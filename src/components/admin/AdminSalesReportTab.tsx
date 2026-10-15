import React, {useEffect, useState} from 'react';
import {BarChart3, TrendingUp} from 'lucide-react';
import {useApp} from '../../context/AppContext';
import {apiClient, extractErrorMessage} from '../../lib/api';
import {useOutletEvents} from '../../lib/useOutletEvents';

type Totals = {orders:number; sales:string; average_order_value:string};
type Item = {product_id:number; name:string; quantity:number; item_sales:string};
type Report = {
  summary:Totals & {average_daily_sales:string; average_daily_orders:number};
  timeline:(Totals & {date:string})[];
  tables:(Totals & {table_id:number; table__table_number:string})[];
  channels:(Totals & {order_source:string; top_items:Item[]})[];
  top_items:Item[];
  hourly:(Totals & {hour:number; average_orders:number; average_sales:string})[];
};
const names:Record<string,string> = {POS:'POS', TABLE_QR:'Table QR', KIOSK:'Kiosk', WEBSITE:'Web'};
const money = (value:string|number) => `NPR ${Number(value).toLocaleString('en-NP', {maximumFractionDigits:2})}`;
const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kathmandu',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const shift = (date:string, days:number) => {const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
const panel = 'rounded-2xl border border-zinc-800 bg-[#121214] p-5';
const input = 'rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 [color-scheme:dark]';

function Bars({rows, currency=false}:{rows:{label:string; value:number; detail?:string}[]; currency?:boolean}) {
  const max=Math.max(1,...rows.map(r=>r.value));
  if(!rows.length)return <p className="py-10 text-center text-sm text-zinc-500">No sales in this period.</p>;
  return <ol className="space-y-4">{rows.map((r,i)=><li key={`${i}-${r.label}`}>
    <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="min-w-0 truncate" title={r.label}><span className="mr-2 text-zinc-500">{i+1}.</span>{r.label}</span><span className="shrink-0 font-mono text-amber-300">{currency?money(r.value):r.value.toLocaleString()}</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-amber-400" style={{width:`${r.value/max*100}%`}}/></div>
    {r.detail&&<p className="mt-1 text-xs text-zinc-500">{r.detail}</p>}
  </li>)}</ol>;
}

function Timeline({rows}:{rows:Report['timeline']}) {
  const max=Math.max(1,...rows.map(r=>Number(r.sales)));
  const x=(i:number)=>55+(rows.length===1?390:i/(rows.length-1)*780);
  const y=(sales:string)=>205-Number(sales)/max*170;
  const points=rows.map((r,i)=>`${x(i)},${y(r.sales)}`).join(' ');
  return <><svg viewBox="0 0 860 245" role="img" aria-label="Daily net sales timeline in NPR" className="h-64 w-full">
    {[0,0.5,1].map(n=><g key={n}><line x1="55" x2="835" y1={205-n*170} y2={205-n*170} stroke="#27272a"/><text x="45" y={209-n*170} textAnchor="end" fill="#a1a1aa" fontSize="10">{Intl.NumberFormat('en',{notation:'compact'}).format(max*n)}</text></g>)}
    <polygon points={`${x(0)},205 ${points} ${x(rows.length-1)},205`} fill="#fbbf24" opacity="0.08"/>
    <polyline points={points} fill="none" stroke="#fbbf24" strokeWidth="2.5"/>
    {rows.map((r,i)=><circle key={r.date} cx={x(i)} cy={y(r.sales)} r={rows.length>60?2:4} fill="#fbbf24"><title>{r.date}: {money(r.sales)} · {r.orders} orders</title></circle>)}
    <text x="55" y="235" fill="#a1a1aa" fontSize="11">{rows[0]?.date}</text><text x="835" y="235" textAnchor="end" fill="#a1a1aa" fontSize="11">{rows.at(-1)?.date}</text>
  </svg><details className="text-xs text-zinc-400"><summary className="cursor-pointer">View daily figures</summary><div className="max-h-64 overflow-auto mt-3"><table className="w-full text-left"><thead><tr><th className="py-2">Date</th><th>Orders</th><th>Net sales</th></tr></thead><tbody>{rows.map(r=><tr key={r.date} className="border-t border-zinc-800"><td className="py-2">{r.date}</td><td>{r.orders}</td><td>{money(r.sales)}</td></tr>)}</tbody></table></div></details></>;
}

export function AdminSalesReportTab() {
  const {currentOutlet}=useApp();
  const outlet=String(currentOutlet?.id||'');
  const [dates,setDates]=useState(()=>({start:shift(today(),-6),end:today()}));
  const [applied,setApplied]=useState(dates);
  const [revision,setRevision]=useState(0);
  const [state,setState]=useState<{scope:string;data:Report|null;error:string}>({scope:'',data:null,error:''});
  const [validation,setValidation]=useState('');
  const [hourMetric,setHourMetric]=useState<'sales'|'orders'>('sales');
  const valid=/^\d+$/.test(outlet), scope=`${outlet}:${applied.start}:${applied.end}`;
  const live=useOutletEvents(outlet,valid,()=>setRevision(n=>n+1));
  useEffect(()=>{
    if(!valid)return;
    const controller=new AbortController();let active=true;
    apiClient.get<Report>(`/orders/pos/reports/sales/?outlet_id=${outlet}&start_date=${applied.start}&end_date=${applied.end}`,{signal:controller.signal})
      .then(data=>{if(active)setState({scope,data,error:''});})
      .catch(error=>{if(active)setState({scope,data:null,error:extractErrorMessage(error)});});
    return()=>{active=false;controller.abort();};
  },[scope,revision]);
  const data=state.scope===scope?state.data:null, error=state.scope===scope?state.error:'';
  function apply(range:typeof dates) {
    if(!range.start||!range.end||range.start>range.end){setValidation('Choose a valid start and end date.');return;}
    if((Date.parse(range.end)-Date.parse(range.start))/86400000>=366){setValidation('Choose a period of at most 366 days.');return;}
    setValidation('');setDates(range);setApplied(range);
  }
  const peak=data?.hourly.reduce((best,row)=>Number(row[hourMetric])>Number(best[hourMetric])?row:best);
  return <section className="space-y-5" aria-label="Sales Reports">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400"><BarChart3 size={15}/> Performance</div><h1 className="text-2xl font-bold">Sales Reports</h1><p className="mt-1 text-sm text-zinc-400">{currentOutlet?.name} · Nepal time · <span className={live?'text-emerald-400':'text-zinc-500'}>{live?'Live updates':'Reconnecting live updates'}</span></p></div><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">{applied.start} — {applied.end}</span></header>
    <form className={`${panel} flex flex-wrap items-end gap-3`} onSubmit={e=>{e.preventDefault();apply(dates);}}>
      <label className="space-y-1 text-xs text-zinc-400">From<input aria-label="From date" type="date" className={`${input} block`} value={dates.start} onChange={e=>setDates({...dates,start:e.target.value})}/></label>
      <label className="space-y-1 text-xs text-zinc-400">To<input aria-label="To date" type="date" className={`${input} block`} value={dates.end} onChange={e=>setDates({...dates,end:e.target.value})}/></label>
      <button className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black">Apply dates</button>
      <button type="button" className={input} onClick={()=>apply({start:shift(today(),-6),end:today()})}>Last 7 days</button>
      <button type="button" className={input} onClick={()=>apply({start:shift(today(),-29),end:today()})}>Last 30 days</button>
      <label className="space-y-1 text-xs text-zinc-400">Choose month<input aria-label="Choose month" type="month" value={applied.start.endsWith("-01") && shift(applied.end,1).endsWith("-01") && applied.start.slice(0,7)===applied.end.slice(0,7) ? applied.start.slice(0,7) : ""} className={`${input} block`} onChange={e=>{if(!e.target.value)return;const [year,month]=e.target.value.split('-').map(Number);if(year<1||year>9998)return;apply({start:`${e.target.value}-01`,end:new Date(Date.UTC(year,month,0)).toISOString().slice(0,10)});}}/></label>
      {validation&&<p role="alert" className="w-full text-sm text-rose-400">{validation}</p>}
    </form>
    {!valid&&<p>Select an outlet to view its sales reports.</p>}
    {error&&<div role="alert" className={`${panel} text-rose-400`}>{error}<button className="ml-3 underline" onClick={()=>setRevision(n=>n+1)}>Retry</button></div>}
    {valid&&!data&&!error&&<div role="status" className={`${panel} animate-pulse py-16 text-center text-zinc-400`}>Loading sales reports…</div>}
    {data&&<>
      <div className={panel}><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Sales timeline</h2><p className="mt-1 text-xs text-zinc-500">Daily net sales · {applied.start} to {applied.end}</p></div><TrendingUp className="text-amber-400"/></div><Timeline rows={data.timeline}/></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[['Net sales',money(data.summary.sales)],['Completed orders',data.summary.orders.toLocaleString()],['Average order value',money(data.summary.average_order_value)],['Average daily sales',money(data.summary.average_daily_sales)]].map(([label,value])=><div key={label} className={panel}><p className="text-xs text-zinc-400">{label}</p><p className="mt-2 text-xl font-semibold text-amber-300">{value}</p></div>)}</div>
      {data.summary.orders===0&&<p className="rounded-xl border border-zinc-800 p-5 text-sm text-zinc-400">No completed orders in this period. Choose another date range to explore your sales.</p>}
      <div className="grid gap-5 lg:grid-cols-2"><div className={panel}><h2 className="mb-1 font-semibold">Highest-selling tables</h2><p className="mb-5 text-xs text-zinc-500">Ranked by net sales · orders without a table excluded</p><div className="max-h-96 overflow-auto"><Bars currency rows={data.tables.map(r=>({label:`Table ${r.table__table_number}`,value:Number(r.sales),detail:`${r.orders} orders · ${money(r.average_order_value)} average`} ))}/></div></div>
      <div className={panel}><h2 className="mb-1 font-semibold">Top 7 best-selling items</h2><p className="mb-5 text-xs text-zinc-500">Ranked by units sold across all channels</p><Bars rows={data.top_items.map(r=>({label:r.name,value:r.quantity,detail:`${money(r.item_sales)} item sales`}))}/></div></div>
      <div className={panel}><h2 className="mb-1 font-semibold">Sales by channel</h2><p className="mb-5 text-xs text-zinc-500">Compare sales, order counts and average order value</p><Bars currency rows={[...data.channels].sort((a,b)=>Number(b.sales)-Number(a.sales)).map(r=>({label:names[r.order_source],value:Number(r.sales),detail:`${r.orders} orders · ${money(r.average_order_value)} average order`}))}/></div>
      <div><h2 className="mb-1 text-lg font-semibold">Top 5 items in each channel</h2><p className="mb-4 text-xs text-zinc-500">Ranked by item sales before order-level discounts and refunds</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{data.channels.map(c=><div key={c.order_source} className={panel}><h3 className="mb-5 font-semibold text-amber-400">{names[c.order_source]}</h3><Bars currency rows={c.top_items.map(r=>({label:r.name,value:Number(r.item_sales),detail:`${r.quantity} units sold`}))}/></div>)}</div></div>
      <div className={panel}><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">When do you sell the most?</h2><p className="mt-1 text-xs text-zinc-500">Hourly averages across every day in the selected period, including days without orders.</p></div><select aria-label="Hourly metric" className={input} value={hourMetric} onChange={e=>setHourMetric(e.target.value as 'sales'|'orders')}><option value="sales">Average sales</option><option value="orders">Average orders</option></select></div>
      <p className="mt-4 text-sm text-amber-300">{data.summary.orders>0&&peak?`Peak hour: ${String(peak.hour).padStart(2,'0')}:00–${String(peak.hour).padStart(2,'0')}:59 · ${hourMetric==='sales'?money(peak.average_sales):`${peak.average_orders} orders`} / day`:'No peak hour yet'}</p>
      <div className="mt-5 overflow-x-auto"><div className="flex h-44 min-w-[600px] items-end gap-2" role="img" aria-label={`Hourly average ${hourMetric}`}>{data.hourly.map(r=>{const value=Number(hourMetric==='sales'?r.average_sales:r.average_orders),max=Math.max(1,...data.hourly.map(h=>Number(hourMetric==='sales'?h.average_sales:h.average_orders)));return <div key={r.hour} className="flex h-full flex-1 flex-col justify-end items-center gap-2" title={`${r.hour}:00 · ${hourMetric==='sales'?money(value):value+' orders'} per day`}><span className="w-full rounded-t bg-amber-400/80" style={{height:`${value/max*85}%`}}/><span className="text-[10px] text-zinc-500">{String(r.hour).padStart(2,'0')}</span></div>;})}</div></div>
      <details className="mt-4 text-xs text-zinc-400"><summary className="cursor-pointer">View hourly averages</summary><div className="grid grid-cols-2 gap-2 pt-3 sm:grid-cols-4">{data.hourly.map(r=><p key={r.hour}>{String(r.hour).padStart(2,'0')}:00 · {money(r.average_sales)} · {r.average_orders} orders</p>)}</div></details>
      <p className="mt-4 text-xs text-zinc-500">Average orders per day: {data.summary.average_daily_orders}</p></div>
      <p className="text-xs leading-relaxed text-zinc-500">Sales include completed orders only, grouped by order creation date in Asia/Kathmandu. Net sales are final order totals minus recorded refunds, including credit sales. Item quantities exclude voided lines; refunds do not reverse quantities. Item sales are before order-level discounts and refunds.</p>
    </>}
  </section>;
}
