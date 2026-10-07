import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { apiClient, ApiError, extractErrorMessage } from '../../../lib/api';
import { authStorage } from '../../../lib/authStorage';
import { useOutletEvents } from '../../../lib/useOutletEvents';
import { formatNPR } from '../../../lib/utils';

type Money = string | number;
type Supplier = { id: string; name: string; phone: string; pan_number: string; email: string; address: string;
  is_active: boolean; credit_balance: Money; opening_balance: Money; purchase_total?: Money; paid_total?: Money; invoice_count?: number };
type Payment = { id: number; amount: Money; date: string; method: string; reference: string; notes: string; recorded_by: string; voided_at: string | null; void_reason: string };
type Invoice = { id: string; invoice_number: string; purchase_date: string; total_amount: Money; paid_amount: Money; due_amount: Money;
  discount_amount: Money; payment_status: string; document?: string; notes: string;
  items: { id: string; item_name: string; quantity: Money; unit: string; unit_cost: Money; discount: Money; total_cost: Money }[] };
type Account = { supplier: Supplier; summary: { purchase_total: Money; paid_total: Money; balance: Money; amount_due: Money; advance: Money; opening_balance: Money };
  invoices: Invoice[]; payments: Payment[];
  statement: { id: string; date: string; type: string; reference: string; description: string; charge: Money; payment: Money; method: string; balance: Money }[];
  items: { id: number; name: string; sku: string; unit: string; cost_per_unit: Money }[] };
const input = 'w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500';
const button = 'rounded border border-zinc-700 px-3 py-2 text-xs font-semibold hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed';
const primary = `${button} bg-amber-500 text-black border-amber-500 hover:bg-amber-400`;
const money = (value: Money = 0) => formatNPR(Number(value));
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
const path = (outlet: string, suffix = '') => `/inventory/supplier-accounts/${suffix}?outlet_id=${encodeURIComponent(outlet)}`;
const Balance = ({ value }: { value: Money }) => <span className={Number(value) > 0 ? 'text-rose-400' : Number(value) < 0 ? 'text-emerald-400' : 'text-zinc-400'}>
  {money(Math.abs(Number(value)))} {Number(value) > 0 ? 'due' : Number(value) < 0 ? 'advance / overpaid' : 'settled'}
</span>;

export function SupplierAccountsWorkbench() {
  const { currentOutlet } = useApp();
  const outlet = String(currentOutlet?.id || '');
  return /^\d+$/.test(outlet) ? <SupplierAccounts key={outlet} outlet={outlet} /> : <p>Select an outlet to view suppliers.</p>;
}

