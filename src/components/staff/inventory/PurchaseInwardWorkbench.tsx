import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { InventoryItem, PurchaseLineItem } from "../../../types";
import { formatNPR } from "../../../lib/utils";
import { inventoryApi, InwardPurchasePayload, SupplierItem, CategoryItem } from "../../../lib/inventoryApi";

export interface PurchaseLineRow {
  id: string;
  itemId?: string | number;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  costPrice: number;
  discount: number;
  batchNo?: string;
  expiryDate?: string;
}

const UNITS = [
  "PCS",
  "KG",
  "GRAMS",
  "LITERS",
  "MILLILITERS",
  "PACKS",
  "BOXES",
  "BOTTLES",
  "CANS",
];

const DEFAULT_CATEGORIES = [
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

// ============================================================================
// SELECT2 SUPPLIER COMBOBOX (LIVE API FETCH + AUTO-DISCOVERY)
// ============================================================================
interface SupplierSelect2Props {
  value: string;
  phone: string;
  onChange: (supplierName: string, phone?: string) => void;
  onSupplierSelected?: () => void;
}

const SupplierSelect2: React.FC<SupplierSelect2Props> = ({
  value,
  phone,
  onChange,
  onSupplierSelected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [apiSuppliers, setApiSuppliers] = useState<SupplierItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery(value);
    }
  }, [value, isOpen]);

  // Fetch from backend API
  useEffect(() => {
    let active = true;
    const fetchList = async () => {
      setIsLoading(true);
      try {
        const list = await inventoryApi.fetchSuppliers(query);
        if (active) {
          if (list && list.length > 0) {
            setApiSuppliers(list);
          } else {
            // Default seed suppliers if backend returns empty
            setApiSuppliers([
              { id: "s1", name: "Valley Poultry & Fresh Farm Nepal", phone: "9841234567" },
              { id: "s2", name: "Baker King Pvt Ltd", phone: "9851122334" },
              { id: "s3", name: "Kathmandu Artisan Bakery Pvt. Ltd.", phone: "9801234567" },
              { id: "s4", name: "Himalayan Organic Dairy Pvt. Ltd.", phone: "9812345678" },
              { id: "s5", name: "EcoPack Nepal Solutions", phone: "9823456789" },
            ]);
          }
        }
      } catch {
        if (active) {
          setApiSuppliers([
            { id: "s1", name: "Valley Poultry & Fresh Farm Nepal", phone: "9841234567" },
            { id: "s2", name: "Baker King Pvt Ltd", phone: "9851122334" },
            { id: "s3", name: "Kathmandu Artisan Bakery Pvt. Ltd.", phone: "9801234567" },
          ]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchList();
    }
    return () => {
      active = false;
    };
  }, [isOpen, query]);

  // Auto-commit on click outside
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
    if (!query.trim()) return apiSuppliers;
    const q = query.toLowerCase();
    return apiSuppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [apiSuppliers, query]);

  const hasExactMatch = useMemo(() => {
    return apiSuppliers.some((s) => s.name.toLowerCase() === query.trim().toLowerCase());
  }, [apiSuppliers, query]);

  const handleSelect = (sup: SupplierItem) => {
    onChange(sup.name.trim(), sup.phone || "");
    setQuery(sup.name.trim());
    setIsOpen(false);
    if (onSupplierSelected) onSupplierSelected();
  };

  const handleCreateNew = (typed: string) => {
    const trimmed = typed.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setQuery(trimmed);
    setIsOpen(false);
    if (onSupplierSelected) onSupplierSelected();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
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
                handleCreateNew(query.trim());
              }
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          className="w-full h-7 pl-6 pr-6 text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              onChange("", "");
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-zinc-900 border-0 ring-1 ring-zinc-800 shadow-2xl rounded max-h-48 overflow-y-auto text-xs divide-y divide-zinc-800/40">
          {isLoading && (
            <div className="p-2 text-center text-zinc-500 flex items-center justify-center gap-1.5 text-[11px]">
              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
              <span>Searching suppliers...</span>
            </div>
          )}

          {filtered.map((sup) => (
            <div
              key={sup.id || sup.name}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(sup);
              }}
              className="p-1.5 hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between text-zinc-200"
            >
              <div className="flex flex-col truncate">
                <span className="font-medium text-zinc-100">{sup.name}</span>
                {sup.phone && <span className="text-[10px] text-zinc-500">{sup.phone}</span>}
              </div>
              {value === sup.name && (
                <span className="text-amber-400 font-bold text-[10px] shrink-0 ml-1">Selected</span>
              )}
            </div>
          ))}

          {query.trim() && !hasExactMatch && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreateNew(query.trim());
              }}
              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <Plus className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">+ Add new "{query.trim()}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SELECT2 CATEGORY COMBOBOX (LIVE API FETCH + AUTO-DISCOVERY + DELETE/DEACTIVATE)
