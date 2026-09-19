import React, { useState } from "react";
import {
  FileText,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  DollarSign,
  Receipt,
  Search,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { PurchaseRecord } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

export const AdminPurchasesTab: React.FC = () => {
  const { purchases, addPurchaseRecord, inventory, currentOutlet } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentStatus, setPaymentStatus] = useState<PurchaseRecord["paymentStatus"]>("PAID");
  const [paymentMethod, setPaymentMethod] = useState<PurchaseRecord["paymentMethod"]>("FONEPAY");
  const [receivedBy, setReceivedBy] = useState("Pooja Gurung");
  const [notes, setNotes] = useState("");

  // Purchase items
  const [purchaseItems, setPurchaseItems] = useState<
    { itemId: string; itemName: string; quantity: number; unit: string; unitCost: number; totalCost: number }[]
  >([
    {
      itemId: inventory[0]?.id || "inv-01",
      itemName: inventory[0]?.name || "Raw Chicken",
      quantity: 20,
      unit: inventory[0]?.unit || "kg",
      unitCost: inventory[0]?.costPerUnit || 380,
      totalCost: 20 * (inventory[0]?.costPerUnit || 380),
    },
  ]);

  const openAddModal = () => {
    setInvoiceNumber(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    setSupplierName("Valley Poultry & Fresh Farm Nepal");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setPaymentStatus("PAID");
    setPaymentMethod("FONEPAY");
    setReceivedBy("Pooja Gurung");
    setNotes("Quality check verified and restocked in cold room.");
    if (inventory.length > 0) {
      setPurchaseItems([
        {
          itemId: inventory[0].id,
          itemName: inventory[0].name,
          quantity: 25,
          unit: inventory[0].unit,
          unitCost: inventory[0].costPerUnit,
          totalCost: 25 * inventory[0].costPerUnit,
        },
      ]);
    }
    setIsAddModalOpen(true);
  };

  const handleAddItemRow = () => {
    const defaultItem = inventory[0] || { id: "custom", name: "Custom Item", unit: "kg", costPerUnit: 100 };
    setPurchaseItems((prev) => [
      ...prev,
      {
        itemId: defaultItem.id,
        itemName: defaultItem.name,
        quantity: 10,
        unit: defaultItem.unit,
        unitCost: defaultItem.costPerUnit,
        totalCost: 10 * defaultItem.costPerUnit,
      },
    ]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setPurchaseItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "itemId") {
        const inv = inventory.find((i) => i.id === value);
        if (inv) {
          item.itemName = inv.name;
          item.unit = inv.unit;
          item.unitCost = inv.costPerUnit;
        }
      }
      if (field === "quantity" || field === "unitCost" || field === "itemId") {
        item.totalCost = Number(item.quantity) * Number(item.unitCost);
      }
      next[index] = item;
      return next;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPurchaseBill = purchaseItems.reduce((sum, item) => sum + item.totalCost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim() || !supplierName.trim()) return;

    addPurchaseRecord({
      invoiceNumber,
      supplierName,
      purchaseDate,
      items: purchaseItems,
      totalAmount: totalPurchaseBill,
      paymentStatus,
      paymentMethod,
      receivedBy,
      notes,
      outletId: currentOutlet.id,
    });

    setIsAddModalOpen(false);
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchStatus = filterStatus === "ALL" || p.paymentStatus === filterStatus;
    const matchQuery =
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.receivedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchQuery;
  });

  const totalProcurementSpend = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-4">
      {/* Clean compact metrics bar - no big letters or bulky boxes */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400 py-1 font-medium border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-zinc-500">Total Purchase Bills:</span>
          <span className="font-mono text-zinc-100 font-bold">{purchases.length}</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-zinc-500">Material Procurement Outflow:</span>
          <span className="font-mono text-rose-400 font-bold">{formatNPR(totalProcurementSpend)}</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-zinc-500">Stock Sync:</span>
          <span className="text-emerald-400 font-bold">Auto-Sync Active</span>
        </div>
      </div>

      {/* Action and search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-[#121214] p-3 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, supplier, or receiver..."
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
            Record Purchase Bill
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {["ALL", "PAID", "PENDING", "PARTIAL"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-xs font-bold rounded-none border whitespace-nowrap transition-all ${
              filterStatus === status
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-extrabold"
                : "bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Purchases List Cards */}
      <div className="space-y-3">
        {filteredPurchases.map((po) => (
          <div
            key={po.id}
            className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-zinc-950 dark:text-white">
                    {po.invoiceNumber}
                  </span>
                  <Badge
                    variant={
                      po.paymentStatus === "PAID"
                        ? "success"
                        : po.paymentStatus === "PENDING"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {po.paymentStatus}
                  </Badge>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800">
                    {po.paymentMethod}
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  {po.supplierName}
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-black font-mono text-zinc-950 dark:text-white">
                  {formatNPR(po.totalAmount)}
                </div>
                <div className="text-[11px] text-zinc-500 flex items-center justify-end gap-1.5 mt-0.5">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  {po.purchaseDate} • Received by: {po.receivedBy}
                </div>
              </div>
            </div>

            {/* Line items preview */}
            <div className="pt-3">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block mb-1">
                Items Procured ({po.items.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {po.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-white block truncate max-w-[150px]">
                        {item.itemName}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {item.quantity} {item.unit} @ {formatNPR(item.unitCost)}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {formatNPR(item.totalCost)}
                    </span>
                  </div>
                ))}
              </div>

              {po.notes && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic mt-2">
                  Note: "{po.notes}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Raw Material Purchase Bill"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Supplier Invoice / Bill # *
              </label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-VP-2024-884"
                required
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Supplier Company Name *
              </label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Valley Poultry Nepal"
                required
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Invoice Date *
              </label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Payment Status *
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PurchaseRecord["paymentStatus"])}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING (CREDIT)</option>
                <option value="PARTIAL">PARTIAL PAYMENT</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PurchaseRecord["paymentMethod"])}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="FONEPAY">Fonepay QR</option>
                <option value="CASH">Store Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer / Cheque</option>
                <option value="CREDIT">Credit (Account Payable)</option>
              </select>
            </div>
          </div>

          {/* Items Table in PO */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                Line Items (Auto-Increments Inventory Stock)
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {purchaseItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-5">
                    <select
                      value={item.itemId}
                      onChange={(e) => handleItemChange(idx, "itemId", e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-xs text-zinc-900 dark:text-white"
                    >
                      {inventory.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="text-xs font-mono py-1 px-2"
                    />
                  </div>

                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(idx, "unitCost", parseFloat(e.target.value) || 0)}
                      placeholder="Cost"
                      className="text-xs font-mono py-1 px-2"
                    />
                  </div>

                  <div className="col-span-2 font-mono font-bold text-right text-zinc-900 dark:text-white">
                    {formatNPR(item.totalCost)}
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 text-sm font-black font-mono">
              <span className="text-zinc-500 mr-2 font-sans font-bold text-xs uppercase">Total Invoice:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatNPR(totalPurchaseBill)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Goods Received By
              </label>
              <Input
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Staff name"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Notes & Inspection Remarks
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Temperature checked, fresh stock"
                className="text-xs"
              />
            </div>
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
              Record Bill & Update Inventory
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