const SupplierAccounts: React.FC<{ outlet: string }> = ({ outlet }) => {
  const [rows, setRows] = useState<Supplier[]>([]), [selected, setSelected] = useState('');
  const [search, setSearch] = useState(''), [creating, setCreating] = useState(false);
  const [revision, setRevision] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  const live = useOutletEvents(outlet, true, refresh, undefined, 'suppliers');
  useEffect(() => {
    const abort = new AbortController();
    setError('');
    apiClient.get<{ results: Supplier[] }>(path(outlet), { signal: abort.signal })
      .then(result => { if (!abort.signal.aborted) setRows(result.results); })
      .catch(e => { if (!abort.signal.aborted) setError(extractErrorMessage(e)); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [outlet, revision]);
  const filtered = rows.filter(row => `${row.name} ${row.phone} ${row.pan_number}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="space-y-4" aria-label="Supplier accounts">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold">Suppliers</h2><p className="text-xs text-zinc-500">Accounts, purchase prices and payments · {live ? 'Live' : 'Connecting'}</p></div>
      <button className={button} onClick={() => setCreating(!creating)}>{creating ? 'Close supplier form' : 'Add supplier'}</button>
    </header>
    {creating && <SupplierForm outlet={outlet} onCancel={() => setCreating(false)} onSaved={supplier => { setCreating(false); setSelected(supplier.id); refresh(); }} />}
    {error && <p role="alert" className="text-sm text-rose-400">{error} <button className="underline" onClick={refresh}>Retry</button></p>}
    {selected ? <SupplierDetail key={selected} outlet={outlet} supplierId={selected} revision={revision} refresh={refresh} onBack={() => setSelected('')} /> : <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Metric label="Suppliers" value={String(rows.length)} />
        <Metric label="Remaining to pay" value={money(rows.reduce((sum, row) => sum + Math.max(0, Number(row.credit_balance)), 0))} />
        <Metric label="Advance / overpaid" value={money(rows.reduce((sum, row) => sum + Math.max(0, -Number(row.credit_balance)), 0))} />
      </div>
      <input className={input} aria-label="Search suppliers" placeholder="Search supplier, phone or PAN" value={search} onChange={event => setSearch(event.target.value)} />
      {loading ? <p role="status">Loading suppliers…</p> : <div className="overflow-x-auto border border-zinc-800 rounded">
        <table className="w-full text-left text-xs"><thead className="bg-zinc-900 text-zinc-400"><tr>{['Supplier', 'Phone / PAN', 'Purchases', 'Paid', 'Account balance', ''].map((title, i) => <th key={i} className="p-3">{title}</th>)}</tr></thead>
          <tbody>{filtered.map(row => <tr key={row.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
            <td className="p-3"><button className="text-amber-400 font-semibold text-left" onClick={() => setSelected(row.id)}>{row.name}</button>{!row.is_active && <span className="ml-2 text-zinc-500">Inactive</span>}</td>
            <td className="p-3">{row.phone || '—'}<div className="text-zinc-500">{row.pan_number}</div></td>
            <td className="p-3">{money(row.purchase_total)}<div className="text-zinc-500">{row.invoice_count || 0} bills</div></td><td className="p-3">{money(row.paid_total)}</td>
            <td className="p-3"><Balance value={row.credit_balance} /></td><td className="p-3"><button className={button} onClick={() => setSelected(row.id)}>View account</button></td>
          </tr>)}{!filtered.length && <tr><td colSpan={6} className="p-8 text-center text-zinc-500">{search ? 'No suppliers match your search.' : 'No suppliers yet. Add one here or record an inward purchase.'}</td></tr>}</tbody>
        </table></div>}
    </>}
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded border border-zinc-800 bg-zinc-900/40 p-4"><p className="text-xs text-zinc-400">{label}</p><p className="text-lg font-bold mt-1">{value}</p></div>;
}

function SupplierForm({ outlet, supplier, onSaved, onCancel }: { outlet: string; supplier?: Supplier; onSaved: (value: Supplier) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: supplier?.name || '', phone: supplier?.phone || '', pan_number: supplier?.pan_number || '', email: supplier?.email || '', address: supplier?.address || '', credit_balance: '0.00', is_active: supplier?.is_active ?? true });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <form className="rounded border border-zinc-700 p-4 space-y-3" onSubmit={async event => {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      const { credit_balance, ...details } = form;
      const saved = supplier ? await apiClient.patch<Supplier>(path(outlet, `${supplier.id}/`), details) : await apiClient.post<Supplier>(path(outlet), form);
      onSaved(saved);
    } catch (e) { setError(extractErrorMessage(e)); } finally { setBusy(false); }
  }}>
    <h3 className="font-semibold">{supplier ? 'Edit supplier' : 'New supplier'}</h3>
    <div className="grid sm:grid-cols-2 gap-3">{(['name', 'phone', 'pan_number', 'email', 'address'] as const).map(field => <label key={field} className="text-xs text-zinc-400">{field === 'pan_number' ? 'PAN' : field.charAt(0).toUpperCase() + field.slice(1)}
      <input className={`${input} mt-1`} required={field === 'name'} type={field === 'email' ? 'email' : 'text'} maxLength={field === 'name' ? 150 : field === 'phone' || field === 'pan_number' ? 50 : undefined} value={form[field]} onChange={event => setForm({ ...form, [field]: event.target.value })} />
    </label>)}
      {!supplier && <label className="text-xs text-zinc-400">Opening balance (NPR)<input className={`${input} mt-1`} type="number" step="0.01" required value={form.credit_balance} onChange={event => setForm({ ...form, credit_balance: event.target.value })} /><span>Positive = payable; negative = existing advance. Leave zero for a new account.</span></label>}
    </div>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.is_active} onChange={event => setForm({ ...form, is_active: event.target.checked })} />Active supplier</label>
    {error && <p role="alert" className="text-rose-400 text-sm">{error}</p>}
    <button disabled={busy} className={primary}>{busy ? 'Saving…' : 'Save supplier'}</button> <button type="button" className={button} onClick={onCancel}>Cancel</button>
  </form>;
}

type Pending = { key: string; url: string; body: Record<string, unknown> };
const SupplierDetail: React.FC<{ outlet: string; supplierId: string; revision: number; refresh: () => void; onBack: () => void }> = ({ outlet, supplierId, revision, refresh, onBack }) => {
  const [account, setAccount] = useState<Account | null>(null), [loadError, setLoadError] = useState(''), [error, setError] = useState('');
  const [tab, setTab] = useState<'bills' | 'statement' | 'payments'>('bills'), [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(''), [date, setDate] = useState(today), [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState(''), [notes, setNotes] = useState(''), [success, setSuccess] = useState('');
  const [voidId, setVoidId] = useState<number | null>(null), [reason, setReason] = useState('');
  const storageKey = `supplier-payment:${authStorage.getUser()?.id}:${outlet}:${supplierId}`;
  const [pending, setPending] = useState<Pending | null>(() => { try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { return null; } });
  const [busy, setBusy] = useState(false); const sending = useRef(false);
  useEffect(() => {
    const abort = new AbortController(); setLoadError('');
    apiClient.get<Account>(path(outlet, `${supplierId}/`), { signal: abort.signal }).then(data => { if (!abort.signal.aborted) setAccount(data); })
      .catch(e => { if (!abort.signal.aborted) setLoadError(extractErrorMessage(e)); });
    return () => abort.abort();
  }, [outlet, supplierId, revision]);
  const send = async (request: Pending) => {
    if (sending.current) return; sending.current = true; setBusy(true); setError(''); setSuccess('');
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(request)); setPending(request);
      await apiClient.post(request.url, request.body, { headers: { 'Idempotency-Key': request.key } });
      sessionStorage.removeItem(storageKey); setPending(null); setAmount(''); setReference(''); setNotes(''); setVoidId(null); setReason('');
      setSuccess(request.url.includes('/void/') ? 'Payment reversed. Supplier balance and daybook updated.' : 'Payment recorded. Supplier balance and daybook updated.');
      refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 408) { sessionStorage.removeItem(storageKey); setPending(null); refresh(); }
      setError(extractErrorMessage(e));
    } finally { sending.current = false; setBusy(false); }
  };
  if (!account) return <div><button className={button} onClick={onBack}>← All suppliers</button><p role={loadError ? 'alert' : 'status'} className="mt-3">{loadError || 'Loading supplier account…'}</p>{loadError && <button onClick={refresh}>Retry</button>}</div>;
  const s = account.supplier;
  return <div className="space-y-4">
    <div className="flex flex-wrap justify-between gap-2"><button className={button} onClick={onBack}>← All suppliers</button><button className={button} onClick={() => setEditing(!editing)}>Edit supplier</button></div>
    <div><h3 className="text-xl font-bold">{s.name} {!s.is_active && <span className="text-xs text-zinc-500">Inactive</span>}</h3><p className="text-sm text-zinc-400">{[s.phone, s.email, s.pan_number && `PAN ${s.pan_number}`, s.address].filter(Boolean).join(' · ') || 'No contact details saved.'}</p></div>
    {editing && <SupplierForm outlet={outlet} supplier={s} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); refresh(); }} />}
    {loadError && <p role="alert" className="text-rose-400">{loadError} <button onClick={refresh}>Retry</button></p>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Total purchases" value={money(account.summary.purchase_total)} /><Metric label="Total paid" value={money(account.summary.paid_total)} /><Metric label="Remaining to pay" value={money(account.summary.amount_due)} /><Metric label="Advance / overpaid" value={money(account.summary.advance)} /></div>
    <form className="border border-zinc-700 rounded p-4 space-y-3" onSubmit={event => { event.preventDefault(); if (!pending) void send({ key: crypto.randomUUID(), url: path(outlet, `${supplierId}/payments/`), body: { amount, date, method, reference, notes, expected_balance: String(account.summary.balance) } }); }}>
      <h4 className="font-semibold">Record supplier payment</h4><p className="text-xs text-zinc-400">Record money already paid. Payments cover the opening balance and oldest unpaid bills first. Any excess stays as an advance for future purchases.</p>
      <fieldset disabled={busy || !!pending || !!loadError} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="text-xs">Amount (NPR)<input className={`${input} mt-1`} type="number" min="0.01" max="9999999999.99" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} /></label>
        <label className="text-xs">Payment date<input className={`${input} mt-1`} type="date" required max={today()} value={date} onChange={event => setDate(event.target.value)} /></label>
        <label className="text-xs">Method<select className={`${input} mt-1`} value={method} onChange={event => setMethod(event.target.value)}><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option><option value="FONEPAY">FonePay</option><option value="CHEQUE">Cheque</option></select></label>
        <label className="text-xs">Reference<input className={`${input} mt-1`} maxLength={128} value={reference} onChange={event => setReference(event.target.value)} /></label>
        <label className="text-xs">Note<input className={`${input} mt-1`} maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} /></label>
      </fieldset>
      {Number(amount) > Number(account.summary.amount_due) && <p className="text-xs text-emerald-400">Advance after this payment: {money(Number(amount) - Number(account.summary.balance))}</p>}
      <button className={primary} disabled={busy || !!pending || !!loadError}>{busy ? 'Saving…' : 'Record payment'}</button>
    </form>
    {pending && <div role="status" className="p-3 border border-amber-600 text-sm">Payment result is unconfirmed. Retry the saved request to check it without creating a duplicate. <button className={button} disabled={busy} onClick={() => void send(pending)}>Retry saved payment</button></div>}
    {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}{success && <p role="status" className="text-sm text-emerald-400">{success}</p>}
    <div className="flex gap-2">{(['bills', 'statement', 'payments'] as const).map(value => <button key={value} aria-pressed={tab === value} className={tab === value ? primary : button} onClick={() => setTab(value)}>{value === 'bills' ? 'Bills & prices' : value === 'statement' ? 'Transactions' : 'Payment history'}</button>)}</div>
    {tab === 'bills' && <div className="space-y-3">
      {!account.invoices.length && <p className="p-4 text-zinc-500 text-sm">No purchase bills recorded for this supplier yet.</p>}
      {account.invoices.map(invoice => <details key={invoice.id} className="rounded border border-zinc-800 bg-zinc-900/30">
        <summary className="p-3 cursor-pointer text-sm"><span className="font-semibold">{invoice.invoice_number}</span> · {invoice.purchase_date} · {money(invoice.total_amount)} <span className="text-zinc-400">· Paid {money(invoice.paid_amount)} · Due {money(invoice.due_amount)}</span></summary>
        <div className="p-3 border-t border-zinc-800 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{['Item', 'Quantity', 'Unit price', 'Discount', 'Line total'].map(h => <th key={h} className="p-2 text-zinc-400">{h}</th>)}</tr></thead><tbody>{invoice.items.map(item => <tr key={item.id}><td className="p-2">{item.item_name}</td><td className="p-2">{item.quantity} {item.unit}</td><td className="p-2">{money(item.unit_cost)}</td><td className="p-2">{money(item.discount)}</td><td className="p-2">{money(item.total_cost)}</td></tr>)}</tbody></table><p className="text-xs text-zinc-400 mt-2">Invoice discount: {money(invoice.discount_amount)} · {invoice.payment_status}</p>{invoice.notes && <p className="text-xs mt-2">{invoice.notes}</p>}{invoice.document && <a href={invoice.document} target="_blank" rel="noreferrer" className="text-xs text-amber-400 underline">Open bill attachment</a>}</div>
      </details>)}
      {!!account.items.length && <div className="p-3 border border-zinc-800 rounded"><h4 className="text-sm font-semibold mb-2">Stock items assigned to this supplier</h4><p className="text-xs text-zinc-500 mb-2">Current inventory cost; each bill above shows the price actually purchased.</p>{account.items.map(item => <div key={item.id} className="flex justify-between gap-3 text-xs py-2 border-t border-zinc-800"><span>{item.name} <span className="text-zinc-500">{item.sku}</span></span><span>{money(item.cost_per_unit)} / {item.unit}</span></div>)}</div>}
    </div>}
    {tab === 'statement' && <div className="overflow-x-auto border border-zinc-800 rounded"><p className="p-3 text-xs">Opening balance: <Balance value={account.summary.opening_balance} /></p><table className="w-full text-xs text-left"><thead className="bg-zinc-900 text-zinc-400"><tr>{['Date', 'Transaction', 'Reference / note', 'Purchase', 'Payment', 'Balance'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{account.statement.map(row => <tr key={row.id} className="border-t border-zinc-800"><td className="p-3">{row.date}</td><td className="p-3">{row.type.replaceAll('_', ' ')}<div className="text-zinc-500">{row.method}</div></td><td className="p-3">{row.reference}<div className="text-zinc-500">{row.description}</div></td><td className="p-3">{money(row.charge)}</td><td className="p-3">{money(row.payment)}</td><td className="p-3"><Balance value={row.balance} /></td></tr>)}{!account.statement.length && <tr><td colSpan={6} className="p-6 text-center text-zinc-500">No transactions yet.</td></tr>}</tbody></table></div>}
    {tab === 'payments' && <div className="space-y-3"><p className="text-xs text-zinc-400">Payments entered here. Payments made when recording a bill appear under Transactions.</p>{account.payments.map(payment => <div key={payment.id} className="border border-zinc-800 p-3 rounded flex flex-wrap justify-between gap-2"><div><p className="text-sm font-semibold">{money(payment.amount)} · {payment.method} · {payment.date}</p><p className="text-xs text-zinc-400">{payment.reference} {payment.notes} · Recorded by {payment.recorded_by}</p>{payment.voided_at && <p className="text-xs text-rose-400">Reversed: {payment.void_reason}</p>}</div>{!payment.voided_at && <button className={button} disabled={busy || !!pending} onClick={() => { setVoidId(payment.id); setReason(''); }}>Reverse payment #{payment.id}</button>}</div>)}{!account.payments.length && <p className="text-zinc-500 text-sm p-4">No account payments recorded yet.</p>}
      {voidId !== null && <form className="p-3 border border-rose-500 space-y-2" onSubmit={event => { event.preventDefault(); if (!pending) void send({ key: crypto.randomUUID(), url: path(outlet, `${supplierId}/payments/${voidId}/void/`), body: { reason } }); }}><label className="text-xs">Reason for reversing payment #{voidId}<input className={`${input} mt-1`} required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></label><button className={button} disabled={busy || !!pending}>Reverse recorded payment</button> <button type="button" className={button} onClick={() => setVoidId(null)}>Cancel</button></form>}
    </div>}
  </div>;
}
