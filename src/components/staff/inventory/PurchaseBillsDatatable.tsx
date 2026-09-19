import React, { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Printer,
  ChevronDown,
  ChevronUp,
  Calendar,
  Truck,
  DollarSign,
  Package,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Paperclip,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { PurchaseRecord } from "../../../types";
import { formatNPR } from "../../../lib/utils";
import { PrintablePurchaseBillModal } from "./PrintablePurchaseBillModal";

export const PurchaseBillsDatatable: React.FC = () => {
  const { purchases, currentOutlet } = useApp();

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "PENDING" | "CREDIT">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Expanded Row IDs (for nested item grouping)
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});

  // Printable Modal State
  const [activePrintModal, setActivePrintModal] = useState<{
    purchase: PurchaseRecord;
    mode: "BILL" | "SUPPLIER_STATEMENT";
  } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Suppliers list for filter
  const suppliers = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.supplierName) set.add(p.supplierName);
    });
    return Array.from(set);
  }, [purchases]);

  // Toggle row expansion
  const toggleRowExpansion = (purchaseId: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [purchaseId]: !prev[purchaseId],
    }));
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (selectedSupplier !== "ALL" && p.supplierName !== selectedSupplier) return false;

      if (paymentFilter === "PAID" && p.paymentStatus !== "PAID") return false;
      if (paymentFilter === "PENDING" && p.paymentStatus !== "PENDING" && p.paymentStatus !== "PARTIAL")
        return false;
      if (paymentFilter === "CREDIT") {
        const hasDue = (p.dueAmount && p.dueAmount > 0) || p.paymentMethod === "CREDIT";
        if (!hasDue) return false;
      }

      if (startDate && p.purchaseDate < startDate) return false;
      if (endDate && p.purchaseDate > endDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInvoice = p.invoiceNumber.toLowerCase().includes(q);
        const matchesSupplier = p.supplierName.toLowerCase().includes(q);
        const matchesItems = p.items.some((it) => it.itemName.toLowerCase().includes(q));
        return matchesInvoice || matchesSupplier || matchesItems;
      }
      return true;
    });
  }, [purchases, selectedSupplier, paymentFilter, startDate, endDate, searchQuery]);

  // Aggregated Totals
  const datatableStats = useMemo(() => {
    let grossTotal = 0;
    let discountTotal = 0;
    let netTotal = 0;
    let paidTotal = 0;
    let creditDueTotal = 0;
    let totalLineItems = 0;

    filteredPurchases.forEach((p) => {
      const g = p.subtotal || p.items.reduce((s, it) => s + it.quantity * it.unitCost, 0);
      const d = p.discountAmount || p.items.reduce((s, it) => s + (it.discount || 0), 0);
      const net = p.totalAmount;
      const paid = p.paidAmount !== undefined ? p.paidAmount : (p.paymentStatus === "PAID" ? net : 0);
      const due = p.dueAmount !== undefined ? p.dueAmount : Math.max(0, net - paid);

      grossTotal += g;
      discountTotal += d;
      netTotal += net;
      paidTotal += paid;
      creditDueTotal += due;
      totalLineItems += p.items.length;
    });

    return {
      billCount: filteredPurchases.length,
      grossTotal,
      discountTotal,
      netTotal,
      paidTotal,
      creditDueTotal,
      totalLineItems,
    };
  }, [filteredPurchases]);

  // Paginated Purchases
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize));
  const paginatedPurchases = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredPurchases.slice(startIdx, startIdx + pageSize);
  }, [filteredPurchases, currentPage, pageSize]);

  return (
    <div className="bg-[#141417] border border-zinc-800 p-3 shadow-sm space-y-3">
      {/* -------------------------------------------------------------
          TOP FILTER BAR (DATE, SUPPLIER, PAYMENT, SEARCH)
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 pb-2.5 border-b border-zinc-800 items-end">
        {/* Start Date */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* End Date */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Supplier Filter */}
        <div className="lg:col-span-3">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Filter Supplier
          </label>
          <select
            value={selectedSupplier}
            onChange={(e) => {
              setSelectedSupplier(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Suppliers ({suppliers.length})</option>
            {suppliers.map((sup) => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Filter */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Payment Status
          </label>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Settled Paid</option>
            <option value="PENDING">Pending / Partial</option>
            <option value="CREDIT">📒 Credit Due (Khata)</option>
          </select>
        </div>

        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Search Invoices
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
              placeholder="Invoice #, item, vendor..."
              className="w-full h-8 pl-7 pr-6 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
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

        {/* Page Size */}
        <div className="lg:col-span-1">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
            Page
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full h-8 px-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 focus:outline-none cursor-pointer text-center"
          >
            <option value={10}>10/p</option>
            <option value={20}>20/p</option>
            <option value={50}>50/p</option>
          </select>
        </div>
      </div>

      {/* -------------------------------------------------------------
          CLEAN INLINE TEXT SUMMARY OF BILLS (NO BULKY BOX CARDS)
      ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 py-1 font-medium overflow-x-auto no-scrollbar">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Invoices:</span>
          <strong className="font-mono text-zinc-100 font-bold">{datatableStats.billCount}</strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Items Received:</span>
          <strong className="font-mono text-zinc-200 font-bold">{datatableStats.totalLineItems}</strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Gross:</span>
          <strong className="font-mono text-zinc-200 font-bold">{formatNPR(datatableStats.grossTotal)}</strong>
        </span>

        {datatableStats.discountTotal > 0 && (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Discounts:</span>
            <strong className="font-mono text-rose-400 font-bold">-{formatNPR(datatableStats.discountTotal)}</strong>
          </span>
        )}

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Net Purchases:</span>
          <strong className="font-mono text-amber-400 font-bold">{formatNPR(datatableStats.netTotal)}</strong>
        </span>

        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500">Paid:</span>
          <strong className="font-mono text-emerald-400 font-bold">{formatNPR(datatableStats.paidTotal)}</strong>
        </span>

        {datatableStats.creditDueTotal > 0 && (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-amber-400">Khata Credit Due:</span>
            <strong className="font-mono text-amber-400 font-bold">{formatNPR(datatableStats.creditDueTotal)}</strong>
          </span>
        )}
      </div>

      {/* -------------------------------------------------------------
          PURCHASES DATATABLE (WITH EXPANDABLE NESTED ITEM LIST)
      ------------------------------------------------------------- */}
      <div className="overflow-x-auto border border-zinc-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-2.5 px-2 w-8 text-center"></th>
              <th className="py-2.5 px-2.5">Date</th>
              <th className="py-2.5 px-2.5">Invoice #</th>
              <th className="py-2.5 px-3">Supplier Name</th>
              <th className="py-2.5 px-2 text-center">Items</th>
              <th className="py-2.5 px-2.5 text-right">Gross</th>
              <th className="py-2.5 px-2 text-right">Discount</th>
              <th className="py-2.5 px-2.5 text-right">Net Total</th>
              <th className="py-2.5 px-2.5 text-right">Paid</th>
              <th className="py-2.5 px-2.5 text-right">Due (Credit)</th>
              <th className="py-2.5 px-2.5 text-center">Method / Status</th>
              <th className="py-2.5 px-3 text-right">Print Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-[#141417]">
            {paginatedPurchases.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-zinc-500 text-xs">
                  No purchase bills match your current filters.
                </td>
              </tr>
            ) : (
              paginatedPurchases.map((purchase) => {
                const isExpanded = Boolean(expandedRowIds[purchase.id]);
                const gross =
                  purchase.subtotal ??
                  purchase.items.reduce((s, it) => s + it.quantity * it.unitCost, 0);
                const discount =
                  purchase.discountAmount ??
                  purchase.items.reduce((s, it) => s + (it.discount || 0), 0);
                const paid =
                  purchase.paidAmount !== undefined
                    ? purchase.paidAmount
                    : purchase.paymentStatus === "PAID"
                    ? purchase.totalAmount
                    : 0;
                const due =
                  purchase.dueAmount !== undefined
                    ? purchase.dueAmount
                    : Math.max(0, purchase.totalAmount - paid);

                return (
                  <React.Fragment key={purchase.id}>
                    <tr className="hover:bg-zinc-900/50 transition-colors">
                      {/* Expand Chevron */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleRowExpansion(purchase.id)}
                          className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                          title={isExpanded ? "Collapse items" : "Expand item breakdown"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-2 px-2.5 font-mono text-[11px] text-zinc-300 whitespace-nowrap">
                        {purchase.purchaseDate}
                      </td>

                      {/* Invoice # */}
                      <td className="py-2 px-2.5 font-mono font-bold text-zinc-100 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{purchase.invoiceNumber}</span>
                          {purchase.documentName && (
                            <span
                              className="text-emerald-400 cursor-help"
                              title={`Attached doc: ${purchase.documentName}`}
                            >
                              <Paperclip className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Supplier Name */}
                      <td className="py-2 px-3 font-medium text-zinc-200">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{purchase.supplierName}</span>
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="py-2 px-2 text-center font-mono text-xs text-zinc-300">
                        {purchase.items.length}
                      </td>

                      {/* Gross */}
                      <td className="py-2 px-2.5 text-right font-mono text-zinc-300 text-xs">
                        {formatNPR(gross)}
                      </td>

                      {/* Discount */}
                      <td className="py-2 px-2 text-right font-mono text-xs text-zinc-400">
                        {discount > 0 ? (
                          <span className="text-rose-400">-{formatNPR(discount)}</span>
                        ) : (
                          "0"
                        )}
                      </td>

                      {/* Net Total */}
                      <td className="py-2 px-2.5 text-right font-mono font-black text-amber-400 text-xs">
                        {formatNPR(purchase.totalAmount)}
                      </td>

                      {/* Paid */}
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-400 text-xs">
                        {formatNPR(paid)}
                      </td>

                      {/* Due / Credit */}
                      <td className="py-2 px-2.5 text-right font-mono text-xs">
                        {due > 0 ? (
                          <span className="text-amber-400 font-bold">{formatNPR(due)}</span>
                        ) : (
                          <span className="text-zinc-500">0</span>
                        )}
                      </td>

                      {/* Payment Method & Status */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase border ${
                            purchase.paymentStatus === "PAID"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : purchase.paymentStatus === "PARTIAL"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {purchase.paymentMethod} • {purchase.paymentStatus}
                        </span>
                      </td>

                      {/* Print Actions */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Paper Purchase Bill Print */}
                          <button
                            type="button"
                            onClick={() =>
                              setActivePrintModal({
                                purchase,
                                mode: "BILL",
                              })
                            }
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Print Paper Purchase Bill Voucher"
                          >
                            <Printer className="w-3 h-3 text-amber-400" />
                            <span>Bill Print</span>
                          </button>

                          {/* Supplier Product Details Print */}
                          <button
                            type="button"
                            onClick={() =>
                              setActivePrintModal({
                                purchase,
                                mode: "SUPPLIER_STATEMENT",
                              })
                            }
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Print Supplier Product Details"
                          >
                            <FileText className="w-3 h-3 text-sky-400" />
                            <span>Supplier Items</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* NESTED ITEMS ACCORDION EXPANSION */}
                    {isExpanded && (
                      <tr className="bg-zinc-950/80 border-y border-zinc-800/80">
                        <td colSpan={12} className="p-3 pl-8">
                          <div className="border border-zinc-800 bg-[#121215] p-2.5">
                            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                Inward Item Breakdown — Invoice #{purchase.invoiceNumber} (
                                {purchase.items.length} items)
                              </span>
                              {purchase.notes && (
                                <span className="text-zinc-400 text-[11px] italic">
                                  "{purchase.notes}"
                                </span>
                              )}
                            </div>

                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-zinc-900/60 text-zinc-400 uppercase text-[9px] font-bold tracking-wider">
                                <tr>
                                  <th className="py-1 px-2 w-8">#</th>
                                  <th className="py-1 px-2">Item Name</th>
                                  <th className="py-1 px-2">Category</th>
                                  <th className="py-1 px-2 text-center">Batch / Exp</th>
                                  <th className="py-1 px-2 text-right">Qty Received</th>
                                  <th className="py-1 px-2 text-right">Unit Rate (CP)</th>
                                  <th className="py-1 px-2 text-right">Disc (Rs.)</th>
                                  <th className="py-1 px-2 text-right">Net Line Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                                {purchase.items.map((it, idx) => (
                                  <tr key={idx} className="hover:bg-zinc-900/40">
                                    <td className="py-1 px-2 font-mono text-zinc-500">
                                      {idx + 1}
                                    </td>
                                    <td className="py-1 px-2 font-bold text-zinc-100">
                                      {it.itemName}
                                    </td>
                                    <td className="py-1 px-2 text-zinc-400">
                                      {it.category || "General Stock"}
                                    </td>
                                    <td className="py-1 px-2 text-center font-mono text-[10px]">
                                      {it.batchNo || it.expiryDate ? (
                                        <span className="text-zinc-400">
                                          {it.batchNo && (
                                            <span className="text-amber-400">{it.batchNo} </span>
                                          )}
                                          {it.expiryDate && <span>({it.expiryDate})</span>}
                                        </span>
                                      ) : (
                                        <span className="text-zinc-600">-</span>
                                      )}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono font-bold text-zinc-100">
                                      {it.quantity} {it.unit}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono text-zinc-300">
                                      {formatNPR(it.unitCost)}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono text-zinc-400">
                                      {it.discount ? `-${formatNPR(it.discount)}` : "0"}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono font-bold text-amber-400">
                                      {formatNPR(it.totalCost)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
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
            {filteredPurchases.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-zinc-200">
            {Math.min(currentPage * pageSize, filteredPurchases.length)}
          </strong>{" "}
          of <strong className="text-zinc-200">{filteredPurchases.length}</strong> purchase records
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
          PRINTABLE MODAL RENDER
      ------------------------------------------------------------- */}
      {activePrintModal && (
        <PrintablePurchaseBillModal
          purchase={activePrintModal.purchase}
          mode={activePrintModal.mode}
          onClose={() => setActivePrintModal(null)}
          restaurantName={currentOutlet?.name || "Crispy Bites Restaurant"}
          restaurantPan={currentOutlet?.panNumber || "609823412"}
          restaurantAddress={currentOutlet?.address || "Dillibazar, Kathmandu"}
        />
      )}
    </div>
  );
};
