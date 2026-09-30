import {useOutletEvents} from "../../lib/useOutletEvents";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Flame,
  Clock,
  Check,
  Maximize2,
  Volume2,
  VolumeX,
  Search,
  RotateCcw,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  AlertTriangle,
  ChefHat,
  Package,
  CheckCircle2,
  Bell,
  Grid,
  Columns,
  SlidersHorizontal,
  X,
  Printer,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { KdsColumn, KdsTicket, FulfillmentType, Order } from "../../types";
import { apiClient, extractErrorMessage } from "../../lib/api";
import { formatTimer } from "../../lib/utils";
import { SkeletonTicketGrid } from "../common/Skeleton";

// Subtle Web Audio chime for kitchen feedback
const playKitchenChime = (type: "advance" | "complete" | "toggle" | "bell") => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "advance") {
      // Crisp 2-tone pleasant kitchen notification
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "complete") {
      // Success tone (C5 -> E5 -> G5)
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "bell") {
      // Audible ding/bell alert for order pickup call
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.05); // D6
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else {
      // Tap toggle
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch {
    // AudioContext blocked or not supported
  }
};

/**
 * Constructs the persistent WebSocket URL for the KDS Active Ticket Stream
 * Endpoint: ws://crunchybag.com/ws/outlets/{outlet_id}/kitchen/ (or wss:// in production)
 */
function getKitchenWebSocketUrl(outletId: string | number): string {
  if (typeof window === "undefined") {
    return `wss://crunchybag.com/ws/outlets/${outletId}/kitchen/`;
  }
  const isHttps = window.location.protocol === "https:";
  const protocol = isHttps ? "wss:" : "ws:";
  const isLocal =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  // In local dev, connect directly to production backend WS stream
  if (isLocal) {
    return `wss://crunchybag.com/ws/outlets/${encodeURIComponent(outletId)}/kitchen/`;
  }
  return `${protocol}//${window.location.host}/ws/outlets/${encodeURIComponent(outletId)}/kitchen/`;
}

// Backend ticket response types from GET /api/v1/orders/kitchen/me/
export interface BackendKitchenItemModifier {
  group_name?: string;
  option_name?: string;
  name?: string;
}

export interface BackendKitchenItem {
  id: number | string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  requires_kitchen?: boolean;
  kitchen_status?: string;
  round_number?: number;
  item_notes?: string;
  modifiers?: (BackendKitchenItemModifier | string)[];
  combo_components?: any[];
}

export interface BackendKitchenTicket {
  id: number | string;
  order_number: string;
  status: string;
  fulfillment_type: FulfillmentType;
  outlet_id?: number | string;
  version?: number;
  table_number?: string | null;
  round_number?: number;
  created_at?: string;
  notes?: string;
  customer_name?: string;
  kiosk_token?: string;
  items: BackendKitchenItem[];
}

