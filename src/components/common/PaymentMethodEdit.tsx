import React, {useState, useRef} from 'react';
import {Pencil} from 'lucide-react';
import {Modal} from './Modal';
import {apiClient, extractErrorMessage} from '../../lib/api';
import {daybookMethods} from '../../lib/daybookApi';
import {backendOrder} from '../../lib/posApi';
import {Order} from '../../types';

type Payment={id:string;method:string;amount?:string};
export function PaymentMethodEdit({outlet,kind,payments,onSaved,disabled=false}:{outlet:string;kind:'payment'|'purchase'|'daybook';payments:Payment[];onSaved?:()=>void;disabled?:boolean}){
  const [open,setOpen]=useState(false),[selected,setSelected]=useState(''),[method,setMethod]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const locked=useRef(false);
  const payment=payments.find(p=>p.id===selected);
  const methods=kind==='purchase'?['CASH','FONEPAY','BANK_TRANSFER','CHEQUE']:daybookMethods;
  const eligible=payments.filter(p=>p.method!=='CREDIT');
  if(!eligible.length)return null;
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();if(!payment||locked.current)return;locked.current=true;setBusy(true);setError('');
    try{
      const result=await apiClient.post<any>(`/payments/correct-method/?outlet_id=${encodeURIComponent(outlet)}`,{kind,target:payment.id,expected_method:payment.method,method,reason});
      if(result.order)window.dispatchEvent(new CustomEvent('pos:order-changed',{detail:{outlet,order:result.order}}));
      window.dispatchEvent(new CustomEvent('payment:method-changed',{detail:{outlet}}));
      setOpen(false);onSaved?.();
    }catch(e){setError(extractErrorMessage(e));}finally{locked.current=false;setBusy(false);}
  };
  return <span className="inline-flex align-middle ml-1" onClick={e=>e.stopPropagation()}>
    <button type="button" disabled={disabled} className="p-1 text-zinc-400 hover:text-amber-500 disabled:opacity-30" aria-label="Edit payment method" title="Edit payment method" onClick={()=>{setSelected(eligible[0].id);setMethod(eligible[0].method);setReason('');setError('');setOpen(true);}}><Pencil size={12}/></button>
    <Modal isOpen={open} onClose={()=>{if(!locked.current)setOpen(false);}} title="Correct payment method" maxWidth="sm">
      <form onSubmit={save} className="p-4 space-y-4 text-sm text-zinc-900 dark:text-zinc-100">
        <p className="text-xs text-zinc-500">Correct the recorded method. Amounts stay unchanged; linked records and payment totals update together.</p>
        <fieldset disabled={busy} className="space-y-3">
          {eligible.length>1&&<label className="block">Payment<select aria-label="Payment to correct" className="block w-full border rounded p-2 bg-white dark:bg-zinc-900" value={selected} onChange={e=>{setSelected(e.target.value);setMethod(eligible.find(p=>p.id===e.target.value)!.method);}}>{eligible.map(p=><option key={p.id} value={p.id}>{p.method} - NPR {p.amount} ({p.id})</option>)}</select></label>}
          <label className="block">Payment method<select aria-label="Corrected payment method" className="block w-full border rounded p-2 bg-white dark:bg-zinc-900" value={method} onChange={e=>setMethod(e.target.value)}>{methods.map(value=><option key={value}>{value}</option>)}</select></label>
          <label className="block">Reason<input aria-label="Payment correction reason" required maxLength={500} className="block w-full border rounded p-2 bg-white dark:bg-zinc-900" value={reason} onChange={e=>setReason(e.target.value)}/></label>
          <button className="w-full bg-amber-500 text-black rounded p-2 font-semibold disabled:opacity-40" disabled={!reason.trim()||method===payment?.method}>{busy?'Saving...':'Save payment method'}</button>
        </fieldset>{error&&<p role="alert" className="text-rose-500">{error}</p>}
      </form>
    </Modal>
  </span>;
}

export function PosPaymentMethodEdit({order,outlet,disabled=false}:{order:Order;outlet:string;disabled?:boolean}){
  const raw=backendOrder(order);
  const payments=(raw?.payments||[]).filter(p=>['SUCCESS','REFUNDED'].includes(p.status)).map(p=>({id:p.id,method:p.method,amount:p.amount}));
  return <PaymentMethodEdit outlet={outlet} kind="payment" payments={payments} disabled={disabled}/>;
}
