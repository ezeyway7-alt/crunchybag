import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../../lib/api';
import { posPath } from '../../lib/posApi';

type Customer = { id?: number; name: string; phone: string };
export function CustomerPicker({ outlet, personalCustomer, onSelect }: {
  outlet?: string; personalCustomer?: Customer; onSelect: (customer: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    let live = true;
    const controller = new AbortController();
    setRows([]); setError(''); setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = outlet
          ? (await apiClient.get<{ results: Customer[] }>(`${posPath(outlet, 'customers/')}&search=${encodeURIComponent(query)}`, { signal: controller.signal })).results
          : personalCustomer?.phone && `${personalCustomer.name} ${personalCustomer.phone}`.toLowerCase().includes(query.toLowerCase()) ? [personalCustomer] : [];
        if (live) setRows(results);
      } catch { if (live) setError('Customer search unavailable. You can enter customer details below.'); }
      finally { if (live) setLoading(false); }
    }, 200);
    return () => { live = false; clearTimeout(timer); controller.abort(); };
  }, [open, outlet, query, personalCustomer?.name, personalCustomer?.phone]);
  const choose = (customer: Customer) => { onSelect(customer); setOpen(false); setQuery(''); };
  return <div className="relative w-full text-xs" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="w-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-left text-zinc-200">Select customer / Search phone or name</button>
    {open && <div className="absolute z-50 top-full w-full min-w-64 border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
      <input ref={input} aria-label="Search customer by phone or name" value={query} onChange={event => { setQuery(event.target.value); setRows([]); setLoading(true); }} placeholder="Search phone or name" className="w-full border border-zinc-600 bg-zinc-900 p-2 text-white" />
      <div className="max-h-48 overflow-auto">
        {loading && <p role="status" className="p-2 text-zinc-400">Searching…</p>}
        {error && <p role="alert" className="p-2 text-amber-400">{error}</p>}
        {!loading && rows.map(row => <button type="button" key={row.id ?? (row.phone || row.name)} onClick={() => choose(row)} className="block w-full p-2 text-left text-white hover:bg-zinc-800">{row.name || 'Guest'} · {row.phone}</button>)}
        {!loading && !error && !rows.length && <p className="p-2 text-zinc-400">No matching customer.</p>}
        {!loading && !error && !!query.trim() && !rows.length && <button type="button" className="w-full p-2 text-left text-amber-400" onClick={() => choose(/^[+\d\s().-]+$/.test(query.trim()) ? { name: '', phone: query.trim() } : { name: query.trim(), phone: '' })}>Use new customer: {query.trim()}</button>}
      </div>
      <p className="p-2 text-zinc-400">Enter name and phone below. New customers are saved with the order.</p>
    </div>}
  </div>;
}
