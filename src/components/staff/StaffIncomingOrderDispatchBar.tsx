import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCircle2,
  Utensils,
  QrCode,
  ShoppingBag,
  Bike,
  X,
  Clock,
  ChevronRight,
  ExternalLink,
  Printer,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order } from "../../types";
import { formatNPR } from "../../lib/utils";

// Web Audio synthesizer chime for incoming orders
const playOrderChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Two-tone attention chime (C5 -> G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5
    gain2.gain.setValueAtTime(0.15, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);
  } catch {
    // Audio context may be restricted without user interaction
  }
};

interface Props {
  onOpenBillingForOrder?: (order: Order) => void;
  onOpenOngoingOrder?: (order: Order) => void;
}

export const StaffIncomingOrderDispatchBar: React.FC<Props> = ({
  onOpenBillingForOrder,
  onOpenOngoingOrder,
}) => {
  const { orders, updateOrderStatus, addToast, simulateIncomingOrder } = useApp();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevCountRef = useRef<number>(0);

  // Filter pending/incoming web and table QR orders that need cashier acceptance
  const incomingOrders = orders.filter(
    (o) =>
      o.status !== "CANCELLED" &&
      (o.status === "CONFIRMED" || o.status === "PENDING") &&
      (o.orderSource === "TABLE_QR" ||
        o.orderSource === "WEBSITE" ||
        o.fulfillmentType === "DELIVERY" ||
        (o.fulfillmentType === "DINE_IN" && o.isTableSessionActive))
  );

  // Audio alert trigger when incoming count increases
  useEffect(() => {
    if (incomingOrders.length > prevCountRef.current && soundEnabled) {
      playOrderChime();
    }
    prevCountRef.current = incomingOrders.length;
  }, [incomingOrders.length, soundEnabled]);

  const handleAcceptToKitchen = (order: Order) => {
    updateOrderStatus(order.id, "PROCESSING");
    addToast({
      title: "Order Accepted & Sent to KDS",
      description: `Order #${order.orderNumber} sent to kitchen cook line.`,
      type: "success",
    });
  };

  const handleReject = (order: Order) => {
    updateOrderStatus(order.id, "CANCELLED");
    addToast({
      title: "Order Rejected",
      description: `Order #${order.orderNumber} cancelled by POS cashier.`,
      type: "info",
    });
  };

  if (incomingOrders.length === 0) {
    return (
      <div className="bg-zinc-50 dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span className="font-bold text-zinc-700 dark:text-zinc-300">Incoming Queue: 0 Pending</span>
          <span className="hidden sm:inline text-zinc-400">• Web Takeaways & Table QR orders appear here automatically</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Test Implementation:</span>
          <button
            type="button"
            onClick={() => simulateIncomingOrder("TABLE_QR")}
            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] tracking-wide rounded cursor-pointer transition-colors shadow-xs flex items-center gap-1"
          >
            ⚡ Test Table QR Order (T-04)
          </button>
          <button
            type="button"
            onClick={() => simulateIncomingOrder("WEBSITE")}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 font-extrabold text-[10px] tracking-wide rounded cursor-pointer transition-colors flex items-center gap-1"
          >
            ⚡ Test Web Takeaway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 dark:bg-amber-950/30 border-y border-amber-500/30 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span className="font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>Incoming Orders Queue</span>
            <span className="px-1.5 py-0.2 bg-amber-500 text-black rounded font-mono font-black text-[10px]">
              {incomingOrders.length}
            </span>
          </span>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">
            • Review and dispatch orders to kitchen cook line
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => simulateIncomingOrder("TABLE_QR")}
            className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 border border-amber-500/40 rounded cursor-pointer"
          >
            + Test Order
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-amber-500 px-2 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded"
            title={soundEnabled ? "Mute sound chime" : "Unmute sound chime"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3 h-3 text-emerald-500" />
                <span>Audio Alert: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3 text-zinc-400" />
                <span>Audio Alert: OFF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Horizontal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {incomingOrders.slice(0, 6).map((order) => {
          const isTableQr = order.orderSource === "TABLE_QR" || (order.fulfillmentType === "DINE_IN" && order.tableNumber);
          const isDelivery = order.fulfillmentType === "DELIVERY";
          const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

          return (
            <div
              key={order.id}
              className="bg-white dark:bg-zinc-900 border border-amber-500/30 p-2.5 flex flex-col justify-between gap-2 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isTableQr ? (
                      <span className="px-1.5 py-0.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-extrabold text-[10px] uppercase font-mono">
                        {order.tableNumber || "Table QR"}
                      </span>
                    ) : isDelivery ? (
                      <span className="px-1.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-extrabold text-[10px] uppercase">
                        Delivery
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-extrabold text-[10px] uppercase">
                        Takeaway
                      </span>
                    )}

                    <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">
                      #{order.orderNumber}
                    </span>

                    <span className="text-[10px] text-zinc-500 font-mono">
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span className="truncate max-w-[140px]">{order.customerName}</span>
                    {order.customerPhone && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        ({order.customerPhone})
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-extrabold text-xs text-amber-600 dark:text-amber-400">
                    {formatNPR(order.totalAmount)}
                  </div>
                  <div className="text-[9px] font-bold text-zinc-500">
                    {order.paymentStatus === "PAID" ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Paid ({order.paymentMethod})</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Unpaid Cash</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items summary */}
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate bg-zinc-50 dark:bg-zinc-800/60 px-2 py-1 border border-zinc-200 dark:border-zinc-800 font-medium">
                <span className="font-bold text-zinc-900 dark:text-white">{itemCount} items: </span>
                {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => handleReject(order)}
                  className="px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-rose-500 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/40 rounded transition-colors"
                >
                  Reject
                </button>

                <div className="flex items-center gap-1.5">
                  {onOpenOngoingOrder && (
                    <button
                      type="button"
                      onClick={() => onOpenOngoingOrder(order)}
                      className="px-2 py-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-100 dark:bg-zinc-800"
                    >
                      View / Add
                    </button>
                  )}

                  {onOpenBillingForOrder && (
                    <button
                      type="button"
                      onClick={() => onOpenBillingForOrder(order)}
                      className="px-2 py-1 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-100 dark:bg-zinc-800"
                    >
                      Settle Bill
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleAcceptToKitchen(order)}
                    className="px-2.5 py-1 text-[10px] font-extrabold text-black bg-amber-500 hover:bg-amber-600 rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Send to KDS</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
