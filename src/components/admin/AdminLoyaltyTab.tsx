import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Phone,
  Search,
  UserCheck,
  Gift,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Filter,
  Check,
  X,
  Tag,
  Percent,
  TrendingUp,
  Sliders,
  History,
  Users,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatNPR } from "../../lib/utils";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";
import { LoyaltyVisitRule, AppliedLoyaltyDiscount } from "../../types";

type LoyaltyTabSubView = "RULES" | "APPLIED_LOG" | "CUSTOMERS";

export const AdminLoyaltyTab: React.FC = () => {
  const {
    loyaltyRecords,
    loyaltySettings,
    updateLoyaltySettings,
    lookupLoyaltyByPhone,
    recordCustomerVisit,
    appliedLoyaltyDiscounts,
  } = useApp();

  // Active view: Rules Manager, Applied Discounts Log, or Customers Directory
  const [activeSubView, setActiveSubView] = useState<LoyaltyTabSubView>("RULES");

  // Filter states
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerVisitFilter, setCustomerVisitFilter] = useState<string>("ALL");
  const [customerSortBy, setCustomerSortBy] = useState<"VISITS" | "SPENT" | "POINTS" | "RECENT">("VISITS");

  const [appliedLogSearch, setAppliedLogSearch] = useState("");
  const [appliedLogVisitFilter, setAppliedLogVisitFilter] = useState<string>("ALL");
  const [appliedLogTypeFilter, setAppliedLogTypeFilter] = useState<string>("ALL");

  // Rule Modal state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LoyaltyVisitRule | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleVisitCount, setRuleVisitCount] = useState<number>(2);
  const [ruleVisitOperator, setRuleVisitOperator] = useState<"EXACT" | "GTE">("EXACT");
  const [ruleMinAmount, setRuleMinAmount] = useState<string>("400");
  const [ruleMaxAmount, setRuleMaxAmount] = useState<string>("1500");
  const [ruleDiscountType, setRuleDiscountType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [ruleDiscountValue, setRuleDiscountValue] = useState<string>("10");
  const [ruleIsActive, setRuleIsActive] = useState<boolean>(true);
  const [ruleDescription, setRuleDescription] = useState("");

  // Manual visit credit modal
  const [isManualVisitModalOpen, setIsManualVisitModalOpen] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualAmount, setManualAmount] = useState("850");

  // Global Revisit Offer Toggle
  const [revisitOfferEnabled, setRevisitOfferEnabled] = useState(
    loyaltySettings.revisitOfferEnabled ?? true
  );

  // Active Rules from Settings
  const visitRules = loyaltySettings.visitRules || [];

  // Toggle Global Enable
  const handleToggleGlobalOffer = (enabled: boolean) => {
    setRevisitOfferEnabled(enabled);
    updateLoyaltySettings({ revisitOfferEnabled: enabled });
  };

  // Open Create Rule Modal
  const handleOpenCreateRule = () => {
    setEditingRule(null);
    setRuleName("");
    setRuleVisitCount(2);
    setRuleVisitOperator("EXACT");
    setRuleMinAmount("400");
    setRuleMaxAmount("1500");
    setRuleDiscountType("PERCENT");
    setRuleDiscountValue("10");
    setRuleIsActive(true);
    setRuleDescription("");
    setIsRuleModalOpen(true);
  };

  // Open Edit Rule Modal
  const handleOpenEditRule = (rule: LoyaltyVisitRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRuleVisitCount(rule.visitCount);
    setRuleVisitOperator(rule.visitOperator || "EXACT");
    setRuleMinAmount(rule.minPurchaseAmount ? String(rule.minPurchaseAmount) : "0");
    setRuleMaxAmount(rule.maxPurchaseAmount ? String(rule.maxPurchaseAmount) : "");
    setRuleDiscountType(rule.discountType);
    setRuleDiscountValue(String(rule.discountValue));
    setRuleIsActive(rule.isActive);
    setRuleDescription(rule.description || "");
    setIsRuleModalOpen(true);
  };

  // Save Rule (Create or Update)
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const minAmt = parseFloat(ruleMinAmount) || 0;
    const maxAmt = ruleMaxAmount.trim() ? parseFloat(ruleMaxAmount) || undefined : undefined;
    const discVal = parseFloat(ruleDiscountValue) || 0;

    const payload: LoyaltyVisitRule = {
      id: editingRule ? editingRule.id : `vr-${Date.now()}`,
      name: ruleName.trim(),
      visitCount: Math.max(1, ruleVisitCount),
      visitOperator: ruleVisitOperator,
      minPurchaseAmount: minAmt,
      maxPurchaseAmount: maxAmt,
      discountType: ruleDiscountType,
      discountValue: discVal,
      isActive: ruleIsActive,
      description:
        ruleDescription.trim() ||
        `${discVal}${ruleDiscountType === "PERCENT" ? "%" : " NPR"} off on visit #${ruleVisitCount}${
          minAmt ? ` for orders min NPR ${minAmt}` : ""
        }${maxAmt ? ` up to NPR ${maxAmt}` : ""}`,
    };

    let updatedRules: LoyaltyVisitRule[];
    if (editingRule) {
      updatedRules = visitRules.map((r) => (r.id === editingRule.id ? payload : r));
    } else {
      updatedRules = [...visitRules, payload];
    }

    updateLoyaltySettings({ visitRules: updatedRules });
    setIsRuleModalOpen(false);
  };

  // Delete Rule
  const handleDeleteRule = (ruleId: string) => {
    const updated = visitRules.filter((r) => r.id !== ruleId);
    updateLoyaltySettings({ visitRules: updated });
  };

  // Toggle Rule Status
  const handleToggleRuleStatus = (ruleId: string) => {
    const updated = visitRules.map((r) =>
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    );
    updateLoyaltySettings({ visitRules: updated });
  };

  // Manual visit credit submit
  const handleManualVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone.trim()) return;
    recordCustomerVisit(manualPhone, manualName, parseFloat(manualAmount) || 0);
    setIsManualVisitModalOpen(false);
    setManualPhone("");
    setManualName("");
  };

  // -------------------------------------------------------------
  // Filtered Applied Discounts Log
  // -------------------------------------------------------------
  const filteredAppliedDiscounts = useMemo(() => {
    return appliedLoyaltyDiscounts.filter((rec) => {
      if (appliedLogSearch.trim()) {
        const q = appliedLogSearch.toLowerCase();
        const matchesQuery =
          rec.orderNumber.toLowerCase().includes(q) ||
          rec.customerName.toLowerCase().includes(q) ||
          rec.customerPhone.includes(q) ||
          rec.ruleName.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (appliedLogVisitFilter !== "ALL") {
        const targetVisit = parseInt(appliedLogVisitFilter);
        if (targetVisit === 5) {
          if (rec.visitNumber < 5) return false;
        } else {
          if (rec.visitNumber !== targetVisit) return false;
        }
      }
      if (appliedLogTypeFilter !== "ALL" && rec.discountType !== appliedLogTypeFilter) {
        return false;
      }
      return true;
    });
  }, [appliedLoyaltyDiscounts, appliedLogSearch, appliedLogVisitFilter, appliedLogTypeFilter]);

  const totalDiscountAmountGranted = useMemo(() => {
    return appliedLoyaltyDiscounts.reduce((sum, r) => sum + r.discountAmount, 0);
  }, [appliedLoyaltyDiscounts]);

  const filteredDiscountSum = useMemo(() => {
    return filteredAppliedDiscounts.reduce((sum, r) => sum + r.discountAmount, 0);
  }, [filteredAppliedDiscounts]);

  // -------------------------------------------------------------
  // Filtered & Sorted Customer Records
  // -------------------------------------------------------------
  const filteredCustomers = useMemo(() => {
    let result = loyaltyRecords.filter((rec) => {
      if (customerSearchQuery.trim()) {
        const q = customerSearchQuery.toLowerCase();
        const matches =
          rec.phone.includes(q) ||
          rec.name.toLowerCase().includes(q) ||
          (rec.notes && rec.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (customerVisitFilter === "1") {
        if (rec.visitCount !== 1) return false;
      } else if (customerVisitFilter === "2") {
        if (rec.visitCount !== 2) return false;
      } else if (customerVisitFilter === "3_PLUS") {
        if (rec.visitCount < 3) return false;
      } else if (customerVisitFilter === "5_PLUS") {
        if (rec.visitCount < 5) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (customerSortBy === "VISITS") return b.visitCount - a.visitCount;
      if (customerSortBy === "SPENT") return b.totalSpent - a.totalSpent;
      if (customerSortBy === "POINTS") return b.loyaltyPoints - a.loyaltyPoints;
      return new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime();
    });

    return result;
  }, [loyaltyRecords, customerSearchQuery, customerVisitFilter, customerSortBy]);

  // Summary Metrics
  const totalLoyalCustomers = loyaltyRecords.length;
  const repeatVisitors = loyaltyRecords.filter((r) => r.visitCount > 1).length;
  const repeatRate = totalLoyalCustomers > 0 ? Math.round((repeatVisitors / totalLoyalCustomers) * 100) : 0;
  const activeRulesCount = visitRules.filter((r) => r.isActive).length;
  const totalPointsCirculating = loyaltyRecords.reduce((sum, r) => sum + r.loyaltyPoints, 0);

  return (
    <div className="space-y-3.5">
      {/* -------------------------------------------------------------
          TOP HIGH-DENSITY LABEL-VALUE METRIC STRIP
      ------------------------------------------------------------- */}
      <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Registered Customers:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {totalLoyalCustomers}
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Repeat Visitors:</span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
              {repeatVisitors} <span className="text-[10px] text-zinc-400 font-normal">({repeatRate}%)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active Visit Rules:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {activeRulesCount} active
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Loyalty Discounts Granted:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {formatNPR(totalDiscountAmountGranted)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Points in Circulation:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {totalPointsCirculating} pts
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleOpenCreateRule}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] h-7 px-2.5"
          >
            + New Visit Rule
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsManualVisitModalOpen(true)}
            leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            className="text-[11px] h-7 px-2.5 border-zinc-300 dark:border-zinc-700"
          >
            Manual Visit Credit
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SUB-VIEWS NAVIGATION TABS & STATUS INDICATOR
      ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSubView("RULES")}
            className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeSubView === "RULES"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Visit-Count & Bill Range Rules ({visitRules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView("APPLIED_LOG")}
            className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeSubView === "APPLIED_LOG"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Applied Discounts Log ({appliedLoyaltyDiscounts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView("CUSTOMERS")}
            className={`px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeSubView === "CUSTOMERS"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customer Directory ({loyaltyRecords.length})</span>
          </button>
        </div>

        {/* Lifetime Loyalty status info (Explicitly no token reset) */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Continuous Lifetime Loyalty (No Token Reset)
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          VIEW 1: VISIT-COUNT & BILL AMOUNT RANGE RULES MANAGER
      ------------------------------------------------------------- */}
      {activeSubView === "RULES" && (
        <div className="space-y-3">
          {/* Rules Banner info */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-500" />
                Visit-Based & Purchase Amount Tier Engine
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Configure personalized discounts for specific visits (e.g. 2nd visit, 3rd visit, or milestone visits) when customer bill is within designated amount ranges. Tokens never reset or expire.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                <input
                  type="checkbox"
                  checked={revisitOfferEnabled}
                  onChange={(e) => handleToggleGlobalOffer(e.target.checked)}
                  className="accent-amber-500 cursor-pointer"
                />
                <span>Enable Automated Loyalty Offers</span>
              </label>
            </div>
          </div>

          {/* Rules Table */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
                  <th className="p-2.5">Rule Name & Objective</th>
                  <th className="p-2.5 text-center">Visit Trigger</th>
                  <th className="p-2.5 text-center">Bill Amount Range</th>
                  <th className="p-2.5 text-center">Discount Value</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {visitRules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-zinc-400 text-xs">
                      No visit rules configured yet. Click "+ New Visit Rule" to create one.
                    </td>
                  </tr>
                ) : (
                  visitRules.map((rule) => {
                    const isExact = rule.visitOperator !== "GTE";
                    const hasMax = rule.maxPurchaseAmount && rule.maxPurchaseAmount > 0;

                    return (
                      <tr
                        key={rule.id}
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors ${
                          !rule.isActive ? "opacity-60 bg-zinc-100/40 dark:bg-zinc-900/20" : ""
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{rule.name}</span>
                          </div>
                          {rule.description && (
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-md truncate">
                              {rule.description}
                            </div>
                          )}
                        </td>

                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-mono font-bold border ${
                              isExact
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                            }`}
                          >
                            {isExact ? `Visit #${rule.visitCount} (Exact)` : `Visit #${rule.visitCount}+ (Milestone)`}
                          </span>
                        </td>

                        <td className="p-2.5 text-center font-mono text-[11px]">
                          {hasMax ? (
                            <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                              {formatNPR(rule.minPurchaseAmount)} – {formatNPR(rule.maxPurchaseAmount!)}
                            </span>
                          ) : (
                            <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                              ≥ {formatNPR(rule.minPurchaseAmount)} (No limit)
                            </span>
                          )}
                        </td>

                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 text-[11px] font-mono font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {rule.discountType === "PERCENT"
                              ? `${rule.discountValue}% OFF`
                              : `NPR ${rule.discountValue} FLAT`}
                          </span>
                        </td>

                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRuleStatus(rule.id)}
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer border ${
                              rule.isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700"
                            }`}
                          >
                            {rule.isActive ? "Active" : "Disabled"}
                          </button>
                        </td>

                        <td className="p-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditRule(rule)}
                              title="Edit rule"
                              className="p-1 text-zinc-500 hover:text-amber-500 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id)}
                              title="Delete rule"
                              className="p-1 text-zinc-500 hover:text-rose-500 cursor-pointer"
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
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 2: ALL APPLIED LOYALTY DISCOUNTS LOG (AUDIT TRAIL)
      ------------------------------------------------------------- */}
      {activeSubView === "APPLIED_LOG" && (
        <div className="space-y-3">
          {/* Simple text filter bar directly above datatable */}
          <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={appliedLogSearch}
                  onChange={(e) => setAppliedLogSearch(e.target.value)}
                  placeholder="Search by order #, customer phone or rule..."
                  className="w-full h-8 pl-8 pr-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Visit Count Filter */}
              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <span>Visit:</span>
                <select
                  value={appliedLogVisitFilter}
                  onChange={(e) => setAppliedLogVisitFilter(e.target.value)}
                  className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Visits</option>
                  <option value="2">Visit #2 (Welcome)</option>
                  <option value="3">Visit #3 (Patron)</option>
                  <option value="4">Visit #4</option>
                  <option value="5">Visit #5+ (VIP)</option>
                </select>
              </div>

              {/* Discount Type Filter */}
              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <span>Type:</span>
                <select
                  value={appliedLogTypeFilter}
                  onChange={(e) => setAppliedLogTypeFilter(e.target.value)}
                  className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Discounts</option>
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (NPR)</option>
                </select>
              </div>

              {(appliedLogSearch || appliedLogVisitFilter !== "ALL" || appliedLogTypeFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedLogSearch("");
                    setAppliedLogVisitFilter("ALL");
                    setAppliedLogTypeFilter("ALL");
                  }}
                  className="text-[11px] text-rose-500 hover:underline px-1 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Simple text metrics summary */}
            <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              <span>Records: <strong>{filteredAppliedDiscounts.length}</strong></span>
              <span>•</span>
              <span>
                Discounts Total: <strong className="text-emerald-600 dark:text-emerald-400">{formatNPR(filteredDiscountSum)}</strong>
              </span>
            </div>
          </div>

          {/* Applied Discounts Datatable */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
                  <th className="p-2.5">Order No. & Date</th>
                  <th className="p-2.5">Customer Details</th>
                  <th className="p-2.5 text-center">Visit #</th>
                  <th className="p-2.5 text-right">Order Subtotal</th>
                  <th className="p-2.5">Applied Loyalty Rule</th>
                  <th className="p-2.5 text-right">Discount Saved</th>
                  <th className="p-2.5 text-right">Final Settled</th>
                  <th className="p-2.5">Outlet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:border-zinc-800">
                {filteredAppliedDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-zinc-400 text-xs">
                      No applied discounts match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAppliedDiscounts.map((rec) => (
                    <tr key={rec.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-2.5">
                        <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          #{rec.orderNumber}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {rec.appliedAt}
                        </div>
                      </td>

                      <td className="p-2.5">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {rec.customerName}
                        </div>
                        <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-zinc-400" />
                          {rec.customerPhone}
                        </div>
                      </td>

                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          Visit #{rec.visitNumber}
                        </span>
                      </td>

                      <td className="p-2.5 text-right font-mono text-zinc-600 dark:text-zinc-400">
                        {formatNPR(rec.subtotal)}
                      </td>

                      <td className="p-2.5">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
                          {rec.ruleName}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {rec.discountType === "PERCENT" ? `${rec.discountValue}% applied` : `Flat NPR ${rec.discountValue}`}
                        </div>
                      </td>

                      <td className="p-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        -{formatNPR(rec.discountAmount)}
                      </td>

                      <td className="p-2.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {formatNPR(rec.finalAmount)}
                      </td>

                      <td className="p-2.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                        {rec.outletName || "Crunchy - Durbar Marg"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 3: CUSTOMER LOYALTY DIRECTORY & VISITS
      ------------------------------------------------------------- */}
      {activeSubView === "CUSTOMERS" && (
        <div className="space-y-3">
          {/* Simple text filters directly above datatable */}
          <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search customer by name or phone..."
                  className="w-full h-8 pl-8 pr-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <span>Visits:</span>
                <select
                  value={customerVisitFilter}
                  onChange={(e) => setCustomerVisitFilter(e.target.value)}
                  className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Visits</option>
                  <option value="1">1st Visit Only</option>
                  <option value="2">2nd Visit (Welcome Eligible)</option>
                  <option value="3_PLUS">3+ Visits (Repeat)</option>
                  <option value="5_PLUS">5+ Visits (VIP Milestone)</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <span>Sort by:</span>
                <select
                  value={customerSortBy}
                  onChange={(e) => setCustomerSortBy(e.target.value as any)}
                  className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="VISITS">Most Visits</option>
                  <option value="SPENT">Highest Spend</option>
                  <option value="POINTS">Reward Points</option>
                  <option value="RECENT">Recent Visit Date</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 font-mono">
              Matching Members: <strong>{filteredCustomers.length}</strong> / {loyaltyRecords.length}
            </div>
          </div>

          {/* Customer Datatable */}
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
                  <th className="p-2.5">Customer Name & Phone</th>
                  <th className="p-2.5 text-center">Visit Count</th>
                  <th className="p-2.5">Next Visit Eligibility</th>
                  <th className="p-2.5 text-right">Lifetime Spent</th>
                  <th className="p-2.5 text-center">Loyalty Points</th>
                  <th className="p-2.5">First Visit</th>
                  <th className="p-2.5">Last Visit</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-zinc-400 text-xs">
                      No customer profiles matched your query.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((rec) => {
                    const upcomingVisit = rec.visitCount + 1;
                    const matchingUpcomingRule = visitRules.find(
                      (r) =>
                        r.isActive &&
                        (r.visitOperator === "GTE"
                          ? upcomingVisit >= r.visitCount
                          : r.visitCount === upcomingVisit)
                    );

                    return (
                      <tr key={rec.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="p-2.5">
                          <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {rec.phone}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{rec.name}</div>
                        </td>

                        <td className="p-2.5 text-center">
                          <span className="font-mono font-black text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700">
                            {rec.visitCount} visits
                          </span>
                        </td>

                        <td className="p-2.5">
                          {matchingUpcomingRule ? (
                            <div className="text-[11px]">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                Visit #{upcomingVisit}:
                              </span>{" "}
                              <span className="text-zinc-700 dark:text-zinc-300">
                                {matchingUpcomingRule.discountType === "PERCENT"
                                  ? `${matchingUpcomingRule.discountValue}% OFF`
                                  : `NPR ${matchingUpcomingRule.discountValue} OFF`}
                              </span>{" "}
                              <span className="text-[10px] text-zinc-400 font-mono">
                                (orders ≥ {formatNPR(matchingUpcomingRule.minPurchaseAmount)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-400">
                              No specific rule for Visit #{upcomingVisit}
                            </span>
                          )}
                        </td>

                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNPR(rec.totalSpent)}
                        </td>

                        <td className="p-2.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                          {rec.loyaltyPoints} pts
                        </td>

                        <td className="p-2.5 text-zinc-500 text-[11px]">{rec.firstVisitDate}</td>
                        <td className="p-2.5 text-zinc-500 text-[11px]">{rec.lastVisitDate}</td>

                        <td className="p-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setManualPhone(rec.phone);
                              setManualName(rec.name);
                              setIsManualVisitModalOpen(true);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                          >
                            Credit Bill
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: ADD / EDIT VISIT-COUNT & AMOUNT RANGE RULE
      ------------------------------------------------------------- */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title={editingRule ? "Edit Visit Discount Rule" : "Create Visit Discount Rule"}
      >
        <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
          {/* Rule Name */}
          <div>
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Rule Name & Title *
            </label>
            <Input
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g. 2nd Visit Welcome Offer, 3rd Visit Feast Deal"
              required
              className="text-xs font-bold"
              autoFocus
            />
          </div>

          {/* Target Visit Count & Operator */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Target Visit Number *
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={ruleVisitCount}
                onChange={(e) => setRuleVisitCount(parseInt(e.target.value) || 1)}
                required
                className="text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                e.g. 2 for 2nd visit, 3 for 3rd visit
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Condition Operator
              </label>
              <select
                value={ruleVisitOperator}
                onChange={(e) => setRuleVisitOperator(e.target.value as "EXACT" | "GTE")}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="EXACT">Exactly on this visit (== {ruleVisitCount})</option>
                <option value="GTE">On this visit & all above (&gt;= {ruleVisitCount})</option>
              </select>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Milestone tier or single visit
              </span>
            </div>
          </div>

          {/* Bill Purchase Amount Range */}
          <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Min Bill Amount (NPR) *
              </label>
              <Input
                type="number"
                min="0"
                value={ruleMinAmount}
                onChange={(e) => setRuleMinAmount(e.target.value)}
                placeholder="0"
                required
                className="text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Order subtotal must be at least this
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Max Bill Amount (NPR)
              </label>
              <Input
                type="number"
                min="0"
                value={ruleMaxAmount}
                onChange={(e) => setRuleMaxAmount(e.target.value)}
                placeholder="Leave blank for no upper limit"
                className="text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                Leave empty for no maximum cap
              </span>
            </div>
          </div>

          {/* Discount Mode & Value */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Discount Type
              </label>
              <select
                value={ruleDiscountType}
                onChange={(e) => setRuleDiscountType(e.target.value as "PERCENT" | "FLAT")}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="PERCENT">Percentage (%) Off</option>
                <option value="FLAT">Flat Amount (NPR) Off</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Discount Value *
              </label>
              <Input
                type="number"
                min="1"
                value={ruleDiscountValue}
                onChange={(e) => setRuleDiscountValue(e.target.value)}
                required
                className="text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-zinc-400 mt-0.5 block">
                {ruleDiscountType === "PERCENT" ? "e.g. 10 for 10% off" : "e.g. 150 for NPR 150 off"}
              </span>
            </div>
          </div>

          {/* Description & Active toggle */}
          <div>
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Description / Receipt Note
            </label>
            <Input
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              placeholder="e.g. 10% off for 2nd visit between NPR 400 and NPR 1,500"
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rule-active-toggle"
              checked={ruleIsActive}
              onChange={(e) => setRuleIsActive(e.target.checked)}
              className="accent-amber-500 cursor-pointer"
            />
            <label htmlFor="rule-active-toggle" className="text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
              Rule is Active and Enabled in POS & Checkout
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRuleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
            >
              {editingRule ? "Update Rule" : "Save Rule"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------------------------------------------------
          MODAL: MANUAL VISIT & BILL CREDIT
      ------------------------------------------------------------- */}
      <Modal
        isOpen={isManualVisitModalOpen}
        onClose={() => setIsManualVisitModalOpen(false)}
        title="Credit Customer Visit & Order by Phone"
      >
        <form onSubmit={handleManualVisitSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Customer Mobile Phone *
            </label>
            <Input
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value)}
              placeholder="e.g. 9841234567"
              required
              className="text-sm font-mono font-bold"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Customer Name
            </label>
            <Input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="e.g. Rohan Shakya"
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Bill Total Amount (NPR) *
            </label>
            <Input
              type="number"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              required
              className="text-sm font-mono font-bold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsManualVisitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
            >
              Record Visit & Add Points
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
