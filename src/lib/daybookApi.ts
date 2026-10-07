import { reportApiError } from "./api";
import {useEffect, useRef, useState} from 'react';
import {apiClient, ApiError, DEFAULT_API_BASE, extractErrorMessage} from './api';
import {useAuth} from '../context/AuthContext';

export const daybookMethods=['CASH','CARD','FONEPAY','ESEWA','KHALTI','BANK_TRANSFER','CHEQUE','OTHER'];
export const daybookPath=(outlet:string,path='')=>`/daybook/${path}?outlet_id=${encodeURIComponent(outlet)}`;
export type DaybookEntry={id:number;date:string;direction:'IN'|'OUT';amount:string;payment_method:string;category:string;
  party:string;description:string;reference:string;source:string;recorded_by:string;created_at:string;
  voided_at:string|null;voided_by:string|null;void_reason:string};
export type DaybookLedger={date:string;results:DaybookEntry[];count:number;page:number;page_size:number;can_void:boolean;
  summary:Record<'opening'|'income'|'expense'|'net'|'closing'|'cash_opening'|'cash_in'|'cash_out'|'cash_closing',string>};
export type DaybookPayment={id:number;order_number:string;customer:string;source:string;amount:string;payment_method:string;
  transaction_id:string;created_at:string;imported:boolean;voided:boolean};
export type DaybookPreview={date:string;kind:'SALE'|'REFUND';count:number;truncated:boolean;results:DaybookPayment[]};

export function useDaybookLive(outlet:string, onRefresh:()=>void) {
  const {authUser}=useAuth();
  const callback=useRef(onRefresh);callback.current=onRefresh;
  const [live,setLive]=useState(false);
  useEffect(()=>{
    setLive(false);
    if(!/^\d+$/.test(outlet))return;
    let stopped=false, socket:WebSocket|undefined, retry:ReturnType<typeof setTimeout>|undefined;
    let debounce:ReturnType<typeof setTimeout>|undefined, attempts=0, heard=Date.now(), revision:string|undefined;
    const abort=new AbortController();
    const refresh=()=>{clearTimeout(debounce);debounce=setTimeout(()=>{if(!stopped)callback.current();},150);};
    const schedule=()=>{if(!stopped){clearTimeout(retry);retry=setTimeout(connect,Math.min(30000,1000*2**Math.min(attempts++,5)));}};
    const connect=async()=>{
      if(stopped)return;
      try {
        const ticket=await apiClient.post<{ticket:string;path:string}>(daybookPath(outlet,'socket-ticket/'),{}, {signal:abort.signal});
        if(stopped)return;
        const url=new URL((import.meta as any).env.VITE_POS_WS_ORIGIN||DEFAULT_API_BASE,window.location.origin);
        url.protocol=['https:','wss:'].includes(url.protocol)?'wss:':'ws:';
        url.pathname=ticket.path;url.search=new URLSearchParams({ticket:ticket.ticket}).toString();
        const ws=new WebSocket(url);socket=ws;
        ws.onopen=()=>{if(stopped){ws.close();return;}heard=Date.now();setLive(true);attempts=0;refresh();ws.send(JSON.stringify({type:'ping'}));};
        ws.onmessage=e=>{if(stopped)return;heard=Date.now();try{
          const event=JSON.parse(e.data);
          if(event.event_type==='HEARTBEAT'){
            if(revision!==undefined&&revision!==event.revision)refresh();revision=event.revision;
          }else refresh();
        }catch{ws.close();}};
        ws.onerror=()=>ws.close();
        ws.onclose=e=>{if(stopped)return;setLive(false);if(e.code!==4403)schedule();};
      }catch(e){if(!stopped){reportApiError(e,"Daybook live connection failed");if(!(e instanceof ApiError&&[401,403].includes(e.status)))schedule();}}
    };
    void connect();
    const ping=()=>{if(socket?.readyState===WebSocket.OPEN){if(Date.now()-heard>65000)socket.close();else socket.send(JSON.stringify({type:'ping'}));}};
    const interval=setInterval(ping,25000);
    window.addEventListener('online',ping);document.addEventListener('visibilitychange',ping);
    return()=>{stopped=true;abort.abort();clearTimeout(retry);clearTimeout(debounce);clearInterval(interval);socket?.close();window.removeEventListener('online',ping);document.removeEventListener('visibilitychange',ping);};
  },[outlet,authUser?.id]);
  return live;
}

type Pending={key:string;path:string;body:any};
export function useDaybookCommand(outlet:string) {
  const {authUser}=useAuth();
  const slot=`daybook:pending:${authUser?.id||'guest'}:${outlet}`;
  const scope=useRef(slot);scope.current=slot;
  const locked=useRef(false);
  const [busy,setBusy]=useState(false),[pending,setPending]=useState<Pending|null>(null),[error,setError]=useState('');
  useEffect(()=>{setError('');try{setPending(JSON.parse(sessionStorage.getItem(slot)||'null'));}catch{setPending(null);}},[slot]);
  const send=async(request:Pending)=>{
    if(locked.current)return null;
    locked.current=true;setBusy(true);setError('');
    const activeSlot=slot;
    sessionStorage.setItem(activeSlot,JSON.stringify(request));setPending(request);
    try {
      const result=await apiClient.post<any>(daybookPath(outlet,request.path),request.body,{headers:{'Idempotency-Key':request.key}});
      sessionStorage.removeItem(activeSlot);
      if(scope.current!==activeSlot)return null;
      setPending(null);return result;
    }catch(e){
      if(e instanceof ApiError&&e.status>=400&&e.status<500){sessionStorage.removeItem(activeSlot);if(scope.current===activeSlot)setPending(null);}
      if(scope.current===activeSlot)setError(extractErrorMessage(e));return null;
    }finally{locked.current=false;setBusy(false);}
  };
  return {busy,pending,error, run:(path:string,body:any)=>pending?Promise.resolve(null):send({key:crypto.randomUUID(),path,body}),
    retry:()=>pending?send(pending):Promise.resolve(null)};
}
