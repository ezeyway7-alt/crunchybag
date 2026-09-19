import React, { useState } from "react";
import {
  Printer,
  X,
  QrCode,
  Check,
  Copy,
  Receipt,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Car,
} from "lucide-react";
import { Order } from "../../types";
import { formatNPR } from "../../lib/utils";

interface PrintableTokenReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTrackerAndReview?: (order: Order) => void;
}

export const PrintableTokenReceiptModal: React.FC<PrintableTokenReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenTrackerAndReview,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen || !order) return null;

  const tokenStr = order.kioskToken || order.orderNumber.replace("CR-", "TK-");

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToken = () => {
    navigator.clipboard?.writeText(tokenStr);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 1500);
  };

  const getFulfillmentIcon = () => {
    switch (order.fulfillmentType) {
      case "DINE_IN":
        return <UtensilsCrossed className="w-3.5 h-3.5" />;
      case "DELIVERY":
        return <Bike className="w-3.5 h-3.5" />;
      case "DRIVE_THRU":
        return <Car className="w-3.5 h-3.5" />;
      default:
        return <ShoppingBag className="w-3.5 h-3.5" />;
    }
  };

  const getFulfillmentText = () => {
    if (order.fulfillmentType === "DINE_IN" || order.tableNumber) {
      return `DINE-IN (${order.tableNumber || "TABLE"})`;
    }
    if (order.fulfillmentType === "DELIVERY") return "HOME DELIVERY";
    if (order.fulfillmentType === "DRIVE_THRU") return "DRIVE-THRU CURBSIDE";
    return "TAKEAWAY COUNTER";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden my-auto flex flex-col print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Top Header Bar (Screen only, hidden on print) */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0E1015] border-b border-zinc-800 print:hidden">
          <div className="flex items-center gap-2 text-zinc-200 font-bold text-xs sm:text-sm">
            <Receipt className="w-4 h-4 text-amber-500" />
            <span>Digital Receipt & Token Slip</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================ */}
        {/* THERMAL RECEIPT CONTAINER (Ultra-clean, authentic thermal design) */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-6 bg-[#FAFAF8] text-zinc-900 font-mono text-xs select-text print:p-2 print:text-black">
          
          {/* Jagged Serrated Top Edge simulation */}
          <div className="flex justify-between items-center pb-2 border-b border-dashed border-zinc-400 text-center">
            <div className="w-full text-center">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-zinc-950 uppercase font-sans">
                CRUNCHY
              </h2>
              <p className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mt-0.5">
                CRISPY FRIED CHICKEN & SMASH BURGERS
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Durbar Marg, Kathmandu, Nepal • Tel: +977 1 4220011
              </p>
              <div className="flex items-center justify-center gap-2 text-[9px] text-zinc-500 mt-1 font-mono">
                <span>VAT/PAN: 601289123</span>
                <span>•</span>
                <span>POS-02</span>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* MASSIVE TOKEN DISPLAY BOX (Matches TV Order Board & Kitchen) */}
          {/* ========================================================== */}
          <div className="my-3 p-3 bg-zinc-100 border-2 border-dashed border-zinc-400 text-center">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              ORDER TOKEN NUMBER
            </div>
            <div className="text-3xl sm:text-4xl font-black text-zinc-950 font-mono tracking-wider my-1">
              {tokenStr}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-950 text-white text-[10px] font-bold uppercase tracking-wider">
              {getFulfillmentIcon()}
              <span>{getFulfillmentText()}</span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-1.5 leading-tight">
              Please watch the Live TV Order Radar. Your token will be called and highlighted when ready.
            </p>
          </div>

          {/* Order Meta Info */}
          <div className="py-2 border-b border-dashed border-zinc-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">Order Ref:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Date & Time:</span>
              <span>
                {new Date(order.createdAt).toLocaleDateString()} at{" "}
                {new Date(order.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Customer:</span>
              <span className="font-bold">{order.customerName || "Guest Patron"}</span>
            </div>
            {order.customerPhone && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Phone:</span>
                <span>{order.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Payment:</span>
              <span className="font-bold">
                {order.paymentMethod === "ESEWA"
                  ? "eSewa Mobile Wallet"
                  : order.paymentMethod.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="py-2.5 border-b border-dashed border-zinc-400">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase pb-1 border-b border-zinc-300">
              <span className="w-8">QTY</span>
              <span className="flex-1 px-2">ITEM</span>
              <span className="w-16 text-right">AMOUNT</span>
            </div>

            <div className="divide-y divide-zinc-200 py-1 space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start pt-1.5 text-[11px]">
                  <span className="w-8 font-bold">{item.quantity}x</span>
                  <div className="flex-1 px-2">
                    <p className="font-bold leading-tight">{item.productName}</p>
                    {item.variantName && item.variantName !== "Regular" && (
                      <p className="text-[10px] text-zinc-500">{item.variantName}</p>
                    )}
                    {item.modifiersSummary && item.modifiersSummary.length > 0 && (
                      <p className="text-[9px] text-zinc-500 leading-tight">
                        {item.modifiersSummary.join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="w-16 text-right font-bold">
                    {formatNPR(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals (VAT Inclusive Breakdown) */}
          <div className="py-2.5 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Gross Items Subtotal:</span>
              <span>{formatNPR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>VAT (13% Pan Tax Included):</span>
              <span>{formatNPR(order.vatIncludedAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black border-t-2 border-zinc-950 pt-1.5 mt-1 text-zinc-950">
              <span>TOTAL PAID:</span>
              <span>{formatNPR(order.totalAmount)}</span>
            </div>
          </div>

          {/* ========================================================== */}
          {/* QR CODE FOR LIVE MOBILE TRACKING & EXPERIENCE REVIEW */}
          {/* ========================================================== */}
          <div className="mt-3 pt-3 border-t-2 border-dashed border-zinc-400 text-center">
            <div className="inline-block p-2 bg-white border border-zinc-300 shadow-xs mb-1">
              {/* High-contrast vector QR Code visual */}
              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24 sm:w-28 sm:h-28 mx-auto"
                shapeRendering="crispEdges"
              >
                {/* QR Code Background */}
                <rect width="100" height="100" fill="#ffffff" />
                {/* Top-Left Corner Eye */}
                <rect x="5" y="5" width="30" height="30" fill="#000000" />
                <rect x="10" y="10" width="20" height="20" fill="#ffffff" />
                <rect x="15" y="15" width="10" height="10" fill="#000000" />
                {/* Top-Right Corner Eye */}
                <rect x="65" y="5" width="30" height="30" fill="#000000" />
                <rect x="70" y="10" width="20" height="20" fill="#ffffff" />
                <rect x="75" y="15" width="10" height="10" fill="#000000" />
                {/* Bottom-Left Corner Eye */}
                <rect x="5" y="65" width="30" height="30" fill="#000000" />
                <rect x="10" y="70" width="20" height="20" fill="#ffffff" />
                <rect x="15" y="75" width="10" height="10" fill="#000000" />
                {/* Data modules pattern */}
                <rect x="40" y="10" width="5" height="15" fill="#000000" />
                <rect x="50" y="5" width="10" height="5" fill="#000000" />
                <rect x="45" y="25" width="10" height="10" fill="#000000" />
                <rect x="15" y="40" width="20" height="5" fill="#000000" />
                <rect x="10" y="50" width="10" height="10" fill="#000000" />
                <rect x="25" y="50" width="15" height="5" fill="#000000" />
                <rect x="40" y="40" width="20" height="20" fill="#000000" />
                <rect x="45" y="45" width="10" height="10" fill="#ffffff" />
                <rect x="48" y="48" width="4" height="4" fill="#E5A93C" />
                <rect x="65" y="40" width="10" height="15" fill="#000000" />
                <rect x="80" y="45" width="15" height="10" fill="#000000" />
                <rect x="40" y="65" width="15" height="10" fill="#000000" />
                <rect x="60" y="65" width="10" height="25" fill="#000000" />
                <rect x="75" y="70" width="20" height="10" fill="#000000" />
                <rect x="40" y="80" width="15" height="15" fill="#000000" />
                <rect x="75" y="85" width="15" height="10" fill="#000000" />
              </svg>
            </div>

            <p className="text-[10px] font-bold text-zinc-900 uppercase">
              SCAN WITH PHONE CAMERA
            </p>
            <p className="text-[9px] text-zinc-500 mt-0.5">
              Track live kitchen status & submit your customer review
            </p>

            {/* Simulated QR Scan Interactive Click (Screen only) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTrackerAndReview?.(order);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-black text-xs transition-colors cursor-pointer border border-amber-600 print:hidden"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Simulate QR Scan (Open Tracker & Review)</span>
            </button>
          </div>

          {/* Thermal Tear-off Bottom Message */}
          <div className="mt-4 pt-3 border-t border-dashed border-zinc-400 text-center text-[10px] text-zinc-600">
            <p className="font-bold text-zinc-900">Thank you for dining with Crunchy!</p>
            <p className="text-[9px] text-zinc-500 mt-0.5">
              Share your feedback for 10% OFF coupon • www.crunchy.np
            </p>
          </div>
        </div>

        {/* Modal Action Footer (Hidden on print) */}
        <div className="p-3 bg-[#0E1015] border-t border-zinc-800 flex items-center justify-between gap-2 print:hidden">
          <button
            type="button"
            onClick={handleCopyToken}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
          >
            {copiedToken ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Token</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              id="print-receipt-btn"
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTrackerAndReview?.(order);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border border-amber-600"
            >
              <span>Track & Rate</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
