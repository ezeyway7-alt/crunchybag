import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiClient,
  DEFAULT_API_BASE,
  extractErrorMessage,
  ApiError,
} from "./api";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  Order,
  OrderItemSnapshot,
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  SplitPaymentEntry,
} from "../types";
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
  outlet_id: number;
  billed_at: string | null;
  discount_reason: string;
  order_number: string;
  order_source?: string;
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
  inactive_tables: {
    id: number;
    table_number: string;
    capacity: number;
    section: string;
    is_active: boolean;
    active_order_id?: number | null;
  }[];
  table_groups: { id: number; name: string }[];
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
export const npr = (value: string | number | undefined) =>
  Number.isFinite(Number(value))
    ? `NPR ${Number(value).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "Price unavailable";
export const posPath = (outlet: string, path = "") =>
  `/orders/pos/${path}?outlet_id=${encodeURIComponent(outlet)}`;
export const posError = (e: unknown) => extractErrorMessage(e);
export const todayNepal = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const activeOrder = (o: PosOrder) =>
  !["COMPLETED", "CANCELLED"].includes(o.status);

export function posOrderToOrder(
  posOrder: PosOrder,
  outletName?: string,
): Order & { _posOrder: PosOrder } {
  const isPaid = posOrder.status !== "CANCELLED" &&
    (posOrder.settlement === "PAID" || Number(posOrder.due_amount || 0) <= 0);
  const isCredit =
    posOrder.settlement === "CREDIT" || Number(posOrder.credit_amount || 0) > 0;
  let fulfillmentType: FulfillmentType = "TAKEAWAY";
  if (posOrder.fulfillment_type === "DINE_IN") fulfillmentType = "DINE_IN";
  else if (posOrder.fulfillment_type === "DRIVE_THRU") fulfillmentType = "DRIVE_THRU";
  else if (
    posOrder.fulfillment_type === "DELIVERY" ||
    posOrder.fulfillment_type === "ONLINE_DELIVERY"
  )
    fulfillmentType = "DELIVERY";

  let status: OrderStatus = "CONFIRMED";
  if (posOrder.status === "PENDING" || posOrder.status === "ACCEPTED")
    status = "CONFIRMED";
  else if (posOrder.status === "PREPARING") status = "PROCESSING";
  else if (posOrder.status === "READY") status = "READY";
  else if (posOrder.status === "OUT_FOR_DELIVERY") status = "PROCESSING";
  else if (posOrder.status === "COMPLETED") status = "COMPLETED";
  else if (posOrder.status === "CANCELLED") status = "CANCELLED";

  const items: OrderItemSnapshot[] = (posOrder.items || [])
    .filter((item) => !item.is_voided)
    .map((item, idx) => ({
      id: `pos-item-${item.id || idx}`,
      productName: item.product_name,
      variantName: item.variant_name || "",
      modifiersSummary: (item.modifiers || []).map((m) => m.name),
      unitPrice: Number(item.unit_price) || 0,
      quantity: item.quantity,
      lineTotal: Number(item.line_total) || 0,
      roundNumber: item.round_number || 1,
      requiresKitchen: item.requires_kitchen ?? true,
      sentToKitchen: item.kitchen_status !== "WAITING",
      addedLater: (item.round_number || 1) > 1,
      addedAt: posOrder.created_at,
    }));

  const splitPayments: SplitPaymentEntry[] = (posOrder.payments || [])
    .filter((p) => p.status === "SUCCESS")
    .map((p) => ({
      method: fromPosMethod(p.method),
      amount: Number(p.amount) || 0,
      reference: p.reference || undefined,
    }));

  return {
    id: `pos-${posOrder.id}`,
    orderNumber: posOrder.order_number,
    kioskToken: posOrder.order_number,
    outletId: String(posOrder.outlet_id),
    outletName: outletName || "Crunchy Bag",
    customerName: posOrder.customer_name || "Walk-in Guest",
    customerPhone: posOrder.customer_phone || "",
    fulfillmentType,
    orderSource: posOrder.order_source || "POS_COUNTER",
    status,
    items,
    subtotal: Number(posOrder.subtotal) || 0,
    discountAmount: Number(posOrder.discount_amount) || 0,
    vatIncludedAmount: Number(posOrder.vat_included_amount) || 0,
    totalAmount: Number(posOrder.total_payable) || 0,
    createdAt: posOrder.created_at || new Date().toISOString(),
    estimatedPickupTime: "Ready at Counter",
    elapsedSeconds: Math.max(0, Math.floor((Date.now() - Date.parse(posOrder.created_at)) / 1000)),
    notes: posOrder.notes || "",
    paymentMethod: fromPosMethod(posOrder.payment_method),
    paymentStatus: isPaid ? "PAID" : "UNPAID",
    isBilled: isPaid,
    discountReason: posOrder.discount_reason,
    refundStatus: Number(posOrder.refunded_amount) > 0 ? "REFUNDED" : "NONE",
    refundAmount: Number(posOrder.refunded_amount),
    settledAt: isPaid ? posOrder.billed_at || undefined : undefined,
    roundsCount: Math.max(1, ...posOrder.items.map(item => item.round_number || 1)),
    isSplitPayment: splitPayments.length > 1,
    splitPayments: [...splitPayments, ...(Number(posOrder.credit_amount) > 0 ? [{ method: "CREDIT" as PaymentMethod, amount: Number(posOrder.credit_amount) }] : [])],
    tableNumber: posOrder.table_number || undefined,
    deliveryAddress: posOrder.delivery_address || undefined,
    _posOrder: posOrder,
  } as Order & { _posOrder: PosOrder };
}

export function usePosSession() {
  const { authUser, isAuthenticated, isLoading } = useAuth();
  const { currentOutlet } = useApp();
  const outlet = String(currentOutlet?.id ?? "");
  const enabled = !isLoading && isAuthenticated && /^\d+$/.test(outlet);
  const [meta, setMeta] = useState<PosMeta | null>(null);
  const [revision, setRevision] = useState(0);
  const [menuRevision, setMenuRevision] = useState(0);
  const [connection, setConnection] = useState("Connecting");
  const [error, setError] = useState("");
  const refresh = useCallback(() => setRevision((v) => v + 1), []);
  useEffect(() => {
    setMeta(null);
    setError("");
    if (!enabled) {
      setConnection("Sign in and select an outlet");
      return;
    }
    let stopped = false,
      socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let failures = 0,
      connected = false,
      connectedAt = Date.now(),
      lastHeartbeat = Date.now();
    let snapshotRevision: string | undefined, menuVersion: number | undefined;
    const controller = new AbortController();
    const invalidate = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (!stopped) refresh();
      }, 200);
    };
    const scheduleRetry = () => {
      if (stopped) return;
      setConnection("Reconnecting");
      retry = setTimeout(
        connect,
        Math.min(60000, 2000 * 2 ** Math.min(failures++, 5)) +
          Math.random() * 500,
      );
    };
    const connect = async () => {
      try {
        const ticket = await apiClient.post<{ ticket: string; path: string }>(
          posPath(outlet, "socket-ticket/"),
          {},
          { signal: controller.signal },
        );
        if (stopped) return;
        const url = new URL(
          (import.meta as any).env.VITE_POS_WS_ORIGIN || DEFAULT_API_BASE,
          window.location.origin,
        );
        url.protocol = ["https:", "wss:"].includes(url.protocol)
          ? "wss:"
          : "ws:";
        url.pathname = ticket.path;
        url.search = new URLSearchParams({ ticket: ticket.ticket }).toString();
        const current = new WebSocket(url);
        socket = current;
        current.onopen = () => {
          if (stopped) {
            current.close();
            return;
          }
          connectedAt = lastHeartbeat = Date.now();
          setConnection("Live");
          if (connected) {
            invalidate();
            setMenuRevision((v) => v + 1);
          }
          connected = true;
          current.send(JSON.stringify({ type: "ping" }));
        };
        current.onmessage = (message) => {
          if (stopped) return;
          try {
            const event = JSON.parse(message.data);
            if (event.event_type === "CONNECTED") return;
            lastHeartbeat = Date.now();
            if (lastHeartbeat - connectedAt >= 30000) failures = 0;
            if (event.event_type === "HEARTBEAT") {
              if (
                snapshotRevision !== undefined &&
                snapshotRevision !== event.revision
              )
                invalidate();
              snapshotRevision = event.revision;
              if (
                menuVersion !== undefined &&
                menuVersion !== event.menu_revision
              ) {
                setMenuRevision((v) => v + 1);
                invalidate();
              }
              menuVersion = event.menu_revision;
            } else if (event.event_type === "MENU_UPDATED") {
              if (menuVersion !== event.revision) {
                menuVersion = event.revision;
                setMenuRevision((v) => v + 1);
                invalidate();
              }
            } else if (
              event.event_type?.startsWith("ORDER_") &&
              snapshotRevision !== event.event_id
            ) {
              snapshotRevision = event.event_id;
              invalidate();
            }
          } catch {
            current.close();
          }
        };
        current.onerror = () => current.close();
        current.onclose = (event) => {
          if (event.code === 4403) {
            setConnection("Access denied");
            return;
          }
          scheduleRetry();
        };
      } catch (e) {
        if (e instanceof ApiError && [401, 403].includes(e.status)) {
          setConnection("Access denied");
          return;
        }
        scheduleRetry();
      }
    };
    void connect();
    // Only socket heartbeats run on a timer. REST snapshots follow changes/reconnection.
    const heartbeat = setInterval(() => {
      if (socket?.readyState !== WebSocket.OPEN) return;
      if (Date.now() - lastHeartbeat > 65000) socket.close();
      else socket.send(JSON.stringify({ type: "ping" }));
    }, 30000);
    const foreground = () => {
      if (
        document.visibilityState === "visible" &&
        socket?.readyState === WebSocket.OPEN
      )
        socket.send(JSON.stringify({ type: "ping" }));
    };
    document.addEventListener("visibilitychange", foreground);
    window.addEventListener("online", foreground);
    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(retry);
      clearTimeout(debounce);
      clearInterval(heartbeat);
      socket?.close();
      document.removeEventListener("visibilitychange", foreground);
      window.removeEventListener("online", foreground);
    };
  }, [enabled, outlet, authUser?.id, refresh]);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const controller = new AbortController();
    apiClient
      .get<PosMeta>(posPath(outlet, "meta/"), { signal: controller.signal })
      .then((v) => {
        if (live) {
          setMeta(v);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(posError(e));
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [enabled, outlet, authUser?.id, revision]);
  return {
    outlet,
    meta,
    revision,
    menuRevision,
    refresh,
    connection,
    error,
    enabled,
  };
}
export type PosSession = ReturnType<typeof usePosSession>;
export function usePosOrders(
  session: PosSession,
  filters: Record<string, string | number | boolean>,
) {
  const [data, setData] = useState<PosResult | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const query = new URLSearchParams(
    Object.entries(filters).map(([k, v]) => [k, String(v)]),
  ).toString();
  useEffect(() => {
    setData(null);
  }, [session.outlet, query]);
  useEffect(() => {
    if (!session.enabled || !session.meta) return;
    const abort = new AbortController();
    let live = true;
    setLoading(true);
    const timer = setTimeout(
      () =>
        apiClient
          .get<PosResult>(`${posPath(session.outlet)}&${query}`, {
            signal: abort.signal,
          })
          .then((v) => {
            if (live) {
              setData(v);
              setError("");
            }
          })
          .catch((e) => {
            if (live) setError(posError(e));
          })
          .finally(() => {
            if (live) setLoading(false);
          }),
      150,
    );
    return () => {
      live = false;
      clearTimeout(timer);
      abort.abort();
    };
  }, [
    session.enabled,
    !!session.meta,
    session.outlet,
    session.revision,
    query,
  ]);
  return { data, error, loading };
}
export function usePosCommand(session: PosSession) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [hasPending, setHasPending] = useState(false);
  const { authUser } = useAuth();
  const storageKey = `pos-pending:${authUser?.id}:${session.outlet}`;
  type Pending = {
    signature: string;
    key: string;
    path: string;
    body: unknown;
  };
  const pending = useRef<Pending | null>(null),
    lock = useRef(false);
  useEffect(() => {
    try {
      pending.current = JSON.parse(
        sessionStorage.getItem(storageKey) || "null",
      );
    } catch {
      pending.current = null;
    }
    setHasPending(!!pending.current);
  }, [storageKey]);
  const run = async (
    path: string,
    body: unknown,
  ): Promise<PosOrder | undefined> => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const signature = JSON.stringify([session.outlet, path, body]);
    try {
      pending.current = JSON.parse(
        sessionStorage.getItem(storageKey) || "null",
      );
      if (pending.current && pending.current.signature !== signature)
        throw new Error(
          "The previous request has an uncertain outcome. Recover that action before starting another.",
        );
      if (!pending.current)
        pending.current = { signature, key: crypto.randomUUID(), path, body };
      sessionStorage.setItem(storageKey, JSON.stringify(pending.current));
      const result = await apiClient.post<PosOrder>(
        posPath(session.outlet, path),
        body,
        { headers: { "Idempotency-Key": pending.current.key } },
      );
      pending.current = null;
      setHasPending(false);
      sessionStorage.removeItem(storageKey);
      session.refresh();
      return result;
    } catch (e) {
      if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
        pending.current = null;
        sessionStorage.removeItem(storageKey);
      }
      setHasPending(!!pending.current);
      setError(posError(e));
      if (e instanceof ApiError && e.status === 409) session.refresh();
      return undefined;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const recover = () =>
    pending.current
      ? run(pending.current.path, pending.current.body)
      : Promise.resolve(undefined);
  return { run, recover, hasPending, busy, error, setError };
}
export async function printPosReceipt(outlet: string, receiptId: number) {
  // Open synchronously during the click so browsers do not block the print window.
  const popup = window.open("", "_blank", "width=420,height=720");
  if (!popup) throw new Error("Allow popups to print this receipt.");
  popup.document.title = "Loading receipt";
  try {
    const r = await apiClient.get<any>(
      posPath(outlet, `receipts/${receiptId}/`),
    );
    const s = r.snapshot;
    const lines = [
      s.seller.name,
      s.seller.outlet,
      s.seller.address,
      s.seller.pan ? `PAN: ${s.seller.pan}` : "",
      `${r.kind} ${r.number}`,
      s.order_number,
      new Date(r.created_at).toLocaleString(),
      `${s.customer_name} ${s.customer_phone}`,
      s.table_number ? `Table ${s.table_number}` : s.fulfillment_type,
      "--------------------------------",
      ...s.items
        .filter((i: PosItem) => !i.is_voided)
        .flatMap((i: PosItem) => [
          `${i.quantity} × ${i.product_name} ${i.variant_name}  ${npr(i.line_total)}`,
          ...i.modifiers.map((m) => `  + ${m.name}`),
          ...i.combo_components.map(
            (c) => `  ${c.quantity} × ${c.product_name} ${c.variant_name}`,
          ),
          i.item_notes ? `  Note: ${i.item_notes}` : "",
        ]),
      "--------------------------------",
      `Subtotal: ${npr(s.subtotal)}`,
      `Discount: ${npr(s.discount_amount)}`,
      `Service charge: ${npr(s.service_charge_amount)}`,
      `Rounding savings: ${npr(s.cash_round_down_savings)}`,
      `Included VAT: ${npr(s.vat_included_amount)}`,
      `TOTAL: ${npr(s.total_payable)}`,
      `Paid: ${npr(s.paid_amount)}`,
      `Due: ${npr(s.due_amount)}`,
      `Khata: ${npr(s.credit_amount)}`,
      `Refunded: ${npr(s.refunded_amount)}`,
      ...s.payments.map(
        (p: any) => `${p.status} ${p.method}: ${npr(p.amount)} ${p.reference}`,
      ),
      s.notes,
    ];
    const pre = popup.document.createElement("pre");
    pre.style.cssText =
      "font:12px monospace;white-space:pre-wrap;max-width:76mm;margin:0 auto";
    pre.textContent = lines.filter(Boolean).join("\n");
    popup.document.body.replaceChildren(pre);
    popup.document.title = r.number;
    popup.focus();
    popup.print();
  } catch (e) {
    popup.close();
    throw e;
  }
}

export const toPosMethod = (method: string) => ({ CASH_ON_PICKUP: 'CASH', CASH_ON_DELIVERY: 'CASH', PAY_AT_COUNTER: 'CASH', FONEPAY_QR: 'FONEPAY' }[method] || method);
export const fromPosMethod = (method: string): PaymentMethod => ({ CASH: 'CASH_ON_PICKUP', FONEPAY: 'FONEPAY_QR' }[method] || method) as PaymentMethod;
export const backendOrder = (order?: Order | null): PosOrder | undefined => (order as (Order & { _posOrder?: PosOrder }) | null)?._posOrder;
