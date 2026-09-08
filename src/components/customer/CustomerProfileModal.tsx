import React, { useState, useEffect } from "react";
import { User, Phone, Mail, MapPin, Sparkles, Check, Package, X } from "lucide-react";
import { Modal } from "../common/Modal";
import { useApp } from "../../context/AppContext";

export const CustomerProfileModal: React.FC = () => {
  const {
    customerProfile,
    updateCustomerProfile,
    isProfileModalOpen,
    setIsProfileModalOpen,
    setCustomerActiveTab,
  } = useApp();

  const [name, setName] = useState(customerProfile.name);
  const [email, setEmail] = useState(customerProfile.email);
  const [phone, setPhone] = useState(customerProfile.phone);
  const [address, setAddress] = useState(customerProfile.address);
  const [isSaved, setIsSaved] = useState(false);

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
    <Modal
      isOpen={isProfileModalOpen}
      onClose={() => setIsProfileModalOpen(false)}
      maxWidth="md"
      className="border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden rounded-none"
      title={
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-sm sm:text-base">My Profile</span>
        </div>
      }
      description="Contact info & delivery details"
    >
      <div className="space-y-4 py-1">
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

          {/* Action Buttons (Mobile-responsive flex) */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsProfileModalOpen(false);
                setCustomerActiveTab("orders");
              }}
              className="h-10 px-3 rounded-none border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-500" />
              <span>View My Orders</span>
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
      </div>
    </Modal>
  );
};
