import React, { useState, useEffect } from "react";
import {
  Receipt,
  CheckCircle2,
  DollarSign,
  Plus,
  Trash2,
  Tag,
  Phone,
  UserCheck,
  CreditCard,
  Percent,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order, PaymentMethod, SplitPaymentEntry } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSplitBillingModal: React.FC<Props> = ({ order, isOpen, onClose }) => {
  const { settleSplitPaymentOrder, lookupLoyaltyByPhone, loyaltySettings, orgSettings } = useApp();

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [phoneLookupInput, setPhoneLookupInput] = useState<string>("");
  const [customerLoyalty, setCustomerLoyalty] = useState<ReturnType<typeof lookupLoyaltyByPhone>>(null);

  // Split payment rows
  const [splits, setSplits] = useState<SplitPaymentEntry[]>([]);

  useEffect(() => {
    if (order) {
      setDiscountAmount(order.discountAmount || 0);
      setDiscountReason(order.discountReason || "");
      setPhoneLookupInput(order.customerPhone || "");

      // Initial payment split defaults to full amount
      setSplits([
        {
          method: (order.paymentMethod as PaymentMethod) || "CASH_ON_PICKUP",
          amount: Math.max(0, order.totalAmount - (order.discountAmount || 0)),
        },
      ]);

      if (order.customerPhone) {
        const found = lookupLoyaltyByPhone(order.customerPhone);
        setCustomerLoyalty(found);
      }
    }
  }, [order, isOpen]);

  if (!order) return null;

  const handlePhoneSearch = () => {
    const found = lookupLoyaltyByPhone(phoneLookupInput);
    setCustomerLoyalty(found);
    if (found && found.eligibleRevisitDiscountPercent > 0) {
      const revisitDiscount = Math.round(
        (order.subtotal * found.eligibleRevisitDiscountPercent) / 100
      );
      setDiscountAmount(revisitDiscount);
      setDiscountReason(`Revisit Offer (${found.eligibleRevisitDiscountPercent}% OFF - Visit #${found.visitCount + 1})`);
    }
  };

  const finalPayable = Math.max(0, order.subtotal - discountAmount);

  // Total allocated across splits
  const totalAllocated = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const remainingToAllocate = finalPayable - totalAllocated;

  const handleAddSplitRow = () => {
    const defaultMethod: PaymentMethod =
      splits.some((s) => s.method === "CASH_ON_PICKUP") ? "FONEPAY_QR" : "CASH_ON_PICKUP";
    setSplits((prev) => [
      ...prev,
      {
        method: defaultMethod,
        amount: Math.max(0, remainingToAllocate),
      },
    ]);
  };

  const handleUpdateSplit = (index: number, field: keyof SplitPaymentEntry, value: any) => {
    setSplits((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveSplit = (index: number) => {
    if (splits.length === 1) return;
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSettle = () => {
    if (Math.abs(remainingToAllocate) > 1) {
      alert(`Split payments do not match total payable! Discrepancy: NPR ${remainingToAllocate}`);
      return;
    }

    const hasCredit = splits.some((s) => s.method === "CREDIT" && Number(s.amount) > 0);
    const activePhone = (phoneLookupInput || order.customerPhone || "").trim();

    if (hasCredit && (!activePhone || activePhone.length < 7)) {
      alert("Customer phone number is compulsory for Credit Sale (Khata). Please provide a valid customer mobile number.");
      return;
    }

    settleSplitPaymentOrder(order.id, splits, discountAmount, discountReason, {
      customerPhone: activePhone || order.customerPhone,
      customerName: order.customerName,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Billing & Split Payment: Order #${order.orderNumber}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Order Header Summary */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-zinc-950 dark:text-white">
                #{order.orderNumber}
              </span>
              <span className="px-1.5 py-0.5 font-bold uppercase text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {order.orderType || order.fulfillmentType}
              </span>
              {order.tableNumber && (
                <span className="px-1.5 py-0.5 font-bold text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                  {order.tableNumber}
                </span>
              )}
            </div>
            <div className="text-zinc-500 mt-0.5">
              Customer: <span className="font-bold text-zinc-900 dark:text-white">{order.customerName}</span> ({order.customerPhone})
            </div>
          </div>

          <div className="text-right">
            <span className="text-zinc-500 text-[11px] block">Items Total:</span>
            <span className="text-base font-black font-mono text-zinc-900 dark:text-white">
              {formatNPR(order.subtotal)}
            </span>
          </div>
        </div>

        {/* Customer Phone & Revisit Offer Lookup */}
        <div className="p-3 border border-zinc-200 dark:border-zinc-800 bg-amber-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              Customer Revisit & Loyalty Check
            </span>
            {customerLoyalty && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {customerLoyalty.visitCount} Prior Visits • {customerLoyalty.loyaltyPoints} Points
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={phoneLookupInput}
              onChange={(e) => setPhoneLookupInput(e.target.value)}
              placeholder="Enter mobile phone number to check loyalty..."
              className="text-xs font-mono"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handlePhoneSearch}
              className="text-xs whitespace-nowrap"
            >
              Verify Customer
            </Button>
          </div>

          {customerLoyalty && customerLoyalty.eligibleRevisitDiscountPercent > 0 && (
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs flex items-center justify-between">
              <span className="font-bold text-emerald-800 dark:text-emerald-200">
                🎉 Eligible for {customerLoyalty.eligibleRevisitDiscountPercent}% Revisit Offer Discount!
              </span>
              <button
                type="button"
                onClick={() => {
                  const discount = Math.round(
                    (order.subtotal * customerLoyalty.eligibleRevisitDiscountPercent) / 100
                  );
                  setDiscountAmount(discount);
                  setDiscountReason(`Revisit Offer (${customerLoyalty.eligibleRevisitDiscountPercent}%)`);
                }}
                className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 underline cursor-pointer"
              >
                Apply NPR {Math.round((order.subtotal * customerLoyalty.eligibleRevisitDiscountPercent) / 100)}
              </button>
            </div>
          )}
        </div>

        {/* Discount Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Discount Amount (NPR)
            </label>
            <Input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              className="text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
              Discount Reason / Promo Code
            </label>
            <Input
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="e.g. VIP Member / Manager Special"
              className="text-xs"
            />
          </div>
        </div>

        {/* SPLIT PAYMENTS BUILDER */}
        <div className="border border-zinc-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white block">
                Split Across Multiple Payment Methods
              </span>
              <span className="text-[10px] text-zinc-500 block">
                Customer can pay with eSewa + Cash, Fonepay + Card, etc.
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddSplitRow}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Split Method
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {splits.map((split, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <select
                    value={split.method}
                    onChange={(e) => handleUpdateSplit(idx, "method", e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-xs text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="CASH_ON_PICKUP">Store Cash</option>
                    <option value="FONEPAY_QR">Fonepay QR</option>
                    <option value="ESEWA">eSewa Wallet</option>
                    <option value="CARD">POS Card Terminal</option>
                    <option value="WALLET">Khalti / Wallet</option>
                    <option value="CREDIT">Credit Sale (Khata)</option>
                  </select>
                </div>

                <div className="col-span-4">
                  <Input
                    type="number"
                    value={split.amount}
                    onChange={(e) => handleUpdateSplit(idx, "amount", parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                    className="text-xs font-mono font-bold py-1 px-2"
                  />
                </div>

                <div className="col-span-2">
                  <Input
                    value={split.reference || ""}
                    onChange={(e) => handleUpdateSplit(idx, "reference", e.target.value)}
                    placeholder="Ref #"
                    className="text-xs font-mono py-1 px-1.5"
                  />
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveSplit(idx)}
                    className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                    title="Remove split"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-500">
            <span>Bill Subtotal:</span>
            <span className="font-mono">{formatNPR(order.subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Discount ({discountReason || "Applied"}):</span>
              <span className="font-mono">- {formatNPR(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-black text-zinc-900 dark:text-white pt-1 border-t border-zinc-200 dark:border-zinc-700">
            <span>Net Amount Payable:</span>
            <span className="font-mono">{formatNPR(finalPayable)}</span>
          </div>

          <div className="flex justify-between text-[11px] pt-1">
            <span className="text-zinc-500">Total Allocated in Splits:</span>
            <span
              className={`font-mono font-bold ${
                remainingToAllocate === 0 ? "text-emerald-600" : "text-amber-500"
              }`}
            >
              {formatNPR(totalAllocated)} (Remaining: {formatNPR(remainingToAllocate)})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSettle}
            disabled={Math.abs(remainingToAllocate) > 1}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
          >
            Settle & Close Order
          </Button>
        </div>
      </div>
    </Modal>
  );
};
