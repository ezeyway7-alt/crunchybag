import { extractErrorMessage } from "../../lib/api";
import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { PricingChannel, TimePricingSchedule } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Plus, Clock, Trash2, Edit3, Search, Sliders } from "lucide-react";

const days: TimePricingSchedule["daysOfWeek"] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const channels: PricingChannel[] = ["web", "qr", "pos", "kiosk"];

export const StaffTimePricing: React.FC = () => {
  const {
    timePricingSchedules,
    currentOutlet,
    products,
    saveTimePricing,
    deleteTimePricing,
    toggleTimePricing,
    addToast,
  } = useApp();

  const [draft, setDraft] = useState<TimePricingSchedule | null>(null);
  const [searchUnassigned, setSearchUnassigned] = useState("");
  const [searchAssigned, setSearchAssigned] = useState("");
  const [error, setError] = useState("");

  const schedules = timePricingSchedules.filter((s) => s.outletId === currentOutlet.id);

  const edit = (s?: TimePricingSchedule) => {
    setError("");
    setSearchUnassigned("");
    setSearchAssigned("");
    setDraft(
      s
        ? {
            ...s,
            adjustmentPercentage: s.adjustmentPercentage ?? -s.discountPercentage,
            channels: s.channels ?? ["web", "qr", "pos", "kiosk"],
          }
        : {
            id: crypto.randomUUID(),
            title: "",
            outletId: currentOutlet.id,
            productIds: [],
            productNames: [],
            daysOfWeek: [...days],
            startTime: "16:00",
            endTime: "19:00",
            adjustmentPercentage: -15,
            discountPercentage: 15,
            channels: ["web"],
            isActive: true,
          }
    );
  };

  const update = (patch: Partial<TimePricingSchedule>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const toggleDay = (day: TimePricingSchedule["daysOfWeek"][number]) => {
    if (!draft) return;
    const exists = draft.daysOfWeek.includes(day);
    update({
      daysOfWeek: exists ? draft.daysOfWeek.filter((d) => d !== day) : [...draft.daysOfWeek, day],
    });
  };

  const toggleAllDays = () => {
    if (!draft) return;
    if (draft.daysOfWeek.length === days.length) {
      update({ daysOfWeek: [] });
    } else {
      update({ daysOfWeek: [...days] });
    }
  };

  const toggleChannel = (channel: PricingChannel) => {
    if (!draft) return;
    const current = draft.channels ?? [];
    const exists = current.includes(channel);
    update({
      channels: exists ? current.filter((c) => c !== channel) : [...current, channel],
    });
  };

  const toggleProduct = (productId: string) => {
    if (!draft) return;
    const exists = draft.productIds.includes(productId);
    update({
      productIds: exists
        ? draft.productIds.filter((id) => id !== productId)
        : [...draft.productIds, productId],
    });
  };

  const unassignedProducts = useMemo(() => {
    if (!draft) return [];
    return products.filter((p) => !draft.productIds.includes(p.id));
  }, [products, draft?.productIds]);

  const assignedProducts = useMemo(() => {
    if (!draft) return [];
    return products.filter((p) => draft.productIds.includes(p.id));
  }, [products, draft?.productIds]);

  const filteredUnassigned = useMemo(() => {
    if (!searchUnassigned.trim()) return unassignedProducts;
    const q = searchUnassigned.toLowerCase();
    return unassignedProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [unassignedProducts, searchUnassigned]);

  const filteredAssigned = useMemo(() => {
    if (!searchAssigned.trim()) return assignedProducts;
    const q = searchAssigned.toLowerCase();
    return assignedProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [assignedProducts, searchAssigned]);

  const assignAllFiltered = () => {
    if (!draft) return;
    const toAdd = filteredUnassigned.map((p) => p.id);
    const next = Array.from(new Set([...draft.productIds, ...toAdd]));
    update({ productIds: next });
  };

  const unassignAll = () => {
    if (!draft) return;
    update({ productIds: [] });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !draft ||
      !draft.title.trim() ||
      !Number.isFinite(draft.adjustmentPercentage) ||
      draft.adjustmentPercentage! < -100 ||
      !draft.channels?.length ||
      !draft.daysOfWeek.length ||
      draft.startTime === draft.endTime
    ) {
      setError(
        "Enter a name, an adjustment of at least -100%, different start/end times, and at least one day and channel."
      );
      return;
    }
    try { await saveTimePricing({
      ...draft,
      title: draft.title.trim(),
      discountPercentage: -(draft.adjustmentPercentage || 0),
      productNames: products.filter((p) => draft.productIds.includes(p.id)).map((p) => p.name),
    }); } catch (error) { setError(extractErrorMessage(error)); return; }
    setDraft(null);
    addToast({ title: "Pricing tier saved", type: "success" });
  };

  return (
    <section className="space-y-2 text-zinc-900 dark:text-zinc-100 text-xs">
      {/* Compact Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 px-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <h2 className="font-bold text-xs uppercase tracking-wider">Time-based Pricing Tiers</h2>
          <span className="text-[10px] text-zinc-400">· {currentOutlet.name} (NPT)</span>
        </div>
        {!draft && (
          <button
            type="button"
            className="px-2.5 py-1 text-xs font-black bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1 transition-colors"
            onClick={() => edit()}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Tier</span>
          </button>
        )}
      </div>

      {/* Tiny Editor Form */}
      {draft && (
        <form
          className="border border-amber-500/70 bg-white dark:bg-zinc-950 p-3 space-y-2.5 shadow-sm"
          onSubmit={handleSave}
        >
          {/* Header Row */}
          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <h3 className="font-black text-xs uppercase tracking-wide">
                {schedules.some((s) => s.id === draft.id) ? "Edit Pricing Tier" : "Create Pricing Tier"}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="px-2.5 py-0.5 text-xs font-bold border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setDraft(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-0.5 text-xs font-black bg-amber-500 hover:bg-amber-400 text-black"
              >
                Save Tier
              </button>
            </div>
          </div>

          {/* Line 1: Tier Name & Operating Days on the SAME line */}
          <div className="flex flex-wrap items-end gap-2.5">
            {/* Tier Name */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">
                Tier Name
              </label>
              <input
                autoFocus
                required
                className="w-full h-7 px-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-amber-500"
                placeholder="e.g. Evening Rush Discount"
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </div>

            {/* Operating Days pills on same line */}
            <div className="shrink-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Operating Days
                </span>
                <button
                  type="button"
                  onClick={toggleAllDays}
                  className="text-[9px] font-bold text-amber-600 dark:text-amber-400 hover:underline ml-2"
                >
                  {draft.daysOfWeek.length === days.length ? "Clear" : "All"}
                </button>
              </div>
              <div className="flex items-center gap-1">
                {days.map((day) => {
                  const active = draft.daysOfWeek.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`h-7 px-2 text-[10px] font-bold border transition-colors ${
                        active
                          ? "bg-amber-500 text-black border-amber-500"
                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Line 2: Time Window & Channels & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5 border-t border-zinc-100 dark:border-zinc-900">
            {/* Time Window */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Time:</span>
              <input
                required
                type="time"
                className="h-6 px-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
                value={draft.startTime}
                onChange={(e) => update({ startTime: e.target.value })}
              />
              <span className="text-zinc-400 text-xs font-bold">→</span>
              <input
                required
                type="time"
                className="h-6 px-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono"
                value={draft.endTime}
                onChange={(e) => update({ endTime: e.target.value })}
              />
              {draft.endTime < draft.startTime && (
                <span className="text-[10px] text-amber-500 font-bold" title="Ends next day">
                  (+1 day)
                </span>
              )}
            </div>

            {/* Channels */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Channels:</span>
              <div className="flex items-center gap-1">
                {channels.map((channel) => {
                  const active = draft.channels?.includes(channel) ?? false;
                  return (
                    <button
                      type="button"
                      key={channel}
                      onClick={() => toggleChannel(channel)}
                      className={`h-6 px-2 text-[10px] font-bold uppercase border transition-colors ${
                        active
                          ? "bg-amber-500 text-black border-amber-500"
                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                      }`}
                    >
                      {channel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enable Tier */}
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none shrink-0 ml-auto">
              <input
                type="checkbox"
                className="accent-amber-500 h-3.5 w-3.5"
                checked={draft.isActive}
                onChange={(e) => update({ isActive: e.target.checked })}
              />
              <span className="text-[11px] font-bold">{draft.isActive ? "Enabled" : "Paused"}</span>
            </label>
          </div>

          {/* Line 3: Price adjustment (%) horizontal drag bar */}
          <div className="p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Price Adjustment (%)
                </span>
                <span className="text-[10px] text-zinc-400">
                  (Drag point along bar: − discount, + increase)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 text-[11px] font-bold border rounded-xs ${
                    (draft.adjustmentPercentage ?? 0) < 0
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : (draft.adjustmentPercentage ?? 0) > 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {(draft.adjustmentPercentage ?? 0) < 0
                    ? `${draft.adjustmentPercentage}% discount`
                    : (draft.adjustmentPercentage ?? 0) > 0
                    ? `+${draft.adjustmentPercentage}% increase`
                    : "0% base price"}
                </span>

                <div className="flex items-center">
                  <input
                    required
                    type="number"
                    min={-100}
                    max={100}
                    step={0.5}
                    className="w-14 h-6 px-1 text-right text-xs font-mono border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                    value={Number.isNaN(draft.adjustmentPercentage) ? "" : draft.adjustmentPercentage}
                    onChange={(e) => update({ adjustmentPercentage: e.target.valueAsNumber || 0 })}
                  />
                  <span className="text-[11px] text-zinc-500 font-bold ml-0.5">%</span>
                </div>
              </div>
            </div>

            {/* Horizontal Range Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                −100%
              </span>
              <div className="relative flex-1 flex items-center py-1">
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  value={Number.isNaN(draft.adjustmentPercentage) ? 0 : draft.adjustmentPercentage ?? 0}
                  onChange={(e) => update({ adjustmentPercentage: Number(e.target.value) })}
                />
              </div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                +100%
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] pt-0.5">
              <div className="flex items-center gap-1">
                <span className="text-zinc-400 font-semibold text-[9px] uppercase">Discount:</span>
                {[-50, -30, -20, -15, -10, -5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => update({ adjustmentPercentage: val })}
                    className={`px-1.5 py-0.2 text-[10px] font-mono border transition-colors ${
                      draft.adjustmentPercentage === val
                        ? "bg-emerald-500 text-white border-emerald-500 font-bold"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500"
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => update({ adjustmentPercentage: 0 })}
                className={`px-1.5 py-0.2 text-[10px] font-mono border transition-colors ${
                  draft.adjustmentPercentage === 0
                    ? "bg-zinc-700 text-white border-zinc-700 font-bold"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-500"
                }`}
              >
                0% (reset)
              </button>

              <div className="flex items-center gap-1">
                <span className="text-zinc-400 font-semibold text-[9px] uppercase">Markup:</span>
                {[5, 10, 15, 20, 30, 50].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => update({ adjustmentPercentage: val })}
                    className={`px-1.5 py-0.2 text-[10px] font-mono border transition-colors ${
                      draft.adjustmentPercentage === val
                        ? "bg-amber-500 text-black border-amber-500 font-bold"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-amber-500"
                    }`}
                  >
                    +{val}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Line 4: Assign Menu Items (Left: Unassigned, Right: Assigned in this Tier) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Assign Menu Items ({draft.productIds.length} chosen)
              </span>
              <span className="text-[10px] text-zinc-400">
                Click any item to move it between unassigned and assigned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Left Column: All Unassigned Items */}
              <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
                <div className="p-1 px-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400">
                    Unassigned ({unassignedProducts.length})
                  </span>
                  <div className="flex items-center gap-1">
                    {unassignedProducts.length > 0 && (
                      <button
                        type="button"
                        onClick={assignAllFiltered}
                        className="text-[9px] font-bold text-amber-600 dark:text-amber-400 hover:underline px-1"
                      >
                        + Assign All
                      </button>
                    )}
                    <div className="relative">
                      <Search className="w-2.5 h-2.5 absolute left-1.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        className="h-5 pl-5 pr-1 text-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-24 sm:w-28"
                        placeholder="Search..."
                        value={searchUnassigned}
                        onChange={(e) => setSearchUnassigned(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-40 overflow-y-auto p-1 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredUnassigned.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[10px] text-zinc-400 p-2 text-center">
                      {searchUnassigned ? "No matching unassigned items" : "All products are assigned"}
                    </div>
                  ) : (
                    filteredUnassigned.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className="w-full text-left p-1 px-1.5 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 flex items-center justify-between gap-1 group transition-colors"
                      >
                        <div className="min-w-0 flex-1 truncate">
                          <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 ml-1.5">{formatNPR(p.basePrice)}</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 opacity-60 group-hover:opacity-100 shrink-0">
                          + Assign
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Assigned in this Tier */}
              <div className="border border-amber-500/40 bg-white dark:bg-zinc-950 flex flex-col">
                <div className="p-1 px-2 border-b border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                    Assigned in Tier ({assignedProducts.length})
                  </span>
                  <div className="flex items-center gap-1">
                    {assignedProducts.length > 0 && (
                      <button
                        type="button"
                        onClick={unassignAll}
                        className="text-[9px] font-bold text-rose-500 hover:underline px-1"
                      >
                        Clear All
                      </button>
                    )}
                    <div className="relative">
                      <Search className="w-2.5 h-2.5 absolute left-1.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        className="h-5 pl-5 pr-1 text-[10px] border border-amber-300 dark:border-amber-700/50 bg-white dark:bg-zinc-900 w-24 sm:w-28"
                        placeholder="Search..."
                        value={searchAssigned}
                        onChange={(e) => setSearchAssigned(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-40 overflow-y-auto p-1 divide-y divide-amber-500/10 dark:divide-zinc-800/60">
                  {filteredAssigned.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[10px] text-zinc-400 p-2 text-center">
                      {searchAssigned
                        ? "No matching assigned items"
                        : "No items assigned yet. Click from left to assign."}
                    </div>
                  ) : (
                    filteredAssigned.map((p) => {
                      const adjPrice = Math.max(
                        0,
                        p.basePrice * (1 + (draft.adjustmentPercentage || 0) / 100)
                      );
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => toggleProduct(p.id)}
                          className="w-full text-left p-1 px-1.5 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 flex items-center justify-between gap-1 group transition-colors"
                          title="Click to unassign anytime"
                        >
                          <div className="min-w-0 flex-1 truncate">
                            <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 ml-1.5">
                              {formatNPR(p.basePrice)}
                              {(draft.adjustmentPercentage ?? 0) !== 0 && (
                                <span
                                  className={
                                    (draft.adjustmentPercentage ?? 0) > 0
                                      ? " text-amber-600 font-bold ml-1"
                                      : " text-emerald-600 font-bold ml-1"
                                  }
                                >
                                  → {formatNPR(adjPrice)}
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-rose-500 opacity-60 group-hover:opacity-100 shrink-0">
                            ✕ Unassign
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p role="alert" className="text-rose-500 text-xs font-semibold">
              {error}
            </p>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              className="px-3 py-1 text-xs font-bold border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setDraft(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 text-xs font-black bg-amber-500 hover:bg-amber-400 text-black shadow-xs"
            >
              Save Pricing Tier
            </button>
          </div>
        </form>
      )}

      {/* Empty State */}
      {!schedules.length && !draft && (
        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center bg-white dark:bg-zinc-950">
          <Clock className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
          <h3 className="font-bold text-xs">No pricing tiers yet</h3>
          <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
            Create time-based tiers (discounts or surges), choose operating days, and assign menu items anytime.
          </p>
          <button
            type="button"
            className="mt-3 px-3 py-1 text-xs font-bold bg-amber-500 text-black hover:bg-amber-400"
            onClick={() => edit()}
          >
            + Create First Tier
          </button>
        </div>
      )}

      {/* Compact List of Existing Tiers */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {schedules.map((s) => {
          const percent = s.adjustmentPercentage ?? -s.discountPercentage;
          return (
            <article
              key={s.id}
              className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 space-y-1.5 shadow-xs"
            >
              {/* Title & Badge */}
              <div className="flex justify-between items-start gap-1">
                <div>
                  <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{s.title}</h3>
                  <p className="text-[10px] text-zinc-500">
                    {s.startTime} – {s.endTime}
                    {s.endTime < s.startTime ? " (+1d)" : ""} · NPT
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-xs ${
                      percent < 0
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : percent > 0
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {percent > 0 ? `+${percent}%` : `${percent}%`}
                  </span>
                  <span
                    className={`text-[9px] font-bold ${
                      s.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                    }`}
                  >
                    {s.isActive ? "Active" : "Paused"}
                  </span>
                </div>
              </div>

              {/* Days & Channels */}
              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                <span className="text-zinc-400">{s.daysOfWeek.join(" ")}</span>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <div className="flex gap-1">
                  {(s.channels ?? channels).map((c) => (
                    <span
                      key={c}
                      className="bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1 py-0.2 text-[9px] font-bold uppercase"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Items assigned summary */}
              <p
                className="text-[10px] text-zinc-500 truncate"
                title={
                  s.productIds.length
                    ? `${s.productIds.length} items assigned`
                    : "No items assigned"
                }
              >
                {s.productIds.length
                  ? `${s.productIds.length} item${s.productIds.length > 1 ? "s" : ""}: ` +
                    (products
                      .filter((p) => s.productIds.includes(p.id))
                      .map((p) => p.name)
                      .slice(0, 3)
                      .join(", ") + (s.productIds.length > 3 ? "..." : ""))
                  : "No menu items assigned"}
              </p>

              {/* Card Actions */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  className="px-2 py-0.5 text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1"
                  onClick={() => edit(s)}
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>Edit / Assign</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="px-2 py-0.5 text-[10px] font-bold border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => toggleTimePricing(s.id)}
                  >
                    {s.isActive ? "Pause" : "Enable"}
                  </button>
                  <button
                    type="button"
                    className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                    title="Delete tier"
                    onClick={() => {
                      if (confirm(`Delete pricing tier “${s.title}”?`)) deleteTimePricing(s.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
