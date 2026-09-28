import React, { useState } from 'react';
import { PosMeta, PosOrder, npr, posPath, posError } from '../../lib/posApi';
import { apiClient } from '../../lib/api';
import { button, primary } from './PosShared';
export const StaffTableGrid: React.FC<{
    outlet: string;
    tables: PosMeta['tables'];
    orders: PosOrder[];
    onSelectTableForNewOrder: (id: number) => void;
    onSelectOngoingOrder: (order: PosOrder) => void;
    onOpenBillingForOrder?: (order: PosOrder) => void;
}> = ({ outlet, tables, orders, onSelectTableForNewOrder, onSelectOngoingOrder, onOpenBillingForOrder }) => {
    const [error, setError] = useState('');
    const open = async (id: number, billing = false) => { try {
        const order = orders.find(o => o.id === id) || await apiClient.get<PosOrder>(posPath(outlet, `${id}/`));
        if (billing)
            onOpenBillingForOrder?.(order);
        else
            onSelectOngoingOrder(order);
    }
    catch (e) {
        setError(posError(e));
    } };
    return <><p role="alert" className="text-red-300">{error}</p><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{!tables.length && <p>No active tables configured for this outlet. Add tables in table management to enable dine-in seating.</p>}{tables.map(t => { const order = orders.find(o => o.id === t.active_order_id); return <article key={t.id} className={`space-y-3 rounded-xl border p-4 ${t.active_order_id ? 'border-amber-500/60 bg-amber-950/20' : 'border-zinc-700 bg-zinc-900'}`}><h3 className="text-xl font-bold">Table {t.table_number}</h3><p className="text-sm text-zinc-400">{t.section} · {t.capacity} seats</p>{t.active_order_id ? <>{order ? <><p>{order.order_number} · {order.status}</p><p>{order.customer_name} · {npr(order.total_payable)}</p><p>Due {npr(order.due_amount)}</p></> : <p>Occupied</p>}<button className={primary} onClick={() => open(t.active_order_id!)}>Add round</button>{onOpenBillingForOrder && <button className={`${button} ml-2`} onClick={() => open(t.active_order_id!, true)}>Bill</button>}</> : <button className={primary} onClick={() => onSelectTableForNewOrder(t.id)}>Start dine-in order</button>}</article>; })}</section></>;
};
