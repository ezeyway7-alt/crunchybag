import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Check,
  Package,
  X,
  RotateCcw,
  Receipt,
  Star,
  Clock,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { useApp } from "../../context/AppContext";
import { Order } from "../../types";
import { formatNPR } from "../../lib/utils";
import { PrintableTokenReceiptModal } from "./PrintableTokenReceiptModal";
import { QrOrderTrackAndReviewModal } from "./QrOrderTrackAndReviewModal";

export const CustomerProfileModal: React.FC = () => {
  const {
    customerProfile,
    updateCustomerProfile,
    isProfileModalOpen,
    setIsProfileModalOpen,
    setCustomerActiveTab,
    orders,
    reorderItems,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [name, setName] = useState(customerProfile.name);
  const [email, setEmail] = useState(customerProfile.email);
  const [phone, setPhone] = useState(customerProfile.phone);
  const [address, setAddress] = useState(customerProfile.address);
  const [isSaved, setIsSaved] = useState(false);

  // Sub-modals for receipt and review
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (isProfileModalOpen) {
      setName(customerProfile.name);
      setEmail(customerProfile.email);
      setPhone(customerProfile.phone);
      setAddress(customerProfile.address);
      setIsSaved(false);
    }
  }, [isProfileModalOpen, customerProfile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerProfile({
      name: name.trim() || customerProfile.name,
      email: email.trim() || customerProfile.email,
      phone: phone.trim() || customerProfile.phone,
      address: address.trim() || customerProfile.address,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsProfileModalOpen(false);
    }, 700);
  };

  return (
    <>
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        maxWidth="lg"
        className="border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden rounded-none"
        title={
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-sm sm:text-base">My Account & Orders</span>
          </div>
        }
        description="Contact details, past order history & 1-click reorder"
      >
        <div className="space-y-4 py-1">
          {/* Top Tabs Switcher */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 -mx-4 sm:-mx-6 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === "profile"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400 font-black"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400 font-black"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Past Order History</span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold">
                {orders.length}
              </span>
            </button>
          </div>

          {activeTab === "profile" ? (
            <>
              {/* Compact Account Card */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 rounded-none flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-none bg-amber-500 text-black font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {name.charAt(0) || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                      {name || "Customer"}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {email || "Customer Account"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-none border border-amber-500/20 shrink-0">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{customerProfile.points} Pts</span>
                </div>
              </div>

              {/* Edit Profile Form */}
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 h-10 text-xs sm:text-sm bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-700/80 rounded-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 h-10 text-xs sm:text-sm bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-700/80 rounded-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                        placeholder="+977 98XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 h-10 text-xs sm:text-sm bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-700/80 rounded-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Delivery Address
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 h-10 text-xs sm:text-sm bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-700/80 rounded-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                      placeholder="Street name, building, apartment or area"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="h-10 px-3 rounded-none border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    <span>View Order History ({orders.length})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(false)}
                      className="flex-1 sm:flex-initial h-10 px-3 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="save-profile-btn"
                      className="flex-1 sm:flex-initial h-10 px-4 rounded-none bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer border border-amber-600"
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            /* PAST ORDER HISTORY & 1-CLICK RE-ORDER TAB */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Recent Orders & Reorder
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  Showing {orders.length} order(s)
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No past orders yet</p>
                  <p className="text-[11px] text-zinc-500">
                    Place an order from our menu to track your tokens and repeat favorites with 1 tap.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {orders.map((order) => {
                    const tokenStr = order.kioskToken || order.orderNumber.replace("CR-", "TK-");

                    return (
                      <div
                        key={order.id}
                        className="p-3.5 bg-white dark:bg-[#12141A] border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        {/* Left: Order Info & Items */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                              {tokenStr}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500">
                              #{order.orderNumber}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              {order.fulfillmentType.replace("_", " ")}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                order.status === "COMPLETED"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium truncate">
                            {order.items?.map((i) => `${i.quantity}x ${i.productName}`)?.join(", ") || "No items"}
                          </p>

                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(order.createdAt).toLocaleDateString()} at{" "}
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>•</span>
                            <span className="font-bold text-zinc-900 dark:text-white">
                              {formatNPR(order.totalAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Right: Quick Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Printable Token Slip */}
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                            title="View & Print Token Receipt Slip"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          {/* Track & Review */}
                          <button
                            type="button"
                            onClick={() => setSelectedReviewOrder(order)}
                            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-amber-500 text-xs font-bold transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                            title="Track live or leave review"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>

                          {/* 1-Click Reorder */}
                          <button
                            type="button"
                            onClick={() => {
                              reorderItems(order);
                              setIsProfileModalOpen(false);
                            }}
                            className="h-8 px-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-amber-600"
                          >
                            <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                            <span>1-Click Reorder</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Printable Receipt Modal */}
      {selectedReceiptOrder && (
        <PrintableTokenReceiptModal
          order={selectedReceiptOrder}
          isOpen={!!selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          onOpenTrackerAndReview={(ord) => {
            setSelectedReceiptOrder(null);
            setSelectedReviewOrder(ord);
          }}
        />
      )}

      {/* QR Token Track & Review Modal */}
      {selectedReviewOrder && (
        <QrOrderTrackAndReviewModal
          isOpen={!!selectedReviewOrder}
          onClose={() => setSelectedReviewOrder(null)}
          initialOrder={selectedReviewOrder}
          onOpenReceipt={(ord) => {
            setSelectedReviewOrder(null);
            setSelectedReceiptOrder(ord);
          }}
        />
      )}
    </>
  );
};
