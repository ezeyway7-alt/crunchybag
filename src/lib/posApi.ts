import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, DEFAULT_API_BASE, extractErrorMessage, ApiError } from './api';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Order, OrderItemSnapshot, FulfillmentType, OrderStatus, PaymentMethod, SplitPaymentEntry } from '../types';
export interface PosLine {
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    modifier_option_ids: string[];
    item_notes?: string;
    combo_selections?: PosLine[];
}
export interface PosItem {
    id: number;
    product_id: string;
    product_name: string;
    variant_name: string;
    quantity: number;
    unit_price: string;
    line_total: string;
    requires_kitchen: boolean;
    kitchen_status: string;
    round_number: number;
    item_notes: string;
    is_voided: boolean;
    combo_components: {
        product_name: string;
        variant_name: string;
        quantity: number;
        requires_kitchen: boolean;
        modifiers: {
            name: string;
        }[];
    }[];
    modifiers: {
        name: string;
    }[];
}
export interface PosOrder {
    id: number;
    order_number: string;
    version: number;
    status: string;
    customer_name: string;
    customer_phone: string;
    fulfillment_type: string;
    table_id: number | null;
    table_number: string | null;
    created_at: string;
    notes: string;
    delivery_address: string;
    subtotal: string;
    discount_amount: string;
    service_charge_amount: string;
    vat_included_amount: string;
    cash_round_down_savings: string;
    total_payable: string;
    paid_amount: string;
    credit_amount: string;
    refunded_amount: string;
    due_amount: string;
    unallocated_due: string;
    settlement: string;
    payment_method: string;
    items: PosItem[];
    payments: {
        id: string;
        amount: string;
        method: string;
        status: string;
        reference: string;
    }[];
    receipts: {
        id: number;
        number: string;
        kind: string;
    }[];
}
export interface PosMeta {
    outlet_id: number;
    outlet_name: string;
    tables: {
        id: number;
        table_number: string;
        capacity: number;
        section: string;
        active_order_id: number | null;
    }[];
    permissions: Record<string, boolean>;
    payment_methods: string[];
    fulfillment_modes: string[];
    accepting_orders: boolean;
}
export interface PosResult {
    results: PosOrder[];
    count: number;
    page: number;
    page_size: number;
    summary: Record<string, any>;
    status_counts: Record<string, number>;
}
export interface Tender {
    method: string;
    amount: string;
    reference: string;
}
export const npr = (value: string | number | undefined) => Number.isFinite(Number(value)) ? `NPR ${Number(value).toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Price unavailable';
export const posPath = (outlet: string, path = '') => `/orders/pos/${path}?outlet_id=${encodeURIComponent(outlet)}`;
export const posError = (e: unknown) => extractErrorMessage(e);
export const todayNepal = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const activeOrder = (o: PosOrder) => !['COMPLETED', 'CANCELLED'].includes(o.status);

export function posOrderToOrder(posOrder: PosOrder, outletName?: string): Order & { _posOrder: PosOrder } {
    const isPaid = posOrder.settlement === 'PAID' || Number(posOrder.due_amount || 0) <= 0;
    const isCredit = posOrder.settlement === 'CREDIT' || Number(posOrder.credit_amount || 0) > 0;
    let fulfillmentType: FulfillmentType = 'TAKEAWAY';
    if (posOrder.fulfillment_type === 'DINE_IN') fulfillmentType = 'DINE_IN';
    else if (posOrder.fulfillment_type === 'DELIVERY' || posOrder.fulfillment_type === 'ONLINE_DELIVERY') fulfillmentType = 'DELIVERY';

    let status: OrderStatus = 'CONFIRMED';
    if (posOrder.status === 'PENDING' || posOrder.status === 'ACCEPTED') status = 'CONFIRMED';
    else if (posOrder.status === 'PREPARING') status = 'PROCESSING';
    else if (posOrder.status === 'READY') status = 'READY';
    else if (posOrder.status === 'OUT_FOR_DELIVERY') status = 'READY';
    else if (posOrder.status === 'COMPLETED') status = 'COMPLETED';
    else if (posOrder.status === 'CANCELLED') status = 'CANCELLED';

    const items: OrderItemSnapshot[] = (posOrder.items || []).map((item, idx) => ({
        id: `pos-item-${item.id || idx}`,
        productName: item.product_name,
        variantName: item.variant_name || '',
        modifiersSummary: (item.modifiers || []).map(m => m.name),
        unitPrice: Number(item.unit_price) || 0,
        quantity: item.quantity,
        lineTotal: Number(item.line_total) || 0,
        roundNumber: item.round_number || 1,
        requiresKitchen: item.requires_kitchen ?? true,
        sentToKitchen: item.requires_kitchen ?? true,
        addedLater: (item.round_number || 1) > 1,
        addedAt: posOrder.created_at,
    }));

    const splitPayments: SplitPaymentEntry[] = (posOrder.payments || []).map(p => ({
        method: (p.method === 'CASH' ? 'CASH_ON_PICKUP' : p.method) as PaymentMethod,
        amount: Number(p.amount) || 0,
        reference: p.reference || undefined,
    }));

    return {
        id: String(posOrder.id),
        orderNumber: posOrder.order_number,
        kioskToken: posOrder.receipts?.find(r => r.kind === 'TOKEN')?.number || `TK-${posOrder.id}`,
        outletId: String(posOrder.id),
        outletName: outletName || 'Crunchy Bag',
        customerName: posOrder.customer_name || 'Walk-in Guest',
        customerPhone: posOrder.customer_phone || '',
        fulfillmentType,
        orderSource: 'POS_COUNTER',
        status,
        items,
        subtotal: Number(posOrder.subtotal) || 0,
        discountAmount: Number(posOrder.discount_amount) || 0,
        vatIncludedAmount: Number(posOrder.vat_included_amount) || 0,
        totalAmount: Number(posOrder.total_payable) || 0,
        createdAt: posOrder.created_at || new Date().toISOString(),
        estimatedPickupTime: 'Ready at Counter',
        elapsedSeconds: 0,
        notes: posOrder.notes || '',
        paymentMethod: (posOrder.payment_method === 'CASH' ? 'CASH_ON_PICKUP' : posOrder.payment_method) as PaymentMethod,
        paymentStatus: isPaid ? 'PAID' : 'UNPAID',
        isBilled: isPaid || isCredit,
        settledAt: isPaid ? posOrder.created_at : undefined,
        isSplitPayment: splitPayments.length > 1,
        splitPayments: splitPayments.length > 0 ? splitPayments : undefined,
        tableNumber: posOrder.table_number ? (posOrder.table_number.startsWith('T-') ? posOrder.table_number : `T-${posOrder.table_number}`) : undefined,
        deliveryAddress: posOrder.delivery_address || undefined,
        _posOrder: posOrder,
    } as Order & { _posOrder: PosOrder };
}
export function usePosSession() {
    const { authUser, isAuthenticated, isLoading } = useAuth();
    const { currentOutlet } = useApp();
    const outlet = String(currentOutlet?.id ?? '');
    const enabled = !isLoading && isAuthenticated && /^\d+$/.test(outlet);
    const [meta, setMeta] = useState<PosMeta | null>(null);
    const [revision, setRevision] = useState(0);
    const [menuRevision, setMenuRevision] = useState(0);
    const [connection, setConnection] = useState('Connecting');
    const [error, setError] = useState('');
    const refresh = useCallback(() => setRevision(v => v + 1), []);
    useEffect(() => {
        setMeta(null);
        setError('');
        if (!enabled) {
            setConnection('Authentication or outlet required');
            return;
        }
        let stopped = false, socket: WebSocket | undefined, retry: ReturnType<typeof setTimeout> | undefined, debounce: ReturnType<typeof setTimeout> | undefined;
        const controller = new AbortController();
        apiClient.get<PosMeta>(posPath(outlet, 'meta/'), { signal: controller.signal }).then(v => { if (!stopped)
            setMeta(v); }).catch(e => { if (!stopped)
            setError(posError(e)); });
        let failures = 0, lastHeartbeat = Date.now(), snapshotRevision = '', menuVersion = -1;
        const invalidate = () => { clearTimeout(debounce); debounce = setTimeout(refresh, 150); };
        const connect = async () => {
            try {
                const ticket = await apiClient.post<{
                    ticket: string;
                    path: string;
                }>(posPath(outlet, 'socket-ticket/'), {});
                if (stopped)
                    return;
                const url = new URL((import.meta as any).env.VITE_POS_WS_ORIGIN || DEFAULT_API_BASE, window.location.origin);
                url.protocol = ['https:', 'wss:'].includes(url.protocol) ? 'wss:' : 'ws:';
                url.pathname = ticket.path;
                url.search = new URLSearchParams({ ticket: ticket.ticket }).toString();
                socket = new WebSocket(url);
                socket.onopen = () => { failures = 0; lastHeartbeat = Date.now(); setConnection('Live'); refresh(); setMenuRevision(v => v + 1); socket?.send(JSON.stringify({ type: 'ping' })); };
                socket.onmessage = (message) => { lastHeartbeat = Date.now(); try {
                    const event = JSON.parse(message.data);
                    if (event.event_type === 'HEARTBEAT') {
                        if (snapshotRevision !== event.revision) {
                            snapshotRevision = event.revision;
                            invalidate();
                        }
                        if (menuVersion !== event.menu_revision) {
                            menuVersion = event.menu_revision;
                            setMenuRevision(v => v + 1);
                        }
                    }
                    else if (event.event_type === 'MENU_UPDATED') {
                        setMenuRevision(v => v + 1);
                    }
                    else {
                        invalidate();
                    }
                }
                catch {
                    socket?.close();
                } };
                socket.onerror = () => socket?.close();
                socket.onclose = () => { if (!stopped) {
                    setConnection('Reconnecting · changes will sync on connection');
                    retry = setTimeout(connect, Math.min(30000, 1000 * 2 ** failures++) + Math.random() * 500);
                } };
            }
            catch {
                if (!stopped) {
                    setConnection('Live connection unavailable · reconnecting');
                    retry = setTimeout(connect, 15000);
                }
            }
        };
        void connect();
        // WebSocket heartbeats detect missed events without periodically polling order REST APIs.
        const poll = setInterval(() => { if (socket?.readyState === WebSocket.OPEN) {
            if (Date.now() - lastHeartbeat > 65000)
                socket.close();
            else
                socket.send(JSON.stringify({ type: 'ping' }));
        } }, 30000);
        const visible = () => { if (document.visibilityState === 'visible')
            refresh(); };
        window.addEventListener('online', visible);
        document.addEventListener('visibilitychange', visible);
        return () => { stopped = true; controller.abort(); clearTimeout(retry); clearTimeout(debounce); clearInterval(poll); socket?.close(); window.removeEventListener('online', visible); document.removeEventListener('visibilitychange', visible); };
    }, [enabled, outlet, authUser?.id, refresh]);
    useEffect(() => {
        if (!enabled)
            return;
        let live = true;
        const controller = new AbortController();
        apiClient.get<PosMeta>(posPath(outlet, 'meta/'), { signal: controller.signal }).then(v => { if (live) {
            setMeta(v);
            setError('');
        } }).catch(e => { if (live)
            setError(posError(e)); });
        return () => { live = false; controller.abort(); };
    }, [enabled, outlet, revision]);
    return { outlet, meta, revision, menuRevision, refresh, connection, error, enabled };
}
export type PosSession = ReturnType<typeof usePosSession>;
export function usePosOrders(session: PosSession, filters: Record<string, string | number | boolean>) {
    const [data, setData] = useState<PosResult | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false);
    const query = new URLSearchParams(Object.entries(filters).map(([k, v]) => [k, String(v)])).toString();
    useEffect(() => {
        setData(null);
    }, [session.outlet, query]);
    useEffect(() => {
        if (!session.enabled || !session.meta)
            return;
        const abort = new AbortController();
        let live = true;
        setLoading(true);
        const timer = setTimeout(() => apiClient.get<PosResult>(`${posPath(session.outlet)}&${query}`, { signal: abort.signal }).then(v => { if (live) {
            setData(v);
            setError('');
        } }).catch(e => { if (live)
            setError(posError(e)); }).finally(() => { if (live)
            setLoading(false); }), 150);
        return () => { live = false; clearTimeout(timer); abort.abort(); };
    }, [session.enabled, !!session.meta, session.outlet, session.revision, query]);
    return { data, error, loading };
}
export function usePosCommand(session: PosSession) {
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [hasPending, setHasPending] = useState(false);
    const { authUser } = useAuth();
    const storageKey = `pos-pending:${authUser?.id}:${session.outlet}`;
    type Pending = {
        signature: string;
        key: string;
        path: string;
        body: unknown;
    };
    const pending = useRef<Pending | null>(null), lock = useRef(false);
    useEffect(() => { try {
        pending.current = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    }
    catch {
        pending.current = null;
    } setHasPending(!!pending.current); }, [storageKey]);
    const run = async (path: string, body: unknown): Promise<PosOrder | undefined> => {
        if (lock.current)
            return;
        lock.current = true;
        setBusy(true);
        setError('');
        const signature = JSON.stringify([session.outlet, path, body]);
        try {
            if (pending.current && pending.current.signature !== signature) {
                if (pending.current.path !== path)
                    throw new Error('The previous request has an uncertain outcome. Retry that action before starting another.');
                // Replaying the original request is safe even if live updates changed its version.
                body = pending.current.body;
            }
            if (!pending.current)
                pending.current = { signature, key: crypto.randomUUID(), path, body };
            sessionStorage.setItem(storageKey, JSON.stringify(pending.current));
            const result = await apiClient.post<PosOrder>(posPath(session.outlet, path), body, { headers: { 'Idempotency-Key': pending.current.key } });
            pending.current = null;
            setHasPending(false);
            sessionStorage.removeItem(storageKey);
            session.refresh();
            return result;
        }
        catch (e) {
            if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
                pending.current = null;
                sessionStorage.removeItem(storageKey);
            }
            setHasPending(!!pending.current);
            setError(posError(e));
            session.refresh();
            return undefined;
        }
        finally {
            lock.current = false;
            setBusy(false);
        }
    };
    const recover = () => pending.current ? run(pending.current.path, pending.current.body) : Promise.resolve(undefined);
    return { run, recover, hasPending, busy, error, setError };
}
export async function printPosReceipt(outlet: string, receiptId: number) {
    // Open synchronously during the click so browsers do not block the print window.
    const popup = window.open('', '_blank', 'width=420,height=720');
    if (!popup)
        throw new Error('Allow popups to print this receipt.');
    popup.document.title = 'Loading receipt';
    try {
        const r = await apiClient.get<any>(posPath(outlet, `receipts/${receiptId}/`));
        const s = r.snapshot;
        const lines = [s.seller.name, s.seller.outlet, s.seller.address, s.seller.pan ? `PAN: ${s.seller.pan}` : '', `${r.kind} ${r.number}`, s.order_number, new Date(r.created_at).toLocaleString(), `${s.customer_name} ${s.customer_phone}`, s.table_number ? `Table ${s.table_number}` : s.fulfillment_type, '--------------------------------',
            ...s.items.filter((i: PosItem) => !i.is_voided).flatMap((i: PosItem) => [`${i.quantity} × ${i.product_name} ${i.variant_name}  ${npr(i.line_total)}`, ...i.modifiers.map(m => `  + ${m.name}`), ...i.combo_components.map(c => `  ${c.quantity} × ${c.product_name} ${c.variant_name}`), i.item_notes ? `  Note: ${i.item_notes}` : '']),
            '--------------------------------', `Subtotal: ${npr(s.subtotal)}`, `Discount: ${npr(s.discount_amount)}`, `Service charge: ${npr(s.service_charge_amount)}`, `Rounding savings: ${npr(s.cash_round_down_savings)}`, `Included VAT: ${npr(s.vat_included_amount)}`, `TOTAL: ${npr(s.total_payable)}`, `Paid: ${npr(s.paid_amount)}`, `Due: ${npr(s.due_amount)}`, `Khata: ${npr(s.credit_amount)}`, `Refunded: ${npr(s.refunded_amount)}`, ...s.payments.map((p: any) => `${p.status} ${p.method}: ${npr(p.amount)} ${p.reference}`), s.notes];
        const pre = popup.document.createElement('pre');
        pre.style.cssText = 'font:12px monospace;white-space:pre-wrap;max-width:76mm;margin:0 auto';
        pre.textContent = lines.filter(Boolean).join('\n');
        popup.document.body.replaceChildren(pre);
        popup.document.title = r.number;
        popup.focus();
        popup.print();
    }
    catch (e) {
        popup.close();
        throw e;
    }
}
