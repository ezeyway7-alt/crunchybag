import React, { useEffect, useState, useRef } from "react";
import {
  ShoppingBag,
  Sparkles,
  Heart,
  Search,
  Clock,
  LogOut,
  ChefHat,
  CreditCard,
  ShieldCheck,
  MapPin,
  Moon,
  Sun,
  User,
  Package,
  Tablet,
  Tv,
  QrCode,
  Store,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { QrOrderTrackAndReviewModal } from "../customer/QrOrderTrackAndReviewModal";

export const PortalHeader: React.FC = () => {
  const {
    userRole,
    currentUser,
    logout,
    isDark,
    toggleTheme,
    currentOutlet,
    cart,
    setIsCartDrawerOpen,
    activeOrder,
    setActivePortal,
    customerActiveTab,
    setCustomerActiveTab,
    favorites,
    setIsFavoritesModalOpen,
    setIsSearchModalOpen,
    customerProfile,
    setIsProfileModalOpen,
    loginAsRole,
  } = useApp();

  const { authUser, isAuthenticated, openLoginModal } = useAuth();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isScanQrOpen, setIsScanQrOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Listen for ⌘K or Ctrl+K to trigger instant search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSearchModalOpen]);

  // If logged in as staff (KITCHEN, STAFF, ADMIN), show clean, minimalist operational header
  // (Staff / KDS / Manager temporarily hidden: default to public restaurant customer header)
  const SHOW_STAFF_HEADER = false;
  if (SHOW_STAFF_HEADER && userRole !== "CUSTOMER" && currentUser) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-zinc-950 text-white border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12 gap-3">
          {/* Left: Brand + Clean Small Text Role */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center cursor-pointer group"
              onClick={() => {
                setActivePortal("customer");
                setCustomerActiveTab("menu");
              }}
              title="Home"
            >
              <CrunchyLogo size="md" className="h-9 sm:h-10 max-h-10 w-auto group-hover:opacity-90 transition-opacity" />
            </div>

            <div className="hidden sm:block h-3.5 w-px bg-zinc-800" />

            <div className="flex items-center">
              {userRole === "KITCHEN" && (
                <span className="text-xs text-zinc-400 font-normal">Kitchen Display</span>
              )}
              {userRole === "STAFF" && (
                <span className="text-xs text-zinc-400 font-normal">Staff Counter</span>
              )}
              {userRole === "ADMIN" && (
                <span className="text-xs text-zinc-400 font-normal">Store Manager</span>
              )}
            </div>
          </div>

          {/* Right: Clean minimal text for outlet, user and logout */}
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="hidden md:inline text-zinc-500">{currentOutlet.name}</span>
            <span className="hidden sm:inline text-zinc-400">{currentUser.name}</span>

            <button
              type="button"
              onClick={logout}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer px-1.5 py-0.5"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>
    );
  }

  // PUBLIC RESTAURANT WEBSITE HEADER (Customer View)
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[#0A0A0B] border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Row: Logo, Desktop Search, and Action Icons */}
        <div className="flex items-center justify-between h-14 md:h-16 gap-2 sm:gap-4">
          {/* Left: Brand Logo */}
          <div className="flex items-center shrink-0">
            <div
              onClick={() => {
                setActivePortal("customer");
                setCustomerActiveTab("menu");
              }}
              className="flex items-center cursor-pointer group py-0.5"
              title="Crunchy Bag - Home"
            >
              <CrunchyLogo size="md" className="h-11 sm:h-12 md:h-13.5 max-h-14 w-auto group-hover:scale-105 transition-transform" />
            </div>
          </div>

          {/* Center (Desktop only): Search at top of page in navbar at the center */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8">
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full flex items-center justify-between h-11 bg-[#141416] hover:bg-[#1C1C1F] border border-zinc-700 px-3.5 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-xs sm:text-sm text-zinc-400 font-medium truncate">
                  Search burgers, fried chicken, sides, shakes...
                </span>
              </div>
              <kbd className="inline-flex items-center gap-0.5 shrink-0 text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 font-bold">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Tools: Love Icon, Cart Icon, Yellow Track Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Love / Favorites Icon */}
            <button
              id="header-love-btn"
              onClick={() => setIsFavoritesModalOpen(true)}
              className="relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-rose-400 border border-zinc-700 transition-colors cursor-pointer"
              aria-label="Favorites"
              title="Saved Favorites"
            >
              <Heart className={`h-4 w-4 ${favorites.length > 0 ? "fill-rose-500 text-rose-500" : ""}`} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black h-4 min-w-4 sm:h-4.5 sm:min-w-4.5 px-1 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              id="header-cart-btn"
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
              aria-label="Shopping Cart"
              title="View Cart"
            >
              <ShoppingBag className="h-4 w-4 font-bold" />
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-black h-4 min-w-4 sm:h-4.5 sm:min-w-4.5 px-1 flex items-center justify-center border border-zinc-900">
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Profile Icon with Sub-Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                id="header-profile-btn"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="relative flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 bg-amber-500 hover:bg-amber-400 text-black border border-amber-600 shadow-sm transition-colors cursor-pointer"
                aria-label="User Account Profile"
                title="Account Menu"
              >
                <User className="h-4 w-4 stroke-[2.5]" />
                {activeOrder && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 border border-zinc-900 animate-pulse" />
                )}
              </button>

              {/* Profile Sub-Menu */}
              {isProfileMenuOpen && (
                <div
                  id="profile-dropdown-menu"
                  className="absolute right-0 top-full mt-2 w-52 sm:w-56 max-w-[calc(100vw-1.5rem)] bg-[#121214] border border-zinc-800 shadow-2xl py-1 z-50 text-zinc-100 animate-in fade-in zoom-in-95 duration-100"
                >
                  {/* Customer Info Header */}
                  <div className="px-3.5 py-2.5 border-b border-zinc-800/80 bg-[#161619]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-amber-500 text-black font-black text-xs flex items-center justify-center shrink-0 border border-amber-600">
                        {customerProfile.name.charAt(0) || "A"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-white">
                          {customerProfile.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {customerProfile.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sub-menu Options */}
                  <div className="py-1">
                    {/* Admin Dashboard (if logged in or admin) */}
                    {(isAuthenticated || authUser || userRole === "ADMIN") && (
                      <button
                        id="menu-admin-dashboard-btn"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          if (typeof window !== "undefined") {
                            window.history.pushState(null, "", "/admin");
                            window.dispatchEvent(new PopStateEvent("popstate"));
                          }
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors text-left cursor-pointer border-b border-zinc-800/60 pb-2 mb-1"
                      >
                        <div className="flex items-center gap-2.5">
                          <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Admin Dashboard</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-500 text-black">
                          OPEN
                        </span>
                      </button>
                    )}

                    {/* Admin Login (if guest / not logged in) */}
                    {!isAuthenticated && !authUser && (
                      <button
                        id="menu-admin-login-btn"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          openLoginModal();
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-amber-400 hover:bg-amber-500/10 transition-colors text-left cursor-pointer border-b border-zinc-800/60 pb-2 mb-1"
                      >
                        <div className="flex items-center gap-2.5">
                          <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Admin Portal Login</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">&rarr;</span>
                      </button>
                    )}

                    {/* 1. My Profile */}
                    <button
                      id="menu-my-profile-btn"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-amber-500/10 hover:text-amber-400 transition-colors text-left cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>My Profile</span>
                    </button>

                    {/* 2. My Orders */}
                    <button
                      id="menu-my-orders-btn"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setCustomerActiveTab("orders");
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-amber-500/10 hover:text-amber-400 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>My Orders</span>
                      </div>
                      {activeOrder ? (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-500 text-black">
                          1 Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">View</span>
                      )}
                    </button>

                    {/* 3. Scan QR Slip & Rate/Review */}
                    <button
                      id="menu-scan-qr-slip-btn"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsScanQrOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <QrCode className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Track QR Slip & Review</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/20 text-amber-500">
                        Scan
                      </span>
                    </button>

                    {/* Self-Order Tablet Kiosk */}
                    <button
                      id="menu-launch-kiosk-btn"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        loginAsRole("KIOSK");
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Tablet className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Touch Screen Kiosk</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/20 text-amber-500">
                        Tablet
                      </span>
                    </button>

                    <button
                      id="menu-launch-tv-btn"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setActivePortal("tv");
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Tv className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Live TV Order Board</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500">
                        Airport FIDS
                      </span>
                    </button>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 my-0.5" />

                  {/* 4. Logout */}
                  <div className="p-1">
                    <button
                      id="menu-logout-btn"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Row (< md) */}
        <div className="md:hidden pb-2.5">
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full flex items-center justify-between h-9.5 bg-[#141416] hover:bg-[#1C1C1F] border border-zinc-700 px-3 text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
              <Search className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Search burgers, fried chicken, shakes...</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold uppercase">
              Search
            </span>
          </button>
        </div>
      </div>

      {/* Scanned QR Slip Order Tracker & Rate/Review Modal */}
      <QrOrderTrackAndReviewModal
        isOpen={isScanQrOpen}
        onClose={() => setIsScanQrOpen(false)}
      />
    </header>
  );
};
