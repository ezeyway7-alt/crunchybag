import React, { useState } from "react";
import {
  Utensils,
  CheckCircle2,
  Clock,
  Plus,
  Receipt,
  User,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order } from "../../types";
import { formatNPR, isSameTable } from "../../lib/utils";

interface Props {
  posMeta?: any;
  orders: Order[];
  outlet: string;
  onSelectTableForNewOrder: (tableId: string) => void;
  onSelectOngoingOrder: (order: Order) => void;
  onOpenBillingForOrder?: (order: Order) => void;
  onOpenManageTables?: () => void;
}

export const StaffTableGrid: React.FC<Props> = ({
  posMeta,
  orders,
  outlet,
  onSelectTableForNewOrder,
  onSelectOngoingOrder,
  onOpenBillingForOrder,
  onOpenManageTables,
}) => {
  const allTables: string[] = (posMeta?.tables || []).map((t: any) => t.table_number);
  const tableOrderMap: Record<string, Order> = {};
  (posMeta?.tables || []).forEach((table: any) => {
    const order = orders.find((o) => {
      if (o.status === "COMPLETED" || o.status === "CANCELLED") return false;
      const isSettled =
        (o.isBilled && o.paymentStatus === "PAID") ||
        (o as any)._posOrder?.settlement === "PAID";
      if (isSettled) return false;

      if (table.active_order_id && ((o as any)._posOrder?.id === table.active_order_id || o.id === String(table.active_order_id) || o.orderNumber === String(table.active_order_id))) {
        return true;
      }
      return isSameTable(o.tableNumber, table.table_number);
    });
    if (order) tableOrderMap[table.table_number] = order;
  });
  const occupiedCount = (posMeta?.tables || []).filter((t: any) => Boolean(t.active_order_id || tableOrderMap[t.table_number])).length;
  const vacantCount = allTables.length - occupiedCount;
  const totalOnTables = Object.values(tableOrderMap).reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-3 space-y-2.5">
      {/* Metric Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-500">Available:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{vacantCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-zinc-500">Occupied:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{occupiedCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-zinc-500">Active Total:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-white">{formatNPR(totalOnTables)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenManageTables && (
            <button
              type="button"
              onClick={onOpenManageTables}
              className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] border border-amber-400 flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              title="Open table management drawer"
            >
              <Zap className="w-3 h-3 fill-black" />
              <span>Manage Tables</span>
            </button>
          )}
          <span className="text-[10.5px] text-zinc-400 hidden md:inline">
            Tap vacant to order • Occupied to add food/bill
          </span>
        </div>
      </div>

      {!allTables.length && <p className="text-xs text-zinc-400">No tables configured.</p>}

      {/* Configured tables: Compact Space-Saving Card Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-1.5 sm:gap-2">
        {allTables.map((tableId) => {
          const activeOrder = tableOrderMap[tableId];
          const table = posMeta?.tables.find((t: any) => t.table_number === tableId);
          const isOccupied = Boolean(table?.active_order_id || activeOrder);
          const isBillRequested = isOccupied && activeOrder?.notes?.toLowerCase().includes("bill");

          if (!isOccupied) {
            return (
              <button
                key={tableId}
                title={table?.section || "Table"}
                type="button"
                onClick={() => onSelectTableForNewOrder(tableId)}
                className="group border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 p-1.5 sm:p-2 flex flex-col items-center justify-between text-center min-h-[72px] sm:min-h-[76px] transition-all cursor-pointer rounded-xs"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-black text-[11px] text-emerald-600 dark:text-emerald-400">
                    {tableId}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>

                <div className="my-0.5">
                  <span className="text-[9px] uppercase font-bold text-emerald-600/80 dark:text-emerald-400/80 block leading-tight">
                    Available
                  </span>
                  <span className="text-[8px] text-zinc-400">{table?.capacity || 4} Seats</span>
                </div>

                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                  <Plus className="w-2.5 h-2.5" />
                  <span>Order</span>
                </div>
              </button>
            );
          }

          // Occupied Table Card (Compact)
          if (!activeOrder) {
            return (
              <div
                key={tableId}
                title={table?.section}
                className="border border-amber-500/40 bg-amber-500/10 p-1.5 text-[10px] min-h-[72px] flex items-center justify-center text-center font-bold"
              >
                {tableId} — Occupied
              </div>
            );
          }
          const itemCount = activeOrder.items.reduce((sum, i) => sum + i.quantity, 0);

          return (
            <div
              key={tableId}
              title={table?.section}
              className={`border p-1.5 sm:p-2 flex flex-col justify-between min-h-[72px] sm:min-h-[76px] transition-all rounded-xs ${
                isBillRequested
                  ? "border-purple-500 bg-purple-500/15 animate-pulse"
                  : "border-amber-500/40 bg-amber-500/10 hover:border-amber-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-[11px] text-amber-600 dark:text-amber-400">
                  {tableId}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              </div>

              <div className="my-0.5 space-y-0.2 text-left">
                <div className="text-[9px] font-bold text-zinc-900 dark:text-white truncate">
                  {activeOrder.customerName}
                </div>
                <div className="text-[9.5px] font-mono font-black text-amber-600 dark:text-amber-400">
                  {formatNPR(activeOrder.totalAmount)}
                </div>
                <div className="text-[8px] text-zinc-500 font-medium">
                  {itemCount} items
                </div>
              </div>

              <div className="flex items-center gap-1 pt-0.5 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => onSelectOngoingOrder(activeOrder)}
                  className="flex-1 py-0.5 text-[8.5px] font-bold bg-zinc-900 text-white dark:bg-zinc-800 hover:bg-zinc-700 text-center rounded-xs transition-colors"
                  title="Add items to table tab"
                >
                  +Food
                </button>

                {onOpenBillingForOrder && (
                  <button
                    type="button"
                    onClick={() => onOpenBillingForOrder(activeOrder)}
                    className="flex-1 py-0.5 text-[8.5px] font-extrabold bg-amber-500 hover:bg-amber-600 text-black text-center rounded-xs transition-colors"
                    title="Generate bill & settle"
                  >
                    Bill
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
