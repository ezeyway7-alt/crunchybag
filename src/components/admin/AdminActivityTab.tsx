import React, { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Plus,
  Clock,
  User,
  Building2,
  Tag,
  Shield,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ActivityLogItem } from "../../types";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

export const AdminActivityTab: React.FC = () => {
  const { activityLogs, addActivityLog, currentOutlet, currentUser, outlets, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedOutlet, setSelectedOutlet] = useState<string>("ALL");

  // Manual Log Modal
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [category, setCategory] = useState<ActivityLogItem["badgeType"]>("staff");
  const [actionTitle, setActionTitle] = useState("");
  const [logDetails, setLogDetails] = useState("");
  const [logOutletId, setLogOutletId] = useState(currentOutlet?.id || "out-01");
  const [actorName, setActorName] = useState(currentUser?.name || "Admin Staff");

  const openAddModal = () => {
    setCategory("staff");
    setActionTitle("");
    setLogDetails("");
    setLogOutletId(currentOutlet?.id || "out-01");
    setActorName(currentUser?.name || "Admin Staff");
    setIsAddLogModalOpen(true);
  };

  const handleRecordLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;

    addActivityLog({
      action: actionTitle.trim(),
      details: logDetails.trim() || "Manual operational log recorded by admin.",
      actorName: actorName.trim(),
      actorRole: "ADMIN",
      badgeType: category,
    });

    addToast({
      title: "Activity Logged",
      description: `Operational event "${actionTitle.trim()}" recorded into audit register.`,
      type: "success",
    });

    setIsAddLogModalOpen(false);
  };

  // Metrics
  const totalLogs = activityLogs.length;
  const orderLogs = activityLogs.filter((l) => l.badgeType === "order" || l.badgeType === "payment").length;
  const kitchenLogs = activityLogs.filter((l) => l.badgeType === "kitchen").length;
  const menuLogs = activityLogs.filter((l) => l.badgeType === "menu").length;
  const staffLogs = activityLogs.filter((l) => l.badgeType === "staff").length;

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (selectedCategory !== "ALL" && log.badgeType !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.action.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          log.actorRole.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [activityLogs, selectedCategory, searchQuery]);

  const badgeStyles: Record<string, { bg: string; text: string; border: string }> = {
    order: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30" },
    payment: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30" },
    kitchen: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30" },
    menu: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/30" },
    staff: { bg: "bg-zinc-500/10", text: "text-zinc-600 dark:text-zinc-400", border: "border-zinc-500/30" },
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* -------------------------------------------------------------
          TOP HIGH-DENSITY LABEL-VALUE METRIC STRIP
      ------------------------------------------------------------- */}
      <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Total Events:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{totalLogs}</span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Orders & Billing:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{orderLogs}</span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Kitchen Operations:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{kitchenLogs}</span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Menu & Inventory:</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{menuLogs}</span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>Staff & Admin:</span>
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{staffLogs}</span>
          </div>
        </div>

        <Button
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] h-7 px-2.5"
        >
          + Record Operational Log
        </Button>
      </div>

      {/* -------------------------------------------------------------
          FILTERS DIRECTLY ABOVE DATATABLE
      ------------------------------------------------------------- */}
      <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by actor, action or details..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Categories</option>
              <option value="order">Order Events</option>
              <option value="payment">Payments</option>
              <option value="kitchen">Kitchen Queue</option>
              <option value="menu">Menu & Stock</option>
              <option value="staff">Staff & Handover</option>
            </select>
          </div>

          {(searchQuery || selectedCategory !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              className="text-[11px] text-rose-500 hover:underline px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          Showing: <strong>{filteredLogs.length}</strong> / {totalLogs} Events
        </div>
      </div>

      {/* -------------------------------------------------------------
          CHRONOLOGICAL AUDIT LOG TABLE
      ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
              <th className="p-2.5 w-28">Timestamp</th>
              <th className="p-2.5 text-center w-24">Type</th>
              <th className="p-2.5 w-44">Staff Actor</th>
              <th className="p-2.5">Action & Operation</th>
              <th className="p-2.5">Audit Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-zinc-400 text-xs">
                  No log entries matched your query.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const style = badgeStyles[log.badgeType] || badgeStyles.staff;
                return (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-2.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                        {log.badgeType}
                      </span>
                    </td>

                    <td className="p-2.5">
                      <div className="font-bold text-zinc-900 dark:text-white truncate">
                        {log.actorName}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {log.actorRole}
                      </div>
                    </td>

                    <td className="p-2.5 font-bold text-zinc-800 dark:text-zinc-200">
                      {log.action}
                    </td>

                    <td className="p-2.5 text-zinc-600 dark:text-zinc-400 text-[11px]">
                      {log.details}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------------------------------------------------
          MODAL: RECORD OPERATIONAL LOG (WIDER 4-COLUMN LAYOUT)
      ------------------------------------------------------------- */}
      <Modal
        isOpen={isAddLogModalOpen}
        onClose={() => setIsAddLogModalOpen(false)}
        title="Record Operational Activity Log"
        maxWidth="4xl"
      >
        <form onSubmit={handleRecordLog} className="space-y-4 text-xs">
          {/* 4-COLUMN ROW 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Log Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityLogItem["badgeType"])}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="staff">Staff & Handover</option>
                <option value="order">Order Transaction</option>
                <option value="payment">Payment Settlement</option>
                <option value="kitchen">Kitchen Operation</option>
                <option value="menu">Menu & Stock</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Staff Actor Name *
              </label>
              <Input
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                placeholder="Staff name"
                required
                className="text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Branch Outlet
              </label>
              <select
                value={logOutletId}
                onChange={(e) => setLogOutletId(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none focus:border-amber-500"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Timestamp
              </label>
              <div className="h-9 px-2.5 flex items-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 font-mono text-zinc-600 dark:text-zinc-400">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {/* 4-COLUMN ROW 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Action / Event Title *
              </label>
              <Input
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="e.g. Morning Till Opened with Float Rs. 5,000"
                required
                className="text-xs font-bold"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Operational Details
              </label>
              <Input
                value={logDetails}
                onChange={(e) => setLogDetails(e.target.value)}
                placeholder="e.g. Verified denominations, fryers turned on, counter handed over."
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddLogModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
            >
              Record Log Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
