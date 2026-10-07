import React, { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { apiClient, ApiError, extractErrorMessage } from '../../lib/api';
import { authStorage } from '../../lib/authStorage';
import { printReceiptDocument } from '../../lib/receiptPrinting';
import { formatNPR } from '../../lib/utils';

type Snapshot = { number: string; customer_name: string; customer_phone: string; outlet: string; seller: string; date: string;
  amount: string; method: string; reference: string; notes: string; recorded_by: string; remaining_due: string;
  allocations: { order_number: string; amount: string; receipt_id: number }[] };
type Account = {
  customer: { id: number; name: string; phone: string; email: string; sources: string[]; registered: boolean };
  summary: { orders: number; order_total: string; received: string; refunded: string; due: string; credit: string };
  can_receive: boolean; methods: string[];
  orders: { id: number; order_number: string; source: string; status: string; date: string; total: string; paid: string; due: string; credit: string; refunded: string;
    items: { id: number; name: string; quantity: number; unit_price: string; total: string; voided: boolean }[];
    receipts: { id: number; number: string; kind: string }[] }[];
  payments: { id: number; order_number: string; transaction_id: string; amount: string; method: string; status: string; reference: string; date: string; recorded_by: string }[];
  credits: { id: number; order_number: string; amount: string; reason: string; date: string }[];
  collections: { id: number; snapshot: Snapshot }[];
};
const input = 'w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:border-amber-500';
const button = 'rounded border border-zinc-700 px-3 py-2 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40';
const primary = `${button} bg-amber-500 text-black border-amber-500 hover:bg-amber-400`;
const money = (value: string | number = 0) => formatNPR(Number(value));
const dateText = (value: string) => new Date(value).toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu', dateStyle: 'medium', timeStyle: 'short' });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
type Pending = { key: string; body: Record<string, unknown> };

function printCollection(snapshot: Snapshot) {
  const popup = window.open('', '_blank', 'width=440,height=720');
  if (!popup) throw new Error('Allow popups to print this receipt.');
  popup.document.title = snapshot.number;
  const style = popup.document.createElement('style');
  style.textContent = '@page{size:80mm auto;margin:4mm}body{font:12px Arial;color:#111;background:white;margin:16px}h1{font-size:18px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:6px 0;border-bottom:1px solid #ddd}';
  popup.document.head.append(style);
  popup.document.body.innerHTML = renderToStaticMarkup(<article><h1>{snapshot.seller}</h1><p>{snapshot.outlet}</p><h2>Payment receipt</h2><p>{snapshot.number} · {snapshot.date}</p><p>{snapshot.customer_name}<br />{snapshot.customer_phone}</p><p>Received: <strong>{money(snapshot.amount)}</strong> · {snapshot.method}</p><p>Reference: {snapshot.reference || '—'}</p><table><thead><tr><th>Order</th><th>Received</th></tr></thead><tbody>{snapshot.allocations.map((row, i) => <tr key={i}><td>{row.order_number}</td><td>{money(row.amount)}</td></tr>)}</tbody></table><p>Remaining account balance: {money(snapshot.remaining_due)}</p><p>{snapshot.notes}</p><p>Received by {snapshot.recorded_by}</p></article>);
  popup.focus(); popup.print();
}

export const CustomerAccountPanel: React.FC<{ outlet: string; contactId: number; revision: number; onBack: () => void; onChanged: () => void }> = ({ outlet, contactId, revision, onBack, onChanged }) => {
  const endpoint = (suffix = '') => `/customer/directory/${contactId}/${suffix}?outlet_id=${encodeURIComponent(outlet)}`;
  const [account, setAccount] = useState<Account | null>(null), [loadError, setLoadError] = useState('');
  const [error, setError] = useState(''), [success, setSuccess] = useState(''), [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'orders' | 'payments' | 'credit' | 'receipts'>('orders');
  const [amount, setAmount] = useState(''), [scope, setScope] = useState('CREDIT'), [method, setMethod] = useState('CASH');
  const [date, setDate] = useState(today), [reference, setReference] = useState(''), [notes, setNotes] = useState('');
  const sending = useRef(false), initialized = useRef(false);
  const storageKey = `customer-receive:${authStorage.getUser()?.id}:${outlet}:${contactId}`;
  const [pending, setPending] = useState<Pending | null>(() => { try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { return null; } });
  useEffect(() => {
    const abort = new AbortController(); setLoadError('');
    apiClient.get<Account>(endpoint(), { signal: abort.signal }).then(data => {
      if (abort.signal.aborted) return;
      setAccount(data);
      if (!initialized.current) { initialized.current = true; setScope(Number(data.summary.credit) ? 'CREDIT' : 'ALL'); setMethod(data.methods[0] || 'CASH'); }
    }).catch(e => { if (!abort.signal.aborted) setLoadError(extractErrorMessage(e)); });
    return () => abort.abort();
  }, [outlet, contactId, revision]);
  const receive = async (request: Pending) => {
    if (sending.current) return;
    sending.current = true; setBusy(true); setError(''); setSuccess('');
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(request)); setPending(request);
      const result = await apiClient.post<{ id: number; snapshot: Snapshot }>(endpoint('receive/'), request.body, { headers: { 'Idempotency-Key': request.key } });
      sessionStorage.removeItem(storageKey); setPending(null); setAmount(''); setReference(''); setNotes('');
      setSuccess(`${result.snapshot.number}: received ${money(result.snapshot.amount)}. Orders, credit and daybook updated.`);
      setTab('receipts'); onChanged();
    } catch (e) {
      if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 408) { sessionStorage.removeItem(storageKey); setPending(null); onChanged(); }
      setError(extractErrorMessage(e));
    } finally { sending.current = false; setBusy(false); }
  };
  const printBill = async (receiptId: number) => {
    const popup = window.open('', '_blank', 'width=440,height=720');
    if (!popup) { setError('Allow popups to print this bill.'); return; }
    try { await printReceiptDocument(await apiClient.get(endpoint(`receipts/${receiptId}/`)), popup); }
    catch (e) { popup.close(); setError(extractErrorMessage(e)); }
  };
  const printPayment = (snapshot: Snapshot) => { try { printCollection(snapshot); } catch (e) { setError(extractErrorMessage(e)); } };
  const back = <button className={button} onClick={onBack}>← Back to customers</button>;
  if (!account) return <section className="space-y-3">{back}<p role={loadError ? 'alert' : 'status'}>{loadError || 'Loading customer account…'}</p>{loadError && <button onClick={onChanged}>Retry</button>}</section>;
  const available = Number(scope === 'CREDIT' ? account.summary.credit : account.summary.due);
  return <section className="space-y-4" aria-label="Customer account">
    {back}<header><h1 className="text-xl font-bold">{account.customer.name}</h1><p className="text-sm text-zinc-400">{[account.customer.phone || 'No phone saved', account.customer.email, account.customer.registered ? 'Registered customer' : 'Guest customer'].filter(Boolean).join(' · ')}</p><p className="text-xs text-zinc-500 mt-1">{account.customer.sources.join(' · ')} · {account.summary.orders} orders</p></header>
    {loadError && <p role="alert" className="text-rose-400">{loadError} <button onClick={onChanged}>Retry</button></p>}
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[['Order value', account.summary.order_total], ['Received', account.summary.received], ['Refunded', account.summary.refunded], ['Outstanding', account.summary.due], ['Credit / Khata', account.summary.credit]].map(([label, value]) => <div key={label} className="rounded border border-zinc-800 bg-zinc-900/40 p-3"><p className="text-xs text-zinc-400">{label}</p><p className={`text-lg font-bold mt-1 ${label === 'Outstanding' ? 'text-rose-400' : ''}`}>{money(value)}</p></div>)}</div>
    <p className="text-xs text-zinc-500">Credit is included in outstanding, not an additional charge. Cancelled orders create no amount due. Received amounts are shown before refunds.</p>
    {account.can_receive && <form className="rounded border border-zinc-700 p-4 space-y-3" onSubmit={event => { event.preventDefault(); if (!pending) void receive({ key: crypto.randomUUID(), body: { amount, method, date, scope, reference, notes, expected_due: account.summary.due, expected_credit: account.summary.credit } }); }}>
      <h2 className="font-semibold">Receive customer payment</h2><p className="text-xs text-zinc-400">Record money already received. The selected balance is paid against the oldest outstanding orders first.</p>
      <fieldset disabled={busy || !!pending || !!loadError} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="text-xs">Apply to<select className={`${input} mt-1`} value={scope} onChange={event => setScope(event.target.value)}><option value="CREDIT">Credit / Khata only</option><option value="ALL">All unpaid orders</option></select></label>
        <label className="text-xs">Amount received (NPR)<input type="number" className={`${input} mt-1`} required min="0.01" max={available} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} /><span className="text-zinc-500">Available to receive: {money(available)}</span></label>
        <label className="text-xs">Payment method<select className={`${input} mt-1`} value={method} onChange={event => setMethod(event.target.value)}>{account.methods.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
        <label className="text-xs">Received date<input type="date" className={`${input} mt-1`} required max={today()} value={date} onChange={event => setDate(event.target.value)} /></label>
        <label className="text-xs">Reference<input className={`${input} mt-1`} maxLength={128} value={reference} onChange={event => setReference(event.target.value)} /></label>
        <label className="text-xs">Note<input className={`${input} mt-1`} maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} /></label>
      </fieldset><button className={primary} disabled={busy || !!pending || !!loadError || available <= 0}>{busy ? 'Saving…' : 'Record received payment'}</button>
    </form>}
    {!account.can_receive && <p className="text-xs text-zinc-400">Billing access is required to receive customer payments.</p>}
    {pending && <p role="status" className="p-3 border border-amber-600 text-sm">The payment result is unconfirmed. Retry the saved request without duplicating it. <button className={button} disabled={busy} onClick={() => void receive(pending)}>Retry saved receipt</button></p>}
    {error && <p role="alert" className="text-rose-400 text-sm">{error}</p>}{success && <p role="status" className="text-emerald-400 text-sm">{success}</p>}
    <nav className="flex flex-wrap gap-2">{(['orders', 'payments', 'credit', 'receipts'] as const).map(value => <button className={tab === value ? primary : button} aria-pressed={tab === value} key={value} onClick={() => setTab(value)}>{({ orders: 'Orders & bills', payments: 'Payment history', credit: 'Credit history', receipts: 'Received receipts' })[value]}</button>)}</nav>
    {tab === 'orders' && <div className="space-y-3">{account.orders.map(order => <details key={order.id} className="border border-zinc-800 rounded">
      <summary className="p-3 cursor-pointer text-sm"><strong>{order.order_number}</strong> · {order.source} · {order.status}<span className="block text-zinc-400 text-xs mt-1">{dateText(order.date)} · Total {money(order.total)} · Paid {money(order.paid)} · Due {money(order.due)} · Credit {money(order.credit)}</span></summary>
      <div className="p-3 border-t border-zinc-800 space-y-3"><div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead><tr>{['Item', 'Quantity', 'Price', 'Total'].map(label => <th key={label} className="p-2 text-zinc-400">{label}</th>)}</tr></thead><tbody>{order.items.map(item => <tr key={item.id} className={item.voided ? 'line-through text-zinc-500' : ''}><td className="p-2">{item.name}</td><td className="p-2">{item.quantity}</td><td className="p-2">{money(item.unit_price)}</td><td className="p-2">{money(item.total)}</td></tr>)}</tbody></table></div>
        <div className="flex flex-wrap gap-2">{order.receipts.filter(row => row.kind !== 'TOKEN').map(receipt => <button key={receipt.id} className={button} onClick={() => void printBill(receipt.id)}>Print {receipt.number}</button>)}</div>
      </div></details>)}{!account.orders.length && <p className="p-4 text-zinc-500">No saved orders for this customer.</p>}</div>}
    {tab === 'payments' && <div className="overflow-x-auto border border-zinc-800 rounded"><table className="w-full text-xs text-left"><thead className="bg-zinc-900 text-zinc-400"><tr>{['Date', 'Order / transaction', 'Method', 'Amount', 'Status', 'Received by'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{account.payments.map(row => <tr key={row.id} className="border-t border-zinc-800"><td className="p-3">{dateText(row.date)}</td><td className="p-3">{row.order_number}<div className="text-zinc-500">{row.reference || row.transaction_id}</div></td><td className="p-3">{row.method}</td><td className="p-3">{money(row.amount)}</td><td className="p-3">{row.status}</td><td className="p-3">{row.recorded_by}</td></tr>)}{!account.payments.length && <tr><td colSpan={6} className="p-5 text-zinc-500">No transaction records. Older paid orders may have only a saved paid status.</td></tr>}</tbody></table></div>}
    {tab === 'credit' && <div className="space-y-2"><p className="text-xs text-zinc-400">Positive amounts add credit; negative amounts clear or cancel credit.</p>{account.credits.map(row => <div key={row.id} className="p-3 border border-zinc-800 rounded text-sm flex justify-between gap-3"><div>{row.order_number} · {row.reason}<p className="text-xs text-zinc-500">{dateText(row.date)}</p></div><span className={Number(row.amount) > 0 ? 'text-rose-400' : 'text-emerald-400'}>{money(row.amount)}</span></div>)}{!account.credits.length && <p className="p-4 text-zinc-500">No recorded credit movements.</p>}</div>}
    {tab === 'receipts' && <div className="space-y-3">{account.collections.map(row => <div key={row.id} className="rounded border border-zinc-800 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{row.snapshot.number} · {money(row.snapshot.amount)}</p><p className="text-xs text-zinc-400">{row.snapshot.date} · {row.snapshot.method} · {row.snapshot.reference}</p></div><button className={button} onClick={() => printPayment(row.snapshot)}>Print payment receipt</button></div><p className="text-xs text-zinc-400 mt-2">{row.snapshot.allocations.map(item => `${item.order_number}: ${money(item.amount)}`).join(' · ')}</p></div>)}{!account.collections.length && <p className="p-4 text-zinc-500">No account receipts yet. Earlier payments remain visible in Payment history and Orders & bills.</p>}</div>}
  </section>;
};
