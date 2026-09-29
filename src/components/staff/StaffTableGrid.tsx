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
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order } from "../../types";
import { formatNPR } from "../../lib/utils";

interface Props {
  posMeta?: any;
  orders: Order[];
  outlet: string;
  onSelectTableForNewOrder: (tableId: string) => void;
  onSelectOngoingOrder: (order: Order) => void;
  onOpenBillingForOrder?: (order: Order) => void;
}

export const StaffTableGrid: React.FC<Props> = ({
  posMeta,
  orders,
  outlet,
  onSelectTableForNewOrder,
  onSelectOngoingOrder,
  onOpenBillingForOrder,
}) => {
  const allTables: string[] = (posMeta?.tables || []).map(t => t.table_number);
  const tableOrderMap: Record<string, Order> = {};
  (posMeta?.tables || []).forEach(table => {
    const order = orders.find(o => (o as any)._posOrder?.id === table.active_order_id);
    if (order) tableOrderMap[table.table_number] = order;
  });
  const occupiedCount = (posMeta?.tables || []).filter(t => t.active_order_id).length;
  const vacantCount = allTables.length - occupiedCount;
  const totalOnTables = Object.values(tableOrderMap).reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 space-y-3">
      {/* Metric Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-zinc-500">Available Tables:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{vacantCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-zinc-500">Occupied:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{occupiedCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-zinc-500">Running Dine-In Revenue:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-white">{formatNPR(totalOnTables)}</span>
          </div>
        </div>

        <div className="text-[11px] text-zinc-400">
          Tip: Tap any vacant table to start a new order, or tap an occupied table to add food/settle bill.
        </div>
      </div>

      {!allTables.length && <p className="text-xs text-zinc-400">No tables configured.</p>}
      {/* Configured tables, with the original card layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
        {allTables.map((tableId) => {
          const activeOrder = tableOrderMap[tableId];
          const table = posMeta?.tables.find(t => t.table_number === tableId);
          const isOccupied = !!table?.active_order_id;
          const isBillRequested = isOccupied && activeOrder?.notes?.toLowerCase().includes("bill");

          if (!isOccupied) {
            return (
              <button
                key={tableId} title={posMeta?.tables.find(t => t.table_number === tableId)?.section}
                type="button"
                onClick={() => onSelectTableForNewOrder(tableId)}
                className="group border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 p-2.5 flex flex-col items-center justify-between text-center min-h-[95px] transition-all cursor-pointer rounded-xs"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                    {tableId}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>

                <div className="my-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-600/80 dark:text-emerald-400/80 block">
                    Available
                  </span>
                  <span className="text-[9px] text-zinc-400">{table?.capacity} Seats</span>
                </div>

                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                  <Plus className="w-3 h-3" />
                  <span>Start Order</span>
                </div>
              </button>
            );
          }

          // Occupied Table Card
          if (!activeOrder) return <div key={tableId} title={posMeta?.tables.find(t => t.table_number === tableId)?.section} className="border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">{tableId} — Occupied</div>;
          const itemCount = activeOrder.items.reduce((sum, i) => sum + i.quantity, 0);

          return (
            <div
              key={tableId} title={posMeta?.tables.find(t => t.table_number === tableId)?.section}
              className={`border p-2.5 flex flex-col justify-between min-h-[95px] transition-all rounded-xs ${
                isBillRequested
                  ? "border-purple-500 bg-purple-500/15 animate-pulse"
                  : "border-amber-500/40 bg-amber-500/10 hover:border-amber-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
                  {tableId}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              </div>

              <div className="my-1 space-y-0.5 text-left">
                <div className="text-[10px] font-bold text-zinc-900 dark:text-white truncate">
                  {activeOrder.customerName}
                </div>
                <div className="text-[10px] font-mono font-extrabold text-amber-600 dark:text-amber-400">
                  {formatNPR(activeOrder.totalAmount)}
                </div>
                <div className="text-[9px] text-zinc-500 font-medium">
                  {itemCount} items • #{activeOrder.orderNumber}
                </div>
              </div>

              <div className="flex items-center gap-1 pt-1 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => onSelectOngoingOrder(activeOrder)}
                  className="flex-1 py-0.5 text-[10px] font-bold bg-zinc-900 text-white dark:bg-zinc-800 hover:bg-zinc-700 text-center rounded-xs transition-colors"
                  title="Add items to table tab"
                >
                  + Food
                </button>

                {onOpenBillingForOrder && (
                  <button
                    type="button"
                    onClick={() => onOpenBillingForOrder(activeOrder)}
                    className="flex-1 py-0.5 text-[10px] font-extrabold bg-amber-500 hover:bg-amber-600 text-black text-center rounded-xs transition-colors"
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
