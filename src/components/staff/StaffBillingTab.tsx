import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { PosOrder, Tender, PosSession, npr, posError, posPath, printPosReceipt, usePosSession, usePosCommand, usePosOrders } from '../../lib/posApi';
import { field, button, primary, PosDialog, TenderFields, OrderItems, OrderTotals } from './PosShared';
export const StaffBillingTab: React.FC<{
    initialSelectedOrder?: PosOrder | null;
}> = ({ initialSelectedOrder }) => {
    const session = usePosSession();
    return <Billing key={session.outlet} session={session} initialSelectedOrder={initialSelectedOrder}/>;
};
function Billing({ session, initialSelectedOrder }: {
    key?: string;
    session: PosSession;
    initialSelectedOrder?: PosOrder | null;
}) {
    const [search, setSearch] = useState(''), [page, setPage] = useState(1), [settlement, setSettlement] = useState('ALL');
    const orders = usePosOrders(session, { search, page, page_size: 25, settlement });
    const command = usePosCommand(session);
    const [selectedId, setSelectedId] = useState<number | null>(initialSelectedOrder?.id ?? null), [selected, setSelected] = useState<PosOrder | null>(null), [loadError, setLoadError] = useState('');
    const [rows, setRows] = useState<Tender[]>([]), [name, setName] = useState(''), [phone, setPhone] = useState(''), [discount, setDiscount] = useState('0'), [reason, setReason] = useState('');
    const [quote, setQuote] = useState<any>(null), [quoteError, setQuoteError] = useState(''), [receiptError, setReceiptError] = useState(''), [cashReceived, setCashReceived] = useState('');
    const [refund, setRefund] = useState(false), [refundAmount, setRefundAmount] = useState(''), [refundMethod, setRefundMethod] = useState('CASH'), [refundReason, setRefundReason] = useState(''), [refundRef, setRefundRef] = useState(''), [notice, setNotice] = useState('');
    useEffect(() => { setPage(1); }, [search, settlement]);
    useEffect(() => { if (initialSelectedOrder)
        setSelectedId(initialSelectedOrder.id); }, [initialSelectedOrder?.id]);
    useEffect(() => { setSelected(null); setRows([]); setReason(''); setCashReceived(''); setNotice(''); }, [selectedId]);
    useEffect(() => {
        if (!selectedId || !session.meta)
            return;
        let alive = true;
        const controller = new AbortController();
        apiClient.get<PosOrder>(posPath(session.outlet, `${selectedId}/`), { signal: controller.signal }).then(o => { if (alive) {
            setSelected(prev => { if (!prev || prev.id !== o.id) {
                setName(o.customer_name);
                setPhone(o.customer_phone);
                setDiscount(o.discount_amount);
            } return o; });
            setLoadError('');
        } }).catch(e => { if (alive)
            setLoadError(posError(e)); });
        return () => { alive = false; controller.abort(); };
    }, [selectedId, session.outlet, !!session.meta, session.revision]);
    useEffect(() => {
        setQuote(null);
        setQuoteError('');
        if (!selected)
            return;
        let alive = true;
        const controller = new AbortController();
        const timer = setTimeout(() => apiClient.post<any>(posPath(session.outlet, `${selected.id}/billing-quote/`), { version: selected.version, discount_amount: discount }, { signal: controller.signal }).then(v => { if (alive)
            setQuote(v); }).catch(e => { if (alive)
            setQuoteError(posError(e)); }), 200);
        return () => { alive = false; clearTimeout(timer); controller.abort(); };
    }, [selected?.id, selected?.version, discount, session.outlet]);
    const submit = async (e: React.FormEvent) => { e.preventDefault(); if (!selected || !quote)
        return; const o = await command.run(`${selected.id}/settle/`, { version: selected.version, tenders: rows, customer_name: name, customer_phone: phone, discount_amount: discount, discount_reason: reason }); if (o) {
        setSelected(o);
        setRows([]);
        setDiscount(o.discount_amount);
        setNotice(`Settlement recorded for ${o.order_number}. Due ${npr(o.due_amount)}.`);
    } };
    const cashApplied = rows.filter(r => r.method === 'CASH').reduce((n, r) => n + Number(r.amount || 0), 0);
    const meta = session.meta;
    return <div className="space-y-5 text-zinc-100"><header><h1 className="text-2xl font-bold">Billing & settlement</h1><p className="text-sm text-zinc-400">{meta?.outlet_name} · {session.connection}</p></header>{[session.error, orders.error, loadError, command.error, receiptError].filter(Boolean).map((e, i) => <p key={i} role="alert" className="rounded-lg bg-red-950 p-3 text-red-200">{e}</p>)}{command.hasPending && <button className={primary} disabled={command.busy} onClick={async () => { const o = await command.recover(); if (o) {
        setSelectedId(o.id);
        setSelected(o);
        setRows([]);
        setNotice("Interrupted action recovered.");
    } }}>Recover interrupted action</button>}{notice && <p role="status" className="rounded bg-emerald-950 p-3 text-emerald-200">{notice}</p>}{!meta ? <p>Loading billing permissions…</p> : !meta.permissions.billing ? <p>Your role cannot collect payments at this outlet.</p> : <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]"><section className="space-y-3 rounded-xl border border-zinc-800 p-4"><label className="block">Find a bill<input className={field} placeholder="Order, customer, phone or item" value={search} onChange={e => setSearch(e.target.value)}/></label><label className="block">Settlement<select className={field} value={settlement} onChange={e => setSettlement(e.target.value)}>{['ALL', 'UNPAID', 'PARTIAL', 'CREDIT', 'PAID'].map(s => <option key={s}>{s}</option>)}</select></label><div className="max-h-[680px] space-y-2 overflow-y-auto">{orders.data?.results.map(o => <button key={o.id} className={`w-full rounded-lg border p-3 text-left ${selectedId === o.id ? 'border-amber-400 bg-amber-950/30' : 'border-zinc-800 bg-zinc-900'}`} onClick={() => setSelectedId(o.id)}><div className="flex justify-between"><strong>{o.order_number}</strong><span>{npr(o.total_payable)}</span></div><p>{o.customer_name} · {o.table_number ? `Table ${o.table_number}` : o.fulfillment_type}</p><p className="text-sm text-zinc-400">{o.status} · {o.settlement} · Due {npr(o.due_amount)}</p></button>)}{!orders.data?.results.length && <p>{orders.loading ? 'Loading bills…' : 'No bills match.'}</p>}</div><div className="flex items-center justify-between"><button className={button} disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button className={button} disabled={!orders.data || page * 25 >= orders.data.count} onClick={() => setPage(page + 1)}>Next</button></div></section><section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">{!selected ? <p>Select an order to review its bill.</p> : <><h2 className="text-xl font-bold">{selected.order_number}</h2><p>{selected.status} · {selected.settlement}</p><OrderItems order={selected}/><OrderTotals order={selected}/>{selected.status !== 'CANCELLED' && Number(selected.due_amount) > 0 && <form className="space-y-4 border-t border-zinc-700 pt-4" onSubmit={submit}><div className="grid grid-cols-2 gap-3"><label>Customer name<input className={field} maxLength={120} value={name} onChange={e => setName(e.target.value)} disabled={Number(selected.credit_amount) > 0}/></label><label>Mobile number<input className={field} type="tel" maxLength={32} value={phone} onChange={e => setPhone(e.target.value)} disabled={Number(selected.credit_amount) > 0}/></label></div>{meta.permissions.discount && selected.receipts.every(r => r.kind !== 'BILL') && <div className="grid grid-cols-2 gap-3"><label>Discount amount<input className={field} type="number" min={0} step=".01" max={selected.subtotal} value={discount} onChange={e => setDiscount(e.target.value)}/></label><label>Discount reason<input className={field} maxLength={255} value={reason} onChange={e => setReason(e.target.value)} required={Number(discount) !== Number(selected.discount_amount)}/></label></div>}<TenderFields rows={rows} onChange={setRows} methods={meta.payment_methods} disabled={command.busy}/>{quoteError && <p role="alert" className="text-red-300">{quoteError}</p>}<p className="font-semibold">Balance after discount: {quote ? npr(quote.due_amount) : 'Calculating…'}</p><div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={!quote} onClick={() => setRows([{ method: meta.payment_methods.find(m => m !== 'CREDIT') || 'CASH', amount: quote.due_amount, reference: '' }])}>Apply full balance</button><button type="button" className={button} disabled={!quote || Number(selected.credit_amount) > 0} onClick={() => setRows([{ method: 'CREDIT', amount: quote.due_amount, reference: '' }])}>Allocate balance to Khata</button></div>{cashApplied > 0 && <label className="block">Cash received (for change calculation)<input className={field} type="number" min={cashApplied} step=".01" value={cashReceived} onChange={e => setCashReceived(e.target.value)}/><span className="text-sm">Change: {npr(Math.max(0, Number(cashReceived || 0) - cashApplied))}</span></label>}<button className={`${primary} w-full`} disabled={command.busy || !rows.length || !quote}>{command.busy ? 'Recording…' : 'Record settlement'}</button></form>}<section className="space-y-2 border-t border-zinc-700 pt-4"><h3 className="font-semibold">Payment ledger</h3>{selected.payments.length ? selected.payments.map(p => <p key={p.id} className="text-sm">{p.status} · {p.method} · {npr(p.amount)} {p.reference && `· ${p.reference}`}</p>) : <p className="text-sm text-zinc-400">No money collected.</p>}</section><section className="space-y-2"><h3 className="font-semibold">Saved receipts</h3>{selected.status !== "CANCELLED" && <button className={button} disabled={command.busy} onClick={async () => { const o = await command.run(`${selected.id}/bill/`, { version: selected.version }); if (o) {
        setSelected(o);
        setNotice("Bill saved. Choose its receipt below to print.");
    } }}>Save current bill for printing</button>}<div className="flex flex-wrap gap-2">{selected.receipts.map(r => <button key={r.id} className={button} onClick={async () => { setReceiptError(''); try {
        await printPosReceipt(session.outlet, r.id);
    }
    catch (e) {
        setReceiptError(posError(e));
    } }}>Print {r.number}</button>)}</div></section>{meta.permissions.refund && Number(selected.paid_amount) > Number(selected.refunded_amount) && <button className={button} onClick={() => { setRefundAmount((Number(selected.paid_amount) - Number(selected.refunded_amount)).toFixed(2)); setRefund(true); }}>Record refund</button>}</>}</section></div>}{refund && selected && <PosDialog title={`Refund ${selected.order_number}`} onClose={() => setRefund(false)}><form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); const o = await command.run(`${selected.id}/refund/`, { version: selected.version, amount: refundAmount, method: refundMethod, reference: refundRef, reason: refundReason }); if (o) {
        setSelected(o);
        setRefund(false);
        setNotice('Refund recorded.');
    } }}><p>Record a refund after returning funds to the customer.</p><label className="block">Amount<input className={field} required type="number" min=".01" step=".01" value={refundAmount} onChange={e => setRefundAmount(e.target.value)}/></label><label className="block">Method<select className={field} value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>{meta?.payment_methods.filter(m => m !== 'CREDIT').map(m => <option key={m}>{m}</option>)}</select></label><label className="block">Reference<input className={field} maxLength={128} value={refundRef} onChange={e => setRefundRef(e.target.value)}/></label><label className="block">Reason<input className={field} required maxLength={255} value={refundReason} onChange={e => setRefundReason(e.target.value)}/></label>{command.error && <p role="alert">{command.error}</p>}<button className={primary} disabled={command.busy}>Record refund</button></form></PosDialog>}</div>;
}
