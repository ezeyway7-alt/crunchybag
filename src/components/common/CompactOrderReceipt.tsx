import React from 'react';

export interface ReceiptDocument {
  number:string;kind:string;created_at:string;snapshot:any;
  tracking_url?:string;tracking_qr?:string;
}
const line:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:8};
const rule:React.CSSProperties={borderTop:'1px dashed #aaa',paddingTop:6,marginTop:6};
export const CompactOrderReceipt:React.FC<{receipt:ReceiptDocument}>=({receipt})=>{
  const s=receipt.snapshot, seller=s.seller || {};
  const amount=(value:any)=>Number(value || 0).toLocaleString('en-NP',{minimumFractionDigits:2,maximumFractionDigits:2});
  const rows=[['Subtotal',s.subtotal],['Discount',s.discount_amount],['Service charge',s.service_charge_amount],['Rounding savings',s.cash_round_down_savings],['VAT included',s.vat_included_amount]];
  return <article aria-label="Order receipt" data-receipt-format="compact-v1" style={{width:'100%',maxWidth:'76mm',boxSizing:'border-box',margin:'0 auto',padding:'3mm',background:'#fafaf8',color:'#111',fontFamily:'ui-monospace,monospace',fontSize:11,lineHeight:1.35,overflowWrap:'anywhere',colorScheme:'light'}}>
    <header style={{textAlign:'center'}}>
      <h2 style={{fontSize:15,fontWeight:800,margin:0}}>{seller.name}</h2>
      {seller.outlet && <div>{seller.outlet}</div>}
      {seller.address && <div style={{fontSize:10}}>{seller.address}</div>}
      {seller.phone && <div style={{fontSize:10}}>Tel: {seller.phone}</div>}
      {seller.pan && <div style={{fontSize:10}}>PAN/VAT: {seller.pan}</div>}
    </header>
    <div style={{...rule,textAlign:'center'}}>
      <div style={{fontSize:9,textTransform:'uppercase'}}>{receipt.kind==='TOKEN'?'Order token':receipt.kind==='REFUND'?'Refund receipt':seller.pan?'Tax invoice':'Bill'}</div>
      <div data-testid="receipt-order-number" style={{fontSize:23,fontWeight:900,lineHeight:1.2,margin:'2px 0'}}>{s.order_number}</div>
      <div style={{fontSize:10}}>{s.fulfillment_type?.replace(/_/g,' ')}{s.table_number?` | ${s.table_number}`:''}</div>
      <div style={{fontSize:9,color:'#444'}}>Ref: {receipt.number}</div>
      <div style={{fontSize:9,color:'#444'}}>{new Date(receipt.created_at).toLocaleString('en-GB',{timeZone:'Asia/Kathmandu',dateStyle:'short',timeStyle:'short'})}</div>
    </div>
    {(s.customer_name || s.customer_phone) && <div style={rule}>{s.customer_name}{s.customer_phone && <div style={{fontSize:10}}>{s.customer_phone}</div>}</div>}
    <div style={rule}>
      {(s.items || []).filter((item:any)=>!item.is_voided).map((item:any,index:number)=><div key={item.id || index} style={{padding:'3px 0',breakInside:'avoid'}}>
        <div style={line}><strong style={{flex:1}}>{item.quantity} x {item.product_name}</strong><span style={{whiteSpace:'nowrap'}}>{amount(item.line_total)}</span></div>
        {item.variant_name && <div style={{fontSize:10,color:'#444'}}>{item.variant_name}</div>}
        {(item.modifiers || []).length>0 && <div style={{fontSize:10,color:'#444'}}>{item.modifiers.map((m:any)=>m.name || m.option_name).join(', ')}</div>}
        {(item.combo_components || []).map((part:any,i:number)=><div key={i} style={{fontSize:10,paddingLeft:8}}>{part.quantity * item.quantity} x {part.product_name}{part.variant_name?` (${part.variant_name})`:''}{part.modifiers?.length?` - ${part.modifiers.map((m:any)=>m.name).join(', ')}`:''}</div>)}
        {item.item_notes && <div style={{fontSize:10}}>Note: {item.item_notes}</div>}
      </div>)}
    </div>
    <div style={rule}>
      {rows.filter(([name,value])=>name==='Subtotal' || Number(value)>0).map(([name,value])=><div key={name} style={{...line,fontSize:10}}><span>{name}</span><span>{amount(value)}</span></div>)}
      <div style={{...line,fontWeight:800,fontSize:13,borderTop:'1px solid #222',paddingTop:4,marginTop:4}}><span>Total ({seller.currency || 'NPR'})</span><span>{amount(s.total_payable)}</span></div>
      <div style={line}><span>Paid</span><span>{amount(s.paid_amount)}</span></div>
      <div style={{...line,fontWeight:700}}><span>Due</span><span>{amount(s.due_amount)}</span></div>
      {Number(s.credit_amount)>0 && <div style={line}><span>Khata balance</span><span>{amount(s.credit_amount)}</span></div>}
      {Number(s.refunded_amount)>0 && <div style={line}><span>Refunded</span><span>{amount(s.refunded_amount)}</span></div>}
      {s.payment_method && <div style={{fontSize:10}}>Method: {s.payment_method.replace(/_/g,' ')}</div>}
      {(s.payments || []).filter((p:any)=>p.status==='SUCCESS').map((p:any,index:number)=><div key={index} style={{...line,fontSize:10}}><span>{p.method}</span><span>{amount(p.amount)}</span></div>)}
      {s.payment_review==='PENDING' && <div style={{fontSize:10}}>Payment verification pending</div>}
    </div>
    {s.notes && <div style={{...rule,fontSize:10}}>Note: {s.notes}</div>}
    {receipt.tracking_qr && receipt.tracking_url && <footer style={{...rule,display:'flex',alignItems:'center',justifyContent:'center',gap:8,breakInside:'avoid'}}>
      <a href={receipt.tracking_url} target="_blank" rel="noopener noreferrer" aria-label="Track this order"><img src={receipt.tracking_qr} alt="Scan to track this order" width={104} height={104} style={{display:'block',width:'28mm',height:'28mm',background:'#fff'}} /></a>
      <div style={{fontSize:10,maxWidth:100}}>Scan to track<br/><strong>{s.order_number}</strong><br/><span>Thank you!</span></div>
    </footer>}
  </article>;
};
