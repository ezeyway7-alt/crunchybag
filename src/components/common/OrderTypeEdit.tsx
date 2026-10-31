import React, { useRef, useState } from 'react';
import { Modal } from './Modal';
import { apiClient, extractErrorMessage } from '../../lib/api';
import { backendOrder, PosMeta, PosOrder, posPath } from '../../lib/posApi';
import { Order } from '../../types';

export const OrderTypeEdit: React.FC<{ order: Order; outlet: string; meta: PosMeta | null }> = ({ order, outlet, meta }) => {
  const raw = backendOrder(order);
  const [open, setOpen] = useState(false), [type, setType] = useState('');
  const [table, setTable] = useState(''), [address, setAddress] = useState(''), [reason, setReason] = useState('');
  const [tables, setTables] = useState<PosMeta['tables']>([]);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const locked = useRef(false);
  const pending = useRef<{ body: string; key: string } | null>(null);
  const load = async () => {
    if (!raw) return;
    setType(raw.fulfillment_type); setTable(String(raw.table_id || '')); setAddress(raw.delivery_address || '');
    setReason(''); setError(''); setTables(meta?.tables || []); setOpen(true); setLoading(true);
    try { const latest = await apiClient.get<PosMeta>(posPath(outlet, 'meta/')); setTables(latest.tables); }
    catch (e) { setError(extractErrorMessage(e)); }
    finally { setLoading(false); }
  };
  if (!raw || !meta?.permissions.orders) return null;
  const input = 'block w-full rounded border border-zinc-700 bg-white dark:bg-zinc-900 p-2 mt-1';
  return <span className="inline-block" onClick={e => e.stopPropagation()}>
    <button type="button" disabled={['CANCELLED', 'OUT_FOR_DELIVERY'].includes(raw.status)} onClick={() => void load()} className="text-[10px] text-amber-500 hover:underline disabled:opacity-30" title="Correct table or order type">Change table / type</button>
    <Modal isOpen={open} onClose={() => { if (!locked.current) setOpen(false); }} title="Change table or order type" maxWidth="sm">
      <form aria-label="Order correction" className="p-4 space-y-3 text-sm text-zinc-900 dark:text-zinc-100" onSubmit={async event => {
        event.preventDefault(); if (locked.current) return;
        locked.current = true; setBusy(true); setError('');
        const body = { version: raw.version, fulfillment_type: type, table_id: type === 'DINE_IN' ? Number(table) : null, delivery_address: type === 'DELIVERY' ? address : '', reason };
        const signature = JSON.stringify(body);
        if (pending.current?.body !== signature) pending.current = { body: signature, key: crypto.randomUUID() };
        try {
          const result = await apiClient.post<PosOrder>(posPath(outlet, `${raw.id}/fulfillment/`), body, { headers: { 'Idempotency-Key': pending.current.key } });
          window.dispatchEvent(new CustomEvent('pos:order-changed', { detail: { outlet, order: result } }));
          pending.current = null; setOpen(false);
        } catch (e) { setError(extractErrorMessage(e)); }
        finally { locked.current = false; setBusy(false); }
      }}>
        <p className="text-xs text-zinc-500">Correct this order without changing its items, payments or saved receipts. An occupied table cannot be selected.</p>
        <fieldset disabled={busy || loading} className="space-y-3">
          <label className="block">Order type<select className={input} value={type} onChange={e => setType(e.target.value)}>{[...new Set([raw.fulfillment_type, ...meta.fulfillment_modes])].map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
          {type === 'DINE_IN' && <label className="block">Table<select className={input} required value={table} onChange={e => setTable(e.target.value)}><option value="">Select table</option>{tables.map(row => <option key={row.id} value={row.id} disabled={!!row.active_order_id && row.active_order_id !== raw.id}>{row.table_number}{row.active_order_id && row.active_order_id !== raw.id ? ' (occupied)' : ''}</option>)}</select></label>}
          {type === 'DELIVERY' && <label className="block">Delivery address<textarea required maxLength={1000} className={input} value={address} onChange={e => setAddress(e.target.value)}/></label>}
          <label className="block">Reason<input required maxLength={180} className={input} value={reason} onChange={e => setReason(e.target.value)} placeholder="Selected the wrong table or order type"/></label>
          <button disabled={!reason.trim()} className="w-full rounded bg-amber-500 p-2 text-black font-semibold disabled:opacity-40">{busy ? 'Saving…' : loading ? 'Loading tables…' : 'Save correction'}</button>
        </fieldset>
        {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}
      </form>
    </Modal>
  </span>;
};
