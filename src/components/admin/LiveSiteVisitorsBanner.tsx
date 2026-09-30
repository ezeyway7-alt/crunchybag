import React from "react";
import {
  TrendingUp,
  Flame,
  Package,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { formatNPR } from "../../lib/utils";

interface Props {
  totalRevenue: number;
  totalOrders: number;
  activeKitchenOrders: number;
  readyOrders: number;
  lowStockCount: number;
}

export const LiveSiteVisitorsBanner: React.FC<Props> = ({
  totalRevenue,
  totalOrders,
  activeKitchenOrders,
  readyOrders,
  lowStockCount,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {/* Net Sales */}
      <div className="bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Today's Net Sales
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-emerald-400">
            {formatNPR(totalRevenue)}
          </span>
        </div>
        <div className="w-8 h-8 rounded-none bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>

      {/* Total Orders */}
      <div className="bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Orders Today
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-zinc-100">
            {totalOrders}
          </span>
        </div>
        <div className="w-8 h-8 rounded-none bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
          <Receipt className="w-4 h-4" />
        </div>
      </div>

      {/* Active Kitchen Queue */}
      <div className="bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            In Kitchen Queue
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-amber-400">
            {activeKitchenOrders}
          </span>
        </div>
        <div className="w-8 h-8 rounded-none bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
          <Flame className="w-4 h-4" />
        </div>
      </div>

      {/* Ready for Pickup */}
      <div className="bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Ready / Pickup
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-sky-400">
            {readyOrders}
          </span>
        </div>
        <div className="w-8 h-8 rounded-none bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
          <Package className="w-4 h-4" />
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="col-span-2 sm:col-span-1 bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Low Stock Alerts
          </span>
          <span
            className={`font-mono text-sm sm:text-base font-bold ${
              lowStockCount > 0 ? "text-rose-400" : "text-zinc-400"
            }`}
          >
            {lowStockCount} {lowStockCount === 1 ? "item" : "items"}
          </span>
        </div>
        <div
          className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${
            lowStockCount > 0
              ? "bg-rose-500/10 text-rose-400 animate-pulse"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
