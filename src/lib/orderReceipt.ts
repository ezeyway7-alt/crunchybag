import { extractErrorMessage } from "./api";
import {useEffect,useState} from 'react';
import {apiClient} from './api';
import {Order} from '../types';
import type {ReceiptDocument} from '../components/common/CompactOrderReceipt';

export function useOrderReceipt(order:Order|null,trackingToken='',kind?:'TOKEN'|'BILL') {
  const raw=(order as any)?._customerOrder || (order as any)?._posOrder;
  const token=trackingToken || raw?.tracking_token;
  const latest=[...(raw?.receipts || [])].reverse().find((row:any)=>kind?row.kind===kind:['TOKEN','BILL'].includes(row.kind));
  const path=token?`/orders/self-service/receipt/?token=${encodeURIComponent(token)}`
    :(order as any)?._customerOrder?`/orders/customer/${raw.id}/slip/`
    :raw && latest?`/orders/pos/receipts/${latest.id}/?outlet_id=${raw.outlet_id}`:'';
  const scope=`${path}:${latest?.id || ''}`;
  const [attempt,setAttempt]=useState(0);
  const [state,setState]=useState<{scope:string;receipt:ReceiptDocument|null;error:string}>({scope:'',receipt:null,error:''});
  useEffect(()=>{
    if(!path)return;
    let live=true;const abort=new AbortController();
    apiClient.get<ReceiptDocument>(path,{skipAuth:!!token,signal:abort.signal}).then(receipt=>{
      if(!receipt?.snapshot?.order_number)throw new Error('The saved receipt is unavailable.');
      if(live)setState({scope,receipt,error:''});
    }).catch(error=>{if(live)setState({scope,receipt:null,error:extractErrorMessage(error)});});
    return()=>{live=false;abort.abort();};
  },[scope,attempt]);
  return {receipt:state.scope===scope?state.receipt:null,
    error:!path?'A saved receipt is not available for this order.':state.scope===scope?state.error:'',
    retry:()=>{setState({scope:'',receipt:null,error:''});setAttempt(value=>value+1);}};
}
