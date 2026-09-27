import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Truck,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Search,
  X,
  FileText,
  Upload,
  ChevronDown,
  Layers,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { InventoryItem, InventoryCategory, PurchaseLineItem } from "../../../types";
import { formatNPR } from "../../../lib/utils";

export interface ExcelRowItem {
  id: string;
  itemId?: string;
  isNewProduct: boolean;
  productName: string;
  category: string;
  quantity: number;
  unit: InventoryItem["unit"];
  costPrice: number;
  discount: number;
  batchNo?: string;
  expiryDate?: string;
}

const DEFAULT_CATEGORIES: string[] = [
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

// ============================================================================
// SELECT2 SEARCHABLE CATEGORY COMBOBOX COMPONENT
// ============================================================================
interface CategorySelect2Props {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
  onRegisterNewCategory: (newCat: string) => void;
}

const CategorySelect2: React.FC<CategorySelect2Props> = ({
  value,
  onChange,
  categories,
  onRegisterNewCategory,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal search with external value when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearch(value);
    }
  }, [value, isOpen]);

  // Click outside to close and auto-commit typed category if any
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpen) {
          if (search.trim() && search.trim() !== value) {
            onRegisterNewCategory(search.trim());
            onChange(search.trim());
          }
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, search, value, onChange, onRegisterNewCategory]);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, search]);

  const hasExactMatch = useMemo(() => {
    return categories.some((c) => c.toLowerCase() === search.trim().toLowerCase());
  }, [categories, search]);

  const handleSelect = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    onRegisterNewCategory(trimmed);
    onChange(trimmed);
    setSearch(trimmed);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setSearch(value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length > 0) {
                handleSelect(filtered[0]);
              } else if (search.trim()) {
                handleSelect(search.trim());
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder="Category..."
          className="w-full h-7 pl-2 pr-5 text-xs bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) inputRef.current?.focus();
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-52 z-40 bg-zinc-900 border-0 ring-1 ring-zinc-800 shadow-2xl rounded-lg max-h-52 overflow-y-auto text-xs divide-y divide-zinc-800/40">
          {filtered.map((cat) => (
            <div
              key={cat}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(cat);
              }}
              className="p-1.5 hover:bg-zinc-800/70 cursor-pointer flex items-center justify-between text-zinc-200"
            >
              <span className="font-medium truncate">{cat}</span>
              {value === cat && (
                <span className="text-amber-400 font-bold text-[10px] ml-1">Active</span>
              )}
            </div>
          ))}

          {/* If typed search query does not match any existing category, auto-take as new */}
          {search.trim() && !hasExactMatch && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(search.trim());
              }}
              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <Plus className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">+ New category "{search.trim()}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SELECT2 SEARCHABLE SUPPLIER COMBOBOX COMPONENT
// ============================================================================
interface SupplierSelect2Props {
  value: string;
  onChange: (supplier: string) => void;
  suppliers: string[];
  onSupplierSelected?: () => void;
}

const SupplierSelect2: React.FC<SupplierSelect2Props> = ({
  value,
  onChange,
  suppliers,
  onSupplierSelected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery(value);
    }
  }, [value, isOpen]);

  // Click outside commits typed supplier if non-empty
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpen) {
          if (query.trim() && query.trim() !== value) {
            onChange(query.trim());
          }
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, query, value, onChange]);

  const filtered = useMemo(() => {
    if (!query.trim()) return suppliers;
    const q = query.toLowerCase();
    return suppliers.filter((s) => s.toLowerCase().includes(q));
  }, [suppliers, query]);

  const hasExactMatch = useMemo(() => {
    return suppliers.some((s) => s.toLowerCase() === query.trim().toLowerCase());
  }, [suppliers, query]);

  const handleSelect = (supName: string) => {
    const trimmed = supName.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setQuery(trimmed);
    setIsOpen(false);
    if (onSupplierSelected) onSupplierSelected();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setQuery(value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length > 0) {
                handleSelect(filtered[0]);
              } else if (query.trim()) {
                handleSelect(query.trim());
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder="Search or enter supplier..."
          className="w-full h-8 pl-8 pr-7 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-zinc-900 border-0 ring-1 ring-zinc-800 shadow-2xl rounded-lg max-h-56 overflow-y-auto text-xs divide-y divide-zinc-800/40">
          {filtered.map((sup) => (
            <div
              key={sup}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(sup);
              }}
              className="p-2 hover:bg-zinc-800/60 cursor-pointer flex items-center justify-between text-zinc-200"
            >
              <span className="font-medium">{sup}</span>
              {value === sup && (
                <span className="text-amber-400 font-semibold text-[10px]">Selected</span>
              )}
            </div>
          ))}

          {/* Auto-take typed new supplier if not matching */}
          {query.trim() && !hasExactMatch && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(query.trim());
              }}
              className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Add new "{query.trim()}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN PURCHASE INWARD WORKBENCH
