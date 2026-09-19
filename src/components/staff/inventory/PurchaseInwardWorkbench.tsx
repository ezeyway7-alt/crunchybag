import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Truck,
  Plus,
  Trash2,
  Calendar,
  Hash,
  Paperclip,
  CheckCircle2,
  DollarSign,
  Search,
  X,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText,
  Upload,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { InventoryItem, InventoryCategory, PurchaseLineItem } from "../../../types";
import { formatNPR } from "../../../lib/utils";

interface ExcelRowItem {
  id: string; // unique row id
  itemId?: string; // matched inventory item id or empty if new
  isNewProduct: boolean;
  productName: string;
  category: InventoryCategory;
  quantity: number;
  unit: InventoryItem["unit"];
  costPrice: number; // CP / unit
  discount: number; // item discount in NPR
  batchNo?: string;
  expiryDate?: string;
}

const DEFAULT_CATEGORIES: InventoryCategory[] = [
  "Raw Meat & Poultry",
  "Dairy & Cheese",
  "Bakery & Buns",
  "Vegetables & Produce",
  "Sauces & Condiments",
  "Beverage Syrups & Dairy",
  "Beverages & Drinks",
  "Retail Counter Goods",
  "Packaging & Disposables",
];

const DEFAULT_UNITS: Array<InventoryItem["unit"]> = [
  "kg",
  "pcs",
  "litres",
  "packets",
  "boxes",
  "cans",
  "bottles",
];

