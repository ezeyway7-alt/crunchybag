import { usePurchaseRecords } from "../../../lib/usePurchaseRecords";
import React, { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Printer,
  ChevronDown,
  ChevronUp,
  Truck,
  X,
  Paperclip,
} from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { PurchaseRecord } from "../../../types";
import { formatNPR } from "../../../lib/utils";
import { PrintablePurchaseBillModal } from "./PrintablePurchaseBillModal";

export const PurchaseBillsDatatable: React.FC = () => {
  const { currentOutlet } = useApp();
  const { purchases, error: purchaseError, loading: purchasesLoading, retry: retryPurchases } = usePurchaseRecords(String(currentOutlet?.id || ""));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "PENDING" | "CREDIT">("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});

  const [activePrintModal, setActivePrintModal] = useState<{
    purchase: PurchaseRecord;
    mode: "BILL" | "SUPPLIER_STATEMENT";
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const suppliers = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.supplierName) set.add(p.supplierName);
    });
    return Array.from(set);
  }, [purchases]);

  const toggleRowExpansion = (purchaseId: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [purchaseId]: !prev[purchaseId],
    }));
  };

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

  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize));
  const paginatedPurchases = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredPurchases.slice(startIdx, startIdx + pageSize);
  }, [filteredPurchases, currentPage, pageSize]);

  if (purchasesLoading) return <p role="status" className="p-4 text-sm text-zinc-400">Loading purchase bills...</p>;
  if (purchaseError) return <p role="alert" className="p-4 text-sm text-rose-400">{purchaseError} <button className="underline" onClick={retryPurchases}>Retry</button></p>;

  return (
    <div className="bg-zinc-900/40 p-4 rounded-xl space-y-3.5">
      {/* Filter Row (Borderless, Clean 5-col layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
        <div className="lg:col-span-2">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 font-mono focus:outline-none"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 font-mono focus:outline-none"
          />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Supplier
          </label>
          <select
            value={selectedSupplier}
            onChange={(e) => {
              setSelectedSupplier(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Suppliers ({suppliers.length})</option>
            {suppliers.map((sup) => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[11px] text-zinc-400 font-medium mb-1">
            Status
          </label>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full h-8 px-2 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CREDIT">Khata Credit</option>
          </select>
        </div>

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
              className="w-full h-8 pl-8 pr-7 text-xs bg-zinc-900/70 border-0 focus:ring-1 focus:ring-amber-500/50 rounded-lg text-zinc-100 focus:outline-none font-mono"
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
      </div>

      {/* Inline Text Metrics (No Bulky Cards) */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-400 pt-0.5 font-medium overflow-x-auto no-scrollbar">
        <span>
          Bills: <strong className="font-mono text-zinc-100 font-bold">{datatableStats.billCount}</strong>
        </span>
        <span>
          Net Total: <strong className="font-mono text-amber-400 font-bold">{formatNPR(datatableStats.netTotal)}</strong>
        </span>
        <span>
          Paid: <strong className="font-mono text-emerald-400 font-bold">{formatNPR(datatableStats.paidTotal)}</strong>
        </span>
        {datatableStats.creditDueTotal > 0 && (
          <span>
            Credit Due: <strong className="font-mono text-amber-400 font-bold">{formatNPR(datatableStats.creditDueTotal)}</strong>
          </span>
        )}
      </div>

      {/* Borderless Bills Table */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/60 text-zinc-400 text-[11px] font-semibold">
              <th className="py-2.5 px-2 w-8 text-center"></th>
              <th className="py-2.5 px-2.5">Date</th>
              <th className="py-2.5 px-2.5">Bill #</th>
              <th className="py-2.5 px-3">Supplier</th>
              <th className="py-2.5 px-2 text-center">Items</th>
              <th className="py-2.5 px-2.5 text-right">Net</th>
              <th className="py-2.5 px-2.5 text-right">Paid</th>
              <th className="py-2.5 px-2.5 text-right">Due</th>
              <th className="py-2.5 px-2.5 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {paginatedPurchases.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-zinc-500 text-xs">
                  No purchase records found.
                </td>
              </tr>
            ) : (
              paginatedPurchases.map((purchase) => {
                const isExpanded = Boolean(expandedRowIds[purchase.id]);
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
                    <tr className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleRowExpansion(purchase.id)}
                          className="p-1 text-zinc-500 hover:text-white cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      <td className="py-2 px-2.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {purchase.purchaseDate}
                      </td>

                      <td className="py-2 px-2.5 font-mono font-semibold text-zinc-100 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{purchase.invoiceNumber}</span>
                          {purchase.documentName && (
                            <span className="text-emerald-400" title={purchase.documentName}>
                              <Paperclip className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-zinc-200">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{purchase.supplierName}</span>
                        </div>
                      </td>

                      <td className="py-2 px-2 text-center font-mono text-zinc-400">
                        {purchase.items.length}
                      </td>

                      <td className="py-2 px-2.5 text-right font-mono font-bold text-amber-400">
                        {formatNPR(purchase.totalAmount)}
                      </td>

                      <td className="py-2 px-2.5 text-right font-mono text-emerald-400">
                        {formatNPR(paid)}
                      </td>

                      <td className="py-2 px-2.5 text-right font-mono">
                        {due > 0 ? (
                          <span className="text-amber-400 font-semibold">{formatNPR(due)}</span>
                        ) : (
                          <span className="text-zinc-600">0</span>
                        )}
                      </td>

                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                            purchase.paymentStatus === "PAID"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : purchase.paymentStatus === "PARTIAL"
                              ? "bg-sky-500/10 text-sky-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {purchase.paymentStatus}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setActivePrintModal({
                                purchase,
                                mode: "BILL",
                              })
                            }
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Printer className="w-3 h-3 text-amber-400" />
                            <span>Print</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActivePrintModal({
                                purchase,
                                mode: "SUPPLIER_STATEMENT",
                              })
                            }
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <FileText className="w-3 h-3 text-sky-400" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Line Items (Borderless & Clean) */}
                    {isExpanded && (
                      <tr className="bg-zinc-950/40">
                        <td colSpan={10} className="p-3 pl-8">
                          <div className="bg-zinc-900/60 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span className="font-semibold text-zinc-200">
                                Line Items ({purchase.items.length})
                              </span>
                              {purchase.notes && (
                                <span className="italic text-zinc-500">"{purchase.notes}"</span>
                              )}
                            </div>

                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="text-zinc-500 font-medium">
                                  <th className="py-1 px-2">#</th>
                                  <th className="py-1 px-2">Item</th>
                                  <th className="py-1 px-2">Category</th>
                                  <th className="py-1 px-2 text-right">Qty</th>
                                  <th className="py-1 px-2 text-right">Rate</th>
                                  <th className="py-1 px-2 text-right">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
                                {purchase.items.map((it, idx) => (
                                  <tr key={idx}>
                                    <td className="py-1 px-2 font-mono text-zinc-500">
                                      {idx + 1}
                                    </td>
                                    <td className="py-1 px-2 font-semibold text-zinc-100">
                                      {it.itemName}
                                    </td>
                                    <td className="py-1 px-2 text-zinc-400">
                                      {it.category || "General"}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono">
                                      {it.quantity} {it.unit}
                                    </td>
                                    <td className="py-1 px-2 text-right font-mono text-zinc-400">
                                      {formatNPR(it.unitCost)}
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-zinc-500">
        <div>
          Showing{" "}
          <strong className="text-zinc-300">
            {filteredPurchases.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </strong>{" "}
          to{" "}
          <strong className="text-zinc-300">
            {Math.min(currentPage * pageSize, filteredPurchases.length)}
          </strong>{" "}
          of <strong className="text-zinc-300">{filteredPurchases.length}</strong> records
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
