import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Flame,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Printer,
  QrCode,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Wallet,
  Copy,
  Clock,
  CheckCircle2,
  Utensils,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Info,
  Sliders,
  Receipt,
  Tag,
  AlertCircle,
  Search,
  Phone,
  User,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Product, ProductVariant, SelectedModifier, FulfillmentType, PaymentMethod, Category, Order } from "../../types";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { formatNPR } from "../../lib/utils";
import { ComboPackageModal, ComboPackageDefinition } from "../customer/ComboPackageModal";
import { SkeletonProductGrid } from "../common/Skeleton";
import { BANNER_SLIDES } from "../customer/HeroBannerSlider";

// Kiosk Order Step Flow
type KioskStep = "ATTRACT" | "FULFILLMENT" | "MENU" | "CUSTOMIZE" | "CART_REVIEW" | "PAYMENT" | "RECEIPT_TOKEN";

export const KioskPortal: React.FC = () => {
  const {
    products,
    categories,
    currentOutlet,
    placeTakeawayOrder,
    logout,
    addToast,
    lookupOrderByTokenOrCode,
    orders,
    isLoadingSkeleton,
  } = useApp();

  // Navigation State
  const [step, setStep] = useState<KioskStep>("ATTRACT");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("DINE_IN");
  const [tableNumber, setTableNumber] = useState<string>("12");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  const handleCategorySelect = (catId: string) => {
    if (catId === selectedCategory) return;
    setIsCategoryLoading(true);
    setSelectedCategory(catId);
    setSearchQuery("");
    setTimeout(() => setIsCategoryLoading(false), 180);
  };
  const [searchQuery, setSearchQuery] = useState("");

  // Table QR Token Lookup & Thermal Print State
  const [isTokenPrintLookupModalOpen, setIsTokenPrintLookupModalOpen] = useState(false);
  const [tokenLookupQuery, setTokenLookupQuery] = useState("");
  const [tokenLookupResult, setTokenLookupResult] = useState<Order | null>(null);
  const [tokenLookupError, setTokenLookupError] = useState<string | null>(null);

  // Reservation Search State for Home Landing Screen
  const [reservationQuery, setReservationQuery] = useState("");
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [reservationCodeLinked, setReservationCodeLinked] = useState<string | null>(null);

  // Guest Contact Information (Optional in header tray between dine-in and speaker)
  const [guestPhone, setGuestPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Kiosk Cart State (independent fast-lane cart for tablet)
  interface KioskCartItem {
    id: string;
    product: Product;
    variant: ProductVariant;
    modifiers: SelectedModifier[];
    quantity: number;
    specialInstructions?: string;
    unitPrice: number;
    lineTotal: number;
  }
  const [kioskCart, setKioskCart] = useState<KioskCartItem[]>([]);

  // Item customization modal
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [activeVariant, setActiveVariant] = useState<ProductVariant | null>(null);
  const [activeModifiers, setActiveModifiers] = useState<SelectedModifier[]>([]);
  const [activeQty, setActiveQty] = useState(1);
  const [activeNotes, setActiveNotes] = useState("");

  // Combo Package Configurator State (shared reusable modal with web customer portal)
  const [selectedCombo, setSelectedCombo] = useState<ComboPackageDefinition | null>(null);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const kioskFeaturedScrollRef = useRef<HTMLDivElement>(null);
  const [activeKioskSlide, setActiveKioskSlide] = useState(0);

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("FONEPAY_QR");
  const [qrProvider, setQrProvider] = useState<"ESEWA" | "KHALTI" | "BANK">("ESEWA");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Completed Token State
  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [orderTimeEstimate, setOrderTimeEstimate] = useState<string>("8 - 12 Mins");
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string>("");
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [hasPrinted, setHasPrinted] = useState<boolean>(false);

  // Auto-reset timer for inactivity on kiosk
  const [idleSeconds, setIdleSeconds] = useState(0);
  const IDLE_TIMEOUT_LIMIT = 90; // Reset after 90 seconds of inactivity to Attract Screen

  // Sound effects toggle
  const [soundMuted, setSoundMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sound generator helper using Web Audio API
  const playKioskSound = (type: "beep" | "success" | "tap" | "print") => {
    if (soundMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "tap") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "beep") {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "success") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === "print") {
        // rapid white noise or intermittent mechanical clicks
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Inactivity tracking
  useEffect(() => {
    if (step === "ATTRACT") return;

    const timer = setInterval(() => {
      setIdleSeconds((prev) => {
        if (prev >= IDLE_TIMEOUT_LIMIT) {
          handleResetToAttract();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    const resetIdle = () => setIdleSeconds(0);
    window.addEventListener("pointerdown", resetIdle);
    window.addEventListener("touchstart", resetIdle);

    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
    };
  }, [step]);

  // Fullscreen toggle handler
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleResetToAttract = () => {
    setStep("ATTRACT");
    setKioskCart([]);
    setSelectedCategory("all");
    setSearchQuery("");
    setReservationQuery("");
    setReservationError(null);
    setReservationCodeLinked(null);
    setGuestPhone("");
    setGuestName("");
    setPhoneVerified(false);
    setSelectedPaymentMethod("FONEPAY_QR");
    setQrProvider("ESEWA");
    setCustomizingProduct(null);
    setSelectedCombo(null);
    setIsComboModalOpen(false);
    setPaymentProcessing(false);
    setPaymentSuccess(false);
    setHasPrinted(false);
    setIsPrinting(false);
    setIdleSeconds(0);
  };

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = reservationQuery.trim();
    if (!clean) {
      setReservationError("Please enter your reservation number or contact phone");
      return;
    }
    setReservationError(null);
    const code = clean.toUpperCase();
    const formatted =
      code.startsWith("TBL-") || code.startsWith("RSV-")
        ? code
        : !isNaN(Number(code)) && code.length <= 4
          ? `TBL-${code}`
          : `RSV-${code}`;

    setReservationCodeLinked(formatted);
    const digits = code.replace(/\D/g, "");
    if (digits) {
      setTableNumber(digits.slice(-2) || "12");
      if (digits.length >= 7) {
        setGuestPhone(digits);
        setPhoneVerified(true);
      }
    }
    setFulfillment("DINE_IN");
    playKioskSound("beep");
    addToast({
      type: "success",
      message: `Reservation ${formatted} linked. Welcome! Please select items for your table.`,
    });
    setStep("MENU");
  };

  // -------------------------------------------------------------
  // TABLE QR TOKEN LOOKUP & REPRINT FUNCTIONS
  // -------------------------------------------------------------
  const handleTokenLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = tokenLookupQuery.trim();
    if (!clean) {
      setTokenLookupError("Please enter your Table Token (e.g. TK-4821), Order #, Table, or Phone");
      return;
    }
    setTokenLookupError(null);
    const found = lookupOrderByTokenOrCode(clean);
    if (found) {
      setTokenLookupResult(found);
      playKioskSound("beep");
    } else {
      setTokenLookupError(`No active order found matching "${clean}". Please verify your token code.`);
    }
  };

  const handlePrintLookedUpOrder = (targetOrder: Order) => {
    playKioskSound("tap");
    const token = targetOrder.kioskToken || `T-${targetOrder.orderNumber.replace(/\D/g, "").slice(-3) || "108"}`;
    setGeneratedToken(token);
    setCompletedOrderNumber(targetOrder.orderNumber);
    setFulfillment(targetOrder.fulfillmentType);
    setTableNumber(targetOrder.tableNumber ? targetOrder.tableNumber.replace(/\D/g, "") || "12" : "12");
    setGuestName(targetOrder.customerName);
    setGuestPhone(targetOrder.customerPhone);
    setOrderTimeEstimate(targetOrder.estimatedPickupTime || "Served to table");

    // Convert items to kioskCart snapshots for the thermal receipt preview
    const dummyItems = targetOrder.items.map((item, idx) => ({
      id: `print-item-${idx}`,
      product: products.find((p) => p.name === item.productName) || products[0],
      variant: { id: "v-print", name: item.variantName, price: item.unitPrice },
      modifiers: [],
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));
    setKioskCart(dummyItems);

    setIsTokenPrintLookupModalOpen(false);
    setStep("RECEIPT_TOKEN");

    setTimeout(() => {
      handleTriggerPrint();
    }, 500);
  };

  // Calculations for Kiosk Cart
  const subtotal = kioskCart.reduce((sum, item) => sum + item.lineTotal, 0);
  const vatTax = +(subtotal * 0.13).toFixed(2);
  const roundDiscount = subtotal > 0 ? +(subtotal - Math.floor(subtotal)).toFixed(2) : 0;
  const totalPayable = Math.floor(subtotal);

  // Cart operations
  const handleOpenCustomize = (product: Product) => {
    playKioskSound("tap");
    setCustomizingProduct(product);
    const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0] || {
      id: "v-def",
      name: "Regular",
      price: product.basePrice,
    };
    setActiveVariant(defaultVariant);
    setActiveModifiers([]);
    setActiveQty(1);
    setActiveNotes("");
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    playKioskSound("beep");
    const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0] || {
      id: "v-def",
      name: "Regular",
      price: product.basePrice,
    };
    const newItem: KioskCartItem = {
      id: `kc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      product,
      variant: defaultVariant,
      modifiers: [],
      quantity: 1,
      unitPrice: defaultVariant.price,
      lineTotal: defaultVariant.price,
    };
    setKioskCart((prev) => [...prev, newItem]);
    addToast({
      title: `Added to Order: ${product.name}`,
      description: `1x ${defaultVariant.name} (NPR ${defaultVariant.price})`,
      type: "success",
    });
  };

  const handleConfirmCustomization = () => {
    if (!customizingProduct || !activeVariant) return;
    playKioskSound("beep");

    const modTotal = activeModifiers.reduce((acc, m) => acc + m.priceDelta, 0);
    const unitPrice = activeVariant.price + modTotal;
    const lineTotal = unitPrice * activeQty;

    const newItem: KioskCartItem = {
      id: `kc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      product: customizingProduct,
      variant: activeVariant,
      modifiers: activeModifiers,
      quantity: activeQty,
      specialInstructions: activeNotes.trim() || undefined,
      unitPrice,
      lineTotal,
    };

    setKioskCart((prev) => [...prev, newItem]);
    setCustomizingProduct(null);
    addToast({
      title: `${customizingProduct.name} Added!`,
      description: `${activeQty}x ${activeVariant.name} with ${activeModifiers.length} addons`,
      type: "success",
    });
  };

  const handleAddComboToKioskCart = (comboData: {
    title: string;
    image: string;
    unitPrice: number;
    quantity: number;
    items: {
      productName: string;
      variantName: string;
      modifiers: string[];
    }[];
  }) => {
    playKioskSound("beep");

    const selectedModifiers: SelectedModifier[] = comboData.items.map((it, idx) => ({
      groupId: `combo-item-${idx}`,
      groupName: it.productName,
      optionId: `opt-${idx}`,
      optionName: `${it.productName} (${it.variantName})${
        it.modifiers && it.modifiers.length > 0 ? ` [${it.modifiers.join(", ")}]` : ""
      }`,
      priceDelta: 0,
    }));

    const comboProduct: Product = {
      id: `combo-pack-${Date.now()}`,
      categoryId: "cat-combos",
      name: comboData.title,
      description: `Customized Combo Package with ${comboData.items.length} items`,
      basePrice: comboData.unitPrice,
      images: [comboData.image],
      dietary: ["Chef's Choice", "Popular"],
      isDeliveryEligible: true,
      isAvailable: true,
      prepTimeMinutes: 15,
      calories: 1850,
      variants: [
        {
          id: "combo-custom-variant",
          name: `${comboData.items.length} Items Included`,
          price: comboData.unitPrice,
          isDefault: true,
        },
      ],
      modifierGroups: [],
    };

    const newItem: KioskCartItem = {
      id: `kc-combo-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      product: comboProduct,
      variant: comboProduct.variants[0],
      modifiers: selectedModifiers,
      quantity: comboData.quantity,
      specialInstructions: "Customized Package",
      unitPrice: comboData.unitPrice,
      lineTotal: comboData.unitPrice * comboData.quantity,
    };

    setKioskCart((prev) => [...prev, newItem]);
    setIsComboModalOpen(false);
    setSelectedCombo(null);
    addToast({
      title: `${comboData.title} Added!`,
      description: `${comboData.quantity}x Package (${comboData.items.length} items) added to tray`,
      type: "success",
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    playKioskSound("tap");
    setKioskCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              lineTotal: item.unitPrice * nextQty,
            };
          }
          return item;
        })
        .filter(Boolean) as KioskCartItem[]
    );
  };

  const setCartItemQty = (id: string, newQty: number) => {
    if (isNaN(newQty)) return;
    if (newQty <= 0) {
      setKioskCart((prev) => prev.filter((item) => item.id !== id));
      playKioskSound("tap");
      return;
    }
    const clamped = Math.min(99, Math.max(1, newQty));
    setKioskCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity: clamped,
            lineTotal: item.unitPrice * clamped,
          };
        }
        return item;
      })
    );
  };

  // Complete Order & Print Simulation
  const handleProcessPayment = () => {
    if (kioskCart.length === 0) return;
    playKioskSound("tap");
    setPaymentProcessing(true);

    // Simulate fast terminal POS / Fonepay QR approval
    setTimeout(() => {
      playKioskSound("success");
      setPaymentProcessing(false);
      setPaymentSuccess(true);

      // Generate random high-contrast token number (e.g., T-104)
      const tokenNumber = `T-${Math.floor(100 + Math.random() * 900)}`;
      setGeneratedToken(tokenNumber);

      // Place actual order through AppContext so Staff & Kitchen KDS hear and receive it immediately!
      const createdOrder = placeTakeawayOrder({
        customerName: guestName.trim() ? guestName.trim() : `Kiosk Guest #${tokenNumber}`,
        customerPhone: guestPhone.trim() ? guestPhone.trim() : "Touchscreen Terminal 1",
        fulfillmentType: fulfillment,
        paymentMethod: selectedPaymentMethod,
        notes: `Kiosk Self-Order | Token: ${tokenNumber} ${
          fulfillment === "DINE_IN"
            ? reservationCodeLinked
              ? `| Reserved: ${reservationCodeLinked} (Table #${tableNumber})`
              : `| Table #${tableNumber}`
            : "| Express Takeaway"
        }${guestName.trim() ? ` | Guest: ${guestName.trim()}` : ""}${guestPhone.trim() ? ` | Ph: ${guestPhone.trim()}` : ""}`,
      });

      setCompletedOrderNumber(createdOrder.orderNumber);
      setOrderTimeEstimate(`In ${currentOutlet.estimatedPrepTimeMin || 12} mins`);

      // Switch to receipt token screen
      setStep("RECEIPT_TOKEN");

      // Auto trigger printing after 600ms
      setTimeout(() => {
        handleTriggerPrint();
      }, 700);
    }, 1800);
  };

  const handleTriggerPrint = () => {
    setIsPrinting(true);
    playKioskSound("print");

    const printTimer = setTimeout(() => {
      setIsPrinting(false);
      setHasPrinted(true);
      playKioskSound("beep");
    }, 2400);

    return () => clearTimeout(printTimer);
  };

  // Filtered Combos from BANNER_SLIDES
  const filteredCombos = BANNER_SLIDES.filter((combo) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      combo.title.toLowerCase().includes(q) ||
      combo.subtitle.toLowerCase().includes(q) ||
      (combo.promoText && combo.promoText.toLowerCase().includes(q))
    );
  });

  // Filtered Products
  const currentCategoryProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  /* -------------------------------------------------------------
     SCREEN 1: ATTRACT / HOME LANDING WITH DINING SELECTION
  ------------------------------------------------------------- */
  if (step === "ATTRACT" || step === "FULFILLMENT") {
    return (
      <div className="fixed inset-0 z-50 bg-[#09090B] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-in fade-in duration-300">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CrunchyLogo size="xl" className="h-14 sm:h-18 drop-shadow-2xl" />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullScreen();
              }}
              className="p-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-bold flex items-center gap-2"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-amber-500" /> : <Maximize2 className="w-5 h-5 text-amber-500" />}
              <span className="hidden md:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen Kiosk"}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="p-3 bg-zinc-900/80 hover:bg-rose-950 border border-zinc-800 hover:border-rose-700 text-zinc-400 hover:text-rose-300 text-sm font-bold flex items-center gap-2"
              title="Exit Kiosk Mode"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Exit Mode</span>
            </button>
          </div>
        </div>

        {/* Center Dining Selection Choice Cards (Direct 1-Touch on Home Page) */}
        <div className="relative z-10 my-auto text-center max-w-4xl mx-auto w-full flex flex-col items-center px-4 py-2 sm:py-3">
          <p className="text-sm sm:text-base text-amber-400 font-bold uppercase tracking-wider max-w-md mx-auto leading-tight mb-4 sm:mb-6">
            Touch an option below to start your order
          </p>

          {/* The Two Sleek In-Line Interactive Choose Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 w-full max-w-2xl">
            {/* Box 1: Table Dine-In */}
            <div
              onClick={() => {
                playKioskSound("beep");
                setFulfillment("DINE_IN");
                setStep("MENU");
              }}
              className="relative p-3.5 sm:p-4 bg-gradient-to-r from-zinc-900/95 to-[#141418]/95 border-2 border-zinc-700 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500/25 group-hover:border-amber-500 transition-all">
                  <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                </div>
                <div className="text-left min-w-0">
                  <h2 className="text-base sm:text-lg font-black uppercase text-white group-hover:text-amber-400 transition-colors truncate">
                    Table Dine-In
                  </h2>
                  <p className="text-[11px] text-zinc-400 leading-tight">Eat at table</p>
                </div>
              </div>

              <div className="px-3 py-1.5 bg-amber-500 group-hover:bg-amber-400 text-black font-black uppercase tracking-wider text-[11px] sm:text-xs flex items-center gap-1.5 shrink-0 shadow transition-all">
                <span>Select</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Box 2: Takeaway Go */}
            <div
              onClick={() => {
                playKioskSound("beep");
                setFulfillment("TAKEAWAY");
                setStep("MENU");
              }}
              className="relative p-3.5 sm:p-4 bg-gradient-to-r from-zinc-900/95 to-[#141418]/95 border-2 border-zinc-700 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/20 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-none bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-sky-500/25 group-hover:border-sky-400 transition-all">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
                </div>
                <div className="text-left min-w-0">
                  <h2 className="text-base sm:text-lg font-black uppercase text-white group-hover:text-sky-400 transition-colors truncate">
                    Takeaway Go
                  </h2>
                  <p className="text-[11px] text-zinc-400 leading-tight">Pack to take out</p>
                </div>
              </div>

              <div className="px-3 py-1.5 bg-zinc-800 group-hover:bg-sky-500 group-hover:text-black text-white font-black uppercase tracking-wider text-[11px] sm:text-xs flex items-center gap-1.5 shrink-0 shadow transition-all">
                <span>Select</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Subtle Divider Line with Search/Reservation Label */}
          <div className="w-full max-w-2xl flex items-center gap-3 my-2.5 sm:my-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
              OR ENTER BY RESERVATION
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Search UI: Enter Reservation Number / Booking Code */}
          <form
            onSubmit={handleReservationSubmit}
            className="w-full max-w-2xl"
          >
            <div className="relative flex items-center bg-zinc-900/95 border border-zinc-700/90 hover:border-amber-500/80 focus-within:border-amber-500 transition-all p-1 sm:p-1.5 shadow-lg">
              <div className="pl-2.5 pr-1.5 text-zinc-400 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type="text"
                value={reservationQuery}
                onChange={(e) => {
                  setReservationQuery(e.target.value);
                  if (reservationError) setReservationError(null);
                }}
                placeholder="Came by reservation? Enter reservation no. or phone to order (e.g. TBL-108)..."
                className="w-full bg-transparent px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              {reservationQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setReservationQuery("");
                    setReservationError(null);
                  }}
                  className="p-1 text-zinc-500 hover:text-zinc-300 mr-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[11px] sm:text-xs tracking-wider flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer shadow"
              >
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {reservationError && (
              <p className="text-[10.5px] text-rose-400 text-left mt-1 pl-1 font-medium">
                {reservationError}
              </p>
            )}
          </form>

          {/* Dedicated Action Box: Print Table QR Token Anytime */}
          <div
            onClick={() => {
              playKioskSound("tap");
              setIsTokenPrintLookupModalOpen(true);
            }}
            className="w-full max-w-2xl mt-3 p-2.5 sm:p-3 bg-gradient-to-r from-amber-950/40 via-zinc-900/90 to-zinc-900/90 border border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500/30 group-hover:scale-105 transition-all">
                <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase text-white group-hover:text-amber-400 transition-colors truncate">
                    Print Table QR Token
                  </h3>
                  <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shrink-0">
                    Anytime
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-tight truncate">
                  Ordered at table? Enter token or mobile to print physical slip
                </p>
              </div>
            </div>

            <div className="px-2.5 sm:px-3 py-1 bg-zinc-800 group-hover:bg-amber-500 group-hover:text-black text-amber-400 font-black uppercase text-[10px] sm:text-xs flex items-center gap-1 shrink-0 transition-all shadow">
              <span>Print Slip</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 grid grid-cols-3 gap-3 max-w-3xl mx-auto w-full pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-center gap-2.5 text-zinc-300">
            <QrCode className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-left">
              <span className="block text-xs font-bold text-white">Fonepay QR & Cash</span>
              <span className="text-[10px] text-zinc-500">Fast digital payment</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-zinc-300 border-x border-zinc-800">
            <Printer className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-left">
              <span className="block text-sm font-bold text-white">Auto Print Receipt</span>
              <span className="text-[11px] text-zinc-500">Instant kitchen token</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-zinc-300">
            <Clock className="w-6 h-6 text-sky-400 shrink-0" />
            <div className="text-left">
              <span className="block text-sm font-bold text-white">Live KDS Queue</span>
              <span className="text-[11px] text-zinc-500">Average prep ~12 min</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     SCREEN 3 & 4: TOUCH MENU & QUICK CART (Tablet Touch Screen Layout)
  ------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C] text-white flex flex-col select-none overflow-hidden font-sans">
      {/* 1. KIOSK TOP APP BAR */}
      <header className="h-13 sm:h-15 bg-[#121215] border-b border-zinc-800 px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div
            onClick={handleResetToAttract}
            className="flex items-center cursor-pointer group"
            title="Return to Welcome Screen"
          >
            <CrunchyLogo size="sm" className="h-7 sm:h-8 w-auto group-hover:scale-105 transition-transform" />
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          <button
            type="button"
            onClick={() => {
              playKioskSound("tap");
              setStep("ATTRACT");
            }}
            className="px-2 sm:px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {fulfillment === "DINE_IN" ? (
              <>
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>{reservationCodeLinked ? `Table • ${reservationCodeLinked}` : "Dine-In"}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                <span>Takeaway</span>
              </>
            )}
            <span className="text-[10px] text-zinc-500 underline ml-0.5">Change</span>
          </button>
        </div>

        {/* MIDDLE SECTION: Place to enter user mobile number and then name (optional, compact, tablet friendly) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile number with tick option */}
          <div className="flex items-center bg-[#18181E] border border-zinc-800 focus-within:border-zinc-600 px-2 py-1 gap-1.5 shadow-inner">
            <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => {
                const val = e.target.value;
                setGuestPhone(val);
                if (val.trim().length >= 10) {
                  setPhoneVerified(true);
                } else if (val.trim().length === 0) {
                  setPhoneVerified(false);
                }
              }}
              placeholder="Mobile (optional)"
              className="w-24 sm:w-28 bg-transparent text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            {/* Tick option to verify */}
            <button
              type="button"
              onClick={() => {
                if (guestPhone.trim()) {
                  playKioskSound("tap");
                  setPhoneVerified(!phoneVerified);
                }
              }}
              title={phoneVerified ? "Mobile verified" : "Tap tick to verify"}
              className={`p-0.5 transition-colors cursor-pointer ${
                phoneVerified
                  ? "text-emerald-400"
                  : guestPhone.trim()
                  ? "text-zinc-400 hover:text-amber-400"
                  : "text-zinc-600 opacity-40 cursor-default"
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${phoneVerified ? "stroke-[2.5]" : ""}`} />
            </button>
          </div>

          {/* Customer Name */}
          <div className="flex items-center bg-[#18181E] border border-zinc-800 focus-within:border-zinc-600 px-2 py-1 gap-1.5 shadow-inner">
            <User className="w-3 h-3 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Name (optional)"
              className="w-20 sm:w-26 bg-transparent text-[11px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Tools: Sound, Fullscreen, Start Over */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-1.5 sm:p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300"
            title={soundMuted ? "Unmute sound" : "Mute sound"}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-1.5 sm:p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-zinc-300" />}
          </button>

          <button
            type="button"
            onClick={() => {
              playKioskSound("tap");
              setIsTokenPrintLookupModalOpen(true);
            }}
            className="px-2 sm:px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            title="Print Table QR Order Token"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Print Token</span>
          </button>

          <button
            type="button"
            onClick={handleResetToAttract}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-950 border border-zinc-800 hover:border-rose-700 text-[11px] font-bold text-zinc-300 hover:text-rose-200 uppercase tracking-wider flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Start Over</span>
          </button>
        </div>
      </header>

      {/* 2. TOP HORIZONTAL CATEGORY ROW (Compact, small clear clickable rectangular buttons) */}
      <div className="bg-[#111116] border-b border-zinc-800 px-3 sm:px-6 py-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0 scrollbar-none z-10">
        {/* 1. All Items Button */}
        <button
          type="button"
          onClick={() => {
            playKioskSound("tap");
            handleCategorySelect("all");
          }}
          className={`h-8 sm:h-8.5 px-3 sm:px-3.5 flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap shrink-0 text-xs uppercase font-bold tracking-wide ${
            selectedCategory === "all"
              ? "bg-amber-500/20 border-amber-500 text-amber-400 font-black shadow-sm"
              : "bg-[#18181E] border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white"
          }`}
        >
          <span>All</span>
          <span
            className={`text-[10px] font-mono px-1 py-0.2 font-semibold ${
              selectedCategory === "all" ? "bg-amber-500 text-black font-bold" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {products.length + BANNER_SLIDES.length}
          </span>
        </button>

        {/* 2. Packages & Combos (Second in Filter Row) */}
        <button
          type="button"
          onClick={() => {
            playKioskSound("tap");
            handleCategorySelect("packages");
          }}
          className={`h-8 sm:h-8.5 px-3 sm:px-3.5 flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap shrink-0 text-xs uppercase font-bold tracking-wide ${
            selectedCategory === "packages"
              ? "bg-amber-500/20 border-amber-500 text-amber-400 font-black shadow-sm"
              : "bg-[#18181E] border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Packages</span>
          <span
            className={`text-[10px] font-mono px-1 py-0.2 font-semibold ${
              selectedCategory === "packages" ? "bg-amber-500 text-black font-bold" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {BANNER_SLIDES.length}
          </span>
        </button>

        {/* Category Buttons */}
        {categories
          .filter((cat) => cat.id !== "cat-combos")
          .map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                playKioskSound("tap");
                handleCategorySelect(cat.id);
              }}
              className={`h-8 sm:h-8.5 px-3 sm:px-3.5 flex items-center justify-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap shrink-0 text-xs uppercase font-bold tracking-wide ${
                isSelected
                  ? "bg-amber-500/20 border-amber-500 text-amber-400 font-black shadow-sm"
                  : "bg-[#18181E] border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white"
              }`}
            >
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 font-semibold ${
                    isSelected ? "bg-amber-500 text-black font-bold" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE: CENTER PRODUCT GRID, RIGHT FLOATING CART */}
      <div className="flex-1 flex overflow-hidden">
        {/* CENTER PRODUCT TOUCH GRID */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 bg-[#0B0B0E]">
          {/* Category Title + Fast Compact Search */}
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                {selectedCategory === "packages" ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Curated Packages</span>
                  </>
                ) : selectedCategory === "all" ? (
                  "Full Menu"
                ) : (
                  categories.find((c) => c.id === selectedCategory)?.name || "Dishes"
                )}
              </h2>
              <span className="text-xs font-mono text-zinc-500 font-normal">
                ({selectedCategory === "packages"
                  ? filteredCombos.length
                  : selectedCategory === "all"
                  ? currentCategoryProducts.length + filteredCombos.length
                  : currentCategoryProducts.length})
              </span>
            </div>

            {/* Quick Touch Search (Compact) */}
            <div className="relative w-44 sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-zinc-900 border border-zinc-700/80 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {isLoadingSkeleton || isCategoryLoading ? (
            <div className="py-2">
              <SkeletonProductGrid count={8} />
            </div>
          ) : selectedCategory === "packages" ? (
            filteredCombos.length === 0 ? (
              <div className="py-16 text-center text-zinc-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-sm font-bold">No packages found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                {filteredCombos.map((combo) => (
                  <div
                    key={combo.id}
                    onClick={() => {
                      playKioskSound("tap");
                      setSelectedCombo(combo);
                      setIsComboModalOpen(true);
                    }}
                    className="bg-[#141418] border border-amber-500/40 hover:border-amber-400 transition-all duration-150 flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-md hover:shadow-amber-500/5 overflow-hidden relative"
                  >
                    {combo.promoText && (
                      <div className="absolute top-1.5 right-1.5 z-10 bg-black/85 text-amber-400 text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-amber-500/40">
                        {combo.promoText}
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative aspect-[16/10] bg-zinc-950 overflow-hidden">
                      <img
                        src={combo.image}
                        alt={combo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Price Tag Overlay */}
                      <div className="absolute bottom-1.5 right-1.5 flex items-baseline gap-1 px-2 py-0.5 bg-black/90 border border-amber-500/60 shadow">
                        <span className="text-amber-400 font-mono font-black text-xs">
                          {formatNPR(combo.basePrice)}
                        </span>
                        {combo.originalPrice && combo.originalPrice > combo.basePrice && (
                          <span className="text-[9px] font-mono text-zinc-400 line-through">
                            {formatNPR(combo.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight line-clamp-1 leading-snug">
                          {combo.title}
                        </h3>
                      </div>

                      {/* Bottom action bar */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">
                          {combo.includedProductIds.length} items
                        </span>
                        <div className="flex items-center gap-1 text-[10.5px] font-bold text-black bg-amber-500 group-hover:bg-amber-400 px-2.5 py-1 uppercase tracking-wide transition-colors">
                          <Sliders className="w-3 h-3" />
                          <span>Customize</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <>
              {/* Featured Packages Horizontal Slider in "All" view (Dashboard style) */}
              {selectedCategory === "all" && filteredCombos.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                        Featured Packages & Combos
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-normal">
                        ({filteredCombos.length} customizable packs)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Left & Right Arrow controls for horizontal slider */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            playKioskSound("tap");
                            if (kioskFeaturedScrollRef.current) {
                              kioskFeaturedScrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
                            }
                          }}
                          className="p-1.5 bg-[#1a1a20] hover:bg-amber-500 hover:text-black text-zinc-300 border border-zinc-700/80 transition-colors cursor-pointer"
                          aria-label="Scroll left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playKioskSound("tap");
                            if (kioskFeaturedScrollRef.current) {
                              kioskFeaturedScrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
                            }
                          }}
                          className="p-1.5 bg-[#1a1a20] hover:bg-amber-500 hover:text-black text-zinc-300 border border-zinc-700/80 transition-colors cursor-pointer"
                          aria-label="Scroll right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playKioskSound("tap");
                          setSelectedCategory("packages");
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer ml-1"
                      >
                        <span>View all</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Slider Viewport Track */}
                  <div
                    ref={kioskFeaturedScrollRef}
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      if (el.children.length > 0) {
                        const firstChild = el.children[0] as HTMLElement;
                        const itemWidth = firstChild.offsetWidth + 16;
                        const idx = Math.round(el.scrollLeft / itemWidth);
                        setActiveKioskSlide(Math.min(filteredCombos.length - 1, Math.max(0, idx)));
                      }
                    }}
                    className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pt-0.5 pb-2"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {filteredCombos.map((combo) => (
                      <div
                        key={combo.id}
                        data-slide
                        onClick={() => {
                          playKioskSound("tap");
                          setSelectedCombo(combo);
                          setIsComboModalOpen(true);
                        }}
                        className="relative shrink-0 snap-start select-none cursor-pointer overflow-hidden border border-zinc-700 hover:border-amber-400 transition-all duration-200 group shadow-md
                          w-[82%] sm:w-[48%] md:w-[38%] lg:w-[32%] xl:w-[28%] 2xl:w-[24%] min-h-[185px] sm:min-h-[200px]"
                      >
                        {/* Background Image with Lower Gradient for Maximum Food Visibility */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src={combo.image}
                            alt={combo.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.88] contrast-[1.05]"
                            loading="lazy"
                          />
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${combo.bgGradient || "from-amber-600 via-amber-500 to-yellow-500"} opacity-20 mix-blend-multiply`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                        </div>

                        {/* Card Content Overlay */}
                        <div className="relative z-10 p-3 sm:p-3.5 flex flex-col justify-between h-full text-white">
                          {/* Top row: Promo badge if any, and item count badge */}
                          <div className="flex items-center justify-between gap-1.5">
                            {combo.promoText ? (
                              <span className="bg-black/80 text-amber-400 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 border border-amber-500/40">
                                {combo.promoText}
                              </span>
                            ) : <span />}

                            <span className="bg-black/70 text-zinc-300 text-[9.5px] font-mono font-bold px-2 py-0.5 border border-white/20">
                              {combo.includedProductIds.length} items
                            </span>
                          </div>

                          {/* Main Clean Package Title */}
                          <div className="my-auto py-1">
                            <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug uppercase drop-shadow-md text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                              {combo.title}
                            </h3>
                          </div>

                          {/* Bottom Action Button & Price */}
                          <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/20">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 group-hover:bg-amber-400 text-black font-black text-[11px] uppercase tracking-wider transition-colors shadow-sm">
                              <Sliders className="w-3 h-3 text-black" />
                              <span>{combo.buttonLabel || "Customize"}</span>
                            </div>

                            <div className="text-right">
                              {combo.originalPrice && combo.originalPrice > combo.basePrice && (
                                <span className="text-[10px] text-zinc-300 line-through mr-1 font-mono">
                                  {formatNPR(combo.originalPrice)}
                                </span>
                              )}
                              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono drop-shadow-xs">
                                {formatNPR(combo.basePrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dot Indicators */}
                  {filteredCombos.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      {filteredCombos.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (kioskFeaturedScrollRef.current) {
                              const el = kioskFeaturedScrollRef.current;
                              if (el.children[idx]) {
                                const targetEl = el.children[idx] as HTMLElement;
                                el.scrollTo({
                                  left: targetEl.offsetLeft - el.offsetLeft,
                                  behavior: "smooth",
                                });
                              }
                            }
                            setActiveKioskSlide(idx);
                          }}
                          className={`h-1 transition-all cursor-pointer ${
                            activeKioskSlide === idx
                              ? "w-5 bg-amber-400"
                              : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                          }`}
                          aria-label={`Go to combo ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                      Individual Menu Items ({currentCategoryProducts.length})
                    </h3>
                  </div>
                </div>
              )}

              {/* Product Touch Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
            {currentCategoryProducts.map((product) => {
              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenCustomize(product)}
                  className="bg-[#141418] border border-zinc-800 hover:border-amber-500/80 transition-all duration-150 flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-md overflow-hidden relative"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] bg-zinc-950 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Price Tag Overlay */}
                    <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-amber-500 text-black font-black text-xs shadow">
                      {formatNPR(product.basePrice)}
                    </div>
                  </div>

                  {/* Body Info (Smaller text, clean & non-bulky) */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 leading-normal">
                        {product.description}
                      </p>
                    </div>

                    {/* Touch Action Bar */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-1.5">
                      <span className="text-[11px] text-zinc-500 font-medium">
                        {product.variants.length > 1 ? `${product.variants.length} Sizes` : "Regular"}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Customize Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCustomize(product);
                          }}
                          className="h-8.5 sm:h-9 px-3 sm:px-3.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-bold text-zinc-100 uppercase tracking-wider border border-zinc-700 flex items-center justify-center transition-transform"
                        >
                          Options
                        </button>

                        {/* Quick Add Button */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(product, e)}
                          className="w-8.5 h-8.5 sm:w-9 sm:h-9 bg-amber-500 hover:bg-amber-400 active:scale-90 text-black font-black flex items-center justify-center transition-transform shadow-md cursor-pointer shrink-0"
                          title="Quick Add 1 Item"
                        >
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>

        {/* RIGHT SIDE: STREAMLINED SLIM TOUCH CART & CHECKOUT PANEL */}
        <aside className="w-64 sm:w-72 md:w-80 bg-[#111114] border-l border-zinc-800 flex flex-col shrink-0">
          {/* Cart Header (Compact) */}
          <div className="px-3 py-2.5 border-b border-zinc-800 bg-[#151518] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs sm:text-sm font-bold uppercase text-white tracking-wide">
                Tray ({kioskCart.reduce((sum, i) => sum + i.quantity, 0)})
              </h3>
            </div>

            {kioskCart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playKioskSound("tap");
                  setKioskCart([]);
                }}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {kioskCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                <ShoppingBag className="w-10 h-10 stroke-[1.2] text-zinc-700 mb-2" />
                <p className="text-xs font-semibold text-zinc-400">Tray is Empty</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Touch any item to add
                </p>
              </div>
            ) : (
              kioskCart.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#18181D] border border-zinc-800/80 p-2.5 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                        {item.product.categoryId === "cat-combos" && (
                          <span className="bg-amber-500 text-black text-[8.5px] font-black uppercase px-1 py-0.2 shrink-0">
                            Package
                          </span>
                        )}
                        <span className="truncate">{item.product.name}</span>
                      </h4>
                      <div className="text-[10px] text-amber-400 font-medium">
                        {item.variant.name}
                      </div>
                      {item.modifiers.length > 0 && (
                        <div className="text-[10px] text-zinc-400 mt-0.5 flex flex-wrap gap-1">
                          {item.modifiers.map((m, idx) => (
                            <span key={idx} className="bg-zinc-800 px-1 py-0.2">
                              {m.optionName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-bold font-mono text-white shrink-0">
                      {formatNPR(item.lineTotal)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatNPR(item.unitPrice)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-6.5 h-6.5 sm:w-7 sm:h-7 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center font-bold text-xs cursor-pointer border border-zinc-700/60"
                        title="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setCartItemQty(item.id, val);
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        className="w-9 h-6.5 sm:h-7 text-center font-mono font-bold text-xs text-amber-400 bg-zinc-900/90 border border-zinc-700/80 focus:border-amber-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                        title="Click to edit quantity"
                      />
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-6.5 h-6.5 sm:w-7 sm:h-7 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center font-bold text-xs cursor-pointer border border-zinc-700/60"
                        title="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing Summary & Slim Checkout Button */}
          <div className="p-3 bg-[#151518] border-t border-zinc-800 space-y-2">
            <div className="space-y-1 text-xs text-zinc-400">
              <div className="flex justify-between text-[11px]">
                <span>Subtotal ({kioskCart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                <span className="font-mono text-zinc-200">{formatNPR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>VAT (13% incl.)</span>
                <span className="font-mono text-zinc-400">{formatNPR(vatTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-1.5 border-t border-zinc-800/80">
                <span>Total</span>
                <span className="font-mono text-amber-400">{formatNPR(totalPayable)}</span>
              </div>
            </div>

            {/* Slim Checkout Button */}
            <button
              type="button"
              disabled={kioskCart.length === 0}
              onClick={() => {
                playKioskSound("beep");
                setStep("PAYMENT");
              }}
              className="w-full py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow cursor-pointer"
            >
              <span>Pay & Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </div>

      {/* -------------------------------------------------------------
          MODAL: CUSTOMIZE ITEM (Variants + Add-ons)
      ------------------------------------------------------------- */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="bg-[#141418] border-2 border-zinc-700 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-[#18181D] border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-amber-500 tracking-wider">
                  Customize Your Selection
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase">
                  {customizingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* 1. Size / Patty Variant Selection */}
              <div>
                <h4 className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-3">
                  Step 1: Choose Portion / Variant
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customizingProduct.variants.map((variant) => {
                    const isSelected = activeVariant?.id === variant.id;
                    return (
                      <div
                        key={variant.id}
                        onClick={() => {
                          playKioskSound("tap");
                          setActiveVariant(variant);
                        }}
                        className={`p-3.5 border-2 cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10 text-white font-bold"
                            : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-amber-500 bg-amber-500 text-black" : "border-zinc-600"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-sm font-bold">{variant.name}</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-amber-400">
                          {formatNPR(variant.price)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Modifiers / Add-ons */}
              {customizingProduct.modifierGroups && customizingProduct.modifierGroups.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-3">
                    Step 2: Add-Ons & Toppings
                  </h4>
                  {customizingProduct.modifierGroups.map((group) => (
                    <div key={group.id} className="mb-4">
                      <span className="text-xs font-bold text-zinc-300 block mb-2">
                        {group.name} {group.required ? "(Required)" : "(Optional)"}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {group.options.map((opt) => {
                          const isChecked = activeModifiers.some((m) => m.optionId === opt.id);
                          return (
                            <div
                              key={opt.id}
                              onClick={() => {
                                playKioskSound("tap");
                                if (isChecked) {
                                  setActiveModifiers((prev) => prev.filter((m) => m.optionId !== opt.id));
                                } else {
                                  setActiveModifiers((prev) => [
                                    ...prev,
                                    {
                                      groupId: group.id,
                                      groupName: group.name,
                                      optionId: opt.id,
                                      optionName: opt.name,
                                      priceDelta: opt.priceDelta,
                                    },
                                  ]);
                                }
                              }}
                              className={`p-3 border cursor-pointer flex items-center justify-between text-xs transition-all ${
                                isChecked
                                  ? "border-amber-500 bg-amber-500/10 text-white font-bold"
                                  : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 border flex items-center justify-center ${
                                    isChecked ? "border-amber-500 bg-amber-500 text-black" : "border-zinc-600"
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span>{opt.name}</span>
                              </div>
                              <span className="font-mono text-zinc-400">
                                {opt.priceDelta > 0 ? `+${formatNPR(opt.priceDelta)}` : "Free"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Special Request Note */}
              <div>
                <h4 className="text-xs uppercase font-bold text-zinc-400 tracking-wider mb-2">
                  Step 3: Chef Instructions (Optional)
                </h4>
                <input
                  type="text"
                  value={activeNotes}
                  onChange={(e) => setActiveNotes(e.target.value)}
                  placeholder="Special notes"
                  className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 4. Quantity */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveQty(Math.max(1, activeQty - 1))}
                    className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center text-lg font-bold border border-zinc-700/80 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={activeQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        setActiveQty(Math.min(99, Math.max(1, val)));
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-14 h-10 text-center font-mono font-bold text-lg text-amber-400 bg-zinc-900 border border-zinc-700 focus:border-amber-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                    title="Click to edit quantity"
                  />
                  <button
                    type="button"
                    onClick={() => setActiveQty(Math.min(99, activeQty + 1))}
                    className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center text-lg font-bold border border-zinc-700/80 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-[#18181D] border-t border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-zinc-400 block">Item Total</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {formatNPR(
                    ((activeVariant?.price || 0) +
                      activeModifiers.reduce((sum, m) => sum + m.priceDelta, 0)) *
                      activeQty
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmCustomization}
                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-base flex items-center gap-2 shadow-xl"
              >
                <span>Add To Tray</span>
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: COMBO PACKAGE CONFIGURATOR (Shared reusable component)
      ------------------------------------------------------------- */}
      <ComboPackageModal
        combo={selectedCombo}
        isOpen={isComboModalOpen}
        onClose={() => {
          setIsComboModalOpen(false);
          setSelectedCombo(null);
        }}
        onAddToCartCustom={handleAddComboToKioskCart}
        addLabel="Add to Tray"
      />

      {/* -------------------------------------------------------------
          SCREEN: PAYMENT CHOICE & PROCESSING MODAL
      ------------------------------------------------------------- */}
      {step === "PAYMENT" && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0C] text-white flex flex-col justify-between p-3 sm:p-5 lg:p-6 select-none overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-800 shrink-0">
            <button
              onClick={() => {
                playKioskSound("tap");
                setStep("MENU");
              }}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back To Menu</span>
            </button>

            <CrunchyLogo size="md" className="h-8 sm:h-9" />

            <span className="text-[11px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 font-bold uppercase">
              Step 2: Payment
            </span>
          </div>

          {/* Payment Workspace - Compact Viewport Fitted */}
          <div className="max-w-2xl mx-auto w-full my-auto py-2 sm:py-3 flex flex-col justify-center">
            {/* 1. COMPACT VISIBLE TOTAL AMOUNT BAR */}
            <div className="bg-[#15151A] border border-amber-500/50 px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between mb-2.5 sm:mb-3 shadow-md">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
                  Total to Pay:
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {formatNPR(totalPayable)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-300 font-mono">
                  {kioskCart.reduce((sum, i) => sum + i.quantity, 0)} Items
                </span>
                <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  {fulfillment === "DINE_IN"
                    ? reservationCodeLinked
                      ? `Dine-In (${reservationCodeLinked})`
                      : "Dine-In"
                    : "Takeaway"}
                </span>
              </div>
            </div>

            {/* 2. PAYMENT METHODS (Scan QR & Cash at Counter) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-2.5 sm:mb-3">
              {/* Option 1: Scan QR Code */}
              <button
                type="button"
                onClick={() => {
                  playKioskSound("tap");
                  setSelectedPaymentMethod("FONEPAY_QR");
                }}
                className={`p-2 sm:p-2.5 border-2 cursor-pointer flex items-center gap-2.5 transition-all text-left ${
                  selectedPaymentMethod === "FONEPAY_QR"
                    ? "border-amber-500 bg-amber-500/10 shadow-sm"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                }`}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                    selectedPaymentMethod === "FONEPAY_QR"
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800 text-amber-400"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold uppercase text-white truncate">Scan & Pay QR</h3>
                  <p className="text-[10px] text-zinc-400 truncate">eSewa • Khalti • Bank</p>
                </div>
              </button>

              {/* Option 2: Pay Cash at Counter */}
              <button
                type="button"
                onClick={() => {
                  playKioskSound("tap");
                  setSelectedPaymentMethod("CASH_ON_PICKUP");
                }}
                className={`p-2 sm:p-2.5 border-2 cursor-pointer flex items-center gap-2.5 transition-all text-left ${
                  selectedPaymentMethod === "CASH_ON_PICKUP"
                    ? "border-amber-500 bg-amber-500/10 shadow-sm"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                }`}
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                    selectedPaymentMethod === "CASH_ON_PICKUP"
                      ? "bg-emerald-500 text-black"
                      : "bg-zinc-800 text-emerald-400"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold uppercase text-white truncate">Cash at Counter</h3>
                  <p className="text-[10px] text-zinc-400 truncate">Order now, pay at pickup</p>
                </div>
              </button>
            </div>

            {/* 3. ACTIVE PAYMENT DETAILS */}
            {selectedPaymentMethod === "FONEPAY_QR" && (
              <div className="bg-[#141418] border border-zinc-800 p-2.5 sm:p-3.5 space-y-2">
                {/* QR Provider Tabs (eSewa, Khalti, Bank) */}
                <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      playKioskSound("tap");
                      setQrProvider("ESEWA");
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      qrProvider === "ESEWA"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    eSewa QR
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playKioskSound("tap");
                      setQrProvider("KHALTI");
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      qrProvider === "KHALTI"
                        ? "bg-purple-500/15 border-purple-500 text-purple-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Khalti QR
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playKioskSound("tap");
                      setQrProvider("BANK");
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      qrProvider === "BANK"
                        ? "bg-blue-500/15 border-blue-500 text-blue-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Bank / Fonepay
                  </button>
                </div>

                {/* QR Display + Side Account Details */}
                <div className="flex items-center gap-3.5 sm:gap-5 pt-0.5">
                  {/* Clean Crisp QR Code */}
                  <div className="p-2 bg-white border border-zinc-300 shrink-0 shadow-sm flex flex-col items-center">
                    <svg
                      viewBox="0 0 160 160"
                      className="w-24 h-24 sm:w-28 sm:h-28 text-black"
                      fill="currentColor"
                    >
                      {/* Corner 1: Top-Left Finder Box */}
                      <rect x="10" y="10" width="40" height="40" rx="3" fill="#000" />
                      <rect x="16" y="16" width="28" height="28" fill="#FFF" />
                      <rect x="22" y="22" width="16" height="16" rx="1" fill={qrProvider === "ESEWA" ? "#16a34a" : qrProvider === "KHALTI" ? "#7c3aed" : "#2563eb"} />

                      {/* Corner 2: Top-Right Finder Box */}
                      <rect x="110" y="10" width="40" height="40" rx="3" fill="#000" />
                      <rect x="116" y="16" width="28" height="28" fill="#FFF" />
                      <rect x="122" y="22" width="16" height="16" rx="1" fill={qrProvider === "ESEWA" ? "#16a34a" : qrProvider === "KHALTI" ? "#7c3aed" : "#2563eb"} />

                      {/* Corner 3: Bottom-Left Finder Box */}
                      <rect x="10" y="110" width="40" height="40" rx="3" fill="#000" />
                      <rect x="16" y="116" width="28" height="28" fill="#FFF" />
                      <rect x="22" y="122" width="16" height="16" rx="1" fill={qrProvider === "ESEWA" ? "#16a34a" : qrProvider === "KHALTI" ? "#7c3aed" : "#2563eb"} />

                      {/* Pattern Matrix Dots */}
                      <rect x="58" y="14" width="6" height="6" fill="#000" />
                      <rect x="70" y="14" width="6" height="6" fill="#000" />
                      <rect x="82" y="14" width="6" height="6" fill="#000" />
                      <rect x="94" y="14" width="6" height="6" fill="#000" />
                      <rect x="58" y="26" width="6" height="6" fill="#000" />
                      <rect x="82" y="26" width="6" height="6" fill="#000" />
                      <rect x="94" y="26" width="6" height="6" fill="#000" />
                      <rect x="58" y="38" width="6" height="6" fill="#000" />
                      <rect x="70" y="38" width="6" height="6" fill="#000" />
                      <rect x="82" y="38" width="6" height="6" fill="#000" />

                      {/* Middle horizontal timing */}
                      <rect x="14" y="58" width="6" height="6" fill="#000" />
                      <rect x="26" y="58" width="6" height="6" fill="#000" />
                      <rect x="38" y="58" width="6" height="6" fill="#000" />
                      <rect x="58" y="58" width="6" height="6" fill="#000" />
                      <rect x="70" y="58" width="6" height="6" fill="#000" />
                      <rect x="94" y="58" width="6" height="6" fill="#000" />
                      <rect x="118" y="58" width="6" height="6" fill="#000" />
                      <rect x="130" y="58" width="6" height="6" fill="#000" />
                      <rect x="142" y="58" width="6" height="6" fill="#000" />

                      {/* Middle Data */}
                      <rect x="14" y="70" width="6" height="6" fill="#000" />
                      <rect x="38" y="70" width="6" height="6" fill="#000" />
                      <rect x="58" y="70" width="6" height="6" fill="#000" />
                      <rect x="82" y="70" width="6" height="6" fill="#000" />
                      <rect x="106" y="70" width="6" height="6" fill="#000" />
                      <rect x="130" y="70" width="6" height="6" fill="#000" />
                      <rect x="142" y="70" width="6" height="6" fill="#000" />

                      <rect x="14" y="82" width="6" height="6" fill="#000" />
                      <rect x="26" y="82" width="6" height="6" fill="#000" />
                      <rect x="58" y="82" width="6" height="6" fill="#000" />
                      <rect x="70" y="82" width="6" height="6" fill="#000" />
                      <rect x="94" y="82" width="6" height="6" fill="#000" />
                      <rect x="118" y="82" width="6" height="6" fill="#000" />
                      <rect x="142" y="82" width="6" height="6" fill="#000" />

                      {/* Bottom data */}
                      <rect x="58" y="110" width="6" height="6" fill="#000" />
                      <rect x="70" y="110" width="6" height="6" fill="#000" />
                      <rect x="94" y="110" width="6" height="6" fill="#000" />
                      <rect x="106" y="110" width="6" height="6" fill="#000" />
                      <rect x="130" y="110" width="6" height="6" fill="#000" />
                      <rect x="142" y="110" width="6" height="6" fill="#000" />
                      <rect x="58" y="122" width="6" height="6" fill="#000" />
                      <rect x="82" y="122" width="6" height="6" fill="#000" />
                      <rect x="94" y="122" width="6" height="6" fill="#000" />
                      <rect x="118" y="122" width="6" height="6" fill="#000" />
                      <rect x="142" y="122" width="6" height="6" fill="#000" />
                      <rect x="58" y="134" width="6" height="6" fill="#000" />
                      <rect x="70" y="134" width="6" height="6" fill="#000" />
                      <rect x="82" y="134" width="6" height="6" fill="#000" />
                      <rect x="106" y="134" width="6" height="6" fill="#000" />
                      <rect x="130" y="134" width="6" height="6" fill="#000" />

                      {/* Center Brand Badge */}
                      <rect x="55" y="55" width="50" height="50" rx="4" fill="#FFF" stroke="#E4E4E7" strokeWidth="2" />
                      <text
                        x="80"
                        y="84"
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="900"
                        fill={qrProvider === "ESEWA" ? "#16a34a" : qrProvider === "KHALTI" ? "#7c3aed" : "#2563eb"}
                        fontFamily="sans-serif"
                      >
                        {qrProvider === "ESEWA" ? "eSewa" : qrProvider === "KHALTI" ? "Khalti" : "Fonepay"}
                      </text>
                    </svg>
                    <span className="text-[9px] font-bold text-zinc-600 mt-0.5 uppercase font-mono">
                      NPR {totalPayable}
                    </span>
                  </div>

                  {/* Side Details (eSewa / Khalti / Bank account number & name) */}
                  <div className="space-y-1.5 text-left flex-1 min-w-0">
                    {qrProvider === "ESEWA" && (
                      <>
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold block leading-tight">
                            eSewa Mobile / ID
                          </span>
                          <div className="text-lg sm:text-xl font-black font-mono text-emerald-400 tracking-wider leading-tight">
                            9801234567
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold block leading-tight">
                            Account Name
                          </span>
                          <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                            CRUNCHY FRIED CHICKEN PVT. LTD.
                          </div>
                        </div>
                        <div className="text-[11px] text-zinc-400 leading-snug">
                          Scan with eSewa app or send directly to the ID above.
                        </div>
                      </>
                    )}

                    {qrProvider === "KHALTI" && (
                      <>
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold block leading-tight">
                            Khalti Mobile / ID
                          </span>
                          <div className="text-lg sm:text-xl font-black font-mono text-purple-400 tracking-wider leading-tight">
                            9801234567
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold block leading-tight">
                            Account Name
                          </span>
                          <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                            CRUNCHY FRIED CHICKEN PVT. LTD.
                          </div>
                        </div>
                        <div className="text-[11px] text-zinc-400 leading-snug">
                          Scan with Khalti app or transfer to the mobile number above.
                        </div>
                      </>
                    )}

                    {qrProvider === "BANK" && (
                      <>
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold block leading-tight">
                            Bank & Account Number
                          </span>
                          <div className="text-xs font-semibold text-zinc-300">Nabil Bank Limited</div>
                          <div className="text-base sm:text-lg font-black font-mono text-blue-400 tracking-wider leading-tight">
                            01201017500982
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold block leading-tight">
                            Account Name
                          </span>
                          <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                            CRUNCHY FRIED CHICKEN PVT. LTD.
                          </div>
                        </div>
                        <div className="text-[10.5px] text-zinc-400 leading-snug">
                          Branch: Durbar Marg, Kathmandu • Fonepay QR enabled.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod === "CASH_ON_PICKUP" && (
              <div className="bg-[#141418] border border-zinc-800 p-3.5 sm:p-4 text-center space-y-1.5">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Banknote className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase">
                  Pay Cash at Pickup Counter
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Your order token will print now. Please keep{" "}
                  <span className="text-amber-400 font-mono font-bold">{formatNPR(totalPayable)}</span>{" "}
                  cash ready to pay at the counter when your token is called.
                </p>
              </div>
            )}

            {/* 4. CONFIRM & PRINT ACTION BUTTON */}
            <div className="mt-2.5 sm:mt-3 text-center max-w-sm mx-auto w-full">
              <button
                type="button"
                disabled={paymentProcessing}
                onClick={handleProcessPayment}
                className="w-full py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {paymentProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Confirming & Printing...</span>
                  </>
                ) : selectedPaymentMethod === "FONEPAY_QR" ? (
                  <>
                    <span>I Have Paid • Print Token</span>
                    <Printer className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Confirm Order • Print Token</span>
                    <Printer className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-zinc-600 pt-1 shrink-0">
            Secure In-Store Kiosk Terminal • Nepal NRB Payment Gateway Compliant
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SCREEN: RECEIPT & TOKEN NUMBER SCREEN (Auto Printed)
      ------------------------------------------------------------- */}
      {step === "RECEIPT_TOKEN" && (
        <div className="fixed inset-0 z-50 bg-[#09090B] text-white flex flex-col justify-between p-3 sm:p-5 lg:p-6 select-none overflow-y-auto">
          {/* Top banner */}
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-800 shrink-0">
            <CrunchyLogo size="md" className="h-8 sm:h-9" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] sm:text-xs uppercase font-bold text-emerald-400 tracking-wider">
                Order Dispatched to Kitchen Display
              </span>
            </div>
          </div>

          {/* Center: Token Card & Simulated Thermal Paper Receipt (Side-by-side to fit 1st viewport) */}
          <div className="max-w-4xl mx-auto w-full my-auto py-2 sm:py-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center">
            {/* Left Column: Big Call Token Display & Instructions */}
            <div className="text-center sm:text-left space-y-2.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <div className="inline-flex p-1.5 bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                  Thank You For Your Order!
                </h2>
              </div>

              <p className="text-xs text-zinc-400 max-w-sm mx-auto sm:mx-0 leading-relaxed">
                Please take your printed slip. Watch the pickup counter or scan the receipt QR code to track live order preparation on your phone.
              </p>

              {/* High-Contrast Prominent Call Token Box */}
              <div className="p-3.5 sm:p-4 bg-zinc-900 border-2 border-amber-500 shadow-xl inline-block w-full max-w-sm text-center">
                <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-widest text-zinc-400 block mb-0.5">
                  YOUR CALL TOKEN NUMBER
                </span>
                <span className="text-5xl sm:text-6xl md:text-7xl font-black font-mono text-amber-400 tracking-tight block py-1 leading-none">
                  {generatedToken || "T-108"}
                </span>
                <div className="flex items-center justify-center gap-2.5 text-[11px] text-zinc-400 font-mono mt-1.5">
                  <span>Ref: {completedOrderNumber || "CR-8921"}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold uppercase">
                    {fulfillment === "DINE_IN"
                      ? reservationCodeLinked
                        ? `Dine-In (${reservationCodeLinked})`
                        : "Dine-In"
                      : "Takeaway"}
                  </span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-zinc-800 text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Estimated Ready: {orderTimeEstimate}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Thermal Receipt Paper Graphic with Scan QR */}
            <div className="w-full max-w-[270px] sm:max-w-[290px] mx-auto">
              <div className="relative">
                {/* Printer Eject Slot Visual */}
                <div className="h-3 bg-zinc-950 border border-zinc-700 rounded-none mb-[-2px] z-10 relative flex items-center justify-center">
                  <div className="w-44 h-1 bg-black" />
                </div>

                {/* The Paper Receipt */}
                <div
                  className={`bg-white text-zinc-900 p-3 sm:p-3.5 font-mono text-xs shadow-2xl transition-all duration-700 ${
                    isPrinting ? "translate-y-2 opacity-90" : "translate-y-0 opacity-100"
                  }`}
                  style={{
                    boxShadow: "0 15px 30px rgba(0,0,0,0.8)",
                  }}
                >
                  {/* Paper header */}
                  <div className="text-center pb-1.5 border-b border-dashed border-zinc-400">
                    <p className="font-black text-xs uppercase tracking-wider text-black leading-tight">
                      CRUNCHY FRIED CHICKEN
                    </p>
                    <p className="text-[9px] text-zinc-600 font-semibold">{currentOutlet.name}</p>
                    <p className="text-[8.5px] text-zinc-500">Self-Order Kiosk Slip</p>
                  </div>

                  {/* HIGH-VISIBILITY LARGE TOKEN NUMBER BANNER */}
                  <div className="my-1.5 py-1.5 px-2 bg-zinc-100 border border-dashed border-zinc-900 text-center">
                    <span className="text-[8px] uppercase font-black tracking-widest text-zinc-600 block">
                      CALL TOKEN NUMBER
                    </span>
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-black block leading-none py-0.5">
                      {generatedToken || "T-108"}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block">
                      {fulfillment === "DINE_IN" ? "Dine-In" : "Takeaway"}
                    </span>
                  </div>

                  <div className="py-1 border-b border-dashed border-zinc-400 text-[9px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>Order Ref:</span>
                      <span className="font-bold">{completedOrderNumber || "CR-8921"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="font-bold">{selectedPaymentMethod === "CASH_ON_PICKUP" ? "CASH AT COUNTER" : "ONLINE QR"}</span>
                    </div>
                    {guestName.trim() && (
                      <div className="flex justify-between">
                        <span>Guest:</span>
                        <span className="font-bold truncate max-w-[120px]">{guestName.trim()}</span>
                      </div>
                    )}
                    {guestPhone.trim() && (
                      <div className="flex justify-between">
                        <span>Mobile:</span>
                        <span className="font-bold">{guestPhone.trim()}</span>
                      </div>
                    )}
                  </div>

                  {/* Items List (compact) */}
                  <div className="py-1 border-b border-dashed border-zinc-400 space-y-0.5 text-[9px]">
                    {kioskCart.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate max-w-[150px]">
                          {item.quantity}x {item.product.name}
                        </span>
                        <span className="font-bold">Rs.{item.lineTotal}</span>
                      </div>
                    ))}
                    {kioskCart.length > 3 && (
                      <div className="text-[8.5px] text-zinc-500 text-right italic">
                        +{kioskCart.length - 3} more items
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="py-1 text-right flex items-center justify-between">
                    <span className="text-[8px] text-zinc-500">VAT 13% Incl.</span>
                    <span className="text-xs font-black text-black">
                      {selectedPaymentMethod === "CASH_ON_PICKUP" ? "PAY: " : "PAID: "}Rs.{totalPayable}
                    </span>
                  </div>

                  {/* SCAN QR TO TRACK ORDER LIVE BY PHONE */}
                  <div className="pt-1.5 pb-1 border-t border-dashed border-zinc-800 text-center bg-amber-50/60 -mx-3 sm:-mx-3.5 px-3">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Smartphone className="w-3 h-3 text-zinc-800" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-black">
                        Scan to Track Order
                      </span>
                    </div>

                    {/* Scannable Tracking QR SVG */}
                    <div className="inline-block p-1 bg-white border border-zinc-300 shadow-sm mx-auto">
                      <svg
                        viewBox="0 0 120 120"
                        className="w-16 h-16 sm:w-18 sm:h-18 text-black mx-auto"
                        fill="currentColor"
                      >
                        {/* Finder Top-Left */}
                        <rect x="8" y="8" width="32" height="32" rx="2" fill="#000" />
                        <rect x="13" y="13" width="22" height="22" fill="#FFF" />
                        <rect x="18" y="18" width="12" height="12" fill="#000" />

                        {/* Finder Top-Right */}
                        <rect x="80" y="8" width="32" height="32" rx="2" fill="#000" />
                        <rect x="85" y="13" width="22" height="22" fill="#FFF" />
                        <rect x="90" y="18" width="12" height="12" fill="#000" />

                        {/* Finder Bottom-Left */}
                        <rect x="8" y="80" width="32" height="32" rx="2" fill="#000" />
                        <rect x="13" y="85" width="22" height="22" fill="#FFF" />
                        <rect x="18" y="90" width="12" height="12" fill="#000" />

                        {/* Timing & Matrix Dots */}
                        <rect x="46" y="10" width="6" height="6" fill="#000" />
                        <rect x="58" y="10" width="6" height="6" fill="#000" />
                        <rect x="70" y="10" width="6" height="6" fill="#000" />
                        <rect x="46" y="22" width="6" height="6" fill="#000" />
                        <rect x="70" y="22" width="6" height="6" fill="#000" />
                        <rect x="46" y="34" width="6" height="6" fill="#000" />
                        <rect x="58" y="34" width="6" height="6" fill="#000" />

                        {/* Center Timing lines */}
                        <rect x="10" y="46" width="6" height="6" fill="#000" />
                        <rect x="22" y="46" width="6" height="6" fill="#000" />
                        <rect x="34" y="46" width="6" height="6" fill="#000" />
                        <rect x="46" y="46" width="6" height="6" fill="#000" />
                        <rect x="58" y="46" width="6" height="6" fill="#000" />
                        <rect x="70" y="46" width="6" height="6" fill="#000" />
                        <rect x="82" y="46" width="6" height="6" fill="#000" />
                        <rect x="94" y="46" width="6" height="6" fill="#000" />
                        <rect x="106" y="46" width="6" height="6" fill="#000" />

                        {/* Center badge with mobile icon */}
                        <rect x="42" y="42" width="36" height="36" rx="3" fill="#FFF" stroke="#000" strokeWidth="1.5" />
                        <rect x="52" y="47" width="16" height="26" rx="2.5" fill="#000" />
                        <rect x="54" y="50" width="12" height="18" fill="#FFF" />
                        <circle cx="60" cy="70.5" r="1.2" fill="#FFF" />

                        {/* Bottom data dots */}
                        <rect x="46" y="82" width="6" height="6" fill="#000" />
                        <rect x="58" y="82" width="6" height="6" fill="#000" />
                        <rect x="82" y="82" width="6" height="6" fill="#000" />
                        <rect x="94" y="82" width="6" height="6" fill="#000" />
                        <rect x="106" y="82" width="6" height="6" fill="#000" />
                        <rect x="46" y="94" width="6" height="6" fill="#000" />
                        <rect x="70" y="94" width="6" height="6" fill="#000" />
                        <rect x="82" y="94" width="6" height="6" fill="#000" />
                        <rect x="106" y="94" width="6" height="6" fill="#000" />
                        <rect x="58" y="106" width="6" height="6" fill="#000" />
                        <rect x="70" y="106" width="6" height="6" fill="#000" />
                        <rect x="94" y="106" width="6" height="6" fill="#000" />
                      </svg>
                    </div>

                    <p className="text-[8px] font-mono font-bold text-zinc-700 mt-0.5">
                      crunchy.app/t/{completedOrderNumber || "CR-8921"}
                    </p>
                  </div>

                  <p className="text-[7.5px] text-zinc-500 text-center mt-1 border-t border-dashed border-zinc-300 pt-0.5">
                    Thank you! Wait for Token {generatedToken || "T-108"}
                  </p>
                </div>
              </div>

              {/* Print Status Feedback & Reprint */}
              <div className="mt-2 text-center">
                {isPrinting ? (
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400 animate-pulse font-bold">
                    <Printer className="w-3.5 h-3.5 animate-bounce" />
                    <span>Printing Thermal Slip...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleTriggerPrint}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold cursor-pointer"
                  >
                    <Printer className="w-3 h-3 text-amber-400" />
                    <span>Reprint Token Slip</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Complete & Reset Button */}
          <div className="pt-2.5 sm:pt-3 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
            <div className="text-[10px] sm:text-xs text-zinc-500">
              Returning to Home screen in 15 seconds...
            </div>

            <button
              type="button"
              onClick={handleResetToAttract}
              className="px-5 sm:px-6 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <span>FINISH & RETURN TO HOME</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          PRINT TABLE ORDER TOKEN MODAL (Anytime guest self-service token printer)
      ------------------------------------------------------------- */}
      {isTokenPrintLookupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#121216] border-2 border-zinc-700 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide">
                    Print Table Order Token
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Enter code from your table order to print physical kitchen slip
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playKioskSound("tap");
                  setIsTokenPrintLookupModalOpen(false);
                  setTokenLookupResult(null);
                  setTokenLookupError(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Lookup Form */}
              <form onSubmit={handleTokenLookup} className="space-y-2">
                <label className="block text-[11px] uppercase font-bold text-zinc-300">
                  Enter Token Code, Order #, Table, or Phone:
                </label>
                <div className="relative flex items-center bg-zinc-950 border border-zinc-700 focus-within:border-amber-500 p-1">
                  <div className="pl-3 pr-2 text-zinc-400">
                    <Search className="w-4 h-4 text-amber-400" />
                  </div>
                  <input
                    type="text"
                    value={tokenLookupQuery}
                    onChange={(e) => {
                      setTokenLookupQuery(e.target.value);
                      if (tokenLookupError) setTokenLookupError(null);
                    }}
                    placeholder="e.g. TK-4821, CR-8921, Table 04, or 9841882299"
                    className="w-full bg-transparent py-1.5 px-1 text-sm text-white placeholder:text-zinc-500 focus:outline-none font-mono"
                    autoFocus
                  />
                  {tokenLookupQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setTokenLookupQuery("");
                        setTokenLookupError(null);
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-300 mr-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider shrink-0 transition-transform active:scale-95 cursor-pointer shadow"
                  >
                    Find
                  </button>
                </div>

                {tokenLookupError && (
                  <p className="text-xs text-rose-400 font-medium pl-1">
                    {tokenLookupError}
                  </p>
                )}

                {/* Quick chip helpers */}
                <div className="pt-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">
                    Quick Sample Tests:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTokenLookupQuery("TK-4821");
                        const found = lookupOrderByTokenOrCode("TK-4821");
                        if (found) setTokenLookupResult(found);
                      }}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 text-[10.5px] font-mono font-bold cursor-pointer"
                    >
                      TK-4821 (Table 04 Tab)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTokenLookupQuery("9841882299");
                        const found = lookupOrderByTokenOrCode("9841882299");
                        if (found) setTokenLookupResult(found);
                      }}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10.5px] font-mono cursor-pointer"
                    >
                      9841882299 (Aayush)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTokenLookupQuery("Table 04");
                        const found = lookupOrderByTokenOrCode("Table 04");
                        if (found) setTokenLookupResult(found);
                      }}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10.5px] font-mono cursor-pointer"
                    >
                      Table 04
                    </button>
                  </div>
                </div>
              </form>

              {/* Found Order Card */}
              {tokenLookupResult && (
                <div className="p-3.5 bg-zinc-900/90 border-2 border-amber-500/80 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        MATCHED TABLE ORDER
                      </span>
                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        <span>{tokenLookupResult.customerName}</span>
                        <span className="text-amber-400 font-mono text-xs">
                          ({tokenLookupResult.orderNumber})
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {tokenLookupResult.tableNumber || "Dine-In"} • {tokenLookupResult.customerPhone || "Guest"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                        CALL TOKEN
                      </span>
                      <span className="text-xl font-black font-mono text-amber-400">
                        {tokenLookupResult.kioskToken || "T-108"}
                      </span>
                    </div>
                  </div>

                  {/* Order Items summary */}
                  <div className="space-y-1 text-xs text-zinc-300 max-h-32 overflow-y-auto">
                    {tokenLookupResult.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5">
                        <span className="text-zinc-200">
                          <span className="font-bold text-amber-400">{it.quantity}x</span> {it.productName}
                        </span>
                        <span className="font-mono text-zinc-400">Rs. {it.lineTotal}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      Rounds: <strong className="text-white">{tokenLookupResult.orderRounds?.length || 1}</strong>
                    </span>
                    <span className="text-sm font-black text-amber-400">
                      Total: Rs. {tokenLookupResult.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Print Action */}
                  <button
                    type="button"
                    onClick={() => handlePrintLookedUpOrder(tokenLookupResult)}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-[0.98]"
                  >
                    <Printer className="w-4 h-4" />
                    <span>PRINT PHYSICAL TOKEN SLIP NOW</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Automatic thermal slip dispenser</span>
              <button
                type="button"
                onClick={() => {
                  playKioskSound("tap");
                  setIsTokenPrintLookupModalOpen(false);
                }}
                className="text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
