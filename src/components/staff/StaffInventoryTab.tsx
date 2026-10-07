import { SupplierAccountsWorkbench } from "./inventory/SupplierAccountsWorkbench";
import React, { useState, useMemo, useCallback } from "react";
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

const formatMovementTimestamp = (val?: string | number) => {
  if (!val) return "Today, 10:00 AM";
  const s = String(val).trim();
  if (s.startsWith("Today") || s.startsWith("Yesterday") || s.includes("ago") || s.includes("mins")) {
    return s;
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return s || "Just now";
};

export const StaffInventoryTab: React.FC = () => {
  const {
    inventory,
    stockMovements,
    purchases,
    addToast,
  } = useApp();

  // Active view:
  // "items" = Stock Items Catalog & Purchase Inward Form (positioned directly above)
  // "bills" = Purchase Invoices Datatable
  // "audit" = Stock Audit & Variances
  // "movements" = Stock Movement Log
  const [activeView, setActiveView] = useState<"items" | "bills" | "audit" | "movements" | "suppliers">("items");
  const [isPurchaseFormVisible, setIsPurchaseFormVisible] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Movement Log state (Zero Placeholders)
  const [movementSearch, setMovementSearch] = useState("");
  const [movementPage, setMovementPage] = useState(1);
  const [movementPageSize] = useState(15);
  const [movementTypeFilter, setMovementTypeFilter] = useState<"ALL" | "INCREASE" | "DECREASE">("ALL");

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
    <div className="space-y-3">
      {/* -------------------------------------------------------------
          CLEAN VIEW NAVIGATION TABS & COLLAPSE TOGGLE
      ------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1">
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
            <span>Stock & Inward Purchase</span>
          </button>

          <button type="button" onClick={() => setActiveView("suppliers")} className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 font-medium whitespace-nowrap ${activeView === "suppliers" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900"}`}>
            <Truck className="w-3.5 h-3.5" /> Suppliers
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
            <span>Bills History</span>
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

        {/* Section Header Toggle Button: [- Hide Purchase Form] / [+ Open Inward Purchase Form] */}
        {activeView === "items" && (
          <button
            type="button"
            onClick={() => setIsPurchaseFormVisible(!isPurchaseFormVisible)}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800/80 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 border-0 ring-1 ring-zinc-800"
          >
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            <span>{isPurchaseFormVisible ? "[- Hide Purchase Form]" : "[+ Open Inward Purchase Form]"}</span>
          </button>
        )}
      </div>

      {/* -------------------------------------------------------------
          VIEWS RENDERING
      ------------------------------------------------------------- */}
      {/* VIEW 1: INWARD PURCHASE FORM DIRECTLY ABOVE STOCK ITEMS TABLE */}
      {activeView === "items" && (
        <div className="space-y-3">
          {isPurchaseFormVisible && (
            <PurchaseInwardWorkbench
              onPurchaseSaved={() => {
                setRefreshKey((k) => k + 1);
              }}
            />
          )}

          {/* STOCK ITEMS TABLE BELOW */}
          <StockCatalogWorkbench refreshTrigger={refreshKey} />
        </div>
      )}

      {activeView === "suppliers" && <SupplierAccountsWorkbench />}

      {/* VIEW 2: BILLS HISTORY */}
      {activeView === "bills" && <PurchaseBillsDatatable />}

      {/* VIEW 3: STOCK AUDIT */}
      {activeView === "audit" && <StockAuditWorkbench />}

      {/* VIEW 4: STOCK MOVEMENTS LOG */}
      {activeView === "movements" && (
        <div className="bg-zinc-900/60 p-3 rounded-lg space-y-3">
          {/* Controls Bar (Zero Placeholders) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
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
                className="h-7 px-2 bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Directions</option>
                <option value="INCREASE">Inward (+)</option>
                <option value="DECREASE">Outward (-)</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={movementSearch}
                  onChange={(e) => {
                    setMovementSearch(e.target.value);
                    setMovementPage(1);
                  }}
                  className="w-48 sm:w-56 h-7 pl-8 pr-7 text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 focus:outline-none"
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

          {/* Table */}
          <div className="overflow-x-auto rounded border-0 ring-1 ring-zinc-800/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900/90 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-1.5 px-2">Timestamp</th>
                  <th className="py-1.5 px-2">Type</th>
                  <th className="py-1.5 px-2">Item</th>
                  <th className="py-1.5 px-2 text-right">Quantity</th>
                  <th className="py-1.5 px-2 text-right">Prev Stock</th>
                  <th className="py-1.5 px-2 text-right">New Stock</th>
                  <th className="py-1.5 px-2">Reason</th>
                  <th className="py-1.5 px-2">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {paginatedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  paginatedMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-900/40">
                      <td className="py-1.5 px-2 font-mono text-[11px] text-zinc-400">
                        {formatMovementTimestamp(m.timestamp)}
                      </td>
                      <td className="py-1.5 px-2">
                        {m.type === "INCREASE" ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Inward</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400">
                            <ArrowDownRight className="w-3 h-3" />
                            <span>Outward</span>
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 font-semibold text-zinc-200">{m.itemName}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-zinc-100">
                        {m.type === "INCREASE" ? "+" : "-"}
                        {m.quantity} {m.unit}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-zinc-400">
                        {m.previousStock}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-zinc-200 font-semibold">
                        {m.newStock}
                      </td>
                      <td className="py-1.5 px-2 text-zinc-300">
                        <div>{m.reason}</div>
                        {m.note && <div className="text-[10px] text-zinc-500">{m.note}</div>}
                      </td>
                      <td className="py-1.5 px-2 text-zinc-400 font-mono text-[11px]">
                        {m.recordedBy || "System"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalMovementPages > 1 && (
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 font-mono">
              <span>
                Page {movementPage} of {totalMovementPages} ({filteredMovements.length} records)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={movementPage <= 1}
                  onClick={() => setMovementPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={movementPage >= totalMovementPages}
                  onClick={() => setMovementPage((p) => Math.min(totalMovementPages, p + 1))}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
