import { extractErrorMessage } from "../../lib/api";
import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  CreditCard,
  UtensilsCrossed,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order } from "../../types";
import { apiClient } from "../../lib/api";

interface Props {
  onOpenBillingForOrder?: (order: Order) => void;
  onOpenOngoingOrder?: (order: Order) => void;
}

export const StaffFloatingOrderNotice: React.FC<Props> = ({
  onOpenBillingForOrder,
  onOpenOngoingOrder,
}) => {
  const { orders, updateOrderStatus, addToast, simulateIncomingOrder, currentOutlet } = useApp();
  const [isCrossed, setIsCrossed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedOrderIds, setDismissedOrderIds] = useState<Set<string>>(new Set());
  const seenOrdersRef = useRef<Set<string>>(new Set());
  const [pendingOrder, setPendingOrder] = useState<string | null>(null);

  // Filter pending/incoming orders for this outlet that require cashier/staff review
  const incomingOrders = orders.filter((o) => {
    // 1. Must belong to this outlet if outlet is specified
    if (o.outletId && currentOutlet?.id && String(o.outletId) !== String(currentOutlet.id)) {
      return false;
    }

    // 2. Not individually crossed / dismissed
    if (dismissedOrderIds.has(o.id) || dismissedOrderIds.has(o.orderNumber)) {
      return false;
    }

    // 3. Exclude any terminal or active progress statuses (Kitchen, Preparing, Ready, Completed, Cancelled)
    if (
      o.status === "CANCELLED" ||
      o.status === "COMPLETED" ||
      o.status === "PROCESSING" ||
      o.status === "READY" ||
      (o.status as string) === "ACCEPTED" ||
      (o.status as string) === "PREPARING"
    ) {
      return false;
    }

    // 4. Exclude if backend POS order has already progressed beyond PENDING
    const raw = (o as any)._posOrder;
    if (raw && raw.status && raw.status !== "PENDING") {
      return false;
    }

    // 5. Exclude if items are already dispatched to kitchen
    if (o.items && o.items.length > 0 && o.items.every((i) => i.sentToKitchen)) {
      return false;
    }

    // Only orders awaiting initial kitchen dispatch or cashier confirmation
    return (
      o.status === "CONFIRMED" ||
      o.status === "PENDING" ||
      o.status === "AWAITING_PAYMENT"
    );
  });

  // Play audio chime and auto-re-open floating notice whenever a NEW order arrives
  useEffect(() => {
    const hasNewUnseen = incomingOrders.some(
      (order) =>
        !seenOrdersRef.current.has(order.id) && !seenOrdersRef.current.has(order.orderNumber)
    );
    if (hasNewUnseen) {
      setIsCrossed(false); // un-dismiss on fresh incoming order
      setIsMinimized(false);
      if (soundEnabled) {
        try {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            [587.33, 880].forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.frequency.setValueAtTime(freq, now + idx * 0.14);
              gain.gain.setValueAtTime(0.2, now + idx * 0.14);
              gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now + idx * 0.14);
              osc.stop(now + idx * 0.14 + 0.35);
            });
          }
        } catch {
          // Audio blocked
        }
      }
    }
    incomingOrders.forEach((order) => {
      seenOrdersRef.current.add(order.id);
      seenOrdersRef.current.add(order.orderNumber);
    });
  }, [incomingOrders.map((order) => order.id).join(","), soundEnabled]);

  // Send order to Kitchen / KDS -> immediately remove from incoming notice
  const handleAcceptToKitchen = async (order: Order) => {
    if (pendingOrder) return;
    setPendingOrder(order.id);
    // 1. Immediately disappear from floating incoming notice
    setDismissedOrderIds((prev) => new Set(prev).add(order.id).add(order.orderNumber));
    // 2. Immediately update local order status to PROCESSING (Kitchen Cooking)
    updateOrderStatus(order.id, "PROCESSING");
    updateOrderStatus(order.orderNumber, "PROCESSING");

    try {
      const raw = (order as any)._posOrder;
      if (raw?.id) {
        const nextStatus = raw.status === "PENDING" ? "ACCEPTED" : "PREPARING";
        const outletId = order.outletId || currentOutlet?.id || raw.outlet_id;
        await apiClient.post(
          `/orders/pos/${raw.id}/transition/?outlet_id=${encodeURIComponent(String(outletId))}`,
          {
            version: raw.version,
            status: nextStatus,
            reason: "Accepted from incoming order notice",
          },
          {
            headers: {
              "Idempotency-Key": `notice:${order.id}:${raw.version}:${nextStatus}`,
            },
          }
        );
      }
      addToast({
        title: "Sent to Kitchen",
        description: `Order #${order.orderNumber} sent to KDS successfully.`,
        type: "success",
      });
    } catch (error: any) {
      console.warn("Backend order transition error:", error);
      addToast({
        title: "Order could not be sent to kitchen",
        description: extractErrorMessage(error),
        type: "error",
      });
    } finally {
      setPendingOrder(null);
    }
  };

  // Reject / Cancel Order -> immediately remove from incoming notice
  const handleReject = async (order: Order) => {
    if (pendingOrder) return;
    setPendingOrder(order.id);
    // 1. Immediately disappear from floating incoming notice
    setDismissedOrderIds((prev) => new Set(prev).add(order.id).add(order.orderNumber));
    // 2. Immediately update local order status to CANCELLED
    updateOrderStatus(order.id, "CANCELLED");
    updateOrderStatus(order.orderNumber, "CANCELLED");

    try {
      const raw = (order as any)._posOrder;
      if (raw?.id) {
        const outletId = order.outletId || currentOutlet?.id || raw.outlet_id;
        await apiClient.post(
          `/orders/pos/${raw.id}/transition/?outlet_id=${encodeURIComponent(String(outletId))}`,
          {
            version: raw.version,
            status: "CANCELLED",
            reason: "Rejected by staff from incoming order queue",
          },
          {
            headers: {
              "Idempotency-Key": `notice:${order.id}:${raw.version}:CANCELLED`,
            },
          }
        );
      }
      addToast({
        title: "Order Rejected",
        description: `Order #${order.orderNumber} was cancelled.`,
        type: "info",
      });
    } catch (error: any) {
      addToast({title:"Order could not be cancelled", description:extractErrorMessage(error), type:"error"});
    } finally {
      setPendingOrder(null);
    }
  };

  // Dismiss / Cross individual order without cancelling
  const handleDismiss = (order: Order) => {
    setDismissedOrderIds((prev) => new Set(prev).add(order.id).add(order.orderNumber));
    addToast({
      title: "Notice Dismissed",
      description: `Order #${order.orderNumber} dismissed from floating queue.`,
      type: "info",
    });
  };

  const formatNPR = (val: number) => `Rs. ${val.toLocaleString("en-NP")}`;

  // If no incoming orders or user closed completely, render nothing
  if (incomingOrders.length === 0 || isCrossed) {
    return null;
  }

  // If user clicked minimize, show sleek floating pill at top center
  if (isMinimized) {
    return (
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
        <div className="flex items-center gap-2 bg-amber-500 text-black px-3 py-1.5 rounded-full shadow-xl font-bold text-xs cursor-pointer border border-amber-400">
          <div className="w-2 h-2 rounded-full bg-black animate-ping" />
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 fill-black" />
            <span>{incomingOrders.length} New Order{incomingOrders.length > 1 ? "s" : ""} Waiting</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCrossed(true);
            }}
            className="p-0.5 hover:bg-black/10 rounded-full cursor-pointer ml-1"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5 text-black" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside
      id="floating-incoming-orders-notice"
      aria-label="Floating Incoming Orders Notice"
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-4xl pointer-events-auto transition-all duration-200"
    >
      <div className="bg-[#111215]/95 backdrop-blur-md border-2 border-amber-500/80 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] p-3 text-zinc-100 ring-1 ring-amber-500/30">
        {/* Floating Notice Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>Incoming Orders Queue</span>
              <span className="px-1.5 py-0.2 bg-amber-500 text-black rounded font-mono font-black text-[10px]">
                {incomingOrders.length}
              </span>
            </span>
            <span className="text-[11px] text-zinc-400 hidden sm:inline">
              • Floating across all pages until dispatched or crossed
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => simulateIncomingOrder("TABLE_QR")}
              className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded cursor-pointer"
            >
              + Test Order
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded cursor-pointer"
              title={soundEnabled ? "Mute audio chime" : "Enable audio chime"}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded cursor-pointer"
              title="Minimize to floating pill"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* Master Cross / Close Button */}
            <button
              type="button"
              onClick={() => setIsCrossed(true)}
              className="p-1 bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white rounded-md cursor-pointer transition-colors"
              title="Dismiss floating notice (press X)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Orders Horizontal Row / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-2.5 max-h-[60vh] overflow-y-auto">
          {incomingOrders.map((order) => {
            const isTableQr =
              order.orderSource === "TABLE_QR" ||
              (order.fulfillmentType === "DINE_IN" && order.tableNumber);
            const isDelivery = order.fulfillmentType === "DELIVERY";
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-[#18191E] border border-amber-500/30 hover:border-amber-500/60 rounded-lg p-2.5 flex flex-col justify-between gap-2 shadow-xs transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isTableQr ? (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 font-extrabold text-[10px] uppercase font-mono rounded">
                          {order.tableNumber || "Table QR"}
                        </span>
                      ) : isDelivery ? (
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 font-extrabold text-[10px] uppercase rounded">
                          Delivery
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-extrabold text-[10px] uppercase rounded">
                          Takeaway
                        </span>
                      )}

                      <span className="font-mono font-black text-xs text-white">
                        #{order.orderNumber}
                      </span>
                      {order.kioskToken && (
                        <span className="font-mono font-bold text-[10px] px-1 bg-zinc-800 text-amber-400 rounded">
                          {order.kioskToken}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                      <span className="truncate max-w-[130px]">{order.customerName}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-black text-xs text-amber-400">
                        {formatNPR(order.totalAmount)}
                      </div>
                      <div className="text-[9px] font-bold">
                        {order.paymentStatus === "PAID" ? (
                          <span className="text-emerald-400">Paid</span>
                        ) : (
                          <span className="text-amber-400/90">Unpaid Cash</span>
                        )}
                      </div>
                    </div>
                    {/* Individual cross / dismiss button to remove this specific card from the queue */}
                    <button
                      type="button"
                      onClick={() => handleDismiss(order)}
                      className="p-1 -mr-1 -mt-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded cursor-pointer transition-colors"
                      title="Dismiss this order from floating queue (cross out)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items preview */}
                <div className="text-[11px] text-zinc-300 truncate bg-zinc-900/90 px-2 py-1 border border-zinc-800 rounded font-medium">
                  <span className="font-bold text-white">{itemCount} items: </span>
                  {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/80">
                  <button
                    type="button"
                    disabled={pendingOrder === order.id}
                    onClick={() => handleReject(order)}
                    className="px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 rounded cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50"
                    title="Reject and cancel this order"
                  >
                    <X className="w-3 h-3 text-rose-400" />
                    <span>Reject</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {onOpenOngoingOrder && (
                      <button
                        type="button"
                        onClick={() => onOpenOngoingOrder(order)}
                        className="px-2 py-1 text-[10px] font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <UtensilsCrossed className="w-3 h-3" />
                        <span>POS</span>
                      </button>
                    )}

                    {onOpenBillingForOrder && (
                      <button
                        type="button"
                        onClick={() => onOpenBillingForOrder(order)}
                        className="px-2 py-1 text-[10px] font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Bill</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={pendingOrder === order.id}
                      onClick={() => handleAcceptToKitchen(order)}
                      className="px-2.5 py-1 text-[10px] font-black text-black bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      title="Send to kitchen (KDS) & remove from queue"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{pendingOrder === order.id ? "Sending..." : "Send to KDS"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
