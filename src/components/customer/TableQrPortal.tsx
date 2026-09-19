import React, { useState, useMemo, useEffect } from "react";
import {
  Utensils,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Search,
  Sparkles,
  Flame,
  Drumstick,
  Coffee,
  LayoutGrid,
  ChevronRight,
  QrCode,
  Printer,
  Copy,
  Clock,
  ArrowRight,
  X,
  Phone,
  User,
  CreditCard,
  Banknote,
  Receipt,
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Star,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Product, ProductVariant, SelectedModifier, Order, PaymentMethod } from "../../types";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { ProductConfiguratorModal } from "./ProductConfiguratorModal";
import { QrOrderTrackAndReviewModal } from "./QrOrderTrackAndReviewModal";
import { SkeletonProductGrid } from "../common/Skeleton";

// Quick Web Audio feedback helper for tactile mobile ordering
const playMobileSound = (type: "tap" | "add" | "success" | "beep") => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "tap") {
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "add") {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "success") {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Audio context may be restricted before user gesture
  }
};

interface TableQrPortalProps {
  onClose?: () => void;
}

export const TableQrPortal: React.FC<TableQrPortalProps> = ({ onClose }) => {
  const {
    products,
    categories,
    tableNumber,
    setTableNumber,
    cart,
    addToCart,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    currentOutlet,
    orders,
    findActiveOrderByTableOrPhone,
    placeTableOrder,
    addItemsToRunningOrder,
    customerProfile,
    setIsTableOrderMode,
    addToast,
    isLoadingSkeleton,
  } = useApp();

  // Local state
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  const handleCategorySelect = (cat: string) => {
    if (cat === activeCategory) return;
    setIsCategoryLoading(true);
    setActiveCategory(cat);
    playMobileSound("tap");
    setTimeout(() => setIsCategoryLoading(false), 180);
  };
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Phone number state for lookup & ordering (optional)
  const [phoneNumber, setPhoneNumber] = useState<string>(customerProfile.phone || "");
  const [guestName, setGuestName] = useState<string>(customerProfile.name || "");
  const [tableNotes, setTableNotes] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("PAY_AT_COUNTER");

  // Modals & Sheets
  const [isConfirmDrawerOpen, setIsConfirmDrawerOpen] = useState(false);
  const [isTableSwitcherOpen, setIsTableSwitcherOpen] = useState(false);
  const [isTokenCopied, setIsTokenCopied] = useState(false);
  const [placedOrderResult, setPlacedOrderResult] = useState<Order | null>(null);
  const [showActiveTabDetails, setShowActiveTabDetails] = useState(false);
  const [diningMode, setDiningMode] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [isTrackReviewOpen, setIsTrackReviewOpen] = useState(false);

  // Determine active running table order
  const activeRunningOrder = useMemo(() => {
    return findActiveOrderByTableOrPhone(
      diningMode === "DINE_IN" ? tableNumber : null,
      phoneNumber
    );
  }, [findActiveOrderByTableOrPhone, tableNumber, phoneNumber, orders, diningMode]);

  // Set placed order result if active order already exists on initial load
  useEffect(() => {
    if (activeRunningOrder && !placedOrderResult) {
      // Keep tracking existing active table tab
    }
  }, [activeRunningOrder, placedOrderResult]);

  // Available tables list
  const AVAILABLE_TABLES = [
    "Table 01",
    "Table 02",
    "Table 03",
    "Table 04",
    "Table 05",
    "Table 06",
    "Table 07",
    "Table 08",
    "Table 10",
    "Table 12",
    "Table 15",
    "Patio 01",
    "Bar Counter",
  ];

  // Category icons mapper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Flame":
        return <Flame className="w-3.5 h-3.5" />;
      case "Drumstick":
        return <Drumstick className="w-3.5 h-3.5" />;
      case "Coffee":
        return <Coffee className="w-3.5 h-3.5" />;
      case "Sparkles":
        return <Sparkles className="w-3.5 h-3.5" />;
      default:
        return <Utensils className="w-3.5 h-3.5" />;
    }
  };

  // Filtered menu items
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.showOnQr === false) return false;
      const matchCat =
        activeCategory === "all" ||
        (activeCategory === "special" && (p.dietary.includes("Chef's Choice") || p.dietary.includes("Popular"))) ||
        p.categoryId === activeCategory;

      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Quick Add Item
  const handleQuickAdd = (product: Product) => {
    playMobileSound("add");
    // If product has complex required modifiers or variants > 1, open modal
    if (
      product.variants.length > 1 ||
      product.modifierGroups.some((g) => g.required)
    ) {
      setCustomizingProduct(product);
      return;
    }
    const defaultVariant = product.variants[0] || {
      id: "def-v",
      name: "Standard",
      price: product.basePrice,
    };
    addToCart(product, defaultVariant, [], 1);
  };

  // Check if item is in cart
  const getCartQuantityForProduct = (productId: string) => {
    return cart.items
      .filter((i) => i.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Handle Order Submit (Either initial table order or add items to running order)
  const handleConfirmOrder = () => {
    if (cart.items.length === 0) return;
    playMobileSound("success");

    if (activeRunningOrder) {
      // Append to running order (Round 2+)
      const updated = addItemsToRunningOrder(activeRunningOrder.id, cart.items);
      if (updated) {
        setPlacedOrderResult(updated);
        setIsConfirmDrawerOpen(false);
      }
    } else {
      // Create new table order (Round 1)
      const newOrder = placeTableOrder({
        tableNumber: diningMode === "DINE_IN" ? (tableNumber || "Table 04") : "Takeaway Counter",
        customerName: guestName.trim() || "Table Guest",
        customerPhone: phoneNumber.trim() || customerProfile.phone,
        paymentMethod: selectedPaymentMethod,
        fulfillmentType: diningMode === "DINE_IN" ? "DINE_IN" : "TAKEAWAY",
        notes: tableNotes,
      });
      setPlacedOrderResult(newOrder);
      setIsConfirmDrawerOpen(false);
    }
  };

  // Copy token to clipboard
  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setIsTokenCopied(true);
    addToast({
      title: "Kiosk Token Copied",
      description: `Code ${token} copied to clipboard`,
      type: "info",
    });
    setTimeout(() => setIsTokenCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090C] text-zinc-100 flex flex-col font-sans pb-28 select-none antialiased">
      {/* -------------------------------------------------------------
          TOP BAR: BRAND, TABLE CHIP, DINING MODE, AND EXIT
      ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#0E0E12]/95 backdrop-blur-md border-b border-zinc-800/80 px-3.5 py-2.5 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo only (no confusing flagship title or blinking dot) */}
          <div className="flex items-center">
            <CrunchyLogo size="sm" className="h-7 w-auto" />
          </div>

          {/* Table Badge & Dining Mode Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsTableSwitcherOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
              title="Change Table"
            >
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span>{tableNumber || "Select Table"}</span>
            </button>

            {/* Quick Dining Toggle */}
            <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 text-[10px] font-bold">
              <button
                onClick={() => {
                  setDiningMode("DINE_IN");
                  playMobileSound("tap");
                }}
                className={`px-2 py-0.5 transition-all ${
                  diningMode === "DINE_IN"
                    ? "bg-amber-500 text-black font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Dine-In
              </button>
              <button
                onClick={() => {
                  setDiningMode("TAKEAWAY");
                  playMobileSound("tap");
                }}
                className={`px-2 py-0.5 transition-all ${
                  diningMode === "TAKEAWAY"
                    ? "bg-sky-500 text-black font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Takeaway
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800/80 border border-zinc-700/60 transition-colors ml-0.5"
                title="Exit"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          BEZEL-LESS SLIM CONTACT & SEARCH BAR (NOT COMPULSORY, OPTIONAL)
      ------------------------------------------------------------- */}
      <section className="bg-[#0D0D11] border-b border-zinc-800/60 px-3.5 py-2.5">
        <div className="max-w-md mx-auto space-y-2">
          {/* Optional Contact Number & Customer Name */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141418] border border-zinc-800/80 focus-within:border-amber-500/80 transition-colors">
              <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contact Number (Optional)"
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141418] border border-zinc-800/80 focus-within:border-amber-500/80 transition-colors">
              <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Customer Name (Optional)"
                className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="relative flex items-center bg-[#141418] border border-zinc-800/80 px-2.5 py-1.5 focus-within:border-amber-500/80 transition-colors">
            <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search burgers, tenders, drinks..."
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-zinc-500 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ACTIVE RUNNING TAB ALERT (Shown only when active order tab exists) */}
          {activeRunningOrder && (
            <div className="bg-amber-950/30 border border-amber-500/40 p-2 text-xs text-zinc-300">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-bold text-white text-[11px]">
                    Active Tab #{activeRunningOrder.orderNumber}
                  </span>
                  <span className="text-amber-400 font-mono text-[11px]">
                    (Rs. {activeRunningOrder.totalAmount})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowActiveTabDetails(!showActiveTabDetails)}
                  className="text-[10px] text-amber-400 underline font-bold"
                >
                  {showActiveTabDetails ? "Hide" : "View Items"}
                </button>
              </div>

              {showActiveTabDetails && (
                <div className="mt-2 pt-2 border-t border-zinc-800 space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                  {activeRunningOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[10.5px] text-zinc-400 bg-black/40 px-2 py-0.5"
                    >
                      <span>
                        {item.quantity}x {item.productName} ({item.variantName})
                      </span>
                      <span className="font-mono text-zinc-200">Rs. {item.lineTotal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------
          CATEGORY FILTER TRACK (HORIZONTAL SCROLL)
      ------------------------------------------------------------- */}
      <div className="sticky top-[49px] z-30 bg-[#09090C]/95 backdrop-blur-md border-b border-zinc-800/80 py-2 px-3.5">
        <div className="max-w-md mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleCategorySelect("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === "all"
                ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                : "bg-[#141418] text-zinc-300 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Menu</span>
          </button>

          <button
            onClick={() => handleCategorySelect("special")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === "special"
                ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                : "bg-[#141418] text-zinc-300 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Specials</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat.id
                  ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                  : "bg-[#141418] text-zinc-300 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {getCategoryIcon(cat.iconName)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------
          MENU ITEMS LIST / GRID
      ------------------------------------------------------------- */}
      <main className="max-w-md mx-auto px-3.5 py-3 w-full flex-1 space-y-2.5">
        {isLoadingSkeleton || isCategoryLoading ? (
          <SkeletonProductGrid count={6} />
        ) : (
          <>
            {filteredProducts.map((product) => {
          const qtyInCart = getCartQuantityForProduct(product.id);
          const hasCustomizations =
            product.variants.length > 1 || product.modifierGroups.length > 0;

          return (
            <div
              key={product.id}
              className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 transition-all p-2.5 flex items-center gap-3 shadow-sm"
            >
              {/* Product Thumbnail */}
              <div
                onClick={() => setCustomizingProduct(product)}
                className="relative w-20 h-20 bg-zinc-900 overflow-hidden shrink-0 cursor-pointer"
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                {product.dietary.includes("Chef's Choice") && (
                  <span className="absolute top-1 left-1 bg-amber-500 text-black font-black text-[8px] px-1 uppercase">
                    Chef
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3
                  onClick={() => setCustomizingProduct(product)}
                  className="text-xs font-bold text-white line-clamp-1 cursor-pointer hover:text-amber-400 transition-colors"
                >
                  {product.name}
                </h3>
                <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-black text-amber-400 font-mono">
                    Rs. {product.basePrice}
                  </span>

                  {/* Add / Qty Controls */}
                  {qtyInCart > 0 ? (
                    <div className="flex items-center bg-zinc-900 border border-amber-500/50">
                      <button
                        onClick={() => {
                          playMobileSound("tap");
                          const matchingCartItem = cart.items.find((ci) => ci.productId === product.id);
                          if (matchingCartItem) {
                            if (matchingCartItem.quantity > 1) {
                              updateCartItemQty(matchingCartItem.cartItemId, -1);
                            } else {
                              removeCartItem(matchingCartItem.cartItemId);
                            }
                          }
                        }}
                        className="p-1 text-amber-400 hover:bg-zinc-800 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-white">
                        {qtyInCart}
                      </span>
                      <button
                        onClick={() => handleQuickAdd(product)}
                        className="p-1 text-amber-400 hover:bg-zinc-800 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleQuickAdd(product)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 shadow cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>{hasCustomizations ? "Add" : "Add"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-zinc-500 space-y-2">
            <Search className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs">No items match your search query.</p>
            <button
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
              className="text-xs text-amber-400 underline font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
          </>
        )}
      </main>

      {/* -------------------------------------------------------------
          BOTTOM STICKY ORDER BAR: CART PREVIEW & CONFIRM BUTTON
      ------------------------------------------------------------- */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0F0F14]/98 backdrop-blur-lg border-t border-zinc-800 p-3 shadow-2xl">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="font-bold text-white">
                  {cart.items.reduce((s, i) => s + i.quantity, 0)} items in tray
                </span>
                <span>•</span>
                <span className="text-amber-400 font-mono font-black text-sm">
                  Rs. {cart.finalTotal}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 truncate">
                {activeRunningOrder
                  ? `Appending to ${activeRunningOrder.tableNumber || "Table"} Tab`
                  : diningMode === "DINE_IN"
                    ? tableNumber
                      ? `Dining at ${tableNumber}`
                      : "Dine-In Order"
                    : "Takeaway Order"}
              </p>
            </div>

            <button
              onClick={() => {
                playMobileSound("tap");
                setIsConfirmDrawerOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span>
                {activeRunningOrder
                  ? `Add to Tab (R${(activeRunningOrder.roundsCount || 1) + 1})`
                  : "Review & Order"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUCCESS & KIOSK PRINT TOKEN MODAL
      ------------------------------------------------------------- */}
      {placedOrderResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-amber-500/60 max-w-sm w-full p-5 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-500 text-black mx-auto flex items-center justify-center font-black">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold">
                Order Sent to Kitchen
              </span>
              <h2 className="text-lg font-black text-white uppercase mt-0.5">
                {placedOrderResult.tableNumber || "Table"} Order Confirmed!
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Order #{placedOrderResult.orderNumber} • Round {placedOrderResult.roundsCount || 1}
              </p>
            </div>

            {/* Unique Kiosk Print Token Highlight Card */}
            <div className="bg-black/60 border border-dashed border-amber-500/80 p-3.5 space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                YOUR UNIQUE KIOSK PRINT TOKEN
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-black font-mono tracking-widest text-amber-400">
                  {placedOrderResult.kioskToken || "TK-4821"}
                </span>
                <button
                  onClick={() => handleCopyToken(placedOrderResult.kioskToken || "TK-4821")}
                  className="p-1.5 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                  title="Copy Token"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Simulated thermal barcode representation */}
              <div className="flex items-center justify-center gap-0.5 py-1 opacity-70">
                <span className="h-6 w-0.5 bg-white inline-block" />
                <span className="h-6 w-1 bg-white inline-block" />
                <span className="h-6 w-0.5 bg-white inline-block" />
                <span className="h-6 w-1.5 bg-white inline-block" />
                <span className="h-6 w-0.5 bg-white inline-block" />
                <span className="h-6 w-2 bg-white inline-block" />
                <span className="h-6 w-0.5 bg-white inline-block" />
                <span className="h-6 w-1 bg-white inline-block" />
                <span className="h-6 w-0.5 bg-white inline-block" />
                <span className="h-6 w-1.5 bg-white inline-block" />
                <span className="h-6 w-0.5 bg-white inline-block" />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-2 text-left text-[10.5px] text-amber-200/90 leading-tight">
                <div className="flex items-start gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Want a physical token?</strong> Enter code <strong>{placedOrderResult.kioskToken || "TK-4821"}</strong> at any Crunchy Kiosk to print your slip anytime!
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setIsTrackReviewOpen(true);
                  playMobileSound("tap");
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                <span>Track Live Order & Review (QR Slip)</span>
              </button>

              <button
                onClick={() => {
                  setPlacedOrderResult(null);
                  playMobileSound("tap");
                }}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Order More Items (Add to Table)
              </button>

              <button
                onClick={() => {
                  setPlacedOrderResult(null);
                  if (onClose) onClose();
                }}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider transition-all border border-zinc-800"
              >
                Done / Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CONFIRM ORDER MODAL / DRAWER
      ------------------------------------------------------------- */}
      {isConfirmDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#121217] border-t sm:border border-zinc-800 max-w-md w-full p-4 sm:p-5 text-left space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white uppercase">
                  {activeRunningOrder
                    ? `Add Round ${(activeRunningOrder.roundsCount || 1) + 1} to Table Tab`
                    : "Confirm Table Order"}
                </h3>
              </div>
              <button
                onClick={() => setIsConfirmDrawerOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items Summary in Tray */}
            <div className="space-y-2 bg-black/40 p-2.5 border border-zinc-800/80">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Items to Send to Kitchen
              </span>
              {cart.items.map((ci) => (
                <div
                  key={ci.cartItemId}
                  className="flex items-center justify-between text-xs text-zinc-300"
                >
                  <span className="truncate pr-2">
                    {ci.quantity}x {ci.productName} ({ci.variant.name})
                  </span>
                  <span className="font-mono text-amber-400 font-bold shrink-0">
                    Rs. {ci.lineTotal}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-bold text-white">
                <span>Round Total</span>
                <span className="font-mono text-amber-400 text-sm font-black">
                  Rs. {cart.finalTotal}
                </span>
              </div>
            </div>

            {/* Table & Guest Details */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1">
                    Table / Spot
                  </label>
                  <div className="bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs text-white font-mono font-bold flex items-center justify-between">
                    <span>{diningMode === "DINE_IN" ? (tableNumber || "Select Table") : "Takeaway"}</span>
                    <button
                      type="button"
                      onClick={() => setIsTableSwitcherOpen(true)}
                      className="text-[10px] text-amber-400 underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1">
                  Contact Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1">
                  Payment Preference
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("PAY_AT_COUNTER")}
                    className={`p-2 border text-center transition-all ${
                      selectedPaymentMethod === "PAY_AT_COUNTER"
                        ? "bg-amber-500 text-black border-amber-500 font-black"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    Pay Later at Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("FONEPAY_QR")}
                    className={`p-2 border text-center transition-all ${
                      selectedPaymentMethod === "FONEPAY_QR"
                        ? "bg-amber-500 text-black border-amber-500 font-black"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    Fonepay / eSewa
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("CASH_ON_PICKUP")}
                    className={`p-2 border text-center transition-all ${
                      selectedPaymentMethod === "CASH_ON_PICKUP"
                        ? "bg-amber-500 text-black border-amber-500 font-black"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>

              {/* Kitchen Special Notes */}
              <div>
                <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1">
                  Kitchen Notes / Requests
                </label>
                <input
                  type="text"
                  value={tableNotes}
                  onChange={(e) => setTableNotes(e.target.value)}
                  placeholder="Special notes"
                  className="w-full bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Confirm Submit */}
            <div className="pt-2">
              <button
                onClick={handleConfirmOrder}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <span>
                  {activeRunningOrder
                    ? `Send Round ${(activeRunningOrder.roundsCount || 1) + 1} to Kitchen`
                    : "Send Order to Kitchen"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TABLE SWITCHER MODAL
      ------------------------------------------------------------- */}
      {isTableSwitcherOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-zinc-800 max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black text-white uppercase">
                  Select Table or Dining Mode
                </h3>
              </div>
              <button
                onClick={() => setIsTableSwitcherOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">
                Dine-In Tables
              </span>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_TABLES.map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => {
                      setTableNumber(tbl);
                      setDiningMode("DINE_IN");
                      setIsTableSwitcherOpen(false);
                      playMobileSound("tap");
                    }}
                    className={`py-2 px-1 text-xs font-bold border text-center transition-all ${
                      tableNumber === tbl && diningMode === "DINE_IN"
                        ? "bg-amber-500 text-black border-amber-500 font-black"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  setDiningMode("TAKEAWAY");
                  setIsTableSwitcherOpen(false);
                  playMobileSound("tap");
                }}
                className={`w-full py-2 text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  diningMode === "TAKEAWAY"
                    ? "bg-sky-500 text-black border-sky-500 font-black"
                    : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Switch to Takeaway / Self-Pickup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          PRODUCT CONFIGURATOR MODAL FOR VARIANTS & MODIFIERS
      ------------------------------------------------------------- */}
      {customizingProduct && (
        <ProductConfiguratorModal
          product={customizingProduct}
          isOpen={!!customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onAddToCart={(product, variant, modifiers, qty) => {
            playMobileSound("add");
            addToCart(product, variant, modifiers, qty);
            setCustomizingProduct(null);
          }}
        />
      )}

      {/* Scanned QR Slip Order Tracker & Rate/Review Modal */}
      <QrOrderTrackAndReviewModal
        isOpen={isTrackReviewOpen}
        onClose={() => setIsTrackReviewOpen(false)}
        initialOrder={placedOrderResult || activeRunningOrder}
      />
    </div>
  );
};
