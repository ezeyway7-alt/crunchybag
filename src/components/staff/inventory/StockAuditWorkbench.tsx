import React, { useState, useMemo, useEffect } from "react";
import {
  Scale,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  History,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { InventoryItem } from "../../../types";
import { formatNPR } from "../../../lib/utils";
import { Modal } from "../../common/Modal";

// Audit reduction reasons
const AUDIT_MINUS_REASONS = [
  { value: "Kitchen spoilage / Burnt / Prep waste", label: "🍳 Kitchen spoilage / Burnt / Prep waste" },
  { value: "Expired batch / Passed shelf life", label: "⚠️ Expired batch / Passed shelf life" },
  { value: "Physical recount discrepancy (-)", label: "📉 Physical recount discrepancy (-)" },
  { value: "Damage / Dropped / Broken container", label: "💥 Damage / Dropped / Broken container" },
  { value: "Staff meal / Counter tasting", label: "🍽️ Staff meal / Counter tasting" },
  { value: "Theft / Unaccounted shortage", label: "🚨 Theft / Unaccounted shortage" },
  { value: "Other write-off", label: "📝 Other write-off (Requires note)" },
];

// Audit addition reasons
const AUDIT_PLUS_REASONS = [
  { value: "Physical count correction (+)", label: "🔍 Physical count correction (+)" },
  { value: "Unrecorded supplier delivery restock", label: "🚚 Unrecorded supplier delivery" },
  { value: "Kitchen return / Over-portion return", label: "↩️ Kitchen return / Over-portion return" },
  { value: "Branch transfer received", label: "🏢 Branch transfer received" },
  { value: "Other addition", label: "✨ Other addition" },
];

export const StockAuditWorkbench: React.FC = () => {
  const {
    inventory,
    updateInventoryStock,
    updateInventoryItem,
    recordStockMovement,
    currentOutlet,
    addToast,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [auditFilter, setAuditFilter] = useState<
    "ALL" | "DISCREPANCY" | "LOW_STOCK" | "EXPIRED"
  >("ALL");

  // Physical Counts Map: key = itemId, value = physical count
  const [physicalCounts, setPhysicalCounts] = useState<{ [itemId: string]: number }>({});
  const [countReasons, setCountReasons] = useState<{ [itemId: string]: string }>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Quick Adjustment Modal State
  const [activeAdjustModal, setActiveAdjustModal] = useState<{
    item: InventoryItem;
    type: "PLUS" | "MINUS";
  } | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>(AUDIT_MINUS_REASONS[0].value);
  const [adjustNote, setAdjustNote] = useState<string>("");

  // Batch & Expiry Edit Modal State
  const [editingBatchItem, setEditingBatchItem] = useState<InventoryItem | null>(null);
  const [batchNoInput, setBatchNoInput] = useState("");
  const [expiryDateInput, setExpiryDateInput] = useState("");

  // Populate physical counts when inventory loads
  useEffect(() => {
    setPhysicalCounts((prev) => {
      const next = { ...prev };
      inventory.forEach((item) => {
        if (next[item.id] === undefined) {
          next[item.id] = item.currentStock;
        }
      });
      return next;
    });
  }, [inventory]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(inventory.map((i) => i.category));
    return Array.from(set);
  }, [inventory]);

  // Today ISO Date string (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const next7DaysStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  }, []);

  // Filtered Inventory with Audit Calculations
  const auditedItems = useMemo(() => {
    return inventory.map((item) => {
      const physical =
        physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : item.currentStock;
      const variance = Number((physical - item.currentStock).toFixed(2));
      const varianceValue = Number((variance * item.costPerUnit).toFixed(2));

      // Expiry checks
      let expiryStatus: "EXPIRED" | "EXPIRING_SOON" | "FRESH" | "UNTRACKED" = "UNTRACKED";
      if (item.expiryDate) {
        if (item.expiryDate < todayStr) {
          expiryStatus = "EXPIRED";
        } else if (item.expiryDate <= next7DaysStr) {
          expiryStatus = "EXPIRING_SOON";
        } else {
          expiryStatus = "FRESH";
        }
      }

      const isLow = item.currentStock <= item.minThreshold;
      const hasDiscrepancy = variance !== 0;

      return {
        item,
        physical,
        variance,
        varianceValue,
        expiryStatus,
        isLow,
        hasDiscrepancy,
      };
    });
  }, [inventory, physicalCounts, todayStr, next7DaysStr]);

  // Filtered List based on user selection
  const filteredItems = useMemo(() => {
    return auditedItems.filter(({ item, isLow, hasDiscrepancy, expiryStatus }) => {
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;

      if (auditFilter === "DISCREPANCY" && !hasDiscrepancy) return false;
      if (auditFilter === "LOW_STOCK" && !isLow) return false;
      if (auditFilter === "EXPIRED" && expiryStatus !== "EXPIRED" && expiryStatus !== "EXPIRING_SOON")
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.batchNo && item.batchNo.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [auditedItems, categoryFilter, auditFilter, searchQuery]);

  // Aggregated Audit Stats (Clean inline metrics)
  const auditStats = useMemo(() => {
    const totalCount = auditedItems.length;
    const discrepancyCount = auditedItems.filter((a) => a.hasDiscrepancy).length;
    const netVarianceValue = auditedItems.reduce((sum, a) => sum + a.varianceValue, 0);
    const expiredCount = auditedItems.filter((a) => a.expiryStatus === "EXPIRED").length;
    const expiringSoonCount = auditedItems.filter((a) => a.expiryStatus === "EXPIRING_SOON").length;
    const lowStockCount = auditedItems.filter((a) => a.isLow).length;

    return {
      totalCount,
      discrepancyCount,
      netVarianceValue,
      expiredCount,
      expiringSoonCount,
      lowStockCount,
    };
  }, [auditedItems]);

  // Paginated View
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIdx, startIdx + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Reconcile Single Item Count
  const handleReconcileSingleItem = (item: InventoryItem, physicalCount: number) => {
    const variance = physicalCount - item.currentStock;
    if (variance === 0) {
      addToast({
        title: "Exact Count Verified",
        description: `${item.name}: Physical count matches theoretical stock (${item.currentStock} ${item.unit}).`,
        type: "info",
      });
      return;
    }

    const defaultReason =
      variance < 0
        ? "Physical recount discrepancy (-)"
        : "Physical count correction (+)";

    updateInventoryStock(
      item.id,
      physicalCount,
      countReasons[item.id] || defaultReason,
      `Audited via Stock Audit Sheet. Variance: ${variance > 0 ? "+" : ""}${variance} ${item.unit}`
    );

    addToast({
      title: "Stock Reconciled",
      description: `${item.name} theoretical stock updated from ${item.currentStock} to ${physicalCount} ${item.unit}`,
      type: "success",
    });
  };

  // Reconcile All Discrepancies
  const handleReconcileAllDiscrepancies = () => {
    const itemsToReconcile = auditedItems.filter((a) => a.hasDiscrepancy);
    if (itemsToReconcile.length === 0) {
      addToast({
        title: "No Discrepancies",
        description: "All physical counts currently match theoretical stock levels.",
        type: "info",
      });
      return;
    }

    itemsToReconcile.forEach(({ item, physical, variance }) => {
      const defaultReason =
        variance < 0
          ? "Physical recount discrepancy (-)"
          : "Physical count correction (+)";

      updateInventoryStock(
        item.id,
        physical,
        countReasons[item.id] || defaultReason,
        `Batch Audit Reconciliation. Variance: ${variance > 0 ? "+" : ""}${variance} ${item.unit}`
      );
    });

    addToast({
      title: "Batch Audit Completed",
      description: `Reconciled ${itemsToReconcile.length} items to match physical stock counts.`,
      type: "success",
    });
  };

  // Execute Quick Plus / Minus Modal
  const handleExecuteQuickAdjustment = () => {
    if (!activeAdjustModal) return;
    const { item, type } = activeAdjustModal;

    if (!adjustQty || adjustQty <= 0) {
      addToast({
        title: "Invalid Quantity",
        description: "Please enter a quantity greater than 0.",
        type: "warning",
      });
      return;
    }

    if (type === "MINUS" && adjustQty > item.currentStock) {
      addToast({
        title: "Quantity Exceeds Stock",
        description: `Cannot deduct ${adjustQty} ${item.unit}. Current stock is only ${item.currentStock} ${item.unit}.`,
        type: "error",
      });
      return;
    }

    const delta = type === "PLUS" ? Number(adjustQty) : -Number(adjustQty);
    const newStock = Math.max(0, Number((item.currentStock + delta).toFixed(2)));

    updateInventoryStock(
      item.id,
      newStock,
      adjustReason,
      adjustNote.trim() || undefined
    );

    // Update physical count field as well
    setPhysicalCounts((prev) => ({
      ...prev,
      [item.id]: newStock,
    }));

    setActiveAdjustModal(null);
    setAdjustQty(1);
    setAdjustNote("");
  };

  // Save Batch & Expiry Update
  const handleSaveBatchExpiry = () => {
    if (!editingBatchItem) return;

    updateInventoryItem(editingBatchItem.id, {
      batchNo: batchNoInput.trim() || undefined,
      expiryDate: expiryDateInput.trim() || undefined,
    });

    addToast({
      title: "Batch & Expiry Updated",
      description: `${editingBatchItem.name} batch set to ${batchNoInput || "N/A"}, expiry ${expiryDateInput || "N/A"}`,
      type: "success",
    });

    setEditingBatchItem(null);
  };

  return (
    <div className="bg-[#141417] border border-zinc-800 p-3 shadow-sm space-y-3">
      {/* -------------------------------------------------------------
          TOP AUDIT CONTROLS & FILTER GRID (CLEAN TINY UI)
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800 items-end">
        {/* Search */}
        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Search Item or Batch
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Item name, SKU, batch #..."
              className="w-full h-8 pl-7 pr-6 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Audit Filter */}
        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Audit Alert Filter
          </label>
          <select
            value={auditFilter}
            onChange={(e) => {
              setAuditFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Tracked Stock ({inventory.length})</option>
            <option value="DISCREPANCY">
              ⚠️ Discrepancies Only ({auditStats.discrepancyCount})
            </option>
            <option value="EXPIRED">
              🚨 Expired / Expiring Soon ({auditStats.expiredCount + auditStats.expiringSoonCount})
            </option>
            <option value="LOW_STOCK">
              📉 Low Stock Warnings ({auditStats.lowStockCount})
            </option>
          </select>
        </div>

        {/* Batch Reconcile Button */}
        <div className="lg:col-span-3">
          <button
            type="button"
            onClick={handleReconcileAllDiscrepancies}
            disabled={auditStats.discrepancyCount === 0}
            className="w-full h-8 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Reconcile All Discrepancies ({auditStats.discrepancyCount})</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          CLEAN INLINE TEXT AUDIT STATS (NO BULKY BOX CARDS)
      ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 py-1 font-medium overflow-x-auto no-scrollbar">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Tracked SKUs:</span>
          <strong className="font-mono text-zinc-100 font-bold">{auditStats.totalCount}</strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Physical Discrepancies:</span>
          <strong
            className={`font-mono font-bold ${
              auditStats.discrepancyCount > 0 ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {auditStats.discrepancyCount}
          </strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Net Variance Value:</span>
          <strong
            className={`font-mono font-bold ${
              auditStats.netVarianceValue < 0
                ? "text-rose-400"
                : auditStats.netVarianceValue > 0
                ? "text-emerald-400"
                : "text-zinc-300"
            }`}
          >
            {auditStats.netVarianceValue > 0 ? "+" : ""}
            {formatNPR(auditStats.netVarianceValue)}
          </strong>
        </span>

        {auditStats.expiredCount > 0 && (
          <span className="flex items-center gap-1.5 whitespace-nowrap text-rose-400 font-bold">
            <span>Expired Batches:</span>
            <strong className="font-mono">{auditStats.expiredCount}</strong>
          </span>
        )}

        {auditStats.expiringSoonCount > 0 && (
          <span className="flex items-center gap-1.5 whitespace-nowrap text-amber-400 font-bold">
            <span>Expiring (&lt;7d):</span>
            <strong className="font-mono">{auditStats.expiringSoonCount}</strong>
          </span>
        )}

        {auditStats.lowStockCount > 0 && (
          <span className="flex items-center gap-1.5 whitespace-nowrap text-amber-500">
            <span>Low Stock:</span>
            <strong className="font-mono font-bold">{auditStats.lowStockCount}</strong>
          </span>
        )}
      </div>

      {/* -------------------------------------------------------------
          STOCK AUDIT DATATABLE
      ------------------------------------------------------------- */}
      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-2.5 px-2.5">Item Name & SKU</th>
              <th className="py-2.5 px-2.5">Category</th>
              <th className="py-2.5 px-2.5 text-center">Batch # & Expiry</th>
              <th className="py-2.5 px-2.5 text-right">Theoretical Stock</th>
              <th className="py-2.5 px-2.5 text-center w-36">Physical Count</th>
              <th className="py-2.5 px-2.5 text-right">Variance</th>
              <th className="py-2.5 px-2.5 text-right">Variance Value</th>
              <th className="py-2.5 px-2 text-center">Alert Status</th>
              <th className="py-2.5 px-3 text-right">Audit Actions (+ / -)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-[#141417]">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-zinc-500 text-xs">
                  No stock items match your audit criteria.
                </td>
              </tr>
            ) : (
              paginatedItems.map(
                ({
                  item,
                  physical,
                  variance,
                  varianceValue,
                  expiryStatus,
                  isLow,
                  hasDiscrepancy,
                }) => {
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-900/50 transition-colors ${
                        hasDiscrepancy ? "bg-amber-500/[0.02]" : ""
                      }`}
                    >
                      {/* Name & SKU */}
                      <td className="py-2 px-2.5">
                        <p className="font-bold text-zinc-100">{item.name}</p>
                        <p className="font-mono text-[10px] text-zinc-500">#{item.id}</p>
                      </td>

                      {/* Category */}
                      <td className="py-2 px-2.5 text-zinc-400 text-[11px] whitespace-nowrap">
                        {item.category}
                      </td>

                      {/* Batch & Expiry (with badges and quick edit) */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBatchItem(item);
                              setBatchNoInput(item.batchNo || "");
                              setExpiryDateInput(item.expiryDate || "");
                            }}
                            className="font-mono text-[10px] text-zinc-300 hover:text-amber-400 underline underline-offset-2 decoration-zinc-600 hover:decoration-amber-400 cursor-pointer"
                            title="Click to edit Batch / Expiry"
                          >
                            {item.batchNo || "Set Batch"}
                          </button>

                          {item.expiryDate ? (
                            <span
                              className={`inline-block px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase border ${
                                expiryStatus === "EXPIRED"
                                  ? "bg-rose-500/15 text-rose-400 border-rose-500/40"
                                  : expiryStatus === "EXPIRING_SOON"
                                  ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
                              }`}
                            >
                              {expiryStatus === "EXPIRED" && "⚠️ EXPIRED: "}
                              {expiryStatus === "EXPIRING_SOON" && "⏰ DUE: "}
                              {item.expiryDate}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBatchItem(item);
                                setBatchNoInput(item.batchNo || "");
                                setExpiryDateInput(item.expiryDate || "");
                              }}
                              className="text-[9px] text-zinc-600 hover:text-zinc-400 cursor-pointer"
                            >
                              + Add Exp
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Theoretical Stock */}
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-zinc-200 text-xs whitespace-nowrap">
                        {item.currentStock} {item.unit}
                      </td>

                      {/* Physical Count Input Field */}
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={physical}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setPhysicalCounts((prev) => ({
                                ...prev,
                                [item.id]: val,
                              }));
                            }}
                            className={`w-20 h-7 px-1 text-center font-mono font-bold text-xs bg-zinc-900 border focus:outline-none ${
                              hasDiscrepancy
                                ? "border-amber-500 text-amber-400"
                                : "border-zinc-700 text-zinc-100 focus:border-amber-500"
                            }`}
                          />
                          <span className="font-mono text-[10px] text-zinc-400">
                            {item.unit}
                          </span>
                          {hasDiscrepancy && (
                            <button
                              type="button"
                              onClick={() => handleReconcileSingleItem(item, physical)}
                              className="p-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/50 cursor-pointer transition-colors"
                              title="Sync theoretical stock to this physical count"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Variance */}
                      <td className="py-2 px-2.5 text-right font-mono text-xs whitespace-nowrap">
                        {variance === 0 ? (
                          <span className="text-zinc-500">0.00 {item.unit}</span>
                        ) : variance < 0 ? (
                          <span className="text-rose-400 font-bold">
                            {variance} {item.unit}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold">
                            +{variance} {item.unit}
                          </span>
                        )}
                      </td>

                      {/* Variance Value */}
                      <td className="py-2 px-2.5 text-right font-mono text-xs whitespace-nowrap">
                        {varianceValue === 0 ? (
                          <span className="text-zinc-500">Rs. 0</span>
                        ) : varianceValue < 0 ? (
                          <span className="text-rose-400 font-bold">
                            -{formatNPR(Math.abs(varianceValue))}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold">
                            +{formatNPR(varianceValue)}
                          </span>
                        )}
                      </td>

                      {/* Alert Status */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase border ${
                            expiryStatus === "EXPIRED"
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/40"
                              : hasDiscrepancy
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                              : isLow
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {expiryStatus === "EXPIRED"
                            ? "EXPIRED"
                            : hasDiscrepancy
                            ? "DISCREPANCY"
                            : isLow
                            ? "LOW STOCK"
                            : "MATCH"}
                        </span>
                      </td>

                      {/* Actions: Quick In (+) and Quick Out (-) */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Plus (+) */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAdjustModal({ item, type: "PLUS" });
                              setAdjustQty(1);
                              setAdjustReason(AUDIT_PLUS_REASONS[0].value);
                            }}
                            className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Audit Inward (+)"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>In (+)</span>
                          </button>

                          {/* Quick Minus (-) */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAdjustModal({ item, type: "MINUS" });
                              setAdjustQty(1);
                              setAdjustReason(
                                expiryStatus === "EXPIRED"
                                  ? AUDIT_MINUS_REASONS[1].value
                                  : AUDIT_MINUS_REASONS[0].value
                              );
                            }}
                            className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Audit Outward / Spoilage / Expire (-)"
                          >
                            <Minus className="w-3 h-3 stroke-[3]" />
                            <span>Out (-)</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------------------------------------------------
          PAGINATION
      ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-zinc-500">
        <div>
          Showing{" "}
          <strong className="text-zinc-200">
            {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-zinc-200">
            {Math.min(currentPage * pageSize, filteredItems.length)}
          </strong>{" "}
          of <strong className="text-zinc-200">{filteredItems.length}</strong> items
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-zinc-800 text-xs"
          >
            Prev
          </button>
          <span className="px-2 py-1 font-mono text-zinc-400 text-xs">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-zinc-800 text-xs"
          >
            Next
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          QUICK IN (+) / OUT (-) ADJUSTMENT MODAL
      ------------------------------------------------------------- */}
      {activeAdjustModal && (
        <Modal
          isOpen={Boolean(activeAdjustModal)}
          onClose={() => setActiveAdjustModal(null)}
          title={
            activeAdjustModal.type === "PLUS"
              ? `Stock Audit Inward (+): ${activeAdjustModal.item.name}`
              : `Stock Audit Write-Off / Out (-): ${activeAdjustModal.item.name}`
          }
        >
          <div className="space-y-3.5 text-xs">
            <div className="p-2.5 bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono">
              <span className="text-zinc-400">Current Theoretical Stock:</span>
              <strong className="text-zinc-100 text-sm">
                {activeAdjustModal.item.currentStock} {activeAdjustModal.item.unit}
              </strong>
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1">
                {activeAdjustModal.type === "PLUS" ? "Quantity to Add (+)" : "Quantity to Deduct (-)"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-8 px-2 bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-sm font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="font-mono text-zinc-400 font-bold">{activeAdjustModal.item.unit}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1">
                Mandatory Reason for {activeAdjustModal.type === "PLUS" ? "Addition (+)" : "Reduction (-)"}
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {(activeAdjustModal.type === "PLUS" ? AUDIT_PLUS_REASONS : AUDIT_MINUS_REASONS).map(
                  (r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1">
                Audit Note / Explanatory Remark (Optional)
              </label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="e.g. Broken packaging / kitchen preparation test batch..."
                className="w-full h-8 px-2 bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveAdjustModal(null)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteQuickAdjustment}
                className={`px-4 py-1.5 font-bold uppercase tracking-wider text-xs cursor-pointer ${
                  activeAdjustModal.type === "PLUS"
                    ? "bg-emerald-500 hover:bg-emerald-400 text-black font-black"
                    : "bg-rose-500 hover:bg-rose-400 text-white font-black"
                }`}
              >
                Confirm {activeAdjustModal.type === "PLUS" ? "Inward (+)" : "Reduction (-)"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* -------------------------------------------------------------
          EDIT BATCH & EXPIRY MODAL
      ------------------------------------------------------------- */}
      {editingBatchItem && (
        <Modal
          isOpen={Boolean(editingBatchItem)}
          onClose={() => setEditingBatchItem(null)}
          title={`Set Batch No & Expiry Date: ${editingBatchItem.name}`}
        >
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-zinc-300 mb-1">Batch / Lot Number</label>
              <input
                type="text"
                value={batchNoInput}
                onChange={(e) => setBatchNoInput(e.target.value)}
                placeholder="e.g. B-2026-09-A"
                className="w-full h-8 px-2 bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-300 mb-1">Expiration Date</label>
              <input
                type="date"
                value={expiryDateInput}
                onChange={(e) => setExpiryDateInput(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingBatchItem(null)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBatchExpiry}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs cursor-pointer shadow-sm"
              >
                Save Batch & Expiry
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
