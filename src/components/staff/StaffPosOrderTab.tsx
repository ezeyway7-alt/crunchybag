import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../lib/api';
import { PosLine, PosOrder, PosSession, Tender, activeOrder, npr, posPath, posError, printPosReceipt, todayNepal, usePosCommand, usePosOrders, usePosSession } from '../../lib/posApi';
import { button, field, primary, PosDialog, TenderFields, OrderItems, OrderTotals, nextStatus, statusLabel } from './PosShared';
import { StaffTableGrid } from './StaffTableGrid';
type Product = any;
type CartLine = PosLine & {
    label: string;
    key: string;
};
const defaults = (p: Product): PosLine => ({ product_id: p.id, quantity: 1, variant_id: p.variants?.find((v: any) => v.is_default)?.id ?? p.variants?.[0]?.id ?? null, modifier_option_ids: (p.modifier_groups || []).flatMap((g: any) => g.options.filter((o: any) => o.is_default).map((o: any) => o.id)) });
function Choices({ product, line, onChange }: {
    product: Product;
    line: PosLine;
    onChange: (line: PosLine) => void;
}) {
    return <div className="space-y-3">{product.variants?.length > 0 && <label className="block text-sm">Variant<select className={field} value={line.variant_id ?? ''} onChange={e => onChange({ ...line, variant_id: e.target.value })}>{product.variants.map((v: any) => <option key={v.id} value={v.id}>{v.name} · {npr(v.price)}</option>)}</select></label>}{(product.modifier_groups || []).map((g: any) => <fieldset key={g.id} className="space-y-2"><legend>{g.name} <span className="text-xs text-zinc-400">Choose {g.min_selections}–{g.max_selections}</span></legend>{g.options.map((o: any) => <label key={o.id} className="mr-4 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={line.modifier_option_ids.includes(o.id)} onChange={e => onChange({ ...line, modifier_option_ids: e.target.checked ? [...line.modifier_option_ids, o.id] : line.modifier_option_ids.filter(id => id !== o.id) })}/>{o.name} (+{npr(o.price_delta)})</label>)}</fieldset>)}</div>;
}
function Configure({ product, products, onAdd, onClose }: {
    product: Product;
    products: Product[];
    onAdd: (line: CartLine) => void;
    onClose: () => void;
}) {
    const [line, setLine] = useState<PosLine>(() => defaults(product));
    const [custom, setCustom] = useState(false), [extra, setExtra] = useState('');
    const [components, setComponents] = useState<PosLine[]>(() => (product.combo_items || []).map((c: any) => { const p = products.find(p => p.id === c.product_id); return p ? { ...defaults(p), quantity: c.quantity } : null; }).filter(Boolean));
    return <PosDialog title={product.name} onClose={onClose}><form className="space-y-4" onSubmit={e => { e.preventDefault(); onAdd({ ...line, ...(custom ? { combo_selections: components } : {}), label: product.name, key: crypto.randomUUID() }); onClose(); }}><Choices product={product} line={line} onChange={setLine}/>{product.is_combo_package && <section className="rounded-lg border border-amber-500/40 p-3"><h3 className="font-semibold">Combo package</h3><p className="text-sm text-zinc-400">Included items: {(product.combo_items || []).map((c: any) => `${c.quantity} × ${products.find(p => p.id === c.product_id)?.name || c.product_name || 'Unavailable component'}`).join(', ')}</p><label className="my-3 flex items-center gap-2"><input type="checkbox" checked={custom} onChange={e => setCustom(e.target.checked)}/>Customize components</label>{custom && <div className="space-y-4">{components.map((c, i) => { const p = products.find(p => p.id === c.product_id); return p && <div key={i} className="rounded border border-zinc-700 p-3"><div className="mb-2 flex items-center justify-between"><strong>{p.name}</strong><button type="button" className={button} onClick={() => setComponents(components.filter((_, j) => i !== j))}>Remove</button></div><label>Quantity in each package<input className={field} type="number" min={1} max={100} value={c.quantity} onChange={e => setComponents(components.map((v, j) => j === i ? { ...v, quantity: Number(e.target.value) } : v))}/></label><Choices product={p} line={c} onChange={v => setComponents(components.map((r, j) => i === j ? v : r))}/></div>; })}<div className="flex gap-2"><select aria-label="Extra combo component" className={field} value={extra} onChange={e => setExtra(e.target.value)}><option value="">Choose an extra item</option>{products.filter(p => !p.is_combo_package && p.is_available).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button type="button" className={button} disabled={!extra} onClick={() => { const p = products.find(p => p.id === extra); if (p)
        setComponents([...components, defaults(p)]); setExtra(''); }}>Add</button></div><p className="text-xs text-zinc-400">The server recalculates the package price after component changes.</p></div>}</section>}<label className="block">Quantity<input className={field} type="number" min={1} max={100} required value={line.quantity} onChange={e => setLine({ ...line, quantity: Number(e.target.value) })}/></label><label className="block">Preparation notes<input className={field} maxLength={255} value={line.item_notes || ''} onChange={e => setLine({ ...line, item_notes: e.target.value })}/></label><button className={primary} disabled={custom && !components.length}>Add to staged order</button></form></PosDialog>;
}
export const StaffPosOrderTab: React.FC<{
    onOpenBillingForOrder?: (order: PosOrder) => void;
}> = ({ onOpenBillingForOrder }) => {
    const session = usePosSession();
    return <PosWorkspace key={session.outlet} session={session} onBill={onOpenBillingForOrder}/>;
};
function PosWorkspace({ session, onBill }: {
    key?: string;
    session: PosSession;
    onBill?: (order: PosOrder) => void;
}) {
    const { outlet, meta, connection, revision } = session;
    const command = usePosCommand(session);
    const [menu, setMenu] = useState<any[]>([]), [menuError, setMenuError] = useState(''), [configure, setConfigure] = useState<Product | null>(null);
    const [cart, setCart] = useState<CartLine[]>([]), [search, setSearch] = useState(''), [category, setCategory] = useState('');
    const [tabPage, setTabPage] = useState(1), [tabSearch, setTabSearch] = useState('');
    const [mode, setMode] = useState('NEW'), [target, setTarget] = useState<number | null>(null), [fulfillment, setFulfillment] = useState('TAKEAWAY'), [table, setTable] = useState('');
    const [name, setName] = useState(''), [phone, setPhone] = useState(''), [notes, setNotes] = useState(''), [address, setAddress] = useState('');
    const [tenders, setTenders] = useState<Tender[]>([]), [method, setMethod] = useState('CASH');
    const [quote, setQuote] = useState<any>(null), [quoteError, setQuoteError] = useState(''), [quoteKey, setQuoteKey] = useState('');
    const [notice, setNotice] = useState(''), [detail, setDetail] = useState<PosOrder | null>(null), [reasonAction, setReasonAction] = useState<{
        order: PosOrder;
        item?: number;
    } | null>(null), [reason, setReason] = useState('');
    const [start, setStart] = useState(todayNepal), [end, setEnd] = useState(todayNepal), [status, setStatus] = useState('ALL'), [channel, setChannel] = useState('ALL'), [settlement, setSettlement] = useState('ALL'), [orderSearch, setOrderSearch] = useState(''), [page, setPage] = useState(1), [size, setSize] = useState(10);
    const history = usePosOrders(session, { start_date: start, end_date: end, status, fulfillment: channel, settlement, search: orderSearch, page, page_size: size });
    const ongoing = usePosOrders(session, { open_tabs: true, page_size: 100, page: tabPage, search: tabSearch });
    const running = ongoing.data?.results.filter(activeOrder) || [];
    const [loadedTarget, setLoadedTarget] = useState<PosOrder | null>(null);
    const selected = running.find(o => o.id === target) || (loadedTarget?.id === target ? loadedTarget : undefined);
    const products = useMemo(() => menu.flatMap(c => c.products), [menu]);
    const visible = products.filter(p => (!category || String(p.category_id) === category) && p.name.toLowerCase().includes(search.toLowerCase()));
    const raw = useMemo(() => cart.map(({ label, key, ...line }) => line), [cart]);
    const quoteBody = useMemo(() => ({ items: raw, payment_method: method, ...(mode === 'ADD' && target ? { order_id: target } : {}) }), [raw, method, mode, target]);
    const currentQuoteKey = JSON.stringify(quoteBody);
    useEffect(() => { setPage(1); }, [start, end, status, channel, settlement, orderSearch, size]);
    useEffect(() => { if (tenders.length > 1)
        setMethod('SPLIT');
    else if (tenders.length === 1)
        setMethod(tenders[0].method); }, [tenders.map(r => r.method).join(',')]);
    useEffect(() => { if (meta && !meta.fulfillment_modes.includes(fulfillment))
        setFulfillment(meta.fulfillment_modes[0] || 'TAKEAWAY'); }, [meta?.fulfillment_modes.join(',')]);
    useEffect(() => {
        if (!meta)
            return;
        let alive = true;
        const controller = new AbortController();
        const load = () => apiClient.get<any>(`/catalog/menu/?outlet_id=${outlet}&channel=pos`, { signal: controller.signal }).then(v => { if (alive) {
            setMenu(v.categories || []);
            setMenuError('');
        } }).catch(e => { if (alive)
            setMenuError(posError(e)); });
        void load();
        const timer = setInterval(load, 60000);
        return () => { alive = false; controller.abort(); clearInterval(timer); };
    }, [outlet, !!meta, session.menuRevision]);
    useEffect(() => {
        setQuote(null);
        setQuoteError('');
        setQuoteKey('');
        if (!cart.length || !meta)
            return;
        let alive = true;
        const controller = new AbortController();
        const timer = setTimeout(() => apiClient.post<any>(posPath(outlet, 'quote/'), quoteBody, { signal: controller.signal }).then(v => { if (alive) {
            setQuote(v);
            setQuoteKey(currentQuoteKey);
        } }).catch(e => { if (alive)
            setQuoteError(posError(e)); }), 300);
        return () => { alive = false; clearTimeout(timer); controller.abort(); };
    }, [currentQuoteKey, !!meta, revision]);
    useEffect(() => { if (detail) {
        const latest = history.data?.results.find(o => o.id === detail.id) || ongoing.data?.results.find(o => o.id === detail.id);
        if (latest)
            setDetail(latest);
    } }, [history.data, ongoing.data]);
    const print = async (o: PosOrder) => { const r = o.receipts.filter(r => r.kind === 'TOKEN').at(-1); if (r)
        try {
            await printPosReceipt(outlet, r.id);
        }
        catch (e) {
            command.setError(posError(e));
        } };
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quote || quoteKey !== currentQuoteKey)
            return;
        let result: PosOrder | undefined;
        if (mode === 'ADD') {
            if (!selected)
                return;
            result = await command.run(`${selected.id}/append/`, { version: quote.order_version, items: raw, expected_total: quote.total_payable });
        }
        else {
            result = await command.run('', { items: raw, expected_total: quote.total_payable, payment_method: method, fulfillment_type: fulfillment, table_id: fulfillment === 'DINE_IN' ? Number(table) : null, customer_name: name.trim() || 'Walk-in Guest', customer_phone: phone, notes, delivery_address: address, tenders });
        }
        if (result) {
            setCart([]);
            setTenders([]);
            setNotes('');
            setNotice(`${result.order_number} saved. ${result.status === 'READY' ? 'Ready for handover.' : 'Sent to the kitchen.'}`);
            setDetail(result);
        }
    };
    const transition = async (o: PosOrder) => { const next = nextStatus(o); if (next)
        await command.run(`${o.id}/transition/`, { version: o.version, status: next }); };
    const errors = [session.error, menuError, history.error, ongoing.error, command.error].filter(Boolean);
    return <div className="space-y-5 text-zinc-100"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">POS orders</h1><p className="text-sm text-zinc-400">{meta?.outlet_name} · <span role="status">{connection}</span></p></div><button className={button} onClick={session.refresh}>Sync now</button></header>{errors.map((e, i) => <p key={i} role="alert" className="rounded-lg bg-red-950 p-3 text-red-200">{e}</p>)}{command.hasPending && <button className={primary} disabled={command.busy} onClick={async () => { const o = await command.recover(); if (o) {
        setCart([]);
        setTenders([]);
        setDetail(o);
        setNotice(`${o.order_number}: interrupted request recovered.`);
    } }}>Recover interrupted action</button>}{notice && <p role="status" className="rounded-lg bg-emerald-950 p-3 text-emerald-200">{notice}</p>}{!meta ? <p>Loading staff permissions and outlet data…</p> : <><nav className="flex flex-wrap gap-2" aria-label="Order entry mode">{[['NEW', 'New order'], ['ADD', `Add to ongoing tab (${running.length}${(ongoing.data?.count || 0) > 100 ? '+' : ''})`], ['TABLES', `Floor tables (${meta.tables.length})`]].map(([id, label]) => <button key={id} className={mode === id ? primary : button} onClick={() => { setMode(id); setTarget(null); }}>{label}</button>)}</nav>{mode === 'TABLES' ? <StaffTableGrid outlet={outlet} tables={meta.tables} orders={running} onSelectTableForNewOrder={id => { setTable(String(id)); setFulfillment('DINE_IN'); setMode('NEW'); }} onSelectOngoingOrder={o => { setLoadedTarget(o); setTarget(o.id); setMode('ADD'); }} onOpenBillingForOrder={onBill}/> : meta.permissions.orders && <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">{mode === 'ADD' && <div className="space-y-2"><label>Find ongoing tab<input className={field} value={tabSearch} onChange={e => { setTabSearch(e.target.value); setTabPage(1); }}/></label><div className="flex gap-2"><button type="button" className={button} disabled={tabPage === 1} onClick={() => setTabPage(tabPage - 1)}>Previous tabs</button><button type="button" className={button} disabled={tabPage * 100 >= (ongoing.data?.count || 0)} onClick={() => setTabPage(tabPage + 1)}>More tabs</button></div><label className="block">Running order<select required className={field} value={target ?? ''} onChange={e => setTarget(Number(e.target.value))}><option value="">Choose an active order</option>{running.map(o => <option key={o.id} value={o.id}>{o.order_number} · {o.customer_name} {o.table_number ? `· Table ${o.table_number}` : ''}</option>)}</select></label></div>}<label className="block">Search menu<input className={field} value={search} onChange={e => setSearch(e.target.value)} placeholder="Item or combo name"/></label><div className="flex flex-wrap gap-2"><button type="button" className={!category ? primary : button} onClick={() => setCategory('')}>All items</button>{menu.map(c => <button type="button" key={c.id} className={category === String(c.id) ? primary : button} onClick={() => setCategory(String(c.id))}>{c.name}</button>)}</div><div className="grid max-h-[540px] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">{visible.slice(0, 120).map(p => <button type="button" key={p.id} className="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-left hover:border-amber-400 disabled:opacity-40" disabled={!p.is_available || !Number.isFinite(Number(p.base_price))} onClick={() => setConfigure(p)}>{p.images?.[0] && <img loading="lazy" src={p.images[p.main_image_index || 0]} alt="" className="h-24 w-full rounded-lg object-cover"/>}<strong>{p.name}</strong><span className="text-xs text-amber-300">{p.is_combo_package ? 'Combo package' : 'Menu item'}</span><span>{npr(p.base_price)}</span><span className="text-sm">{p.is_available ? '+ Add' : 'Unavailable'}</span></button>)}</div>{!visible.length && <p className="py-8 text-center text-zinc-400">No menu items match. Publish POS-visible items in Menu Manager.</p>}{visible.length > 120 && <p>Narrow the search to see more items.</p>}</section><section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"><h2 className="text-lg font-bold">{cart.reduce((n, r) => n + r.quantity, 0)} items staged</h2>{cart.map((r, i) => <div key={r.key} className="flex items-center gap-2 border-b border-zinc-800 pb-3"><div className="min-w-0 flex-1"><strong>{r.label}</strong><p className="text-xs text-zinc-400">{r.combo_selections ? 'Customized package' : r.item_notes}</p>{quote?.items[i] && <p>{npr(quote.items[i].line_total)}</p>}</div><input aria-label={`Quantity for ${r.label}`} className={`${field} !w-20`} type="number" min={1} max={100} required value={r.quantity} onChange={e => setCart(cart.map((v, j) => i === j ? { ...v, quantity: Number(e.target.value) } : v))}/><button type="button" className={button} aria-label={`Remove ${r.label}`} onClick={() => setCart(cart.filter((_, j) => j !== i))}>×</button></div>)}{mode === 'NEW' && <><label className="block">Fulfillment<select className={field} value={fulfillment} onChange={e => setFulfillment(e.target.value)}>{meta.fulfillment_modes.map(m => <option key={m}>{m}</option>)}</select></label>{fulfillment === 'DINE_IN' && <label className="block">Table<select required className={field} value={table} onChange={e => setTable(e.target.value)}><option value="">Choose a table</option>{meta.tables.map(t => <option key={t.id} value={t.id} disabled={!!t.active_order_id}>{t.section} · {t.table_number} ({t.capacity} seats)</option>)}</select></label>}<div className="grid grid-cols-2 gap-3"><label>Customer name<input maxLength={120} className={field} placeholder="Walk-in guest" value={name} onChange={e => setName(e.target.value)}/></label><label>Mobile number<input maxLength={32} className={field} type="tel" value={phone} onChange={e => setPhone(e.target.value)}/></label></div>{fulfillment === 'DELIVERY' && <label className="block">Delivery address<textarea required maxLength={1000} className={field} value={address} onChange={e => setAddress(e.target.value)}/></label>}<label className="block">Special notes<textarea maxLength={2000} className={field} value={notes} onChange={e => setNotes(e.target.value)}/></label><label className="block">Billing method<select className={field} value={method} onChange={e => setMethod(e.target.value)}>{[...meta.payment_methods, 'SPLIT'].map(m => <option key={m}>{m}</option>)}</select></label>{meta.permissions.billing && <TenderFields rows={tenders} onChange={setTenders} methods={meta.payment_methods} disabled={command.busy}/>}<p className="text-xs text-zinc-400">Leave tenders empty to keep the bill unpaid.</p></>}{quoteError && <p role="alert" className="text-red-300">{quoteError}</p>}<div className="space-y-2 border-t border-zinc-700 pt-3"><p className="flex justify-between"><span>{mode === 'ADD' ? 'Updated order subtotal' : 'Subtotal'}</span><strong>{quote ? npr(quote.subtotal) : '—'}</strong></p>{quote && Number(quote.service_charge_amount) > 0 && <p>Service charge: {npr(quote.service_charge_amount)}</p>}<p className="flex justify-between text-lg"><span>Total payable</span><strong>{quote ? npr(quote.total_payable) : cart.length ? 'Getting server quote…' : npr(0)}</strong></p></div><button className={`${primary} w-full`} disabled={command.busy || !cart.length || !quote || quoteKey !== currentQuoteKey || !meta.accepting_orders || (mode === 'ADD' && !selected)}>{command.busy ? 'Saving…' : mode === 'ADD' ? 'Send new round to kitchen' : 'Fire order to kitchen'}</button></section></form>}
        <section className="space-y-4 rounded-xl border border-zinc-800 p-4"><div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6"><label>Start date<input type="date" required className={field} value={start} onChange={e => setStart(e.target.value)}/></label><label>End date<input type="date" required className={field} value={end} onChange={e => setEnd(e.target.value)}/></label><label>Channel<select className={field} value={channel} onChange={e => setChannel(e.target.value)}>{['ALL', ...meta.fulfillment_modes].map(m => <option key={m}>{m}</option>)}</select></label><label>Settlement<select className={field} value={settlement} onChange={e => setSettlement(e.target.value)}>{['ALL', 'PAID', 'UNPAID', 'PARTIAL', 'CREDIT'].map(m => <option key={m}>{m}</option>)}</select></label><label>Search orders<input className={field} value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Order, customer, phone, item"/></label><label>Rows per page<select className={field} value={size} onChange={e => setSize(Number(e.target.value))}>{[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}</select></label></div><div className="flex flex-wrap gap-3">{Object.entries(history.data?.summary || {}).filter(([k]) => k !== 'methods').map(([k, v]) => <div key={k} className="rounded-lg bg-zinc-900 px-3 py-2"><span className="text-xs uppercase text-zinc-400">{k}</span><p className="font-bold">{npr(v as string)}</p></div>)}{Object.entries(history.data?.summary.methods || {}).map(([k, v]) => <div key={k} className="rounded-lg bg-zinc-900 px-3 py-2"><span className="text-xs">{k} collected</span><p>{npr(v as string)}</p></div>)}</div><div className="flex flex-wrap gap-2" aria-label="Order status">{['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'].map(s => <button key={s} className={status === s ? primary : button} onClick={() => setStatus(s)}>{s.replaceAll('_', ' ')} {s === 'ALL' ? '' : history.data?.status_counts[s] || 0}</button>)}</div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-zinc-400"><tr>{['Order / time', 'Customer & channel', 'Items', 'Amount & billing', 'Status', 'Actions'].map(t => <th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{history.data?.results.map(o => <tr key={o.id} className="border-t border-zinc-800"><td className="p-3 font-mono">{o.order_number}<p className="text-xs text-zinc-400">{new Date(o.created_at).toLocaleTimeString('en-NP', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit' })}</p></td><td className="p-3">{o.customer_name}<p className="text-zinc-400">{o.table_number ? `Table ${o.table_number}` : o.fulfillment_type}</p>{o.customer_phone}</td><td className="max-w-xs p-3">{o.items.filter(i => !i.is_voided).map(i => `${i.quantity}× ${i.product_name}`).join(', ')}{o.notes && <p className="text-amber-200">{o.notes}</p>}</td><td className="p-3"><strong>{npr(o.total_payable)}</strong><p>{o.settlement}</p><p className="text-zinc-400">Due {npr(o.due_amount)}</p>{Number(o.refunded_amount) > 0 && <p>Refund {npr(o.refunded_amount)}</p>}</td><td className="p-3">{o.status.replaceAll('_', ' ')}</td><td className="p-3"><div className="flex min-w-40 flex-wrap gap-2"><button className={button} onClick={() => setDetail(o)}>Details</button>{activeOrder(o) && meta.permissions.orders && <button className={button} onClick={() => { setLoadedTarget(o); setTarget(o.id); setMode('ADD'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Add round</button>}{nextStatus(o) && meta.permissions.kitchen && <button className={button} disabled={command.busy} onClick={() => transition(o)}>{statusLabel[nextStatus(o)!]}</button>}{meta.permissions.billing && onBill && <button className={button} onClick={() => onBill(o)}>Bill</button>}</div></td></tr>)}</tbody></table>{!history.data?.results.length && <p className="p-8 text-center text-zinc-400">{history.loading ? 'Loading orders…' : 'No orders match these filters.'}</p>}</div><footer className="flex items-center justify-between"><span>{history.data?.count || 0} orders · Page {page}</span><div className="flex gap-2"><button className={button} disabled={page === 1 || history.loading} onClick={() => setPage(page - 1)}>Previous</button><button className={button} disabled={!history.data || page * size >= history.data.count || history.loading} onClick={() => setPage(page + 1)}>Next</button></div></footer></section></>}
    {configure && <Configure product={configure} products={products} onClose={() => setConfigure(null)} onAdd={line => setCart([...cart, line])}/>} {detail && <PosDialog title={detail.order_number} onClose={() => setDetail(null)}><div className="space-y-4"><p>{detail.customer_name} · {detail.status} · {detail.settlement}</p><OrderItems order={detail}/><OrderTotals order={detail}/>{detail.notes && <p>Notes: {detail.notes}</p>}<div className="flex flex-wrap gap-2"><button className={button} onClick={() => print(detail)}>Print latest token</button>{meta?.permissions.kitchen && activeOrder(detail) && <button className={button} disabled={command.busy} onClick={() => command.run(`${detail.id}/call/`, { version: detail.version })}>Call kitchen</button>}{meta?.permissions.discount && activeOrder(detail) && <button className={button} onClick={() => { setReasonAction({ order: detail }); setReason(''); setDetail(null); }}>Cancel order</button>}{onBill && meta?.permissions.billing && <button className={primary} onClick={() => onBill(detail)}>Open billing</button>}</div>{meta?.permissions.discount && ['PENDING', 'ACCEPTED'].includes(detail.status) && !Number(detail.paid_amount) && detail.items.filter(i => !i.is_voided).map(i => <button key={i.id} className={`${button} mr-2`} onClick={() => { setReasonAction({ order: detail, item: i.id }); setReason(''); setDetail(null); }}>Remove {i.product_name}</button>)}</div></PosDialog>}{reasonAction && <PosDialog title={reasonAction.item ? 'Remove unprepared item' : 'Cancel order'} onClose={() => setReasonAction(null)}><form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); const { order, item } = reasonAction; const result = await command.run(`${order.id}/${item ? 'void' : 'transition'}/`, { version: order.version, reason, ...(item ? { item_id: item } : { status: 'CANCELLED' }) }); if (result)
        setReasonAction(null); }}><p>Prepared ingredients are not automatically returned to stock. Refund collected funds before cancelling.</p><label className="block">Reason<input required maxLength={255} className={field} value={reason} onChange={e => setReason(e.target.value)}/></label>{command.error && <p role="alert">{command.error}</p>}<button className={primary} disabled={command.busy}>Confirm</button></form></PosDialog>}</div>;
}
