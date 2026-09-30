import React, {useState} from 'react';
import {Order} from '../../types';

export function deliveryStatus(order: Order): string {
  return (order as any)._customerOrder?.status || ({AWAITING_PAYMENT:'PENDING',CONFIRMED:'ACCEPTED',PROCESSING:'PREPARING'} as Record<string,string>)[order.status] || order.status;
}
export function deliveryStatusLabel(order: Order): string {
  const delivery = order.fulfillmentType === 'DELIVERY';
  return ({PENDING:'Payment review',ACCEPTED:'Confirmed',PREPARING:'In kitchen',READY:delivery?'Ready for dispatch':'Ready for pickup',OUT_FOR_DELIVERY:'Dispatched',COMPLETED:delivery?'Delivered':'Completed',CANCELLED:'Cancelled'} as Record<string,string>)[deliveryStatus(order)] || order.status;
}
function deliveryInfo(order: Order) {
  const raw = (order as any)._customerOrder;
  const saved = raw?.delivery_location || order.deliveryLocation;
  const valid = (value: unknown, max: number) => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= max;
  let point = saved && valid(saved.lat,90) && valid(saved.lng,180) ? {lat:Number(saved.lat),lng:Number(saved.lng)} : undefined;
  const address = (order.deliveryAddress || '').replace(/https:\/\/maps\.google\.com\/\?q=([^\s]+)/g, (link, query) => {
    let decoded: string;
    try {decoded=decodeURIComponent(query);} catch {return link;}
    const [lat,lng] = decoded.split(',');
    if (valid(lat,90) && valid(lng,180)) {point ||= {lat:Number(lat),lng:Number(lng)};return '';}
    return link;
  }).trim();
  const destination = point ? `${point.lat},${point.lng}` : address;
  const mapUrl = destination ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}` : '';
  const directionsUrl = destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : '';
  const landmark = saved?.landmark || '';
  const summary = [`Delivery for order ${order.orderNumber}`,`Pickup: ${order.outletName}`,order.customerName && `Recipient: ${order.customerName}`,order.customerPhone && `Phone: ${order.customerPhone}`,address && `Delivery address: ${address}`,landmark && !address.includes(landmark) && `Landmark: ${landmark}`,point && `Coordinates: ${point.lat}, ${point.lng}`,order.notes && `Instructions: ${order.notes}`].filter(Boolean).join('\n');
  return {address,point,mapUrl,directionsUrl,summary,text:[summary,mapUrl].filter(Boolean).join('\n')};
}
export const DeliveryOrderDetails: React.FC<{order:Order}> = ({order}) => {
  const info = deliveryInfo(order);
  const [notice,setNotice] = useState(''), [manual,setManual] = useState(false), [busy,setBusy] = useState(false);
  const copy = async () => {
    try {await navigator.clipboard.writeText(info.text);setNotice('Delivery details copied.');setManual(false);}
    catch {setManual(true);setNotice('Select and copy the delivery details below.');}
  };
  const share = async () => {
    if (!navigator.share) {await copy();return;}
    setBusy(true);setNotice('');
    try {await navigator.share({title:`Delivery ${order.orderNumber}`,text:info.summary,...(info.mapUrl ? {url:info.mapUrl}:{})});}
    catch (error) {if (!(error instanceof DOMException && error.name==='AbortError')) {setNotice('Sharing is unavailable. Copy the delivery details instead.');setManual(true);}}
    finally {setBusy(false);}
  };
  return <section aria-label="Delivery details" className="p-3 bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs">
    <h3 className="font-bold">Delivery destination</h3>
    <p className="whitespace-pre-line break-words text-zinc-300">{info.address || 'No delivery address saved for this order.'}</p>
    {info.point && <p className="text-zinc-400 font-mono">{info.point.lat}, {info.point.lng}</p>}
    <div className="flex flex-wrap gap-2">
      {info.mapUrl && <a href={info.mapUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-zinc-600 hover:border-amber-400">Open in Maps</a>}
      {info.directionsUrl && <a href={info.directionsUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-zinc-600 hover:border-amber-400">Directions</a>}
      <button type="button" disabled={busy} onClick={()=>void share()} className="px-3 py-2 bg-amber-500 text-black font-semibold disabled:opacity-50">Share delivery details</button>
      <button type="button" onClick={()=>void copy()} className="px-3 py-2 border border-zinc-600 hover:border-amber-400">Copy delivery details</button>
    </div>
    {notice && <p role="status" className="text-amber-400">{notice}</p>}
    {manual && <textarea aria-label="Delivery details to copy" readOnly value={info.text} onFocus={event=>event.target.select()} rows={7} className="w-full bg-zinc-900 border border-zinc-700 p-2" />}
  </section>;
}
