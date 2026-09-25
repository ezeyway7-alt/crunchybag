import React, { useState } from "react";
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Receipt,
  UserCheck,
  ChevronRight,
  LogOut,
  Store,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { formatNPR, formatTimer } from "../../lib/utils";

interface TableInfo {
  id: string;
  name: string;
  capacity: number;
  status: "FREE" | "OCCUPIED" | "BILLING" | "NEEDS_SERVICE";
  currentOrderId?: string;
  guestCount?: number;
  elapsedMinutes?: number;
  totalBill?: number;
}

export const WaiterPortal: React.FC = () => {
  const { currentOutlet, orders, addToast } = useApp();
  const { authUser, logout } = useAuth();

  const [tables, setTables] = useState<TableInfo[]>([
    { id: "T1", name: "Table 01", capacity: 2, status: "OCCUPIED", currentOrderId: "CR-8921", guestCount: 2, elapsedMinutes: 18, totalBill: 1250 },
    { id: "T2", name: "Table 02", capacity: 4, status: "FREE" },
    { id: "T3", name: "Table 03", capacity: 4, status: "BILLING", currentOrderId: "CR-8920", guestCount: 3, elapsedMinutes: 45, totalBill: 2840 },
    { id: "T4", name: "Table 04", capacity: 6, status: "OCCUPIED", currentOrderId: "CR-8919", guestCount: 5, elapsedMinutes: 12, totalBill: 3450 },
    { id: "T5", name: "Table 05", capacity: 2, status: "NEEDS_SERVICE", currentOrderId: "CR-8918", guestCount: 1, elapsedMinutes: 28, totalBill: 620 },
    { id: "T6", name: "Table 06", capacity: 8, status: "FREE" },
    { id: "T7", name: "Table 07", capacity: 4, status: "FREE" },
    { id: "T8", name: "Table 08", capacity: 4, status: "OCCUPIED", currentOrderId: "CR-8915", guestCount: 4, elapsedMinutes: 32, totalBill: 2190 },
  ]);

  const [selectedTableId, setSelectedTableId] = useState<string>("T1");
  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];
  const activeOrder = orders.find((o) => o.orderNumber === selectedTable?.currentOrderId) || orders[0];

  const handleUpdateStatus = (tableId: string, newStatus: TableInfo["status"]) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
    );
    addToast({
      title: "Table Status Updated",
      description: `${tableId} marked as ${newStatus}`,
      type: "info",
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800 bg-[#121214] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Waiter Station</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 font-mono px-1.5 py-0.5 rounded">
                Floor Service
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {currentOutlet.name} • Branch: {currentOutlet.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-zinc-200">{authUser?.name || authUser?.username || "Server Staff"}</p>
            <p className="text-[10px] text-zinc-400">{authUser?.role || "WAITER"}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-zinc-300 hover:text-rose-400 text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Waiter Floor Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Table Floor Map (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              Dining Tables & Live Tabs
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Free
              </span>
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Dining
              </span>
              <span className="inline-flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> Bill Req
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tables.map((tbl) => {
              const isSelected = tbl.id === selectedTableId;
              const statusColor =
                tbl.status === "FREE"
                  ? "border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500"
                  : tbl.status === "BILLING"
                  ? "border-sky-500/50 bg-sky-950/20 hover:border-sky-400"
                  : tbl.status === "NEEDS_SERVICE"
                  ? "border-rose-500/50 bg-rose-950/20 hover:border-rose-400"
                  : "border-amber-500/40 bg-amber-950/15 hover:border-amber-500";

              return (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => setSelectedTableId(tbl.id)}
                  className={`p-4 border text-left transition-all cursor-pointer relative ${statusColor} ${
                    isSelected ? "ring-2 ring-amber-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-base text-white">{tbl.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {tbl.capacity} Seats
                    </span>
                  </div>

                  {tbl.status === "FREE" ? (
                    <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-300 font-mono">
                        {formatNPR(tbl.totalBill || 0)}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <Clock className="w-3 h-3" />
                        <span>{tbl.elapsedMinutes}m ago</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Table Inspection Sidebar (Col 3) */}
        <div className="bg-[#121214] border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedTable.name}</h3>
                <p className="text-xs text-zinc-400">
                  Status: <span className="font-semibold text-amber-400">{selectedTable.status}</span>
                </p>
              </div>
              <span className="text-xs font-mono bg-zinc-800 px-2 py-1 text-zinc-300">
                {selectedTable.capacity} Seats
              </span>
            </div>

            {selectedTable.status === "FREE" ? (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <UtensilsCrossed className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm">Table is currently clean & empty</p>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedTable.id, "OCCUPIED")}
                  className="px-4 py-2 bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
                >
                  Seat Guests & Open Tab
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Active Ticket</span>
                  <span className="font-mono text-zinc-200">
                    {selectedTable.currentOrderId || activeOrder.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Guest Seating</span>
                  <span className="text-zinc-200">{selectedTable.guestCount || 2} Guests</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Order Round Total</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {formatNPR(selectedTable.totalBill || activeOrder.totalAmount)}
                  </span>
                </div>

                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-xs font-bold text-zinc-400 mb-2">Order Items Snapshot</p>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                    {activeOrder.items.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-zinc-300">
                        <span>
                          {item.quantity}x {item.productName} ({item.variantName})
                        </span>
                        <span className="font-mono text-zinc-400">{formatNPR(item.lineTotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedTable.status !== "FREE" && (
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedTable.id, "BILLING")}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Request Bill & Settle</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedTable.id, "FREE")}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Mark Table Cleaned (Free)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
