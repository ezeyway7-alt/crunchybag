import React, { useState } from "react";
import {
  Clock,
  RefreshCw,
  Volume2,
  VolumeX,
  Eye,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order, OrderStatus } from "../../types";
import { formatNPR, formatTimer } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Drawer } from "../common/Drawer";

export const StaffOrderQueue: React.FC = () => {
  const {
    orders,
    acknowledgeOrder,
    markTakeawayComplete,
    currentOutlet,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const triggerManualRefresh = () => {
    addToast({
      title: "Orders Refreshed",
      description: "Order queue is up to date.",
      type: "info",
    });
  };

  const tabs: { key: OrderStatus | "ALL"; label: string; count: number }[] = [
    { key: "ALL", label: "All Orders", count: orders.length },
    {
      key: "CONFIRMED",
      label: "New Incoming",
      count: orders.filter((o) => o.status === "CONFIRMED").length,
    },
    {
      key: "PROCESSING",
      label: "In Kitchen",
      count: orders.filter((o) => o.status === "PROCESSING").length,
    },
    {
      key: "READY",
      label: "Ready for Pickup",
      count: orders.filter((o) => o.status === "READY").length,
    },
    {
      key: "COMPLETED",
      label: "Completed",
      count: orders.filter((o) => o.status === "COMPLETED").length,
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      count: orders.filter((o) => o.status === "CANCELLED").length,
    },
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "ALL") return true;
    return o.status === activeTab;
  });

  return (
    <div className="space-y-4">
      {/* Live Order Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-900 dark:bg-[#121214] text-white border border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-2.5 h-2.5 bg-emerald-500 animate-pulse inline-block" />
            <span>Live Counter Queue • {currentOutlet.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Chime On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-zinc-400" />
                <span>Muted</span>
              </>
            )}
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={triggerManualRefresh}
            className="text-xs border-zinc-700 text-zinc-300"
            leftIcon={<RefreshCw className="h-3 w-3" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? "bg-amber-500 text-black border-amber-500 font-bold"
                  : "bg-white dark:bg-[#18181B] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 font-mono ${
                  isActive
                    ? "bg-black text-amber-400 font-bold"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-[#18181B] border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items Summary</th>
                <th className="px-4 py-3">Elapsed</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const isReady = order.status === "READY";
                  const isConfirmed = order.status === "CONFIRMED";
                  const isLongWait = order.elapsedSeconds > 15 * 60;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Order Number */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrderForDrawer(order)}
                            className="font-mono font-extrabold text-sm text-zinc-900 dark:text-white hover:text-amber-500 transition-colors cursor-pointer"
                          >
                            #{order.orderNumber}
                          </button>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">
                            {order.fulfillmentType}
                          </span>
                        </div>
                      </td>

                      {/* Customer info */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {order.customerName}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {order.customerPhone}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {order.items.reduce((acc, i) => acc + i.quantity, 0)} items total
                        </p>
                      </td>

                      {/* Elapsed Timer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono font-bold">
                          <Clock className={`h-3.5 w-3.5 ${isLongWait ? "text-rose-500 animate-pulse" : "text-amber-500"}`} />
                          <span className={isLongWait ? "text-rose-500 font-bold" : "text-zinc-700 dark:text-zinc-300"}>
                            {formatTimer(order.elapsedSeconds)}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 font-mono font-bold text-zinc-950 dark:text-amber-400">
                        {formatNPR(order.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            order.status === "READY"
                              ? "success"
                              : order.status === "PROCESSING"
                              ? "warning"
                              : order.status === "COMPLETED"
                              ? "neutral"
                              : order.status === "CANCELLED"
                              ? "danger"
                              : "brand"
                          }
                          size="sm"
                        >
                          {order.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isConfirmed && (
                            <Button
                              size="sm"
                              variant="primary"
                              className="font-bold text-xs"
                              onClick={() => acknowledgeOrder(order.id)}
                            >
                              Send to Kitchen
                            </Button>
                          )}

                          {isReady && (
                            <Button
                              size="sm"
                              variant="primary"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              onClick={() => markTakeawayComplete(order.id)}
                            >
                              Hand Over
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs"
                            onClick={() => setSelectedOrderForDrawer(order)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    No orders in "{activeTab}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={!!selectedOrderForDrawer}
        onClose={() => setSelectedOrderForDrawer(null)}
        title={`Order #${selectedOrderForDrawer?.orderNumber}`}
        description={`Fulfillment: ${selectedOrderForDrawer?.fulfillmentType} • ${selectedOrderForDrawer?.outletName}`}
      >
        {selectedOrderForDrawer && (
          <div className="space-y-5 text-xs">
            {/* Customer Details */}
            <div className="p-4 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h5 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                Customer & Pickup Info
              </h5>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white">
                    {selectedOrderForDrawer.customerName}
                  </p>
                  <p className="text-zinc-500 font-mono">{selectedOrderForDrawer.customerPhone}</p>
                </div>
                <Badge variant="brand" size="sm">
                  {selectedOrderForDrawer.paymentMethod.replace(/_/g, " ")}
                </Badge>
              </div>
              {selectedOrderForDrawer.notes && (
                <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                  <strong>Notes:</strong> {selectedOrderForDrawer.notes}
                </div>
              )}
            </div>

            {/* Items Snapshot */}
            <div className="space-y-2">
              <h5 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                Order Items
              </h5>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 p-3 bg-white dark:bg-[#18181B]">
                {selectedOrderForDrawer.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">
                        {item.quantity}x {item.productName}
                      </p>
                      <p className="text-amber-500 font-semibold">{item.variantName}</p>
                      {item.modifiersSummary.map((m, idx) => (
                        <p key={idx} className="text-zinc-400 text-[11px]">
                          • {m}
                        </p>
                      ))}
                    </div>
                    <span className="font-mono font-bold">
                      {formatNPR(item.lineTotal)}
                    </span>
                  </div>
                ))}

                <div className="pt-3 space-y-1 font-mono">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal:</span>
                    <span>{formatNPR(selectedOrderForDrawer.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>13% VAT Included:</span>
                    <span>{formatNPR(selectedOrderForDrawer.vatIncludedAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-zinc-950 dark:text-white pt-1">
                    <span>Total Amount:</span>
                    <span className="text-amber-500">{formatNPR(selectedOrderForDrawer.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
