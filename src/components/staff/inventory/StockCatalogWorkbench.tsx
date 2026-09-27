import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  AlertTriangle,
  Boxes,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { InventoryItem, InventoryCategory } from "../../../types";
import { formatNPR } from "../../../lib/utils";

export const StockCatalogWorkbench: React.FC = () => {
  const {
    inventory,
    addInventoryItem,
    updateInventoryStock,
    currentOutlet,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

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
    return Array.from(set);
  }, [inventory]);

  // Adjust Stock state
  const [adjustingItemId, setAdjustingItemId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState<string>("");

  // Add Item modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Raw Meat & Poultry");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [currentStock, setCurrentStock] = useState("");
  const [unit, setUnit] = useState<InventoryItem["unit"]>("kg");
  const [minThreshold, setMinThreshold] = useState("10");
  const [costPerUnit, setCostPerUnit] = useState("350");
  const [supplierName, setSupplierName] = useState("");

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    setName("");
    setCategory("Raw Meat & Poultry");
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setCurrentStock("20");
    setUnit("kg");
    setMinThreshold("10");
    setCostPerUnit("300");
    setSupplierName("");
    setIsAddModalOpen(true);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = isCustomCategory && customCategoryInput.trim()
      ? customCategoryInput.trim()
      : category;

    addInventoryItem({
      name: name.trim(),
      category: finalCategory,
      currentStock: parseFloat(currentStock) || 0,
      unit,
      minThreshold: parseFloat(minThreshold) || 0,
      costPerUnit: parseFloat(costPerUnit) || 0,
      supplierName: supplierName.trim() || "Verified Supplier",
      outletId: currentOutlet.id,
    });

    addToast({
      title: "SKU Created",
      description: `${name.trim()} added to inventory catalog.`,
      type: "success",
    });

    setIsAddModalOpen(false);
  };

  const handleSaveAdjust = (item: InventoryItem) => {
    const val = parseFloat(adjustValue);
    if (isNaN(val) || val < 0) return;
    updateInventoryStock(item.id, val);
    addToast({
      title: "Stock Updated",
      description: `${item.name} set to ${val} ${item.unit}`,
      type: "success",
    });
    setAdjustingItemId(null);
  };

  return (
    <div className="bg-zinc-900/40 p-4 rounded-xl space-y-3.5">
      {/* Search & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inventory..."
              className="w-full h-8 pl-8 pr-7 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-8 px-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add SKU</span>
        </button>
      </div>

      {/* Category Pills (Borderless, Sleek) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors cursor-pointer font-medium ${
              selectedCategory === cat
                ? "bg-zinc-800 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Borderless Table */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/60 text-zinc-400 text-[11px] font-semibold">
              <th className="py-2.5 px-3">Item / SKU</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Stock</th>
              <th className="py-2.5 px-3 text-right">Min Threshold</th>
              <th className="py-2.5 px-3 text-right">Unit Cost</th>
              <th className="py-2.5 px-3 text-right">Total Value</th>
              <th className="py-2.5 px-3">Supplier</th>
              <th className="py-2.5 px-3 text-center">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-500 text-xs">
                  No inventory items found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minThreshold;
                const value = item.currentStock * item.costPerUnit;
                const isAdjusting = adjustingItemId === item.id;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <div className="font-semibold text-zinc-100">{item.name}</div>
                      <div className="font-mono text-[10px] text-zinc-500">{item.id}</div>
                    </td>

                    <td className="py-2 px-3 text-zinc-400">{item.category}</td>

                    <td className="py-2 px-3 text-right font-mono">
                      <div className="flex items-center justify-end gap-1.5">
                        {isLow && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                        <span
                          className={`font-bold ${
                            isLow ? "text-rose-400" : "text-zinc-100"
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                      </div>
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-zinc-500">
                      {item.minThreshold} {item.unit}
                    </td>

                    <td className="py-2 px-3 text-right font-mono text-zinc-300">
                      {formatNPR(item.costPerUnit)}
                    </td>

                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                      {formatNPR(value)}
                    </td>

                    <td className="py-2 px-3 text-zinc-400 truncate max-w-[140px]">
                      {item.supplierName || "—"}
                    </td>

                    <td className="py-2 px-3 text-center">
                      {isAdjusting ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={adjustValue}
                            onChange={(e) => setAdjustValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveAdjust(item);
                              if (e.key === "Escape") setAdjustingItemId(null);
                            }}
                            autoFocus
                            className="w-16 h-6 px-1.5 text-xs text-center font-mono bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500 rounded text-zinc-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveAdjust(item)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustingItemId(null)}
                            className="p-1 text-zinc-500 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingItemId(item.id);
                            setAdjustValue(item.currentStock.toString());
                          }}
                          className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                          Adjust
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add SKU Modal (Borderless fields, clean 4-col layout) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-500" />
                <span>Add Inventory SKU</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-8 px-2.5 bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-zinc-400 font-medium">
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
                      placeholder="Enter new category name..."
                      className="w-full h-8 px-2.5 bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none"
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-8 px-2 bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none cursor-pointer"
                    >
                      {categoriesList.filter((c) => c !== "ALL").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full h-8 px-2.5 bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full h-8 px-2.5 font-mono bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full h-8 px-2 font-mono bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="pcs">pcs</option>
                    <option value="litres">litres</option>
                    <option value="packets">packets</option>
                    <option value="boxes">boxes</option>
                    <option value="cans">cans</option>
                    <option value="bottles">bottles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                    Min Threshold
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    className="w-full h-8 px-2.5 font-mono bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                    Cost Per Unit
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full h-8 px-2.5 font-mono bg-zinc-800/60 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-8 px-3 text-zinc-400 hover:text-white rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
