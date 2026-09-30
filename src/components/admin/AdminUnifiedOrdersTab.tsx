import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ShoppingBag,
  Bike,
  Flame,
  Package,
  XCircle,
  Eye,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Receipt,
  User,
  Phone,
  AlertCircle,
  BookOpen,
  Calendar,
  Filter,
  RotateCcw,
  X,
  Share2,
  MapPin,
  ExternalLink,
  CreditCard,
  UtensilsCrossed,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  Order,
  OrderStatus,
  FulfillmentType,
  PaymentMethod,
} from "../../types";
import {
  usePosSession,
  usePosCommand,
  posOrderToOrder,
  todayNepal,
  toPosMethod,
  backendOrder,
  PosOrder,
} from "../../lib/posApi";
import { usePosOrderFeed } from "../../lib/posWorkspace";
import { posStatistics } from "../../lib/posLegacy";
import { formatNPR, formatTimer } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Drawer } from "../common/Drawer";
import { Modal } from "../common/Modal";
import { useOrderReceipt } from "../../lib/orderReceipt";
import { CompactOrderReceipt } from "../common/CompactOrderReceipt";
import {
  DeliveryOrderDetails,
  deliveryInfo,
  DeliveryDispatchModal,
} from "../customer/DeliveryOrderDetails";
import { playIncomingOrderChime } from "../../lib/useLiveSiteVisitors";
import { useOutletEvents } from "../../lib/useOutletEvents";
import { apiClient } from "../../lib/api";

interface Props {
  onOpenBillingForOrder?: (order: Order) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const AdminUnifiedOrdersTab: React.FC<Props> = ({
  onOpenBillingForOrder,
  onNavigateToTab,
}) => {
  const { currentOutlet, addToast } = useApp();
  const outletId = String(currentOutlet?.id || "1");

  // Backend POS session — WebSocket live, fetches meta, tables, perms
  const posSession = usePosSession();
  const posCommand = usePosCommand(posSession);

  // Filter State
  const [startDate, setStartDate] = useState<string>(() => todayNepal());
  const [endDate, setEndDate] = useState<string>(() => todayNepal());
  const [orderTypeFilter, setOrderTypeFilter] = useState<
    "ALL" | "ONLINE_DELIVERY" | "TAKEAWAY" | "DINE_IN"
  >("ALL");
  const [settlementFilter, setSettlementFilter] = useState<
    "ALL" | "PAID" | "UNPAID" | "CREDIT"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Drawers
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<Order | null>(null);
  const [printSlipOrder, setPrintSlipOrder] = useState<Order | null>(null);
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Order Queries from POS API
  const backendOngoingQuery = usePosOrderFeed(posSession, { open_tabs: true });
  const registerQuery = usePosOrderFeed(posSession, {
    ...(startDate ? { start_date: startDate } : {}),
    ...(endDate ? { end_date: endDate } : {}),
  });

  const orders: Order[] = useMemo(
    () =>
      registerQuery.results.map((po) =>
        posOrderToOrder(po, currentOutlet?.name || "Crunchy Bag")
      ),
    [registerQuery.results, currentOutlet?.name]
  );

  const ongoingOrders: Order[] = useMemo(
    () =>
      backendOngoingQuery.results.map((po) =>
        posOrderToOrder(po, currentOutlet?.name || "Crunchy Bag")
      ),
    [backendOngoingQuery.results, currentOutlet?.name]
  );

  // Deduplicated merged orders list
  const mergedOrders = useMemo(() => {
    const map = new Map<string, Order>();
    ongoingOrders.forEach((o) => map.set(o.id, o));
    orders.forEach((o) => map.set(o.id, o));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, ongoingOrders]);

  // Keep drawer updated on active orders refresh
  useEffect(() => {
    if (selectedOrderForDrawer) {
      const refreshed = mergedOrders.find((o) => o.id === selectedOrderForDrawer.id);
      if (refreshed) setSelectedOrderForDrawer(refreshed);
    }
  }, [mergedOrders]);

  // Audio & Notification on New Incoming Orders via WSS
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!hasInitializedRef.current && mergedOrders.length > 0) {
      mergedOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
      hasInitializedRef.current = true;
      return;
    }

