import React from 'react';

export interface ReceiptDocument {
  number:string;kind:string;created_at:string;snapshot:any;
  tracking_url?:string;tracking_qr?:string;website_url?:string;website_qr?:string;
  payment_qr?:string|null;
}
export function consolidateReceiptItems(rawItems: any[]): any[] {
  if (!Array.isArray(rawItems)) return [];
  const activeItems = rawItems.filter((item: any) => item && !item.is_voided && !item.isVoided);

  const getModName = (m: any) => {
    if (typeof m === 'string') return m.trim();
    return (m?.name || m?.option_name || '').trim();
  };

  const getComboKey = (comboComponents: any[] = []) => {
    return comboComponents
      .map((c: any) => {
        const name = (c.product_name || c.productName || c.name || '').trim().toLowerCase();
        const variant = (c.variant_name || c.variantName || '').trim().toLowerCase();
        const qty = Number(c.quantity) || 1;
        const mods = (c.modifiers || []).map(getModName).filter(Boolean).sort().join(',');
        return `${name}::${variant}::${qty}::${mods}`;
      })
      .sort()
      .join('|');
  };

  const getItemKey = (item: any) => {
    const prodId = (item.product_id || item.productId || '').toString().trim().toLowerCase();
    const prodName = (item.product_name || item.productName || item.name || '').toString().trim().toLowerCase();
    const productIdentifier = prodId && prodName ? `${prodId}:::${prodName}` : (prodName || prodId);
    const variant = (item.variant_name || item.variantName || '').toString().trim().toLowerCase();
    const unitPrice = item.unit_price ?? item.unitPrice;
    const priceKey = unitPrice != null && unitPrice !== '' ? Number(unitPrice).toFixed(2) : '';
    const rawMods = item.modifiers || item.modifiersSummary || [];
    const modKey = (Array.isArray(rawMods) ? rawMods : []).map(getModName).filter(Boolean).sort().join('|').toLowerCase();
    const comboKey = getComboKey(item.combo_components || item.comboComponents || []);
    const notes = (item.item_notes || item.notes || '').toString().trim().toLowerCase();
    return JSON.stringify([productIdentifier, variant, priceKey, modKey, comboKey, notes]);
  };

  const map = new Map<string, any>();
  const order: string[] = [];

  for (const item of activeItems) {
    const key = getItemKey(item);
    const itemQty = Number(item.quantity) || 1;

    let itemTotal = 0;
    if (item.line_total != null && !isNaN(Number(item.line_total))) {
      itemTotal = Number(item.line_total);
    } else if (item.lineTotal != null && !isNaN(Number(item.lineTotal))) {
      itemTotal = Number(item.lineTotal);
    } else {
      const unit = Number(item.unit_price ?? item.unitPrice ?? 0);
      itemTotal = unit * itemQty;
    }

    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.quantity = (Number(existing.quantity) || 0) + itemQty;
      const currentTotal = Number(existing.line_total) || 0;
      existing.line_total = currentTotal + itemTotal;
      if (existing.lineTotal != null) {
        existing.lineTotal = existing.line_total;
      }
    } else {
      order.push(key);
      map.set(key, {
        ...item,
        product_name: item.product_name || item.productName || item.name || '',
        variant_name: item.variant_name || item.variantName || '',
        item_notes: item.item_notes || item.notes || '',
        modifiers: item.modifiers || item.modifiersSummary || [],
        combo_components: item.combo_components || item.comboComponents || [],
        quantity: itemQty,
        line_total: itemTotal,
        ...(item.lineTotal != null ? { lineTotal: itemTotal } : {}),
      });
    }
  }

  return order.map(k => map.get(k)!);
}

