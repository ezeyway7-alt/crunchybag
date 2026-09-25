import React, { useState } from "react";
import {
  TrendingUp,
  Receipt,
  Clock,
  Flame,
  FileText,
  DollarSign,
  Tag,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit2,
  ShieldCheck,
  UserCheck,
  Boxes,
  Truck,
  BookOpen,
  Sparkles,
  Users,
  Building2,
  Split,
  Utensils,
  Eye,
  Sliders,
  Store,
  Menu as MenuIcon,
  X,
  CreditCard,
  ChefHat,
  ArrowLeft,
  LogOut,
  Globe,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "../../types/auth";
import { formatNPR } from "../../lib/utils";
import { Order, OrderStatus } from "../../types";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

// Sub-tabs
import { StaffPosOrderTab } from "../staff/StaffPosOrderTab";
import { StaffBillingTab } from "../staff/StaffBillingTab";
import { StaffInventoryTab } from "../staff/StaffInventoryTab";
import { StaffDaybookTab } from "../staff/StaffDaybookTab";
import { KDSPortal } from "../kds/KDSPortal";
import { PlatformPortal } from "../platform/PlatformPortal";
import { AdminEmployeesTab } from "./AdminEmployeesTab";
import { AdminLoyaltyTab } from "./AdminLoyaltyTab";
import { AdminMenuManagerTab } from "./AdminMenuManagerTab";
import { AdminOrganizationTab } from "./AdminOrganizationTab";
import { AdminActivityTab } from "./AdminActivityTab";
import {
  SkeletonMetricsRow,
  SkeletonChartCard,
  SkeletonTable,
  SkeletonWorkbench,
  SkeletonTicketGrid,
} from "../common/Skeleton";

export const AdminPortal: React.FC = () => {
  const {
    orders,
    products,
    updateOrderStatus,
    activityLogs,
    addActivityLog,
    currentOutlet,
    currentUser,
    inventory,
    purchases,
    daybookExpenses,
    loyaltyRecords,
    employees,
    isLoadingSkeleton,
    setActivePortal,
    logout: appLogout,
  } = useApp();

  const { authUser, authOutlet, logout: authLogout } = useAuth();

  const displayName =
    authUser?.name ||
    authUser?.first_name ||
    authUser?.username ||
    currentUser?.name ||
    "Store General Manager";

  const displayRole = authUser?.role
    ? ROLE_LABELS[authUser.role] || authUser.role
    : currentUser?.title || "Store Manager";

  const displayOutlet = authOutlet?.name || currentOutlet?.name || "Kathmandu Branch";

  type TabType =
    | "overview"
    | "pos_orders"
    | "billing"
    | "kitchen"
    | "inventory"
    | "daybook"
    | "menu"
    | "loyalty"
    | "employees"
    | "organization"
    | "platform"
    | "logs";

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isAdminTabLoading, setIsAdminTabLoading] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedBillingOrder, setSelectedBillingOrder] = useState<Order | null>(null);

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setIsAdminTabLoading(true);
    setActiveTab(tab);
    setTimeout(() => setIsAdminTabLoading(false), 220);
  };

  const handleReturnToCustomer = () => {
    setActivePortal("customer");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/menu");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleSignOut = () => {
    authLogout();
    appLogout();
    setActivePortal("customer");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  // Key metrics
  const totalRevenue = orders.reduce((sum, o) => o.status !== "CANCELLED" ? sum + o.totalAmount : sum, 0);
  const totalOrders = orders.length;
  const activeKitchenOrders = orders.filter((o) => o.status === "PROCESSING" || o.status === "CONFIRMED").length;
  const readyOrders = orders.filter((o) => o.status === "READY").length;
  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minThreshold).length;
  const activeOrdersCount = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  ).length;

  // Page Navigation Items for the Unified Manager Sidebar
  const navItems: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[] = [
    {
      id: "overview",
      label: "Overview & KPIs",
      icon: TrendingUp,
    },
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
      id: "kitchen",
      label: "Kitchen KDS Queue",
      icon: ChefHat,
      badge: activeKitchenOrders > 0 ? activeKitchenOrders : undefined,
    },
    {
      id: "inventory",
      label: "Inventory & Purchases",
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
    },
    {
      id: "daybook",
      label: "Shift Daybook",
      icon: BookOpen,
    },
    {
      id: "menu",
      label: "Menu Catalog",
      icon: Utensils,
      badge: products.length,
    },
    {
      id: "loyalty",
      label: "Loyalty & Khata",
      icon: Sparkles,
      badge: loyaltyRecords.length > 0 ? loyaltyRecords.length : undefined,
    },
    {
      id: "employees",
      label: "Staff & Access",
      icon: Users,
      badge: employees.length,
    },
    {
      id: "organization",
      label: "Outlets & Org",
      icon: Building2,
    },
    {
      id: "platform",
      label: "Multi-Tenant Governance",
      icon: ShieldCheck,
    },
    {
      id: "logs",
      label: "Activity & Audit Logs",
      icon: FileText,
      badge: activityLogs.length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col md:flex-row transition-colors">
      {/* -------------------------------------------------------------
          MOBILE TOP BAR (Clean & Minimal)
      ------------------------------------------------------------- */}
      <div className="md:hidden bg-[#121214] border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1 text-zinc-300 hover:text-white"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          <div>
            <span className="text-xs font-bold text-zinc-100 block">
              {displayName}
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              {displayRole}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReturnToCustomer}
            title="Customer Storefront"
            className="px-2 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Storefront</span>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            title="Logout"
            className="p-1.5 text-zinc-400 hover:text-rose-400 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          DESKTOP AUTO-COLLAPSING SIDEBAR
          - Initially collapsed (w-16): shows icon only
          - On mouse hover over sidebar area: smoothly expands to w-60
            revealing full text labels and badges
          - On mouse leave: auto-collapses back to w-16
          - Fixed width container (w-16) prevents any layout shift in workspace
      ------------------------------------------------------------- */}
      <div
        className="hidden md:block sticky top-0 h-screen shrink-0 w-16 z-40"
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <aside
          className={`absolute top-0 left-0 h-screen bg-[#101012] border-r border-zinc-800 flex flex-col justify-between transition-all duration-200 ease-in-out overflow-hidden select-none ${
            isSidebarHovered ? "w-60 shadow-2xl" : "w-16 shadow-none"
          }`}
        >
          {/* Header */}
          <div className="h-14 px-3.5 border-b border-zinc-800 flex items-center shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden w-full">
              <div className="w-9 h-9 shrink-0 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div
                className={`transition-opacity duration-200 whitespace-nowrap overflow-hidden ${
                  isSidebarHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <div className="text-xs font-bold text-zinc-100 truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-amber-400 truncate font-mono">
                  {displayRole} • {displayOutlet}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full h-10 px-3 text-xs transition-colors flex items-center rounded-md cursor-pointer relative ${
                    isActive
                      ? "text-amber-400 font-semibold bg-amber-500/10"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="w-6 flex items-center justify-center shrink-0 relative">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isSidebarHovered && item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#101012]" />
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
                            : "bg-zinc-800 text-zinc-400"
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

          {/* Footer - Quick Add Log & Navigation */}
          <div className="p-2 border-t border-zinc-800 bg-[#0D0D0F] shrink-0 space-y-1">
            <button
              type="button"
              title="Add Staff Note / Log"
              onClick={() => handleTabChange("logs")}
              className="w-full h-9 px-3 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md flex items-center cursor-pointer relative"
            >
              <div className="w-6 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-amber-500" />
              </div>
              <div
                className={`flex-1 flex items-center justify-between ml-2.5 overflow-hidden transition-opacity duration-200 ${
                  isSidebarHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <span className="truncate whitespace-nowrap font-medium">Add Staff Log</span>
                <span className="font-mono text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                  NEW
                </span>
              </div>
            </button>

            {/* Return to Customer Storefront */}
            <button
              type="button"
              title="Return to Customer Storefront"
              onClick={handleReturnToCustomer}
              className="w-full h-9 px-3 text-xs text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/50 rounded-md flex items-center cursor-pointer"
            >
              <div className="w-6 flex items-center justify-center shrink-0">
                <ArrowLeft className="w-4 h-4 text-zinc-400" />
              </div>
              <div
                className={`flex-1 ml-2.5 overflow-hidden transition-opacity duration-200 ${
                  isSidebarHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <span className="truncate whitespace-nowrap font-medium">Customer Menu</span>
              </div>
            </button>

            {/* Sign Out */}
            <button
              type="button"
              title="Sign Out"
              onClick={handleSignOut}
              className="w-full h-9 px-3 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-md flex items-center cursor-pointer"
            >
              <div className="w-6 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 text-rose-500" />
              </div>
              <div
                className={`flex-1 ml-2.5 overflow-hidden transition-opacity duration-200 ${
                  isSidebarHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <span className="truncate whitespace-nowrap font-medium">Sign Out</span>
              </div>
            </button>
          </div>
        </aside>
      </div>

      {/* -------------------------------------------------------------
          MOBILE SIDEBAR (Drawer Overlay)
      ------------------------------------------------------------- */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-[#101012] border-r border-zinc-800 flex flex-col justify-between h-full z-10 p-3">
            <div>
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-100">{displayName}</div>
                    <div className="text-[10px] text-amber-400 font-mono">{displayRole} • {displayOutlet}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        handleTabChange(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full h-10 px-3 text-xs flex items-center justify-between rounded-md cursor-pointer ${
                        isActive
                          ? "text-amber-400 font-semibold bg-amber-500/10"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                            isActive
                              ? "bg-amber-500 text-black font-bold"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-2 border-t border-zinc-800 space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  handleTabChange("logs");
                }}
                className="w-full h-9 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Log</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  handleReturnToCustomer();
                }}
                className="w-full h-9 px-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Customer Menu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  handleSignOut();
                }}
                className="w-full h-9 px-3 text-xs bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 font-medium rounded-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* -------------------------------------------------------------
          MAIN CONTENT WORKSPACE (Clean, high-density, no big boxes)
      ------------------------------------------------------------- */}
      <main className="flex-1 min-w-0 p-3 sm:p-5 space-y-4">
        {isAdminTabLoading || isLoadingSkeleton ? (
          <div>
            {activeTab === "overview" && (
              <div className="space-y-4">
                <SkeletonMetricsRow count={4} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SkeletonChartCard />
                  <SkeletonChartCard />
                </div>
                <SkeletonTable rows={5} columns={5} />
              </div>
            )}
            {activeTab === "pos_orders" && <SkeletonWorkbench />}
            {activeTab === "billing" && <SkeletonWorkbench />}
            {activeTab === "kitchen" && <SkeletonTicketGrid count={6} />}
            {activeTab === "inventory" && (
              <div className="space-y-4">
                <SkeletonMetricsRow count={4} />
                <SkeletonTable rows={8} columns={6} />
              </div>
            )}
            {activeTab === "daybook" && (
              <div className="space-y-4">
                <SkeletonMetricsRow count={4} />
                <SkeletonTable rows={6} columns={5} />
              </div>
            )}
            {activeTab === "menu" && <SkeletonTable rows={9} columns={7} />}
            {activeTab === "loyalty" && (
              <div className="space-y-4">
                <SkeletonMetricsRow count={3} />
                <SkeletonTable rows={6} columns={5} />
              </div>
            )}
            {activeTab === "employees" && (
              <div className="space-y-4">
                <SkeletonMetricsRow count={3} />
                <SkeletonTable rows={6} columns={6} />
              </div>
            )}
            {activeTab === "organization" && (
              <div className="space-y-4">
                <SkeletonTable rows={5} columns={4} />
              </div>
            )}
            {activeTab === "logs" && <SkeletonTable rows={10} columns={4} />}
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                {/* Clean Operational KPIs Bar - No bulky boxes or giant fonts */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400 py-1 font-medium overflow-x-auto no-scrollbar border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-zinc-500 font-normal">Today's Sales:</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatNPR(totalRevenue)}</span>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-zinc-500 font-normal">Total Orders:</span>
                    <span className="font-mono text-zinc-100 font-bold">{totalOrders}</span>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-zinc-500 font-normal">Active in Kitchen:</span>
                    <span className="font-mono text-amber-400 font-bold">{activeKitchenOrders}</span>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span className="text-zinc-500 font-normal">Ready for Pickup:</span>
                    <span className="font-mono text-sky-400 font-bold">{readyOrders}</span>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className={`w-2 h-2 rounded-full ${lowStockCount > 0 ? "bg-rose-500 animate-pulse" : "bg-zinc-600"}`} />
                    <span className="text-zinc-500 font-normal">Low Stock Alerts:</span>
                    <span className={`font-mono font-bold ${lowStockCount > 0 ? "text-rose-400" : "text-zinc-400"}`}>
                      {lowStockCount}
                    </span>
                  </div>
                </div>

                {/* Quick Activity Preview & Recent Orders */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Activity Logs Card */}
                  <div className="p-4 bg-[#121214] border border-zinc-800 rounded-sm">
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                      <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        Live Operational Logs
                      </h3>
                      <button
                        onClick={() => setActiveTab("logs")}
                        className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                      >
                        View All ({activityLogs.length})
                      </button>
                    </div>
                    <div className="divide-y divide-zinc-800/80 mt-1">
                      {activityLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="py-2 flex items-start justify-between gap-3 text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-100 truncate">
                                {log.action}
                              </span>
                              <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                                {log.actorName}
                              </span>
                            </div>
                            <p className="text-zinc-400 text-[11px] mt-0.5 line-clamp-1">{log.details}</p>
                          </div>
                          <span className="font-mono text-[10px] text-zinc-500 shrink-0">
                            {log.timestamp}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Orders Card */}
                  <div className="p-4 bg-[#121214] border border-zinc-800 rounded-sm">
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                      <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                        <Receipt className="w-3.5 h-3.5 text-amber-500" />
                        Recent Customer Orders
                      </h3>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                      >
                        View All ({orders.length})
                      </button>
                    </div>
                    <div className="divide-y divide-zinc-800/80 mt-1">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-zinc-100">
                                #{order.orderNumber}
                              </span>
                              <span className="text-zinc-400 truncate">
                                {order.customerName}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              {order.items?.length || 0} items •{" "}
                              {order.paymentMethod === "ESEWA" ? "eSewa" : order.paymentMethod}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-zinc-100 block text-xs">
                              {formatNPR(order.totalAmount)}
                            </span>
                            <Badge
                              variant={
                                order.status === "READY"
                                  ? "success"
                                  : order.status === "PROCESSING"
                                  ? "brand"
                                  : "neutral"
                              }
                              size="sm"
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

        {/* TAB 2: UNIFIED POS & ORDERS */}
        {activeTab === "pos_orders" && (
          <StaffPosOrderTab
            onOpenBillingForOrder={(ord) => {
              setSelectedBillingOrder(ord);
              handleTabChange("billing");
            }}
          />
        )}

        {/* TAB 3: BILLING & SETTLEMENT */}
        {activeTab === "billing" && (
          <StaffBillingTab initialSelectedOrder={selectedBillingOrder} />
        )}

        {/* TAB 4: KITCHEN DISPLAY / KDS */}
        {activeTab === "kitchen" && <KDSPortal />}

        {/* TAB 5: INVENTORY & FAST PROCUREMENT (With Supplier Search, Bills Table & Stock Audit) */}
        {activeTab === "inventory" && <StaffInventoryTab />}

        {/* TAB 6: SHIFT DAYBOOK */}
        {activeTab === "daybook" && <StaffDaybookTab />}

        {/* TAB 7: MENU CATALOG */}
        {activeTab === "menu" && <AdminMenuManagerTab />}

        {/* TAB 8: LOYALTY & KHATA */}
        {activeTab === "loyalty" && <AdminLoyaltyTab />}

        {/* TAB 9: STAFF & ACCESS */}
        {activeTab === "employees" && <AdminEmployeesTab />}

        {/* TAB 10: OUTLETS & ORGANIZATION */}
        {activeTab === "organization" && <AdminOrganizationTab />}

        {/* TAB 11: PLATFORM MULTI-TENANT GOVERNANCE */}
        {activeTab === "platform" && <PlatformPortal />}

        {/* TAB 12: ACTIVITY & AUDIT LOGS */}
        {activeTab === "logs" && <AdminActivityTab />}
          </>
        )}
      </main>
    </div>
  );
};