    // Check for fresh incoming orders
    const freshIncoming = mergedOrders.filter(
      (o) =>
        !knownOrderIdsRef.current.has(o.id) &&
        (o.status === "CONFIRMED" || o.status === "PROCESSING")
    );

    if (freshIncoming.length > 0) {
      // Play audio chime
      playIncomingOrderChime();

      freshIncoming.forEach((o) => {
        knownOrderIdsRef.current.add(o.id);
        addToast({
          title: `🛎️ New Order #${o.orderNumber}`,
          description: `${o.customerName} placed ${o.items.length} items (${o.fulfillmentType === "DELIVERY" ? "🛵 Delivery" : o.fulfillmentType === "DINE_IN" ? `🍽️ Table ${o.tableNumber || ""}` : "🛍️ Takeaway"}). Total: ${formatNPR(o.totalAmount)}`,
          type: "success",
        });
      });
    }

    mergedOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
  }, [mergedOrders, addToast]);

  // Direct WSS Listener to trigger instant POS session refresh on external order events
  useOutletEvents(outletId, true, () => {
    // When WebSocket receives display event, refresh POS session revision
    posSession.refresh?.();
  });

  // Receipt Slip Preview Hook
  const receiptState = useOrderReceipt(printSlipOrder, "", "TOKEN");
  const receipt = receiptState.receipt;
  const receiptPreview = receipt?.snapshot
    ? posOrderToOrder(receipt.snapshot, currentOutlet?.name || "Crunchy Bag")
    : printSlipOrder;

  // Filter Orders
  const filteredOrders = useMemo(() => {
    return mergedOrders.filter((o) => {
      // Order Type / Channel Filter
      if (orderTypeFilter === "ONLINE_DELIVERY" && o.fulfillmentType !== "DELIVERY") return false;
      if (orderTypeFilter === "TAKEAWAY" && o.fulfillmentType !== "TAKEAWAY" && o.fulfillmentType !== "DRIVE_THRU") return false;
      if (orderTypeFilter === "DINE_IN" && o.fulfillmentType !== "DINE_IN") return false;

      // Settlement Filter
      if (settlementFilter === "PAID") {
        if (o.paymentStatus !== "PAID" && !o.isBilled) return false;
      } else if (settlementFilter === "UNPAID") {
        if (o.paymentStatus === "PAID" || o.isBilled) return false;
      } else if (settlementFilter === "CREDIT") {
        const isCredit =
          o.paymentMethod === "CREDIT" ||
          (o.splitPayments && o.splitPayments.some((s) => s.method === "CREDIT" && s.amount > 0));
        if (!isCredit) return false;
      }

      // Status Filter
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;

      // Search Query
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase();
        const matchToken = (o.kioskToken || "").toLowerCase().includes(q);
        const matchOrderNum = o.orderNumber.toLowerCase().includes(q);
        const matchCust = o.customerName.toLowerCase().includes(q);
        const matchPhone = (o.customerPhone || "").toLowerCase().includes(q);
        const matchAddress = (o.deliveryAddress || "").toLowerCase().includes(q);
        const matchTable = (o.tableNumber || "").toLowerCase().includes(q);
        const matchMethod = (o.paymentMethod || "").toLowerCase().includes(q);
        const matchItem = o.items.some((i) => i.productName.toLowerCase().includes(q));
        if (
          !matchToken &&
          !matchOrderNum &&
          !matchCust &&
          !matchPhone &&
          !matchAddress &&
          !matchTable &&
          !matchMethod &&
          !matchItem
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    mergedOrders,
    orderTypeFilter,
    settlementFilter,
    statusFilter,
    tableSearchQuery,
  ]);

  // Statistics reflecting the active filtered dataset
  const datatableStats = useMemo(() => posStatistics(filteredOrders), [filteredOrders]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIdx, startIdx + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 1-Click Status Bump Handler using POS API Command
  const handleQuickBumpStatus = async (row: Order) => {
    const order = backendOrder(row);
    if (!order) return;
    const nextMap: Record<string, string> = {
      PENDING: "ACCEPTED",
      ACCEPTED: "PREPARING",
      PREPARING: "READY",
      READY: order.fulfillment_type === "DELIVERY" ? "OUT_FOR_DELIVERY" : "COMPLETED",
      OUT_FOR_DELIVERY: "COMPLETED",
    };
    const next = nextMap[order.status];
    if (next) {
      try {
        await posCommand.run(`${order.id}/transition/`, {
          version: order.version,
          status: next,
        });
        addToast({
          title: "Status Updated",
          description: `Order #${order.order_number} marked as ${next}`,
          type: "success",
        });
        posSession.refresh?.();
      } catch (err: any) {
        addToast({
          title: "Update Failed",
          description: err?.message || "Could not transition order status",
          type: "error",
        });
      }
    }
  };

  // Direct Status Transition Handler
  const handleTransitionStatus = async (row: Order, targetStatus: string) => {
    const order = backendOrder(row);
    if (!order) return;
    try {
      await posCommand.run(`${order.id}/transition/`, {
        version: order.version,
        status: targetStatus,
      });
      addToast({
        title: "Status Updated",
        description: `Order #${order.order_number} transitioned to ${targetStatus}`,
        type: "success",
      });
      posSession.refresh?.();
    } catch (err: any) {
      addToast({
        title: "Transition Failed",
        description: err?.message || "Could not update status",
        type: "error",
      });
    }
  };

  // Cancel Order Handler
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    const order = backendOrder(cancellingOrder);
    if (!order) return;
    setIsCancelling(true);
    try {
      await posCommand.run(`${order.id}/transition/`, {
        version: order.version,
        status: "CANCELLED",
        reason: cancelReason || "Cancelled by manager in unified orders dashboard",
      });
      addToast({
        title: "Order Cancelled",
        description: `Order #${order.order_number} has been cancelled.`,
        type: "info",
      });
      setCancellingOrder(null);
      setCancelReason("");
      setSelectedOrderForDrawer(null);
      posSession.refresh?.();
    } catch (err: any) {
      addToast({
        title: "Cancellation Failed",
        description: err?.message || "Could not cancel order",
        type: "error",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* -------------------------------------------------------------
          FILTER & WORKSPACE CONTROLS BAR
      ------------------------------------------------------------- */}
      <div className="bg-[#121214] border border-zinc-800 rounded p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
          {/* Start Date */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700/80 rounded text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* End Date */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700/80 rounded text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Channel / Order Type */}
          <div className="lg:col-span-3">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Channel / Source
            </label>
            <select
              value={orderTypeFilter}
              onChange={(e) => {
                setOrderTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700/80 rounded text-zinc-100 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Channels (POS, Delivery, Dine-In, Kiosk)</option>
              <option value="ONLINE_DELIVERY">🛵 Online & Delivery Orders</option>
              <option value="TAKEAWAY">🛍️ Takeaway & Drive-Thru</option>
              <option value="DINE_IN">🍽️ Dine-In Tables (QR Scan)</option>
            </select>
          </div>

          {/* Settlement */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Settlement
            </label>
            <select
              value={settlementFilter}
              onChange={(e) => {
                setSettlementFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700/80 rounded text-zinc-100 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Bills</option>
              <option value="PAID">✅ Paid / Settled</option>
              <option value="UNPAID">⏳ Unsettled / Open</option>
              <option value="CREDIT">📒 Credit Sale (Khata)</option>
            </select>
          </div>

          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Live Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={tableSearchQuery}
                onChange={(e) => {
                  setTableSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Token, #CR, item, phone..."
                className="w-full h-8 pl-7 pr-6 text-xs bg-zinc-900 border border-zinc-700/80 rounded text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              {tableSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setTableSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Page Size & Refresh */}
          <div className="lg:col-span-1 flex items-center gap-1.5">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Page
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full h-8 px-1 text-xs bg-zinc-900 border border-zinc-700/80 rounded text-zinc-300 focus:outline-none cursor-pointer text-center"
                title="Rows per page"
              >
                <option value={10}>10/p</option>
                <option value={20}>20/p</option>
                <option value={50}>50/p</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => posSession.refresh?.()}
              className="h-8 px-2 mt-auto bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Refresh live orders"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------
            FINANCIAL AUDIT & PAYMENT BREAKDOWN STRIP
        ------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 py-1.5 border-t border-zinc-800/80 font-medium overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Orders:</span>
            <strong className="font-mono text-zinc-100 font-bold">
              {datatableStats.orderCount}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Gross:</span>
            <strong className="font-mono text-zinc-200 font-bold">
              {formatNPR(datatableStats.grossSubtotal)}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Discount:</span>
            <strong className="font-mono text-rose-400 font-bold">
              {datatableStats.totalDiscounts > 0
                ? `-${formatNPR(datatableStats.totalDiscounts)}`
                : "Rs. 0"}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Final Net:</span>
            <strong className="font-mono text-amber-400 font-bold">
              {formatNPR(datatableStats.netFinal)}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Paid:</span>
            <strong className="font-mono text-emerald-400 font-bold">
              {formatNPR(datatableStats.totalPaid)}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Unpaid / Due:</span>
            <strong className="font-mono text-amber-400 font-bold">
              {formatNPR(datatableStats.totalUnpaid)}
            </strong>
          </span>

          <span className="text-zinc-700 select-none">|</span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Cash:</span>
            <strong className="font-mono text-zinc-100 font-bold">
              {formatNPR(datatableStats.cashTotal)}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">FonePay:</span>
            <strong className="font-mono text-rose-400 font-bold">
              {formatNPR(datatableStats.qrFonepayTotal)}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">eSewa:</span>
            <strong className="font-mono text-emerald-400 font-bold">
              {formatNPR(datatableStats.esewaTotal)}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Card:</span>
            <strong className="font-mono text-sky-400 font-bold">
              {formatNPR(datatableStats.cardTotal)}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-amber-400">📒 Khata Credit:</span>
            <strong className="font-mono text-amber-400 font-bold">
              {formatNPR(datatableStats.creditTotal)} ({datatableStats.creditCount})
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Void/Refund:</span>
            <strong className="font-mono text-rose-400 font-bold">
              {formatNPR(datatableStats.refundVoidTotal)}
            </strong>
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          STATUS FILTER TABS (High-Visibility with Live Counts)
      ------------------------------------------------------------- */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-bold">
        {(
          [
            { key: "ALL", label: "All Orders", count: mergedOrders.length },
            {
              key: "CONFIRMED",
              label: "Incoming New",
              count: mergedOrders.filter((o) => o.status === "CONFIRMED").length,
            },
            {
              key: "PROCESSING",
              label: "Kitchen Cooking",
              count: mergedOrders.filter((o) => o.status === "PROCESSING").length,
            },
            {
              key: "READY",
              label: "Ready for Pickup",
              count: mergedOrders.filter((o) => o.status === "READY").length,
            },
            {
              key: "COMPLETED",
              label: "Completed / Dispatched",
              count: mergedOrders.filter((o) => o.status === "COMPLETED").length,
            },
            {
              key: "CANCELLED",
              label: "Cancelled",
              count: mergedOrders.filter((o) => o.status === "CANCELLED").length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setStatusFilter(tab.key);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
              statusFilter === tab.key
                ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                : "bg-[#121214] text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                statusFilter === tab.key
                  ? "bg-black/20 text-black font-black"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* -------------------------------------------------------------
          THE UNIFIED ORDER DETAIL DATATABLE
      ------------------------------------------------------------- */}
      <div className="overflow-x-auto rounded border border-zinc-800 bg-[#121214]">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#17171a] text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
            <tr>
              <th className="p-2.5 text-center w-10">S.N.</th>
              <th className="p-2.5">Token</th>
              <th className="p-2.5">Order & Time</th>
              <th className="p-2.5">Customer & Channel</th>
              <th className="p-2.5">Items Ordered</th>
              <th className="p-2.5 text-right font-black text-zinc-200">Amount</th>
              <th className="p-2.5 text-center">Billing & Payment</th>
              <th className="p-2.5 text-center">Refund</th>
              <th className="p-2.5 text-center">Status</th>
              <th className="p-2.5 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80 font-medium">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Receipt className="w-8 h-8 text-zinc-600" />
                    <p className="font-semibold text-sm text-zinc-400">
                      No orders match your filter criteria.
                    </p>
                    <p className="text-xs text-zinc-600">
                      Try adjusting the date range or clear the search query.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order, idx) => {
                const isReady = order.status === "READY";
                const isProcessing = order.status === "PROCESSING";
                const isConfirmed = order.status === "CONFIRMED";
                const isCompleted = order.status === "COMPLETED";
                const isCancelled = order.status === "CANCELLED";

                const serialNumber = (currentPage - 1) * pageSize + idx + 1;
                const isBilledOrPaid = order.paymentStatus === "PAID" || order.isBilled;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* S.N. */}
                    <td className="p-2.5 text-center font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {String(serialNumber).padStart(2, "0")}
                    </td>

                    {/* Token Slip */}
                    <td className="p-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-amber-500 text-black shadow-xs">
                          {order.kioskToken || order.orderNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPrintSlipOrder(order)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer transition-colors"
                          title="Print Kitchen Receipt / Token Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Order Number & Time */}
                    <td className="p-2.5 whitespace-nowrap">
                      <p className="font-mono font-bold text-zinc-100">
                        #{order.orderNumber}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{order.createdAt.split("T")[1]?.slice(0, 5) || "Now"}</span>
                        <span>• {formatTimer(order.elapsedSeconds)}</span>
                      </div>
                    </td>

                    {/* Customer & Channel */}
                    <td
                      onClick={() => setSelectedOrderForDrawer(order)}
                      className="p-2.5 min-w-[150px] cursor-pointer hover:bg-zinc-800/60 rounded transition-colors"
                      title="Click to view full order details & map location"
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-zinc-100 truncate max-w-[150px]">
                          {order.customerName}
                        </p>
                        <Eye className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Online Delivery Address Snippet */}
                      {order.fulfillmentType === "DELIVERY" && (
                        <div className="flex items-center gap-1.5 mt-0.5 group/addr">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <p
                            className="text-[11px] text-zinc-400 truncate max-w-[130px]"
                            title={deliveryInfo(order).address || "Delivery destination"}
                          >
                            {deliveryInfo(order).address?.split("\n")[0] || "Online Delivery"}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDispatchOrder(order);
                            }}
                            className="p-0.5 hover:bg-amber-500 text-zinc-400 hover:text-black border border-zinc-700 hover:border-amber-500 rounded transition-colors shrink-0"
                            title="Share & Dispatch: Open Pathao, Yango, Google Maps"
                          >
                            <Share2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                            order.fulfillmentType === "DINE_IN"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : order.fulfillmentType === "DELIVERY"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                          }`}
                        >
                          {order.fulfillmentType === "DINE_IN"
                            ? `🍽️ ${order.tableNumber || "Table"}`
                            : order.fulfillmentType === "DELIVERY"
                            ? "🛵 Online"
                            : "🛍️ Takeaway"}
                        </span>
                        {order.customerPhone && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            {order.customerPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Items Ordered */}
                    <td className="p-2.5 max-w-[200px]">
                      <p className="text-xs text-zinc-200 line-clamp-1">
                        {order.items?.map((i) => `${i.quantity}x ${i.productName}`)?.join(", ") || "No items"}
                      </p>
                      {order.notes && (
                        <p className="text-[10px] text-amber-400 font-bold truncate mt-0.5">
                          Note: "{order.notes}"
                        </p>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="p-2.5 whitespace-nowrap text-right font-mono">
                      <div className="font-black text-amber-400 text-xs">
                        {formatNPR(order.totalAmount)}
                      </div>
                      {order.discountAmount && order.discountAmount > 0 ? (
                        <div className="text-[10px] flex items-center justify-end gap-1 mt-0.5">
                          <span className="line-through text-zinc-500">
                            {formatNPR(order.subtotal || order.totalAmount + order.discountAmount)}
                          </span>
                          <span
                            className="text-rose-400 font-bold"
                            title={order.discountReason || "Discount"}
                          >
                            -{formatNPR(order.discountAmount)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Total: {formatNPR(order.subtotal || order.totalAmount)}
                        </div>
                      )}
                    </td>

                    {/* Billing & Payment */}
                    <td className="p-2.5 whitespace-nowrap text-center">
                      {(() => {
                        const isCreditOrder =
                          order.paymentMethod === "CREDIT" ||
                          (order.splitPayments &&
                            order.splitPayments.some(
                              (s) => s.method === "CREDIT" && s.amount > 0
                            ));
                        const creditAmt =
                          order.splitPayments?.find((s) => s.method === "CREDIT")?.amount ??
                          order.totalAmount;
                        const paidPortion = order.splitPayments
                          ? order.splitPayments
                              .filter((s) => s.method !== "CREDIT")
                              .reduce((a, b) => a + b.amount, 0)
                          : order.paymentMethod !== "CREDIT" && isBilledOrPaid
                          ? order.totalAmount
                          : 0;

                        if (isCreditOrder) {
                          return (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-black rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                <BookOpen className="w-2.5 h-2.5 text-amber-400" />
                                {order.splitPayments && order.splitPayments.length > 1
                                  ? "Split Khata"
                                  : "Khata Credit"}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-amber-400">
                                Due: {formatNPR(creditAmt)}
                              </span>
                              {paidPortion > 0 && (
                                <span className="font-mono text-[9px] text-emerald-400">
                                  Paid: {formatNPR(paidPortion)}
                                </span>
                              )}
                            </div>
                          );
                        }

                        if (isBilledOrPaid) {
                          return (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Paid •{" "}
                                {order.paymentMethod === "CASH_ON_PICKUP" ||
                                order.paymentMethod === "CASH_ON_DELIVERY"
                                  ? "Cash"
                                  : order.paymentMethod === "FONEPAY_QR"
                                  ? "FonePay"
                                  : order.paymentMethod === "ESEWA"
                                  ? "eSewa"
                                  : order.paymentMethod === "CARD"
                                  ? "Card"
                                  : order.paymentMethod
                                  ? order.paymentMethod.replace(/_/g, " ")
                                  : "Cash"}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-emerald-400">
                                Paid: {formatNPR(order.totalAmount)}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Unpaid
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400">
                              Due: {formatNPR(order.totalAmount)}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Refund */}
                    <td className="p-2.5 whitespace-nowrap text-center">
                      {order.refundStatus === "REFUNDED" ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded">
                          Refunded
                        </span>
                      ) : order.refundStatus === "VOIDED" || order.status === "CANCELLED" ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded">
                          Voided
                        </span>
                      ) : (
                        <span className="text-zinc-600 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* Lifecycle Status */}
                    <td className="p-2.5 whitespace-nowrap text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase rounded border ${
                          isReady
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                            : isProcessing
                            ? "bg-sky-500/20 text-sky-400 border-sky-500/50"
                            : isConfirmed
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                            : isCompleted
                            ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                            : "bg-rose-500/20 text-rose-400 border-rose-500/50"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Quick Actions */}
                    <td className="p-2.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-Click Status Bump Button */}
                        {!isCompleted && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleQuickBumpStatus(order)}
                            className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded flex items-center gap-1 cursor-pointer transition-colors ${
                              isConfirmed
                                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-xs"
                                : isProcessing
                                ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-xs"
                                : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                            }`}
                            title="Step forward to next order milestone"
                          >
                            {isConfirmed && (
                              <>
                                <Flame className="w-3 h-3" />
                                <span>Cook</span>
                              </>
                            )}
                            {isProcessing && (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Ready</span>
                              </>
                            )}
                            {isReady && (
                              <>
                                <Package className="w-3 h-3 text-emerald-400" />
                                <span>
                                  {order.fulfillmentType === "DELIVERY" ? "Dispatch" : "Hand Over"}
                                </span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Direct Status Selector Dropdown */}
                        <select
                          value={
                            order.status === "CONFIRMED"
                              ? "ACCEPTED"
                              : order.status === "PROCESSING"
                              ? "PREPARING"
                              : order.status
                          }
                          onChange={(e) => handleTransitionStatus(order, e.target.value)}
                          className="h-7 px-1.5 text-[10px] font-bold bg-zinc-900 border border-zinc-700 rounded text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                          title="Override Order Lifecycle Status"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="ACCEPTED">ACCEPTED (Confirm)</option>
                          <option value="PREPARING">PREPARING (Kitchen)</option>
                          <option value="READY">READY (Pickup)</option>
                          <option value="OUT_FOR_DELIVERY">DISPATCHED (Rider)</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>

                        {/* View Drawer Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDrawer(order)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-zinc-300 hover:text-white cursor-pointer transition-colors"
                          title="View complete order details & item audit"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Settlement / Billing Button */}
                        {onOpenBillingForOrder && !isBilledOrPaid && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => onOpenBillingForOrder(order)}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 cursor-pointer transition-colors"
                            title="Settle bill & accept payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* -------------------------------------------------------------
            PAGINATION CONTROLS
        ------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-zinc-800 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-zinc-200">
                {paginatedOrders.length ? (currentPage - 1) * pageSize + 1 : 0}
              </strong>{" "}
              to{" "}
              <strong className="text-zinc-200">
                {Math.min(currentPage * pageSize, filteredOrders.length)}
              </strong>{" "}
              of <strong className="text-zinc-200">{filteredOrders.length}</strong> orders
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 rounded text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-zinc-200">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 rounded text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODALS & DRAWERS
      ------------------------------------------------------------- */}

      {/* 1. ORDER DETAILS DRAWER */}
      {selectedOrderForDrawer && (
        <Drawer
          isOpen={!!selectedOrderForDrawer}
          onClose={() => setSelectedOrderForDrawer(null)}
          title={`Order #${selectedOrderForDrawer.orderNumber}`}
          size="lg"
        >
          <div className="space-y-4 p-4 text-xs">
            {/* Customer & Channel Header */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-zinc-100">
                  {selectedOrderForDrawer.customerName}
                </h4>
                {selectedOrderForDrawer.customerPhone && (
                  <a
                    href={`tel:${selectedOrderForDrawer.customerPhone}`}
                    className="font-mono text-xs text-amber-400 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{selectedOrderForDrawer.customerPhone}</span>
                  </a>
                )}
              </div>
              <div className="text-right">
                <Badge variant="brand" size="md">
                  {selectedOrderForDrawer.fulfillmentType === "DELIVERY"
                    ? "🛵 Online Delivery"
                    : selectedOrderForDrawer.fulfillmentType === "DINE_IN"
                    ? `🍽️ Table ${selectedOrderForDrawer.tableNumber || ""}`
                    : "🛍️ Takeaway"}
                </Badge>
                <div className="font-mono text-[10px] text-zinc-500 mt-1">
                  Placed: {selectedOrderForDrawer.createdAt.split("T")[1]?.slice(0, 8)}
                </div>
              </div>
            </div>

            {/* Delivery Location & Map Links (if Delivery) */}
            {selectedOrderForDrawer.fulfillmentType === "DELIVERY" && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    Delivery Destination
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDispatchOrder(selectedOrderForDrawer);
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-black rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Rider Dispatch & Navigation</span>
                  </button>
                </div>
                <p className="text-zinc-200">
                  {deliveryInfo(selectedOrderForDrawer).address || "Address not provided"}
                </p>
                {selectedOrderForDrawer.notes && (
                  <p className="text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    Delivery Instructions: "{selectedOrderForDrawer.notes}"
                  </p>
                )}
              </div>
            )}

            {/* Itemized Bill */}
            <div>
              <h5 className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 mb-2">
                Order Items ({selectedOrderForDrawer.items.length})
              </h5>
              <div className="divide-y divide-zinc-800 border border-zinc-800 rounded bg-zinc-900">
                {selectedOrderForDrawer.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-zinc-100">
                          {item.productName}
                        </span>
                        {item.variantName && item.variantName !== "Standard" && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                            {item.variantName}
                          </span>
                        )}
                      </div>
                      {item.modifiersSummary?.length > 0 && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          + {item.modifiersSummary.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-zinc-200">
                      {formatNPR(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-1.5 font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span>
                  {formatNPR(
                    selectedOrderForDrawer.subtotal || selectedOrderForDrawer.totalAmount
                  )}
                </span>
              </div>
              {selectedOrderForDrawer.discountAmount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Discount:</span>
                  <span>-{formatNPR(selectedOrderForDrawer.discountAmount)}</span>
                </div>
              )}
              {selectedOrderForDrawer.vatIncludedAmount > 0 && (
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>13% VAT (Included):</span>
                  <span>{formatNPR(selectedOrderForDrawer.vatIncludedAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-amber-400 pt-1.5 border-t border-zinc-800">
                <span>Total Payable:</span>
                <span>{formatNPR(selectedOrderForDrawer.totalAmount)}</span>
              </div>
            </div>

            {/* Action Buttons in Drawer */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCancellingOrder(selectedOrderForDrawer)}
                className="px-3 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded cursor-pointer"
              >
                Cancel Order
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintSlipOrder(selectedOrderForDrawer)}
                  className="px-3 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                {onOpenBillingForOrder &&
                  selectedOrderForDrawer.paymentStatus !== "PAID" && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenBillingForOrder(selectedOrderForDrawer);
                        setSelectedOrderForDrawer(null);
                      }}
                      className="px-3 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded flex items-center gap-1 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Settle Bill</span>
                    </button>
                  )}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* 2. RECEIPT & TOKEN SLIP MODAL */}
      {printSlipOrder && (
        <Modal
          isOpen={!!printSlipOrder}
          onClose={() => setPrintSlipOrder(null)}
          title={`Receipt Slip — #${printSlipOrder.orderNumber}`}
          maxWidth="md"
        >
          <div className="p-4 space-y-4">
            {receiptPreview && <CompactOrderReceipt order={receiptPreview} />}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setPrintSlipOrder(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. DELIVERY DISPATCH & MAP MODAL */}
      {dispatchOrder && (
        <DeliveryDispatchModal
          order={dispatchOrder}
          isOpen={!!dispatchOrder}
          onClose={() => setDispatchOrder(null)}
        />
      )}

      {/* 4. CANCEL ORDER CONFIRMATION MODAL */}
      {cancellingOrder && (
        <Modal
          isOpen={!!cancellingOrder}
          onClose={() => setCancellingOrder(null)}
          title={`Cancel Order #${cancellingOrder.orderNumber}?`}
          maxWidth="sm"
        >
          <div className="p-4 space-y-3">
            <p className="text-xs text-zinc-300">
              Are you sure you want to cancel this order? This will release table
              occupancy and mark the order as cancelled across the KDS and POS register.
            </p>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Cancellation Reason
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer cancelled, out of ingredients..."
                className="w-full h-8 px-2.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancellingOrder(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
