import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  Receipt,
  Wallet,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  PieChart,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { DaybookExpense } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

const EXPENSE_CATEGORIES = [
  "Kitchen Gas & Cylinders",
  "Packaging & Delivery Bags",
  "Cleaning & Hygiene",
  "Store Maintenance & Repairs",
  "Logistics & Transport",
  "Staff Food & Tea Allowance",
  "Misc Store Expenses",
];

export const AdminDaybookTab: React.FC = () => {
  const { daybookExpenses, addDaybookExpense, deleteDaybookExpense, orders, currentOutlet, currentUser } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");

  // Form state
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMode, setPaymentMode] = useState<DaybookExpense["paymentMode"]>("CASH");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [recordedBy, setRecordedBy] = useState(currentUser?.name || "Bikash Shrestha");

  const openAddModal = () => {
    setCategory(EXPENSE_CATEGORIES[0]);
    setAmount("");
    setDescription("");
    setPaymentMode("CASH");
    setReceiptNumber(`EXP-${Math.floor(100 + Math.random() * 900)}`);
    setRecordedBy(currentUser?.name || "Bikash Shrestha");
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    addDaybookExpense({
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      category,
      amount: parsedAmount,
      description,
      recordedBy,
      paymentMode,
      receiptNumber: receiptNumber || undefined,
      outletId: currentOutlet.id,
    });

    setIsAddModalOpen(false);
  };

  // Sales totals from orders
  const validOrders = orders.filter((o) => o.status !== "CANCELLED");
  const totalSalesRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Split payment totals
  const cashSales = validOrders
    .filter((o) => o.paymentMethod === "CASH_ON_PICKUP")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const digitalSales = totalSalesRevenue - cashSales;

  // Expenses totals
  const totalExpenses = daybookExpenses.reduce((sum, e) => sum + e.amount, 0);
  const cashExpenses = daybookExpenses
    .filter((e) => e.paymentMode === "CASH")
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashInDrawer = Math.max(0, cashSales - cashExpenses);
  const dailyNetProfit = totalSalesRevenue - totalExpenses;

  const filteredExpenses = daybookExpenses.filter(
    (e) => selectedCategoryFilter === "ALL" || e.category === selectedCategoryFilter
  );

  return (
    <div className="space-y-4">
      {/* Clean compact metrics bar - no big letters or bulky boxes */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400 py-1 font-medium border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-zinc-500">Gross Sales:</span>
          <span className="font-mono text-emerald-400 font-bold">{formatNPR(totalSalesRevenue)}</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-zinc-500">Expenses:</span>
          <span className="font-mono text-rose-400 font-bold">{formatNPR(totalExpenses)}</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-zinc-500">Net Operating:</span>
          <span className="font-mono text-zinc-100 font-bold">{formatNPR(dailyNetProfit)}</span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span className="text-zinc-500">Cash Drawer:</span>
          <span className="font-mono text-sky-400 font-bold">{formatNPR(netCashInDrawer)}</span>
        </div>
      </div>

      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#121214] p-3 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
            Daily Expense Ledger & Petty Cash
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={openAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs"
          >
            Record Store Expense
          </Button>
        </div>
      </div>

      {/* Filter by Category */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", ...EXPENSE_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCategoryFilter(c)}
            className={`px-3 py-1.5 text-xs font-bold rounded-none border whitespace-nowrap transition-all ${
              selectedCategoryFilter === c
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-extrabold"
                : "bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
              <th className="p-3.5">Time / Date</th>
              <th className="p-3.5">Expense Category</th>
              <th className="p-3.5">Description & Purpose</th>
              <th className="p-3.5">Receipt #</th>
              <th className="p-3.5">Payment Mode</th>
              <th className="p-3.5">Recorded By</th>
              <th className="p-3.5 text-right">Amount (NPR)</th>
              <th className="p-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredExpenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                <td className="p-3.5 whitespace-nowrap">
                  <span className="font-bold text-zinc-900 dark:text-white block">{exp.time}</span>
                  <span className="text-[10px] text-zinc-500">{exp.date}</span>
                </td>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  {exp.category}
                </td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400 max-w-xs">
                  {exp.description}
                </td>
                <td className="p-3.5 font-mono text-zinc-500 text-[11px]">
                  {exp.receiptNumber || "—"}
                </td>
                <td className="p-3.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {exp.paymentMode}
                  </span>
                </td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">
                  {exp.recordedBy}
                </td>
                <td className="p-3.5 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                  {formatNPR(exp.amount)}
                </td>
                <td className="p-3.5 text-center">
                  <button
                    onClick={() => deleteDaybookExpense(exp.id)}
                    className="text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Daily Operational Expense"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Amount (NPR) *
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2400"
              required
              className="text-base font-mono font-bold"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Description & Items Purchased *
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 1x Commercial Gas Cylinder refill (Nepal Gas)"
              required
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as DaybookExpense["paymentMode"])}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option value="CASH">Cash in Hand / Drawer</option>
                <option value="FONEPAY">Fonepay QR</option>
                <option value="ESEWA">eSewa Mobile</option>
                <option value="BANK_CARD">Card / Bank</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                Receipt / Voucher #
              </label>
              <Input
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. GAS-1092"
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Recorded By Staff
            </label>
            <Input
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
            >
              Save to Daybook
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
