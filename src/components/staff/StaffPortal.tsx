import React, { useState } from "react";
import {
  Menu,
  X,
  Volume2,
  VolumeX,
  Receipt,
  CreditCard,
  Boxes,
  BookOpen,
  UtensilsCrossed,
  Store,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { StaffPosOrderTab } from "./StaffPosOrderTab";
import { StaffBillingTab } from "./StaffBillingTab";
import { StaffInventoryTab } from "./StaffInventoryTab";
import { StaffDaybookTab } from "./StaffDaybookTab";
import { StaffCatalogManager } from "./StaffCatalogManager";
import { StaffFloatingOrderNotice } from "./StaffFloatingOrderNotice";
import {
  SkeletonWorkbench,
  SkeletonMetricsRow,
  SkeletonTable,
} from "../common/Skeleton";
import { Order } from "../../types";

type StaffSubView =
  | "pos_orders"
  | "billing"
  | "inventory"
  | "daybook"
  | "catalog";

export const StaffPortal: React.FC = () => {
  const {
    currentOutlet,
    orders,
    inventory,
    kdsSoundEnabled,
    setKdsSoundEnabled,
    isLoadingSkeleton,
  } = useApp();

  const [activeSubView, setActiveSubView] = useState<StaffSubView>("pos_orders");
  const [isSubViewLoading, setIsSubViewLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [selectedBillingOrder, setSelectedBillingOrder] = useState<Order | null>(null);

  const handleSubViewChange = (newView: StaffSubView) => {
    if (newView === activeSubView) return;
    setIsSubViewLoading(true);
    setActiveSubView(newView);
    setTimeout(() => setIsSubViewLoading(false), 220);
  };

  // Real-time Badge Counts
  const activeOrdersCount = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  ).length;

  const lowStockCount = inventory.filter(
    (i) => i.currentStock <= i.minThreshold
  ).length;

  const navItems: {
    id: StaffSubView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[] = [
    {
      id: "pos_orders",
      label: "POS & Orders",
      icon: Receipt,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      id: "billing",
      label: "Billing & Settlement",
      icon: CreditCard,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
    },
    {
      id: "daybook",
      label: "Shift Daybook",
      icon: BookOpen,
    },
    {
      id: "catalog",
      label: "Menu Catalog",
      icon: UtensilsCrossed,
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col md:flex-row transition-colors relative">
      {/* Floating Incoming Order Notice (Floats at top across all staff pages until crossed) */}
      <StaffFloatingOrderNotice
        onOpenBillingForOrder={(order) => {
          setSelectedBillingOrder(order);
          setActiveSubView("billing");
        }}
        onOpenOngoingOrder={() => {
          setActiveSubView("pos_orders");
        }}
      />

      {/* -------------------------------------------------------------
          MOBILE TOP BAR (Clean & Minimal)
      ------------------------------------------------------------- */}
      <div className="md:hidden bg-[#121214] border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1 text-zinc-600 dark:text-zinc-300"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
            Staff Counter
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">{currentOutlet.name}</span>
      </div>

      {/* -------------------------------------------------------------
          DESKTOP AUTO-COLLAPSING SIDEBAR
          - Initially collapsed (w-16): shows icon only
          - On mouse hover over sidebar area: smoothly expands to w-60
            revealing full text labels and badges
          - On mouse leave: auto-collapses back to w-16
          - Fixed width container (w-16) prevents any jitter or layout
            shift in the main POS workspace
      ------------------------------------------------------------- */}
      <div
        className="hidden md:block sticky top-0 h-screen shrink-0 w-16 z-40"
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <aside
          className={`absolute top-0 left-0 h-screen bg-white dark:bg-[#101012] border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-all duration-200 ease-in-out overflow-hidden select-none ${
            isSidebarHovered ? "w-60 shadow-2xl" : "w-16 shadow-none"
          }`}
        >
          {/* Header */}
          <div className="h-14 px-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden w-full">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div
                className={`transition-opacity duration-200 whitespace-nowrap overflow-hidden ${
                  isSidebarHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  Staff Counter
                </div>
                <div className="text-[10px] text-zinc-500 truncate font-mono">
                  {currentOutlet.name}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSubView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => handleSubViewChange(item.id)}
                  className={`w-full h-10 px-3 text-xs transition-colors flex items-center rounded-md cursor-pointer relative ${
                    isActive
                      ? "text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="w-6 flex items-center justify-center shrink-0 relative">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isSidebarHovered && item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#101012]" />
                    )}
                  </div>

                  <div
                    className={`flex-1 flex items-center justify-between ml-2.5 overflow-hidden transition-opacity duration-200 ${
                      isSidebarHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <span className="truncate whitespace-nowrap font-medium">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ml-1.5 ${
                          isActive
                            ? "bg-amber-500 text-black font-bold"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer (Sound Chime) */}
          <div className="p-2 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0D0D0F] shrink-0">
            <button
              type="button"
              title={`Sound Chime: ${kdsSoundEnabled ? "ON" : "OFF"}`}
              onClick={() => setKdsSoundEnabled(!kdsSoundEnabled)}
              className="w-full h-10 px-3 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-md flex items-center cursor-pointer relative"
            >
              <div className="w-6 flex items-center justify-center shrink-0">
                {kdsSoundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-400" />
                )}
              </div>
              <div
                className={`flex-1 flex items-center justify-between ml-2.5 overflow-hidden transition-opacity duration-200 ${
                  isSidebarHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <span className="truncate whitespace-nowrap font-medium">Sound Chime</span>
                <span className="font-mono text-[10px] font-bold">
                  {kdsSoundEnabled ? "ON" : "OFF"}
                </span>
              </div>
            </button>
          </div>
        </aside>
      </div>

      {/* -------------------------------------------------------------
          MOBILE DRAWER
      ------------------------------------------------------------- */}
      <aside
        className={`fixed md:hidden top-0 left-0 h-screen w-64 bg-white dark:bg-[#101012] border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between z-50 transition-transform duration-200 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Staff Counter
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  handleSubViewChange(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs transition-colors flex items-center justify-between rounded-md cursor-pointer ${
                  isActive
                    ? "text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 shrink-0 rounded ${
                      isActive
                        ? "bg-amber-500 text-black font-bold"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0D0D0F]">
          <button
            type="button"
            onClick={() => setKdsSoundEnabled(!kdsSoundEnabled)}
            className="w-full px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {kdsSoundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              )}
              <span>Sound Chime</span>
            </div>
            <span className="font-mono text-[10px] font-bold">
              {kdsSoundEnabled ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      {/* -------------------------------------------------------------
          MAIN CONTENT VIEW AREA (With Skeleton Placeholder on loading)
      ------------------------------------------------------------- */}
      <main className="flex-1 min-w-0 p-3 sm:p-5 space-y-4">
        {isSubViewLoading || isLoadingSkeleton ? (
          <div>
            {activeSubView === "pos_orders" && <SkeletonWorkbench />}
            {activeSubView === "billing" && <SkeletonWorkbench />}
            {activeSubView === "inventory" && (
              <div className="space-y-4">
                <SkeletonMetricsRow count={4} />
                <SkeletonTable rows={8} columns={6} />
              </div>
            )}
            {activeSubView === "daybook" && (
              <div className="space-y-4">
                <SkeletonMetricsRow count={4} />
                <SkeletonTable rows={6} columns={5} />
              </div>
            )}
            {activeSubView === "catalog" && <SkeletonTable rows={8} columns={5} />}
          </div>
        ) : (
          <>
            {activeSubView === "pos_orders" && (
              <StaffPosOrderTab
                onOpenBillingForOrder={(ord) => {
                  setSelectedBillingOrder(ord);
                  setActiveSubView("billing");
                }}
              />
            )}

            {activeSubView === "billing" && (
              <StaffBillingTab initialSelectedOrder={selectedBillingOrder} />
            )}

            {activeSubView === "inventory" && <StaffInventoryTab />}

            {activeSubView === "daybook" && <StaffDaybookTab />}

            {activeSubView === "catalog" && <StaffCatalogManager />}
          </>
        )}
      </main>
    </div>
  );
};
