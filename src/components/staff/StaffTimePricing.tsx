import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { PricingChannel, TimePricingSchedule } from "../../types";
import { formatNPR } from "../../lib/utils";

const days: TimePricingSchedule["daysOfWeek"] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const channels: PricingChannel[] = ["web", "qr", "pos", "kiosk"];
const field = "w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 text-sm focus-visible:ring-2 focus-visible:ring-amber-500";
const button = "border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-amber-500";
export const StaffTimePricing: React.FC = () => {
  const { timePricingSchedules, currentOutlet, products, saveTimePricing, deleteTimePricing, toggleTimePricing, addToast } = useApp();
  const [draft, setDraft] = useState<TimePricingSchedule | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const schedules = timePricingSchedules.filter(s => s.outletId === currentOutlet.id);
  const edit = (s?: TimePricingSchedule) => {
    setError(""); setSearch("");
    setDraft(s ? { ...s, adjustmentPercentage: s.adjustmentPercentage ?? -s.discountPercentage, channels: s.channels ?? ["web", "qr", "pos", "kiosk"] } : {
      id: crypto.randomUUID(), title: "", outletId: currentOutlet.id, productIds: [], productNames: [], daysOfWeek: [...days], startTime: "16:00", endTime: "19:00", adjustmentPercentage: 0, discountPercentage: 0, channels: ["web"], isActive: true,
    });
  };
  const update = (patch: Partial<TimePricingSchedule>) => setDraft(d => d ? { ...d, ...patch } : d);
  return <section className="space-y-4 text-zinc-900 dark:text-zinc-100">
    <div className="flex flex-wrap items-center justify-between gap-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <div><h2 className="text-lg font-bold">Time-based pricing tiers</h2><p className="text-xs text-zinc-500">{currentOutlet.name} · Nepal time · Adjust the base price only on selected channels.</p></div>
      <button type="button" className={`${button} bg-amber-500 text-black`} onClick={() => edit()}>+ New pricing tier</button>
    </div>
    <p className="text-xs text-zinc-500">Positive percentages increase prices; negative percentages reduce them. Unassigned tiers are ready for later assignment. These settings are saved in this browser; checkout integration is pending.</p>
    {draft && <form className="border border-amber-500 bg-white dark:bg-zinc-950 p-4 space-y-5" onSubmit={e => {
      e.preventDefault();
      if (!draft.title.trim() || !Number.isFinite(draft.adjustmentPercentage) || draft.adjustmentPercentage! < -100 || !draft.channels?.length || !draft.daysOfWeek.length || draft.startTime === draft.endTime) { setError("Enter a name, an adjustment of at least -100%, different start/end times, and at least one day and channel."); return; }
      saveTimePricing({ ...draft, title: draft.title.trim(), discountPercentage: -(draft.adjustmentPercentage || 0), productNames: products.filter(p => draft.productIds.includes(p.id)).map(p => p.name) });
      setDraft(null); addToast({ title: "Pricing tier saved locally", type: "success" });
    }}>
      <div className="flex justify-between items-center"><h3 className="font-bold">{schedules.some(s => s.id === draft.id) ? "Edit tier" : "Create tier"}</h3><button type="button" className={button} onClick={() => setDraft(null)}>Cancel</button></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="space-y-1">Tier name<input autoFocus required className={field} placeholder="e.g. Tier A — evening web" value={draft.title} onChange={e => update({ title: e.target.value })} /></label>
        <label className="space-y-1">Price adjustment (%)<input required type="number" min={-100} step="0.01" className={field} value={Number.isNaN(draft.adjustmentPercentage) ? "" : draft.adjustmentPercentage} onChange={e => update({ adjustmentPercentage: e.target.valueAsNumber })} /><span className="text-xs text-zinc-500">Example: −15 discount, +10 increase</span></label>
        <label className="space-y-1">Start time<input required type="time" className={field} value={draft.startTime} onChange={e => update({ startTime: e.target.value })} /></label>
        <label className="space-y-1">End time<input required type="time" className={field} value={draft.endTime} onChange={e => update({ endTime: e.target.value })} /></label>
      </div>
      {draft.endTime < draft.startTime && <p className="text-amber-600">Overnight window: ends the following day. Weekdays refer to the starting day.</p>}
      <fieldset><legend className="font-bold mb-2">Operating days</legend><div className="flex flex-wrap gap-3">{days.map(day => <label key={day} className={button}><input type="checkbox" className="mr-2 accent-amber-500" checked={draft.daysOfWeek.includes(day)} onChange={() => update({ daysOfWeek: draft.daysOfWeek.includes(day) ? draft.daysOfWeek.filter(d => d !== day) : [...draft.daysOfWeek, day] })} />{day}</label>)}</div></fieldset>
      <fieldset><legend className="font-bold mb-2">Apply this tier to</legend><div className="flex flex-wrap gap-3">{channels.map(channel => <label key={channel} className={button}><input type="checkbox" className="mr-2 accent-amber-500" checked={draft.channels?.includes(channel) ?? false} onChange={() => update({ channels: draft.channels?.includes(channel) ? draft.channels.filter(c => c !== channel) : [...(draft.channels || []), channel] })} />{channel.toUpperCase()}</label>)}</div></fieldset>
      <fieldset className="space-y-2"><legend className="font-bold">Assign menu items ({draft.productIds.length})</legend><p className="text-xs text-zinc-500">Leave empty to assign later. No items means this tier affects no products.</p><input aria-label="Search menu items for this tier" className={field} placeholder="Search menu items…" value={search} onChange={e => setSearch(e.target.value)} /><div className="max-h-48 overflow-auto grid sm:grid-cols-2 gap-2">{products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => <label key={p.id} className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 p-2"><input type="checkbox" checked={draft.productIds.includes(p.id)} onChange={() => update({ productIds: draft.productIds.includes(p.id) ? draft.productIds.filter(id => id !== p.id) : [...draft.productIds, p.id] })} /><span className="flex-1">{p.name}</span><span>{formatNPR(p.basePrice)}</span></label>)}</div></fieldset>
      <div className="border border-zinc-200 dark:border-zinc-800 p-3"><h4 className="font-bold mb-2">Price preview during this window · NPR 100 base</h4><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{channels.map(c => <div key={c}><span className="text-zinc-500">{c.toUpperCase()}</span><p className="text-lg font-bold">{formatNPR(draft.channels?.includes(c) ? Math.max(0, 100 + (draft.adjustmentPercentage || 0)) : 100)}</p></div>)}</div></div>
      <label className="flex gap-2"><input type="checkbox" checked={draft.isActive} onChange={e => update({ isActive: e.target.checked })} />Enable this tier</label>
      {error && <p role="alert" className="text-rose-500">{error}</p>}
      <button type="submit" className={`${button} bg-amber-500 text-black`}>Save pricing tier</button>
    </form>}
    {!schedules.length && !draft && <div className="border border-dashed border-zinc-400 p-10 text-center"><h3 className="font-bold">No pricing tiers yet</h3><p className="text-zinc-500 mt-2">Create a tier, choose channels and times, then assign menu items whenever you’re ready.</p></div>}
    <div className="grid md:grid-cols-2 gap-3">{schedules.map(s => {
      const percent = s.adjustmentPercentage ?? -s.discountPercentage;
      return <article key={s.id} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
        <div className="flex justify-between gap-3"><h3 className="font-bold">{s.title}</h3><span className={percent > 0 ? "text-amber-600" : "text-emerald-600"}>{percent > 0 ? "+" : ""}{percent}%</span></div>
        <p>{s.startTime} – {s.endTime}{s.endTime < s.startTime ? " (+1 day)" : ""} · NPT</p><p className="text-zinc-500">{s.daysOfWeek.join(" · ")}</p>
        <div className="flex gap-2 flex-wrap">{(s.channels ?? channels).map(c => <span key={c} className="bg-amber-500/15 text-amber-600 px-2 py-1 font-bold">{c.toUpperCase()}</span>)}</div>
        <p className="text-xs text-zinc-500">{s.productIds.length ? products.filter(p => s.productIds.includes(p.id)).map(p => p.name).join(", ") || "Assigned items no longer available" : "No menu items assigned"}</p>
        <div className="flex flex-wrap gap-2"><button className={button} onClick={() => edit(s)}>Edit / assign items</button><button className={button} onClick={() => toggleTimePricing(s.id)}>{s.isActive ? "Pause" : "Enable"}</button><button className={`${button} text-rose-500`} onClick={() => { if (confirm(`Delete pricing tier “${s.title}”?`)) deleteTimePricing(s.id); }}>Delete</button><span className="self-center text-zinc-500">{s.isActive ? "Enabled" : "Paused"}</span></div>
      </article>;
    })}</div>
  </section>;
};
