import React, { useRef, useState } from 'react';
import { apiClient, extractErrorMessage } from '../../lib/api';

export const AddMemberForm: React.FC<{
  outlet: string; canDiscount: boolean; onCreated: (id: number) => void; onCancel: () => void;
}> = ({ outlet, canDiscount, onCreated, onCancel }) => {
  const [name, setName] = useState(''), [phone, setPhone] = useState('');
  const [percent, setPercent] = useState('0'), [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const sending = useRef(false);
  const request = useRef<{ body: string; key: string } | null>(null);
  const input = 'w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm mt-1';
  return <form aria-label="Add member" className="rounded border border-zinc-700 bg-zinc-900/40 p-4 space-y-3" onSubmit={async event => {
    event.preventDefault(); if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    const body = { name: name.trim(), phone: phone.trim(), discount_percent: canDiscount ? percent : '0', discount_remark: canDiscount ? remark.trim() : '' };
    const serialized = JSON.stringify(body);
    if (request.current?.body !== serialized) request.current = { body: serialized, key: crypto.randomUUID() };
    try {
      const result = await apiClient.post<{ id: number }>(`/customer/directory/?outlet_id=${encodeURIComponent(outlet)}`, body, { headers: { 'Idempotency-Key': request.current.key } });
      onCreated(result.id);
    } catch (e) { setError(extractErrorMessage(e)); }
    finally { sending.current = false; setBusy(false); }
  }}>
    <h2 className="text-sm font-semibold">Add member</h2>
    <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-3">
      <label className="text-xs">Name<input autoFocus className={input} required maxLength={150} autoComplete="name" value={name} onChange={e => setName(e.target.value)} /></label>
      <label className="text-xs">Phone<input className={input} type="tel" required maxLength={32} autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>
      {canDiscount && <>
        <label className="text-xs">Discount % (optional)<input className={input} type="number" min="0" max="100" step="0.01" required value={percent} onChange={e => setPercent(e.target.value)} /></label>
        <label className="text-xs">Discount remark (optional)<input className={input} maxLength={180} placeholder="Predefined customer discount" value={remark} onChange={e => setRemark(e.target.value)} /></label>
      </>}
    </fieldset>
    {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
    <div className="flex gap-2"><button disabled={busy} className="rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">{busy ? 'Saving…' : 'Save member'}</button><button type="button" disabled={busy} onClick={onCancel} className="rounded border border-zinc-700 px-3 py-2 text-xs">Cancel</button></div>
  </form>;
}
