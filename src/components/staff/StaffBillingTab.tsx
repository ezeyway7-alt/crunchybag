import React, { useState, useMemo, useEffect } from "react";
import {
  Receipt,
  Search,
  CheckCircle2,
  Printer,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Sparkles,
  Percent,
  RotateCcw,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Phone,
  User,
  AlertTriangle,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order, PaymentMethod, SplitPaymentEntry } from "../../types";
import { formatNPR, formatTimer } from "../../lib/utils";
import { Modal } from "../common/Modal";

interface Props {
  initialSelectedOrder?: Order | null;
}

export const StaffBillingTab: React.FC<Props> = ({ initialSelectedOrder }) => {
  const {
    orders,
    currentOutlet,
    settleSplitPaymentOrder,
    lookupLoyaltyByPhone,
    orgSettings,
    addToast,
  } = useApp();

  // Selected Order for Billing Workbench
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialSelectedOrder?.id || ""
  );

  useEffect(() => {
    if (initialSelectedOrder) {
      setSelectedOrderId(initialSelectedOrder.id);
    }
  }, [initialSelectedOrder]);

  // Settlement Form State
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [cashTendered, setCashTendered] = useState<number | "">("");
  const [splits, setSplits] = useState<SplitPaymentEntry[]>([
    { method: "CASH_ON_PICKUP", amount: 0 },
  ]);

  // Customer Contact for Settlement (Compulsory when Credit / Khata is selected)
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  // Tax Invoice Print Modal
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Datatable Search, Filter, Date Range & Pagination
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState<string>(() => getTodayStr());
  const [endDate, setEndDate] = useState<string>(() => getTodayStr());
  const [orderTypeFilter, setOrderTypeFilter] = useState<
    "ALL" | "ONLINE_DELIVERY" | "TAKEAWAY" | "DINE_IN"
  >("ALL");
  const [settlementFilter, setSettlementFilter] = useState<
    "ALL" | "PAID" | "UNPAID" | "CREDIT"
  >("ALL");
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [datatableSearch, setDatatableSearch] = useState("");
  const [billingFilter, setBillingFilter] = useState<
    "ALL" | "UNPAID" | "PAID" | "CREDIT" | "SPLIT" | "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  >("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Hovered split index for tooltip
  const [hoveredSplitIndex, setHoveredSplitIndex] = useState<number | null>(null);

  // Target Active Order for Workbench
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      return orders.find((o) => o.id === selectedOrderId) || null;
    }
    // Default to first open/unbilled order
    const firstUnsettled = orders.find(
      (o) =>
        o.status !== "CANCELLED" &&
        (o.isBilled === false || o.paymentStatus === "UNPAID")
    );
    return firstUnsettled || orders[0] || null;
  }, [orders, selectedOrderId]);

  // Synchronize initial splits and customer info when target order changes
  useEffect(() => {
    if (activeOrder) {
      const remainingTotal = Math.max(
        0,
        activeOrder.totalAmount - (activeOrder.discountAmount || 0)
      );
      setDiscountAmount(activeOrder.discountAmount || 0);
      setDiscountReason(activeOrder.discountReason || "");
      setCustomerName(activeOrder.customerName || "");
      setCustomerPhone(activeOrder.customerPhone || "");

      if (activeOrder.splitPayments && activeOrder.splitPayments.length > 0) {
        setSplits(activeOrder.splitPayments);
      } else {
        setSplits([
          {
            method:
              (activeOrder.paymentMethod as PaymentMethod) || "CASH_ON_PICKUP",
            amount: remainingTotal,
          },
        ]);
      }
      setCashTendered("");
    }
  }, [activeOrder?.id]);

  // Unsettled / Open Orders list for fast picking
  const openOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status !== "CANCELLED" &&
        (o.isBilled === false ||
          o.paymentStatus === "UNPAID" ||
          o.status !== "COMPLETED")
    );
  }, [orders]);

  // Customer Loyalty Check
  const effectivePhone = customerPhone || activeOrder?.customerPhone;
  const customerLoyalty = useMemo(() => {
    if (effectivePhone && effectivePhone.length >= 7) {
      return lookupLoyaltyByPhone(effectivePhone);
    }
    return null;
  }, [effectivePhone, lookupLoyaltyByPhone]);

  // Calculations
  const billSubtotal = activeOrder ? activeOrder.subtotal : 0;
  const effectiveDiscount = Number(discountAmount) || 0;
  const netPayable = Math.max(0, billSubtotal - effectiveDiscount);
  const totalSplitsAllocated = Number(
    splits.reduce((acc, s) => acc + (Number(s.amount) || 0), 0).toFixed(2)
  );
  const remainingToAllocate = Number(
    (netPayable - totalSplitsAllocated).toFixed(2)
  );

  // Credit Sale (Khata) Specific Analytics
  const hasCreditSplit = useMemo(() => {
    return splits.some((s) => s.method === "CREDIT" && Number(s.amount) > 0);
  }, [splits]);

  const totalCreditAllocated = useMemo(() => {
    return Number(
      splits
        .filter((s) => s.method === "CREDIT")
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
        .toFixed(2)
    );
  }, [splits]);

  const isCustomerPhoneValidForCredit = Boolean(
    customerPhone && customerPhone.trim().length >= 7
  );

  // Change Calculation for Cash Tender
  const cashSplit = splits.find(
    (s) => s.method === "CASH_ON_PICKUP" || s.method === "CASH_ON_DELIVERY"
  );
  const cashDue = cashSplit ? cashSplit.amount : netPayable;
  const changeDue =
    typeof cashTendered === "number" ? Math.max(0, cashTendered - cashDue) : 0;

  // -------------------------------------------------------------
  // SPLIT PAYMENT MANAGEMENT & AUTO-CALCULATIONS
  // -------------------------------------------------------------
  const handleAddSplitRow = () => {
    // Auto-calculate exact remaining amount
    const autoAmount = Math.max(0, remainingToAllocate);
    setSplits((prev) => [
      ...prev,
      {
        method: prev.some((s) => s.method === "FONEPAY_QR")
          ? "CASH_ON_PICKUP"
          : "FONEPAY_QR",
        amount: autoAmount,
      },
    ]);
  };

  const handleUpdateSplit = (
    index: number,
    field: keyof SplitPaymentEntry,
    val: any
  ) => {
    setSplits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleRemoveSplit = (index: number) => {
    setSplits((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      // Auto balance if single split left
      if (updated.length === 1) {
        updated[0] = { ...updated[0], amount: netPayable };
      }
      return updated;
    });
  };

  // Auto 50 / 50 split
  const handleEqualTwoWaySplit = () => {
    const half = Math.floor(netPayable / 2);
    const otherHalf = Number((netPayable - half).toFixed(2));
    if (splits.length >= 2) {
      setSplits((prev) => [
        { ...prev[0], amount: half },
        { ...prev[1], amount: otherHalf },
        ...prev.slice(2).map((s) => ({ ...s, amount: 0 })),
      ]);
    } else {
      setSplits([
        { method: splits[0]?.method || "CASH_ON_PICKUP", amount: half },
        { method: "FONEPAY_QR", amount: otherHalf },
      ]);
    }
  };

  // Auto 3-way split
  const handleEqualThreeWaySplit = () => {
    const third = Math.floor(netPayable / 3);
    const rem = Number((netPayable - third * 2).toFixed(2));
    setSplits([
      { method: "CASH_ON_PICKUP", amount: third },
      { method: "FONEPAY_QR", amount: third },
      { method: "ESEWA", amount: rem },
    ]);
  };

  // 100% Full Credit Sale (Khata)
  const handleFullCreditSale = () => {
    setSplits([
      { method: "CREDIT", amount: netPayable },
    ]);
  };

  // Split: Part Cash / Digital + Part Credit (Khata)
  const handleCashAndCreditSplit = () => {
    const half = Math.floor(netPayable / 2);
    const creditPart = Number((netPayable - half).toFixed(2));
    setSplits([
      { method: "CASH_ON_PICKUP", amount: half },
      { method: "CREDIT", amount: creditPart },
    ]);
  };

  // Auto fill remainder on specific split index
  const handleAutoFillRemainderForIndex = (index: number) => {
    const otherSplitsTotal = splits.reduce(
      (acc, s, idx) => (idx === index ? acc : acc + (Number(s.amount) || 0)),
      0
    );
    const autoBalance = Math.max(
      0,
      Number((netPayable - otherSplitsTotal).toFixed(2))
    );
    handleUpdateSplit(index, "amount", autoBalance);
  };

  // Submit Settlement (strictly validates compulsory phone for Credit Sale)
  const handleSettleOrder = () => {
    if (!activeOrder) return;

    if (Math.abs(remainingToAllocate) > 0.05) {
      addToast({
        title: "Split Amount Mismatch",
        description: `Split total (NPR ${totalSplitsAllocated}) must equal Net Payable (NPR ${netPayable}). Difference is NPR ${remainingToAllocate}.`,
        type: "warning",
      });
      return;
    }

    // Compulsory customer phone validation for Credit Sale
    if (hasCreditSplit) {
      const cleanPhone = (customerPhone || "").trim();
      if (!cleanPhone || cleanPhone.length < 7) {
        addToast({
          title: "Customer Phone Number Compulsory",
          description: "Customer mobile number is strictly compulsory for Credit Sale / Khata records. Please enter at least 7 digits in the customer mobile field.",
          type: "warning",
        });
        return;
      }
    }

    const settled = settleSplitPaymentOrder(
      activeOrder.id,
      splits,
      effectiveDiscount,
      discountReason,
      {
        customerName: customerName.trim() || activeOrder.customerName,
        customerPhone: customerPhone.trim() || activeOrder.customerPhone,
      }
    );

    if (settled) {
      setInvoiceOrder(settled);
    }
  };

  // -------------------------------------------------------------
  // FILTERED BILLS DATATABLE
  // -------------------------------------------------------------
  const filteredBills = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === "CANCELLED") return false;

      // Date Range Filter (Default: today)
      if (startDate) {
        const orderDate = (o.createdAt || "").slice(0, 10);
        if (orderDate && orderDate < startDate) return false;
      }
      if (endDate) {
        const orderDate = (o.createdAt || "").slice(0, 10);
        if (orderDate && orderDate > endDate) return false;
      }

      // Order Channel / Type Filter
      if (orderTypeFilter === "ONLINE_DELIVERY") {
        if (o.fulfillmentType !== "DELIVERY" && o.orderSource !== "WEBSITE") return false;
      } else if (orderTypeFilter === "DINE_IN") {
        if (o.fulfillmentType !== "DINE_IN") return false;
      } else if (orderTypeFilter === "TAKEAWAY") {
        if (o.fulfillmentType !== "TAKEAWAY" && o.fulfillmentType !== "DRIVE_THRU") return false;
      }

      // Settlement Status Filter
      if (settlementFilter === "PAID") {
        if (o.paymentStatus !== "PAID" && !o.isBilled) return false;
      } else if (settlementFilter === "UNPAID") {
        if (o.paymentStatus === "PAID" || o.isBilled) return false;
      } else if (settlementFilter === "CREDIT") {
        const isCredit =
          o.paymentMethod === "CREDIT" ||
          Boolean(
            o.splitPayments &&
              o.splitPayments.some((sp) => sp.method === "CREDIT" && sp.amount > 0)
          );
        if (!isCredit) return false;
      }

      // Quick tab filter
      if (billingFilter === "UNPAID" && (o.isBilled || o.paymentStatus === "PAID")) {
        return false;
      }
      if (billingFilter === "PAID" && !o.isBilled && o.paymentStatus !== "PAID") {
        return false;
      }
      if (billingFilter === "CREDIT") {
        const isCredit =
          o.paymentMethod === "CREDIT" ||
          Boolean(
            o.splitPayments &&
              o.splitPayments.some((sp) => sp.method === "CREDIT" && sp.amount > 0)
          );
        if (!isCredit) return false;
      }
      if (billingFilter === "SPLIT" && (!o.splitPayments || o.splitPayments.length < 2)) {
        return false;
      }
      if (billingFilter === "DINE_IN" && o.fulfillmentType !== "DINE_IN") {
        return false;
      }
      if (billingFilter === "TAKEAWAY" && o.fulfillmentType !== "TAKEAWAY") {
        return false;
      }
      if (billingFilter === "DELIVERY" && o.fulfillmentType !== "DELIVERY") {
        return false;
      }

      // Search Query
      const query = (tableSearchQuery || datatableSearch).trim().toLowerCase();
      if (query) {
        return (
          o.orderNumber.toLowerCase().includes(query) ||
          (o.kioskToken || "").toLowerCase().includes(query) ||
          o.customerName.toLowerCase().includes(query) ||
          (o.customerPhone || "").includes(query) ||
          o.paymentMethod.toLowerCase().includes(query) ||
          (o.tableNumber || "").toLowerCase().includes(query) ||
          o.items.some((it) => it.productName.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [
    orders,
    startDate,
    endDate,
    orderTypeFilter,
    settlementFilter,
    billingFilter,
    tableSearchQuery,
    datatableSearch,
  ]);

  // -------------------------------------------------------------
  // DATATABLE AGGREGATED STATISTICS
  // -------------------------------------------------------------
  const datatableStats = useMemo(() => {
    let grossSubtotal = 0;
    let totalDiscounts = 0;
    let netFinal = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    let cashTotal = 0;
    let qrFonepayTotal = 0;
    let esewaTotal = 0;
    let cardTotal = 0;
    let creditTotal = 0;
    let creditCount = 0;
    let refundVoidTotal = 0;

    filteredBills.forEach((o) => {
      const isCancelledOrVoid =
        o.status === "CANCELLED" || o.refundStatus === "REFUNDED" || o.refundStatus === "VOIDED";

      const sub = o.subtotal || o.totalAmount || 0;
      const disc = o.discountAmount || 0;
      const net = o.totalAmount;

      if (isCancelledOrVoid) {
        refundVoidTotal += o.refundAmount || o.totalAmount || 0;
      } else {
        grossSubtotal += sub;
        totalDiscounts += disc;
        netFinal += net;

        const isCredit =
          o.paymentMethod === "CREDIT" ||
          Boolean(
            o.splitPayments &&
              o.splitPayments.some((s) => s.method === "CREDIT" && s.amount > 0)
          );

        if (isCredit) {
          const creditPart =
            o.splitPayments?.find((s) => s.method === "CREDIT")?.amount ??
            (o.paymentMethod === "CREDIT" ? net : 0);
          creditTotal += creditPart;
          creditCount += 1;
        }

        const isPaid = o.paymentStatus === "PAID" || o.isBilled;
        if (isPaid) {
          totalPaid += net;
        } else {
          totalUnpaid += net;
        }

        if (o.splitPayments && o.splitPayments.length > 0) {
          o.splitPayments.forEach((sp) => {
            if (sp.method === "CASH_ON_PICKUP" || sp.method === "CASH_ON_DELIVERY") {
              cashTotal += sp.amount;
            } else if (sp.method === "FONEPAY_QR") {
              qrFonepayTotal += sp.amount;
            } else if (sp.method === "ESEWA") {
              esewaTotal += sp.amount;
            } else if (sp.method === "CARD") {
              cardTotal += sp.amount;
            }
          });
        } else {
          if (o.paymentMethod === "CASH_ON_PICKUP" || o.paymentMethod === "CASH_ON_DELIVERY") {
            cashTotal += net;
          } else if (o.paymentMethod === "FONEPAY_QR") {
            qrFonepayTotal += net;
          } else if (o.paymentMethod === "ESEWA") {
            esewaTotal += net;
          } else if (o.paymentMethod === "CARD") {
            cardTotal += net;
          } else if (o.paymentMethod !== "CREDIT") {
            cashTotal += net;
          }
        }
      }
    });

    return {
      orderCount: filteredBills.length,
      grossSubtotal,
      totalDiscounts,
      netFinal,
      totalPaid,
      totalUnpaid,
      cashTotal,
      qrFonepayTotal,
      esewaTotal,
      cardTotal,
      creditTotal,
      creditCount,
      refundVoidTotal,
    };
  }, [filteredBills]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / pageSize));
  const paginatedBills = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredBills.slice(startIdx, startIdx + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  return (
    <div className="space-y-2.5 text-xs">
      {/* -------------------------------------------------------------
          ACTIVE SETTLEMENT WORKBENCH (CLEAN, FOCUSED)
      ------------------------------------------------------------- */}
      {activeOrder ? (
        <div className="w-full max-w-3xl xl:max-w-[780px] mx-auto bg-[#141417] border border-zinc-800 p-2.5 sm:p-3 shadow-lg space-y-2.5">
          {/* Top Quick Order Switcher line */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800 bg-zinc-900/60 p-2 border">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black px-1.5 py-0.5 bg-amber-500 text-black">
                {activeOrder.kioskToken || activeOrder.orderNumber}
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                #{activeOrder.orderNumber}
              </span>
              <span className="font-bold text-zinc-100">
                {activeOrder.customerName}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {activeOrder.fulfillmentType}
                {activeOrder.tableNumber ? ` • ${activeOrder.tableNumber}` : ""}
              </span>
              {!activeOrder.isBilled ? (
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-amber-500 text-black">
                  Unbilled
                </span>
              ) : (
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-emerald-500 text-black">
                  Settled
                </span>
              )}
            </div>

            {/* Quick Switch Dropdown */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-zinc-400">Switch:</span>
              <select
                value={activeOrder.id}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="h-6 px-1.5 text-[11px] bg-zinc-900 border border-zinc-700 text-zinc-100 font-bold focus:outline-none cursor-pointer"
              >
                <optgroup label="Open / Unbilled Orders">
                  {openOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.kioskToken || o.orderNumber} • {o.customerName} (
                      {formatNPR(o.totalAmount)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All Orders">
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.kioskToken || o.orderNumber} • {o.customerName} [
                      {o.isBilled ? "PAID" : "UNPAID"}]
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Customer Info & Credit Sale (Khata) Phone Verification Strip */}
          <div
            className={`p-2 border flex flex-wrap items-center justify-between gap-2 text-[11px] transition-colors ${
              hasCreditSplit
                ? isCustomerPhoneValidForCredit
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                  : "bg-rose-500/10 border-rose-500/40 text-rose-200"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-300"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-[10px] text-zinc-400 uppercase font-bold">
                  Customer:
                </span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-28 h-6 px-1.5 text-[11px] bg-zinc-900 border border-zinc-700 text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1">
                <Phone
                  className={`w-3.5 h-3.5 shrink-0 ${
                    hasCreditSplit && !isCustomerPhoneValidForCredit
                      ? "text-rose-500"
                      : "text-zinc-400"
                  }`}
                />
                <span className="text-[10px] text-zinc-400 uppercase font-bold">
                  Mobile No:
                  {hasCreditSplit && (
                    <span className="text-rose-400 font-bold ml-0.5">
                      *
                    </span>
                  )}
                </span>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={`w-32 h-6 px-1.5 text-[11px] font-mono bg-zinc-900 border focus:outline-none ${
                    hasCreditSplit && !isCustomerPhoneValidForCredit
                      ? "border-rose-500 text-rose-300 font-bold"
                      : "border-zinc-700 text-white focus:border-amber-500"
                  }`}
                />
              </div>

              {customerLoyalty && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  {customerLoyalty.visitCount} visits
                </span>
              )}
            </div>

            {hasCreditSplit && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Credit:{" "}
                  <strong className="font-mono text-amber-400">
                    {formatNPR(totalCreditAllocated)}
                  </strong>
                </span>
                {!isCustomerPhoneValidForCredit ? (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5">
                    Phone Required
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-black font-bold text-[9px] uppercase tracking-wider">
                    Linked
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Balanced 12-Column Grid (md:grid-cols-12: Left 5 cols, Right 7 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* LEFT: Itemized Bill & Net Payable (Receipt Card Look) */}
            <div className="md:col-span-5 flex flex-col justify-between bg-zinc-900/60 p-2.5 border border-zinc-800/80 space-y-2">
              {/* Itemized lines with subtle dotted leaders (no gaping voids) */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-zinc-800/40 pr-1">
                {activeOrder.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="pt-1 flex items-baseline justify-between text-[11px]"
                  >
                    <span className="truncate font-bold text-zinc-200">
                      {it.quantity}x {it.productName}
                      {it.variantName && (
                        <span className="text-[10px] text-zinc-400 font-mono ml-0.5">
                          ({it.variantName})
                        </span>
                      )}
                    </span>
                    <span className="flex-1 border-b border-dotted border-zinc-700/60 mx-1 min-w-[8px]"></span>
                    <span className="font-mono font-bold text-zinc-200 shrink-0">
                      {formatNPR(it.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Loyalty Revisit Offer (if applicable) */}
              {customerLoyalty &&
                customerLoyalty.eligibleRevisitDiscountPercent > 0 && (
                  <div className="py-1 px-1.5 bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[10px] text-amber-300">
                    <span className="flex items-center gap-1 truncate">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      Visit #{customerLoyalty.visitCount}:{" "}
                      <strong>
                        {customerLoyalty.eligibleRevisitDiscountPercent}% Revisit Offer
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const disc = Math.round(
                          (billSubtotal *
                            customerLoyalty.eligibleRevisitDiscountPercent) /
                            100
                        );
                        setDiscountAmount(disc);
                        setDiscountReason(
                          `Loyalty ${customerLoyalty.eligibleRevisitDiscountPercent}%`
                        );
                      }}
                      className="px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-black uppercase cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}

              {/* Discount compact row */}
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-zinc-800 text-[11px]">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                    Disc:
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={billSubtotal}
                    value={discountAmount || ""}
                    onChange={(e) =>
                      setDiscountAmount(Math.max(0, Number(e.target.value)))
                    }
                    placeholder="0"
                    className="w-16 h-6 px-1.5 bg-zinc-900 border border-zinc-700 font-mono font-bold text-white focus:outline-none focus:border-amber-500 text-[11px]"
                  />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                    Note:
                  </span>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="e.g. Promo"
                    className="w-full h-6 px-1.5 bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-amber-500 text-[11px]"
                  />
                </div>
              </div>

              {/* Financial summary: clean labels and values with receipt lines */}
              <div className="space-y-1 text-[11px] pt-1.5 border-t border-zinc-800">
                <div className="flex justify-between text-zinc-400">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-bold text-zinc-200">
                    {formatNPR(billSubtotal)}
                  </span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Discount:</span>
                    <span className="font-mono font-bold">
                      -{formatNPR(effectiveDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-500 text-[10px]">
                  <span>13% VAT (Included):</span>
                  <span className="font-mono">
                    {formatNPR(Math.round(netPayable * 0.13))}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-zinc-800 text-xs font-black">
                  <span className="uppercase tracking-wider text-white">
                    Net Payable:
                  </span>
                  <span className="font-mono text-base text-amber-400 font-black">
                    {formatNPR(netPayable)}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: Multi-Tender Splits & Cash Calculator */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-2 bg-zinc-900/40 p-2.5 border border-zinc-800/60">
              <div className="space-y-2">
                {/* Tender Allocation Header */}
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-zinc-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5" />
                    Tender Allocation
                  </span>

                  <button
                    type="button"
                    onClick={handleAddSplitRow}
                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" /> Add
                  </button>
                </div>

                {/* Split rows with structured neat tightly grouped controls (no awkward gaps) */}
                <div className="space-y-1.5">
                  {splits.map((s, idx) => {
                    const pct =
                      netPayable > 0
                        ? ((s.amount / netPayable) * 100).toFixed(0)
                        : "0";
                    const isCredit = s.method === "CREDIT";

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredSplitIndex(idx)}
                        onMouseLeave={() => setHoveredSplitIndex(null)}
                        className={`p-1.5 border flex items-center gap-1.5 transition-colors text-xs ${
                          isCredit
                            ? "border-amber-500/70 bg-amber-500/10"
                            : hoveredSplitIndex === idx
                            ? "border-amber-500/50 bg-zinc-800/70"
                            : "border-zinc-800 bg-zinc-900"
                        }`}
                      >
                        {/* Method Selector (Flexible, cleanly aligned) */}
                        <div className="flex-1 min-w-[125px]">
                          <select
                            value={s.method}
                            onChange={(e) =>
                              handleUpdateSplit(
                                idx,
                                "method",
                                e.target.value as PaymentMethod
                              )
                            }
                            className={`w-full h-7 px-1.5 text-xs font-bold focus:outline-none border ${
                              isCredit
                                ? "bg-amber-950/40 border-amber-500/80 text-amber-200"
                                : "bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-amber-500"
                            }`}
                          >
                            <option value="CASH_ON_PICKUP">Cash</option>
                            <option value="FONEPAY_QR">FonePay QR</option>
                            <option value="ESEWA">eSewa</option>
                            <option value="CARD">POS Card</option>
                            <option value="CREDIT">Credit (Khata)</option>
                          </select>
                        </div>

                        {/* Amount Input (Fixed compact width) */}
                        <div className="w-24 shrink-0">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={s.amount}
                            onChange={(e) =>
                              handleUpdateSplit(
                                idx,
                                "amount",
                                Number(e.target.value)
                              )
                            }
                            className="w-full h-7 px-1.5 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono font-bold text-right focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Percent Badge */}
                        <div className="w-10 text-right shrink-0 flex items-center justify-end gap-0.5">
                          <span
                            className="font-mono text-[10px] text-zinc-400"
                            title={`${pct}% of total net payable`}
                          >
                            {pct}%
                          </span>
                        </div>

                        {/* Actions: Fill Remainder & Remove (closely grouped) */}
                        <div className="flex items-center gap-1 shrink-0">
                          {Math.abs(remainingToAllocate) > 0.01 && (
                            <button
                              type="button"
                              onClick={() => handleAutoFillRemainderForIndex(idx)}
                              className="px-1.5 h-7 text-[9px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 cursor-pointer whitespace-nowrap"
                              title="Auto-fill remainder"
                            >
                              Fill Rem
                            </button>
                          )}

                          {splits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSplit(idx)}
                              className="p-1 text-zinc-400 hover:text-rose-400 cursor-pointer"
                              title="Remove split"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Remaining balance hint if difference exists */}
                {Math.abs(remainingToAllocate) > 0.01 && (
                  <div className="text-[11px] text-rose-400 font-mono font-bold text-right py-0.5">
                    Remaining: {formatNPR(remainingToAllocate)}
                  </div>
                )}

                {/* Cash Drawer Calculator (Single clean inline bar, no stretching) */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                      Cash Received:
                    </span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) =>
                        setCashTendered(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-24 h-7 px-1.5 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400">Change:</span>
                    <strong className="font-mono font-bold text-emerald-400 text-xs">
                      {formatNPR(changeDue)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Settle Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSettleOrder}
                  className={`w-full h-9 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors ${
                    hasCreditSplit && !isCustomerPhoneValidForCredit
                      ? "bg-rose-600 hover:bg-rose-500 text-white"
                      : "bg-amber-500 hover:bg-amber-400 text-black"
                  }`}
                >
                  {hasCreditSplit && !isCustomerPhoneValidForCredit ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-200" />
                      <span>Enter Customer Mobile to Confirm Credit Sale</span>
                    </>
                  ) : hasCreditSplit ? (
                    <>
                      <BookOpen className="w-4 h-4 text-black" />
                      <span>Confirm Credit Settlement & Print Tax Invoice</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>Confirm Settlement & Print Tax Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center bg-[#141417] border border-zinc-800 text-zinc-400 text-xs">
          No open order selected. Choose any order from the table below to settle.
        </div>
      )}

      {/* -------------------------------------------------------------
          ADVANCED BILLING DATATABLE (WITH POS STYLE FILTERS & CLEAN INLINE STATS)
      ------------------------------------------------------------- */}
      <div className="bg-[#141417] border border-zinc-800 p-3 shadow-sm space-y-3">
        {/* TOP FILTERS GRID */}
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
              className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
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
              className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* Order Channel / Type */}
          <div className="lg:col-span-3">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
              Order Channel / Type
            </label>
            <select
              value={orderTypeFilter}
              onChange={(e) => {
                setOrderTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Channels (Dine-In, Takeaway, Online)</option>
              <option value="ONLINE_DELIVERY">Online & Delivery</option>
              <option value="TAKEAWAY">Takeaway & Drive-Thru</option>
              <option value="DINE_IN">Dine-In Tables</option>
            </select>
          </div>

          {/* Settlement */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
              Settlement
            </label>
            <select
              value={settlementFilter}
              onChange={(e) => {
                setSettlementFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Bills</option>
              <option value="PAID">Paid / Settled</option>
              <option value="UNPAID">Unsettled / Open</option>
              <option value="CREDIT">Credit Sale (Khata)</option>
            </select>
          </div>

          {/* Datatable Search */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
              Datatable Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={tableSearchQuery}
                onChange={(e) => {
                  setTableSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Token, #CR, item, phone..."
                className="w-full h-8 pl-7 pr-6 text-xs bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
              {tableSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setTableSearchQuery("");
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
              title="Rows per page"
            >
              <option value={10}>10/p</option>
              <option value={20}>20/p</option>
              <option value={50}>50/p</option>
            </select>
          </div>
        </div>

        {/* INLINE STATS & CASH BREAKDOWN (Clean text, no bulky boxes, responsive scroll) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 py-1 font-medium overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Orders:</span>
            <strong className="font-mono text-zinc-100 font-bold">{datatableStats.orderCount}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Gross:</span>
            <strong className="font-mono text-zinc-200 font-bold">{formatNPR(datatableStats.grossSubtotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Discount:</span>
            <strong className="font-mono text-rose-400 font-bold">
              {datatableStats.totalDiscounts > 0 ? `-${formatNPR(datatableStats.totalDiscounts)}` : "Rs. 0"}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Final:</span>
            <strong className="font-mono text-amber-400 font-bold">{formatNPR(datatableStats.netFinal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Paid:</span>
            <strong className="font-mono text-emerald-400 font-bold">{formatNPR(datatableStats.totalPaid)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Unpaid:</span>
            <strong className="font-mono text-amber-400 font-bold">{formatNPR(datatableStats.totalUnpaid)}</strong>
          </span>

          <span className="text-zinc-700 select-none">|</span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Cash:</span>
            <strong className="font-mono text-zinc-100 font-bold">{formatNPR(datatableStats.cashTotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">FonePay:</span>
            <strong className="font-mono text-rose-500 font-bold">{formatNPR(datatableStats.qrFonepayTotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">eSewa:</span>
            <strong className="font-mono text-emerald-400 font-bold">{formatNPR(datatableStats.esewaTotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Card:</span>
            <strong className="font-mono text-sky-400 font-bold">{formatNPR(datatableStats.cardTotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-amber-400">Khata Credit:</span>
            <strong className="font-mono text-amber-400 font-bold">
              {formatNPR(datatableStats.creditTotal)} ({datatableStats.creditCount})
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-500">Void/Refund:</span>
            <strong className="font-mono text-rose-400 font-bold">{formatNPR(datatableStats.refundVoidTotal)}</strong>
          </span>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 pb-1 text-xs font-bold border-t border-zinc-800">
          {(
            [
              { key: "ALL", label: "All Bills", count: orders.length },
              {
                key: "UNPAID",
                label: "Unbilled Due",
                count: orders.filter(
                  (o) => !o.isBilled && o.paymentStatus !== "PAID" && o.status !== "CANCELLED"
                ).length,
              },
              {
                key: "PAID",
                label: "Settled Paid",
                count: orders.filter(
                  (o) => (o.isBilled || o.paymentStatus === "PAID") && o.status !== "CANCELLED"
                ).length,
              },
              {
                key: "CREDIT",
                label: "Credit (Khata)",
                count: orders.filter(
                  (o) =>
                    o.status !== "CANCELLED" &&
                    (o.paymentMethod === "CREDIT" ||
                      Boolean(
                        o.splitPayments &&
                          o.splitPayments.some(
                            (sp) => sp.method === "CREDIT" && sp.amount > 0
                          )
                      ))
                ).length,
              },
              {
                key: "SPLIT",
                label: "Split Tender",
                count: orders.filter(
                  (o) => o.splitPayments && o.splitPayments.length > 1
                ).length,
              },
              {
                key: "DINE_IN",
                label: "Dine-In",
                count: orders.filter((o) => o.fulfillmentType === "DINE_IN")
                  .length,
              },
              {
                key: "TAKEAWAY",
                label: "Takeaway",
                count: orders.filter((o) => o.fulfillmentType === "TAKEAWAY")
                  .length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setBillingFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 text-[11px] ${
                billingFilter === tab.key
                  ? "bg-amber-500 text-black border-amber-500 font-black"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] px-1 bg-white/10">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Datatable */}
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-2 text-center w-8">S.N.</th>
                <th className="p-2">Token / Order</th>
                <th className="p-2">Customer & Channel</th>
                <th className="p-2">Items</th>
                <th className="p-2 text-right">Amount & Discount</th>
                <th className="p-2 text-center">Billing Status & Payment</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 font-medium">
              {paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-zinc-400">
                    No billing records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((ord, idx) => {
                  const serialNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isPaid = ord.isBilled || ord.paymentStatus === "PAID";
                  const isSelected = activeOrder?.id === ord.id;

                  return (
                    <tr
                      key={ord.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-amber-500/10 dark:bg-amber-500/5"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      {/* S.N. */}
                      <td className="p-2 text-center font-mono text-[10px] text-zinc-400">
                        {String(serialNumber).padStart(2, "0")}
                      </td>

                      {/* Token / Order */}
                      <td className="p-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black px-1.5 py-0.5 bg-amber-500 text-black">
                            {ord.kioskToken || ord.orderNumber}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-400">
                            #{ord.orderNumber}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {ord.createdAt.split("T")[1]?.slice(0, 5) || "Today"}
                        </div>
                      </td>

                      {/* Customer & Channel */}
                      <td className="p-2">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
                          {ord.customerName}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                          <span>{ord.fulfillmentType}</span>
                          {ord.tableNumber && <span>• {ord.tableNumber}</span>}
                          {ord.customerPhone ? (
                            <span className="font-mono flex items-center gap-0.5 text-zinc-600 dark:text-zinc-300">
                              • <Phone className="w-2.5 h-2.5 text-zinc-400" /> {ord.customerPhone}
                            </span>
                          ) : (
                            (ord.paymentMethod === "CREDIT" ||
                              Boolean(
                                ord.splitPayments?.some(
                                  (sp) => sp.method === "CREDIT" && sp.amount > 0
                                )
                              )) && (
                              <span className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5">
                                • <AlertTriangle className="w-2.5 h-2.5" /> No Mobile!
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="p-2 max-w-[180px]">
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-1">
                          {ord.items
                            ? ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")
                            : "No items"}
                        </p>
                      </td>

                      {/* Amount & Discount in same column */}
                      <td className="p-2 whitespace-nowrap text-right font-mono">
                        <div className="font-black text-amber-600 dark:text-amber-400 text-xs">
                          {formatNPR(ord.totalAmount)}
                        </div>
                        {ord.discountAmount && ord.discountAmount > 0 ? (
                          <div className="text-[10px] flex items-center justify-end gap-1">
                            <span className="line-through text-zinc-400">
                              {formatNPR(ord.subtotal)}
                            </span>
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              -{formatNPR(ord.discountAmount)}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-400">
                            Subtotal: {formatNPR(ord.subtotal)}
                          </div>
                        )}
                      </td>

                      {/* Billing Status & Payment Method in same column */}
                      <td className="p-2 whitespace-nowrap text-center">
                        {(() => {
                          const hasCredit =
                            ord.paymentMethod === "CREDIT" ||
                            Boolean(
                              ord.splitPayments?.some(
                                (sp) => sp.method === "CREDIT" && sp.amount > 0
                              )
                            );
                          const creditAmt =
                            ord.splitPayments
                              ?.filter((sp) => sp.method === "CREDIT")
                              .reduce((sum, sp) => sum + sp.amount, 0) ||
                            (ord.paymentMethod === "CREDIT" ? ord.totalAmount : 0);
                          const paidNonCredit = Math.max(
                            0,
                            ord.totalAmount - creditAmt
                          );

                          if (hasCredit) {
                            return (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                                  <BookOpen className="w-2.5 h-2.5 text-amber-600" />
                                  {paidNonCredit > 0
                                    ? "Split Credit (Khata)"
                                    : "100% Credit (Khata)"}
                                </span>
                                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                  {paidNonCredit > 0 ? (
                                    <span>
                                      Paid {formatNPR(paidNonCredit)} • Khata{" "}
                                      {formatNPR(creditAmt)}
                                    </span>
                                  ) : (
                                    <span>Due: {formatNPR(creditAmt)}</span>
                                  )}
                                </span>
                              </div>
                            );
                          }

                          if (isPaid) {
                            return (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Settled •{" "}
                                  {ord.splitPayments && ord.splitPayments.length > 1
                                    ? "Split"
                                    : ord.paymentMethod.replace(/_/g, " ")}
                                </span>
                                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  Paid: {formatNPR(ord.totalAmount)}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                Unbilled
                              </span>
                              <span className="font-mono text-[10px] text-zinc-400">
                                Due: {formatNPR(ord.totalAmount)}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Action */}
                      <td className="p-2 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(ord.id)}
                            className={`px-2 py-1 text-xs font-bold border cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-amber-500 text-black border-amber-500"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-amber-500"
                            }`}
                          >
                            {isSelected ? "Active" : "Select"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(ord)}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                            title="Print Tax Invoice"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-zinc-500">
          <div>
            Showing{" "}
            <strong className="text-zinc-900 dark:text-white">
              {filteredBills.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-zinc-900 dark:text-white">
              {Math.min(currentPage * pageSize, filteredBills.length)}
            </strong>{" "}
            of{" "}
            <strong className="text-zinc-900 dark:text-white">
              {filteredBills.length}
            </strong>{" "}
            bills
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 cursor-pointer font-bold flex items-center gap-0.5"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
              if (
                totalPages > 5 &&
                Math.abs(pg - currentPage) > 2 &&
                pg !== 1 &&
                pg !== totalPages
              ) {
                return null;
              }
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`w-6 h-6 text-xs font-mono font-bold border cursor-pointer ${
                    currentPage === pg
                      ? "bg-amber-500 text-black border-amber-500"
                      : "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {pg}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-0.5 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 cursor-pointer font-bold flex items-center gap-0.5"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          4. TAX INVOICE PRINT MODAL
      ------------------------------------------------------------- */}
      {invoiceOrder && (
        <Modal
          isOpen={!!invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
          title="Official Tax Invoice / Receipt"
          size="sm"
        >
          <div className="p-4 bg-white text-black font-mono text-xs space-y-3 border border-zinc-400 max-w-sm mx-auto shadow-xl">
            <div className="text-center space-y-0.5 border-b border-black pb-2">
              <h3 className="font-black text-sm uppercase">
                {orgSettings.legalEntity}
              </h3>
              <p className="text-[10px]">
                {orgSettings.brandName} • {currentOutlet.name}
              </p>
              <p className="text-[10px]">PAN/VAT: {orgSettings.panNumber}</p>
              <p className="text-[10px]">{currentOutlet.address}</p>
              <div className="mt-1 font-bold text-xs uppercase bg-black text-white py-0.5">
                TAX INVOICE
              </div>
            </div>

            <div className="flex justify-between text-[11px]">
              <span>Inv: #{invoiceOrder.orderNumber}</span>
              <span>{invoiceOrder.createdAt.split("T")[0]}</span>
            </div>
            <div className="text-[11px]">
              <p>Buyer: {invoiceOrder.customerName}</p>
              {invoiceOrder.customerPhone && (
                <p>Contact: {invoiceOrder.customerPhone}</p>
              )}
              <p>
                Type: {invoiceOrder.fulfillmentType}{" "}
                {invoiceOrder.tableNumber
                  ? `(${invoiceOrder.tableNumber})`
                  : ""}
              </p>
            </div>

            <div className="border-t border-b border-dashed border-black py-2 space-y-1 text-[11px]">
              {invoiceOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {it.quantity}x {it.productName}
                  </span>
                  <span>{formatNPR(it.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span>{formatNPR(invoiceOrder.subtotal)}</span>
              </div>
              {invoiceOrder.discountAmount ? (
                <div className="flex justify-between text-zinc-700">
                  <span>
                    Discount ({invoiceOrder.discountReason || "Promo"}):
                  </span>
                  <span>-{formatNPR(invoiceOrder.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-[10px] text-zinc-600">
                <span>13% VAT (Included):</span>
                <span>
                  {formatNPR(
                    invoiceOrder.vatIncludedAmount ||
                      Math.round(invoiceOrder.totalAmount * 0.13)
                  )}
                </span>
              </div>
              {(() => {
                const creditAmt =
                  invoiceOrder.splitPayments
                    ?.filter((sp) => sp.method === "CREDIT")
                    .reduce((sum, sp) => sum + sp.amount, 0) ||
                  (invoiceOrder.paymentMethod === "CREDIT"
                    ? invoiceOrder.totalAmount
                    : 0);
                const paidAmt = Math.max(0, invoiceOrder.totalAmount - creditAmt);

                return (
                  <>
                    <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                      <span>NET BILL TOTAL:</span>
                      <span>{formatNPR(invoiceOrder.totalAmount)}</span>
                    </div>

                    {creditAmt > 0 && (
                      <div className="pt-1 space-y-0.5 text-[11px] font-bold border-t border-dashed border-zinc-400">
                        {paidAmt > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>Settled Paid:</span>
                            <span>{formatNPR(paidAmt)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-amber-700">
                          <span>Booked on Credit (Khata):</span>
                          <span>{formatNPR(creditAmt)}</span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="text-[10px] text-zinc-600 pt-1 border-t border-dashed border-zinc-400">
              <p>
                Payment:{" "}
                {invoiceOrder.splitPayments &&
                invoiceOrder.splitPayments.length > 1
                  ? invoiceOrder.splitPayments
                      .map((sp) => `${sp.method === "CREDIT" ? "Credit (Khata)" : sp.method ? sp.method.replace(/_/g, " ") : "Direct"} (${formatNPR(sp.amount)})`)
                      .join(", ")
                  : invoiceOrder.paymentMethod === "CREDIT"
                  ? "Credit Sale (Khata)"
                  : invoiceOrder.paymentMethod ? invoiceOrder.paymentMethod.replace(/_/g, " ") : "Direct"}
              </p>
              <p>Token: {invoiceOrder.kioskToken || invoiceOrder.orderNumber}</p>
              {invoiceOrder.customerPhone && (
                <p>Khata Customer Mobile: {invoiceOrder.customerPhone}</p>
              )}
            </div>

            <div className="text-center pt-2 text-[10px] text-zinc-600">
              <p>*** Computer Generated Invoice ***</p>
              <p>Thank you for dining with us!</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print?.();
                  setInvoiceOrder(null);
                }}
                className="w-full py-2 bg-black text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
