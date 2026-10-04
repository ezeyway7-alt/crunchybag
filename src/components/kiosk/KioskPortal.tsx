import {posOrderToOrder} from "../../lib/posApi";
import {CompactOrderReceipt} from "../common/CompactOrderReceipt";
import {useOrderReceipt} from "../../lib/orderReceipt";
import {printReceiptDocument} from "../../lib/receiptPrinting";
import {apiClient} from "../../lib/api";
import {submitSelfService, useSelfServiceOrder, useSelfServiceQuote} from "../../lib/selfService";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Home,
  Lock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Product, ProductVariant, SelectedModifier, FulfillmentType, PaymentMethod, Category, Order } from "../../types";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { formatNPR } from "../../lib/utils";
import { ComboPackageModal, ComboPackageDefinition } from "../customer/ComboPackageModal";
import { SkeletonProductGrid } from "../common/Skeleton";
import { comboDefinitions } from "../../lib/catalogApi";

// Kiosk Order Step Flow
type KioskStep = "ATTRACT" | "FULFILLMENT" | "TABLE_SELECT" | "MENU" | "CUSTOMIZE" | "CART_REVIEW" | "PAYMENT" | "RECEIPT_TOKEN";

export const KioskPortal: React.FC = () => {
  const {
    products,
    categories,
    currentOutlet,
    logout,
    addToast,
    lookupOrderByTokenOrCode,
    orders,
    isLoadingSkeleton,
    findActiveOrderByTableOrPhone,
    addItemsToRunningOrder,
  } = useApp();
  const BANNER_SLIDES = comboDefinitions(products);

  // Navigation State
  const [step, setStep] = useState<KioskStep>("ATTRACT");
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("DINE_IN");
  const [tableNumber, setTableNumber] = useState<string>("");
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
    comboSelections?: {product_id:string;variant_id:string|null;modifier_option_ids:string[];quantity:number}[];
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("CASH_ON_PICKUP");
  const [qrProvider, setQrProvider] = useState<"ESEWA" | "KHALTI" | "BANK">("ESEWA");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Completed Token State
  const [generatedToken, setGeneratedToken] = useState<string>("");
  const [orderTimeEstimate, setOrderTimeEstimate] = useState<string>("8 - 12 Mins");
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string>("");
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [hasPrinted, setHasPrinted] = useState<boolean>(false);
  const [receiptCountdown, setReceiptCountdown] = useState<number>(15);

  // Table ongoing bill and append states
  const [isAddingToExistingTab, setIsAddingToExistingTab] = useState(false);
  const [targetOngoingOrder, setTargetOngoingOrder] = useState<Order | null>(null);
  const [selectedTableForPendingPrompt, setSelectedTableForPendingPrompt] = useState<{
    tableNumber: string;
    order: Order;
  } | null>(null);

  const [tables, setTables] = useState<{ id: number; table_number: string; capacity?: number; section?: string; active_order_id?: number | null }[]>([]);
  const [orderError, setOrderError] = useState("");
  const [trackingToken, setTrackingToken] = useState("");
  const [receiptOrder,setReceiptOrder]=useState<Order|null>(null);
  const [savedTotal, setSavedTotal] = useState<number | null>(null);
  const submitting = useRef(false);
  const liveOrder = useSelfServiceOrder(String(currentOutlet.id), currentOutlet.name, trackingToken);
  const kioskReceipt=useOrderReceipt(step==='RECEIPT_TOKEN'?(receiptOrder || liveOrder):null,step==='RECEIPT_TOKEN'?trackingToken:'');

  const DEFAULT_TABLES = [
    { id: 1, table_number: "Table 01", capacity: 2, section: "Main Floor" },
    { id: 2, table_number: "Table 02", capacity: 2, section: "Main Floor" },
    { id: 3, table_number: "Table 03", capacity: 4, section: "Main Floor" },
    { id: 4, table_number: "Table 04", capacity: 4, section: "Main Floor" },
    { id: 5, table_number: "Table 05", capacity: 4, section: "Window Area" },
    { id: 6, table_number: "Table 06", capacity: 4, section: "Window Area" },
    { id: 7, table_number: "Table 07", capacity: 6, section: "Window Area" },
    { id: 8, table_number: "Table 08", capacity: 6, section: "Window Area" },
    { id: 9, table_number: "Table 09", capacity: 4, section: "Terrace Deck" },
    { id: 10, table_number: "Table 10", capacity: 4, section: "Terrace Deck" },
    { id: 11, table_number: "Table 11", capacity: 6, section: "Terrace Deck" },
    { id: 12, table_number: "Table 12", capacity: 8, section: "Family Lounge" },
  ];
  const displayTables = tables.length > 0 ? tables : DEFAULT_TABLES;

  // Helper: Detect if a table currently has an active ongoing pending bill
  const getOngoingOrderForTable = useCallback(
    (tableStr: string): Order | null => {
      if (!tableStr) return null;
      const digits = tableStr.replace(/\D/g, "");
      const clean = tableStr.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

      // 1. Check if table has active_order_id from backend tables endpoint
      const tableObj = displayTables.find(
        (t) =>
          t.table_number.toLowerCase() === tableStr.toLowerCase() ||
          t.table_number.replace(/\D/g, "") === digits
      );
      if (tableObj && (tableObj as any).active_order_id) {
        const activeId = (tableObj as any).active_order_id;
        const backendMatch = orders.find(
          (o) =>
            (o as any)._posOrder?.id === activeId ||
            o.id === String(activeId) ||
            o.orderNumber === String(activeId)
        );
        if (backendMatch && backendMatch.status !== "COMPLETED" && backendMatch.status !== "CANCELLED") {
          const isSettled =
            (backendMatch.isBilled && backendMatch.paymentStatus === "PAID") ||
            (backendMatch as any)._posOrder?.settlement === "PAID";
          if (!isSettled) return backendMatch;
        }
      }

      // 2. Check active orders in state
      return (
        orders.find((o) => {
          if (o.status === "COMPLETED" || o.status === "CANCELLED") return false;
          // Settled / paid orders do not count as pending bills
          const isSettled =
            (o.isBilled && o.paymentStatus === "PAID") ||
            (o as any)._posOrder?.settlement === "PAID" ||
            (Number((o as any)._posOrder?.due_amount || 0) <= 0 && (o as any)._posOrder?.settlement === "PAID");
          if (isSettled) return false;

          if (!o.tableNumber) return false;
          const oDigits = o.tableNumber.replace(/\D/g, "");
          if (digits && oDigits && digits === oDigits) return true;

          const oClean = o.tableNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          if (oClean === clean) return true;

          return false;
        }) || null
      );
    },
    [displayTables, orders]
  );

  useEffect(() => {
    let alive = true;
    apiClient
      .get<any>(`/orders/self-service/tables/${currentOutlet.id}/`, { skipAuth: true })
      .then((data) => {
        if (alive && data?.tables && Array.isArray(data.tables) && data.tables.length > 0) {
          setTables(data.tables);
        }
      })
      .catch(() => {
        if (alive) setOrderError("Unable to load tables.");
      });
    return () => {
      alive = false;
    };
  }, [currentOutlet.id]);

  const checkoutBody = {
    branch_id: Number(currentOutlet.id),
    order_source: "KIOSK",
    fulfillment_type: fulfillment,
    table_id:
      fulfillment === "DINE_IN"
        ? (displayTables.find(
            (t) =>
              t.table_number.toLowerCase() === tableNumber.toLowerCase() ||
              t.table_number.replace(/\D/g, "") === tableNumber.replace(/\D/g, "")
          )?.id ?? (displayTables[0]?.id || 1))
        : null,
    customer_name: guestName.trim(),
    customer_phone: guestPhone.trim(),
    items: kioskCart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      variant_id: item.comboSelections ? null : item.variant.id || null,
      modifier_option_ids: item.comboSelections ? [] : item.modifiers.map((m) => m.optionId),
      item_notes: item.specialInstructions || "",
      ...(item.comboSelections ? { combo_selections: item.comboSelections } : {}),
    })),
  };
  const serverQuote = useSelfServiceQuote(checkoutBody);

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

  // Auto-return countdown timer for RECEIPT_TOKEN screen
  useEffect(() => {
    if (step !== "RECEIPT_TOKEN") {
      setReceiptCountdown(15);
      return;
    }
    setReceiptCountdown(15);
    const interval = setInterval(() => {
      setReceiptCountdown((prev) => {
        if (prev <= 1) {
          handleResetToAttract();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
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
    if(submitting.current)return;
    setTrackingToken('');setReceiptOrder(null);setSavedTotal(null);setOrderError('');setTableNumber('');
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
    setSelectedPaymentMethod("CASH_ON_PICKUP");
    setQrProvider("ESEWA");
    setCustomizingProduct(null);
    setSelectedCombo(null);
    setIsComboModalOpen(false);
    setPaymentProcessing(false);
    setPaymentSuccess(false);
    setHasPrinted(false);
    setIsPrinting(false);
    setIdleSeconds(0);
    setReceiptCountdown(15);
    setIsAddingToExistingTab(false);
    setTargetOngoingOrder(null);
    setSelectedTableForPendingPrompt(null);
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
      const assigned = digits.slice(-2) || "12";
      setTableNumber(assigned);
      const ongoing = getOngoingOrderForTable(assigned);
      if (ongoing) {
        setTargetOngoingOrder(ongoing);
        setIsAddingToExistingTab(true);
      } else {
        setTargetOngoingOrder(null);
        setIsAddingToExistingTab(false);
      }
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
    setReceiptOrder(targetOrder);setTrackingToken((targetOrder as any)._posOrder?.tracking_token || '');
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


  };

  // Calculations for Kiosk Cart
  const subtotal = kioskCart.reduce((sum, item) => sum + item.lineTotal, 0);
  const vatTax = Number(serverQuote.quote?.vat_included_amount || 0);
  const roundDiscount = subtotal > 0 ? +(subtotal - Math.floor(subtotal)).toFixed(2) : 0;
  const totalPayable = savedTotal ?? Number(serverQuote.quote?.total_payable ?? subtotal);

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
    if(product.modifierGroups.some(group=>group.required) || product.variants.length>1){handleOpenCustomize(product);return;}
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
    productId: string;
    comboSelections: { product_id: string; variant_id: string | null; modifier_option_ids: string[]; quantity: number }[];
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
      id: comboData.productId,
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
      comboSelections: comboData.comboSelections,
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

  const handleProcessPayment = async () => {
    if (!kioskCart.length || submitting.current) return;
    if (fulfillment === 'DINE_IN' && !tableNumber.trim()) {
      setOrderError('Please select your dining table before confirming your order.');
      setStep('TABLE_SELECT');
      return;
    }

    // 1. If in "Add to Table Bill" mode, append items to the ongoing order instead of creating a new bill
    if (isAddingToExistingTab && targetOngoingOrder) {
      submitting.current = true;
      setPaymentProcessing(true);
      setOrderError('');
      try {
        const formattedItems = kioskCart.map((item) => ({
          id: item.id,
          productId: item.product.id,
          productName: item.product.name,
          product: item.product,
          variantId: item.variant.id,
          variantName: item.variant.name,
          variant: item.variant,
          modifiers: item.modifiers.map((m) => m.optionName),
          selectedModifiers: item.modifiers,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
          specialInstructions: item.specialInstructions,
        }));

        const updated = addItemsToRunningOrder(targetOngoingOrder.id, formattedItems);
        const nextRound = (targetOngoingOrder.roundsCount || 1) + 1;
        const tokenStr = `${targetOngoingOrder.orderNumber}-R${nextRound}`;
        setGeneratedToken(tokenStr);
        setCompletedOrderNumber(targetOngoingOrder.orderNumber);
        setOrderTimeEstimate(`In ${currentOutlet.estimatedPrepTimeMin || 12} mins`);
        if (updated) {
          setReceiptOrder(updated);
          setSavedTotal(updated.totalAmount);
        } else {
          setReceiptOrder(targetOngoingOrder);
        }
        playKioskSound('success');
        setPaymentSuccess(true);
        setStep('RECEIPT_TOKEN');
        addToast({
          type: 'success',
          message: `Round ${nextRound} successfully sent to kitchen for Table ${tableNumber}. Added to Bill #${targetOngoingOrder.orderNumber}.`,
        });
      } catch (err: any) {
        setOrderError(err.message || 'Failed to append items to table bill.');
      } finally {
        submitting.current = false;
        setPaymentProcessing(false);
      }
      return;
    }

    // 2. Safeguard: A table with an ongoing pending bill CANNOT accept a new order!
    if (fulfillment === 'DINE_IN' && tableNumber.trim()) {
      const ongoing = getOngoingOrderForTable(tableNumber);
      if (ongoing) {
        const errorMsg = `Table ${tableNumber} already has an ongoing pending bill (#${ongoing.orderNumber}). A new order cannot be accepted for this table. Please choose an available table or add items to the active bill.`;
        setOrderError(errorMsg);
        addToast({
          type: 'error',
          message: `Table ${tableNumber} has an ongoing pending bill. New order cannot be accepted.`,
        });
        setStep('TABLE_SELECT');
        return;
      }
    }

    // 3. Normal new order checkout for vacant tables / takeaway
    submitting.current=true;setPaymentProcessing(true);setOrderError('');
    try {
      const created=await submitSelfService({...checkoutBody,expected_total:serverQuote.quote?.total_payable});
      setGeneratedToken(created.order_number);setCompletedOrderNumber(created.order_number);
      setSavedTotal(Number(created.total_payable));setTrackingToken(created.tracking_token);setReceiptOrder(posOrderToOrder(created,currentOutlet.name));
      setOrderTimeEstimate(`In ${currentOutlet.estimatedPrepTimeMin || 12} mins`);
      playKioskSound('success');setPaymentSuccess(true);setStep('RECEIPT_TOKEN');
    } catch(error:any){setOrderError(error.message || 'Order not confirmed. Retry to recover the same request.');serverQuote.refresh();}
    finally{submitting.current=false;setPaymentProcessing(false);}
  };

  const handleTriggerPrint = async () => {
    if(!kioskReceipt.receipt)return;
    setIsPrinting(true);setOrderError('');
    try{await printReceiptDocument(kioskReceipt.receipt);setHasPrinted(true);}
    catch(error:any){setOrderError(error.message);}
    finally{setIsPrinting(false);}
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
                setStep("TABLE_SELECT");
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
                setTableNumber("");
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
     SCREEN 2: TABLE SELECTION (Full-Screen Direct Table Grid)
  ------------------------------------------------------------- */
  if (step === "TABLE_SELECT") {
    return (
      <div className="fixed inset-0 z-50 bg-[#09090B] text-white flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden animate-in fade-in duration-200 font-sans">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              playKioskSound("tap");
              setStep(kioskCart.length > 0 ? "MENU" : "ATTRACT");
            }}
            className="px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>{kioskCart.length > 0 ? "Back to Menu" : "Back"}</span>
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <CrunchyLogo size="sm" className="h-7 sm:h-8" />
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-zinc-100">
                Select Your Table
              </span>
            </div>
            {/* Live Indicator Legend Strip */}
            <div className="flex items-center gap-4 text-[10.5px] mt-1 text-zinc-400 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Vacant (Ready for New Order)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400/90 font-bold">Ongoing Bill (New Bill Blocked • Tap to Add Items)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playKioskSound("tap");
                setStep("MENU");
              }}
              className="px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleResetToAttract}
              className="p-1.5 bg-zinc-900/90 hover:bg-rose-950 border border-zinc-800 hover:border-rose-700 text-zinc-400 hover:text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Start Over"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Direct Full-Screen Interactive Table Grid */}
        <div className="relative z-10 flex-1 overflow-y-auto py-4 sm:py-6 w-full max-w-6xl mx-auto flex flex-col justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 my-auto">
            {displayTables.map((t) => {
              const ongoingOrder = getOngoingOrderForTable(t.table_number);
              const isOccupiedWithBill = !!ongoingOrder;
              const isSelected =
                tableNumber === t.table_number ||
                tableNumber === t.table_number.replace(/\D/g, "") ||
                (tableNumber && t.table_number.toLowerCase() === tableNumber.toLowerCase());

              if (isOccupiedWithBill) {
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      playKioskSound("tap");
                      setSelectedTableForPendingPrompt({
                        tableNumber: t.table_number,
                        order: ongoingOrder,
                      });
                    }}
                    className={`relative p-3.5 sm:p-4 border-2 transition-all flex flex-col items-center justify-between gap-1.5 cursor-pointer active:scale-95 group text-center min-h-[105px] sm:min-h-[120px] bg-gradient-to-b from-[#1C160C] to-[#12100C] border-amber-500/70 hover:border-amber-400 text-zinc-100 shadow-md ${
                      isSelected && isAddingToExistingTab ? "ring-2 ring-amber-400 shadow-amber-500/30" : ""
                    }`}
                  >
                    {/* Top Status Header */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span className="text-[8.5px] uppercase font-black tracking-wider text-amber-400">
                          Pending Bill
                        </span>
                      </div>
                      <Lock className="w-3 h-3 text-amber-400/80" />
                    </div>

                    {/* Table Name */}
                    <div className="my-0.5">
                      <span className="block font-black text-base sm:text-lg tracking-tight leading-tight text-white group-hover:text-amber-300">
                        {t.table_number}
                      </span>
                      <span className="block text-[10px] font-mono text-amber-400/90 font-bold truncate mt-0.5">
                        #{ongoingOrder.orderNumber} • {formatNPR(ongoingOrder.totalAmount)}
                      </span>
                    </div>

                    {/* Bottom Action Badge */}
                    <div className="w-full pt-1 border-t border-amber-500/30 flex items-center justify-center gap-1 text-[10px] font-bold text-amber-400 group-hover:text-amber-300">
                      <Plus className="w-2.5 h-2.5 stroke-[3]" />
                      <span>Add to Bill</span>
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    playKioskSound("beep");
                    setTableNumber(t.table_number);
                    setIsAddingToExistingTab(false);
                    setTargetOngoingOrder(null);
                    addToast({
                      type: "success",
                      message: `${t.table_number} selected for new order.`,
                    });
                    setStep("MENU");
                  }}
                  className={`relative p-3.5 sm:p-4 border-2 transition-all flex flex-col items-center justify-between gap-1.5 cursor-pointer active:scale-95 group text-center min-h-[105px] sm:min-h-[120px] ${
                    isSelected
                      ? "bg-emerald-500/20 border-emerald-400 text-white shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                      : "bg-[#141418] hover:bg-[#1a1a22] border-zinc-700/80 hover:border-emerald-400/80 text-zinc-200"
                  }`}
                >
                  {/* Top Status Header */}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[8.5px] uppercase font-bold text-emerald-400/90 tracking-wider">
                      Available
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>

                  {/* Table Name */}
                  <div className="my-0.5">
                    <span
                      className={`block font-black text-base sm:text-lg tracking-tight leading-tight ${
                        isSelected ? "text-emerald-400" : "text-white group-hover:text-emerald-300"
                      }`}
                    >
                      {t.table_number}
                    </span>
                    {t.section && (
                      <span className="block text-[10.5px] text-zinc-500 font-medium truncate mt-0.5">
                        {t.section} • {t.capacity || 4} Seats
                      </span>
                    )}
                  </div>

                  {/* Bottom Action Badge */}
                  <div className="w-full pt-1 border-t border-zinc-800 flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300">
                    <Utensils className="w-2.5 h-2.5" />
                    <span>Start Order</span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-black flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom subtle guidance */}
        <div className="relative z-10 text-center text-xs text-zinc-500 pt-2 border-t border-zinc-800/80 shrink-0">
          Touch a vacant table to start a new order, or an occupied table to add food to its ongoing bill
        </div>

        {/* -------------------------------------------------------------
            MODAL: OCCUPIED TABLE / ONGOING PENDING BILL PROMPT
        ------------------------------------------------------------- */}
        {selectedTableForPendingPrompt && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
            <div className="bg-[#121216] border-2 border-amber-500/80 w-full max-w-md shadow-2xl overflow-hidden flex flex-col font-sans">
              {/* Header */}
              <div className="p-3.5 sm:p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide">
                      {selectedTableForPendingPrompt.tableNumber} — Ongoing Bill
                    </h3>
                    <p className="text-[11px] text-amber-400 font-bold">
                      New billing is not allowed for this table
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTableForPendingPrompt(null)}
                  className="p-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5 space-y-3.5">
                {/* Notice Box */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-zinc-200 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-black uppercase text-amber-400 text-[11px]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>New Order Blocked</span>
                  </div>
                  <p>
                    <strong className="text-white">{selectedTableForPendingPrompt.tableNumber}</strong> already has an active, unpaid bill (<span className="font-mono text-amber-400 font-bold">#{selectedTableForPendingPrompt.order.orderNumber}</span>). A brand new separate order/bill cannot be created for this table until the ongoing bill is cleared.
                  </p>
                </div>

                {/* Bill Snapshot Card */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>Active Bill Reference:</span>
                    <span className="font-mono font-bold text-white">#{selectedTableForPendingPrompt.order.orderNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>Guest / Table Host:</span>
                    <span className="font-bold text-zinc-200">{selectedTableForPendingPrompt.order.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                    <span>Current Rounds Placed:</span>
                    <span className="font-mono font-bold text-zinc-200">{selectedTableForPendingPrompt.order.roundsCount || 1}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                    <span className="font-bold text-zinc-300">Current Outstanding:</span>
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {formatNPR(selectedTableForPendingPrompt.order.totalAmount)}
                    </span>
                  </div>
                </div>

                <p className="text-[11.5px] text-zinc-400 leading-normal">
                  Are you currently seated at this table and wish to order additional food or drinks? You can append items to this ongoing bill.
                </p>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      playKioskSound("beep");
                      setTableNumber(selectedTableForPendingPrompt.tableNumber);
                      setTargetOngoingOrder(selectedTableForPendingPrompt.order);
                      setIsAddingToExistingTab(true);
                      setSelectedTableForPendingPrompt(null);
                      setStep("MENU");
                      addToast({
                        type: "info",
                        message: `Adding items to ${selectedTableForPendingPrompt.tableNumber} Bill #${selectedTableForPendingPrompt.order.orderNumber}.`,
                      });
                    }}
                    className="w-full py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>
                      Add Items to This Table's Bill (Round {(selectedTableForPendingPrompt.order.roundsCount || 1) + 1})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTableForPendingPrompt(null)}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Choose Another Available Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* -------------------------------------------------------------
     SCREEN 3 & 4: TOUCH MENU & QUICK CART (Tablet Touch Screen Layout)
  ------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C] text-white flex flex-col select-none overflow-hidden font-sans">
      {/* 1. KIOSK TOP APP BAR */}
      {trackingToken && <div role="status" className="text-center text-xs text-amber-400 py-1">Order status: {liveOrder?.status || 'CONFIRMED'} | Payment due at counter</div>}
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
              if (fulfillment === "DINE_IN") {
                setStep("TABLE_SELECT");
              } else {
                setStep("ATTRACT");
              }
            }}
            className="px-2 sm:px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {fulfillment === "DINE_IN" ? (
              <>
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isAddingToExistingTab && targetOngoingOrder ? (
                    `Adding to ${tableNumber} (Bill #${targetOngoingOrder.orderNumber} • R${(targetOngoingOrder.roundsCount || 1) + 1})`
                  ) : tableNumber ? (
                    tableNumber.toLowerCase().includes("table") ? tableNumber : `Table ${tableNumber}`
                  ) : (
                    reservationCodeLinked ? `Table • ${reservationCodeLinked}` : "Select Table"
                  )}
                </span>
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

        {/* MIDDLE SECTION: Place to enter user mobile number and then name (Focused & High Visibility) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile number with tick option */}
          <div className="flex items-center bg-black/80 border border-zinc-500 hover:border-amber-400 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/40 px-2 sm:px-2.5 py-1 gap-1.5 shadow-sm transition-all">
            <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
              placeholder="Mobile #"
              className="w-24 sm:w-28 bg-transparent text-xs font-bold text-white placeholder:text-zinc-400 placeholder:font-medium focus:outline-none"
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
              title={phoneVerified ? "Mobile entered" : "Mark mobile as entered"}
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
          <div className="flex items-center bg-black/80 border border-zinc-500 hover:border-amber-400 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/40 px-2 sm:px-2.5 py-1 gap-1.5 shadow-sm transition-all">
            <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest Name"
              className="w-22 sm:w-28 bg-transparent text-xs font-bold text-white placeholder:text-zinc-400 placeholder:font-medium focus:outline-none"
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
      <div className="bg-[#111116] border-b border-zinc-800 px-2 sm:px-4 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 overflow-x-auto shrink-0 scrollbar-none z-10">
        {/* 1. All Items Button */}
        <button
          type="button"
          onClick={() => {
            playKioskSound("tap");
            handleCategorySelect("all");
          }}
          className={`h-6.5 sm:h-7 px-2 sm:px-2.5 flex items-center justify-center gap-1 border transition-all cursor-pointer whitespace-nowrap shrink-0 text-[10.5px] uppercase font-bold tracking-tight ${
            selectedCategory === "all"
              ? "bg-amber-500/20 border-amber-500 text-amber-400 font-black shadow-sm"
              : "bg-[#18181E] border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white"
          }`}
        >
          <span>All</span>
          <span
            className={`text-[9px] font-mono px-1 py-0 font-semibold ${
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
          className={`h-6.5 sm:h-7 px-2 sm:px-2.5 flex items-center justify-center gap-1 border transition-all cursor-pointer whitespace-nowrap shrink-0 text-[10.5px] uppercase font-bold tracking-tight ${
            selectedCategory === "packages"
              ? "bg-amber-500/20 border-amber-500 text-amber-400 font-black shadow-sm"
              : "bg-[#18181E] border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white"
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Packages</span>
          <span
            className={`text-[9px] font-mono px-1 py-0 font-semibold ${
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
              className={`h-6.5 sm:h-7 px-2 sm:px-2.5 flex items-center justify-center gap-1 border transition-all cursor-pointer whitespace-nowrap shrink-0 text-[10.5px] uppercase font-bold tracking-tight ${
                isSelected
                  ? "bg-amber-500/20 border-amber-500 text-amber-400 font-black shadow-sm"
                  : "bg-[#18181E] border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white"
              }`}
            >
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className={`text-[9px] font-mono px-1 py-0 font-semibold ${
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
        <main className="flex-1 overflow-y-auto p-2 sm:p-2.5 bg-[#0B0B0E]">
          {/* Header Row: Category Badge (Left) + Centered Wide Search Bar */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            {/* Left: Category info & item count */}
            <div className="flex items-center gap-1.5 shrink-0 min-w-0">
              {selectedCategory !== "all" && (
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                  {selectedCategory === "packages" ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Curated Packages</span>
                    </>
                  ) : (
                    categories.find((c) => c.id === selectedCategory)?.name || "Dishes"
                  )}
                </h2>
              )}
              <span className="text-[11px] font-mono text-zinc-400 font-medium whitespace-nowrap">
                ({selectedCategory === "packages"
                  ? filteredCombos.length
                  : selectedCategory === "all"
                  ? currentCategoryProducts.length + filteredCombos.length
                  : currentCategoryProducts.length} items)
              </span>
            </div>

            {/* Center: Wide Search Bar (Eliminates awkward right empty space) */}
            <div className="flex-1 flex justify-center px-1 sm:px-3">
              <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes, packages, combos..."
                  className="w-full bg-zinc-900/95 border border-zinc-700/80 hover:border-zinc-500 focus:border-amber-500 pl-8 pr-7 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-all font-medium shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Balance spacer so the search bar stays centered */}
            <div className="shrink-0 min-w-0 hidden md:block w-16" />
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
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
                      <div className="absolute top-1 right-1 z-10 bg-black/85 text-amber-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 border border-amber-500/40">
                        {combo.promoText}
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative aspect-[16/9] bg-zinc-950 overflow-hidden">
                      <img
                        src={combo.image}
                        alt={combo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Price Tag Overlay */}
                      <div className="absolute bottom-1 right-1 flex items-baseline gap-1 px-1.5 py-0.2 bg-black/90 border border-amber-500/60 shadow">
                        <span className="text-amber-400 font-mono font-black text-[11px]">
                          {formatNPR(combo.basePrice)}
                        </span>
                        {combo.originalPrice && combo.originalPrice > combo.basePrice && (
                          <span className="text-[8.5px] font-mono text-zinc-400 line-through">
                            {formatNPR(combo.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight line-clamp-1 leading-snug">
                          {combo.title}
                        </h3>
                      </div>

                      {/* Bottom action bar */}
                      <div className="mt-1.5 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[9.5px] font-mono text-zinc-400">
                          {combo.includedProductIds.length} items
                        </span>
                        <div className="flex items-center gap-1 text-[9.5px] font-bold text-black bg-amber-500 group-hover:bg-amber-400 px-2 py-0.5 uppercase tracking-wide transition-colors">
                          <Sliders className="w-2.5 h-2.5" />
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
              {/* Featured Packages Horizontal Slider in "All" view (Compact & Congested) */}
              {selectedCategory === "all" && filteredCombos.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                        Featured Packages
                      </h3>
                      <span className="text-[9.5px] text-zinc-500 font-mono">
                        ({filteredCombos.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Left & Right Arrow controls for horizontal slider */}
                      <button
                        type="button"
                        onClick={() => {
                          playKioskSound("tap");
                          if (kioskFeaturedScrollRef.current) {
                            kioskFeaturedScrollRef.current.scrollBy({ left: -260, behavior: "smooth" });
                          }
                        }}
                        className="p-1 bg-[#1a1a20] hover:bg-amber-500 hover:text-black text-zinc-300 border border-zinc-700/80 transition-colors cursor-pointer"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playKioskSound("tap");
                          if (kioskFeaturedScrollRef.current) {
                            kioskFeaturedScrollRef.current.scrollBy({ left: 260, behavior: "smooth" });
                          }
                        }}
                        className="p-1 bg-[#1a1a20] hover:bg-amber-500 hover:text-black text-zinc-300 border border-zinc-700/80 transition-colors cursor-pointer"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playKioskSound("tap");
                          setSelectedCategory("packages");
                        }}
                        className="text-[10.5px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer ml-1"
                      >
                        <span>View all</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Slider Viewport Track (Congested) */}
                  <div
                    ref={kioskFeaturedScrollRef}
                    className="flex items-stretch gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-1"
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
                          w-[54%] sm:w-[35%] md:w-[26%] lg:w-[21%] xl:w-[17%] 2xl:w-[14%] min-h-[88px] sm:min-h-[96px]"
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
                        <div className="relative z-10 p-1.5 flex flex-col justify-between h-full text-white">
                          {/* Top row: Promo badge if any, and item count badge */}
                          <div className="flex items-center justify-between gap-1">
                            {combo.promoText ? (
                              <span className="bg-black/80 text-amber-400 text-[7px] font-black uppercase tracking-wider px-1 py-0.2 border border-amber-500/40">
                                {combo.promoText}
                              </span>
                            ) : <span />}

                            <span className="bg-black/70 text-zinc-300 text-[8px] font-mono font-bold px-1 py-0.2 border border-white/20">
                              {combo.includedProductIds.length} items
                            </span>
                          </div>

                          {/* Main Clean Package Title */}
                          <div className="my-auto py-0.5">
                            <h3 className="text-[11px] sm:text-xs font-bold tracking-tight leading-tight uppercase drop-shadow-md text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                              {combo.title}
                            </h3>
                          </div>

                          {/* Bottom Action Button & Price */}
                          <div className="pt-1 flex items-center justify-between gap-1 border-t border-white/20">
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 group-hover:bg-amber-400 text-black font-black text-[9px] uppercase tracking-wider transition-colors shadow-sm">
                              <Sliders className="w-2.5 h-2.5 text-black" />
                              <span>{combo.buttonLabel || "Customize"}</span>
                            </div>

                            <div className="text-right">
                              {combo.originalPrice && combo.originalPrice > combo.basePrice && (
                                <span className="text-[8.5px] text-zinc-300 line-through mr-1 font-mono">
                                  {formatNPR(combo.originalPrice)}
                                </span>
                              )}
                              <span className="text-[11px] sm:text-xs font-black text-amber-400 font-mono drop-shadow-xs">
                                {formatNPR(combo.basePrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sleek low-profile separator to keep things congested */}
                  <div className="my-1.5 border-t border-zinc-800/60" />
                </div>
              )}

              {/* Product Touch Grid (Compact & Space-Efficient) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-2.5">
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
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-amber-500 text-black font-black text-[10.5px] shadow">
                      {formatNPR(product.basePrice)}
                    </div>
                  </div>

                  {/* Body Info (Smaller text, clean & compact) */}
                  <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1 leading-tight">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Touch Action Bar */}
                    <div className="mt-1.5 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-zinc-500 font-medium truncate">
                        {product.variants.length > 1 ? `${product.variants.length} Sizes` : "Regular"}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Customize Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCustomize(product);
                          }}
                          className="h-7 px-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-[10px] font-bold text-zinc-200 uppercase tracking-wider border border-zinc-700 flex items-center justify-center transition-transform"
                        >
                          Options
                        </button>

                        {/* Quick Add Button */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(product, e)}
                          className="w-7 h-7 bg-amber-500 hover:bg-amber-400 active:scale-90 text-black font-black flex items-center justify-center transition-transform shadow-md cursor-pointer shrink-0"
                          title="Quick Add 1 Item"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
          <div className="px-2.5 py-1.5 border-b border-zinc-800 bg-[#151518] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <h3 className="text-[11px] sm:text-xs font-bold uppercase text-zinc-300 tracking-wider">
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
                className="text-[10px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart Items List (Compact Single-Row Layout) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {kioskCart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                <ShoppingBag className="w-8 h-8 stroke-[1.2] text-zinc-700 mb-1.5" />
                <p className="text-[11px] font-semibold text-zinc-400">Tray is Empty</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Touch any item to add
                </p>
              </div>
            ) : (
              kioskCart.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#18181D] hover:bg-[#1f1f26] border border-zinc-800/80 p-2 flex items-center justify-between gap-2 text-xs transition-colors"
                >
                  {/* Left: Product Name, Variant, Modifiers */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {item.product.categoryId === "cat-combos" && (
                        <span className="bg-amber-500 text-black text-[8px] font-black uppercase px-1 py-0.2 shrink-0">
                          Pack
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-white truncate leading-tight">
                        {item.product.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-400 truncate">
                      <span className="text-amber-400 font-medium truncate max-w-[90px]">
                        {item.variant.name}
                      </span>
                      {item.modifiers.length > 0 && (
                        <span
                          className="text-zinc-500 truncate max-w-[90px]"
                          title={item.modifiers.map((m) => m.optionName).join(", ")}
                        >
                          • {item.modifiers.map((m) => m.optionName).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Inline Compact Quantity Stepper + Line Total */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-zinc-900 border border-zinc-700/80">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, -1)}
                        className="w-5.5 h-5.5 sm:w-6 sm:h-6 hover:bg-zinc-800 active:scale-95 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                        title="Decrease"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-[11px] text-amber-400 select-none">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, 1)}
                        className="w-5.5 h-5.5 sm:w-6 sm:h-6 hover:bg-zinc-800 active:scale-95 text-zinc-300 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                        title="Increase"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <span className="text-xs font-bold font-mono text-white min-w-[50px] text-right">
                      {formatNPR(item.lineTotal)}
                    </span>
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
              <span>
                {isAddingToExistingTab && targetOngoingOrder
                  ? `Send Round ${(targetOngoingOrder.roundsCount || 1) + 1} to Kitchen`
                  : "Pay & Order"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </div>

      {/* -------------------------------------------------------------
          MODAL: CUSTOMIZE ITEM (Variants + Add-ons)
      ------------------------------------------------------------- */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#141418] border border-zinc-700 w-full max-w-sm sm:max-w-md max-h-[82vh] flex flex-col shadow-2xl overflow-hidden rounded-none">
            {/* Modal Header */}
            <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[#18181D] border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {customizingProduct.images?.[0] && (
                  <img
                    src={customizingProduct.images[0]}
                    alt={customizingProduct.name}
                    className="w-9 h-9 sm:w-10 sm:h-10 object-cover border border-zinc-700 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <span className="text-[9.5px] uppercase font-bold text-amber-500 tracking-wider block">
                    Customize Selection
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase truncate">
                    {customizingProduct.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingProduct(null)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 overscroll-contain">
              {/* 1. Size / Patty Variant Selection */}
              {customizingProduct.variants.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-black text-zinc-400 tracking-wider mb-1.5">
                    1. Portion / Variant
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {customizingProduct.variants.map((variant) => {
                      const isSelected = activeVariant?.id === variant.id;
                      return (
                        <div
                          key={variant.id}
                          onClick={() => {
                            playKioskSound("tap");
                            setActiveVariant(variant);
                          }}
                          className={`px-2.5 py-1.5 border cursor-pointer flex items-center justify-between text-xs transition-all ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10 text-white font-bold"
                              : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? "border-amber-500 bg-amber-500 text-black" : "border-zinc-600"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="text-[11.5px] font-bold truncate">{variant.name}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0 ml-1">
                            {formatNPR(variant.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Modifiers / Add-ons */}
              {customizingProduct.modifierGroups && customizingProduct.modifierGroups.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-black text-zinc-400 tracking-wider mb-1.5">
                    2. Add-Ons & Toppings
                  </h4>
                  {customizingProduct.modifierGroups.map((group) => (
                    <div key={group.id} className="mb-2.5">
                      <span className="text-[10.5px] font-bold text-zinc-300 block mb-1">
                        {group.name} {group.required ? "(Required)" : "(Optional)"}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
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
                              className={`px-2 py-1.5 border cursor-pointer flex items-center justify-between text-xs transition-all ${
                                isChecked
                                  ? "border-amber-500 bg-amber-500/10 text-white font-bold"
                                  : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div
                                  className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${
                                    isChecked ? "border-amber-500 bg-amber-500 text-black" : "border-zinc-600"
                                  }`}
                                >
                                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span className="text-[11px] truncate">{opt.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1">
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
                <h4 className="text-[10px] uppercase font-black text-zinc-400 tracking-wider mb-1">
                  3. Kitchen Notes (Optional)
                </h4>
                <input
                  type="text"
                  value={activeNotes}
                  onChange={(e) => setActiveNotes(e.target.value)}
                  placeholder="e.g. Extra crispy, sauce on the side..."
                  className="w-full bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 4. Quantity */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <span className="text-[10.5px] uppercase font-black text-zinc-400 tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveQty(Math.max(1, activeQty - 1))}
                    className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center font-bold border border-zinc-700 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
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
                    className="w-10 h-7 text-center font-mono font-bold text-xs sm:text-sm text-amber-400 bg-zinc-900 border border-zinc-700 focus:border-amber-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                    title="Click to edit quantity"
                  />
                  <button
                    type="button"
                    onClick={() => setActiveQty(Math.min(99, activeQty + 1))}
                    className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center font-bold border border-zinc-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[#18181D] border-t border-zinc-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-zinc-400 block tracking-wider">Total</span>
                <span className="text-base sm:text-lg font-black text-amber-400 font-mono leading-none">
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
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer active:scale-98"
              >
                <span>Add To Tray</span>
                <Check className="w-4 h-4 stroke-[3]" />
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

            {fulfillment === 'DINE_IN' && (
              <div className="bg-[#141418] border border-zinc-800 p-3 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                      Dining Table
                    </span>
                    <span className="text-xs sm:text-sm font-black text-amber-400">
                      {tableNumber
                        ? tableNumber.toLowerCase().includes("table")
                          ? tableNumber
                          : `Table ${tableNumber}`
                        : "No table selected"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playKioskSound("tap");
                    setStep("TABLE_SELECT");
                  }}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {tableNumber ? "Change Table" : "Select Table"}
                </button>
              </div>
            )}
            {(orderError || serverQuote.error) && <p role="alert" className="text-xs text-rose-400 mb-2">{orderError || serverQuote.error}</p>}
            {isAddingToExistingTab && targetOngoingOrder ? (
              <div className="bg-amber-500/10 border-2 border-amber-500/50 p-3.5 sm:p-4 text-center space-y-1.5">
                <div className="w-10 h-10 bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Utensils className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black text-amber-400 uppercase tracking-wide">
                  Appending to Table {tableNumber} Bill
                </h4>
                <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                  These items will be sent to the kitchen as <strong className="text-white">Round {(targetOngoingOrder.roundsCount || 1) + 1}</strong> and added to ongoing bill <strong className="text-amber-400 font-mono">#{targetOngoingOrder.orderNumber}</strong>. No new separate order will be opened.
                </p>
                <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs text-zinc-400 max-w-xs mx-auto">
                  <span>Current Bill: <strong className="text-zinc-200">{formatNPR(targetOngoingOrder.totalAmount)}</strong></span>
                  <span>+ This Round: <strong className="text-amber-400 font-mono font-bold">+{formatNPR(subtotal)}</strong></span>
                </div>
              </div>
            ) : selectedPaymentMethod === "CASH_ON_PICKUP" && (
              <div className="bg-[#141418] border border-zinc-800 p-3.5 sm:p-4 text-center space-y-1.5">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Banknote className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase">
                  Pay Cash at Pickup Counter
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Your order will be saved with payment due. Please keep{" "}
                  <span className="text-amber-400 font-mono font-bold">{formatNPR(totalPayable)}</span>{" "}
                  cash ready to pay at the counter when your token is called.
                </p>
              </div>
            )}

            {/* 4. CONFIRM & PRINT ACTION BUTTON */}
            <div className="mt-2.5 sm:mt-3 text-center max-w-sm mx-auto w-full">
              <button
                type="button"
                disabled={paymentProcessing || (!isAddingToExistingTab && !serverQuote.quote)}
                onClick={()=>void handleProcessPayment()}
                className="w-full py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {paymentProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isAddingToExistingTab ? "Sending Round to Kitchen..." : "Confirming order..."}</span>
                  </>
                ) : isAddingToExistingTab ? (
                  <>
                    <span>Send Round {(targetOngoingOrder?.roundsCount || 1) + 1} to Kitchen • Add to Bill</span>
                    <ArrowRight className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 bg-[#09090B] text-white flex flex-col justify-between p-3 sm:p-4 lg:p-5 select-none h-screen h-[100dvh] max-h-screen overflow-hidden">
          {/* Top banner (shrink-0) */}
          <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-zinc-800 shrink-0">
            <CrunchyLogo size="md" className="h-7 sm:h-8" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-500/10 border border-emerald-500/30 px-2 sm:px-2.5 py-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] sm:text-xs uppercase font-bold text-emerald-400 tracking-wider">
                  Order Dispatched to Kitchen Display
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToAttract}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Return to Home screen"
              >
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          </div>

          {/* Center: Token Card & Simulated Thermal Paper Receipt (Side-by-side to fit 1st viewport) */}
          <div className="flex-1 min-h-0 flex items-center justify-center my-auto py-1 sm:py-2 overflow-y-auto sm:overflow-visible">
            <div className="max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 items-center">
              {/* Left Column: Big Call Token Display & Instructions */}
              <div className="text-center sm:text-left space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <div className="inline-flex p-1.5 bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                    {isAddingToExistingTab ? "Round Dispatched to Kitchen!" : "Thank You For Your Order!"}
                  </h2>
                </div>

                <p className="text-[11px] sm:text-xs text-zinc-400 max-w-sm mx-auto sm:mx-0 leading-relaxed">
                  {isAddingToExistingTab && targetOngoingOrder
                    ? `Items added to Table ${tableNumber} Bill #${targetOngoingOrder.orderNumber}. Watch the order TV screen for your kitchen token.`
                    : "Keep your order number handy. Watch the order TV screen or scan the receipt QR to follow live kitchen status."}
                </p>

                {/* High-Contrast Prominent Call Token Box */}
                <div className="p-3 sm:p-4 bg-zinc-900 border-2 border-amber-500 shadow-xl inline-block w-full max-w-sm text-center">
                  <span className="text-[10px] sm:text-[11px] uppercase font-black tracking-widest text-zinc-400 block mb-0.5">
                    {isAddingToExistingTab ? "ROUND KITCHEN TOKEN NUMBER" : "YOUR CALL TOKEN NUMBER"}
                  </span>
                  <span className="text-5xl sm:text-6xl font-black font-mono text-amber-400 tracking-tight block py-0.5 leading-none">
                    {generatedToken}
                  </span>
                  <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] text-zinc-400 font-mono mt-1">
                    <span>Ref: {completedOrderNumber}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold uppercase">
                      {isAddingToExistingTab && targetOngoingOrder
                        ? `Dine-In (${tableNumber} • Round ${(targetOngoingOrder.roundsCount || 1) + 1})`
                        : fulfillment === "DINE_IN"
                        ? reservationCodeLinked
                          ? `Dine-In (${reservationCodeLinked})`
                          : "Dine-In"
                        : "Takeaway"}
                    </span>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-zinc-800 text-[10px] sm:text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated Ready: {orderTimeEstimate}</span>
                  </div>
                </div>

                {liveOrder?.status && (
                  <p role="status" className="text-[11px] text-amber-400/90 font-medium">
                    Order status: <span className="font-bold text-amber-400">{liveOrder.status}</span> • Payment at counter
                  </p>
                )}
              </div>

              {/* Right Column: Thermal Receipt Paper Graphic with Scan QR */}
              <div className="w-full max-w-[270px] sm:max-w-[290px] mx-auto flex flex-col items-center">
                {/* Printer Eject Slot & Thermal Slip Container */}
                <div className="w-full relative shadow-2xl">
                  {/* Printer Slot Graphic */}
                  <div className="h-3.5 bg-zinc-950 border border-zinc-700 rounded-t-sm z-10 relative flex items-center justify-center shadow-inner">
                    <div className="w-40 h-1 bg-black rounded-full" />
                  </div>

                  {/* Thermal Paper Body (Calibrated scroll container for first viewport fit) */}
                  <div
                    className="max-h-[36vh] sm:max-h-[42vh] md:max-h-[46vh] min-h-[140px] overflow-y-auto bg-[#fafaf8] border-x border-zinc-300 relative select-text"
                    style={{
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
                      scrollbarWidth: "thin",
                      scrollbarColor: "#a1a1aa #f4f4f5"
                    }}
                  >
                    {kioskReceipt.receipt ? (
                      <CompactOrderReceipt receipt={kioskReceipt.receipt} />
                    ) : kioskReceipt.error ? (
                      <div role="alert" className="p-3 text-xs text-rose-600 bg-rose-50 font-sans">
                        {kioskReceipt.error}
                        <button onClick={kioskReceipt.retry} className="ml-2 underline font-bold">Retry</button>
                      </div>
                    ) : (
                      <div role="status" className="p-4 text-xs text-zinc-600 text-center font-mono">
                        <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin mx-auto mb-2" />
                        Generating token slip...
                      </div>
                    )}
                  </div>

                  {/* Realistic Serrated Receipt Paper Bottom Tear Edge */}
                  <div
                    className="h-2 w-full bg-[#fafaf8] relative -mt-[1px] opacity-95"
                    style={{
                      clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)",
                      filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.2))"
                    }}
                  />
                </div>

                {orderError && <p role="alert" className="text-[11px] text-rose-400 mt-1">{orderError}</p>}

                {/* Print Status Feedback & Reprint */}
                <div className="mt-2 text-center shrink-0">
                  {isPrinting ? (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400 animate-pulse font-bold">
                      <Printer className="w-3.5 h-3.5 animate-bounce" />
                      <span>Printing Thermal Slip...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleTriggerPrint()}
                      disabled={!kioskReceipt.receipt || isPrinting}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Printer className="w-3 h-3 text-amber-400" />
                      <span>{hasPrinted ? "Reprint Token Slip" : "Print Token Slip"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Complete & Reset Button (ALWAYS in first viewport, shrink-0) */}
          <div className="pt-2 sm:pt-2.5 pb-1 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-[#09090B]">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Returning to Home screen in <strong className="text-amber-400 font-mono font-bold">{receiptCountdown}s</strong>...
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetToAttract}
              className="px-5 sm:px-7 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all active:scale-95 cursor-pointer shrink-0 animate-pulse hover:animate-none"
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
