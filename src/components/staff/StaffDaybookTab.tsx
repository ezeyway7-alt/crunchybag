import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  Users,
  FileText,
  Printer,
  Trash2,
  Edit3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  Search,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  Party,
  PartyCategory,
  DaybookAccountEntry,
  DaybookVoucherType,
} from "../../types";
import { formatNPR } from "../../lib/utils";
import { Modal } from "../common/Modal";

type MiniNavTab = "daybook" | "parties" | "gl" | "pl";

const VOUCHER_TYPE_MAP: Record<DaybookVoucherType, { label: string; defaultInOut: "IN" | "OUT" }> = {
  SALES: { label: "Sales Revenue", defaultInOut: "IN" },
  SALES_RETURN: { label: "Sales Return", defaultInOut: "OUT" },
  PURCHASE: { label: "Purchase (Vendor)", defaultInOut: "OUT" },
  PURCHASE_RETURN: { label: "Purchase Return", defaultInOut: "IN" },
  EMPLOYEE: { label: "Employee / Wage / Advance", defaultInOut: "OUT" },
  PAYABLE_PAID: { label: "Payable Paid (Vendor)", defaultInOut: "OUT" },
  RECEIVABLE_RECEIVED: { label: "Receivable Received (Khata)", defaultInOut: "IN" },
  EXPENSE: { label: "Store Operating Expense", defaultInOut: "OUT" },
  CASH_IN: { label: "Cash / Capital In", defaultInOut: "IN" },
  CASH_OUT: { label: "Cash / Bank Out", defaultInOut: "OUT" },
};

