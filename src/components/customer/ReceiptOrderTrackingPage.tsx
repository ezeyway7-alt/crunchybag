import { extractErrorMessage } from "../../lib/api";
import {OrderRoundsPanel} from '../common/OrderRoundsPanel';
import React,{useEffect,useRef,useState} from 'react';
import {apiClient,ApiError} from '../../lib/api';
import { customerPath, getSavedGuestOrders } from '../../lib/customerApi';
import {useOutletEvents} from '../../lib/useOutletEvents';
import {CrunchyLogo} from '../common/CrunchyLogo';
import {ArrowLeft} from 'lucide-react';

export const ReceiptOrderTrackingPage:React.FC=()=>{
  const params = new URLSearchParams(window.location.search);
  const token=params.get('token') || '';
  const [orderNumber,setOrderNumber]=useState(params.get('order_number') || getSavedGuestOrders()[0] || '');
  const [phone,setPhone]=useState('');
  const [lookupSubmitted,setLookupSubmitted]=useState(false);
  const [order,setOrder]=useState<any>(null),[error,setError]=useState('');
  const [savedOrders]=useState(getSavedGuestOrders);
  const sequence=useRef(0);
  const trackGuestOrder=async(number:string,phoneNumber:string):Promise<boolean>=>{
    const seq=++sequence.current;
    try{
      const row=await apiClient.post<any>(customerPath('guest-orders/track/'),{order_number:number,customer_phone:phoneNumber},{skipAuth:true});
      if(!row.order_number || !row.outlet_id)throw new Error('Order tracking is unavailable.');
      if(seq===sequence.current){setOrder(row);setError('');return true;}
      return false;
    }catch(error:any){if(seq===sequence.current){if(error instanceof ApiError && error.status===404)setOrder(null);setError(extractErrorMessage(error));}return false;}
  };
  const refresh=async()=>{
    if(!token){
      if(lookupSubmitted && orderNumber && phone) await trackGuestOrder(orderNumber,phone);
      return;
    }
    const seq=++sequence.current;
    try{const row=await apiClient.get<any>(`/orders/tracking/?token=${encodeURIComponent(token)}`,{skipAuth:true});
      if(!row.order_number || !row.outlet_id)throw new Error('Order tracking is unavailable.');
      if(seq===sequence.current){setOrder(row);setError('');}
    }catch(error:any){if(seq===sequence.current){if(error instanceof ApiError && error.status===404)setOrder(null);setError(extractErrorMessage(error));}}
  };
  useEffect(()=>{
    setOrder(null);setError('');
    if(token){void refresh();}
    else if(orderNumber){
      let checkoutPhone='';
      try{checkoutPhone=sessionStorage.getItem('customer:guest-order-phone') || '';}catch{}
      if(checkoutPhone){
        setPhone(checkoutPhone);setLookupSubmitted(true);
        void trackGuestOrder(orderNumber,checkoutPhone).then(found=>{
          if(found){try{sessionStorage.removeItem('customer:guest-order-phone');}catch{}}
        });
      }
    }
    return()=>{sequence.current++;};
  },[token]);
  const submitGuestLookup=(event:React.FormEvent)=>{
    event.preventDefault();
    const cleanNumber=orderNumber.trim();
    const cleanPhone=phone.trim();
    setOrderNumber(cleanNumber);setLookupSubmitted(true);setOrder(null);setError('');
    void trackGuestOrder(cleanNumber,cleanPhone);
  };
  const live=useOutletEvents(String(order?.outlet_id || ''),!!order?.outlet_id,()=>void refresh());
  const delivery=order?.fulfillment_type==='DELIVERY';
  const labels:Record<string,string>={PENDING:'Awaiting confirmation',ACCEPTED:'Confirmed',PREPARING:'Preparing',READY:delivery?'Ready for dispatch':'Ready for pickup',OUT_FOR_DELIVERY:'Dispatched',COMPLETED:delivery?'Delivered':'Completed',CANCELLED:'Cancelled'};
  const steps=['PENDING','ACCEPTED','PREPARING','READY',...(delivery?['OUT_FOR_DELIVERY']:[]),'COMPLETED'];
  const current=steps.indexOf(order?.status);
  return <main className="min-h-screen bg-[#09090b] text-zinc-100 px-4 py-6">
    <div className="max-w-md mx-auto space-y-4">
      <header className="flex justify-between items-center"><CrunchyLogo size="sm"/><span className="text-xs text-zinc-400">Order tracking</span></header>
      <a href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
        <ArrowLeft className="h-4 w-4" aria-hidden="true"/>Back to website
      </a>
      {error && <div role="alert" className="p-3 border border-rose-500/30 text-xs text-rose-300">{error}<button type="button" onClick={()=>void refresh()} className="ml-2 underline">Retry</button></div>}
      {!token && <form onSubmit={submitGuestLookup} className="bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div><h1 className="font-bold text-lg">Track a guest order</h1><p className="text-xs text-zinc-400">Enter the order number and the phone used at checkout.</p></div>
        {savedOrders.length>0 && <label className="block space-y-1 text-xs text-zinc-400">Saved guest orders
          <select value={orderNumber} onChange={event=>setOrderNumber(event.target.value)} className="w-full bg-zinc-950 border border-zinc-700 p-2 text-sm text-zinc-100">
            {savedOrders.map(value=><option key={value} value={value}>{value}</option>)}
          </select>
        </label>}
        <label className="block space-y-1 text-xs text-zinc-400">Order number
          <input required maxLength={64} value={orderNumber} onChange={event=>setOrderNumber(event.target.value)} placeholder="W-01" className="w-full bg-zinc-950 border border-zinc-700 p-2 text-sm text-zinc-100"/>
        </label>
        <label className="block space-y-1 text-xs text-zinc-400">Checkout phone number
          <input required type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="98XXXXXXXX" className="w-full bg-zinc-950 border border-zinc-700 p-2 text-sm text-zinc-100"/>
        </label>
        <button type="submit" className="w-full bg-amber-500 px-3 py-2 text-sm font-bold text-black">Find order</button>
      </form>}
      {!order && !error && (token || lookupSubmitted) && <p role="status" className="text-sm text-zinc-400">Loading your order...</p>}
      {order && <section className="bg-zinc-900 border border-zinc-800 p-4 space-y-4">
        <div><p className="text-xs text-zinc-400">{order.outlet_name}</p><h1 className="font-mono font-black text-2xl text-amber-400 break-words">{order.order_number}</h1><p className="text-xs text-zinc-400">{order.fulfillment_type.replace(/_/g,' ')}{order.table_number?` | ${order.table_number}`:''}</p></div>
        <p role="status" aria-live="polite" className="text-lg font-bold">{labels[order.status] || order.status}</p>
        {order.status!=='CANCELLED' && <ol className="space-y-2 text-xs">{steps.map((step,index)=>{
          const event=[...(order.history || [])].reverse().find((row:any)=>row.status===step);
          return <li key={step} aria-current={step===order.status?'step':undefined} className={`flex items-center justify-between gap-2 border-l-2 pl-3 py-1 ${index<=current?'border-amber-500 text-zinc-100':'border-zinc-700 text-zinc-500'}`}><span>{labels[step]}</span>{event && <time className="text-zinc-400">{new Date(event.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time>}</li>;
        })}</ol>}
        <OrderRoundsPanel order={order}/>
        <p className="text-[11px] text-zinc-500">{error?'Last known status':live?'Live updates connected':'Connecting to live updates...'}</p>
      </section>}
    </div>
  </main>;
};
