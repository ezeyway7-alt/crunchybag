import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  AlertTriangle,
  Scale,
  X,
  Check,
  RotateCcw,
  Loader2,
  TrendingDown,
  Boxes,
  FileSpreadsheet,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { formatNPR } from "../../../lib/utils";
import { inventoryApi, BackendInventoryItem } from "../../../lib/inventoryApi";
import { useInventoryWebSocket } from "../../../lib/useInventoryWebSocket";

interface StockCatalogWorkbenchProps {
  refreshTrigger?: number;
}

export const StockCatalogWorkbench: React.FC<StockCatalogWorkbenchProps> = ({
  refreshTrigger = 0,
}) => {
  const {
    inventory,
    addInventoryItem,
    updateInventoryStock,
    currentOutlet,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isLowStockOnly, setIsLowStockOnly] = useState(false);

  // Debounce search query by 350ms to prevent rapid-fire requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Live Backend Data State
  const [catalogResults, setCatalogResults] = useState<BackendInventoryItem[]>([]);
  const [metrics, setMetrics] = useState({
    count: 0,
    low_stock_count: 0,
    total_valuation: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const isInitialLoadRef = useRef(true);

  // Real-Time WebSocket Listener (Direct In-Memory Updates - ZERO HTTP Polling)
  useInventoryWebSocket({
    outletId: "DM-01",
    onRestocked: (data) => {
      if (data.updated_items && data.updated_items.length > 0) {
        setCatalogResults((prev) =>
          prev.map((item) => {
            const match = data.updated_items?.find(
              (u) =>
                String(u.item_id) === String(item.id) ||
                (item.sku && String(u.item_id) === String(item.sku))
            );
            if (match) {
              const newQty = Number(match.new_stock);
              const cost = match.cost_per_unit !== undefined ? Number(match.cost_per_unit) : Number(item.cost_per_unit);
              return {
                ...item,
                current_stock: newQty,
                cost_per_unit: cost,
                total_valuation: newQty * cost,
                is_low_stock: newQty <= Number(item.min_threshold),
              };
            }
            return item;
          })
        );

        // Update overall metrics in memory
        setMetrics((prev) => {
          return {
            ...prev,
            total_valuation: catalogResults.reduce(
              (acc, it) => acc + Number(it.current_stock || 0) * Number(it.cost_per_unit || 0),
              0
            ),
          };
        });

        addToast({
          title: "Real-Time Inward Stock",
          description: `Bill #${data.invoice_number || ""} updated stock balances.`,
          type: "success",
        });
      }
    },
    onStockDeducted: (data) => {
      if (data.deductions && data.deductions.length > 0) {
        setCatalogResults((prev) =>
          prev.map((item) => {
            const match = data.deductions?.find(
              (d) => String(d.item_id) === String(item.id)
            );
            if (match) {
              const remaining = Number(match.remaining_stock);
              const cost = Number(item.cost_per_unit || 0);
              return {
                ...item,
                current_stock: remaining,
                total_valuation: remaining * cost,
                is_low_stock: remaining <= Number(item.min_threshold),
              };
            }
            return item;
          })
        );
      }
    },
    onLowStockAlert: (data) => {
      addToast({
        title: "Low Stock Alert",
        description: `${data.item_name} reached threshold (${data.current_stock} remaining).`,
        type: "warning",
      });
    },
    onAuditAdjusted: (data) => {
      if (data.adjustments && data.adjustments.length > 0) {
        setCatalogResults((prev) =>
          prev.map((item) => {
            const match = data.adjustments?.find(
              (a) => String(a.item_id) === String(item.id)
            );
            if (match) {
              const adjusted = Number(match.adjusted_stock);
              const cost = Number(item.cost_per_unit || 0);
              return {
                ...item,
                current_stock: adjusted,
                total_valuation: adjusted * cost,
                is_low_stock: adjusted <= Number(item.min_threshold),
              };
            }
            return item;
          })
        );
      }
    },
  });

  // Quick Stock Adjust state
  const [adjustingItemId, setAdjustingItemId] = useState<string | number | null>(null);
  const [adjustValue, setAdjustValue] = useState<string>("");

  // Physical Audit Reconcile Modal state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditRows, setAuditRows] = useState<
    Array<{
      itemId: string | number;
      name: string;
      systemStock: number;
      physicalStock: string;
      unit: string;
      note: string;
    }>
  >([]);
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);

  // Add Item modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Raw Meat & Poultry");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [currentStock, setCurrentStock] = useState("");
  const [unit, setUnit] = useState<string>("KG");
  const [minThreshold, setMinThreshold] = useState("10");
  const [costPerUnit, setCostPerUnit] = useState("350");
  const [supplierName, setSupplierName] = useState("");

  // Reference to current local inventory for fallback without adding to dependencies
  const localInventoryRef = useRef(inventory);
  localInventoryRef.current = inventory;

  // Controlled fetch - ONLY triggers on mount or explicit filter change
  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await inventoryApi.fetchItems({
        search: debouncedSearch.trim() || undefined,
        category_id: selectedCategory !== "ALL" ? selectedCategory : undefined,
        low_stock: isLowStockOnly ? true : undefined,
      });

      if (data && Array.isArray(data.results)) {
        setCatalogResults(data.results);
        setMetrics({
          count: data.count,
          low_stock_count: data.low_stock_count,
          total_valuation: data.total_valuation,
        });
      }
    } catch {
      // Local fallback
      const local = localInventoryRef.current;
      const filtered = local.filter((item) => {
        const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
        const q = debouncedSearch.toLowerCase().trim();
        const matchSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.supplierName.toLowerCase().includes(q);
        const matchLow = !isLowStockOnly || item.currentStock <= item.minThreshold;
        return matchCat && matchSearch && matchLow;
      });

      const totalValuation = local.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
      const lowCount = local.filter((i) => i.currentStock <= i.minThreshold).length;

      setMetrics({
        count: local.length,
        low_stock_count: lowCount,
        total_valuation: totalValuation,
      });

      setCatalogResults(
        filtered.map((i) => ({
          id: i.id,
          sku: `SKU-${i.id.slice(0, 8).toUpperCase()}`,
          name: i.name,
          category_name: i.category,
          supplier_name: i.supplierName,
          current_stock: i.currentStock,
          unit: i.unit.toUpperCase(),
          min_threshold: i.minThreshold,
          cost_per_unit: i.costPerUnit,
          total_valuation: i.currentStock * i.costPerUnit,
          is_low_stock: i.currentStock <= i.minThreshold,
          last_restocked: i.lastRestocked,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, isLowStockOnly]);

  // Load once on filter change or manual refreshTrigger (when purchase is saved)
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog, refreshTrigger]);

  // Dynamic Category Pills
  const categoriesList = useMemo(() => {
    const set = new Set<string>([
      "ALL",
      "Raw Meat & Poultry",
      "Bakery & Buns",
      "Dairy & Cheese",
      "Vegetables & Produce",
      "Sauces & Condiments",
      "Beverages & Drinks",
      "Packaging & Disposables",
      "Retail Counter Goods",
    ]);
    inventory.forEach((i) => {
      if (i.category && i.category.trim()) set.add(i.category.trim());
    });
    catalogResults.forEach((i) => {
      const cat = i.category_name || (typeof i.category === "string" ? i.category : "");
      if (cat.trim()) set.add(cat.trim());
    });
    return Array.from(set);
  }, [inventory, catalogResults]);

  // Open Physical Stock Audit Reconcile Modal
  const handleOpenAuditModal = () => {
    const itemsToAudit = catalogResults.length > 0 ? catalogResults : inventory;
    setAuditRows(
      itemsToAudit.slice(0, 15).map((item: any) => ({
        itemId: item.id,
        name: item.name,
        systemStock: parseFloat(item.current_stock ?? item.currentStock) || 0,
        physicalStock: String(parseFloat(item.current_stock ?? item.currentStock) || 0),
        unit: String(item.unit || "KG").toUpperCase(),
        note: "",
      }))
    );
    setIsAuditModalOpen(true);
  };

  const handleAuditRowChange = (itemId: string | number, field: "physicalStock" | "note", val: string) => {
    setAuditRows((prev) =>
      prev.map((r) => (r.itemId === itemId ? { ...r, [field]: val } : r))
    );
  };

  const handleSaveAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAudit(true);
    try {
      const payload = {
        items: auditRows.map((r) => ({
          item_id: r.itemId,
          physical_stock: (parseFloat(r.physicalStock) || 0).toFixed(3),
          note: r.note.trim() || undefined,
        })),
      };

      await inventoryApi.reconcileAudit(payload);

      // Also update local state
      auditRows.forEach((r) => {
        const val = parseFloat(r.physicalStock) || 0;
        updateInventoryStock(String(r.itemId), val);
      });

      addToast({
        title: "Audit Reconciled",
        description: "Physical stock variances reconciled and logged.",
        type: "success",
      });

      setIsAuditModalOpen(false);
      loadCatalog();
    } catch {
      // Local fallback
      auditRows.forEach((r) => {
        const val = parseFloat(r.physicalStock) || 0;
        updateInventoryStock(String(r.itemId), val);
      });
      addToast({
        title: "Audit Saved Locally",
        description: "Physical counts updated in system.",
        type: "info",
      });
      setIsAuditModalOpen(false);
      loadCatalog();
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  // Add SKU Modal
  const handleOpenAdd = () => {
    setName("");
    setCategory("Raw Meat & Poultry");
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setCurrentStock("20");
    setUnit("KG");
    setMinThreshold("10");
    setCostPerUnit("300");
    setSupplierName("");
    setIsAddModalOpen(true);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory =
      isCustomCategory && customCategoryInput.trim()
        ? customCategoryInput.trim()
        : category;

    addInventoryItem({
      name: name.trim(),
      category: finalCategory,
      currentStock: parseFloat(currentStock) || 0,
      unit: unit.toLowerCase() as any,
      minThreshold: parseFloat(minThreshold) || 0,
      costPerUnit: parseFloat(costPerUnit) || 0,
      supplierName: supplierName.trim() || "Verified Supplier",
      outletId: currentOutlet.id,
    });

    addToast({
      title: "SKU Created",
      description: `${name.trim()} added to catalog.`,
      type: "success",
    });

    setIsAddModalOpen(false);
    setTimeout(() => loadCatalog(), 100);
  };

  const handleSaveAdjust = (item: any) => {
    const val = parseFloat(adjustValue);
    if (isNaN(val) || val < 0) return;
    updateInventoryStock(String(item.id), val);
    addToast({
      title: "Stock Updated",
      description: `${item.name} set to ${val} ${item.unit}`,
      type: "success",
    });
    setAdjustingItemId(null);
    loadCatalog();
  };

  return (
    <div className="bg-zinc-900/60 p-3 rounded-lg space-y-3">
      {/* -------------------------------------------------------------
          TOP METRICS CARDS (Valuation, Active SKUs, Low Stock Alerts)
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Card 1: Total Valuation */}
        <div className="bg-zinc-900/80 p-2.5 rounded-lg border-0 ring-1 ring-zinc-800/40 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
              Total Inventory Valuation
            </span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              {formatNPR(metrics.total_valuation)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Boxes className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Total Active SKUs */}
        <div className="bg-zinc-900/80 p-2.5 rounded-lg border-0 ring-1 ring-zinc-800/40 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
              Total Active SKUs
            </span>
            <div className="text-base font-bold font-mono text-zinc-100 mt-0.5">
              {metrics.count}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Low Stock Alerts */}
        <div
          className={`p-2.5 rounded-lg border-0 ring-1 flex items-center justify-between ${
            metrics.low_stock_count > 0
              ? "bg-rose-950/20 ring-rose-500/40"
              : "bg-zinc-900/80 ring-zinc-800/40"
          }`}
        >
          <div>
            <span
              className={`block text-[10px] uppercase font-semibold tracking-wider ${
                metrics.low_stock_count > 0 ? "text-rose-400 font-bold" : "text-zinc-400"
              }`}
            >
              Low Stock Alerts
            </span>
            <div
              className={`text-base font-bold font-mono mt-0.5 ${
                metrics.low_stock_count > 0 ? "text-rose-400" : "text-zinc-300"
              }`}
            >
              {metrics.low_stock_count}
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              metrics.low_stock_count > 0
                ? "bg-rose-500/20 text-rose-400"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          FILTER & ACTIONS STRIP (Search, Low Stock Toggle, Action Buttons)
      ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          {/* Search Box (No Placeholder) */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 pl-8 pr-7 text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Low Stock Toggle Button */}
          <button
            type="button"
            onClick={() => setIsLowStockOnly(!isLowStockOnly)}
            className={`h-7 px-2 text-xs rounded font-medium flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
              isLowStockOnly
                ? "bg-rose-500/20 text-rose-300 border-0 ring-1 ring-rose-500/50"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Low Stock</span>
          </button>
        </div>

        {/* Action Buttons: [Physical Audit Reconcile] & [+ Add SKU] */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenAuditModal}
            className="h-7 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Scale className="w-3 h-3 text-amber-400" />
            <span>Physical Audit Reconcile</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="h-7 px-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Add SKU</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          CATEGORY FILTER PILLS (Borderless, Tiny UI)
      ------------------------------------------------------------- */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-0.5 text-[11px] rounded whitespace-nowrap transition-colors cursor-pointer font-medium ${
              selectedCategory === cat
                ? "bg-zinc-800 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* -------------------------------------------------------------
          STOCK ITEMS TABLE (Dense, Tiny UI, 10 Columns)
      ------------------------------------------------------------- */}
      <div className="overflow-x-auto rounded border-0 ring-1 ring-zinc-800/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/90 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
              <th className="py-1.5 px-2 w-28">SKU Code</th>
              <th className="py-1.5 px-2">Item Name</th>
              <th className="py-1.5 px-2">Category</th>
              <th className="py-1.5 px-2">Supplier</th>
              <th className="py-1.5 px-2 text-right">Current Stock</th>
              <th className="py-1.5 px-1.5 text-center">Unit</th>
              <th className="py-1.5 px-2 text-right">Min Threshold</th>
              <th className="py-1.5 px-2 text-right">Cost Rate</th>
              <th className="py-1.5 px-2 text-right">Valuation</th>
              <th className="py-1.5 px-2 text-center">Status</th>
              <th className="py-1.5 px-2 text-right w-24">Quick Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {isLoading && catalogResults.length === 0 && (
              <tr>
                <td colSpan={11} className="py-6 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Synchronizing stock catalog...</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && catalogResults.length === 0 && (
              <tr>
                <td colSpan={11} className="py-6 text-center text-zinc-500 text-xs">
                  No stock items found matching current filters.
                </td>
              </tr>
            )}

            {catalogResults.map((item) => {
              const stock = parseFloat(String(item.current_stock)) || 0;
              const min = parseFloat(String(item.min_threshold)) || 0;
              const cost = parseFloat(String(item.cost_per_unit)) || 0;
              const valuation = parseFloat(String(item.total_valuation)) || stock * cost;
              const isLow = item.is_low_stock ?? stock <= min;
              const skuCode = item.sku || `SKU-${String(item.id).slice(0, 8).toUpperCase()}`;

              return (
                <tr key={String(item.id)} className="hover:bg-zinc-900/40">
                  {/* SKU */}
                  <td className="py-1.5 px-2 font-mono text-[10px] text-zinc-400 font-semibold truncate">
                    {skuCode}
                  </td>

                  {/* Item Name */}
                  <td className="py-1.5 px-2 font-semibold text-zinc-100">{item.name}</td>

                  {/* Category */}
                  <td className="py-1.5 px-2 text-[11px] text-zinc-400">
                    {item.category_name || (typeof item.category === "string" ? item.category : "Produce")}
                  </td>

                  {/* Supplier */}
                  <td className="py-1.5 px-2 text-[11px] text-zinc-400 truncate max-w-[140px]">
                    {item.supplier_name || "Verified Supplier"}
                  </td>

                  {/* Current Stock */}
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-xs">
                    <span className={isLow ? "text-rose-400 font-black" : "text-zinc-100"}>
                      {stock.toFixed(2)}
                    </span>
                  </td>

                  {/* Unit */}
                  <td className="py-1.5 px-1.5 text-center font-mono text-[10px] text-zinc-400 uppercase">
                    {item.unit}
                  </td>

                  {/* Min Threshold */}
                  <td className="py-1.5 px-2 text-right font-mono text-zinc-400 text-xs">
                    {min.toFixed(1)}
                  </td>

                  {/* Cost Rate */}
                  <td className="py-1.5 px-2 text-right font-mono text-zinc-300 text-xs">
                    {formatNPR(cost)}
                  </td>

                  {/* Total Valuation */}
                  <td className="py-1.5 px-2 text-right font-mono text-emerald-400 font-semibold text-xs">
                    {formatNPR(valuation)}
                  </td>

                  {/* Status Pill */}
                  <td className="py-1.5 px-2 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border-0 ring-1 ring-rose-500/40">
                        <TrendingDown className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                        <span>Low</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                        Adequate
                      </span>
                    )}
                  </td>

                  {/* Quick Adjust */}
                  <td className="py-1.5 px-2 text-right">
                    {adjustingItemId === item.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={adjustValue}
                          autoFocus
                          onChange={(e) => setAdjustValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveAdjust(item);
                            if (e.key === "Escape") setAdjustingItemId(null);
                          }}
                          className="w-14 h-5 px-1 text-[11px] bg-zinc-950 font-mono text-right rounded border-0 ring-1 ring-amber-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveAdjust(item)}
                          className="p-0.5 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustingItemId(null)}
                          className="p-0.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustingItemId(item.id);
                          setAdjustValue(String(stock));
                        }}
                        className="px-1.5 py-0.5 text-[10px] rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors font-medium cursor-pointer"
                      >
                        Adjust
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* -------------------------------------------------------------
          PHYSICAL STOCK AUDIT RECONCILIATION MODAL
      ------------------------------------------------------------- */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-zinc-900 border-0 ring-1 ring-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                  Physical Stock Audit & Variance Reconciliation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Audit Table */}
            <form onSubmit={handleSaveAudit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 overflow-y-auto flex-1 space-y-2 text-xs">
                <div className="text-[11px] text-zinc-400">
                  Input actual shelf counts below. The system atomically calculates variances, updates
                  current stock balances, and writes immutable audit ledger records.
                </div>

                <div className="overflow-x-auto rounded border-0 ring-1 ring-zinc-800/60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-1.5 px-2">Item Name</th>
                        <th className="py-1.5 px-2 text-right">System Stock</th>
                        <th className="py-1.5 px-2 text-center w-28">Physical Count</th>
                        <th className="py-1.5 px-2 text-right">Variance</th>
                        <th className="py-1.5 px-2 w-44">Discrepancy Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {auditRows.map((row) => {
                        const physVal = parseFloat(row.physicalStock) || 0;
                        const variance = physVal - row.systemStock;

                        return (
                          <tr key={String(row.itemId)} className="hover:bg-zinc-900/50">
                            <td className="py-1.5 px-2 font-medium text-zinc-200">
                              {row.name}
                            </td>

                            <td className="py-1.5 px-2 text-right font-mono text-zinc-400">
                              {row.systemStock.toFixed(2)} {row.unit}
                            </td>

                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.physicalStock}
                                onChange={(e) =>
                                  handleAuditRowChange(row.itemId, "physicalStock", e.target.value)
                                }
                                className="w-full h-6 px-1.5 text-xs bg-zinc-950 border-0 ring-1 ring-zinc-700 focus:ring-amber-500 rounded text-zinc-100 font-mono text-center font-bold focus:outline-none"
                              />
                            </td>

                            <td className="py-1.5 px-2 text-right font-mono font-bold text-xs">
                              <span
                                className={
                                  variance > 0
                                    ? "text-emerald-400"
                                    : variance < 0
                                    ? "text-rose-400"
                                    : "text-zinc-500"
                                }
                              >
                                {variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2)}
                              </span>
                            </td>

                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                value={row.note}
                                onChange={(e) =>
                                  handleAuditRowChange(row.itemId, "note", e.target.value)
                                }
                                className="w-full h-6 px-1.5 text-[11px] bg-zinc-950 border-0 ring-1 ring-zinc-800 focus:ring-amber-500 rounded text-zinc-200 focus:outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-zinc-800 flex items-center justify-end gap-2 bg-zinc-900/90">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="h-7 px-3 rounded text-zinc-400 hover:text-zinc-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAudit}
                  className="h-7 px-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs rounded flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isSubmittingAudit ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Reconciling...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Apply Reconciliation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          ADD SKU MODAL (No Placeholders)
      ------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-zinc-900 border-0 ring-1 ring-zinc-800 rounded-xl w-full max-w-md shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                Create New SKU
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-7 px-2 bg-zinc-800/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    {isCustomCategory ? "Pick existing" : "+ New category"}
                  </button>
                </div>
                {isCustomCategory ? (
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    className="w-full h-7 px-2 bg-zinc-800/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 text-xs focus:outline-none"
                  />
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-7 px-2 bg-zinc-800/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 text-xs focus:outline-none cursor-pointer"
                  >
                    {categoriesList
                      .filter((c) => c !== "ALL")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
                  Supplier
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full h-7 px-2 bg-zinc-800/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full h-7 px-2 font-mono bg-zinc-800/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-7 px-2 font-mono bg-zinc-800/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 text-xs focus:outline-none"
                  >
                    <option value="KG">KG</option>
                    <option value="PCS">PCS</option>
                    <option value="GRAMS">GRAMS</option>
                    <option value="LITERS">LITERS</option>
                    <option value="MILLILITERS">MILLILITERS</option>
                    <option value="PACKS">PACKS</option>
                    <option value="BOXES">BOXES</option>
                    <option value="BOTTLES">BOTTLES</option>
                    <option value="CANS">CANS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
                    Min Threshold
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    className="w-full h-7 px-2 font-mono bg-zinc-800/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
                    Cost / Unit (Rs.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full h-7 px-2 font-mono bg-zinc-800/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-7 px-3 text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-7 px-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded cursor-pointer"
                >
                  Save SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
