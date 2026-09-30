import React,{useState} from 'react';
import {Printer,X,Copy,ExternalLink} from 'lucide-react';
import {Order} from '../../types';
import {CompactOrderReceipt} from '../common/CompactOrderReceipt';
import {useOrderReceipt} from '../../lib/orderReceipt';
import {printReceiptDocument} from '../../lib/receiptPrinting';

export const PrintableTokenReceiptModal:React.FC<{order:Order|null;isOpen:boolean;onClose:()=>void;onOpenTrackerAndReview?:(order:Order)=>void;trackingToken?:string}>=({order,isOpen,onClose,trackingToken=''})=>{
  const {receipt,error,retry}=useOrderReceipt(isOpen?order:null,isOpen?trackingToken:'');
  const [notice,setNotice]=useState('');
  if(!isOpen || !order)return null;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
    <div role="dialog" aria-modal="true" aria-label="Receipt and token slip" className="w-full max-w-sm max-h-[92vh] flex flex-col bg-zinc-900 border border-zinc-700 shadow-2xl">
      <header className="px-3 py-2 flex justify-between items-center text-xs font-bold text-zinc-200 border-b border-zinc-800">
        <span>Receipt & Token Slip</span><button type="button" onClick={onClose} aria-label="Close receipt" className="p-2"><X className="w-4 h-4"/></button>
      </header>
      <div className="overflow-y-auto p-3 min-h-0">
        {receipt?<CompactOrderReceipt receipt={receipt}/>:error?<div role="alert" className="text-xs text-rose-400">{error}<button onClick={retry} className="ml-2 underline">Retry</button></div>:<p role="status" className="text-xs text-zinc-400">Loading saved receipt...</p>}
      </div>
      {notice && <p role="status" className="px-3 text-xs text-amber-400">{notice}</p>}
      <footer className="p-2 flex flex-wrap gap-2 justify-center border-t border-zinc-800 text-xs">
        <button disabled={!receipt} onClick={async()=>{try{await navigator.clipboard.writeText(receipt!.snapshot.order_number);setNotice('Order number copied.');}catch{setNotice('Copy is unavailable in this browser.');}}} className="px-2 py-2 bg-zinc-800 text-zinc-200 flex gap-1 items-center disabled:opacity-40"><Copy className="w-3 h-3"/>Copy token</button>
        <button id="print-receipt-btn" disabled={!receipt} onClick={()=>void printReceiptDocument(receipt!).catch(error=>setNotice(error.message))} className="px-3 py-2 bg-zinc-100 text-black font-bold flex items-center gap-1 disabled:opacity-40"><Printer className="w-3 h-3"/>Print Slip</button>
        {receipt?.tracking_url && <a href={receipt.tracking_url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-amber-500 text-black font-bold flex items-center gap-1">Track order<ExternalLink className="w-3 h-3"/></a>}
      </footer>
    </div>
  </div>;
};
