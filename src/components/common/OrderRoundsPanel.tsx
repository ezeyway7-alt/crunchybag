import React, {useEffect, useState} from 'react';
import {PosOrder, PreparationRound} from '../../lib/posApi';

type Props = {
  order: {status:string; fulfillment_type?:string; rounds?:PreparationRound[]; items?:PosOrder['items']} | null | undefined;
  busy?:boolean;
  onAction?:(round:number, action:'PREPARING'|'READY'|'SERVED'|'CALL')=>Promise<unknown>;
  onRemove?:(itemId:number, quantity:number)=>Promise<unknown>;
};
const labels={WAITING:'Waiting',PREPARING:'Preparing',READY:'Ready',SERVED:'Handed over'};
const time=(value:string)=>new Date(value).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});

export function OrderRoundsPanel({order,busy,onAction,onRemove}:Props) {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(timer);},[]);
  if(!order?.rounds?.length || order.status==='CANCELLED')return null;
  const active=['ACCEPTED','PREPARING','READY'].includes(order.status);
  const button='border border-zinc-700 px-2 py-1 text-[11px] text-amber-400 disabled:opacity-40';
  return <section aria-label="Preparation rounds" className="space-y-2 text-xs">
    <h3 className="font-semibold text-zinc-300">Preparation rounds</h3>
    {order.rounds.map(round=><div key={round.number} className="border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
      <div className="flex flex-wrap justify-between gap-2"><strong>Round {round.number}</strong><span className={round.status==='READY'?'text-emerald-400':'text-zinc-400'}>{labels[round.status]}</span></div>
      <p className="text-[11px] text-zinc-500">Added {time(round.created_at)}{round.preparation_started_at?` · Started ${time(round.preparation_started_at)}`:''}{round.status==='WAITING'||round.status==='PREPARING'?` · ${Math.max(0,Math.floor((now-Date.parse(round.preparation_started_at || round.created_at))/60000))} min`:''}</p>
      {order.items?.filter(item=>!item.is_voided && item.round_number===round.number).map(item=><div key={item.id} className="flex justify-between items-center gap-2"><div><p>{item.quantity} × {item.product_name}{item.variant_name?` (${item.variant_name})`:''}</p>{item.modifiers.map((modifier,index)=><p key={`${item.id}-modifier-${index}`} className="pl-2 text-[11px] text-zinc-400">• {modifier.group || modifier.group_name ? `${modifier.group || modifier.group_name}: ` : ''}{modifier.name || modifier.option_name}</p>)}</div>{item.can_remove && onRemove && <div className="flex gap-1">{item.quantity>1 && <button type="button" disabled={busy} className={button} onClick={()=>void onRemove(item.id,1)}>−1</button>}<button type="button" disabled={busy} className={button} onClick={()=>void onRemove(item.id,item.quantity)}>Remove</button></div>}</div>)}
      {active && onAction && <div className="flex flex-wrap gap-2">
        {round.status==='WAITING' && <button type="button" disabled={busy} className={button} onClick={()=>void onAction(round.number,'PREPARING')}>Start round</button>}
        {round.status==='PREPARING' && <button type="button" disabled={busy} className={button} onClick={()=>void onAction(round.number,'READY')}>Mark round ready</button>}
        {round.status==='READY' && <><button type="button" disabled={busy} className={button} onClick={()=>void onAction(round.number,'CALL')}>Call round</button>{order.fulfillment_type!=='DELIVERY' && <button type="button" disabled={busy} className={button} onClick={()=>void onAction(round.number,'SERVED')}>Hand over round</button>}</>}
      </div>}
    </div>)}
    {order.rounds.length>1 && active && <p className="text-[11px] text-zinc-500">{order.fulfillment_type==='DELIVERY'?'Dispatch when every round is ready.':'Each round can be collected separately. The order completes after the final handover.'}</p>}
  </section>;
}
