import React, { useState } from "react";
import {
  Store,
  Layers,
  Clock,
  Send,
  ToggleLeft,
  ChevronDown,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { StaffOrderQueue } from "./StaffOrderQueue";
import { StaffCatalogManager } from "./StaffCatalogManager";
import { StaffAvailabilityGrid } from "./StaffAvailabilityGrid";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";

export const StaffPortal: React.FC = () => {
  const {
    currentStaff,
    currentOutlet,
    setCurrentOutlet,
    outlets,
  } = useApp();

  const [activeSubView, setActiveSubView] = useState<"orders" | "availability" | "catalog">("orders");
  const [isOutletPickerOpen, setIsOutletPickerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0B] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Staff Navigation Header */}
      <div className="bg-white dark:bg-[#121214] border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Outlet Context Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsOutletPickerOpen(!isOutletPickerOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-xs font-bold border border-zinc-200 dark:border-zinc-700"
            >
              <Store className="h-4 w-4 text-amber-500" />
              <span>{currentOutlet.name}</span>
              <span className="font-mono text-[10px] text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-1.5 py-0.5">
                {currentOutlet.code}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>

            {isOutletPickerOpen && (
              <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-xl p-2 z-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-1 block">
                  Select Operating Branch
                </span>
                {outlets.map((outlet) => (
                  <button
                    key={outlet.id}
                    onClick={() => {
                      setCurrentOutlet(outlet);
                      setIsOutletPickerOpen(false);
                    }}
                    className={`w-full text-left p-2.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      outlet.id === currentOutlet.id
                        ? "bg-amber-500 text-black font-bold"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span>{outlet.name}</span>
                    <span className="font-mono text-[10px]">{outlet.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Staff User & Role Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Staff on Shift: <strong className="text-zinc-900 dark:text-white">{currentStaff.name}</strong>
              </span>
              <Badge variant="brand" size="sm">
                {currentStaff.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-zinc-100 dark:border-zinc-800/60">
          <button
            onClick={() => setActiveSubView("orders")}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeSubView === "orders"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 font-extrabold"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Live Order Feed & Dispatch
          </button>
          <button
            onClick={() => setActiveSubView("availability")}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeSubView === "availability"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 font-extrabold"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Item Stock & Availability (86ing)
          </button>
          <button
            onClick={() => setActiveSubView("catalog")}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeSubView === "catalog"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 font-extrabold"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Menu Items & Details
          </button>
        </div>
      </div>

      {/* Main Staff Portal View Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeSubView === "orders" && <StaffOrderQueue />}
        {activeSubView === "availability" && <StaffAvailabilityGrid />}
        {activeSubView === "catalog" && <StaffCatalogManager />}
      </div>
    </div>
  );
};