const line:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:6};
const rule:React.CSSProperties={borderTop:'1px dashed #aaa',paddingTop:3,marginTop:3};
export const CompactOrderReceipt:React.FC<{receipt:ReceiptDocument}>=({receipt})=>{
  const s=receipt.snapshot, seller=s.seller || {};
  const logo='/bill_logo.jpg';
  const website=receipt.website_url || seller.website || 'https://crunchybag.com';
  const amount=(value:any)=>Number(value || 0).toLocaleString('en-NP',{minimumFractionDigits:2,maximumFractionDigits:2});
  const rows=[['Subtotal',s.subtotal],['Discount',s.discount_amount],['Service charge',s.service_charge_amount],['Rounding savings',s.cash_round_down_savings]];
  const consolidatedItems = consolidateReceiptItems(s.items || []);
  return <article aria-label="Order receipt" data-receipt-format="compact-v1" style={{width:'100%',maxWidth:'76mm',boxSizing:'border-box',margin:'0 auto',position:'relative',isolation:'isolate',padding:'1.5mm',background:'#fff',color:'#111',fontFamily:'ui-monospace,monospace',fontSize:10.5,lineHeight:1.22,overflowWrap:'anywhere',colorScheme:'light'}}>
    <header style={{textAlign:'center',display:'grid',gridTemplateColumns:receipt.website_qr?'18mm minmax(0,1fr) 18mm':'18mm minmax(0,1fr)',alignItems:'center',gap:4}}>
      <img src={logo} alt="Restaurant logo" width={76} height={76} style={{width:'18mm',height:'18mm',objectFit:'contain'}}/>
      <div style={{flex:1,minWidth:0}}>
      <h2 style={{fontSize:15,fontWeight:800,margin:0,lineHeight:1.2}}>{seller.name}</h2>
      {seller.address && <div style={{fontSize:9.5,lineHeight:1.2}}>{seller.address}</div>}
      {seller.phone && <div style={{fontSize:9.5,lineHeight:1.2}}>Tel: {seller.phone}</div>}
      </div>
        {receipt.website_qr && <a href={website} target="_blank" rel="noopener noreferrer" aria-label="Visit our website" style={{color:'inherit',textDecoration:'none',flexShrink:0}}><img src={receipt.website_qr} alt="Scan to visit our website" style={{display:'block',width:'18mm',height:'18mm',background:'#fff'}}/><span style={{fontSize:8.5}}>Order online</span></a>}
    </header>
    <div style={{...rule,display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:0.5,color:'#333'}}>{receipt.kind==='TOKEN'?'Order token':receipt.kind==='REFUND'?'Refund receipt':'Bill'}</div>
        <div data-testid="receipt-order-number" style={{fontSize:23,fontWeight:900,lineHeight:1.1,margin:'1px 0'}}>{s.order_number}</div>
      </div>
      <div style={{textAlign:'right',fontSize:9,color:'#444',lineHeight:1.2,flexShrink:0}}>
        <div style={{fontSize:10,fontWeight:700,color:'#111'}}>{s.fulfillment_type?.replace(/_/g,' ')}{s.table_number?` | ${s.table_number}`:''}</div>
        <div>Ref: {receipt.number}</div>
        <div>{new Date(receipt.created_at).toLocaleString('en-GB',{timeZone:'Asia/Kathmandu',dateStyle:'short',timeStyle:'short'})}</div>
      </div>
    </div>
    {(s.customer_name || s.customer_phone) && <div style={{...rule,...line,fontSize:9.5}}><span>{s.customer_name}</span>{s.customer_phone && <span>Tel: {s.customer_phone}</span>}</div>}
    <div style={{...rule,display:'grid',gridTemplateColumns:'minmax(0,1fr) 26px 61px',columnGap:4}}>
      <strong>Item</strong><strong style={{textAlign:'center'}}>Qty</strong><strong style={{textAlign:'right'}}>Amount</strong>
      {consolidatedItems.map((item:any,index:number)=><div key={item.id || index} style={{gridColumn:'1 / -1',padding:'1.5px 0',breakInside:'avoid'}}>
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 26px 61px',gap:4,lineHeight:1.2}}><strong>{item.product_name}</strong><span style={{textAlign:'center'}}>{item.quantity}</span><span style={{textAlign:'right'}}>{amount(item.line_total)}</span></div>
        {item.variant_name && <div style={{fontSize:9,color:'#444',lineHeight:1.2}}>{item.variant_name}</div>}
        {(item.modifiers || []).length>0 && <div style={{fontSize:9,color:'#444',lineHeight:1.2}}>{item.modifiers.map((m:any)=>typeof m === 'string' ? m : (m.name || m.option_name)).filter(Boolean).join(', ')}</div>}
        {(item.combo_components || []).map((part:any,i:number)=><div key={i} style={{fontSize:9,paddingLeft:6,lineHeight:1.2}}>{part.quantity * item.quantity} x {part.product_name || part.name}{part.variant_name?` (${part.variant_name})`:''}{part.modifiers?.length?` - ${part.modifiers.map((m:any)=>typeof m === 'string' ? m : (m.name || m.option_name)).filter(Boolean).join(', ')}`:''}</div>)}
        {item.item_notes && <div style={{fontSize:9,lineHeight:1.2}}>Note: {item.item_notes}</div>}
      </div>)}
    </div>
    <div style={rule}>
      {rows.filter(([name,value])=>name==='Subtotal' || Number(value)>0).map(([name,value])=><div key={name} style={{...line,fontSize:9.5,lineHeight:1.25}}><span>{name}</span><span>{amount(value)}</span></div>)}
      <div style={{...line,fontWeight:800,fontSize:12.5,borderTop:'1px solid #222',paddingTop:3,marginTop:3}}><span>Total ({seller.currency || 'NPR'})</span><span>{amount(s.total_payable)}</span></div>
      <div style={{...line,fontSize:9.5,lineHeight:1.25}}><span>Paid</span><span>{amount(s.paid_amount)}</span></div>
      <div style={{...line,fontWeight:700,fontSize:9.5,lineHeight:1.25}}><span>Due</span><span>{amount(s.due_amount)}</span></div>
      {Number(s.credit_amount)>0 && <div style={{...line,fontSize:9.5,lineHeight:1.25}}><span>Khata balance</span><span>{amount(s.credit_amount)}</span></div>}
      {Number(s.refunded_amount)>0 && <div style={{...line,fontSize:9.5,lineHeight:1.25}}><span>Refunded</span><span>{amount(s.refunded_amount)}</span></div>}
      {s.payment_method && <div style={{fontSize:9.5,lineHeight:1.25}}>Method: {s.payment_method.replace(/_/g,' ')}</div>}
      {(s.payments || []).filter((p:any)=>p.status==='SUCCESS').map((p:any,index:number)=><div key={index} style={{...line,fontSize:9.5,lineHeight:1.25}}><span>{p.method}</span><span>{amount(p.amount)}</span></div>)}
      {s.payment_review==='PENDING' && <div style={{fontSize:9.5,lineHeight:1.25}}>Payment verification pending</div>}
    </div>
    {s.notes && <div style={{...rule,fontSize:9.5}}>Note: {s.notes}</div>}
    <footer style={{...rule,textAlign:'center',breakInside:'avoid',display:'grid',gridTemplateColumns:(receipt.payment_qr || receipt.tracking_qr)?'minmax(0,1fr) minmax(0,1fr)':'1fr',alignItems:'center',gap:4}}>
      <div style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
        {receipt.payment_qr ? (
          <a href={receipt.payment_qr} target="_blank" rel="noopener noreferrer" aria-label="Open payment QR" style={{color:'inherit',textDecoration:'none'}}><img src={receipt.payment_qr} alt="Scan to pay" style={{display:'block',width:'24mm',height:'24mm',margin:'0 auto',background:'#fff'}}/><span style={{fontSize:8.5}}>Scan to pay</span></a>
        ) : receipt.tracking_qr && receipt.tracking_url ? (
          <a href={receipt.tracking_url} target="_blank" rel="noopener noreferrer" aria-label="Track this order" style={{color:'inherit',textDecoration:'none'}}><img src={receipt.tracking_qr} alt="Scan to track this order" style={{display:'block',width:'24mm',height:'24mm',margin:'0 auto',background:'#fff'}}/><span style={{fontSize:8.5}}>Track order</span></a>
        ) : null}
      </div>
      <div style={{minWidth:0}}>
        <div style={{fontWeight:700,fontSize:10.5,marginTop:1}}>{website.replace(/^https?:\/\//,'').replace(/\/$/,'')}</div>
        <div style={{fontSize:9,margin:'2px 0',lineHeight:1.2}}>24-hour delivery <br/>within Kathmandu</div>
        <div style={{fontSize:8.5}}>Thank you! Visit again.</div>
      </div>
    </footer>
  </article>;
};
