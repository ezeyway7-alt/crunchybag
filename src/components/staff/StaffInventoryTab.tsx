import React, { useState, useMemo } from "react";
import {
  Truck,
  Scale,
  History,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileText,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatNPR } from "../../lib/utils";
import { PurchaseInwardWorkbench } from "./inventory/PurchaseInwardWorkbench";
import { PurchaseBillsDatatable } from "./inventory/PurchaseBillsDatatable";
import { StockAuditWorkbench } from "./inventory/StockAuditWorkbench";

export const StaffInventoryTab: React.FC = () => {
  const {
    inventory,
    stockMovements,
    purchases,
    addToast,
  } = useApp();

  // Active view:
  // "purchase" = Inward Purchase (Bill Entry) + Invoices Datatable below
  // "audit" = Stock Audit & Discrepancies
  // "movements" = Stock Movement Log
  const [activeView, setActiveView] = useState<"purchase" | "audit" | "movements">("purchase");

  // Filter state for Stock Movement view
  const [movementSearch, setMovementSearch] = useState("");
  const [movementPage, setMovementPage] = useState(1);
  const [movementPageSize] = useState(15);
  const [movementTypeFilter, setMovementTypeFilter] = useState<"ALL" | "INCREASE" | "DECREASE">("ALL");
  const [movementReasonFilter, setMovementReasonFilter] = useState<string>("ALL");

  // Overall Inventory Stats (clean inline labels & values)
  const totalItemsCount = inventory.length;
  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minThreshold).length;
  const totalValuation = inventory.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
  const totalPurchasesCount = purchases.length;
  const totalMovementsCount = stockMovements.length;

  // Filtered Movements for Movement Log Tab
  const filteredMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      if (movementTypeFilter !== "ALL" && m.type !== movementTypeFilter) return false;
      if (movementReasonFilter !== "ALL" && !m.reason.includes(movementReasonFilter)) return false;

      if (movementSearch.trim()) {
        const q = movementSearch.toLowerCase();
        return (
          m.itemName.toLowerCase().includes(q) ||
          m.reason.toLowerCase().includes(q) ||
          (m.note && m.note.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [stockMovements, movementTypeFilter, movementReasonFilter, movementSearch]);

  const totalMovementPages = Math.max(1, Math.ceil(filteredMovements.length / movementPageSize));
  const paginatedMovements = useMemo(() => {
    const startIdx = (movementPage - 1) * movementPageSize;
    return filteredMovements.slice(startIdx, startIdx + movementPageSize);
  }, [filteredMovements, movementPage, movementPageSize]);

  return (
    <div className="space-y-3">
      {/* -------------------------------------------------------------
          TOP INLINE TEXT VALUE SUMMARY (NO BULKY BOX CARDS)
      ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 py-1 font-medium overflow-x-auto no-scrollbar border-b border-zinc-800 pb-2">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Tracked SKUs:</span>
          <strong className="font-mono text-zinc-100 font-bold">{totalItemsCount}</strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className={lowStockCount > 0 ? "text-amber-500 font-bold" : "text-zinc-500"}>
            Low Stock:
          </span>
          <strong
            className={`font-mono font-bold ${
              lowStockCount > 0 ? "text-amber-400" : "text-zinc-300"
            }`}
          >
            {lowStockCount}
          </strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Total Stock Value:</span>
          <strong className="font-mono text-emerald-400 font-bold">
            {formatNPR(totalValuation)}
          </strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Inward Bills:</span>
          <strong className="font-mono text-zinc-200 font-bold">{totalPurchasesCount}</strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Movement Logs:</span>
          <strong className="font-mono text-zinc-300 font-bold">{totalMovementsCount}</strong>
        </span>
      </div>

      {/* -------------------------------------------------------------
          CLEAN VIEW NAVIGATION TABS
          1. Inward Purchase & Bills
          2. Stock Audit & Discrepancies
          3. Stock Movement
      ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* 1. Inward Purchase & Bills */}
          <button
            type="button"
            onClick={() => setActiveView("purchase")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition-colors whitespace-nowrap ${
              activeView === "purchase"
                ? "bg-amber-500 text-black border-amber-500 font-black"
                : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Inward Purchase & Bills ({purchases.length})</span>
          </button>

          {/* 2. Stock Audit */}
          <button
            type="button"
            onClick={() => setActiveView("audit")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition-colors whitespace-nowrap ${
              activeView === "audit"
                ? "bg-amber-500 text-black border-amber-500 font-black"
                : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Stock Audit & Discrepancies</span>
          </button>

          {/* 3. Stock Movement */}
          <button
            type="button"
            onClick={() => setActiveView("movements")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition-colors whitespace-nowrap ${
              activeView === "movements"
                ? "bg-amber-500 text-black border-amber-500 font-black"
                : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Movement ({stockMovements.length})</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          VIEW 1: INWARD PURCHASE BILL ENTRY & INVOICES DATATABLE JUST BELOW
      ------------------------------------------------------------- */}
      {activeView === "purchase" && (
        <div className="space-y-4">
          {/* Purchase Inward Form (Workbench) */}
          <div>
            <PurchaseInwardWorkbench
              onPurchaseSaved={() => {
                addToast({
                  title: "Purchase Bill Recorded",
                  description: "Inventory restocked and purchase invoice logged below.",
                  type: "success",
                });
              }}
            />
          </div>

          {/* Just below the form of the purchase bill: Purchase Invoices & Bills Datatable */}
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <FileText className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Purchase Invoices & Bills History ({purchases.length})
              </h3>
            </div>
            <PurchaseBillsDatatable />
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 2: STOCK AUDIT WORKBENCH
      ------------------------------------------------------------- */}
      {activeView === "audit" && <StockAuditWorkbench />}

      {/* -------------------------------------------------------------
          VIEW 3: STOCK MOVEMENT LOG & AUDIT TRAIL
      ------------------------------------------------------------- */}
      {activeView === "movements" && (
        <div className="bg-[#141417] border border-zinc-800 p-3 shadow-sm space-y-3">
          {/* Filter Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold uppercase text-zinc-200">
                Stock Movements Audit Trail ({stockMovements.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={movementTypeFilter}
                onChange={(e) => {
                  setMovementTypeFilter(e.target.value as any);
                  setMovementPage(1);
                }}
                className="h-8 px-2 bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Directions</option>
                <option value="INCREASE">Stock Inward (+)</option>
                <option value="DECREASE">Stock Outward (-)</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={movementSearch}
                  onChange={(e) => {
                    setMovementSearch(e.target.value);
                    setMovementPage(1);
                  }}
                  placeholder="Search item, reason, note..."
                  className="w-48 sm:w-56 h-8 pl-8 pr-6 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                {movementSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setMovementSearch("");
                      setMovementPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Movement Records Table */}
          <div className="overflow-x-auto border border-zinc-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Time & Date</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-2.5">Type</th>
                  <th className="py-2.5 px-3 text-right">Qty Changed</th>
                  <th className="py-2.5 px-3 text-right">Prev ➔ New</th>
                  <th className="py-2.5 px-3">Accountable Reason</th>
                  <th className="py-2.5 px-3">Explanatory Note</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-[#141417]">
                {paginatedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500 text-xs">
                      No stock movement records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedMovements.map((mov) => {
                    const isIncrease = mov.type === "INCREASE";

                    return (
                      <tr key={mov.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-zinc-400">
                          {mov.timestamp}
                        </td>

                        <td className="py-2 px-3">
                          <p className="font-bold text-zinc-100">{mov.itemName}</p>
                          {mov.category && (
                            <p className="text-[10px] text-zinc-500">{mov.category}</p>
                          )}
                        </td>

                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {isIncrease ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <ArrowUpRight className="w-3 h-3" /> In (+)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <ArrowDownRight className="w-3 h-3" /> Out (-)
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap text-right font-mono font-black text-xs">
                          <span className={isIncrease ? "text-emerald-400" : "text-rose-400"}>
                            {isIncrease ? "+" : "-"}
                            {mov.quantity} {mov.unit}
                          </span>
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap text-right font-mono text-xs text-zinc-400">
                          <span>{mov.previousStock}</span>
                          <span className="mx-1 text-zinc-600">➔</span>
                          <strong className="text-zinc-100 font-bold">
                            {mov.newStock} {mov.unit}
                          </strong>
                        </td>

                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-[11px] font-bold border ${
                              isIncrease
                                ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                                : mov.reason.includes("Wastage") ||
                                  mov.reason.includes("Expired") ||
                                  mov.reason.includes("Theft")
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30 font-black"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {mov.reason}
                          </span>
                        </td>

                        <td className="py-2 px-3 max-w-[200px]">
                          {mov.note ? (
                            <p className="text-xs text-zinc-300 italic truncate" title={mov.note}>
                              "{mov.note}"
                            </p>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap text-xs text-zinc-400 font-medium">
                          {mov.recordedBy || "Staff Member"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Movements Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-zinc-500">
            <div>
              Showing{" "}
              <strong className="text-zinc-200">
                {filteredMovements.length === 0 ? 0 : (movementPage - 1) * movementPageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-zinc-200">
                {Math.min(movementPage * movementPageSize, filteredMovements.length)}
              </strong>{" "}
              of <strong className="text-zinc-200">{filteredMovements.length}</strong> events
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={movementPage <= 1}
                onClick={() => setMovementPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-zinc-800 text-xs"
              >
                Prev
              </button>
              <span className="px-2 py-1 font-mono text-zinc-400 text-xs">
                {movementPage} / {totalMovementPages}
              </span>
              <button
                type="button"
                disabled={movementPage >= totalMovementPages}
                onClick={() => setMovementPage((p) => Math.min(totalMovementPages, p + 1))}
                className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-zinc-800 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
