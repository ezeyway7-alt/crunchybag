import React, { useState } from "react";
import {
  Boxes,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Search,
  Truck,
  DollarSign,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { InventoryItem } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

const CATEGORIES = [
  "ALL",
  "Raw Meat & Poultry",
  "Bakery & Buns",
  "Dairy & Cheese",
  "Vegetables & Produce",
  "Sauces & Condiments",
  "Packaging & Disposables",
];

export const AdminInventoryTab: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryStock, deleteInventoryItem, currentOutlet } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustQtyInput, setAdjustQtyInput] = useState<string>("");

  // Add Item form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Raw Meat & Poultry");
  const [currentStock, setCurrentStock] = useState("");
  const [unit, setUnit] = useState("kg");
  const [minThreshold, setMinThreshold] = useState("10");
  const [costPerUnit, setCostPerUnit] = useState("350");
  const [supplierName, setSupplierName] = useState("");

  const openAddModal = () => {
    setName("");
    setCategory("Raw Meat & Poultry");
    setCurrentStock("25");
    setUnit("kg");
    setMinThreshold("10");
    setCostPerUnit("350");
    setSupplierName("Valley Poultry & Fresh Farm Nepal");
    setIsAddModalOpen(true);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addInventoryItem({
      name,
      category,
      currentStock: parseFloat(currentStock) || 0,
      unit,
      minThreshold: parseFloat(minThreshold) || 0,
      costPerUnit: parseFloat(costPerUnit) || 0,
      supplierName: supplierName || "Local Verified Supplier",
      outletId: currentOutlet.id,
    });

    setIsAddModalOpen(false);
  };

  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    const newStock = parseFloat(adjustQtyInput);
    if (!isNaN(newStock) && newStock >= 0) {
      updateInventoryStock(adjustingItem.id, newStock);
      setAdjustingItem(null);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minThreshold);
  const totalStockValuation = inventory.reduce(
    (sum, item) => sum + item.currentStock * item.costPerUnit,
    0
  );

  return (
    <div className="space-y-4">
      {/* Clean compact metrics bar - no big letters or bulky boxes */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400 py-1 font-medium border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-zinc-500">Tracked SKUs:</span>
          <span className="font-mono text-zinc-100 font-bold">{inventory.length}</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-zinc-500">Inventory Valuation:</span>
          <span className="font-mono text-emerald-400 font-bold">{formatNPR(totalStockValuation)}</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className={`w-2 h-2 rounded-full ${lowStockItems.length > 0 ? "bg-rose-500 animate-pulse" : "bg-zinc-600"}`} />
          <span className="text-zinc-500">Low Stock Alerts:</span>
          <span className={`font-mono font-bold ${lowStockItems.length > 0 ? "text-rose-400" : "text-zinc-400"}`}>
            {lowStockItems.length} SKUs Low
          </span>
        </div>
      </div>

      {/* Action and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-[#121214] p-3 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search raw material, SKU, or supplier..."
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={openAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
          >
            Add Raw Material SKU
          </Button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-bold rounded-none border whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-extrabold"
                : "bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
              <th className="p-3.5">Raw Material / Item</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5 text-right">Current Stock</th>
              <th className="p-3.5 text-right">Min Threshold</th>
              <th className="p-3.5 text-right">Unit Cost</th>
              <th className="p-3.5 text-right">Total Value</th>
              <th className="p-3.5">Supplier</th>
              <th className="p-3.5">Last Restocked</th>
              <th className="p-3.5 text-center">Adjust Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredInventory.map((item) => {
              const isLow = item.currentStock <= item.minThreshold;
              const value = item.currentStock * item.costPerUnit;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors ${
                    isLow ? "bg-rose-50/40 dark:bg-rose-950/10" : ""
                  }`}
                >
                  <td className="p-3.5">
                    <div className="font-bold text-zinc-900 dark:text-white">{item.name}</div>
                    <div className="text-[10px] text-zinc-500">{item.id}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    <span
                      className={`font-black text-sm ${
                        isLow
                          ? "text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1"
                          : "text-zinc-900 dark:text-white"
                      }`}
                    >
                      {isLow && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      {item.currentStock} {item.unit}
                    </span>
                    {isLow && (
                      <span className="text-[9px] font-black uppercase text-rose-500 block">
                        Reorder needed
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-mono text-zinc-500">
                    {item.minThreshold} {item.unit}
                  </td>
                  <td className="p-3.5 text-right font-mono text-zinc-700 dark:text-zinc-300">
                    {formatNPR(item.costPerUnit)}/{item.unit}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatNPR(value)}
                  </td>
                  <td className="p-3.5 text-zinc-600 dark:text-zinc-400">
                    <span className="truncate block max-w-[140px]">{item.supplierName}</span>
                  </td>
                  <td className="p-3.5 text-[11px] text-zinc-500 whitespace-nowrap">
                    {item.lastRestocked}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAdjustingItem(item);
                          setAdjustQtyInput(item.currentStock.toString());
                        }}
                        className="text-[11px] h-7 px-2"
                      >
                        Adjust
                      </Button>
                      <button
                        onClick={() => deleteInventoryItem(item.id)}
                        className="p-1 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete SKU"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Raw Material / Ingredient SKU"
      >
        <form onSubmit={handleCreateItem} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Material Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Chicken Wings (Jumbo)"
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Unit of Measure *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="grams">Grams (g)</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="packets">Packets</option>
                <option value="liters">Liters (L)</option>
                <option value="boxes">Carton Boxes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Initial Stock *
              </label>
              <Input
                type="number"
                step="0.1"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Min Threshold *
              </label>
              <Input
                type="number"
                step="0.1"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Cost Per Unit (NPR) *
              </label>
              <Input
                type="number"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Primary Supplier
            </label>
            <Input
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Valley Poultry Pvt Ltd"
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
            >
              Save Raw Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={Boolean(adjustingItem)}
        onClose={() => setAdjustingItem(null)}
        title={adjustingItem ? `Adjust Stock Level: ${adjustingItem.name}` : ""}
      >
        {adjustingItem && (
          <form onSubmit={handleSaveStockAdjustment} className="space-y-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-zinc-500">Current Measured Stock:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  {adjustingItem.currentStock} {adjustingItem.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Safety Threshold:</span>
                <span className="font-mono text-zinc-600 dark:text-zinc-400">
                  {adjustingItem.minThreshold} {adjustingItem.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                New Measured Stock Count ({adjustingItem.unit}) *
              </label>
              <Input
                type="number"
                step="0.1"
                value={adjustQtyInput}
                onChange={(e) => setAdjustQtyInput(e.target.value)}
                required
                className="text-base font-mono font-bold"
                autoFocus
              />
            </div>

            {/* Quick adjust presets */}
            <div className="flex items-center gap-2">
              {[+5, +10, +25, -5, -10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => {
                    const curr = parseFloat(adjustQtyInput) || adjustingItem.currentStock;
                    setAdjustQtyInput(Math.max(0, curr + delta).toString());
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-500 hover:text-black transition-colors"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustingItem(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
              >
                Update Stock Count
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