// ============================================================================
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

  // 1. SUPPLIER STATE (Select2 Search)
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const existingSuppliers = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i) => {
      if (i.supplierName && i.supplierName.trim()) set.add(i.supplierName.trim());
    });
    purchases.forEach((p) => {
      if (p.supplierName && p.supplierName.trim()) set.add(p.supplierName.trim());
    });
    if (set.size === 0) {
      set.add("Valley Poultry & Fresh Farm Nepal");
      set.add("Kathmandu Artisan Bakery Pvt. Ltd.");
      set.add("Himalayan Organic Dairy Pvt. Ltd.");
      set.add("EcoPack Nepal Solutions");
      set.add("Everest Spices & Seasoning");
    }
    return Array.from(set);
  }, [inventory, purchases]);

  // 2. CATEGORIES STATE (Select2 Search + Dynamic Addition)
  const [sessionCategories, setSessionCategories] = useState<string[]>([]);
  const allAvailableCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    inventory.forEach((i) => {
      if (i.category && i.category.trim()) set.add(i.category.trim());
    });
    sessionCategories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    return Array.from(set);
  }, [inventory, sessionCategories]);

  const handleRegisterNewCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!allAvailableCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setSessionCategories((prev) => [...prev, trimmed]);
    }
  };

  // 3. METADATA STATE
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
  const [notes, setNotes] = useState("");

  // 4. ROWS STATE
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

  const [activeSearchRowId, setActiveSearchRowId] = useState<string | null>(null);
  const firstProductInputRef = useRef<HTMLInputElement>(null);
  const rowInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // 5. FINANCIAL STATE
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "FONEPAY" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT"
  >("CASH");
  const [isPaidManuallySet, setIsPaidManuallySet] = useState(false);

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

  useEffect(() => {
    if (!isPaidManuallySet) {
      if (paymentMethod === "CREDIT") {
        setPaidAmount(0);
      } else {
        setPaidAmount(netPayable);
      }
    }
  }, [netPayable, paymentMethod, isPaidManuallySet]);

  const handleAddRow = () => {
    const newRowId = `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setRows((prev) => [
      ...prev,
      {
        id: newRowId,
        isNewProduct: false,
        productName: "",
        category: allAvailableCategories[0] || "Raw Meat & Poultry",
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

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) {
      setRows([
        {
          id: `row-${Date.now()}`,
          isNewProduct: false,
          productName: "",
          category: allAvailableCategories[0] || "Raw Meat & Poultry",
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

  const handleUpdateRow = (rowId: string, updates: Partial<ExcelRowItem>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r))
    );
  };

  const handleSelectProduct = (rowId: string, item: InventoryItem) => {
    handleUpdateRow(rowId, {
      itemId: item.id,
      isNewProduct: false,
      productName: item.name,
      category: item.category,
      unit: item.unit,
      costPrice: item.costPerUnit || 0,
    });
    handleRegisterNewCategory(item.category);
    setActiveSearchRowId(null);
  };

  const handleCreateNewProduct = (rowId: string, typedName: string) => {
    handleUpdateRow(rowId, {
      itemId: undefined,
      isNewProduct: true,
      productName: typedName.trim(),
    });
    setActiveSearchRowId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
      setUploadedDocument({
        name: file.name,
        size: sizeStr,
      });
      addToast({
        title: "Attached",
        description: file.name,
        type: "success",
      });
    }
  };

  const handleSavePurchase = () => {
    if (!selectedSupplier.trim()) {
      addToast({
        title: "Supplier Required",
        description: "Please enter or select a supplier via Select2 search.",
        type: "warning",
      });
      return;
    }

    const validRows = rows.filter((r) => r.productName.trim() && r.quantity > 0);
    if (validRows.length === 0) {
      addToast({
        title: "No Items",
        description: "Please enter at least one product with quantity.",
        type: "warning",
      });
      return;
    }

    const purchaseItems: PurchaseLineItem[] = [];

    validRows.forEach((row) => {
      let finalItemId = row.itemId;
      const finalCategory = row.category.trim() || "Raw Meat & Poultry";

      // Register category in session
      handleRegisterNewCategory(finalCategory);

      if (row.isNewProduct || !finalItemId) {
        finalItemId = `sku-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        addInventoryItem({
          name: row.productName.trim(),
          category: finalCategory,
          currentStock: row.quantity,
          unit: row.unit,
          minThreshold: 5,
          costPerUnit: row.costPrice || 0,
          supplierName: selectedSupplier.trim(),
          batchNo: row.batchNo || undefined,
          expiryDate: row.expiryDate || undefined,
          outletId: currentOutlet.id,
        });
      }

      const gross = (row.quantity || 0) * (row.costPrice || 0);
      const net = Math.max(0, gross - (row.discount || 0));

      purchaseItems.push({
        itemId: finalItemId,
        itemName: row.productName.trim(),
        category: finalCategory,
        quantity: row.quantity,
        unit: row.unit,
        unitCost: row.costPrice || 0,
        discount: row.discount || 0,
        totalCost: net,
        batchNo: row.batchNo || undefined,
        expiryDate: row.expiryDate || undefined,
      });

      recordStockMovement({
        itemId: finalItemId || `inv-temp`,
        itemName: row.productName.trim(),
        category: finalCategory,
        type: "INCREASE",
        quantity: row.quantity,
        unit: row.unit,
        previousStock: 0,
        newStock: row.quantity,
        reason: `Supplier Inward (${invoiceNumber.trim() || "PURCHASE"})`,
        note: `Supplier: ${selectedSupplier} | Rate: NPR ${row.costPrice}`,
        outletId: currentOutlet.id,
        recordedBy: "Staff Receiving",
      });
    });

    const paymentStatus: "PAID" | "PENDING" | "PARTIAL" =
      paidAmount >= netPayable ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";

    addPurchaseRecord({
      invoiceNumber: invoiceNumber.trim() || `INV-${Date.now()}`,
      supplierName: selectedSupplier.trim(),
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
      title: "Bill Saved & Restocked",
      description: `Inward #${invoiceNumber} for ${selectedSupplier.trim()} recorded.`,
      type: "success",
    });

    setRows([
      {
        id: `row-${Date.now()}`,
        isNewProduct: false,
        productName: "",
        category: allAvailableCategories[0] || "Raw Meat & Poultry",
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
    <div className="bg-zinc-900/40 p-4 rounded-xl space-y-4">
      {/* Module Title / Header */}
      <div className="flex items-center justify-between pb-1 border-b border-zinc-800/40">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
            Inward Purchase Bill Entry
          </h3>
        </div>
        <div className="text-[11px] text-zinc-500 font-mono">
          Auto-restocks inventory items below upon saving
        </div>
      </div>

      {/* Top Header Fields (Borderless, Clean 5-col layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        {/* Supplier (Select2 Searchable with Auto-Create) */}
        <div className="lg:col-span-4">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Supplier
          </label>
          <SupplierSelect2
            value={selectedSupplier}
            onChange={(sup) => setSelectedSupplier(sup)}
            suppliers={existingSuppliers}
            onSupplierSelected={() => {
              firstProductInputRef.current?.focus();
            }}
          />
        </div>

        {/* Date */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Date
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 font-mono focus:outline-none"
          />
        </div>

        {/* Bill # */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Bill #
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 font-mono uppercase font-semibold focus:outline-none"
          />
        </div>

        {/* Attach File */}
        <div className="lg:col-span-3">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Bill Attachment
          </label>
          {uploadedDocument ? (
            <div className="h-8 px-2.5 bg-zinc-900/70 rounded-lg flex items-center justify-between text-xs text-zinc-200">
              <span className="truncate max-w-[170px] text-amber-400 font-mono">
                {uploadedDocument.name}
              </span>
              <button
                type="button"
                onClick={() => setUploadedDocument(null)}
                className="text-zinc-500 hover:text-white p-0.5 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="h-8 px-2.5 bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg flex items-center justify-center gap-1.5 text-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>Attach File</span>
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Add Row Button */}
        <div className="lg:col-span-1">
          <button
            type="button"
            onClick={handleAddRow}
            className="w-full h-8 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Row</span>
          </button>
        </div>
      </div>

      {/* Borderless Product Rows Table */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/60 text-zinc-400 text-[11px] font-semibold">
              <th className="py-2.5 px-2.5 w-7 text-center">#</th>
              <th className="py-2.5 px-2.5 w-56">Item</th>
              <th className="py-2.5 px-2.5 w-40">Category</th>
              <th className="py-2.5 px-2.5 w-20 text-center">Qty</th>
              <th className="py-2.5 px-2.5 w-20">Unit</th>
              <th className="py-2.5 px-2.5 w-24 text-right">Cost</th>
              <th className="py-2.5 px-2.5 w-24 text-right">Gross</th>
              <th className="py-2.5 px-2.5 w-20 text-right">Discount</th>
              <th className="py-2.5 px-2.5 w-24 text-right">Total</th>
              <th className="py-2.5 px-2.5 w-24">Batch</th>
              <th className="py-2.5 px-2.5 w-28">Expiry</th>
              <th className="py-2.5 px-1 w-8 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {rows.map((row, idx) => {
              const rowGross = (row.quantity || 0) * (row.costPrice || 0);
              const rowNet = Math.max(0, rowGross - (row.discount || 0));

              const matchingInventoryItems = inventory.filter((inv) =>
                row.productName.trim()
                  ? inv.name.toLowerCase().includes(row.productName.toLowerCase())
                  : true
              );

              return (
                <tr key={row.id} className="hover:bg-zinc-900/30">
                  <td className="py-1.5 px-2.5 text-center font-mono text-[11px] text-zinc-500">
                    {idx + 1}
                  </td>

                  {/* Product Field (Select Search with Auto Create) */}
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
                      placeholder="Item name..."
                      className="w-full h-7 px-2 text-xs bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                    />

                    {activeSearchRowId === row.id && (
                      <div className="absolute left-2 right-2 top-full mt-1 z-30 bg-zinc-900 border-0 ring-1 ring-zinc-800 shadow-2xl rounded-lg max-h-48 overflow-y-auto text-xs divide-y divide-zinc-800/40">
                        {matchingInventoryItems.slice(0, 6).map((inv) => (
                          <div
                            key={inv.id}
                            onMouseDown={() => handleSelectProduct(row.id, inv)}
                            className="p-1.5 hover:bg-zinc-800/60 cursor-pointer flex items-center justify-between text-zinc-200"
                          >
                            <span className="font-semibold text-zinc-100">{inv.name}</span>
                            <span className="font-mono text-[10px] text-zinc-400">
                              Stock: {inv.currentStock} {inv.unit}
                            </span>
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
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold cursor-pointer text-[11px]"
                            >
                              + Create "{row.productName.trim()}" as new SKU
                            </div>
                          )}
                      </div>
                    )}
                  </td>

                  {/* Category Field (Select2 Searchable with Auto-Create) */}
                  <td className="py-1.5 px-2">
                    <CategorySelect2
                      value={row.category}
                      onChange={(cat) => handleUpdateRow(row.id, { category: cat })}
                      categories={allAvailableCategories}
                      onRegisterNewCategory={handleRegisterNewCategory}
                    />
                  </td>

                  {/* Quantity */}
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
                      className="w-full h-7 px-1 text-xs bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 font-mono text-center font-bold focus:outline-none"
                    />
                  </td>

                  {/* Unit */}
                  <td className="py-1.5 px-2">
                    <select
                      value={row.unit}
                      onChange={(e) =>
                        handleUpdateRow(row.id, {
                          unit: e.target.value as any,
                        })
                      }
                      className="w-full h-7 px-1 text-xs bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-200 focus:outline-none cursor-pointer font-mono"
                    >
                      {DEFAULT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Cost */}
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
                      className="w-full h-7 px-2 text-xs bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 font-mono text-right focus:outline-none"
                    />
                  </td>

                  {/* Gross */}
                  <td className="py-1.5 px-2 text-right font-mono text-zinc-300 text-xs font-semibold">
                    {formatNPR(rowGross)}
                  </td>

                  {/* Discount */}
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
                      className="w-full h-7 px-1.5 text-xs bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-rose-400 font-mono text-right focus:outline-none"
                    />
                  </td>

                  {/* Net Total */}
                  <td className="py-1.5 px-2 text-right font-mono text-amber-400 text-xs font-bold">
                    {formatNPR(rowNet)}
                  </td>

                  {/* Batch */}
                  <td className="py-1.5 px-2">
                    <input
                      type="text"
                      value={row.batchNo || ""}
                      placeholder="Batch #"
                      onChange={(e) =>
                        handleUpdateRow(row.id, { batchNo: e.target.value })
                      }
                      className="w-full h-7 px-1.5 text-xs bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-300 placeholder:text-zinc-600 font-mono uppercase focus:outline-none"
                    />
                  </td>

                  {/* Expiry */}
                  <td className="py-1.5 px-2">
                    <input
                      type="date"
                      value={row.expiryDate || ""}
                      onChange={(e) =>
                        handleUpdateRow(row.id, { expiryDate: e.target.value })
                      }
                      className="w-full h-7 px-1 text-xs bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-300 font-mono focus:outline-none"
                    />
                  </td>

                  {/* Delete */}
                  <td className="py-1.5 px-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
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

      {/* Settlement Row (Borderless, Clean 5-col layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 pt-1 items-end">
        {/* Notes */}
        <div className="lg:col-span-4">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Notes
          </label>
          <input
            type="text"
            value={notes}
            placeholder="Receiving remarks..."
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
          />
        </div>

        {/* Overall Discount */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Overall Discount
          </label>
          <input
            type="number"
            min="0"
            value={overallDiscount === 0 ? "" : overallDiscount}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              setOverallDiscount(Math.max(0, parseFloat(e.target.value) || 0))
            }
            className="w-full h-8 px-2 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-rose-400 font-mono text-right font-bold focus:outline-none"
          />
        </div>

        {/* Paid Amount */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1 flex items-center justify-between">
            <span>Paid Amount</span>
            {dueCreditAmount > 0 && (
              <span className="text-amber-400 font-mono text-[10px]">
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
            className="w-full h-8 px-2 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-emerald-400 font-mono text-right font-bold focus:outline-none"
          />
        </div>

        {/* Payment Method */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
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
            className="w-full h-8 px-2 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 font-medium focus:outline-none cursor-pointer"
          >
            <option value="CASH">Cash</option>
            <option value="FONEPAY">FonePay QR</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CREDIT">Khata (Credit)</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={handleSavePurchase}
            className="w-full h-8 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Save Bill</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-1 font-medium">
        <div className="flex items-center gap-4">
          <span>
            Subtotal: <strong className="font-mono text-zinc-200">{formatNPR(grossSubtotal)}</strong>
          </span>
          {(itemDiscountsTotal > 0 || overallDiscount > 0) && (
            <span>
              Discounts:{" "}
              <strong className="font-mono text-rose-400">
                -{formatNPR(itemDiscountsTotal + overallDiscount)}
              </strong>
            </span>
          )}
          <span>
            Net: <strong className="font-mono text-amber-400 font-bold">{formatNPR(netPayable)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Paid: <strong className="font-mono text-emerald-400">{formatNPR(paidAmount)}</strong>
          </span>
          {dueCreditAmount > 0 && (
            <span className="text-amber-400 font-semibold">
              Credit Due: <span className="font-mono">{formatNPR(dueCreditAmount)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
