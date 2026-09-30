import React,{useEffect,useRef,useState} from 'react';
import {apiClient} from '../../lib/api';
import {useOutletEvents} from '../../lib/useOutletEvents';
import {CrunchyLogo} from '../common/CrunchyLogo';

export const ReceiptOrderTrackingPage:React.FC=()=>{
  const token=new URLSearchParams(window.location.search).get('token') || '';
  const [order,setOrder]=useState<any>(null),[error,setError]=useState('');
  const sequence=useRef(0);
  const refresh=async()=>{
    if(!token){setError('This receipt is missing its order tracking link.');return;}
    const seq=++sequence.current;
    try{const row=await apiClient.get<any>(`/orders/tracking/?token=${encodeURIComponent(token)}`,{skipAuth:true});
      if(!row.order_number || !row.outlet_id)throw new Error('Order tracking is unavailable.');
      if(seq===sequence.current){setOrder(row);setError('');}
    }catch(error:any){if(seq===sequence.current)setError(error.message || 'Unable to load this order.');}
  };
  useEffect(()=>{setOrder(null);void refresh();return()=>{sequence.current++;};},[token]);
  const live=useOutletEvents(String(order?.outlet_id || ''),!!order?.outlet_id,()=>void refresh());
  const delivery=order?.fulfillment_type==='DELIVERY';
  const labels:Record<string,string>={PENDING:'Awaiting confirmation',ACCEPTED:'Confirmed',PREPARING:'Preparing',READY:delivery?'Ready for dispatch':'Ready for pickup',OUT_FOR_DELIVERY:'Dispatched',COMPLETED:delivery?'Delivered':'Completed',CANCELLED:'Cancelled'};
  const steps=['PENDING','ACCEPTED','PREPARING','READY',...(delivery?['OUT_FOR_DELIVERY']:[]),'COMPLETED'];
  const current=steps.indexOf(order?.status);
  return <main className="min-h-screen bg-[#09090b] text-zinc-100 px-4 py-6">
    <div className="max-w-md mx-auto space-y-4">
      <header className="flex justify-between items-center"><CrunchyLogo size="sm"/><span className="text-xs text-zinc-400">Order tracking</span></header>
      {error && <div role="alert" className="p-3 border border-rose-500/30 text-xs text-rose-300">{error}<button type="button" onClick={()=>void refresh()} className="ml-2 underline">Retry</button></div>}
      {!order && !error && <p role="status" className="text-sm text-zinc-400">Loading your order...</p>}
      {order && <section className="bg-zinc-900 border border-zinc-800 p-4 space-y-4">
        <div><p className="text-xs text-zinc-400">{order.outlet_name}</p><h1 className="font-mono font-black text-2xl text-amber-400 break-words">{order.order_number}</h1><p className="text-xs text-zinc-400">{order.fulfillment_type.replace(/_/g,' ')}{order.table_number?` | ${order.table_number}`:''}</p></div>
        <p role="status" aria-live="polite" className="text-lg font-bold">{labels[order.status] || order.status}</p>
        {order.status!=='CANCELLED' && <ol className="space-y-2 text-xs">{steps.map((step,index)=>{
          const event=[...(order.history || [])].reverse().find((row:any)=>row.status===step);
          return <li key={step} aria-current={step===order.status?'step':undefined} className={`flex items-center justify-between gap-2 border-l-2 pl-3 py-1 ${index<=current?'border-amber-500 text-zinc-100':'border-zinc-700 text-zinc-500'}`}><span>{labels[step]}</span>{event && <time className="text-zinc-400">{new Date(event.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time>}</li>;
        })}</ol>}
        <p className="text-[11px] text-zinc-500">{error?'Last known status':live?'Live updates connected':'Connecting to live updates...'}</p>
      </section>}
    </div>
  </main>;
};