export const StaffDaybookTab: React.FC = () => {
  const {
    parties,
    addParty,
    updateParty,
    deleteParty,
    customPartyTypes,
    addCustomPartyType,
    daybookAccountEntries,
    addDaybookAccountEntry,
    deleteDaybookAccountEntry,
    openingBalanceSetting,
    setOpeningBalanceSetting,
    currentOutlet,
    currentUser,
    orgSettings,
    addToast,
  } = useApp();

  // Mini sidebar navigation (Default: daybook)
  const [activeTab, setActiveTab] = useState<MiniNavTab>("daybook");

  // Single clean Date filter (defaults to today, or empty for all)
  const [filterDate, setFilterDate] = useState<string>("2026-09-19");

  // Daybook form state (open by default)
  const [formDate, setFormDate] = useState<string>("2026-09-19");
  const [formTime, setFormTime] = useState<string>("10:00 AM");
  const [formVoucherType, setFormVoucherType] = useState<DaybookVoucherType>("EXPENSE");
  const [formInOut, setFormInOut] = useState<"IN" | "OUT">("OUT");
  const [formPartyId, setFormPartyId] = useState<string>("");
  const [formPartyName, setFormPartyName] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formPaymentMode, setFormPaymentMode] = useState<"CASH" | "BANK_TRANSFER" | "FONEPAY" | "CHEQUE">("CASH");
  const [formReferenceNo, setFormReferenceNo] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");

  // Opening balance quick setter
  const [editOpeningBalValue, setEditOpeningBalValue] = useState<string>(openingBalanceSetting.toString());
  const [isUpdatingOpeningBal, setIsUpdatingOpeningBal] = useState(false);

  // Daybook Table Pagination
  const [daybookPage, setDaybookPage] = useState<number>(1);
  const [daybookPageSize, setDaybookPageSize] = useState<number>(10);
  const [daybookGoToInput, setDaybookGoToInput] = useState<string>("");

  // Parties Form State (open by default)
  const [partyName, setPartyName] = useState("");
  const [partyCategory, setPartyCategory] = useState<PartyCategory>("VENDOR");
  const [partyPhone, setPartyPhone] = useState("");
  const [partyPan, setPartyPan] = useState("");
  const [partyOpeningBal, setPartyOpeningBal] = useState("0");
  const [partyOpeningType, setPartyOpeningType] = useState<"DR" | "CR">("CR");
  const [partyNotes, setPartyNotes] = useState("");
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);

  // Parties Pagination
  const [partiesPage, setPartiesPage] = useState<number>(1);
  const [partiesPageSize, setPartiesPageSize] = useState<number>(10);
  const [partiesGoToInput, setPartiesGoToInput] = useState<string>("");

  // GL Tab state (Search and select party)
  const [glPartySearch, setGlPartySearch] = useState("");
  const [glSelectedPartyId, setGlSelectedPartyId] = useState<string>("ALL");
  const [glPage, setGlPage] = useState<number>(1);
  const [glPageSize, setGlPageSize] = useState<number>(15);
  const [glGoToInput, setGlGoToInput] = useState<string>("");

  // Print voucher receipt modal
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<DaybookAccountEntry | null>(null);

  // -------------------------------------------------------------
  // DAILY & ROLLING CALCULATIONS
  // -------------------------------------------------------------
  const dateSpecificEntries = useMemo(() => {
    if (!filterDate) return daybookAccountEntries;
    return daybookAccountEntries.filter((e) => e.date === filterDate);
  }, [daybookAccountEntries, filterDate]);

  const dailyIn = useMemo(() => {
    return dateSpecificEntries
      .filter((e) => e.inOutType === "IN")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [dateSpecificEntries]);

  const dailyOut = useMemo(() => {
    return dateSpecificEntries
      .filter((e) => e.inOutType === "OUT")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [dateSpecificEntries]);

  const dailyOpening = openingBalanceSetting;
  const dailyClosing = dailyOpening + dailyIn - dailyOut;

  const totalInAll = useMemo(() => {
    return daybookAccountEntries
      .filter((e) => e.inOutType === "IN")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [daybookAccountEntries]);

  const totalOutAll = useMemo(() => {
    return daybookAccountEntries
      .filter((e) => e.inOutType === "OUT")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [daybookAccountEntries]);

  const overallRolling = dailyOpening + totalInAll - totalOutAll;

  // -------------------------------------------------------------
  // DAYBOOK ENTRIES PAGINATED LIST
  // -------------------------------------------------------------
  const totalDaybookPages = Math.max(1, Math.ceil(dateSpecificEntries.length / daybookPageSize));

  const paginatedDaybookEntries = useMemo(() => {
    const startIndex = (daybookPage - 1) * daybookPageSize;
    return dateSpecificEntries.slice(startIndex, startIndex + daybookPageSize);
  }, [dateSpecificEntries, daybookPage, daybookPageSize]);

  const handleDaybookGoTo = () => {
    const p = parseInt(daybookGoToInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalDaybookPages) {
      setDaybookPage(p);
      setDaybookGoToInput("");
    }
  };

  // -------------------------------------------------------------
  // PARTIES METRICS & PAGINATED LIST
  // -------------------------------------------------------------
  const totalVendorPayables = useMemo(() => {
    return parties
      .filter((p) => p.category === "VENDOR")
      .reduce((sum, p) => sum + (p.currentBalance ?? p.openingBalance ?? 0), 0);
  }, [parties]);

  const totalCustomerReceivables = useMemo(() => {
    return parties
      .filter((p) => p.category === "CUSTOMER")
      .reduce((sum, p) => sum + (p.currentBalance ?? p.openingBalance ?? 0), 0);
  }, [parties]);

  const totalStaffAdvances = useMemo(() => {
    return parties
      .filter((p) => p.category === "STAFF")
      .reduce((sum, p) => sum + (p.currentBalance ?? p.openingBalance ?? 0), 0);
  }, [parties]);

  const totalPartiesPages = Math.max(1, Math.ceil(parties.length / partiesPageSize));

  const paginatedParties = useMemo(() => {
    const startIndex = (partiesPage - 1) * partiesPageSize;
    return parties.slice(startIndex, startIndex + partiesPageSize);
  }, [parties, partiesPage, partiesPageSize]);

  const handlePartiesGoTo = () => {
    const p = parseInt(partiesGoToInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPartiesPages) {
      setPartiesPage(p);
      setPartiesGoToInput("");
    }
  };

  // -------------------------------------------------------------
  // GL DATA (Search & Select Party, Running Balance)
  // -------------------------------------------------------------
  const filteredGlPartiesList = useMemo(() => {
    if (!glPartySearch.trim()) return parties;
    const q = glPartySearch.toLowerCase();
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q)) ||
        p.category.toLowerCase().includes(q)
    );
  }, [parties, glPartySearch]);

  const selectedGlParty = useMemo(() => {
    if (glSelectedPartyId === "ALL") return null;
    return parties.find((p) => p.id === glSelectedPartyId) || null;
  }, [parties, glSelectedPartyId]);

  const glRows = useMemo(() => {
    let list = [...daybookAccountEntries];
    if (glSelectedPartyId !== "ALL") {
      list = list.filter(
        (e) =>
          e.partyId === glSelectedPartyId ||
          (selectedGlParty && e.partyName.toLowerCase() === selectedGlParty.name.toLowerCase())
      );
    }
    list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    let runningBal = selectedGlParty
      ? selectedGlParty.openingBalanceType === "DR"
        ? selectedGlParty.openingBalance
        : -selectedGlParty.openingBalance
      : 0;

    return list.map((item) => {
      const isOut = item.inOutType === "OUT";
      const debit = isOut ? item.amount : 0;
      const credit = !isOut ? item.amount : 0;

      if (selectedGlParty) {
        if (selectedGlParty.category === "CUSTOMER") {
          runningBal = item.voucherType === "SALES" ? runningBal + item.amount : runningBal - item.amount;
        } else {
          runningBal = item.voucherType === "PURCHASE" ? runningBal + item.amount : runningBal - item.amount;
        }
      } else {
        runningBal = runningBal + debit - credit;
      }

      return {
        ...item,
        debit,
        credit,
        runningBal,
      };
    });
  }, [daybookAccountEntries, glSelectedPartyId, selectedGlParty]);

  const glTotalDebit = useMemo(() => glRows.reduce((s, r) => s + r.debit, 0), [glRows]);
  const glTotalCredit = useMemo(() => glRows.reduce((s, r) => s + r.credit, 0), [glRows]);

  const totalGlPages = Math.max(1, Math.ceil(glRows.length / glPageSize));
  const paginatedGlRows = useMemo(() => {
    const startIndex = (glPage - 1) * glPageSize;
    return glRows.slice(startIndex, startIndex + glPageSize);
  }, [glRows, glPage, glPageSize]);

  const handleGlGoTo = () => {
    const p = parseInt(glGoToInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalGlPages) {
      setGlPage(p);
      setGlGoToInput("");
    }
  };

  // -------------------------------------------------------------
  // FORM HANDLERS
  // -------------------------------------------------------------
  const handleVoucherTypeChange = (type: DaybookVoucherType) => {
    setFormVoucherType(type);
    const map = VOUCHER_TYPE_MAP[type];
    if (map) {
      setFormInOut(map.defaultInOut);
    }
  };

  const handlePartySelectChange = (partyId: string) => {
    setFormPartyId(partyId);
    const p = parties.find((item) => item.id === partyId);
    if (p) {
      setFormPartyName(p.name);
      if (p.category === "VENDOR" && formVoucherType === "EXPENSE") {
        setFormVoucherType("PURCHASE");
        setFormInOut("OUT");
      } else if (p.category === "STAFF" && formVoucherType === "EXPENSE") {
        setFormVoucherType("EMPLOYEE");
        setFormInOut("OUT");
      } else if (p.category === "CUSTOMER" && formVoucherType === "EXPENSE") {
        setFormVoucherType("RECEIVABLE_RECEIVED");
        setFormInOut("IN");
      }
    } else {
      setFormPartyName("");
    }
  };

  const handleSaveOpeningBal = () => {
    const val = parseFloat(editOpeningBalValue);
    if (!isNaN(val) && val >= 0) {
      setOpeningBalanceSetting(val);
      setIsUpdatingOpeningBal(false);
      addToast({
        title: "Opening Balance Updated",
        description: `Set to ${formatNPR(val)}`,
        type: "success",
      });
    }
  };

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      addToast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        type: "error",
      });
      return;
    }

    const matchedParty = parties.find((p) => p.id === formPartyId);
    const vchNum = `VCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    addDaybookAccountEntry({
      voucherNumber: vchNum,
      date: formDate,
      time: formTime,
      partyId: formPartyId || undefined,
      partyName: formPartyName.trim() || matchedParty?.name || "Counter Account",
      partyCategory: matchedParty?.category || "OTHER",
      voucherType: formVoucherType,
      inOutType: formInOut,
      amount: amt,
      paymentMode: formPaymentMode,
      drAmount: formInOut === "IN" ? amt : 0,
      crAmount: formInOut === "OUT" ? amt : 0,
      description: formDescription.trim() || `${VOUCHER_TYPE_MAP[formVoucherType]?.label} entry`,
      referenceNo: formReferenceNo.trim() || undefined,
      recordedBy: currentUser?.name || "Bikash Shrestha",
      outletId: currentOutlet.id,
    });

    // Reset form fields
    setFormAmount("");
    setFormReferenceNo("");
    setFormDescription("");
    setFormPartyId("");
    setFormPartyName("");
    setDaybookPage(1);
  };

  const handlePartySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) return;

    const opBal = parseFloat(partyOpeningBal) || 0;

    if (editingPartyId) {
      updateParty(editingPartyId, {
        name: partyName.trim(),
        category: partyCategory,
        phone: partyPhone.trim() || undefined,
        pan: partyPan.trim() || undefined,
        openingBalance: opBal,
        openingBalanceType: partyOpeningType,
        notes: partyNotes.trim() || undefined,
      });
      setEditingPartyId(null);
    } else {
      addParty({
        name: partyName.trim(),
        category: partyCategory,
        phone: partyPhone.trim() || undefined,
        pan: partyPan.trim() || undefined,
        openingBalance: opBal,
        openingBalanceType: partyOpeningType,
        notes: partyNotes.trim() || undefined,
        outletId: currentOutlet.id,
      });
    }

    // Reset party form
    setPartyName("");
    setPartyPhone("");
    setPartyPan("");
    setPartyOpeningBal("0");
    setPartyNotes("");
  };

  const handleStartEditParty = (p: Party) => {
    setEditingPartyId(p.id);
    setPartyName(p.name);
    setPartyCategory(p.category);
    setPartyPhone(p.phone || "");
    setPartyPan(p.pan || "");
    setPartyOpeningBal((p.openingBalance || 0).toString());
    setPartyOpeningType(p.openingBalanceType || "CR");
    setPartyNotes(p.notes || "");
  };

  const handleCancelPartyEdit = () => {
    setEditingPartyId(null);
    setPartyName("");
    setPartyPhone("");
    setPartyPan("");
    setPartyOpeningBal("0");
    setPartyNotes("");
  };

  return (
    <div className="flex gap-2 min-h-[640px] text-xs">
      {/* -------------------------------------------------------------
          MINI SIDEBAR (Increased width w-20, Daybook, Parties, GL, P&L)
      ------------------------------------------------------------- */}
      <aside className="w-20 shrink-0 bg-white dark:bg-[#101012] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-2.5 gap-1.5 select-none">
        {[
          { id: "daybook", label: "Daybook", icon: BookOpen },
          { id: "parties", label: "Parties", icon: Users },
          { id: "gl", label: "GL", icon: FileText },
          { id: "pl", label: "P&L", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MiniNavTab)}
              title={tab.label}
              className={`w-full py-2.5 px-1 flex flex-col items-center justify-center transition-colors relative ${
                isActive
                  ? "bg-amber-500 text-black font-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] leading-tight mt-1 font-bold uppercase tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-black dark:bg-white" />
              )}
            </button>
          );
        })}
      </aside>

      {/* -------------------------------------------------------------
          MAIN CONTENT AREA
      ------------------------------------------------------------- */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* =============================================================
            TAB 1: DAYBOOK ENTRY (DEFAULT ACTIVE)
        ============================================================= */}
        {activeTab === "daybook" && (
          <div className="space-y-2">
            {/* Top Static Text Values (Just text, no boxes/cards) */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] font-mono">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-zinc-500">
                  Opening:{" "}
                  <strong className="text-zinc-900 dark:text-white font-black">
                    {formatNPR(dailyOpening)}
                  </strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  In (+): <strong>{formatNPR(dailyIn)}</strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-rose-600 dark:text-rose-400">
                  Out (-): <strong>{formatNPR(dailyOut)}</strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-amber-600 dark:text-amber-400 font-black">
                  Closing: {formatNPR(dailyClosing)}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  Rolling Liquidity: <strong>{formatNPR(overallRolling)}</strong>
                </span>
              </div>

              {/* Set Opening Balance inline trigger */}
              <div className="flex items-center gap-1.5 font-sans">
                {isUpdatingOpeningBal ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={editOpeningBalValue}
                      onChange={(e) => setEditOpeningBalValue(e.target.value)}
                      className="w-20 px-1.5 py-0.5 border border-amber-500 text-[11px] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveOpeningBal}
                      className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUpdatingOpeningBal(false)}
                      className="px-1 text-[10px] text-zinc-400 hover:text-zinc-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditOpeningBalValue(openingBalanceSetting.toString());
                      setIsUpdatingOpeningBal(true);
                    }}
                    className="text-[10px] text-amber-500 hover:underline font-bold"
                  >
                    Set Opening Balance
                  </button>
                )}
              </div>
            </div>

            {/* Inline Voucher Entry Form (OPEN BY DEFAULT) */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3">
              <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-2">
                New Daybook Entry
              </div>
              <form onSubmit={handleVoucherSubmit} className="space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {/* Date */}
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">Date</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                    />
                  </div>

                  {/* Voucher Type */}
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">Voucher Type</label>
                    <select
                      value={formVoucherType}
                      onChange={(e) => handleVoucherTypeChange(e.target.value as DaybookVoucherType)}
                      className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                    >
                      <option value="EXPENSE">Expense</option>
                      <option value="SALES">Sales</option>
                      <option value="PURCHASE">Purchase</option>
                      <option value="PURCHASE_RETURN">Purchase Return</option>
                      <option value="SALES_RETURN">Sales Return</option>
                      <option value="EMPLOYEE">Employee / Wage</option>
                      <option value="PAYABLE_PAID">Payable Paid</option>
                      <option value="RECEIVABLE_RECEIVED">Khata Received</option>
                      <option value="CASH_IN">Cash In</option>
                      <option value="CASH_OUT">Cash Out</option>
                    </select>
                  </div>

                  {/* Flow: In / Out */}
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">In / Out</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setFormInOut("IN")}
                        className={`py-1 text-[10px] font-black transition-colors ${
                          formInOut === "IN"
                            ? "bg-emerald-500 text-black font-bold"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        IN
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormInOut("OUT")}
                        className={`py-1 text-[10px] font-black transition-colors ${
                          formInOut === "OUT"
                            ? "bg-rose-500 text-white font-bold"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        OUT
                      </button>
                    </div>
                  </div>

                  {/* Choose Party */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-zinc-500 block mb-0.5">Choose Party</label>
                    <select
                      value={formPartyId}
                      onChange={(e) => handlePartySelectChange(e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                    >
                      <option value="">Counter Account (Walk-in / General)</option>
                      <optgroup label="Vendors">
                        {parties
                          .filter((p) => p.category === "VENDOR")
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Vendor)
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Staff">
                        {parties
                          .filter((p) => p.category === "STAFF")
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Staff)
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Customers">
                        {parties
                          .filter((p) => p.category === "CUSTOMER")
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Khata)
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Other">
                        {parties
                          .filter((p) => p.category === "OTHER")
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Other)
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">Amount (NPR)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="any"
                      placeholder="0.00"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-900 dark:text-white"
                    />
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">Mode</label>
                    <select
                      value={formPaymentMode}
                      onChange={(e) => setFormPaymentMode(e.target.value as any)}
                      className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank</option>
                      <option value="FONEPAY">Fonepay</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* Second row: Ref, Narration, Submit */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ref / Invoice #"
                    value={formReferenceNo}
                    onChange={(e) => setFormReferenceNo(e.target.value)}
                    className="w-full sm:w-36 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Description / Narration..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="flex-1 w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shrink-0 transition-colors"
                  >
                    + Record Entry
                  </button>
                </div>
              </form>
            </div>

            {/* Filter Bar: Just the Specific Date filter, things by default of all */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Filter Date:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setDaybookPage(1);
                  }}
                  className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
                />
                {filterDate && (
                  <button
                    onClick={() => {
                      setFilterDate("");
                      setDaybookPage(1);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-zinc-600 underline"
                  >
                    Show All Dates
                  </button>
                )}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Showing {dateSpecificEntries.length} entries
              </div>
            </div>

            {/* Datatable */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[9px] font-black tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Voucher #</th>
                    <th className="p-2.5">Party</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5 text-center">In / Out</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5">Mode</th>
                    <th className="p-2.5">Narration</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                  {paginatedDaybookEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-zinc-400 font-sans">
                        No entries found for {filterDate || "all dates"}.
                      </td>
                    </tr>
                  ) : (
                    paginatedDaybookEntries.map((item) => {
                      const isIn = item.inOutType === "IN";
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <td className="p-2.5 text-zinc-500 text-[11px] font-sans">
                            {item.date} <span className="text-[10px] text-zinc-400">{item.time}</span>
                          </td>
                          <td className="p-2.5 font-bold text-zinc-900 dark:text-white">
                            #{item.voucherNumber}
                          </td>
                          <td className="p-2.5 font-sans font-bold text-zinc-800 dark:text-zinc-200">
                            {item.partyName}
                          </td>
                          <td className="p-2.5 font-sans text-zinc-600 dark:text-zinc-400">
                            {VOUCHER_TYPE_MAP[item.voucherType]?.label || item.voucherType}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 ${
                                isIn
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isIn ? "+ IN" : "- OUT"}
                            </span>
                          </td>
                          <td
                            className={`p-2.5 text-right font-black ${
                              isIn ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-white"
                            }`}
                          >
                            {isIn ? "+" : "-"}{formatNPR(item.amount)}
                          </td>
                          <td className="p-2.5 font-sans text-zinc-500 text-[11px]">
                            {item.paymentMode}
                          </td>
                          <td className="p-2.5 font-sans text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                            {item.description || "—"}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedVoucherForPrint(item);
                                }}
                                className="p-1 text-zinc-400 hover:text-amber-500"
                                title="Print Voucher"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteDaybookAccountEntry(item.id)}
                                className="p-1 text-zinc-400 hover:text-rose-500"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Pagination with Go to page */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span>
                  Page {daybookPage} of {totalDaybookPages}
                </span>
                <span>•</span>
                <span>
                  Rows:
                  <select
                    value={daybookPageSize}
                    onChange={(e) => {
                      setDaybookPageSize(Number(e.target.value));
                      setDaybookPage(1);
                    }}
                    className="ml-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] px-1 py-0.5"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Previous / Next */}
                <div className="flex items-center gap-1">
                  <button
                    disabled={daybookPage <= 1}
                    onClick={() => setDaybookPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    disabled={daybookPage >= totalDaybookPages}
                    onClick={() => setDaybookPage((p) => Math.min(totalDaybookPages, p + 1))}
                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Go To Page Input */}
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-zinc-500">Go to:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalDaybookPages}
                    value={daybookGoToInput}
                    onChange={(e) => setDaybookGoToInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDaybookGoTo()}
                    className="w-12 px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono text-[11px]"
                  />
                  <button
                    onClick={handleDaybookGoTo}
                    className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-800 dark:text-zinc-200 font-bold text-[10px]"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================
            TAB 2: PARTIES & KHATA
        ============================================================= */}
        {activeTab === "parties" && (
          <div className="space-y-2">
            {/* Top Static Text Values (small font text, no cards) */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] font-mono">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-zinc-500">
                  Parties:{" "}
                  <strong className="text-zinc-900 dark:text-white font-bold">{parties.length}</strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-amber-600 dark:text-amber-400">
                  Vendor Payables (Cr): <strong>{formatNPR(totalVendorPayables)}</strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Customer Receivables (Dr): <strong>{formatNPR(totalCustomerReceivables)}</strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-blue-600 dark:text-blue-400">
                  Staff Advances (Dr): <strong>{formatNPR(totalStaffAdvances)}</strong>
                </span>
              </div>
            </div>

            {/* Inline Party Form (OPEN BY DEFAULT) */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  {editingPartyId ? "Edit Party Record" : "Add New Party"}
                </span>
                {editingPartyId && (
                  <button
                    onClick={handleCancelPartyEdit}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handlePartySubmit} className="space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">Party Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Valley Poultry"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">Party Type *</label>
                    <select
                      value={partyCategory}
                      onChange={(e) => setPartyCategory(e.target.value as PartyCategory)}
                      className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                    >
                      <option value="VENDOR">Vendor</option>
                      <option value="STAFF">Staff</option>
                      <option value="CUSTOMER">Customer (Khata)</option>
                      <option value="OTHER">Other</option>
                      {customPartyTypes
                        .filter((t) => !["VENDOR", "STAFF", "CUSTOMER", "OTHER"].includes(t))
                        .map((t) => (
                          <option key={t} value={t}>
                            {t} (Custom)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">Phone Number</label>
                    <input
                      type="text"
                      placeholder="9841..."
                      value={partyPhone}
                      onChange={(e) => setPartyPhone(e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">PAN / Tax ID</label>
                    <input
                      type="text"
                      placeholder="9-digit PAN"
                      value={partyPan}
                      onChange={(e) => setPartyPan(e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 block mb-0.5">Opening Balance</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min={0}
                        value={partyOpeningBal}
                        onChange={(e) => setPartyOpeningBal(e.target.value)}
                        className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white font-mono"
                      />
                      <select
                        value={partyOpeningType}
                        onChange={(e) => setPartyOpeningType(e.target.value as any)}
                        className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold"
                      >
                        <option value="CR">Cr</option>
                        <option value="DR">Dr</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-colors"
                    >
                      {editingPartyId ? "Save Changes" : "+ Save Party"}
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Notes / Credit terms..."
                    value={partyNotes}
                    onChange={(e) => setPartyNotes(e.target.value)}
                    className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-900 dark:text-white"
                  />
                </div>
              </form>
            </div>

            {/* Parties Table */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[9px] font-black tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-2.5">Party Name</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Phone & PAN</th>
                    <th className="p-2.5 text-right">Opening</th>
                    <th className="p-2.5 text-right">In (Cr)</th>
                    <th className="p-2.5 text-right">Out (Dr)</th>
                    <th className="p-2.5 text-right">Current Balance</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                  {paginatedParties.map((p) => {
                    const net = p.currentBalance ?? p.openingBalance;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="p-2.5 font-sans font-bold text-zinc-900 dark:text-white">
                          {p.name}
                        </td>
                        <td className="p-2.5 font-sans">
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-2.5 text-zinc-500 text-[11px]">
                          {p.phone || "—"} {p.pan ? `• ${p.pan}` : ""}
                        </td>
                        <td className="p-2.5 text-right text-zinc-600 dark:text-zinc-400">
                          {formatNPR(p.openingBalance)} ({p.openingBalanceType})
                        </td>
                        <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                          +{formatNPR(p.totalIn || 0)}
                        </td>
                        <td className="p-2.5 text-right text-rose-600 dark:text-rose-400">
                          -{formatNPR(p.totalOut || 0)}
                        </td>
                        <td className="p-2.5 text-right font-black text-amber-500">
                          {formatNPR(net)}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setGlSelectedPartyId(p.id);
                                setActiveTab("gl");
                              }}
                              className="text-[10px] text-zinc-500 hover:text-amber-500 underline font-sans"
                            >
                              GL
                            </button>
                            <button
                              onClick={() => handleStartEditParty(p)}
                              className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                              title="Edit"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteParty(p.id)}
                              className="p-1 text-zinc-400 hover:text-rose-500"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination with Go to page */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span>
                  Page {partiesPage} of {totalPartiesPages}
                </span>
                <span>•</span>
                <span>
                  Rows:
                  <select
                    value={partiesPageSize}
                    onChange={(e) => {
                      setPartiesPageSize(Number(e.target.value));
                      setPartiesPage(1);
                    }}
                    className="ml-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] px-1 py-0.5"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    disabled={partiesPage <= 1}
                    onClick={() => setPartiesPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    disabled={partiesPage >= totalPartiesPages}
                    onClick={() => setPartiesPage((p) => Math.min(totalPartiesPages, p + 1))}
                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-zinc-500">Go to:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPartiesPages}
                    value={partiesGoToInput}
                    onChange={(e) => setPartiesGoToInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePartiesGoTo()}
                    className="w-12 px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono text-[11px]"
                  />
                  <button
                    onClick={handlePartiesGoTo}
                    className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-800 dark:text-zinc-200 font-bold text-[10px]"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================
            TAB 3: GENERAL LEDGER (GL)
        ============================================================= */}
        {activeTab === "gl" && (
          <div className="space-y-2">
            {/* Search & Select Party bar */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] font-black uppercase text-zinc-500 whitespace-nowrap">
                  Search & Select Party:
                </span>
                <input
                  type="text"
                  placeholder="Type to search party..."
                  value={glPartySearch}
                  onChange={(e) => setGlPartySearch(e.target.value)}
                  className="w-40 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white"
                />
                <select
                  value={glSelectedPartyId}
                  onChange={(e) => {
                    setGlSelectedPartyId(e.target.value);
                    setGlPage(1);
                  }}
                  className="flex-1 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white font-bold"
                >
                  <option value="ALL">All Parties (Master GL)</option>
                  {filteredGlPartiesList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 shrink-0"
              >
                Print GL
              </button>
            </div>

            {/* Small static text values (no cards) */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
              <span className="text-zinc-500">
                Selected:{" "}
                <strong className="text-zinc-900 dark:text-white font-sans font-bold">
                  {selectedGlParty ? selectedGlParty.name : "All Parties Master GL"}
                </strong>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-zinc-500">
                Opening:{" "}
                <strong>
                  {selectedGlParty
                    ? `${formatNPR(selectedGlParty.openingBalance)} (${selectedGlParty.openingBalanceType})`
                    : "NPR 0"}
                </strong>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-rose-600 dark:text-rose-400">
                Debit (Dr): <strong>{formatNPR(glTotalDebit)}</strong>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Credit (Cr): <strong>{formatNPR(glTotalCredit)}</strong>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-amber-500 font-bold">
                Net Closing:{" "}
                <strong>
                  {selectedGlParty
                    ? formatNPR(selectedGlParty.currentBalance ?? selectedGlParty.openingBalance)
                    : formatNPR(Math.abs(glTotalDebit - glTotalCredit))}
                </strong>
              </span>
            </div>

            {/* GL Statement Table */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[9px] font-black tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Voucher #</th>
                    <th className="p-2.5">Party</th>
                    <th className="p-2.5">Particulars</th>
                    <th className="p-2.5 text-right">Debit (Dr)</th>
                    <th className="p-2.5 text-right">Credit (Cr)</th>
                    <th className="p-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                  {paginatedGlRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-zinc-400 font-sans">
                        No ledger entries recorded for this party.
                      </td>
                    </tr>
                  ) : (
                    paginatedGlRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="p-2.5 text-zinc-500 text-[11px] font-sans">
                          {row.date} <span className="text-[10px] text-zinc-400">{row.time}</span>
                        </td>
                        <td className="p-2.5 font-bold text-zinc-900 dark:text-white">
                          #{row.voucherNumber}
                        </td>
                        <td className="p-2.5 font-sans font-bold text-zinc-800 dark:text-zinc-200">
                          {row.partyName}
                        </td>
                        <td className="p-2.5 font-sans text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                          {row.description}
                        </td>
                        <td className="p-2.5 text-right text-rose-600 dark:text-rose-400">
                          {row.debit > 0 ? formatNPR(row.debit) : "—"}
                        </td>
                        <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                          {row.credit > 0 ? formatNPR(row.credit) : "—"}
                        </td>
                        <td className="p-2.5 text-right font-black text-zinc-900 dark:text-white">
                          {formatNPR(Math.abs(row.runningBal))}
                          <span className="text-[9px] text-zinc-400 ml-1">
                            {row.runningBal >= 0 ? "Dr" : "Cr"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination with Go to page */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span>
                  Page {glPage} of {totalGlPages}
                </span>
                <span>•</span>
                <span>
                  Rows:
                  <select
                    value={glPageSize}
                    onChange={(e) => {
                      setGlPageSize(Number(e.target.value));
                      setGlPage(1);
                    }}
                    className="ml-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] px-1 py-0.5"
                  >
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    disabled={glPage <= 1}
                    onClick={() => setGlPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    disabled={glPage >= totalGlPages}
                    onClick={() => setGlPage((p) => Math.min(totalGlPages, p + 1))}
                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-zinc-500">Go to:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalGlPages}
                    value={glGoToInput}
                    onChange={(e) => setGlGoToInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGlGoTo()}
                    className="w-12 px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono text-[11px]"
                  />
                  <button
                    onClick={handleGlGoTo}
                    className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-800 dark:text-zinc-200 font-bold text-[10px]"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================
            TAB 5: P&L SUMMARY (PL)
        ============================================================= */}
        {activeTab === "pl" && (
          <div className="space-y-2">
            {/* Small static text values (no cards) */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
              <span className="text-emerald-600 dark:text-emerald-400">
                Total Inflow: <strong>{formatNPR(totalInAll)}</strong>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-rose-600 dark:text-rose-400">
                Total Outflow: <strong>{formatNPR(totalOutAll)}</strong>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-amber-500 font-bold">
                Operating Cash Margin: <strong>{formatNPR(totalInAll - totalOutAll)}</strong>
              </span>
            </div>

            {/* Concise Breakdown Table */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 font-mono text-xs">
              <div className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                Financial Breakdown by Voucher Types
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {[
                  { label: "Sales Revenue (Counter & Online)", type: "SALES", inOut: "IN" },
                  { label: "Khata Collections Received", type: "RECEIVABLE_RECEIVED", inOut: "IN" },
                  { label: "Supplier Purchase Returns", type: "PURCHASE_RETURN", inOut: "IN" },
                  { label: "Inward Vendor Purchases", type: "PURCHASE", inOut: "OUT" },
                  { label: "Supplier Payables Paid", type: "PAYABLE_PAID", inOut: "OUT" },
                  { label: "Employee Wages & Staff Advances", type: "EMPLOYEE", inOut: "OUT" },
                  { label: "Store Utilities & Operating Expenses", type: "EXPENSE", inOut: "OUT" },
                  { label: "Sales Returns & Customer Refunds", type: "SALES_RETURN", inOut: "OUT" },
                ].map((item) => {
                  const subTotal = daybookAccountEntries
                    .filter((e) => e.voucherType === item.type)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const isIn = item.inOut === "IN";
                  return (
                    <div
                      key={item.type}
                      className="py-1.5 flex items-center justify-between text-zinc-700 dark:text-zinc-300"
                    >
                      <span className="font-sans text-[11px]">{item.label}</span>
                      <span
                        className={`font-bold ${
                          isIn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIn ? "+" : "-"}{formatNPR(subTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          PRINT VOUCHER SLIP MODAL
      ------------------------------------------------------------- */}
      {selectedVoucherForPrint && (
        <Modal
          isOpen={!!selectedVoucherForPrint}
          onClose={() => setSelectedVoucherForPrint(null)}
          title="Voucher Slip Preview"
        >
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="text-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div className="font-black text-sm uppercase text-zinc-900 dark:text-white">
                  {orgSettings.brandName}
                </div>
                <div className="text-[10px] text-zinc-500 font-sans">
                  {currentOutlet.name} • PAN: {orgSettings.panNumber}
                </div>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Voucher #: {selectedVoucherForPrint.voucherNumber}</span>
                <span>Date: {selectedVoucherForPrint.date}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Party: {selectedVoucherForPrint.partyName}</span>
                <span>Mode: {selectedVoucherForPrint.paymentMode}</span>
              </div>
              <div className="flex justify-between font-black text-sm py-1 border-y border-zinc-200 dark:border-zinc-800">
                <span>Amount:</span>
                <span>{formatNPR(selectedVoucherForPrint.amount)}</span>
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 italic">
                Narration: {selectedVoucherForPrint.description}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedVoucherForPrint(null)}
                className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-amber-500 text-black text-xs font-bold"
              >
                Print Slip
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
