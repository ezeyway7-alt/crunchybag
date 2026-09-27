import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Check,
  X,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { InventoryItem } from "../../../types";
import { formatNPR } from "../../../lib/utils";
import { Modal } from "../../common/Modal";
import { inventoryApi } from "../../../lib/inventoryApi";

const AUDIT_MINUS_REASONS = [
  { value: "Kitchen spoilage / Burnt / Prep waste", label: "Kitchen spoilage / Prep waste" },
  { value: "Expired batch / Passed shelf life", label: "Expired batch / Passed shelf life" },
  { value: "Physical recount discrepancy (-)", label: "Physical recount discrepancy (-)" },
  { value: "Damage / Dropped / Broken container", label: "Damage / Broken container" },
  { value: "Staff meal / Counter tasting", label: "Staff meal / Tasting" },
  { value: "Theft / Unaccounted shortage", label: "Theft / Unaccounted shortage" },
  { value: "Other write-off", label: "Other write-off" },
];

const AUDIT_PLUS_REASONS = [
  { value: "Physical count correction (+)", label: "Physical count correction (+)" },
  { value: "Unrecorded supplier delivery restock", label: "Unrecorded delivery" },
  { value: "Kitchen return / Over-portion return", label: "Kitchen return" },
  { value: "Branch transfer received", label: "Branch transfer received" },
  { value: "Other addition", label: "Other addition" },
];

