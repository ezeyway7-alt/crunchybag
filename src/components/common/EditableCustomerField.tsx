import React, { useRef, useState } from 'react';
import { extractErrorMessage } from '../../lib/api';

export const EditableCustomerField: React.FC<{
  value: string; label: string; phone?: boolean; disabled?: boolean;
  onSave: (value: string) => Promise<void>; maxLength?: number;
}> = ({ value, label, phone, disabled, onSave, maxLength }) => {
  const [editing, setEditing] = useState(false), [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const sending = useRef(false);
  const begin = () => { if (!disabled) { setDraft(value); setError(''); setEditing(true); } };
  const save = async () => {
    if (sending.current) return;
    if (draft.trim() === value) { setEditing(false); return; }
    sending.current = true; setBusy(true); setError('');
    try { await onSave(draft.trim()); setEditing(false); }
    catch (e) { setError(extractErrorMessage(e)); }
    finally { sending.current = false; setBusy(false); }
  };
  return <span className="inline-block max-w-full" onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
    {editing ? <span className="inline-flex flex-wrap items-center gap-1">
      <input autoFocus aria-label={label} type={phone ? 'tel' : 'text'} maxLength={maxLength ?? (phone ? 32 : 120)} disabled={busy} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); void save(); }
        if (e.key === 'Escape' && !busy) { e.preventDefault(); setEditing(false); }
      }} className="w-36 rounded border border-amber-500 bg-zinc-950 px-2 py-1 text-xs text-white" />
      <button type="button" aria-label={`Save ${label}`} disabled={busy} onClick={() => void save()} className="px-1 text-emerald-500">{busy ? '…' : '✓'}</button>
      <button type="button" aria-label={`Cancel ${label}`} disabled={busy} onClick={() => setEditing(false)} className="px-1 text-zinc-400">×</button>
      {error && <span role="alert" className="w-full whitespace-normal text-xs text-rose-500">{error}</span>}
    </span> : <span role={disabled ? undefined : 'button'} tabIndex={disabled ? undefined : 0} aria-label={`Edit ${label}`} title="Double-click to edit; keyboard Enter to edit" onDoubleClick={begin} onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); begin(); }
    }} className={disabled ? '' : 'cursor-text hover:underline decoration-dotted underline-offset-4'}>{value || (phone ? 'Add phone' : 'Add name')}</span>}
  </span>;
};
