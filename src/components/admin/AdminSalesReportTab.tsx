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

// Sharp borders with zero border-radius and compact padding
const panel = 'border border-zinc-800 bg-[#121214] p-3';
const input = 'border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 [color-scheme:dark]';

function Bars({rows, currency=false}:{rows:{label:string; value:number; detail?:string}[]; currency?:boolean}) {
  const max=Math.max(1,...rows.map(r=>r.value));
  if(!rows.length)return <p className="py-4 text-center text-xs text-zinc-500">No sales in this period.</p>;
  return <ol className="space-y-2">{rows.map((r,i)=><li key={`${i}-${r.label}`}>
    <div className="mb-1 flex justify-between gap-2 text-xs"><span className="min-w-0 truncate" title={r.label}><span className="mr-1 text-zinc-500">{i+1}.</span>{r.label}</span><span className="shrink-0 font-mono text-amber-300">{currency?money(r.value):r.value.toLocaleString()}</span></div>
    <div className="h-1.5 overflow-hidden bg-zinc-800"><div className="h-full bg-amber-400" style={{width:`${r.value/max*100}%`}}/></div>
    {r.detail&&<p className="mt-0.5 text-[10px] text-zinc-500">{r.detail}</p>}
  </li>)}</ol>;
}

function Timeline({rows}:{rows:Report['timeline']}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!rows || rows.length === 0) {
    return <p className="py-8 text-center text-xs text-zinc-500">No sales in this period.</p>;
  }

  const max = Math.max(1, ...rows.map(r => Number(r.sales)));
  const width = 860;
  const height = 230;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 35;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;
  const groundY = height - padBottom;

  const x = (i: number) => padLeft + (rows.length === 1 ? chartW / 2 : (i / (rows.length - 1)) * chartW);
  const y = (sales: string) => groundY - (Number(sales) / max) * chartH;
  const points = rows.map((r, i) => `${x(i)},${y(r.sales)}`).join(' ');

  const handlePointer = (clientX: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect();
    const scale = width / rect.width;
    const svgX = (clientX - rect.left) * scale;
    if (rows.length <= 1) {
      setHoveredIdx(0);
      return;
    }
    const ratio = Math.max(0, Math.min(1, (svgX - padLeft) / chartW));
    const idx = Math.round(ratio * (rows.length - 1));
    setHoveredIdx(idx);
  };

  const activeIdx = hoveredIdx !== null ? hoveredIdx : rows.length - 1;
  const activeItem = rows[activeIdx] || rows[0];

  return (
    <div className="space-y-1.5">
      {/* Dynamic Hover HUD / Status Bar showing Sales Amount & Order Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-zinc-400">{activeItem?.date}</span>
          <span className="font-mono font-semibold text-amber-300">
            Sales: {activeItem ? money(activeItem.sales) : 'NPR 0'}
          </span>
          <span className="font-mono text-zinc-200">
            Orders: {activeItem?.orders ?? 0}
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          {hoveredIdx !== null ? 'Live Hover' : 'Latest Day'}
        </span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Daily net sales timeline in NPR"
          className="h-48 w-full touch-none select-none"
          onMouseMove={(e) => handlePointer(e.clientX, e.currentTarget)}
          onMouseLeave={() => setHoveredIdx(null)}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointer(e.touches[0].clientX, e.currentTarget);
          }}
          onTouchEnd={() => setHoveredIdx(null)}
        >
          {/* Grid lines and y-axis labels */}
          {[0, 0.5, 1].map((n) => {
            const lineY = groundY - n * chartH;
            return (
              <g key={n}>
                <line x1={padLeft} x2={width - padRight} y1={lineY} y2={lineY} stroke="#27272a" strokeDasharray={n > 0 ? "2 2" : undefined} />
                <text x={padLeft - 8} y={lineY + 3} textAnchor="end" fill="#71717a" fontSize="10" fontFamily="monospace">
                  {Intl.NumberFormat('en', { notation: 'compact' }).format(max * n)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <polygon
            points={`${x(0)},${groundY} ${points} ${x(rows.length - 1)},${groundY}`}
            fill="#fbbf24"
            opacity="0.08"
          />

          {/* Polyline curve */}
          <polyline points={points} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="miter" />

          {/* Circles for data points */}
          {rows.map((r, i) => (
            <circle
              key={r.date}
              cx={x(i)}
              cy={y(r.sales)}
              r={hoveredIdx === i ? 5 : (rows.length > 45 ? 1.5 : 3)}
              fill={hoveredIdx === i ? "#fbbf24" : "#f59e0b"}
              stroke={hoveredIdx === i ? "#18181b" : "none"}
              strokeWidth={hoveredIdx === i ? 2 : 0}
            />
          ))}

          {/* Hover indicator vertical line & active dot highlight with tooltip */}
          {hoveredIdx !== null && (
            <g pointerEvents="none">
              <line
                x1={x(hoveredIdx)}
                x2={x(hoveredIdx)}
                y1={padTop}
                y2={groundY}
                stroke="#fbbf24"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hoveredIdx)}
                cy={y(rows[hoveredIdx].sales)}
                r="6"
                fill="#fbbf24"
                stroke="#18181b"
                strokeWidth="2"
              />
              {/* Floating Tooltip Box */}
              {(() => {
                const cur = rows[hoveredIdx];
                const cx = x(hoveredIdx);
                const cy = y(cur.sales);
                const tipW = 145;
                const tipH = 48;
                let tipX = cx - tipW / 2;
                if (tipX < padLeft) tipX = padLeft;
                if (tipX + tipW > width - padRight) tipX = width - padRight - tipW;
                let tipY = cy - tipH - 10;
                if (tipY < padTop) tipY = cy + 12;

                return (
                  <g transform={`translate(${tipX}, ${tipY})`}>
                    <rect
                      x="0"
                      y="0"
                      width={tipW}
                      height={tipH}
                      fill="#121214"
                      stroke="#fbbf24"
                      strokeWidth="1"
                    />
                    <text x="8" y="14" fill="#a1a1aa" fontSize="9" fontFamily="monospace">
                      {cur.date}
                    </text>
                    <text x="8" y="28" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      {money(cur.sales)}
                    </text>
                    <text x="8" y="42" fill="#e4e4e7" fontSize="10" fontFamily="monospace">
                      {cur.orders} {cur.orders === 1 ? 'order' : 'orders'}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Date Axis Labels */}
          <text x={padLeft} y={height - 10} fill="#71717a" fontSize="10" fontFamily="monospace">
            {rows[0]?.date}
          </text>
          <text x={width - padRight} y={height - 10} textAnchor="end" fill="#71717a" fontSize="10" fontFamily="monospace">
            {rows.at(-1)?.date}
          </text>
        </svg>
      </div>

      <details className="text-[11px] text-zinc-400">
        <summary className="cursor-pointer select-none hover:text-zinc-200">View daily figures</summary>
        <div className="mt-1.5 max-h-40 overflow-auto border border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-900 text-zinc-400">
              <tr>
                <th className="py-1 px-2.5 font-medium">Date</th>
                <th className="py-1 px-2.5 font-medium">Orders</th>
                <th className="py-1 px-2.5 font-medium">Net sales</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-t border-zinc-800 hover:bg-zinc-800/40">
                  <td className="py-1 px-2.5 font-mono">{r.date}</td>
                  <td className="py-1 px-2.5 font-mono">{r.orders}</td>
                  <td className="py-1 px-2.5 font-mono text-amber-300">{money(r.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
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

  return (
    <section className="space-y-3" aria-label="Sales Reports">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-amber-400">
            <BarChart3 size={13}/> Performance
          </div>
          <h1 className="text-xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-xs text-zinc-400">
            {currentOutlet?.name} · Nepal time · <span className={live?'text-emerald-400':'text-zinc-500'}>{live?'Live updates':'Reconnecting live updates'}</span>
          </p>
        </div>
        <span className="border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 font-mono">
          {applied.start} — {applied.end}
        </span>
      </header>

      {/* Date Filter Bar - compact without border-radius */}
      <form className={`${panel} flex flex-wrap items-end gap-2`} onSubmit={e=>{e.preventDefault();apply(dates);}}>
        <label className="space-y-0.5 text-[11px] text-zinc-400">
          From
          <input aria-label="From date" type="date" className={`${input} block`} value={dates.start} onChange={e=>setDates({...dates,start:e.target.value})}/>
        </label>
        <label className="space-y-0.5 text-[11px] text-zinc-400">
          To
          <input aria-label="To date" type="date" className={`${input} block`} value={dates.end} onChange={e=>setDates({...dates,end:e.target.value})}/>
        </label>
        <button className="border border-amber-400 bg-amber-400 px-3 py-1 text-xs font-semibold text-black hover:bg-amber-300">
          Apply dates
        </button>
        <button type="button" className={input} onClick={()=>apply({start:shift(today(),-6),end:today()})}>
          Last 7 days
        </button>
        <button type="button" className={input} onClick={()=>apply({start:shift(today(),-29),end:today()})}>
          Last 30 days
        </button>
        <label className="space-y-0.5 text-[11px] text-zinc-400">
          Month
          <input
            aria-label="Choose month"
            type="month"
            value={applied.start.endsWith("-01") && shift(applied.end,1).endsWith("-01") && applied.start.slice(0,7)===applied.end.slice(0,7) ? applied.start.slice(0,7) : ""}
            className={`${input} block`}
            onChange={e=>{
              if(!e.target.value)return;
              const [year,month]=e.target.value.split('-').map(Number);
              if(year<1||year>9998)return;
              apply({start:`${e.target.value}-01`,end:new Date(Date.UTC(year,month,0)).toISOString().slice(0,10)});
            }}
          />
        </label>
        {validation&&<p role="alert" className="w-full text-xs text-rose-400">{validation}</p>}
      </form>

      {!valid&&<p className="text-xs text-zinc-400">Select an outlet to view its sales reports.</p>}
      {error&&<div role="alert" className={`${panel} text-xs text-rose-400`}>{error}<button className="ml-2 underline" onClick={()=>setRevision(n=>n+1)}>Retry</button></div>}
      {valid&&!data&&!error&&<div role="status" className={`${panel} animate-pulse py-12 text-center text-xs text-zinc-400`}>Loading sales reports…</div>}

      {data && (
        <>
          {/* Top Section: Top Graph takes 65% width, Summary KPI cards take 35% width */}
          <div className="flex flex-col lg:flex-row gap-2.5 items-stretch">
            {/* 65% Top Graph */}
            <div className={`${panel} w-full lg:w-[65%] flex flex-col justify-between`}>
              <div className="mb-1 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">Sales timeline</h2>
                  <p className="text-[11px] text-zinc-500">Daily net sales & order volume · {applied.start} to {applied.end}</p>
                </div>
                <TrendingUp size={16} className="text-amber-400 shrink-0"/>
              </div>
              <Timeline rows={data.timeline}/>
            </div>

            {/* 35% Summary KPI column */}
            <div className="w-full lg:w-[35%] flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2 flex-1">
                {[
                  ['Net sales', money(data.summary.sales)],
                  ['Completed orders', data.summary.orders.toLocaleString()],
                  ['Avg order value', money(data.summary.average_order_value)],
                  ['Avg daily sales', money(data.summary.average_daily_sales)],
                ].map(([label, value]) => (
                  <div key={label} className={`${panel} flex flex-col justify-between p-2.5`}>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400">{label}</p>
                    <p className="mt-1 text-sm sm:text-base font-bold text-amber-300 font-mono">{value}</p>
                  </div>
                ))}
              </div>
              <div className={`${panel} flex items-center justify-between p-2 text-xs text-zinc-400`}>
                <span>Avg orders per day</span>
                <span className="font-mono font-semibold text-zinc-200">{data.summary.average_daily_orders}</span>
              </div>
            </div>
          </div>

          {data.summary.orders===0 && (
            <p className="border border-zinc-800 bg-[#121214] p-3 text-xs text-zinc-400">
              No completed orders in this period. Choose another date range to explore your sales.
            </p>
          )}

          {/* Half-Half Section: Sales by channel & When do you sell the most? */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {/* 50% Left: Sales by Channel */}
            <div className={panel}>
              <h2 className="text-sm font-semibold text-zinc-100">Sales by channel</h2>
              <p className="mb-2.5 text-[11px] text-zinc-500">Compare sales, order counts and average order value</p>
              <Bars
                currency
                rows={[...data.channels]
                  .sort((a,b)=>Number(b.sales)-Number(a.sales))
                  .map(r=>({
                    label: names[r.order_source] || r.order_source,
                    value: Number(r.sales),
                    detail: `${r.orders} orders · ${money(r.average_order_value)} avg order`
                  }))}
              />
            </div>

            {/* 50% Right: When do you sell the most? */}
            <div className={panel}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">When do you sell the most?</h2>
                  <p className="text-[11px] text-zinc-500">Hourly averages across every day in the selected period</p>
                </div>
                <select
                  aria-label="Hourly metric"
                  className={input}
                  value={hourMetric}
                  onChange={e=>setHourMetric(e.target.value as 'sales'|'orders')}
                >
                  <option value="sales">Average sales</option>
                  <option value="orders">Average orders</option>
                </select>
              </div>

              <p className="mt-2 text-xs text-amber-300 font-mono">
                {data.summary.orders>0 && peak
                  ? `Peak: ${String(peak.hour).padStart(2,'0')}:00–${String(peak.hour).padStart(2,'0')}:59 · ${
                      hourMetric==='sales' ? money(peak.average_sales) : `${peak.average_orders} orders`
                    } / day`
                  : 'No peak hour yet'}
              </p>

              <div className="mt-3 overflow-x-auto">
                <div className="flex h-32 min-w-[480px] items-end gap-1" role="img" aria-label={`Hourly average ${hourMetric}`}>
                  {data.hourly.map(r=>{
                    const value=Number(hourMetric==='sales'?r.average_sales:r.average_orders);
                    const max=Math.max(1,...data.hourly.map(h=>Number(hourMetric==='sales'?h.average_sales:h.average_orders)));
                    return (
                      <div
                        key={r.hour}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                        title={`${r.hour}:00 · ${hourMetric==='sales'?money(value):value+' orders'} per day`}
                      >
                        <span className="w-full bg-amber-400/80" style={{height:`${(value/max)*85}%`}}/>
                        <span className="text-[9px] font-mono text-zinc-500">{String(r.hour).padStart(2,'0')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <details className="mt-2 text-[11px] text-zinc-400">
                <summary className="cursor-pointer hover:text-zinc-200 select-none">View hourly averages</summary>
                <div className="grid grid-cols-2 gap-1.5 pt-2 sm:grid-cols-4">
                  {data.hourly.map(r=>(
                    <p key={r.hour} className="font-mono text-[10px]">
                      {String(r.hour).padStart(2,'0')}:00 · {money(r.average_sales)} · {r.average_orders} ord
                    </p>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* Table sales, table order counts and best-selling items */}
          <div className="grid gap-2.5 lg:grid-cols-3">
            <div className={panel}>
              <h2 className="text-sm font-semibold text-zinc-100">Highest-selling tables</h2>
              <p className="mb-2 text-[11px] text-zinc-500">Ranked by net sales · orders without a table excluded</p>
              <div className="max-h-64 overflow-auto">
                <Bars
                  currency
                  rows={data.tables.map(r=>({
                    label:`Table ${r.table__table_number}`,
                    value:Number(r.sales),
                    detail:`${r.orders} orders · ${money(r.average_order_value)} avg`
                  }))}
                />
              </div>
            </div>

            <div className={panel} role="region" aria-label="Orders by table">
              <h2 className="text-sm font-semibold text-zinc-100">Highest order counts by table</h2>
              <p className="mb-2 text-[11px] text-zinc-500">Ranked by completed orders in the selected period</p>
              <div className="max-h-64 overflow-auto">
                <Bars
                  rows={[...data.tables].sort((a,b)=>b.orders-a.orders || a.table_id-b.table_id).map(r=>({
                    label:`Table ${r.table__table_number}`,
                    value:r.orders,
                    detail:`${r.orders} completed orders · ${money(r.sales)} net sales`
                  }))}
                />
              </div>
            </div>

            <div className={panel}>
              <h2 className="text-sm font-semibold text-zinc-100">Top 7 best-selling items</h2>
              <p className="mb-2 text-[11px] text-zinc-500">Ranked by units sold across all channels</p>
              <Bars
                rows={data.top_items.map(r=>({
                  label:r.name,
                  value:r.quantity,
                  detail:`${money(r.item_sales)} item sales`
                }))}
              />
            </div>
          </div>

          {/* Top 5 items in each channel */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Top 5 items in each channel</h2>
            <p className="mb-2 text-[11px] text-zinc-500">Ranked by item sales before order-level discounts and refunds</p>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {data.channels.map(c=>(
                <div key={c.order_source} className={panel}>
                  <h3 className="mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">{names[c.order_source] || c.order_source}</h3>
                  <Bars
                    currency
                    rows={c.top_items.map(r=>({
                      label:r.name,
                      value:Number(r.item_sales),
                      detail:`${r.quantity} units sold`
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-zinc-500">
            Sales include completed orders only, grouped by order creation date in Asia/Kathmandu. Net sales are final order totals minus recorded refunds, including credit sales. Item quantities exclude voided lines; refunds do not reverse quantities. Item sales are before order-level discounts and refunds.
          </p>
        </>
      )}
    </section>
  );
}