export const StockAuditWorkbench: React.FC = () => {
  const {
    inventory,
    updateInventoryStock,
    updateInventoryItem,
    syncBackendInventory,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [auditFilter, setAuditFilter] = useState<
    "ALL" | "DISCREPANCY" | "LOW_STOCK" | "EXPIRED"
  >("ALL");

  const [physicalCounts, setPhysicalCounts] = useState<{ [itemId: string]: number }>({});
  const [countReasons, setCountReasons] = useState<{ [itemId: string]: string }>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [activeAdjustModal, setActiveAdjustModal] = useState<{
    item: InventoryItem;
    type: "PLUS" | "MINUS";
  } | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>(AUDIT_MINUS_REASONS[0].value);
  const [adjustNote, setAdjustNote] = useState<string>("");

  const [editingBatchItem, setEditingBatchItem] = useState<InventoryItem | null>(null);
  const [batchNoInput, setBatchNoInput] = useState("");
  const [expiryDateInput, setExpiryDateInput] = useState("");

  // Fetch live backend inventory items on mount to ensure audit tab has identical stock as catalog
  useEffect(() => {
    let active = true;
    const fetchLive = async () => {
      try {
        const data = await inventoryApi.fetchItems({ page_size: 100 });
        if (active && data?.results && data.results.length > 0) {
          syncBackendInventory(data.results);
        }
      } catch {}
    };
    fetchLive();
    return () => {
      active = false;
    };
  }, [syncBackendInventory]);

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

  const categories = useMemo(() => {
    let excluded: string[] = [];
    if (typeof window !== "undefined") {
      try {
        excluded = JSON.parse(localStorage.getItem("crunchy_excluded_categories") || "[]");
      } catch {}
    }
    const set = new Set(inventory.map((i) => i.category).filter((c) => !excluded.includes(c)));
    return Array.from(set);
  }, [inventory]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const next7DaysStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  }, []);

  const auditedItems = useMemo(() => {
    return inventory.map((item) => {
      const physical =
        physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : item.currentStock;
      const variance = Number((physical - item.currentStock).toFixed(2));
      const varianceValue = Number((variance * item.costPerUnit).toFixed(2));

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

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIdx, startIdx + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handleReconcileSingleItem = async (item: InventoryItem, physicalCount: number) => {
    const variance = physicalCount - item.currentStock;
    if (variance === 0) return;

    const defaultReason =
      variance < 0
        ? "Physical recount discrepancy (-)"
        : "Physical count correction (+)";

    const cleanItemId = item.id.replace("inv-", "");
    try {
      await inventoryApi.reconcileAudit({
        items: [
          {
            item_id: cleanItemId,
            physical_stock: physicalCount.toFixed(3),
            note: countReasons[item.id] || defaultReason,
          },
        ],
      });
    } catch {}

    updateInventoryStock(
      item.id,
      physicalCount,
      countReasons[item.id] || defaultReason,
      `Audited. Variance: ${variance > 0 ? "+" : ""}${variance} ${item.unit}`
    );

    addToast({
      title: "Stock Reconciled",
      description: `${item.name} set to ${physicalCount} ${item.unit}`,
      type: "success",
    });
  };

  const handleReconcileAllDiscrepancies = async () => {
    const itemsToReconcile = auditedItems.filter((a) => a.hasDiscrepancy);
    if (itemsToReconcile.length === 0) return;

    try {
      await inventoryApi.reconcileAudit({
        items: itemsToReconcile.map(({ item, physical, variance }) => ({
          item_id: item.id.replace("inv-", ""),
          physical_stock: physical.toFixed(3),
          note: countReasons[item.id] || `Batch Audit (${variance > 0 ? "+" : ""}${variance} ${item.unit})`,
        })),
      });
    } catch {}

    itemsToReconcile.forEach(({ item, physical, variance }) => {
      const defaultReason =
        variance < 0
          ? "Physical recount discrepancy (-)"
          : "Physical count correction (+)";

      updateInventoryStock(
        item.id,
        physical,
        countReasons[item.id] || defaultReason,
        `Batch Audit. Variance: ${variance > 0 ? "+" : ""}${variance} ${item.unit}`
      );
    });

    addToast({
      title: "Batch Audit Completed",
      description: `Reconciled ${itemsToReconcile.length} items with backend.`,
      type: "success",
    });
  };

  const handleExecuteQuickAdjustment = async () => {
    if (!activeAdjustModal) return;
    const { item, type } = activeAdjustModal;

    if (!adjustQty || adjustQty <= 0) return;

    if (type === "MINUS" && adjustQty > item.currentStock) {
      addToast({
        title: "Quantity Exceeds Stock",
        description: `Current stock is only ${item.currentStock} ${item.unit}.`,
        type: "error",
      });
      return;
    }

    const delta = type === "PLUS" ? Number(adjustQty) : -Number(adjustQty);
    const newStock = Math.max(0, Number((item.currentStock + delta).toFixed(2)));

    const cleanItemId = item.id.replace("inv-", "");
    try {
      await inventoryApi.reconcileAudit({
        items: [
          {
            item_id: cleanItemId,
            physical_stock: newStock.toFixed(3),
            note: `${adjustReason}${adjustNote ? ` - ${adjustNote}` : ""}`,
          },
        ],
      });
    } catch {}

    updateInventoryStock(
      item.id,
      newStock,
      adjustReason,
      adjustNote.trim() || undefined
    );

    setPhysicalCounts((prev) => ({
      ...prev,
      [item.id]: newStock,
    }));

    setActiveAdjustModal(null);
    setAdjustQty(1);
    setAdjustNote("");
  };

  const handleSaveBatchExpiry = () => {
    if (!editingBatchItem) return;

    updateInventoryItem(editingBatchItem.id, {
      batchNo: batchNoInput.trim() || undefined,
      expiryDate: expiryDateInput.trim() || undefined,
    });

    addToast({
      title: "Updated",
      description: `${editingBatchItem.name} batch / expiry updated.`,
      type: "success",
    });

    setEditingBatchItem(null);
  };

  return (
    <div className="bg-zinc-900/40 p-4 rounded-xl space-y-3.5">
      {/* Controls Bar (Borderless 4-col) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
        <div className="lg:col-span-3">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 pl-8 pr-7 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Filter
          </label>
          <select
            value={auditFilter}
            onChange={(e) => {
              setAuditFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Items ({inventory.length})</option>
            <option value="DISCREPANCY">
              Discrepancies Only ({auditStats.discrepancyCount})
            </option>
            <option value="EXPIRED">
              Expired / Due Soon ({auditStats.expiredCount + auditStats.expiringSoonCount})
            </option>
            <option value="LOW_STOCK">
              Low Stock ({auditStats.lowStockCount})
            </option>
          </select>
        </div>

        <div className="lg:col-span-3">
          <button
            type="button"
            onClick={handleReconcileAllDiscrepancies}
            disabled={auditStats.discrepancyCount === 0}
            className="w-full h-8 px-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Reconcile All ({auditStats.discrepancyCount})</span>
          </button>
        </div>
      </div>

      {/* Inline Text Metrics (No Bulky Cards) */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-400 pt-0.5 font-medium overflow-x-auto no-scrollbar">
        <span>
          Items: <strong className="font-mono text-zinc-100 font-bold">{auditStats.totalCount}</strong>
        </span>
        <span>
          Discrepancies:{" "}
          <strong
            className={`font-mono font-bold ${
              auditStats.discrepancyCount > 0 ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {auditStats.discrepancyCount}
          </strong>
        </span>
        <span>
          Net Variance:{" "}
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
          <span className="text-rose-400 font-semibold">
            Expired: <strong className="font-mono">{auditStats.expiredCount}</strong>
          </span>
        )}
      </div>

      {/* Borderless Audit Table */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/60 text-zinc-400 text-[11px] font-semibold">
              <th className="py-2.5 px-3">Item / SKU</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-center">Batch / Expiry</th>
              <th className="py-2.5 px-3 text-right">System Stock</th>
              <th className="py-2.5 px-3 text-center w-36">Physical Count</th>
              <th className="py-2.5 px-3 text-right">Variance</th>
              <th className="py-2.5 px-3 text-right">Variance Value</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-500 text-xs">
                  No items match your criteria.
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
                  hasDiscrepancy,
                }) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-2 px-3">
                        <p className="font-semibold text-zinc-100">{item.name}</p>
                        <p className="font-mono text-[10px] text-zinc-500">#{item.id}</p>
                      </td>

                      <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">
                        {item.category}
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBatchItem(item);
                            setBatchNoInput(item.batchNo || "");
                            setExpiryDateInput(item.expiryDate || "");
                          }}
                          className="font-mono text-[10px] text-zinc-300 hover:text-amber-400 cursor-pointer"
                        >
                          {item.batchNo || item.expiryDate ? (
                            <span>
                              {item.batchNo || "No Batch"}
                              {item.expiryDate ? ` (${item.expiryDate})` : ""}
                            </span>
                          ) : (
                            <span className="text-zinc-600 hover:text-zinc-400">Set Batch</span>
                          )}
                        </button>
                      </td>

                      <td className="py-2 px-3 text-right font-mono text-zinc-200 whitespace-nowrap font-medium">
                        {item.currentStock} {item.unit}
                      </td>

                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
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
                            className={`w-16 h-6 px-1 text-center font-mono text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded ${
                              hasDiscrepancy
                                ? "text-amber-400 font-bold"
                                : "text-zinc-100"
                            }`}
                          />
                          <span className="font-mono text-[10px] text-zinc-500">
                            {item.unit}
                          </span>
                          {hasDiscrepancy && (
                            <button
                              type="button"
                              onClick={() => handleReconcileSingleItem(item, physical)}
                              className="p-1 text-amber-400 hover:text-white cursor-pointer"
                              title="Sync to this count"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                        {variance === 0 ? (
                          <span className="text-zinc-600">0</span>
                        ) : variance < 0 ? (
                          <span className="text-rose-400 font-semibold">
                            {variance} {item.unit}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">
                            +{variance} {item.unit}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                        {varianceValue === 0 ? (
                          <span className="text-zinc-600">0</span>
                        ) : varianceValue < 0 ? (
                          <span className="text-rose-400 font-semibold">
                            -{formatNPR(Math.abs(varianceValue))}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">
                            +{formatNPR(varianceValue)}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAdjustModal({ item, type: "PLUS" });
                              setAdjustQty(1);
                              setAdjustReason(AUDIT_PLUS_REASONS[0].value);
                            }}
                            className="px-2 py-0.5 bg-zinc-800 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-400 rounded text-xs transition-colors cursor-pointer"
                          >
                            +In
                          </button>
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
                            className="px-2 py-0.5 bg-zinc-800 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 rounded text-xs transition-colors cursor-pointer"
                          >
                            -Out
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-zinc-500">
        <div>
          Showing{" "}
          <strong className="text-zinc-300">
            {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-zinc-300">
            {Math.min(currentPage * pageSize, filteredItems.length)}
          </strong>{" "}
          of <strong className="text-zinc-300">{filteredItems.length}</strong> items
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 bg-zinc-900/80 text-zinc-400 hover:text-white rounded disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-xs"
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
            className="px-2.5 py-1 bg-zinc-900/80 text-zinc-400 hover:text-white rounded disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-xs"
          >
            Next
          </button>
        </div>
      </div>

      {/* Quick Adjust Modal */}
      {activeAdjustModal && (
        <Modal
          isOpen={Boolean(activeAdjustModal)}
          onClose={() => setActiveAdjustModal(null)}
          title={`Adjust: ${activeAdjustModal.item.name}`}
        >
          <div className="space-y-3 text-xs">
            <div className="p-2.5 bg-zinc-900 rounded-lg flex items-center justify-between font-mono">
              <span className="text-zinc-400">Current Stock:</span>
              <strong className="text-zinc-100">
                {activeAdjustModal.item.currentStock} {activeAdjustModal.item.unit}
              </strong>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                {activeAdjustModal.type === "PLUS" ? "Quantity to Add" : "Quantity to Deduct"}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full h-8 px-2.5 bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 font-mono text-xs focus:outline-none"
                />
                <span className="font-mono text-zinc-400">{activeAdjustModal.item.unit}</span>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Reason
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none cursor-pointer"
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
              <label className="block text-zinc-400 font-medium mb-1">
                Note (Optional)
              </label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                className="w-full h-8 px-2.5 bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800/50">
              <button
                type="button"
                onClick={() => setActiveAdjustModal(null)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteQuickAdjustment}
                className={`px-4 py-1.5 font-bold rounded-lg text-xs ${
                  activeAdjustModal.type === "PLUS"
                    ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                    : "bg-rose-500 hover:bg-rose-400 text-white"
                }`}
              >
                Confirm {activeAdjustModal.type === "PLUS" ? "Inward" : "Deduct"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Batch & Expiry Modal */}
      {editingBatchItem && (
        <Modal
          isOpen={Boolean(editingBatchItem)}
          onClose={() => setEditingBatchItem(null)}
          title={`Batch & Expiry: ${editingBatchItem.name}`}
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Batch Number</label>
              <input
                type="text"
                value={batchNoInput}
                onChange={(e) => setBatchNoInput(e.target.value)}
                className="w-full h-8 px-2.5 bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 font-mono uppercase text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-medium mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDateInput}
                onChange={(e) => setExpiryDateInput(e.target.value)}
                className="w-full h-8 px-2 bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 font-mono text-xs focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800/50">
              <button
                type="button"
                onClick={() => setEditingBatchItem(null)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBatchExpiry}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
