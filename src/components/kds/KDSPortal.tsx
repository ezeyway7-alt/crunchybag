import React, { useEffect, useRef, useState } from 'react';
import { usePosSession, usePosOrders, usePosCommand, PosOrder } from '../../lib/posApi';
import { button, primary, OrderItems, nextStatus, statusLabel } from '../staff/PosShared';
export const KDSPortal: React.FC = () => {
    const session = usePosSession(), command = usePosCommand(session);
    const [page, setPage] = useState(1), [status, setStatus] = useState('ALL'), [sound, setSound] = useState(false), [notice, setNotice] = useState('');
    const result = usePosOrders(session, { kitchen: true, page, page_size: 25, status });
    const known = useRef<Map<number, number> | null>(null), audio = useRef<AudioContext | null>(null);
    useEffect(() => { known.current = null; setPage(1); }, [session.outlet]);
    useEffect(() => {
        if (!result.data)
            return;
        const current = new Map(result.data.results.map(o => [o.id, o.version]));
        if (known.current && result.data.results.some(o => !known.current!.has(o.id) || known.current!.get(o.id) !== o.version)) {
            setNotice('Kitchen tickets updated.');
            if (sound && audio.current) {
                const ctx = audio.current;
                const oscillator = ctx.createOscillator(), gain = ctx.createGain();
                oscillator.connect(gain);
                gain.connect(ctx.destination);
                oscillator.frequency.value = 880;
                gain.gain.setValueAtTime(.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .3);
                oscillator.start();
                oscillator.stop(ctx.currentTime + .3);
            }
        }
        known.current = current;
    }, [result.data, sound]);
    useEffect(() => () => { audio.current?.close(); }, []);
    const progress = async (o: PosOrder) => { const next = nextStatus(o); if (next)
        await command.run(`${o.id}/transition/`, { version: o.version, status: next }); };
    return <main className="min-h-screen space-y-5 bg-zinc-950 p-5 text-white"><header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Kitchen display</h1><p className="text-zinc-400">{session.meta?.outlet_name} · {session.connection}</p></div><button className={sound ? primary : button} onClick={() => { if (!sound) {
        audio.current ??= new AudioContext();
        void audio.current.resume();
    } setSound(!sound); }}>{sound ? 'Sound on' : 'Enable sound alerts'}</button></header>{[session.error, result.error, command.error].filter(Boolean).map((e, i) => <p key={i} role="alert" className="rounded bg-red-950 p-3 text-red-200">{e}</p>)}{command.hasPending && <button className={primary} disabled={command.busy} onClick={() => command.recover()}>Recover interrupted action</button>}<p role="status" className="text-amber-200">{notice}</p><nav className="flex flex-wrap gap-2">{['ALL', 'ACCEPTED', 'PREPARING', 'READY'].map(s => <button key={s} className={s === status ? primary : button} onClick={() => { setStatus(s); setPage(1); }}>{s}</button>)}</nav><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{result.data?.results.map(o => <article key={o.id} className={`space-y-4 rounded-xl border p-4 ${o.status === 'READY' ? 'border-emerald-600 bg-emerald-950/20' : 'border-zinc-700 bg-zinc-900'}`}><header><h2 className="text-xl font-bold">{o.order_number}</h2><p>{o.table_number ? `Table ${o.table_number}` : o.fulfillment_type} · {o.status}</p><p className="text-sm text-zinc-400">{new Date(o.created_at).toLocaleTimeString('en-NP', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit' })}</p></header><OrderItems order={o} kitchen/>{o.notes && <p className="rounded bg-amber-950 p-3 text-amber-100">{o.notes}</p>}{session.meta?.permissions.kitchen && nextStatus(o) && <button className={`${primary} w-full`} disabled={command.busy} onClick={() => progress(o)}>{statusLabel[nextStatus(o)!]}</button>}</article>)}</section>{!result.data?.results.length && <p className="py-16 text-center text-zinc-400">{result.loading ? 'Loading kitchen tickets…' : 'No kitchen tickets in this view.'}</p>}<footer className="flex justify-between"><button className={button} disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>{result.data?.count || 0} tickets · Page {page}</span><button className={button} disabled={!result.data || page * 25 >= result.data.count} onClick={() => setPage(page + 1)}>Next</button></footer></main>;
};
