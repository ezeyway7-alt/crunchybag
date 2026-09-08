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
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatNPR } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

export const AdminPortal: React.FC = () => {
  const {
    orders,
    products,
    updateProductPrice,
    toggleProductAvailability,
    activityLogs,
    addActivityLog,
    currentOutlet,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "menu" | "logs">("overview");
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit price modal state
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>("");

  // Add dummy log modal state
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [customLogAction, setCustomLogAction] = useState("");
  const [customLogDetails, setCustomLogDetails] = useState("");
  const [customLogBadge, setCustomLogBadge] = useState<"order" | "kitchen" | "menu" | "staff" | "payment">("staff");

  // Key metrics
  const totalRevenue = orders.reduce((sum, o) => o.status !== "CANCELLED" ? sum + o.totalAmount : sum, 0);
  const totalOrders = orders.length;
  const activeKitchenOrders = orders.filter((o) => o.status === "PROCESSING" || o.status === "CONFIRMED").length;
  const readyOrders = orders.filter((o) => o.status === "READY").length;

  const filteredLogs = activityLogs.filter((log) => {
    if (logFilter !== "ALL" && log.badgeType !== logFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.actorName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenEditPrice = (product: typeof products[0]) => {
    setSelectedProduct(product);
    setEditPriceValue(product.basePrice.toString());
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const priceNum = parseFloat(editPriceValue);
    if (!isNaN(priceNum) && priceNum > 0) {
      updateProductPrice(selectedProduct.id, priceNum);
      setSelectedProduct(null);
    }
  };

  const handleAddCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLogAction.trim() || !customLogDetails.trim()) return;

    addActivityLog({
      actorName: currentUser?.name || "Rahul Adhikari",
      actorRole: currentUser?.title || "Store General Manager",
      action: customLogAction,
      details: customLogDetails,
      badgeType: customLogBadge,
    });

    setIsAddLogModalOpen(false);
    setCustomLogAction("");
    setCustomLogDetails("");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0B] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Admin Sub-bar */}
      <div className="bg-white dark:bg-[#121214] border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black tracking-tight text-zinc-950 dark:text-white uppercase">
              {currentOutlet.name} • Manager Hub
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Sales performance, order fulfillment, pricing controls, and staff activity logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddLogModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Staff Note / Log
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "overview"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 font-extrabold"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "orders"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 font-extrabold"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "menu"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 font-extrabold"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Menu & Pricing ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              activeTab === "logs"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5 font-extrabold"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Activity & Staff Logs ({activityLogs.length})
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Today's Sales</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-zinc-950 dark:text-white font-mono">
                  {formatNPR(totalRevenue)}
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 inline-block">
                  VAT & PAN Included
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                  <Receipt className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-zinc-950 dark:text-white font-mono">
                  {totalOrders}
                </div>
                <span className="text-[11px] text-zinc-400 font-medium mt-1 inline-block">
                  Takeaway & Dine-in
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Active In Kitchen</span>
                  <Flame className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-zinc-950 dark:text-white font-mono">
                  {activeKitchenOrders}
                </div>
                <span className="text-[11px] text-amber-500 font-medium mt-1 inline-block">
                  Orders being prepared
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Ready at Counter</span>
                  <CheckCircle2 className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-2xl font-black text-zinc-950 dark:text-white font-mono">
                  {readyOrders}
                </div>
                <span className="text-[11px] text-sky-500 font-medium mt-1 inline-block">
                  Awaiting customer pickup
                </span>
              </div>
            </div>

            {/* Quick Activity Preview & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Logs Card */}
              <div className="p-5 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-black text-sm uppercase tracking-wider text-zinc-950 dark:text-white">
                    Live Operational Logs
                  </h3>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    View All ({activityLogs.length})
                  </button>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 mt-2">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            by {log.actorName} ({log.actorRole})
                          </span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300 mt-0.5">{log.details}</p>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Orders Card */}
              <div className="p-5 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-black text-sm uppercase tracking-wider text-zinc-950 dark:text-white">
                    Recent Customer Orders
                  </h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    View All ({orders.length})
                  </button>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 mt-2">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-900 dark:text-white">
                            #{order.orderNumber}
                          </span>
                          <span className="text-zinc-500">
                            {order.customerName}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {order.items.length} item(s) • {order.paymentMethod}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-zinc-900 dark:text-white block">
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

        {/* TAB 2: ALL ORDERS */}
        {activeTab === "orders" && (
          <div className="p-5 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white">
              All Branch Orders
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="p-3 font-mono font-black">#{o.orderNumber}</td>
                      <td className="p-3">
                        <div className="font-bold">{o.customerName}</div>
                        <div className="text-zinc-400 text-[11px]">{o.customerPhone}</div>
                      </td>
                      <td className="p-3">
                        {o.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                      </td>
                      <td className="p-3 font-mono font-bold">{formatNPR(o.totalAmount)}</td>
                      <td className="p-3 font-mono text-zinc-500">{o.paymentMethod}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            o.status === "COMPLETED"
                              ? "success"
                              : o.status === "READY"
                              ? "brand"
                              : o.status === "PROCESSING"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {o.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MENU & PRICING */}
        {activeTab === "menu" && (
          <div className="p-5 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white">
                  Menu Items & Price Overrides
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Update item base prices or toggle availability for customers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-12 h-12 object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                        {prod.name}
                      </h4>
                      <p className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {formatNPR(prod.basePrice)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={() => handleOpenEditPrice(prod)}
                      className="px-2.5 py-1 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Price</span>
                    </button>

                    <button
                      onClick={() => toggleProductAvailability(prod.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 border cursor-pointer ${
                        prod.isAvailable
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                      }`}
                    >
                      {prod.isAvailable ? "In Stock" : "Sold Out"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY & STAFF LOGS ("dummy logs all thngs in dhasbod") */}
        {activeTab === "logs" && (
          <div className="p-5 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white">
                  Chronological Restaurant Activity Logs
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Complete dummy logs recording staff actions, kitchen prep, order fulfillment, and price changes.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
                {["ALL", "order", "kitchen", "payment", "menu", "staff"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`px-3 py-1 text-xs font-bold uppercase transition-colors cursor-pointer border ${
                      logFilter === f
                        ? "bg-amber-500 text-black border-amber-500"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div>
              <Input
                placeholder="Search logs by staff name, action, or order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Logs List */}
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Badge
                        variant={
                          log.badgeType === "kitchen"
                            ? "brand"
                            : log.badgeType === "payment"
                            ? "success"
                            : log.badgeType === "menu"
                            ? "warning"
                            : "neutral"
                        }
                        size="sm"
                        className="uppercase font-bold"
                      >
                        {log.badgeType}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white">
                          {log.action}
                        </span>
                        <span className="text-zinc-500 font-medium">
                          • {log.actorName} ({log.actorRole})
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300 mt-0.5">{log.details}</p>
                    </div>
                  </div>

                  <span className="font-mono text-xs text-zinc-400 shrink-0 sm:self-center">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Price Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Edit Price: ${selectedProduct.name}`}
          description="Update the selling price across online customer menu and staff POS."
        >
          <form onSubmit={handleSavePrice} className="space-y-4 pt-2">
            <div>
              <Input
                label="Base Price (NPR)"
                type="number"
                value={editPriceValue}
                onChange={(e) => setEditPriceValue(e.target.value)}
                hint="Price includes all statutory taxes (13% VAT)."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Price
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Custom Staff Log Modal */}
      <Modal
        isOpen={isAddLogModalOpen}
        onClose={() => setIsAddLogModalOpen(false)}
        title="Add Restaurant Activity Log"
        description="Record an operational event or staff handover note."
      >
        <form onSubmit={handleAddCustomLog} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
              Category
            </label>
            <select
              value={customLogBadge}
              onChange={(e) => setCustomLogBadge(e.target.value as any)}
              className="w-full h-11 px-3 text-xs font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value="staff">Staff / Shift Note</option>
              <option value="kitchen">Kitchen Operation</option>
              <option value="order">Order Event</option>
              <option value="payment">Cash / Payment Settlement</option>
              <option value="menu">Inventory / Menu Note</option>
            </select>
          </div>

          <div>
            <Input
              label="Action Title"
              placeholder="e.g. Morning Shift Handover, Oil Changed in Fryers"
              value={customLogAction}
              onChange={(e) => setCustomLogAction(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Log Details"
              placeholder="e.g. Registered opened with Rs. 5,000 float, buns restocked."
              value={customLogDetails}
              onChange={(e) => setCustomLogDetails(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAddLogModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Log
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