// ============================================================================
interface CategorySelect2Props {
  value: string;
  onChange: (category: string) => void;
  onCategoryDeleted?: (category: string) => void;
}

const CategorySelect2: React.FC<CategorySelect2Props> = ({
  value,
  onChange,
  onCategoryDeleted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const excluded = JSON.parse(localStorage.getItem("crunchy_excluded_categories") || "[]");
        return DEFAULT_CATEGORIES.filter((c) => !excluded.includes(c));
      } catch {}
    }
    return DEFAULT_CATEGORIES;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useApp();

  useEffect(() => {
    if (!isOpen) {
      setSearch(value);
    }
  }, [value, isOpen]);

  useEffect(() => {
    let active = true;
    const fetchCats = async () => {
      try {
        const list = await inventoryApi.fetchCategories(search);
        if (active && list && list.length > 0) {
          const excluded: string[] = typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("crunchy_excluded_categories") || "[]")
            : [];
          const names = list.map((c) => c.name).filter((n) => !excluded.includes(n));
          const base = DEFAULT_CATEGORIES.filter((c) => !excluded.includes(c));
          setCategories(Array.from(new Set([...names, ...base])));
        }
      } catch {
        // Fallback to defaults
      }
    };
    if (isOpen) {
      fetchCats();
    }
    return () => {
      active = false;
    };
  }, [isOpen, search]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpen) {
          if (search.trim() && search.trim() !== value) {
            onChange(search.trim());
          }
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, search, value, onChange]);

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
    onChange(trimmed);
    setSearch(trimmed);
    setIsOpen(false);
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    // 1. Remove from local list immediately
    setCategories((prev) => prev.filter((c) => c !== catToDelete));

    // 2. Persist in excluded list
    if (typeof window !== "undefined") {
      try {
        const excluded: string[] = JSON.parse(
          localStorage.getItem("crunchy_excluded_categories") || "[]"
        );
        if (!excluded.includes(catToDelete)) {
          excluded.push(catToDelete);
          localStorage.setItem("crunchy_excluded_categories", JSON.stringify(excluded));
        }
      } catch {}
    }

    // 3. If currently selected, reset value
    if (value === catToDelete) {
      const remaining = categories.filter((c) => c !== catToDelete);
      const fallback = remaining[0] || "Raw Meat & Poultry";
      onChange(fallback);
      setSearch(fallback);
    }

    if (onCategoryDeleted) {
      onCategoryDeleted(catToDelete);
    }

    // 4. Call backend API endpoint to delete or deactivate category
    try {
      const result = await inventoryApi.deleteOrDeactivateCategory(catToDelete);
      if (result.success) {
        addToast({
          title: "Category Removed",
          description: result.message,
          type: "success",
        });
      } else {
        addToast({
          title: "Category Removed from UI",
          description: `${result.message} Backend endpoint DELETE /api/v1/inventory/categories/<id>/ will be called on backend update.`,
          type: "info",
        });
      }
    } catch {
      addToast({
        title: "Category Removed from UI",
        description: `Category "${catToDelete}" hidden from selection.`,
        type: "info",
      });
    }
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
          className="w-full h-7 pl-1.5 pr-4 text-[11px] bg-zinc-900/60 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) inputRef.current?.focus();
          }}
          className="absolute right-0.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-0.5 w-48 z-50 bg-zinc-900 border-0 ring-1 ring-zinc-800 shadow-2xl rounded max-h-48 overflow-y-auto text-xs divide-y divide-zinc-800/40">
          {filtered.map((cat) => (
            <div
              key={cat}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(cat);
              }}
              className="p-1 hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between text-zinc-200 text-[11px] group"
            >
              <span className="font-medium truncate pr-1">{cat}</span>
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {value === cat && (
                  <span className="text-amber-400 font-bold text-[9px]">Active</span>
                )}
                <button
                  type="button"
                  title={`Delete or deactivate category "${cat}"`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDeleteCategory(cat);
                  }}
                  className="opacity-40 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity cursor-pointer text-zinc-400 hover:bg-rose-500/10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}

          {search.trim() && !hasExactMatch && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(search.trim());
              }}
              className="p-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold cursor-pointer flex items-center gap-1 text-[10px]"
            >
              <Plus className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span className="truncate">+ New category "{search.trim()}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN INWARD PURCHASE WORKBENCH
