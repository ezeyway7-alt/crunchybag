import { DeliveryOrderDetails, deliveryStatus, deliveryStatusLabel } from './DeliveryOrderDetails';
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Receipt,
  MapPin,
  XCircle,
  Bike,
  ShoppingBag,
  Car,
  UtensilsCrossed,
  Navigation,
  Sparkles,
  Flame,
  ChefHat,
  Package,
  Check,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Printer,
  Star,
  QrCode,
  ArrowLeft,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order, OrderStatus } from "../../types";
import { formatNPR, getOrderReverseTimer } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { DeliveryRider3DAnimation } from "./DeliveryRider3DAnimation";
import { PrintableTokenReceiptModal } from "./PrintableTokenReceiptModal";
import { QrOrderTrackAndReviewModal } from "./QrOrderTrackAndReviewModal";

interface LiveOrderTrackerProps {
  initialOrderId?: string;
  onExploreMenu: () => void;
  onResetInitialOrder?: () => void;
}

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = ({
  initialOrderId,
  onExploreMenu,
  onResetInitialOrder,
}) => {
  const { orders, cancelOrder, reorderItems } = useApp();

  // Selected order state: defaults to initialOrderId if provided (e.g. from checkout redirect), otherwise null (shows orders list)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrderId || null
  );

  // Search and status filter in the orders list view
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED">("ALL");

  // Sub-modals for Print Token Slip & Rate/Review Experience
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);

  const appliedInitialOrder = useRef<string | undefined>();
  useEffect(() => {
    if (initialOrderId && appliedInitialOrder.current !== initialOrderId && orders.some(order => order.id === initialOrderId)) {
      appliedInitialOrder.current = initialOrderId;
      setSelectedOrderId(initialOrderId);
      return;
    }
    // If selected order no longer exists, return to list view
    if (selectedOrderId && !orders.some(order => order.id === selectedOrderId)) {
      setSelectedOrderId(null);
    }
  }, [initialOrderId, orders, selectedOrderId]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;
  const activeModalOrder = modalOrder || selectedOrder;
  const selectedOrderTimer = selectedOrder ? getOrderReverseTimer(selectedOrder) : null;

  const handleBackToOrdersList = () => {
    setSelectedOrderId(null);
    if (onResetInitialOrder) {
      onResetInitialOrder();
    }
  };

  const isDelivery = selectedOrder?.fulfillmentType === 'DELIVERY';
  const timelineSteps = [
    {key:'PENDING',label:'Payment Review',desc:'The outlet is verifying your receipt'},
    {key:'ACCEPTED',label:'Confirmed',desc:'Order accepted by the outlet'},
    {key:'PREPARING',label:'In Kitchen',desc:'Your food is being prepared'},
    {key:'READY',label:isDelivery ? 'Ready for dispatch' : 'Ready for pickup',desc:isDelivery ? 'Waiting for rider collection' : 'Ready at the counter'},
    ...(isDelivery ? [{key:'OUT_FOR_DELIVERY',label:'Dispatched',desc:'Your order is on the way'}] : []),
    {key:'COMPLETED',label:isDelivery ? 'Delivered' : 'Completed',desc:isDelivery ? 'Delivered to your address' : 'Order handed over'},
  ];
  const currentStepIndex = selectedOrder ? timelineSteps.findIndex(step => step.key === deliveryStatus(selectedOrder)) : -1;

  const isOrderActive = (status: OrderStatus) => {
    return status === "AWAITING_PAYMENT" || status === "CONFIRMED" || status === "PROCESSING" || status === "READY";
  };

  const activeOrdersCount = useMemo(
    () => orders.filter((o) => isOrderActive(o.status)).length,
    [orders]
  );
  const completedOrdersCount = useMemo(
    () => orders.filter((o) => o.status === "COMPLETED").length,
    [orders]
  );
  const cancelledOrdersCount = useMemo(
    () => orders.filter((o) => o.status === "CANCELLED").length,
    [orders]
  );

  // Filter orders in the list view
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === "ACTIVE" && !isOrderActive(o.status)) return false;
      if (statusFilter === "COMPLETED" && o.status !== "COMPLETED") return false;
      if (statusFilter === "CANCELLED" && o.status !== "CANCELLED") return false;

      if (!orderSearchQuery.trim()) return true;
      const q = orderSearchQuery.toLowerCase().trim();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.outletName.toLowerCase().includes(q) ||
        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q)) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q) || (i.variantName && i.variantName.toLowerCase().includes(q)))
      );
    });
  }, [orders, statusFilter, orderSearchQuery]);

  const getFulfillmentIcon = (type: string, className = "h-3.5 w-3.5") => {
    switch (type) {
      case "DELIVERY":
        return <Bike className={className} />;
      case "DRIVE_THRU":
        return <Car className={className} />;
      case "DINE_IN":
        return <UtensilsCrossed className={className} />;
      default:
        return <ShoppingBag className={className} />;
    }
  };

  const getFulfillmentLabel = (type: string) => {
    switch (type) {
      case "DELIVERY":
        return "Home Delivery";
      case "DRIVE_THRU":
        return "Drive-Thru";
      case "DINE_IN":
        return "Table Dine-In";
      default:
        return "Takeaway";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {!selectedOrder ? (
        /* ==================================================================== */
        /* FULL-WIDTH ORDERS LIST VIEW (User clicks "My Orders" -> sees all)    */
        /* ==================================================================== */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-amber-500 text-black flex items-center justify-center font-black shadow-xs border border-black">
                  <Package className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
                      My Orders
                    </h1>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-500 text-black border border-black">
                      {orders.length}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Select an order to track live delivery progress, view receipt, or rate experience
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onExploreMenu}
                className="text-xs font-bold"
              >
                Explore Menu &rarr;
              </Button>
            </div>
          </div>

          {/* Search Bar & Filter Chips */}
          {orders.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: "ALL", label: `All (${orders.length})` },
                  { id: "ACTIVE", label: `Active (${activeOrdersCount})` },
                  { id: "COMPLETED", label: `Completed (${completedOrdersCount})` },
                  { id: "CANCELLED", label: `Cancelled (${cancelledOrdersCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.id
                        ? "bg-amber-500 text-black border-black font-black"
                        : "bg-white dark:bg-[#121214] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search order #, outlet, or item..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                />
                {orderSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setOrderSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Orders Cards Grid */}
          {orders.length === 0 ? (
            <DeliveryRider3DAnimation
              onExploreMenu={onExploreMenu}
              hasOrders={false}
            />
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <p className="text-sm font-semibold text-zinc-400">No orders match your search or filter.</p>
              <button
                type="button"
                onClick={() => {
                  setOrderSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
              {filteredOrders.map((order) => {
                const timer = getOrderReverseTimer(order);
                const orderIsDelivery = order.fulfillmentType === "DELIVERY";

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsReceiptOpen(false);
                      setIsReviewOpen(false);
                    }}
                    className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/80 dark:hover:border-amber-500/80 p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between cursor-pointer group space-y-3.5"
                  >
                    {/* Top Row: Order # & Status Badge */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-zinc-950 dark:text-white">
                            #{order.orderNumber}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {getFulfillmentIcon(order.fulfillmentType, "h-3 w-3 text-amber-500")}
                            <span>{getFulfillmentLabel(order.fulfillmentType)}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })},{" "}
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 border ${
                          order.status === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : order.status === "READY"
                            ? "bg-amber-500 text-black border-black font-black"
                            : order.status === "CANCELLED"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {deliveryStatusLabel(order)}
                      </span>
                    </div>

                    {/* Live Reverse Countdown Timer if undelivered */}
                    {timer.isUndelivered && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 animate-pulse text-amber-500 shrink-0" />
                          <span>{orderIsDelivery ? "Est. Delivery:" : "Preparation Time:"}</span>
                        </span>
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {timer.formattedCountdown}
                        </span>
                      </div>
                    )}

                    {/* Outlet & Delivery Address */}
                    <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{order.outletName}</span>
                      </div>
                      {orderIsDelivery && order.deliveryAddress && (
                        <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                          <Navigation className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{order.deliveryAddress.split('\n')[0]}</span>
                        </div>
                      )}
                    </div>

                    {/* Items Preview */}
                    <div className="flex flex-wrap gap-1.5">
                      {order.items.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60"
                        >
                          {item.quantity}x {item.productName}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] text-zinc-400">
                          +{order.items.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Total & Action Buttons */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total</span>
                        <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400">
                          {formatNPR(order.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalOrder(order);
                            setIsReceiptOpen(true);
                          }}
                          className="h-8 px-2.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Print Token Slip / Receipt"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Slip</span>
                        </button>

                        <button
                          type="button"
                          aria-pressed={false}
                          aria-label={`View order ${order.orderNumber}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(order.id);
                            setIsReceiptOpen(false);
                            setIsReviewOpen(false);
                          }}
                          className="h-8 px-3 text-xs font-black bg-amber-500 hover:bg-amber-400 text-black border border-black dark:border-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer ml-auto sm:ml-0"
                        >
                          <span>Track Order & Details</span>
                          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ==================================================================== */
        /* FULL-WIDTH DEDICATED ORDER TRACKING & DETAIL VIEW (Drill down)       */
        /* ==================================================================== */
        <div className="space-y-4 sm:space-y-5">
          {/* Top Bar with Back Button & Multi-order Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleBackToOrdersList}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-[#18181B] hover:bg-zinc-200 dark:hover:bg-zinc-800 px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer w-fit"
              title="Return to My Orders list"
            >
              <ArrowLeft className="w-4 h-4 text-amber-500" />
              <span>&larr; Back to all orders</span>
            </button>

            {orders.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                <span className="text-[11px] font-bold text-zinc-400 shrink-0 hidden sm:inline">
                  Switch Order:
                </span>
                {orders.map((o) => {
                  const isCurrent = o.id === selectedOrder.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={isCurrent}
                      aria-label={`View order ${o.orderNumber}`}
                      onClick={() => {
                        setSelectedOrderId(o.id);
                        setIsReceiptOpen(false);
                        setIsReviewOpen(false);
                      }}
                      className={`px-2.5 py-1 text-xs font-mono font-bold border transition-colors cursor-pointer shrink-0 ${
                        isCurrent
                          ? "bg-amber-500 text-black border-black font-black"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-amber-500"
                      }`}
                    >
                      #{o.orderNumber}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Proper Order Status Live Tracking Card */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 lg:p-7 shadow-xs space-y-5">
            {/* Header: Order ID, Badges, Elapsed Timer, Readiness & Deselect */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
                    Order #{selectedOrder.orderNumber}
                  </h2>
                  <Badge
                    variant={
                      selectedOrder.status === "READY"
                        ? "success"
                        : selectedOrder.status === "CANCELLED"
                        ? "danger"
                        : "warning"
                    }
                    size="md"
                    dot
                    pulseDot={
                      selectedOrder.status === "PROCESSING" ||
                      selectedOrder.status === "READY" ||
                      selectedOrder.status === "CONFIRMED"
                    }
                  >
                    {deliveryStatusLabel(selectedOrder)}
                  </Badge>

                  {/* Fulfillment Type Badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black bg-amber-500 text-black border border-black dark:border-amber-400">
                    {getFulfillmentIcon(selectedOrder.fulfillmentType, "h-3.5 w-3.5")}
                    <span>{getFulfillmentLabel(selectedOrder.fulfillmentType)}</span>
                  </span>

                  {/* Deselect / Back to Orders List Button */}
                  <button
                    type="button"
                    onClick={handleBackToOrdersList}
                    className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-2 py-0.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Return to My Orders list"
                  >
                    Deselect
                  </button>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    <span>{selectedOrder.outletName}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>
                      Placed at{" "}
                      {new Date(selectedOrder.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                  {selectedOrder.status === "COMPLETED"
                    ? "Order Status"
                    : selectedOrder.fulfillmentType === "DELIVERY"
                    ? "Delivery status"
                    : "Order status"}
                </span>
                {selectedOrderTimer?.isUndelivered ? (
                  <div className="flex items-center sm:justify-end gap-1.5 font-mono text-xl sm:text-2xl font-black text-amber-500">
                    <Clock className="h-5 w-5 animate-pulse text-amber-500 shrink-0" />
                    <span>{selectedOrderTimer.formattedCountdown}</span>
                  </div>
                ) : (
                  <p className="text-lg sm:text-xl font-black text-emerald-500 font-mono">
                    {deliveryStatusLabel(selectedOrder)}
                  </p>
                )}
              </div>
            </div>

            {selectedOrder.fulfillmentType === 'DELIVERY' && <DeliveryOrderDetails key={selectedOrder.id} order={selectedOrder} />}

            {/* ==================================================================== */}
            {/* ANIMATED LIVE ORDER TRACKING STAGE */}
            {/* ==================================================================== */}
            {selectedOrder.status !== "CANCELLED" && (
              <div className="p-4 sm:p-5 bg-zinc-900 text-white border-2 border-amber-500 shadow-md relative overflow-hidden">
                {/* Highway dashed line header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {selectedOrder.status === "COMPLETED"
                        ? (isDelivery ? "Order Delivered" : "Order Completed")
                        : selectedOrder.fulfillmentType === "DELIVERY"
                        ? selectedOrderTimer?.displayLabel
                        : selectedOrderTimer?.displayLabel}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-bold bg-black/60 px-2 py-0.5 border border-amber-500/40 text-amber-300">
                    {selectedOrderTimer?.progressPercent}% Order Progress
                  </span>
                </div>

                {/* Animated Road Track with Rider Icon Sliding Along */}
                <div className="relative py-4 my-2">
                  {/* Base Track */}
                  <div className="h-3 w-full bg-zinc-800 border border-zinc-700 relative overflow-hidden">
                    {/* Animated dashed road lane stripes */}
                    <motion.div
                      className="absolute inset-0 flex items-center gap-3 px-1"
                      animate={{ x: [-24, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <span key={i} className="w-4 h-0.5 bg-zinc-600 shrink-0" />
                      ))}
                    </motion.div>

                    {/* Filled Progress Bar dynamically synced to reverse timer progress */}
                    <motion.div
                      className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] relative z-10"
                      animate={{
                        width: `${selectedOrderTimer?.progressPercent ?? 0}%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>

                  {/* Animated Delivery Rider / Station Indicator moving along track */}
                  <motion.div
                    className="absolute -top-3.5 z-20"
                    animate={{
                      left: `calc(${selectedOrderTimer?.progressPercent ?? 0}% - 18px)`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="relative flex flex-col items-center">
                      <motion.div
                        animate={{ y: [-2, 2, -2] }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                        className="w-9 h-9 bg-amber-500 text-black border-2 border-black flex items-center justify-center font-black shadow-lg"
                      >
                        {selectedOrder.fulfillmentType === "DELIVERY" ? (
                          <Bike className="h-5 w-5 stroke-[2.5]" />
                        ) : selectedOrder.status === "PROCESSING" ? (
                          <Flame className="h-5 w-5 text-black animate-pulse" />
                        ) : (
                          <Package className="h-5 w-5 stroke-[2.5]" />
                        )}
                      </motion.div>
                      {/* Ping radar ring */}
                      <span className="absolute -inset-1 border-2 border-amber-400 rounded-full animate-ping opacity-60 pointer-events-none" />
                    </div>
                  </motion.div>
                </div>

                {/* Clean Milestones Labels */}
                <div className="grid grid-cols-4 text-[10px] sm:text-xs text-zinc-400 pt-1 font-mono">
                  <div className="text-left font-bold text-zinc-200">
                    1. Placed
                  </div>
                  <div className="text-center font-bold text-zinc-200">
                    2. Kitchen
                  </div>
                  <div className="text-center font-bold text-zinc-200">
                    {selectedOrder.fulfillmentType === "DELIVERY" ? "3. On the Way" : "3. Packed"}
                  </div>
                  <div className="text-right font-bold text-zinc-200">
                    {selectedOrder.fulfillmentType === "DELIVERY" ? "4. Doorstep" : "4. Handover"}
                  </div>
                </div>
              </div>
            )}

            {/* Horizontal Step Progress Timeline */}
            {selectedOrder.status !== "CANCELLED" ? (
              <div className="py-2">
                <div className={`grid ${isDelivery ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-5"} gap-3 sm:gap-2 relative`}>
                  {timelineSteps.map((step, idx) => {
                    const isPassed = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div
                        key={step.key}
                        aria-current={isCurrent ? "step" : undefined}
                        data-testid={`tracking-step-${step.key}`}
                        className="flex flex-col items-center text-center group"
                      >
                        {/* Step Indicator */}
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all duration-200 z-10 border ${
                            isPassed
                              ? "bg-amber-500 text-black border-black font-black shadow-xs"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-300 dark:border-zinc-700"
                          }`}
                        >
                          {idx < currentStepIndex ? (
                            <Check className="h-4 w-4 stroke-[3]" />
                          ) : (
                            <span className="font-mono text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>

                        {/* Step Title & Subtitle */}
                        <div className="mt-2">
                          <p
                            className={`text-[11px] sm:text-xs font-black leading-tight ${
                              isCurrent
                                ? "text-amber-500 dark:text-amber-400"
                                : isPassed
                                ? "text-zinc-900 dark:text-zinc-100"
                                : "text-zinc-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="hidden md:block text-[10px] text-zinc-400 mt-0.5 max-w-[95px]">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-500">
                <XCircle className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-bold text-sm">This order has been cancelled.</p>
                  <p className="text-xs text-rose-400 mt-0.5">
                    Contact the outlet if you already paid. You can reorder below.
                  </p>
                </div>
              </div>
            )}

            {/* Order Receipt */}
            <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 space-y-3.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-black">
                  <Receipt className="h-4 w-4 text-amber-500" />
                  <span>Receipt</span>
                </span>
                <span className="font-mono">
                  Payment:{" "}
                  {selectedOrder.paymentMethod === "ESEWA"
                    ? "eSewa Wallet"
                    : selectedOrder.paymentMethod.replace(/_/g, " ")}
                </span>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-start justify-between text-xs sm:text-sm gap-2"
                  >
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">
                        {item.quantity}x {item.productName}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                        {item.variantName}
                      </p>
                      {item.modifiersSummary && item.modifiersSummary.length > 0 && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {item.modifiersSummary.join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatNPR(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal & VAT */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-500">
                <div className="flex justify-between">
                  <span>Items Total</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">
                    {formatNPR(selectedOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>VAT (Included)</span>
                  <span className="font-mono">{formatNPR(selectedOrder.vatIncludedAmount)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-black text-zinc-950 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Order Total</span>
                  <span className="font-mono text-amber-500">
                    {formatNPR(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Cancel, Print Slip, Review, 1-Tap Reorder */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              {selectedOrder.status === "AWAITING_PAYMENT" && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => cancelOrder(selectedOrder.id)}
                  className="rounded-none font-bold text-xs"
                >
                  Cancel Order
                </Button>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOrder(selectedOrder);
                    setIsReceiptOpen(true);
                  }}
                  className="h-9 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold border border-zinc-300 dark:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Token Slip</span>
                </button>

                {selectedOrder.status !== "AWAITING_PAYMENT" && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOrder(selectedOrder);
                      setIsReviewOpen(true);
                    }}
                    className="h-9 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-amber-500 text-xs font-bold border border-zinc-300 dark:border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Rate Experience</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  className="font-black text-xs rounded-none bg-amber-500 hover:bg-amber-400 text-black border border-black shadow-xs cursor-pointer"
                  leftIcon={<RotateCcw className="h-4 w-4 stroke-[2.5]" />}
                  onClick={() => reorderItems(selectedOrder)}
                >
                  1-Tap Reorder
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt & Token Slip Modal */}
      {isReceiptOpen && activeModalOrder && (
        <PrintableTokenReceiptModal
          order={activeModalOrder}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          onOpenTrackerAndReview={() => {
            setIsReceiptOpen(false);
            setIsReviewOpen(true);
          }}
        />
      )}

      {/* Scanned QR Slip Order Tracker & Rate/Review Modal */}
      {isReviewOpen && activeModalOrder && (
        <QrOrderTrackAndReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          initialOrder={activeModalOrder}
          onOpenReceipt={() => {
            setIsReviewOpen(false);
            setIsReceiptOpen(true);
          }}
        />
      )}
    </div>
  );
};
