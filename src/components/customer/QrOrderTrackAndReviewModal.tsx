import React, { useState, useEffect } from "react";
import {
  Star,
  Sparkles,
  Clock,
  CheckCircle2,
  Check,
  Copy,
  Receipt,
  RotateCcw,
  Send,
  X,
  Flame,
  ChefHat,
  ShoppingBag,
  Bike,
  UtensilsCrossed,
  Car,
  Search,
  MessageSquare,
  Gift,
  ThumbsUp,
  MapPin,
} from "lucide-react";
import { Order, OrderStatus } from "../../types";
import { formatNPR, getElapsedString } from "../../lib/utils";
import { useApp } from "../../context/AppContext";

interface QrOrderTrackAndReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: Order | null;
  onOpenReceipt?: (order: Order) => void;
}

const REVIEW_TAGS = [
  "🔥 Super Crunchy & Hot",
  "⚡ Ultra Fast Prep",
  "🍔 Juicy Smash Patty",
  "🍟 Seasoned Just Right",
  "📦 Eco-Friendly Packaging",
  "🥤 Chilled & Refreshing",
  "👨‍🍳 Friendly Staff",
];

export const QrOrderTrackAndReviewModal: React.FC<QrOrderTrackAndReviewModalProps> = ({
  isOpen,
  onClose,
  initialOrder,
  onOpenReceipt,
}) => {
  const { orders, updateOrderStatus, reorderItems } = useApp();

  // Selected order state
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [searchTokenInput, setSearchTokenInput] = useState<string>("");

  // Review Form States
  const [overallRating, setOverallRating] = useState<number>(5);
  const [foodTasteRating, setFoodTasteRating] = useState<number>(5);
  const [serviceSpeedRating, setServiceSpeedRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "🔥 Super Crunchy & Hot",
    "⚡ Ultra Fast Prep",
  ]);
  const [commentText, setCommentText] = useState<string>("");
  const [isReviewSubmitted, setIsReviewSubmitted] = useState<boolean>(false);
  const [copiedCoupon, setCopiedCoupon] = useState<boolean>(false);

  // Sync selected order on open
  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        setSelectedOrderId(initialOrder.id);
        setSearchTokenInput(initialOrder.kioskToken || initialOrder.orderNumber);
      } else if (orders.length > 0) {
        setSelectedOrderId(orders[0].id);
        setSearchTokenInput(orders[0].kioskToken || orders[0].orderNumber);
      }
      setIsReviewSubmitted(false);
    }
  }, [isOpen, initialOrder, orders]);

  if (!isOpen) return null;

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0] || null;

  const handleTokenSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTokenInput.trim().toUpperCase();
    const match = orders.find(
      (o) =>
        (o.kioskToken && o.kioskToken.toUpperCase().includes(query)) ||
        o.orderNumber.toUpperCase().includes(query) ||
        (o.tableNumber && o.tableNumber.toUpperCase().includes(query))
    );
    if (match) {
      setSelectedOrderId(match.id);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleMarkAsCompleted = () => {
    if (currentOrder) {
      updateOrderStatus(currentOrder.id, "COMPLETED");
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewSubmitted(true);
  };

  const handleCopyCoupon = () => {
    navigator.clipboard?.writeText("CRUNCHYLOVE10");
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const tokenStr = currentOrder?.kioskToken || currentOrder?.orderNumber.replace("CR-", "TK-") || "TK-4821";

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return "Crispy & Flawless! 🔥";
      case 4:
        return "Delicious & Fresh";
      case 3:
        return "Good Meal";
      case 2:
        return "Needs Improvement";
      default:
        return "Disappointing";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0E1015] border border-zinc-800 shadow-2xl overflow-hidden my-auto flex flex-col">
        
        {/* ============================================================ */}
        {/* TOP STATUS BAR: SIMULATING SCANNED SLIP MOBILE VIEWPORT */}
        {/* ============================================================ */}
        <div className="px-4 py-3 bg-[#141720] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Scanned QR Token Slip Tracker
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Token Lookup Bar */}
        <form
          onSubmit={handleTokenSearch}
          className="px-4 py-2.5 bg-[#0C0E14] border-b border-zinc-800 flex items-center gap-2"
        >
          <span className="text-[11px] font-mono text-zinc-400 shrink-0">Token / Slip:</span>
          <input
            type="text"
            value={searchTokenInput}
            onChange={(e) => setSearchTokenInput(e.target.value)}
            placeholder="e.g. TK-4821 or CR-8921"
            className="flex-1 bg-zinc-900 border border-zinc-700 px-2.5 py-1 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500 uppercase"
          />
          <button
            type="submit"
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Lookup
          </button>
        </form>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto space-y-4">
          
          {currentOrder ? (
            <>
              {/* Massive Token Spotlight Card */}
              <div className="p-4 bg-gradient-to-br from-[#12151E] to-[#0A0C10] border border-amber-500/40 relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest block">
                      YOUR LIVE TOKEN NUMBER
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-wider mt-0.5">
                      {tokenStr}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-mono">
                      <span>Order #{currentOrder.orderNumber}</span>
                      <span>•</span>
                      <span>{currentOrder.outletName}</span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-wider ${
                        currentOrder.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : currentOrder.status === "READY"
                          ? "bg-amber-500 text-black font-black animate-pulse"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      }`}
                    >
                      {currentOrder.status === "PROCESSING"
                        ? "Cooking in Kitchen"
                        : currentOrder.status === "READY"
                        ? "Ready for Pickup!"
                        : currentOrder.status === "COMPLETED"
                        ? "Served & Completed"
                        : currentOrder.status}
                    </span>
                    <div className="text-[11px] font-mono text-zinc-400 mt-1.5 flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{getElapsedString(currentOrder.createdAt)} elapsed</span>
                    </div>
                  </div>
                </div>

                {/* Progress Pipeline */}
                <div className="grid grid-cols-3 gap-1.5 pt-4 mt-3 border-t border-zinc-800 text-center text-[10px] font-mono uppercase">
                  <div
                    className={`p-1.5 border ${
                      currentOrder.status !== "CANCELLED"
                        ? "bg-amber-500/15 border-amber-500 text-amber-300 font-bold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    }`}
                  >
                    1. Placed
                  </div>
                  <div
                    className={`p-1.5 border ${
                      currentOrder.status === "PROCESSING" ||
                      currentOrder.status === "READY" ||
                      currentOrder.status === "COMPLETED"
                        ? "bg-amber-500/15 border-amber-500 text-amber-300 font-bold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    }`}
                  >
                    2. Kitchen Prep
                  </div>
                  <div
                    className={`p-1.5 border ${
                      currentOrder.status === "READY" || currentOrder.status === "COMPLETED"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    }`}
                  >
                    3. Ready / Served
                  </div>
                </div>
              </div>

              {/* Order Quick Details & Receipt link */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-900/60 border border-zinc-800 text-xs">
                <span className="text-zinc-400 font-mono">
                  {currentOrder.items.length} item(s) • Total:{" "}
                  <strong className="text-white font-mono">{formatNPR(currentOrder.totalAmount)}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenReceipt?.(currentOrder)}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Slip</span>
                  </button>

                  {/* Manual Mark Complete to test/enable review instantly */}
                  {currentOrder.status !== "COMPLETED" && (
                    <button
                      onClick={handleMarkAsCompleted}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                      title="Simulate receiving food to review experience"
                    >
                      I Got My Order
                    </button>
                  )}
                </div>
              </div>

              {/* ========================================================== */}
              {/* CONDITIONAL: RATE & REVIEW SECTION (When Completed or Ready) */}
              {/* ========================================================== */}
              {currentOrder.status === "COMPLETED" || isReviewSubmitted ? (
                <div className="p-4 sm:p-5 bg-[#12151E] border border-amber-500/50 shadow-xl space-y-4">
                  {!isReviewSubmitted ? (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      {/* Review Header */}
                      <div className="text-center pb-2 border-b border-zinc-800">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-wider mb-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Customer Satisfaction Survey</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white">
                          How was your Crunchy experience today?
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Rate your order for an instant 10% OFF voucher for your next meal!
                        </p>
                      </div>

                      {/* 1. Overall Star Rating */}
                      <div className="text-center space-y-1.5">
                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                          Overall Rating
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setOverallRating(star)}
                              className="p-1 transition-transform hover:scale-110 cursor-pointer"
                              title={`${star} Star`}
                            >
                              <Star
                                className={`w-7 h-7 sm:w-8 sm:h-8 ${
                                  star <= overallRating
                                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                    : "text-zinc-700 hover:text-zinc-500"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <p className="text-xs font-bold text-amber-400 font-mono">
                          {getRatingLabel(overallRating)}
                        </p>
                      </div>

                      {/* 2. Food Taste & Speed Mini Ratings */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                        <div className="p-2.5 bg-zinc-900 border border-zinc-800 text-center">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                            Food Crispiness & Taste
                          </span>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setFoodTasteRating(s)}
                                className="cursor-pointer"
                              >
                                <Flame
                                  className={`w-4 h-4 ${
                                    s <= foodTasteRating
                                      ? "fill-amber-500 text-amber-500"
                                      : "text-zinc-700"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-2.5 bg-zinc-900 border border-zinc-800 text-center">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                            Prep Speed & Service
                          </span>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setServiceSpeedRating(s)}
                                className="cursor-pointer"
                              >
                                <Clock
                                  className={`w-4 h-4 ${
                                    s <= serviceSpeedRating
                                      ? "fill-sky-400 text-sky-400"
                                      : "text-zinc-700"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3. Quick Sentiment Tag Pills */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          What stood out? (Tap tags)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {REVIEW_TAGS.map((tag) => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer border ${
                                  isSelected
                                    ? "bg-amber-500 text-black border-amber-500 font-black shadow-xs"
                                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4. Text Comment Feedback */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Share your feedback for the chef & crew:
                        </label>
                        <textarea
                          rows={2}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="What did you enjoy most about your meal? Any suggestions?"
                          className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        id="submit-customer-review-btn"
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer border border-amber-600 flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Review & Claim 10% OFF Voucher</span>
                      </button>
                    </form>
                  ) : (
                    /* Celebratory Voucher Reward Box after submission */
                    <div className="text-center py-4 space-y-3">
                      <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>

                      <div>
                        <h4 className="text-base font-black text-white">
                          Review Submitted! Thank You!
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                          Your feedback helps our kitchen fry every batch to perfection. Here is your reward:
                        </p>
                      </div>

                      {/* Reward Coupon */}
                      <div className="p-3 bg-zinc-900 border-2 border-dashed border-amber-500 text-center max-w-xs mx-auto">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase block">
                          NEXT ORDER 10% DISCOUNT
                        </span>
                        <div className="text-xl font-mono font-black text-amber-400 tracking-wider my-1">
                          CRUNCHYLOVE10
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCoupon}
                          className="mt-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                        >
                          {copiedCoupon ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Coupon Code</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="pt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            reorderItems(currentOrder);
                            onClose();
                          }}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-Order This Meal</span>
                        </button>

                        <button
                          onClick={onClose}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-colors cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Prompt when order is still in prep */
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 text-center space-y-2">
                  <ChefHat className="w-6 h-6 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-zinc-200">
                    Your meal is currently being fried & packed fresh!
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Once your order is served or handed over, this screen will automatically prompt you to rate your experience and claim your 10% OFF voucher.
                  </p>
                  <button
                    type="button"
                    onClick={handleMarkAsCompleted}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-200 text-xs font-bold transition-all cursor-pointer border border-zinc-700"
                  >
                    <span>Simulate Pickup & Rate Experience</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-zinc-500">
              <Search className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-400">No active token found</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Please enter a valid token number from your printed slip above.
              </p>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 py-3 bg-[#141720] border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500">
            Crunchy Hospitality Portal v2.6 • Real-time Token Sync
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