export const KDSPortal: React.FC = () => {
  const {
    kdsSoundEnabled,
    setKdsSoundEnabled,
    currentOutlet,
    addToast,
    isLoadingSkeleton,
    kdsTickets: appKdsTickets,
    bumpKdsTicket: appBumpKdsTicket,
    orders: appOrders,
    triggerKitchenCall: appTriggerKitchenCall,
  } = useApp();

  const { authUser, authOutlet, isAuthenticated, openLoginModal } = useAuth();
  const effectiveOutletId = authOutlet?.id || currentOutlet?.id || "1";
  const [authErrorNotice, setAuthErrorNotice] = useState<string | null>(null);

  // 1-second live clock for ticket timers
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real backend tickets state
  const [serverTickets, setServerTickets] = useState<BackendKitchenTicket[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * 1. REST API: Fetch Active Kitchen Preparation Tickets
   * GET /api/v1/orders/kitchen/me/?outlet_id=<outlet_id>
   * Returns active kitchen preparation orders (PENDING, ACCEPTED, PREPARING, READY)
   * Non-kitchen items are automatically excluded by backend
   */
  const fetchGeneration = useRef(0);
  const fetchKitchenTickets = useCallback(async (isSilent = false) => {
    const generation=++fetchGeneration.current;
    if(!isSilent)setIsSyncing(true);
    try {
      const tickets: BackendKitchenTicket[]=[];
      for(let page=1;;page++) {
        const data=await apiClient.get<any>(`/orders/pos/?kitchen=true&outlet_id=${encodeURIComponent(effectiveOutletId)}&page_size=100&page=${page}`);
        tickets.push(...data.results);
        if(!data.results.length || tickets.length>=data.count)break;
      }
      if(generation!==fetchGeneration.current)return;
      setServerTickets(tickets);setLastSyncTime(new Date());setAuthErrorNotice(null);
    }catch(error:any){if(generation===fetchGeneration.current)setAuthErrorNotice(error.message || 'Unable to sync kitchen orders.');}
    finally{if(generation===fetchGeneration.current){setIsSyncing(false);setIsInitialLoading(false);}}
  },[effectiveOutletId]);
  useEffect(()=>{setServerTickets([]);void fetchKitchenTickets();return()=>{fetchGeneration.current++;};},[fetchKitchenTickets]);
  const kitchenLive=useOutletEvents(String(effectiveOutletId),true,()=>void fetchKitchenTickets(true),event=>{
    if(['ORDER_CREATE','ORDER_APPEND'].includes(event.event_type) && kdsSoundEnabled)playKitchenChime('advance');
  });
  useEffect(()=>setIsWsConnected(kitchenLive),[kitchenLive]);

  // Map backend tickets to KDS Ticket display format
  const kdsTickets: (KdsTicket & { orderNotes?: string })[] = useMemo(() => {
    // If backend tickets exist from GET /api/v1/orders/kitchen/me/, use them
    if (serverTickets && serverTickets.length > 0) {
      return serverTickets.map((t) => {
        // Derive clean KDS column (PENDING/ACCEPTED -> QUEUED, PREPARING -> PREPARING, READY -> READY)
        const statusUpper = (t.status || "").toUpperCase();
        let column: KdsColumn = "QUEUED";
        if (statusUpper === "READY") {
          column = "READY";
        } else if (statusUpper === "PREPARING" || statusUpper === "COOKING") {
          column = "PREPARING";
        } else {
          column = "QUEUED";
        }

        // Token Slip number
        const tokenStr = t.order_number;

        // Calculate elapsed seconds from created_at
        const elapsedSec = t.created_at
          ? Math.max(0, Math.floor((now - Date.parse(t.created_at)) / 1000))
          : 0;

        // Map items: filter requires_kitchen !== false
        const kitchenItems = (t.items || [])
          .filter((i) => i.requires_kitchen !== false)
          .map((i) => {
            const modifiersList = (i.modifiers || [])
              .map((m: any) => {
                if (typeof m === "string") return m;
                if (m && typeof m === "object") return m.option_name || m.name || "";
                return "";
              })
              .filter(Boolean);

            if (i.item_notes && i.item_notes.trim()) {
              modifiersList.push(`Note: ${i.item_notes.trim()}`);
            }

            return {
              id: String(i.id),
              productName: i.product_name,
              variantName: i.variant_name || "",
              quantity: i.quantity || 1,
              modifiers: modifiersList,
            };
          });

        return {
          id: String(t.id),
          orderNumber: t.order_number,
          outletId: String(t.outlet_id || effectiveOutletId),
          station: "",
          fulfillmentType: t.fulfillment_type || "TAKEAWAY",
          column,
          items: kitchenItems,
          elapsedSeconds: elapsedSec,
          customerName:
            t.customer_name ||
            (t.fulfillment_type === "DINE_IN"
              ? t.table_number || "Dine-In Guest"
              : "Takeaway Guest"),
          tableNumber: t.table_number || undefined,
          kioskToken: tokenStr,
          roundNumber: t.round_number || 1,
          isAddOnRound: (t.round_number || 1) > 1,
          orderNotes: t.notes || "",
        };
      });
    }

    // Pure real queue: When 0 orders are waiting, return empty list (No fake mock tickets)
    return [];
  }, [serverTickets, now, effectiveOutletId]);

  const orders: Order[] = useMemo(() => {
    return appOrders || [];
  }, [appOrders]);

  /**
   * 3. Transition Kitchen Ticket Status
   * Universal Endpoint: POST /api/v1/orders/<order_id>/transition/?outlet_id=<outlet_id>
   * Status Pipeline: PENDING -> ACCEPTED -> PREPARING -> READY -> COMPLETED
   * Automatically broadcasts WebSocket notification to KDS screens and TV displays
   */
  const handleBump = async (ticketId: string, currentColumn: KdsColumn) => {
    const ticket = serverTickets.find((t) => String(t.id) === ticketId);
    const nextStatus =
      currentColumn === "QUEUED"
        ? (ticket?.status === "PENDING" ? "ACCEPTED" : "PREPARING")
        : currentColumn === "PREPARING"
        ? "READY"
        : ticket?.fulfillment_type === "DELIVERY" ? "OUT_FOR_DELIVERY" : "COMPLETED";

    // Immediate sound feedback
    if (kdsSoundEnabled) {
      playKitchenChime(nextStatus === "READY" ? "complete" : "advance");
    }

    // Resolve accurate outlet_id and version for this ticket
    const appOrder = appOrders.find(
      (o) => String(o.id) === ticketId || o.orderNumber === ticket?.order_number
    );
    const currentVersion = ticket?.version || (appOrder as any)?.version || 1;

    // Optimistic local state update for zero latency
    setServerTickets((prev) =>
      prev
        .map((t) =>
          String(t.id) === ticketId
            ? (nextStatus === "COMPLETED" || nextStatus === "OUT_FOR_DELIVERY")
              ? null
              : { ...t, status: nextStatus, version: currentVersion + 1 }
            : t
        )
        .filter(Boolean) as BackendKitchenTicket[]
    );

    const ticketOutletId = String(
      ticket?.outlet_id ||
      appOrder?.outletId ||
      effectiveOutletId ||
      currentOutlet?.id ||
      authOutlet?.id ||
      "1"
    );
    const numericOutletId = parseInt(ticketOutletId, 10) || 1;

    try {
      // Primary: POS staff command transition (POST /api/v1/orders/pos/<order_id>/transition/?outlet_id=<outlet_id>)
      try {
        await apiClient.post(
          `/orders/pos/${ticketId}/transition/?outlet_id=${encodeURIComponent(ticketOutletId)}`,
          {
            outlet_id: numericOutletId,
            version: currentVersion,
            status: nextStatus,
            to_status: nextStatus,
            reason: `Kitchen transitioned order to ${nextStatus}`,
          },
          {headers: {"Idempotency-Key": `kds-transition:${ticketOutletId}:${ticketId}:${currentVersion}:${nextStatus}`}}
        );
      } catch (posErr) {
        if ((posErr as any)?.status !== 404) throw posErr;
        // Fallback: Universal KDS transition endpoint (POST /api/v1/orders/<order_id>/transition/?outlet_id=<outlet_id>)
        await apiClient.post(
          `/orders/${ticketId}/transition/?outlet_id=${encodeURIComponent(ticketOutletId)}`,
          {
            outlet_id: numericOutletId,
            to_status: nextStatus,
            status: nextStatus,
            version: currentVersion,
            notes: `Kitchen transitioned order to ${nextStatus}`,
          }
        );
      }

      // Refresh to confirm with server
      void fetchKitchenTickets(true);
    } catch (err: any) {
      console.warn("Failed transition API call:", err);
      // If server transition failed, re-fetch to restore accurate state
      void fetchKitchenTickets(true);
      addToast({
        title: "Status update warning",
        description: extractErrorMessage(err) || "Failed to update ticket status on server.",
        type: "error",
      });
    }
  };

  /**
   * 4. Audio Bell / Call Order Notification
   * Method & Route: POST /api/v1/orders/pos/<order_id>/call/?outlet_id=<outlet_id>
   * Triggers audible ding/bell alert on KDS and Customer TV Waiting Area screen
   */
  const triggerKitchenCall = async (ticket: KdsTicket & { orderNotes?: string }) => {
    if (kdsSoundEnabled) playKitchenChime("bell");

    const targetOutletId = String(
      ticket.outletId || effectiveOutletId || currentOutlet?.id || authOutlet?.id || "1"
    );
    const numericOutletId = parseInt(targetOutletId, 10) || 1;

    try {
      await apiClient.post(
        `/orders/pos/${ticket.id}/call/?outlet_id=${encodeURIComponent(targetOutletId)}`,
        { version: serverTickets.find(row=>String(row.id)===String(ticket.id))?.version, outlet_id: numericOutletId },
        {
          headers: {
            "Idempotency-Key": `call-${ticket.id}-${Date.now()}`,
          },
        }
      );

      addToast({
        title: "Kitchen Bell Rung",
        description: `Called ${ticket.kioskToken || ticket.orderNumber} for collection.`,
        type: "success",
      });
    } catch (err: any) {
      addToast({title:'Call could not be sent',description:err.message || 'Refresh the order status and retry.',type:'error'});
      void fetchKitchenTickets(true);
    }
  };

  /**
   * 5. Physical Thermal Kitchen Runner Slip Printing
   * Formats a clean 80mm/58mm thermal ticket snapshot
   */
  const handlePrintKitchenSlip = (ticket: KdsTicket & { orderNotes?: string }) => {
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kitchen Slip - #${ticket.orderNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: 13px; padding: 12px; width: 280px; margin: 0 auto; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .token { font-size: 26px; font-weight: 900; margin: 4px 0; }
          .divider { border-top: 1px dashed #333; margin: 8px 0; }
          .item { margin: 6px 0; }
          .mod { font-size: 11px; padding-left: 12px; color: #444; }
        </style>
      </head>
      <body>
        <div class="center bold">CRUNCHY KITCHEN RUNNER</div>
        <div class="center token">${ticket.kioskToken || ticket.orderNumber}</div>
        <div class="center bold">${ticket.fulfillmentType} ${ticket.tableNumber ? "• " + ticket.tableNumber : ""}</div>
        <div class="center">${new Date().toLocaleTimeString()}</div>
        <div class="divider"></div>
        <div>Order: #${ticket.orderNumber} ${ticket.isAddOnRound ? "(Round " + (ticket.roundNumber || 2) + ")" : ""}</div>
        <div>Guest: ${ticket.customerName || "Walk-in"}</div>
        <div class="divider"></div>
        ${ticket.items
          .map(
            (it) => `
          <div class="item">
            <div class="bold">${it.quantity}x ${it.productName} ${it.variantName ? "(" + it.variantName + ")" : ""}</div>
            ${it.modifiers.map((m) => `<div class="mod">• ${m}</div>`).join("")}
          </div>
        `
          )
          .join("")}
        ${ticket.orderNotes ? `<div class="divider"></div><div class="bold">NOTE: ${ticket.orderNotes}</div>` : ""}
        <div class="divider"></div>
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Queue stage filter (All, Incoming, Cooking, Ready)
  const [activeStage, setActiveStage] = useState<KdsColumn | "ALL">("ALL");
  const [isStageLoading, setIsStageLoading] = useState(false);

  const handleStageChange = (stage: KdsColumn | "ALL") => {
    if (stage === activeStage) return;
    setIsStageLoading(true);
    setActiveStage(stage);
    setTimeout(() => setIsStageLoading(false), 120);
  };

  // Fulfillment filter (All, Dine-in, Takeaway, Delivery)
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentType | "ALL">("ALL");

  // Search by token number, table, or order #
  const [searchQuery, setSearchQuery] = useState("");

  // Individual item check states (for cooks ticking off items as they grill/fry)
  const [completedItemIds, setCompletedItemIds] = useState<Record<string, boolean>>({});

  // Layout view mode: compact grid vs kanban 3-lane
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");

  // Ultra-compact density toggle for 14-inch screens during rush hours
  const [density, setDensity] = useState<"compact" | "ultra">("compact");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleItemCheck = (ticketId: string, itemId: string) => {
    const key = `${ticketId}-${itemId}`;
    setCompletedItemIds((prev) => {
      const next = !prev[key];
      if (kdsSoundEnabled) playKitchenChime("toggle");
      return { ...prev, [key]: next };
    });
  };

  // Filter tickets based on stage, fulfillment, and search
  const filteredTickets = useMemo(() => {
    return kdsTickets.filter((ticket) => {
      if (activeStage !== "ALL" && ticket.column !== activeStage) return false;
      if (fulfillmentFilter !== "ALL" && ticket.fulfillmentType !== fulfillmentFilter)
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchOrderNum = ticket.orderNumber.toLowerCase().includes(q);
        const matchToken = (ticket.kioskToken || "").toLowerCase().includes(q);
        const matchTable = (ticket.tableNumber || "").toLowerCase().includes(q);
        const matchCustomer = ticket.customerName.toLowerCase().includes(q);
        const matchItem = ticket.items.some((i) => i.productName.toLowerCase().includes(q));
        if (!matchOrderNum && !matchToken && !matchTable && !matchCustomer && !matchItem) {
          return false;
        }
      }
      return true;
    });
  }, [kdsTickets, activeStage, fulfillmentFilter, searchQuery]);

  // Stage counts
  const countQueued = kdsTickets.filter((t) => t.column === "QUEUED").length;
  const countPreparing = kdsTickets.filter((t) => t.column === "PREPARING").length;
  const countReady = kdsTickets.filter((t) => t.column === "READY").length;

  const getFulfillmentBadge = (type: FulfillmentType, tableNumber?: string) => {
    switch (type) {
      case "DINE_IN":
        return {
          icon: <UtensilsCrossed className="w-3 h-3 text-amber-400" />,
          label: tableNumber ? `${tableNumber.toUpperCase()}` : "DINE-IN",
          badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/40",
        };
      case "TAKEAWAY":
        return {
          icon: <ShoppingBag className="w-3 h-3 text-sky-400" />,
          label: "TAKEAWAY",
          badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/40",
        };
      case "DELIVERY":
        return {
          icon: <Bike className="w-3 h-3 text-emerald-400" />,
          label: "DELIVERY",
          badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
        };
      default:
        return {
          icon: <ShoppingBag className="w-3 h-3 text-zinc-400" />,
          label: "ORDER",
          badgeColor: "bg-zinc-800 text-zinc-300 border-zinc-700",
        };
    }
  };

  // Render individual compact ticket card
  const renderTicketCard = (ticket: KdsTicket & { orderNotes?: string }) => {
    const matchedOrder = orders.find(
      (o) =>
        o.orderNumber === ticket.orderNumber ||
        (o.kioskToken && o.kioskToken === ticket.kioskToken)
    );

    const customerNotes = ticket.orderNotes || matchedOrder?.notes;
    const isOverdue = ticket.elapsedSeconds > 15 * 60;
    const isUrgent = ticket.elapsedSeconds > 8 * 60 && !isOverdue;
    const packaging = getFulfillmentBadge(ticket.fulfillmentType, ticket.tableNumber);

    const totalItemsCount = ticket.items.reduce((sum, item) => sum + item.quantity, 0);
    const checkedCount = ticket.items.filter(
      (item) => completedItemIds[`${ticket.id}-${item.id}`]
    ).length;
    const allChecked = checkedCount === ticket.items.length && ticket.items.length > 0;

    const isUltra = density === "ultra";

    return (
      <div
        key={ticket.id}
        className={`bg-[#121215] border rounded-md flex flex-col justify-between transition-all duration-150 shadow-sm overflow-hidden ${
          isOverdue
            ? "border-rose-500 shadow-rose-950/30 ring-1 ring-rose-500/60"
            : isUrgent
            ? "border-amber-500 shadow-amber-950/20"
            : ticket.column === "READY"
            ? "border-emerald-500/60"
            : ticket.column === "PREPARING"
            ? "border-sky-500/60"
            : "border-zinc-800 hover:border-zinc-700"
        }`}
      >
        {/* CARD TOP BAR: Token, Table, Customer & Live Elapsed Timer */}
        <div
          className={`bg-[#16161a] border-b border-zinc-800/80 ${
            isUltra ? "p-1.5 space-y-1" : "p-2 sm:p-2.5 space-y-1.5"
          }`}
        >
          {/* Row 1: Token Slip, Order Number, Fulfillment Badge & Elapsed Timer */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Primary Token Callout */}
              <span className="font-mono text-sm sm:text-base font-black text-amber-400 tracking-wide leading-none shrink-0">
                {ticket.kioskToken || ticket.orderNumber}
              </span>

              {/* Order Number (if token differs) */}
              {ticket.kioskToken && ticket.kioskToken !== ticket.orderNumber && (
                <span className="font-mono text-[10px] text-zinc-500 font-semibold shrink-0">
                  #{ticket.orderNumber}
                </span>
              )}

              {/* Fulfillment Type / Table Pill */}
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase shrink-0 ${packaging.badgeColor}`}
              >
                {packaging.icon}
                <span>{packaging.label}</span>
              </span>

              {ticket.isAddOnRound && (
                <span className="px-1 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded uppercase tracking-wider shrink-0">
                  R{ticket.roundNumber || 2}
                </span>
              )}
            </div>

            {/* Quick Actions & Live Timer Badge */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Print Slip Button */}
              <button
                type="button"
                onClick={() => handlePrintKitchenSlip(ticket)}
                className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Print Kitchen Runner Slip"
              >
                <Printer className="w-3 h-3" />
              </button>

              {/* Elapsed Timer Badge with Rush Warning */}
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 font-mono text-[11px] font-black rounded shrink-0 ${
                  isOverdue
                    ? "bg-rose-500 text-white animate-pulse"
                    : isUrgent
                    ? "bg-amber-500 text-black"
                    : "bg-zinc-800/90 text-zinc-300 border border-zinc-700/60"
                }`}
                title="Time elapsed since order placed"
              >
                <Clock className="w-3 h-3" />
                <span>{formatTimer(ticket.elapsedSeconds)}</span>
                {isOverdue && (
                  <span className="text-[9px] uppercase tracking-tighter font-black">
                    RUSH
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Customer Name & Items count */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-medium text-zinc-300 truncate max-w-[170px]">
              {ticket.customerName || "Walk-in Guest"}
            </span>

            <span className="text-[10px] font-mono text-zinc-500">
              {ticket.items.length} {ticket.items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Customer Special Preparation Instruction (Only shown if note exists) */}
          {customerNotes && (
            <div className="px-1.5 py-1 bg-amber-500/10 border-l-2 border-amber-500 text-amber-300 text-[11px] font-semibold flex items-start gap-1 rounded-r leading-tight">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">"{customerNotes}"</span>
            </div>
          )}
        </div>

        {/* CARD ITEMS LIST: High-density, crystal clear typography */}
        <div
          className={`flex-1 divide-y divide-zinc-800/70 overflow-hidden ${
            isUltra ? "p-1.5 space-y-1" : "p-2 sm:p-2.5 space-y-1.5"
          }`}
        >
          {ticket.items.map((item) => {
            const itemKey = `${ticket.id}-${item.id}`;
            const isItemChecked = !!completedItemIds[itemKey];

            return (
              <div
                key={item.id}
                onClick={() => toggleItemCheck(ticket.id, item.id)}
                className={`flex items-start justify-between gap-2 cursor-pointer select-none transition-all rounded px-1 -mx-1 ${
                  isUltra ? "pt-1" : "pt-1.5"
                } ${
                  isItemChecked
                    ? "opacity-35 line-through"
                    : "hover:bg-zinc-800/40"
                }`}
              >
                {/* Quantity Box + Product & Modifiers */}
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  {/* High Contrast Quantity Box */}
                  <span
                    className={`font-mono text-xs font-black w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                      isItemChecked
                        ? "bg-zinc-800 text-zinc-500"
                        : "bg-amber-500 text-black shadow-sm"
                    }`}
                  >
                    {item.quantity}×
                  </span>

                  {/* Product Name, Variant & Clean Modifier Bullets */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-xs font-black text-white leading-tight">
                        {item.productName}
                      </span>
                      {item.variantName && (
                        <span className="text-[11px] font-bold text-amber-400">
                          {item.variantName}
                        </span>
                      )}
                    </div>

                    {/* Modifiers as clean inline bullet string */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="text-[10px] text-zinc-300 font-medium flex flex-wrap gap-x-1.5 gap-y-0.5 pt-0.5">
                        {item.modifiers.map((mod, idx) => (
                          <span key={idx} className="inline-flex items-center gap-0.5">
                            <span className="text-zinc-500">•</span>
                            <span>
                              {mod.startsWith("+") || mod.startsWith("NO")
                                ? mod
                                : `+ ${mod}`}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tactile Cross-off Checkbox */}
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isItemChecked
                      ? "bg-emerald-500 border-emerald-500 text-black font-black"
                      : "border-zinc-700 bg-zinc-900/80 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CARD ACTION FOOTER: Streamlined height buttons */}
        <div
          className={`bg-[#16161a] border-t border-zinc-800/80 ${
            isUltra ? "p-1.5 space-y-1" : "p-2 sm:p-2.5 space-y-1.5"
          }`}
        >
          {ticket.column === "QUEUED" && (
            <button
              type="button"
              onClick={() => handleBump(ticket.id, "QUEUED")}
              className="w-full h-8 sm:h-8.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 rounded transition-all active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>START COOKING</span>
            </button>
          )}

          {ticket.column === "PREPARING" && (
            <button
              type="button"
              onClick={() => handleBump(ticket.id, "PREPARING")}
              aria-label="MARK READY FOR PICKUP"
              className="w-full h-8 sm:h-8.5 bg-sky-500 hover:bg-sky-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 rounded transition-all active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>MARK READY FOR PICKUP</span>
            </button>
          )}

          {ticket.column === "READY" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => triggerKitchenCall(ticket)}
                className="flex-1 h-8 sm:h-8.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1 rounded transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                title="Ring kitchen bell & call guest"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>CALL</span>
              </button>

              <button
                type="button"
                onClick={() => handleBump(ticket.id, "READY")}
                aria-label="DISPATCH & HAND OVER"
                className="flex-1 h-8 sm:h-8.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1 rounded transition-all active:scale-[0.98] cursor-pointer shadow-sm"
              >
                <Package className="w-3.5 h-3.5" />
                <span>DISPATCH & HAND OVER</span>
              </button>
            </div>
          )}

          {/* Micro Progress Line */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold px-0.5">
            <span>
              {allChecked ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Check className="w-3 h-3 stroke-[3]" /> All items cooked
                </span>
              ) : (
                <span>
                  Prep:{" "}
                  <strong className="text-zinc-200">
                    {checkedCount}/{totalItemsCount}
                  </strong>
                </span>
              )}
            </span>
            <span className="uppercase text-[9px] tracking-wider text-zinc-500">
              {ticket.column === "QUEUED"
                ? "Incoming"
                : ticket.column === "PREPARING"
                ? "Cooking"
                : "Ready"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full min-h-[calc(100vh-60px)] bg-[#09090B] text-zinc-100 flex flex-col font-sans">
      {/* -------------------------------------------------------------
          COMPACT TOP CONTROL BAR: Fits seamlessly on 14-inch screens
          Integrated with Live WebSocket Indicator & Real Backend Sync
      ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-[#101013] border-b border-zinc-800 px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-md shrink-0">
        <div className="w-full flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          {/* Section 1: Clean Kitchen Icon */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-amber-500 text-black rounded flex items-center justify-center shrink-0 shadow-sm" title="Kitchen Display">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>

          {/* Section 2: Queue Stage Filters (Sleek Compact Segmented Pills) */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded p-0.5 gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleStageChange("ALL")}
              className={`h-7 px-2 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                activeStage === "ALL"
                  ? "bg-zinc-100 text-black shadow-sm font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>All</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  activeStage === "ALL"
                    ? "bg-zinc-300 text-black"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {kdsTickets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStageChange("QUEUED")}
              className={`h-7 px-2 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                activeStage === "QUEUED"
                  ? "bg-amber-500 text-black shadow-sm font-black"
                  : "text-amber-400/90 hover:text-amber-300"
              }`}
            >
              <span>Incoming</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  activeStage === "QUEUED"
                    ? "bg-amber-600 text-black font-black"
                    : "bg-amber-500/15 text-amber-400 font-bold"
                }`}
              >
                {countQueued}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStageChange("PREPARING")}
              className={`h-7 px-2 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                activeStage === "PREPARING"
                  ? "bg-sky-500 text-black shadow-sm font-black"
                  : "text-sky-400/90 hover:text-sky-300"
              }`}
            >
              <span>Cooking</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  activeStage === "PREPARING"
                    ? "bg-sky-600 text-black font-black"
                    : "bg-sky-500/15 text-sky-400 font-bold"
                }`}
              >
                {countPreparing}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStageChange("READY")}
              className={`h-7 px-2 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                activeStage === "READY"
                  ? "bg-emerald-500 text-black shadow-sm font-black"
                  : "text-emerald-400/90 hover:text-emerald-300"
              }`}
            >
              <span>Ready</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  activeStage === "READY"
                    ? "bg-emerald-600 text-black font-black"
                    : "bg-emerald-500/15 text-emerald-400 font-bold"
                }`}
              >
                {countReady}
              </span>
            </button>
          </div>

          {/* Section 3: Search, Fulfillment Filter & Quick Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Token / table / item..."
                className="h-7 w-24 sm:w-36 lg:w-44 pl-6 pr-5 bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 rounded focus:outline-none focus:border-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dining / Fulfillment Select */}
            <select
              value={fulfillmentFilter}
              onChange={(e) =>
                setFulfillmentFilter(e.target.value as FulfillmentType | "ALL")
              }
              className="h-7 px-1.5 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-semibold rounded focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="DINE_IN">🍽️ Dine-In</option>
              <option value="TAKEAWAY">🛍️ Takeaway</option>
              <option value="DELIVERY">🛵 Delivery</option>
            </select>

            {/* Manual Sync Refresh Button */}
            <button
              type="button"
              onClick={() => void fetchKitchenTickets(false)}
              disabled={isSyncing}
              title="Sync with Live Kitchen Backend"
              className={`w-7 h-7 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isSyncing ? "animate-spin text-amber-400" : ""
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Density Toggle (Standard vs Ultra-Compact for 14-inch screen) */}
            <button
              type="button"
              onClick={() =>
                setDensity((prev) => (prev === "compact" ? "ultra" : "compact"))
              }
              title={`Switch Density (Current: ${
                density === "ultra" ? "Ultra-Compact" : "Standard Compact"
              })`}
              className={`h-7 px-2 text-[11px] font-bold border rounded flex items-center gap-1 cursor-pointer transition-colors ${
                density === "ultra"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span className="hidden xl:inline">
                {density === "ultra" ? "Dense" : "Normal"}
              </span>
            </button>

            {/* Grid vs Kanban View Toggle */}
            <div className="hidden md:flex items-center border border-zinc-800 bg-zinc-900 rounded p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Card Grid Mode"
                className={`h-6 px-1.5 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-amber-500 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Grid className="w-3 h-3" />
                <span className="hidden xl:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                title="3-Lane Kanban Mode"
                className={`h-6 px-1.5 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-amber-500 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Columns className="w-3 h-3" />
                <span className="hidden xl:inline">Lanes</span>
              </button>
            </div>

            {/* Audio Alert Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !kdsSoundEnabled;
                setKdsSoundEnabled(next);
                if (next) playKitchenChime("advance");
              }}
              className={`w-7 h-7 border rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                kdsSoundEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800"
              }`}
              title={kdsSoundEnabled ? "Kitchen Chimes ON" : "Kitchen Chimes MUTED"}
            >
              {kdsSoundEnabled ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Fullscreen Mode */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-7 h-7 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Fullscreen Display"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN KITCHEN WORKSPACE: Max Details Visible for 14-inch Displays
      ------------------------------------------------------------- */}
      <main className="w-full p-2 sm:p-2.5 flex-1 overflow-y-auto">
        {isLoadingSkeleton || isInitialLoading || isStageLoading ? (
          <SkeletonTicketGrid count={6} />
        ) : (!isAuthenticated || authErrorNotice) ? (
          <div className="py-12 px-6 text-center space-y-3 bg-[#121215] border border-amber-500/30 rounded-lg max-w-lg mx-auto my-6 shadow-xl">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Kitchen Station Authentication Required
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              {authErrorNotice || "To view and manage live kitchen tickets, please sign in with your Kitchen Staff, Chef, Manager, or Admin credentials."}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={openLoginModal}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-md transition-all shadow-md cursor-pointer"
              >
                Sign In to Kitchen Station
              </button>
            </div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-24 text-center space-y-3 max-w-sm mx-auto">
            <div className="w-11 h-11 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-500">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-medium text-zinc-300">
              No orders in queue
            </h3>
            {(searchQuery || fulfillmentFilter !== "ALL" || activeStage !== "ALL") && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveStage("ALL");
                    setFulfillmentFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded transition-colors cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        ) : viewMode === "kanban" ? (
          /* KANBAN 3-LANE VIEW: Incoming | Cooking | Ready */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-start">
            {/* Lane 1: Incoming */}
            <div className="flex flex-col bg-[#0e0e11] border border-zinc-800/90 rounded-md overflow-hidden">
              <div className="h-8 px-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Incoming Queue
                </span>
                <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                  {countQueued}
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                {filteredTickets.filter((t) => t.column === "QUEUED").length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 py-8 font-medium">
                    No incoming orders
                  </p>
                ) : (
                  filteredTickets
                    .filter((t) => t.column === "QUEUED")
                    .map((ticket) => renderTicketCard(ticket))
                )}
              </div>
            </div>

            {/* Lane 2: Cooking */}
            <div className="flex flex-col bg-[#0e0e11] border border-zinc-800/90 rounded-md overflow-hidden">
              <div className="h-8 px-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  On Grill / Fryer
                </span>
                <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                  {countPreparing}
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                {filteredTickets.filter((t) => t.column === "PREPARING").length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 py-8 font-medium">
                    No orders being cooked
                  </p>
                ) : (
                  filteredTickets
                    .filter((t) => t.column === "PREPARING")
                    .map((ticket) => renderTicketCard(ticket))
                )}
              </div>
            </div>

            {/* Lane 3: Ready */}
            <div className="flex flex-col bg-[#0e0e11] border border-zinc-800/90 rounded-md overflow-hidden">
              <div className="h-8 px-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ready on Counter
                </span>
                <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                  {countReady}
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                {filteredTickets.filter((t) => t.column === "READY").length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 py-8 font-medium">
                    No orders awaiting pickup
                  </p>
                ) : (
                  filteredTickets
                    .filter((t) => t.column === "READY")
                    .map((ticket) => renderTicketCard(ticket))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* HIGH-DENSITY CARD GRID: Optimized for 14-inch Displays (3 to 4 columns, 2 rows visible without scroll) */
          <div
            className={`grid gap-2.5 items-start ${
              density === "ultra"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            }`}
          >
            {filteredTickets.map((ticket) => renderTicketCard(ticket))}
          </div>
        )}
      </main>
    </div>
  );
};
