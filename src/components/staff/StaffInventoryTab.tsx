import React, { useState, useMemo } from "react";
import {
  Boxes,
  Truck,
  FileText,
  Scale,
  History,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatNPR } from "../../lib/utils";
import { StockCatalogWorkbench } from "./inventory/StockCatalogWorkbench";
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
  // "items" = Stock Items Catalog & SKUs
  // "purchase" = Inward Bill Entry Form
  // "bills" = Purchase Invoices Datatable
  // "audit" = Stock Audit & Variances
  // "movements" = Stock Movement Log
  const [activeView, setActiveView] = useState<"items" | "purchase" | "bills" | "audit" | "movements">("items");

  // Movement Log state
  const [movementSearch, setMovementSearch] = useState("");
  const [movementPage, setMovementPage] = useState(1);
  const [movementPageSize] = useState(15);
  const [movementTypeFilter, setMovementTypeFilter] = useState<"ALL" | "INCREASE" | "DECREASE">("ALL");

  // Overall Inventory Stats
  const totalItemsCount = inventory.length;
  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minThreshold).length;
  const totalValuation = inventory.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
  const totalPurchasesCount = purchases.length;
  const totalMovementsCount = stockMovements.length;

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      if (movementTypeFilter !== "ALL" && m.type !== movementTypeFilter) return false;

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
  }, [stockMovements, movementTypeFilter, movementSearch]);

  const totalMovementPages = Math.max(1, Math.ceil(filteredMovements.length / movementPageSize));
  const paginatedMovements = useMemo(() => {
    const startIdx = (movementPage - 1) * movementPageSize;
    return filteredMovements.slice(startIdx, startIdx + movementPageSize);
  }, [filteredMovements, movementPage, movementPageSize]);

  return (
    <div className="space-y-3.5">
      {/* -------------------------------------------------------------
          TOP METRICS STRIP (CLEAN, BORDERLESS INLINE TEXT)
      ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-zinc-400 py-1 font-medium overflow-x-auto no-scrollbar">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-zinc-500">Tracked SKUs:</span>
          <strong className="font-mono text-zinc-100 font-bold">{totalItemsCount}</strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              lowStockCount > 0 ? "bg-rose-500" : "bg-zinc-600"
            }`}
          />
          <span className={lowStockCount > 0 ? "text-rose-400 font-semibold" : "text-zinc-500"}>
            Low Stock:
          </span>
          <strong
            className={`font-mono font-bold ${
              lowStockCount > 0 ? "text-rose-400" : "text-zinc-300"
            }`}
          >
            {lowStockCount}
          </strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-500">Valuation:</span>
          <strong className="font-mono text-emerald-400 font-bold">
            {formatNPR(totalValuation)}
          </strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span className="text-zinc-500">Inward Bills:</span>
          <strong className="font-mono text-zinc-200 font-bold">{totalPurchasesCount}</strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          <span className="text-zinc-500">Movements:</span>
          <strong className="font-mono text-zinc-300 font-bold">{totalMovementsCount}</strong>
        </span>
      </div>

      {/* -------------------------------------------------------------
          CLEAN VIEW NAVIGATION TABS (BORDERLESS PILL SWITCHER)
      ------------------------------------------------------------- */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => setActiveView("items")}
          className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap font-medium ${
            activeView === "items"
              ? "bg-zinc-800 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Stock Items</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("purchase")}
          className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap font-medium ${
            activeView === "purchase"
              ? "bg-zinc-800 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Inward Purchase</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("bills")}
          className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap font-medium ${
            activeView === "bills"
              ? "bg-zinc-800 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Bills History ({purchases.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("audit")}
          className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap font-medium ${
            activeView === "audit"
              ? "bg-zinc-800 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Stock Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("movements")}
          className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap font-medium ${
            activeView === "movements"
              ? "bg-zinc-800 text-white font-bold shadow-xs"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Movements ({stockMovements.length})</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          VIEWS RENDERING
      ------------------------------------------------------------- */}
      {/* VIEW 1: STOCK ITEMS MASTER */}
      {activeView === "items" && <StockCatalogWorkbench />}

      {/* VIEW 2: INWARD PURCHASE BILL ENTRY */}
      {activeView === "purchase" && (
        <PurchaseInwardWorkbench
          onPurchaseSaved={() => {
            addToast({
              title: "Bill Saved",
              description: "Purchase recorded and stock restocked.",
              type: "success",
            });
          }}
        />
      )}

      {/* VIEW 3: BILLS HISTORY */}
      {activeView === "bills" && <PurchaseBillsDatatable />}

      {/* VIEW 4: STOCK AUDIT */}
      {activeView === "audit" && <StockAuditWorkbench />}

      {/* VIEW 5: STOCK MOVEMENTS LOG */}
      {activeView === "movements" && (
        <div className="bg-zinc-900/40 p-4 rounded-xl space-y-3.5">
          {/* Controls Bar (Borderless) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-zinc-200">
                Stock Movements ({stockMovements.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={movementTypeFilter}
                onChange={(e) => {
                  setMovementTypeFilter(e.target.value as any);
                  setMovementPage(1);
                }}
                className="h-8 px-2 bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Directions</option>
                <option value="INCREASE">Inward (+)</option>
                <option value="DECREASE">Outward (-)</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={movementSearch}
                  onChange={(e) => {
                    setMovementSearch(e.target.value);
                    setMovementPage(1);
                  }}
                  placeholder="Search movements..."
                  className="w-48 sm:w-56 h-8 pl-8 pr-7 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                />
                {movementSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setMovementSearch("");
                      setMovementPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Borderless Table */}
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900/60 text-zinc-400 text-[11px] font-semibold">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-2.5">Type</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Stock Level</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Note</th>
                  <th className="py-2.5 px-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {paginatedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500 text-xs">
                      No stock movement records found.
                    </td>
                  </tr>
                ) : (
                  paginatedMovements.map((mov) => {
                    const isIncrease = mov.type === "INCREASE";

                    return (
                      <tr key={mov.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-zinc-400">
                          {mov.timestamp}
                        </td>

                        <td className="py-2 px-3">
                          <p className="font-semibold text-zinc-100">{mov.itemName}</p>
                          {mov.category && (
                            <p className="text-[10px] text-zinc-500">{mov.category}</p>
                          )}
                        </td>

                        <td className="py-2 px-2.5 whitespace-nowrap">
                          {isIncrease ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 rounded">
                              <ArrowUpRight className="w-3 h-3" /> In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/10 text-rose-400 rounded">
                              <ArrowDownRight className="w-3 h-3" /> Out
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap text-right font-mono font-bold text-xs">
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

                        <td className="py-2 px-3 text-zinc-300">
                          <span className="text-[11px] font-medium">{mov.reason}</span>
                        </td>

                        <td className="py-2 px-3 max-w-[200px] text-zinc-400">
                          {mov.note ? (
                            <p className="text-xs truncate italic" title={mov.note}>
                              "{mov.note}"
                            </p>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap text-xs text-zinc-400">
                          {mov.recordedBy || "Staff"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-zinc-500">
            <div>
              Showing{" "}
              <strong className="text-zinc-300">
                {filteredMovements.length === 0 ? 0 : (movementPage - 1) * movementPageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-zinc-300">
                {Math.min(movementPage * movementPageSize, filteredMovements.length)}
              </strong>{" "}
              of <strong className="text-zinc-300">{filteredMovements.length}</strong> events
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={movementPage <= 1}
                onClick={() => setMovementPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-zinc-900/80 text-zinc-400 hover:text-white rounded disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-xs"
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
                className="px-2.5 py-1 bg-zinc-900/80 text-zinc-400 hover:text-white rounded disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-xs"
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
