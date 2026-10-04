import {useEffect,useRef,useState} from 'react';
import {apiClient,ApiError} from './api';
import {posOrderToOrder} from './posApi';
import {Order} from '../types';
import {useOutletEvents} from './useOutletEvents';

export async function submitSelfService(body:any) {
  const slot=`self-service:pending:${body.branch_id}:${body.order_source}:${body.qr_token || ''}`;
  let pending:any;
  try{pending=JSON.parse(sessionStorage.getItem(slot) || 'null');}catch{}
  if(!pending){pending={key:crypto.randomUUID(),body};sessionStorage.setItem(slot,JSON.stringify(pending));}
  try {
    const result=await apiClient.post<any>('/orders/self-service/checkout/',pending.body,{skipAuth:true,headers:{'Idempotency-Key':pending.key}});
    sessionStorage.removeItem(slot);return result;
  }catch(error){
    // Validation errors are definitive; transport/5xx failures retain the exact request for safe recovery.
    if(error instanceof ApiError && error.status>=400 && error.status<500)sessionStorage.removeItem(slot);
    throw error;
  }
}
export function useSelfServiceOrder(outlet:string,name:string,token:string) {
  const [order,setOrder]=useState<Order|null>(null);
  const seq=useRef(0);
  const refresh=async()=>{
    if(!token)return;
    const current=++seq.current;
    try{const data=await apiClient.get<any>(`/orders/self-service/order/?token=${encodeURIComponent(token)}`,{skipAuth:true});
      if(current===seq.current && data && (data.id || data.order_number))setOrder(posOrderToOrder(data,name));
    }catch{}
  };
  useEffect(()=>{setOrder(null);void refresh();return()=>{seq.current++;};},[token,outlet]);
  useEffect(()=>{const listener=()=>void refresh();window.addEventListener('self-service:refresh',listener);return()=>window.removeEventListener('self-service:refresh',listener);},[token,outlet]);
  useOutletEvents(outlet,!!token,()=>void refresh());
  return order;
}
export function useSelfServiceQuote(body:any) {
  const [revision,setRevision]=useState(0);
  const refresh=()=>setRevision(v=>v+1);
  const key=body?.items?.length?JSON.stringify(body):'';
  const [state,setState]=useState<{key:string;quote:any;error:string}>({key:'',quote:null,error:''});
  useEffect(()=>{
    if(!key)return;
    const abort=new AbortController();let alive=true;
    const timer=setTimeout(()=>{apiClient.post<any>('/orders/self-service/quote/',JSON.parse(key),{skipAuth:true,signal:abort.signal})
      .then(quote=>{if(alive)setState({key,quote,error:''});}).catch(error=>{if(alive)setState({key,quote:null,error:error.message});});},200);
    return()=>{alive=false;clearTimeout(timer);abort.abort();};
  },[key,revision]);
  return {...(state.key===key?state:{quote:null,error:'',key}),refresh};
}