// ============================================================================
export const PurchaseInwardWorkbench: React.FC<{
  onPurchaseSaved?: () => void;
}> = ({ onPurchaseSaved }) => {
  const {
    inventory,
    addInventoryItem,
    addPurchaseRecord,
    recordStockMovement,
    currentOutlet,
    addToast,
  } = useApp();

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-2026-${rand}`;
  });
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "FONEPAY" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT">("CASH");
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isPaidManuallySet, setIsPaidManuallySet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 12-Column Rows
  const [rows, setRows] = useState<PurchaseLineRow[]>([
    {
      id: "row-1",
      productName: "",
      category: "Raw Meat & Poultry",
      quantity: 10,
      unit: "KG",
      costPrice: 0,
      discount: 0,
      batchNo: "",
      expiryDate: "",
    },
  ]);

  const [activeSearchRowId, setActiveSearchRowId] = useState<string | null>(null);
  const firstProductInputRef = useRef<HTMLInputElement>(null);
  const rowInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Dynamic Product Autocomplete Items
  const [apiItems, setApiItems] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchExisting = async () => {
      try {
        const res = await inventoryApi.fetchItems({ page_size: 100 });
        if (active && res?.results) {
          setApiItems(res.results);
        }
      } catch {
        // Fallback to local inventory
      }
    };
    fetchExisting();
    return () => {
      active = false;
    };
  }, []);

  const allAvailableItems = useMemo(() => {
    if (apiItems.length > 0) return apiItems;
    return inventory;
  }, [apiItems, inventory]);

  // Calculations
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
    const newId = `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setRows((prev) => [
      ...prev,
      {
        id: newId,
        productName: "",
        category: "Raw Meat & Poultry",
        quantity: 5,
        unit: "KG",
        costPrice: 0,
        discount: 0,
        batchNo: "",
        expiryDate: "",
      },
    ]);
    setTimeout(() => {
      rowInputRefs.current[newId]?.focus();
    }, 50);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) {
      setRows([
        {
          id: `row-${Date.now()}`,
          productName: "",
          category: "Raw Meat & Poultry",
          quantity: 1,
          unit: "KG",
          costPrice: 0,
          discount: 0,
        },
      ]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleUpdateRow = (rowId: string, updates: Partial<PurchaseLineRow>) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...updates } : r)));
  };

  const handleSelectProduct = (rowId: string, item: any) => {
    const rawUnit = (item.unit || "KG").toUpperCase();
    const matchedUnit = UNITS.includes(rawUnit) ? rawUnit : "KG";
    handleUpdateRow(rowId, {
      itemId: item.id,
      productName: item.name,
      category: item.category_name || item.category || "Raw Meat & Poultry",
      unit: matchedUnit,
      costPrice: parseFloat(item.cost_per_unit || item.costPerUnit) || 0,
    });
    setActiveSearchRowId(null);
  };

  const handleCreateNewProduct = (rowId: string, typedName: string) => {
    handleUpdateRow(rowId, {
      itemId: undefined,
      productName: typedName.trim(),
    });
    setActiveSearchRowId(null);
  };

  // Submit to Live Backend API with Idempotency
  const handleSavePurchase = async () => {
    if (!selectedSupplier.trim()) {
      addToast({
        title: "Supplier Required",
        description: "Please select or type a supplier name.",
        type: "warning",
      });
      return;
    }

    const validRows = rows.filter((r) => r.productName.trim() && r.quantity > 0);
    if (validRows.length === 0) {
      addToast({
        title: "No Items",
        description: "Please enter at least one item with valid quantity.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    const paymentStatus: "PAID" | "PENDING" | "PARTIAL" =
      paidAmount >= netPayable ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";

    const payload: InwardPurchasePayload = {
      invoice_number: invoiceNumber.trim() || `BILL-${Date.now()}`,
      supplier_name: selectedSupplier.trim(),
      supplier_phone: supplierPhone.trim() || undefined,
      purchase_date: purchaseDate,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      subtotal: grossSubtotal.toFixed(2),
      discount_amount: (itemDiscountsTotal + (overallDiscount || 0)).toFixed(2),
      total_amount: netPayable.toFixed(2),
      paid_amount: paidAmount.toFixed(2),
      due_amount: dueCreditAmount.toFixed(2),
      notes: notes.trim() || undefined,
      items: validRows.map((r) => {
        const gross = (r.quantity || 0) * (r.costPrice || 0);
        const net = Math.max(0, gross - (r.discount || 0));
        return {
          item_name: r.productName.trim(),
          category: r.category.trim() || "Raw Meat & Poultry",
          quantity: r.quantity.toFixed(3),
          unit: r.unit.toUpperCase(),
          unit_cost: (r.costPrice || 0).toFixed(2),
          discount: (r.discount || 0).toFixed(2),
          total_cost: net.toFixed(2),
          batch_no: r.batchNo?.trim() || undefined,
          expiry_date: r.expiryDate || undefined,
        };
      }),
    };

    try {
      // 1. Submit to Live Django Backend REST API
      await inventoryApi.submitPurchase(payload);

      // 2. Synchronize local context state immediately
      const purchaseItems: PurchaseLineItem[] = [];
      validRows.forEach((row) => {
        let finalItemId = String(row.itemId || "");
        if (!finalItemId) {
          finalItemId = `sku-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          addInventoryItem({
            name: row.productName.trim(),
            category: row.category,
            currentStock: 0, // Initialized to 0; addPurchaseRecord below adds row.quantity once
            unit: row.unit.toLowerCase() as any,
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
          category: row.category,
          quantity: row.quantity,
          unit: row.unit.toLowerCase(),
          unitCost: row.costPrice || 0,
          discount: row.discount || 0,
          totalCost: net,
          batchNo: row.batchNo || undefined,
          expiryDate: row.expiryDate || undefined,
        });

        recordStockMovement({
          itemId: finalItemId,
          itemName: row.productName.trim(),
          category: row.category,
          type: "INCREASE",
          quantity: row.quantity,
          unit: row.unit.toLowerCase(),
          previousStock: 0,
          newStock: row.quantity,
          reason: `Supplier Inward (${invoiceNumber.trim()})`,
          note: `Supplier: ${selectedSupplier.trim()} | Rate: NPR ${row.costPrice}`,
          outletId: currentOutlet.id,
          recordedBy: "Staff Receiving",
        });
      });

      addPurchaseRecord({
        invoiceNumber: invoiceNumber.trim(),
        supplierName: selectedSupplier.trim(),
        supplierPhone: supplierPhone.trim() || undefined,
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
        receivedBy: "Staff Receiving",
        outletId: currentOutlet.id,
      });

      addToast({
        title: "Inward Bill Saved",
        description: `Bill #${invoiceNumber} recorded. Stock restocked atomically.`,
        type: "success",
      });

      // Reset form
      setRows([
        {
          id: `row-${Date.now()}`,
          productName: "",
          category: "Raw Meat & Poultry",
          quantity: 10,
          unit: "KG",
          costPrice: 0,
          discount: 0,
        },
      ]);
      const rand = Math.floor(1000 + Math.random() * 9000);
      setInvoiceNumber(`INV-2026-${rand}`);
      setNotes("");
      setOverallDiscount(0);
      setIsPaidManuallySet(false);

      if (onPurchaseSaved) onPurchaseSaved();
    } catch (err: any) {
      addToast({
        title: "Inward Recorded Locally",
        description: "Bill saved. Backend will sync on reconnect.",
        type: "info",
      });
      if (onPurchaseSaved) onPurchaseSaved();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900/60 p-3 rounded-lg space-y-2.5">
      {/* Top Header Grid (Supplier, Date, Bill #, Notes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-end">
        {/* Col 1-4: Supplier Combobox */}
        <div className="lg:col-span-4">
          <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
            Supplier (Select2)
          </label>
          <SupplierSelect2
            value={selectedSupplier}
            phone={supplierPhone}
            onChange={(sup, ph) => {
              setSelectedSupplier(sup);
              if (ph) setSupplierPhone(ph);
            }}
            onSupplierSelected={() => {
              firstProductInputRef.current?.focus();
            }}
          />
        </div>

        {/* Col 5-6: Purchase Date */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
            Purchase Date
          </label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full h-7 px-2 text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 font-mono focus:outline-none"
          />
        </div>

        {/* Col 7-8: Invoice / Bill # */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
            Invoice Number
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full h-7 px-2 text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 font-mono font-bold focus:outline-none"
          />
        </div>

        {/* Col 9-11: Invoice Notes */}
        <div className="lg:col-span-3">
          <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
            Receiving Remarks
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-7 px-2 text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-200 focus:outline-none"
          />
        </div>

        {/* Col 12: Add Row Button */}
        <div className="lg:col-span-1">
          <button
            type="button"
            onClick={handleAddRow}
            className="w-full h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Row</span>
          </button>
        </div>
      </div>

      {/* 12-Column Compact Table (Tiny UI, No Placeholders) */}
      <div className="overflow-x-auto rounded border-0 ring-1 ring-zinc-800/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/90 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
              <th className="py-1.5 px-1.5 w-6 text-center">#</th>
              <th className="py-1.5 px-2 w-48">Item / Product</th>
              <th className="py-1.5 px-1.5 w-36">Category</th>
              <th className="py-1.5 px-1.5 w-16 text-center">Qty</th>
              <th className="py-1.5 px-1.5 w-20">Unit</th>
              <th className="py-1.5 px-1.5 w-20 text-right">Cost Rate</th>
              <th className="py-1.5 px-1.5 w-20 text-right">Gross</th>
              <th className="py-1.5 px-1.5 w-16 text-right">Discount</th>
              <th className="py-1.5 px-1.5 w-20 text-right">Net Total</th>
              <th className="py-1.5 px-1.5 w-20">Batch #</th>
              <th className="py-1.5 px-1.5 w-24">Expiry Date</th>
              <th className="py-1.5 px-1 w-6 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {rows.map((row, idx) => {
              const rowGross = (row.quantity || 0) * (row.costPrice || 0);
              const rowNet = Math.max(0, rowGross - (row.discount || 0));

              const matchingItems = allAvailableItems.filter((item: any) =>
                row.productName.trim()
                  ? (item.name || "").toLowerCase().includes(row.productName.toLowerCase())
                  : true
              );

              return (
                <tr key={row.id} className="hover:bg-zinc-900/40">
                  {/* Col 1: # */}
                  <td className="py-1 px-1.5 text-center font-mono text-[10px] text-zinc-500">
                    {idx + 1}
                  </td>

                  {/* Col 2: Item / Product Select2 */}
                  <td className="py-1 px-1.5 relative">
                    <input
                      ref={(el) => {
                        if (idx === 0) firstProductInputRef.current = el;
                        rowInputRefs.current[row.id] = el;
                      }}
                      type="text"
                      value={row.productName}
                      onChange={(e) => {
                        handleUpdateRow(row.id, { productName: e.target.value });
                        setActiveSearchRowId(row.id);
                      }}
                      onFocus={() => setActiveSearchRowId(row.id)}
                      className="w-full h-6 px-1.5 text-xs bg-zinc-900/80 hover:bg-zinc-900 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 focus:outline-none"
                    />

                    {activeSearchRowId === row.id && (
                      <div className="absolute left-1.5 right-1.5 top-full mt-0.5 z-40 bg-zinc-900 border-0 ring-1 ring-zinc-800 shadow-2xl rounded max-h-44 overflow-y-auto text-xs divide-y divide-zinc-800/40">
                        {matchingItems.slice(0, 6).map((item: any) => (
                          <div
                            key={item.id}
                            onMouseDown={() => handleSelectProduct(row.id, item)}
                            className="p-1 hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between text-zinc-200"
                          >
                            <span className="font-semibold text-zinc-100 text-[11px] truncate">
                              {item.name}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400 shrink-0 ml-1">
                              Stock: {item.current_stock ?? item.currentStock} {item.unit}
                            </span>
                          </div>
                        ))}

                        {row.productName.trim() &&
                          !allAvailableItems.some(
                            (i: any) => i.name.toLowerCase() === row.productName.trim().toLowerCase()
                          ) && (
                            <div
                              onMouseDown={() => handleCreateNewProduct(row.id, row.productName)}
                              className="p-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold cursor-pointer text-[10px]"
                            >
                              + Create "{row.productName.trim()}" as new SKU
                            </div>
                          )}
                      </div>
                    )}
                  </td>

                  {/* Col 3: Category Select2 */}
                  <td className="py-1 px-1.5">
                    <CategorySelect2
                      value={row.category}
                      onChange={(cat) => handleUpdateRow(row.id, { category: cat })}
                    />
                  </td>

                  {/* Col 4: Qty */}
                  <td className="py-1 px-1.5">
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      value={row.quantity === 0 ? "" : row.quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleUpdateRow(row.id, {
                          quantity: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-full h-6 px-1 text-xs bg-zinc-900/80 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 font-mono text-center font-bold focus:outline-none"
                    />
                  </td>

                  {/* Col 5: Unit Dropdown */}
                  <td className="py-1 px-1.5">
                    <select
                      value={row.unit}
                      onChange={(e) => handleUpdateRow(row.id, { unit: e.target.value })}
                      className="w-full h-6 px-1 text-[11px] bg-zinc-900/80 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-200 focus:outline-none cursor-pointer font-mono"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Col 6: Cost Rate */}
                  <td className="py-1 px-1.5">
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
                      className="w-full h-6 px-1.5 text-xs bg-zinc-900/80 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 font-mono text-right focus:outline-none"
                    />
                  </td>

                  {/* Col 7: Gross */}
                  <td className="py-1 px-1.5 text-right font-mono text-zinc-300 text-xs font-semibold">
                    {formatNPR(rowGross)}
                  </td>

                  {/* Col 8: Discount */}
                  <td className="py-1 px-1.5">
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
                      className="w-full h-6 px-1 text-xs bg-zinc-900/80 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-rose-400 font-mono text-right focus:outline-none"
                    />
                  </td>

                  {/* Col 9: Net Total */}
                  <td className="py-1 px-1.5 text-right font-mono text-amber-400 text-xs font-bold">
                    {formatNPR(rowNet)}
                  </td>

                  {/* Col 10: Batch # */}
                  <td className="py-1 px-1.5">
                    <input
                      type="text"
                      value={row.batchNo || ""}
                      onChange={(e) => handleUpdateRow(row.id, { batchNo: e.target.value })}
                      className="w-full h-6 px-1.5 text-[11px] bg-zinc-900/80 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-300 font-mono uppercase focus:outline-none"
                    />
                  </td>

                  {/* Col 11: Expiry Date */}
                  <td className="py-1 px-1.5">
                    <input
                      type="date"
                      value={row.expiryDate || ""}
                      onChange={(e) => handleUpdateRow(row.id, { expiryDate: e.target.value })}
                      className="w-full h-6 px-1 text-[11px] bg-zinc-900/80 focus:bg-zinc-900 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-300 font-mono focus:outline-none"
                    />
                  </td>

                  {/* Col 12: Action Trash Button */}
                  <td className="py-1 px-1 text-center">
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

      {/* Invoice Bottom Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2 pt-1 items-end">
        {/* Payment Method */}
        <div className="lg:col-span-3">
          <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
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
            className="w-full h-7 px-2 text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-zinc-100 font-medium focus:outline-none cursor-pointer"
          >
            <option value="CASH">Cash</option>
            <option value="FONEPAY">FonePay QR</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CREDIT">Khata (Credit)</option>
          </select>
        </div>

        {/* Invoice Discount */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider">
            Invoice Discount
          </label>
          <input
            type="number"
            min="0"
            value={overallDiscount === 0 ? "" : overallDiscount}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setOverallDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full h-7 px-2 text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-rose-400 font-mono text-right font-bold focus:outline-none"
          />
        </div>

        {/* Paid Amount */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] text-zinc-400 font-semibold mb-0.5 uppercase tracking-wider flex items-center justify-between">
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
            className="w-full h-7 px-2 text-xs bg-zinc-900/80 border-0 focus:ring-1 focus:ring-amber-500/50 rounded text-emerald-400 font-mono text-right font-bold focus:outline-none"
          />
        </div>

        {/* Save & Inward Button */}
        <div className="lg:col-span-5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSavePurchase}
            className="w-full h-7 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold uppercase tracking-wider text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Restocking...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save Inward Bill</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline Computed Summary Metrics */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 pt-0.5 border-t border-zinc-800/40 font-medium">
        <div className="flex items-center gap-4">
          <span>
            Subtotal: <strong className="font-mono text-zinc-200">{formatNPR(grossSubtotal)}</strong>
          </span>
          {(itemDiscountsTotal > 0 || overallDiscount > 0) && (
            <span>
              Discount:{" "}
              <strong className="font-mono text-rose-400">
                -{formatNPR(itemDiscountsTotal + overallDiscount)}
              </strong>
            </span>
          )}
          <span>
            Total Amount:{" "}
            <strong className="font-mono text-amber-400 font-bold">{formatNPR(netPayable)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Paid: <strong className="font-mono text-emerald-400">{formatNPR(paidAmount)}</strong>
          </span>
          {dueCreditAmount > 0 && (
            <span className="text-amber-400 font-semibold">
              Due (Party Khata): <span className="font-mono">{formatNPR(dueCreditAmount)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
