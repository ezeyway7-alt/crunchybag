import React, { useEffect, useRef } from 'react';
import { npr, PosOrder, Tender } from '../../lib/posApi';
export const field = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400';
export const button = 'rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-amber-400';
export const primary = `${button} bg-amber-400 text-black font-bold hover:bg-amber-300`;
export function PosDialog({ title, children, onClose }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => { const d = ref.current; d?.showModal(); return () => d?.close(); }, []);
    return <dialog ref={ref} onCancel={onClose} className="w-[min(94vw,760px)] max-h-[90vh] rounded-2xl border border-zinc-700 bg-zinc-900 p-5 text-white backdrop:bg-black/70"><header className="mb-4 flex items-center justify-between gap-4"><h2 className="text-xl font-bold">{title}</h2><button type="button" className={button} onClick={onClose} aria-label="Close dialog">Close</button></header>{children}</dialog>;
}
export function TenderFields({ rows, onChange, methods, disabled = false }: {
    rows: Tender[];
    onChange: (rows: Tender[]) => void;
    methods: string[];
    disabled?: boolean;
}) {
    return <fieldset disabled={disabled} className="space-y-3"><legend className="mb-2 font-semibold">Tender / settlement</legend>{rows.map((r, i) => <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-700 p-3"><label className="text-sm">Payment method<select className={field} value={r.method} onChange={e => onChange(rows.map((v, j) => j === i ? { ...v, method: e.target.value } : v))}>{methods.map(m => <option key={m} value={m}>{m === 'CREDIT' ? 'Khata credit' : m}</option>)}</select></label><label className="text-sm">Amount applied<input type="number" min="0.01" step="0.01" required className={field} value={r.amount} onChange={e => onChange(rows.map((v, j) => j === i ? { ...v, amount: e.target.value } : v))}/></label><label className="text-sm">Reference<input maxLength={128} className={field} value={r.reference} onChange={e => onChange(rows.map((v, j) => j === i ? { ...v, reference: e.target.value } : v))}/></label><button type="button" className={button} onClick={() => onChange(rows.filter((_, j) => j !== i))}>Remove tender</button></div>)}<button type="button" disabled={rows.length >= 10} className={button} onClick={() => onChange([...rows, { method: methods[0] || 'CASH', amount: '', reference: '' }])}>Add tender / split payment</button><p className="text-xs text-zinc-400">Record funds received at the counter. Digital methods record your verified terminal payment; they do not charge a wallet automatically. Khata remains outstanding debt.</p></fieldset>;
}
export function OrderItems({ order, kitchen = false }: {
    order: PosOrder;
    kitchen?: boolean;
}) {
    return <ul className="space-y-3">{order.items.filter(i => !i.is_voided && (!kitchen || i.requires_kitchen)).map(i => <li key={i.id} className="border-b border-zinc-800 pb-2"><div className="flex justify-between gap-3"><strong>{i.quantity} × {i.product_name}</strong>{!kitchen && <span>{npr(i.line_total)}</span>}</div><p className="text-sm text-zinc-400">{i.variant_name} · Round {i.round_number}{kitchen && ` · ${i.kitchen_status}`}</p>{i.modifiers.map((m, j) => <p key={j} className="text-sm">+ {m.name}</p>)}{i.combo_components.length > 0 && <ul className="ml-4 mt-1 border-l border-amber-500/40 pl-3 text-sm">{i.combo_components.filter(c => !kitchen || c.requires_kitchen).map((c, j) => <li key={j}>{c.quantity * i.quantity} × {c.product_name} {c.variant_name}{c.modifiers.length > 0 && ` (${c.modifiers.map(m => m.name).join(', ')})`}</li>)}</ul>}{i.item_notes && <p className="text-amber-200">Note: {i.item_notes}</p>}</li>)}</ul>;
}
export function OrderTotals({ order }: {
    order: PosOrder;
}) {
    return <dl className="space-y-2 text-sm">{[['Subtotal', order.subtotal], ['Discount', order.discount_amount], ['Service charge', order.service_charge_amount], ['Rounding savings', order.cash_round_down_savings], ['Included VAT', order.vat_included_amount], ['Total', order.total_payable], ['Paid', order.paid_amount], ['Due', order.due_amount], ['Khata', order.credit_amount], ['Refunded', order.refunded_amount]].map(([k, v]) => <div key={k} className="flex justify-between"><dt>{k}</dt><dd className="font-semibold">{npr(v)}</dd></div>)}</dl>;
}
export const nextStatus = (o: PosOrder) => ({ PENDING: 'ACCEPTED', ACCEPTED: 'PREPARING', PREPARING: 'READY', READY: o.fulfillment_type === 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'COMPLETED', OUT_FOR_DELIVERY: 'COMPLETED' }[o.status]);
export const statusLabel: Record<string, string> = { ACCEPTED: 'Accept', PREPARING: 'Start cooking', READY: 'Mark ready', OUT_FOR_DELIVERY: 'Dispatch', COMPLETED: 'Hand over' };