export const PurchaseInwardWorkbench: React.FC<{
  onPurchaseSaved?: () => void;
}> = ({ onPurchaseSaved }) => {
  const {
    inventory,
    addInventoryItem,
    purchases,
    addPurchaseRecord,
    recordStockMovement,
    currentOutlet,
    addToast,
  } = useApp();

  // 1. TOP SUPPLIER (SELECT2 STYLE) STATE
  const [supplierQuery, setSupplierQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement>(null);

  // Extract all unique existing suppliers from inventory & past purchases
  const existingSuppliers = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i) => {
      if (i.supplierName && i.supplierName.trim()) set.add(i.supplierName.trim());
    });
    purchases.forEach((p) => {
      if (p.supplierName && p.supplierName.trim()) set.add(p.supplierName.trim());
    });
    // Defaults if empty
    if (set.size === 0) {
      set.add("Valley Poultry & Fresh Farm Nepal");
      set.add("Kathmandu Artisan Bakery Pvt. Ltd.");
      set.add("Himalayan Organic Dairy Pvt. Ltd.");
      set.add("EcoPack Nepal Solutions");
      set.add("Everest Spices & Seasoning");
    }
    return Array.from(set);
  }, [inventory, purchases]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierQuery.trim()) return existingSuppliers;
    const q = supplierQuery.toLowerCase();
    return existingSuppliers.filter((s) => s.toLowerCase().includes(q));
  }, [existingSuppliers, supplierQuery]);

  // 2. PURCHASE METADATA STATE
  const [purchaseDate, setPurchaseDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `INV-${randomDigits}`;
  });
  const [uploadedDocument, setUploadedDocument] = useState<{
    name: string;
    size?: string;
  } | null>(null);
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierPan, setSupplierPan] = useState("");
  const [notes, setNotes] = useState("");

  // 3. EXCEL-STYLE ROWS
  const [rows, setRows] = useState<ExcelRowItem[]>([
    {
      id: "row-1",
      isNewProduct: false,
      productName: "",
      category: "Raw Meat & Poultry",
      quantity: 10,
      unit: "kg",
      costPrice: 0,
      discount: 0,
      batchNo: "",
      expiryDate: "",
    },
  ]);

  // Active product search dropdown state per row
  const [activeSearchRowId, setActiveSearchRowId] = useState<string | null>(null);

  // Ref to the first product field for auto-focus after supplier selection
  const firstProductInputRef = useRef<HTMLInputElement>(null);
  const rowInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // 4. FINANCIAL & SETTLEMENT STATE
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "FONEPAY" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT"
  >("CASH");
  const [isPaidManuallySet, setIsPaidManuallySet] = useState(false);

  // Financial calculations
  const grossSubtotal = useMemo(() => {
    return rows.reduce((sum, r) => sum + (r.quantity || 0) * (r.costPrice || 0), 0);
  }, [rows]);

  const itemDiscountsTotal = useMemo(() => {
    return rows.reduce((sum, r) => sum + (r.discount || 0), 0);
  }, [rows]);

  const netPayable = useMemo(() => {
    return Math.max(0, grossSubtotal - itemDiscountsTotal - (overallDiscount || 0));
  }, [grossSubtotal, itemDiscountsTotal, overallDiscount]);

  const dueCreditAmount = useMemo(() => {
    return Math.max(0, netPayable - (paidAmount || 0));
  }, [netPayable, paidAmount]);

  // Sync paidAmount to netPayable unless manually typed
  useEffect(() => {
    if (!isPaidManuallySet) {
      if (paymentMethod === "CREDIT") {
        setPaidAmount(0);
      } else {
        setPaidAmount(netPayable);
      }
    }
  }, [netPayable, paymentMethod, isPaidManuallySet]);

  // Handler: Select or Auto-save Supplier
  const handleSelectSupplier = (supplierName: string) => {
    const trimmed = supplierName.trim();
    if (!trimmed) return;

    setSelectedSupplier(trimmed);
    setSupplierQuery(trimmed);
    setIsSupplierDropdownOpen(false);

    // Auto-focus the first product row
    setTimeout(() => {
      firstProductInputRef.current?.focus();
    }, 100);
  };

  // Handler: Add New Row
  const handleAddRow = () => {
    const newRowId = `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setRows((prev) => [
      ...prev,
      {
        id: newRowId,
        isNewProduct: false,
        productName: "",
        category: "Raw Meat & Poultry",
        quantity: 5,
        unit: "kg",
        costPrice: 0,
        discount: 0,
        batchNo: "",
        expiryDate: "",
      },
    ]);
    setTimeout(() => {
      rowInputRefs.current[newRowId]?.focus();
    }, 50);
  };

  // Handler: Remove Row
  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) {
      // Reset single row
      setRows([
        {
          id: `row-${Date.now()}`,
          isNewProduct: false,
          productName: "",
          category: "Raw Meat & Poultry",
          quantity: 1,
          unit: "kg",
          costPrice: 0,
          discount: 0,
        },
      ]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Handler: Update Row Field
  const handleUpdateRow = (rowId: string, updates: Partial<ExcelRowItem>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r))
    );
  };

  // Handler: Choose Existing Product for a Row
  const handleSelectProduct = (rowId: string, item: InventoryItem) => {
    handleUpdateRow(rowId, {
      itemId: item.id,
      isNewProduct: false,
      productName: item.name,
      category: item.category,
      unit: item.unit,
      costPrice: item.costPerUnit || 0,
    });
    setActiveSearchRowId(null);
  };

  // Handler: Create As New Product for a Row
  const handleCreateNewProduct = (rowId: string, typedName: string) => {
    handleUpdateRow(rowId, {
      itemId: undefined,
      isNewProduct: true,
      productName: typedName.trim(),
    });
    setActiveSearchRowId(null);
  };

  // Handler: Document Upload (Simple & Clean)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      setUploadedDocument({
        name: file.name,
        size: sizeStr,
      });
      addToast({
        title: "Document Attached",
        description: `${file.name} (${sizeStr}) linked to invoice`,
        type: "success",
      });
    }
  };

  // Submit & Save Inward Purchase
  const handleSavePurchase = () => {
    if (!selectedSupplier.trim()) {
      addToast({
        title: "Supplier Required",
        description: "Please search and select or enter a supplier name.",
        type: "warning",
      });
      supplierInputRef.current?.focus();
      return;
    }

    const validRows = rows.filter((r) => r.productName.trim() && r.quantity > 0);
    if (validRows.length === 0) {
      addToast({
        title: "Empty Inward Items",
        description: "Please enter at least one product with quantity greater than 0.",
        type: "warning",
      });
      return;
    }

    // 1. Process items: create new items if necessary, generate purchase line items
    const purchaseItems: PurchaseLineItem[] = [];

    validRows.forEach((row) => {
      let finalItemId = row.itemId;

      if (row.isNewProduct || !finalItemId) {
        // Create brand new inventory item
        const newItemPayload = {
          name: row.productName.trim(),
          category: row.category,
          currentStock: row.quantity,
          unit: row.unit,
          minThreshold: Math.max(5, Math.round(row.quantity * 0.2)),
          costPerUnit: row.costPrice,
          supplierName: selectedSupplier.trim(),
          outletId: currentOutlet.id,
          batchNo: row.batchNo || undefined,
          expiryDate: row.expiryDate || undefined,
          lastCostPrice: row.costPrice,
        };
        addInventoryItem(newItemPayload);
        finalItemId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }

      const rowTotal = Math.max(0, row.quantity * row.costPrice - (row.discount || 0));
      purchaseItems.push({
        itemId: finalItemId || `inv-${Date.now()}`,
        itemName: row.productName.trim(),
        category: row.category,
        quantity: row.quantity,
        unit: row.unit,
        unitCost: row.costPrice,
        discount: row.discount || 0,
        totalCost: rowTotal,
        batchNo: row.batchNo || undefined,
        expiryDate: row.expiryDate || undefined,
      });

      // Record stock inward movement log
      recordStockMovement({
        itemId: finalItemId || `inv-temp`,
        itemName: row.productName.trim(),
        category: row.category,
        type: "INCREASE",
        quantity: row.quantity,
        unit: row.unit,
        previousStock: 0, // context handles stock increment
        newStock: row.quantity,
        reason: `Supplier Inward Delivery (Bill #${invoiceNumber.trim() || "PURCHASE"})`,
        note: `Supplier: ${selectedSupplier} | Rate: NPR ${row.costPrice}${row.batchNo ? ` | Batch: ${row.batchNo}` : ""}`,
        outletId: currentOutlet.id,
        recordedBy: "Staff Receiving",
      });
    });

    // 2. Add Purchase Record to AppContext
    const paymentStatus: "PAID" | "PENDING" | "PARTIAL" =
      paidAmount >= netPayable ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";

    addPurchaseRecord({
      invoiceNumber: invoiceNumber.trim() || `INV-${Date.now()}`,
      supplierName: selectedSupplier.trim(),
      supplierPhone: supplierPhone.trim() || undefined,
      supplierPan: supplierPan.trim() || undefined,
      purchaseDate,
      items: purchaseItems,
      subtotal: grossSubtotal,
      discountAmount: itemDiscountsTotal + (overallDiscount || 0),
      totalAmount: netPayable,
      paidAmount,
      dueAmount: dueCreditAmount,
      paymentStatus,
      paymentMethod,
      notes: notes.trim() || undefined,
      documentName: uploadedDocument?.name,
      receivedBy: "Staff Receiving",
      outletId: currentOutlet.id,
    });

    addToast({
      title: "Purchase Bill Recorded",
      description: `Inward Invoice #${invoiceNumber} for ${selectedSupplier} saved. Stock updated!`,
      type: "success",
    });

    // Reset Workbench
    setRows([
      {
        id: `row-${Date.now()}`,
        isNewProduct: false,
        productName: "",
        category: "Raw Meat & Poultry",
        quantity: 10,
        unit: "kg",
        costPrice: 0,
        discount: 0,
      },
    ]);
    const nextRandom = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${nextRandom}`);
    setUploadedDocument(null);
    setNotes("");
    setOverallDiscount(0);
    setIsPaidManuallySet(false);

    if (onPurchaseSaved) {
      onPurchaseSaved();
    }
  };

  return (
    <div className="bg-[#141417] border border-zinc-800 p-3.5 shadow-sm space-y-3.5">
      {/* -------------------------------------------------------------
          TOP SUPPLIER & INVOICE HEADER (SELECT2 SEARCH + DATE + INV + DOC)
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pb-3 border-b border-zinc-800 items-end">
        {/* SUPPLIER SELECT2 SEARCH (COL-SPAN 4) */}
        <div className="lg:col-span-4 relative">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Truck className="w-3 h-3 text-amber-500" />
              <span>Choose Supplier (Select2 Search)</span>
            </label>
            {selectedSupplier && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                ✓ Auto-Saved
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              ref={supplierInputRef}
              type="text"
              value={supplierQuery}
              onChange={(e) => {
                setSupplierQuery(e.target.value);
                setIsSupplierDropdownOpen(true);
              }}
              onFocus={() => setIsSupplierDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredSuppliers.length > 0) {
                    handleSelectSupplier(filteredSuppliers[0]);
                  } else if (supplierQuery.trim()) {
                    handleSelectSupplier(supplierQuery);
                  }
                }
              }}
              placeholder="Search or type new supplier name..."
              className="w-full h-8 pl-8 pr-7 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
            {supplierQuery && (
              <button
                type="button"
                onClick={() => {
                  setSupplierQuery("");
                  setSelectedSupplier("");
                  setIsSupplierDropdownOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Select2 Dropdown */}
          {isSupplierDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#18181b] border border-zinc-700 shadow-xl max-h-52 overflow-y-auto text-xs divide-y divide-zinc-800">
              {filteredSuppliers.map((sup) => (
                <div
                  key={sup}
                  onMouseDown={() => handleSelectSupplier(sup)}
                  className="p-2 hover:bg-amber-500/15 cursor-pointer flex items-center justify-between text-zinc-200"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-medium">{sup}</span>
                  </div>
                  {selectedSupplier === sup && (
                    <span className="text-emerald-400 font-bold text-[10px]">Active</span>
                  )}
                </div>
              ))}

              {supplierQuery.trim() &&
                !existingSuppliers.some(
                  (s) => s.toLowerCase() === supplierQuery.trim().toLowerCase()
                ) && (
                  <div
                    onMouseDown={() => handleSelectSupplier(supplierQuery)}
                    className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>+ Auto-save "{supplierQuery.trim()}" as new supplier</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">Press Enter</span>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* PURCHASE DATE (COL-SPAN 2) */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Purchase Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* INVOICE NUMBER (INV-NO) (COL-SPAN 2) */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Invoice / Bill #
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-9021"
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono uppercase focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* SMALL DOCUMENT UPLOAD FIELD (COL-SPAN 3) */}
        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Attach Bill / Document
          </label>
          {uploadedDocument ? (
            <div className="h-8 px-2 bg-zinc-900 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-400">
              <div className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate font-mono text-[11px]">
                  {uploadedDocument.name} ({uploadedDocument.size})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUploadedDocument(null)}
                className="text-zinc-400 hover:text-white p-0.5 cursor-pointer ml-1"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="h-8 px-2 bg-zinc-900 border border-zinc-700 border-dashed hover:border-zinc-500 flex items-center justify-center gap-1.5 text-xs text-zinc-400 cursor-pointer transition-colors">
              <Upload className="w-3 h-3 text-amber-500" />
              <span className="text-[11px]">Choose File / PDF</span>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* ADD ROW BUTTON (COL-SPAN 1) */}
        <div className="lg:col-span-1">
          <button
            type="button"
            onClick={handleAddRow}
            className="w-full h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1 border border-zinc-700 cursor-pointer"
            title="Add another item row"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Row</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          EXCEL-STYLE PRODUCTS TABULAR DATA ENTRY GRID
      ------------------------------------------------------------- */}
      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-2 px-2 w-7 text-center">#</th>
              <th className="py-2 px-2 w-64">Product Name (Auto-Suggest / New)</th>
              <th className="py-2 px-2 w-36">Category</th>
              <th className="py-2 px-2 w-20 text-center">Qty</th>
              <th className="py-2 px-2 w-20">Unit</th>
              <th className="py-2 px-2 w-24 text-right">CP (Rate)</th>
              <th className="py-2 px-2 w-24 text-right">Gross</th>
              <th className="py-2 px-2 w-20 text-right">Disc (Rs.)</th>
              <th className="py-2 px-2 w-24 text-right">Net Total</th>
              <th className="py-2 px-2 w-24">Batch #</th>
              <th className="py-2 px-2 w-28">Expiry Date</th>
              <th className="py-2 px-1 w-8 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-[#141417]">
            {rows.map((row, idx) => {
              const rowGross = (row.quantity || 0) * (row.costPrice || 0);
              const rowNet = Math.max(0, rowGross - (row.discount || 0));

              // Filter matching existing inventory items for this row
              const matchingInventoryItems = inventory.filter((inv) =>
                row.productName.trim()
                  ? inv.name.toLowerCase().includes(row.productName.toLowerCase())
                  : true
              );

              return (
                <tr key={row.id} className="hover:bg-zinc-900/40">
                  {/* Row Index */}
                  <td className="py-1.5 px-2 text-center font-mono text-[11px] text-zinc-500">
                    {idx + 1}
                  </td>

                  {/* Product Field (Select / Search with Auto-focus) */}
                  <td className="py-1.5 px-2 relative">
                    <input
                      ref={(el) => {
                        if (idx === 0) firstProductInputRef.current = el;
                        rowInputRefs.current[row.id] = el;
                      }}
                      type="text"
                      value={row.productName}
                      onChange={(e) => {
                        handleUpdateRow(row.id, {
                          productName: e.target.value,
                          isNewProduct: !inventory.some(
                            (inv) =>
                              inv.name.toLowerCase() === e.target.value.trim().toLowerCase()
                          ),
                        });
                        setActiveSearchRowId(row.id);
                      }}
                      onFocus={() => setActiveSearchRowId(row.id)}
                      placeholder="Type product name..."
                      className="w-full h-7 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                    />

                    {/* Product Suggestions Dropdown */}
                    {activeSearchRowId === row.id && (
                      <div className="absolute left-2 right-2 top-full mt-1 z-20 bg-[#18181b] border border-zinc-700 shadow-xl max-h-48 overflow-y-auto text-xs divide-y divide-zinc-800">
                        {matchingInventoryItems.slice(0, 6).map((inv) => (
                          <div
                            key={inv.id}
                            onMouseDown={() => handleSelectProduct(row.id, inv)}
                            className="p-1.5 hover:bg-amber-500/15 cursor-pointer flex items-center justify-between text-zinc-200"
                          >
                            <div>
                              <span className="font-bold text-zinc-100">{inv.name}</span>
                              <span className="text-[10px] text-zinc-400 ml-1.5">
                                ({inv.category})
                              </span>
                            </div>
                            <div className="font-mono text-[10px] text-zinc-400">
                              Stock: {inv.currentStock} {inv.unit} | CP: Rs. {inv.costPerUnit}
                            </div>
                          </div>
                        ))}

                        {row.productName.trim() &&
                          !inventory.some(
                            (inv) =>
                              inv.name.toLowerCase() === row.productName.trim().toLowerCase()
                          ) && (
                            <div
                              onMouseDown={() =>
                                handleCreateNewProduct(row.id, row.productName)
                              }
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold cursor-pointer flex items-center justify-between text-[11px]"
                            >
                              <span>+ Create "{row.productName.trim()}" as new SKU</span>
                              <span className="text-[9px] text-zinc-400 font-mono">
                                New Item
                              </span>
                            </div>
                          )}
                      </div>
                    )}
                  </td>

                  {/* Category Field */}
                  <td className="py-1.5 px-2">
                    <select
                      value={row.category}
                      onChange={(e) =>
                        handleUpdateRow(row.id, {
                          category: e.target.value as InventoryCategory,
                        })
                      }
                      className="w-full h-7 px-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Quantity Field */}
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={row.quantity === 0 ? "" : row.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleUpdateRow(row.id, {
                          quantity: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-full h-7 px-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-center focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </td>

                  {/* Unit Field */}
                  <td className="py-1.5 px-2">
                    <select
                      value={row.unit}
                      onChange={(e) =>
                        handleUpdateRow(row.id, {
                          unit: e.target.value as any,
                        })
                      }
                      className="w-full h-7 px-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer font-mono"
                    >
                      {DEFAULT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* CP (Cost Price / Rate) */}
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={row.costPrice === 0 ? "" : row.costPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleUpdateRow(row.id, {
                          costPrice: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      placeholder="0"
                      className="w-full h-7 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-right focus:outline-none focus:border-amber-500"
                    />
                  </td>

                  {/* Gross Total (Calculated) */}
                  <td className="py-1.5 px-2 text-right font-mono text-zinc-300 text-xs font-semibold">
                    {formatNPR(rowGross)}
                  </td>

                  {/* Row Discount (Rs.) */}
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      min="0"
                      value={row.discount === 0 ? "" : row.discount}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleUpdateRow(row.id, {
                          discount: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      placeholder="0"
                      className="w-full h-7 px-1.5 text-xs bg-zinc-900 border border-zinc-700 text-rose-400 font-mono text-right focus:outline-none focus:border-amber-500"
                    />
                  </td>

                  {/* Row Net Total */}
                  <td className="py-1.5 px-2 text-right font-mono text-amber-400 text-xs font-black">
                    {formatNPR(rowNet)}
                  </td>

                  {/* Batch Number */}
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={row.batchNo || ""}
                      onChange={(e) =>
                        handleUpdateRow(row.id, { batchNo: e.target.value })
                      }
                      placeholder="B-901"
                      className="w-full h-7 px-1.5 text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono uppercase focus:outline-none focus:border-amber-500"
                    />
                  </td>

                  {/* Expiry Date */}
                  <td className="py-1.5 px-2">
                    <input
                      type="date"
                      value={row.expiryDate || ""}
                      onChange={(e) =>
                        handleUpdateRow(row.id, { expiryDate: e.target.value })
                      }
                      className="w-full h-7 px-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </td>

                  {/* Row Action (Delete) */}
                  <td className="py-1.5 px-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* -------------------------------------------------------------
          FINANCIAL TOTALS, DISCOUNT, PAYMENT METHOD & SETTLEMENT
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 items-end">
        {/* Remarks / Notes (Col-Span 4) */}
        <div className="lg:col-span-4">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Supplier Delivery Remarks / Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Fresh morning lot inspection verified by storekeeper..."
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Overall Bill Discount (Col-Span 2) */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Overall Bill Discount (Rs.)
          </label>
          <input
            type="number"
            min="0"
            value={overallDiscount === 0 ? "" : overallDiscount}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              setOverallDiscount(Math.max(0, parseFloat(e.target.value) || 0))
            }
            placeholder="0"
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-rose-400 font-mono text-right font-bold focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Paid Amount (Col-Span 2) */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Paid Amount</span>
            {dueCreditAmount > 0 && (
              <span className="text-amber-400 font-mono text-[9px]">
                Due: {formatNPR(dueCreditAmount)}
              </span>
            )}
          </label>
          <input
            type="number"
            min="0"
            value={paidAmount}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              setIsPaidManuallySet(true);
              setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0));
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-emerald-400 font-mono text-right font-bold focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Payment Method (Col-Span 2) */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => {
              const method = e.target.value as any;
              setPaymentMethod(method);
              if (method === "CREDIT") {
                setPaidAmount(0);
                setIsPaidManuallySet(true);
              } else if (paidAmount === 0) {
                setPaidAmount(netPayable);
              }
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="CASH">Cash Settlement</option>
            <option value="FONEPAY">FonePay QR</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CREDIT">📒 100% Credit (Khata)</option>
          </select>
        </div>

        {/* SAVE BUTTON (COL-SPAN 2) */}
        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={handleSavePurchase}
            className="w-full h-8 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Save Purchase</span>
          </button>
        </div>
      </div>

      {/* Inline Quick Totals Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-1.5 border-t border-zinc-800/80 font-medium">
        <div className="flex items-center gap-4">
          <span>
            Gross Subtotal: <strong className="font-mono text-zinc-200">{formatNPR(grossSubtotal)}</strong>
          </span>
          {(itemDiscountsTotal > 0 || overallDiscount > 0) && (
            <span>
              Total Discounts:{" "}
              <strong className="font-mono text-rose-400">
                -{formatNPR(itemDiscountsTotal + overallDiscount)}
              </strong>
            </span>
          )}
          <span>
            Net Payable: <strong className="font-mono text-amber-400 font-bold">{formatNPR(netPayable)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Paid: <strong className="font-mono text-emerald-400">{formatNPR(paidAmount)}</strong>
          </span>
          {dueCreditAmount > 0 && (
            <span className="text-amber-400 font-bold">
              Khata Credit Due: <span className="font-mono">{formatNPR(dueCreditAmount)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
