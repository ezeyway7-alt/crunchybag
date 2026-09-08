import React, { useState } from "react";
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
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order, OrderStatus } from "../../types";
import { formatNPR, formatTimer } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { DeliveryRider3DAnimation } from "./DeliveryRider3DAnimation";

interface LiveOrderTrackerProps {
  initialOrderId?: string;
  onExploreMenu: () => void;
}

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = ({
  initialOrderId,
  onExploreMenu,
}) => {
  const { orders, cancelOrder, reorderItems } = useApp();

  // Selected order state (defaults to initialOrderId or the first order, but can be deselected)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
    initialOrderId || orders[0]?.id || null
  );

  // Search/filter in left sidebar
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  const timelineSteps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: "AWAITING_PAYMENT", label: "Awaiting Payment", desc: "Verifying Fonepay/Cash" },
    { key: "CONFIRMED", label: "Confirmed", desc: "Order routed to branch" },
    { key: "PROCESSING", label: "In Kitchen", desc: "Chef actively frying & assembling" },
    { key: "READY", label: "Ready for Pickup", desc: "Warm in takeaway rack" },
    { key: "COMPLETED", label: "Completed", desc: "Fulfilled and handed over" },
  ];

  const getStepIndex = (status: OrderStatus) => {
    if (status === "CANCELLED") return -1;
    return timelineSteps.findIndex((s) => s.key === status);
  };

  const currentStepIndex = selectedOrder ? getStepIndex(selectedOrder.status) : 0;

  // Filter orders in sidebar
  const filteredOrders = orders.filter((o) => {
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.outletName.toLowerCase().includes(q) ||
      o.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  });

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

  // Progress percentage calculation for live route animation
  const getDeliveryProgressPercent = (status: OrderStatus) => {
    switch (status) {
      case "AWAITING_PAYMENT":
        return 12;
      case "CONFIRMED":
        return 30;
      case "PROCESSING":
        return 55;
      case "READY":
        return 82;
      case "COMPLETED":
        return 100;
      case "CANCELLED":
        return 0;
      default:
        return 20;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col md:flex-row items-start gap-4 lg:gap-6 min-h-[640px]">
        {/* ==================================================================== */}
        {/* LEFT SIDEBAR: ORDER HISTORY (Around 20% width on desktop, scrollable) */}
        {/* ==================================================================== */}
        <aside className="w-full md:w-[24%] lg:w-[22%] xl:w-[20%] shrink-0 flex flex-col bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          {/* Header of Sidebar */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2 bg-zinc-50 dark:bg-[#151518]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-amber-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Order History
                </h3>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500 text-black border border-black">
                {orders.length}
              </span>
            </div>

            {/* Quick search if multiple orders exist */}
            {orders.length > 2 && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Filter order # or item..."
                  className="w-full pl-7 pr-2 py-1 text-[11px] bg-white dark:bg-[#1C1C20] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Scrollable Order List */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-220px)] md:max-h-[640px] divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredOrders.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 space-y-2">
                <p>No orders found.</p>
                <button
                  type="button"
                  onClick={onExploreMenu}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Order crunchy food &rarr;
                </button>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      // Toggle selection or select
                      if (isSelected) {
                        setSelectedOrderId(null);
                      } else {
                        setSelectedOrderId(order.id);
                      }
                    }}
                    className={`w-full p-2.5 sm:p-3 text-left transition-colors cursor-pointer border-l-3 ${
                      isSelected
                        ? "border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/15"
                        : "border-l-transparent hover:bg-zinc-50 dark:hover:bg-[#18181B]"
                    }`}
                  >
                    {/* Row 1: Order number & Status badge */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono font-black text-xs text-zinc-900 dark:text-white">
                        #{order.orderNumber}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 border ${
                          order.status === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : order.status === "READY"
                            ? "bg-amber-500 text-black border-black font-black"
                            : order.status === "CANCELLED"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                            : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Row 2: Fulfillment icon + mode + time */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">
                      <span className="flex items-center gap-1 font-bold">
                        {getFulfillmentIcon(order.fulfillmentType, "h-3 w-3 text-amber-500")}
                        <span>{getFulfillmentLabel(order.fulfillmentType)}</span>
                      </span>
                      <span className="font-mono">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Row 3: Items summary snippet */}
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mb-1.5">
                      {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                    </p>

                    {/* Row 4: Total Price */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                      <span className="text-zinc-400 text-[10px]">Total</span>
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                        {formatNPR(order.totalAmount)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ==================================================================== */}
        {/* RIGHT MAIN PANEL: PROPER ORDER STATUS TRACKING (Remaining ~80% width) */}
        {/* ==================================================================== */}
        <section className="flex-1 min-w-0 w-full md:w-[76%] lg:w-[78%] xl:w-[80%]">
          {!selectedOrder ? (
            /* 3D Delivery Rider Animation when NO order is selected */
            <DeliveryRider3DAnimation
              onExploreMenu={onExploreMenu}
              hasOrders={orders.length > 0}
            />
          ) : (
            /* Proper Order Status Live Tracking Card */
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
                      {selectedOrder.status.replace("_", " ")}
                    </Badge>

                    {/* Fulfillment Type Badge */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-black bg-amber-500 text-black border border-black dark:border-amber-400">
                      {getFulfillmentIcon(selectedOrder.fulfillmentType, "h-3.5 w-3.5")}
                      <span>{getFulfillmentLabel(selectedOrder.fulfillmentType)}</span>
                    </span>

                    {/* Deselect / Back to Fleet Radar Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(null)}
                      className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-2 py-0.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Clear selection to view 3D Delivery Fleet Radar"
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
                      <span>Elapsed: {formatTimer(selectedOrder.elapsedSeconds)}</span>
                    </span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                    {selectedOrder.fulfillmentType === "DELIVERY"
                      ? "Estimated Delivery"
                      : "Estimated Readiness"}
                  </span>
                  <p className="text-lg sm:text-xl font-black text-amber-500 font-mono">
                    {selectedOrder.estimatedPickupTime}
                  </p>
                </div>
              </div>

              {/* Delivery Address & Ride Sharing Notice */}
              {selectedOrder.fulfillmentType === "DELIVERY" && selectedOrder.deliveryAddress && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <Navigation className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        Delivery Destination:{" "}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {selectedOrder.deliveryAddress}
                      </span>
                      {selectedOrder.deliveryLocation?.landmark && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                          Landmark: {selectedOrder.deliveryLocation.landmark}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 shrink-0 font-medium">
                    Delivery Fee: Paid to Rider (Pathao / Yango)
                  </div>
                </div>
              )}

              {/* ==================================================================== */}
              {/* ANIMATED LIVE ORDER TRACKING STAGE */}
              {/* ==================================================================== */}
              {selectedOrder.status !== "CANCELLED" && (
                <div className="p-4 sm:p-5 bg-zinc-900 text-white border-2 border-amber-500 shadow-md relative overflow-hidden">
                  {/* Subtle highway dashed line background */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                      <span className="text-xs uppercase font-black tracking-wider text-amber-400">
                        {selectedOrder.fulfillmentType === "DELIVERY"
                          ? "Live Delivery Dispatch Radar"
                          : "Kitchen Assembly Progress"}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-black/60 px-2 py-0.5 border border-amber-500/40 text-amber-300">
                      STATUS: {selectedOrder.status.replace("_", " ")}
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

                      {/* Filled Progress Bar */}
                      <motion.div
                        className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] relative z-10"
                        initial={{ width: "0%" }}
                        animate={{
                          width: `${getDeliveryProgressPercent(selectedOrder.status)}%`,
                        }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                      />
                    </div>

                    {/* Animated Delivery Rider / Station Indicator moving along track */}
                    <motion.div
                      className="absolute -top-3.5 z-20"
                      initial={{ left: "5%" }}
                      animate={{
                        left: `calc(${getDeliveryProgressPercent(selectedOrder.status)}% - 18px)`,
                      }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
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

                  {/* Milestones Labels */}
                  <div className="grid grid-cols-4 text-[10px] sm:text-xs text-zinc-400 pt-1 font-mono">
                    <div className="text-left">
                      <span className="block text-zinc-200 font-bold">1. Order Placed</span>
                      <span className="text-[10px] text-zinc-500">Verified</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-zinc-200 font-bold">2. In Fryer</span>
                      <span className="text-[10px] text-zinc-500">Fresh & Hot</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-zinc-200 font-bold">
                        {selectedOrder.fulfillmentType === "DELIVERY" ? "3. On Transit" : "3. Packed"}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {selectedOrder.fulfillmentType === "DELIVERY" ? "Rider Dispatched" : "In Food Rack"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-zinc-200 font-bold">
                        {selectedOrder.fulfillmentType === "DELIVERY" ? "4. Doorstep" : "4. Handover"}
                      </span>
                      <span className="text-[10px] text-zinc-500">Complete</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Horizontal Step Progress Timeline */}
              {selectedOrder.status !== "CANCELLED" ? (
                <div className="py-2">
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative">
                    {timelineSteps.map((step, idx) => {
                      const isPassed = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;

                      return (
                        <div
                          key={step.key}
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
                      Funds have not been debited. You can reorder the items with 1-tap below.
                    </p>
                  </div>
                </div>
              )}

              {/* Immutable Order Line Snapshot Receipt */}
              <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 space-y-3.5">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-black">
                    <Receipt className="h-4 w-4 text-amber-500" />
                    <span>Immutable Receipt Lines</span>
                  </span>
                  <span className="font-mono">
                    Payment: {selectedOrder.paymentMethod.replace(/_/g, " ")}
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
                        {item.modifiersSummary.length > 0 && (
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

                {/* Subtotal & Statutory VAT */}
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-500">
                  <div className="flex justify-between">
                    <span>Items Total</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">
                      {formatNPR(selectedOrder.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>13% Statutory VAT (Included)</span>
                    <span className="font-mono">{formatNPR(selectedOrder.vatIncludedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base font-black text-zinc-950 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span>Total Paid / Payable</span>
                    <span className="font-mono text-amber-500">
                      {formatNPR(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Cancel or 1-Tap Reorder */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {selectedOrder.status === "AWAITING_PAYMENT" ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => cancelOrder(selectedOrder.id)}
                    className="rounded-none font-bold text-xs"
                  >
                    Cancel Order
                  </Button>
                ) : (
                  <div className="text-xs text-zinc-400">
                    *Order is locked once cooking begins.
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="font-black text-xs rounded-none bg-amber-500 hover:bg-amber-400 text-black border border-black shadow-xs"
                    leftIcon={<RotateCcw className="h-4 w-4 stroke-[2.5]" />}
                    onClick={() => reorderItems(selectedOrder)}
                  >
                    1-Tap Reorder
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
