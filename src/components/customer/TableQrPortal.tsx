import {OrderRoundsPanel} from '../common/OrderRoundsPanel';
import {backendOrder, PreparationRound, PosItem} from '../../lib/posApi';
import {CompactOrderReceipt} from "../common/CompactOrderReceipt";
import {useOrderReceipt} from "../../lib/orderReceipt";
import {printReceiptDocument} from "../../lib/receiptPrinting";
import {apiClient} from "../../lib/api";
import {cartLines} from "../../lib/customerApi";
import {posOrderToOrder} from "../../lib/posApi";
import {submitSelfService,useSelfServiceOrder,useSelfServiceQuote} from "../../lib/selfService";
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
  Loader2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Product, ProductVariant, SelectedModifier, Order, PaymentMethod } from "../../types";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { ProductConfiguratorModal } from "./ProductConfiguratorModal";
import { QrOrderTrackAndReviewModal } from "./QrOrderTrackAndReviewModal";
import { SkeletonProductGrid } from "../common/Skeleton";
import { useScrollLock, forceUnlockScroll } from "../../lib/scrollLock";

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

const getStoredToken = (token: string, branch?: string | number, table?: string): string => {
  if (typeof window === 'undefined') return '';
  if (token) {
    const s = sessionStorage.getItem(`table-order:${token}`) || localStorage.getItem(`table-order:${token}`);
    if (s) return s;
  }
  if (branch && table) {
    const k = `table-order:${branch}:${table}`;
    const s = sessionStorage.getItem(k) || localStorage.getItem(k);
    if (s) return s;
  }
  return '';
};

const saveStoredToken = (tracking: string, token?: string, branch?: string | number, table?: string) => {
  if (typeof window === 'undefined' || !tracking) return;
  if (token) {
    try { sessionStorage.setItem(`table-order:${token}`, tracking); } catch {}
    try { localStorage.setItem(`table-order:${token}`, tracking); } catch {}
  }
  if (branch && table) {
    const k = `table-order:${branch}:${table}`;
    try { sessionStorage.setItem(k, tracking); } catch {}
    try { localStorage.setItem(k, tracking); } catch {}
  }
};

const clearStoredToken = (token?: string, branch?: string | number, table?: string) => {
  if (typeof window === 'undefined') return;
  if (token) {
    try { sessionStorage.removeItem(`table-order:${token}`); } catch {}
    try { localStorage.removeItem(`table-order:${token}`); } catch {}
  }
  if (branch && table) {
    const k = `table-order:${branch}:${table}`;
    try { sessionStorage.removeItem(k); } catch {}
    try { localStorage.removeItem(k); } catch {}
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
    setCurrentOutlet,
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

  // Guarantee clean scroll unlocking on mount/unmount of table QR portal
  useEffect(() => {
    forceUnlockScroll();
    return () => {
      forceUnlockScroll();
    };
  }, []);

  // Lock background scroll only when an overlay/drawer/modal is actively showing
  useScrollLock(isConfirmDrawerOpen || isTableSwitcherOpen || (!!placedOrderResult && !isTrackReviewOpen) || isTrackReviewOpen);

  const qrToken=new URLSearchParams(window.location.search).get('token') || '';
  const [qrContext,setQrContext]=useState<any>(null);
  const [checkoutError,setCheckoutError]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const submitLock=React.useRef(false);
  const [trackingToken,setTrackingToken]=useState(()=>getStoredToken(qrToken));
  useEffect(()=>{
    if(!qrToken){
      // Standalone table QR preview mode: auto-select first available table if none set
      if(!tableNumber) setTableNumber("T-01");
      return;
    }
    let alive=true;
    apiClient.get<any>(`/tables/qr/resolve/?token=${encodeURIComponent(qrToken)}`,{skipAuth:true}).then(data=>{
      if(!alive)return;
      setQrContext(data);
      setTableNumber(data.table_number);
      setDiningMode('DINE_IN');
      setCurrentOutlet({...currentOutlet,id:String(data.branch_id),name:data.branch_name});
      setCheckoutError('');

      const discoveredToken = data.tracking_token || data.active_order?.tracking_token || data.order?.tracking_token;
      if (discoveredToken) {
        setTrackingToken(discoveredToken);
        saveStoredToken(discoveredToken, qrToken, data.branch_id, data.table_number);
      } else {
        const stored = getStoredToken(qrToken, data.branch_id, data.table_number);
        if (stored) {
          setTrackingToken(stored);
        }
      }
    }).catch(error=>{if(alive)setCheckoutError(error.message || 'Invalid table QR code.');});
    return()=>{alive=false;};
  },[qrToken]);

  // Probe backend for existing ongoing order on table QR rescan if trackingToken is empty
  useEffect(() => {
    if (trackingToken || !qrToken) return;
    let alive = true;
    apiClient.get<any>(`/orders/self-service/order/?token=${encodeURIComponent(qrToken)}`, { skipAuth: true })
      .then(data => {
        if (!alive || !data) return;
        const status = data.status || '';
        if (['COMPLETED', 'CANCELLED'].includes(status)) return;
        const token = data.tracking_token || qrToken;
        setTrackingToken(token);
        saveStoredToken(token, qrToken, data.outlet_id || qrContext?.branch_id || currentOutlet.id, data.table_number || tableNumber || qrContext?.table_number);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [qrToken, trackingToken, qrContext?.branch_id, currentOutlet.id, tableNumber, qrContext?.table_number]);

  const liveOrder=useSelfServiceOrder(String(qrContext?.branch_id || currentOutlet.id),currentOutlet.name,trackingToken);
  const tableReceipt=useOrderReceipt(placedOrderResult,placedOrderResult?trackingToken:'');

  // Determine active running table order (from backend liveOrder OR active order in orders for this table)
  const localActiveOrder = useMemo(() => {
    return findActiveOrderByTableOrPhone(tableNumber || qrContext?.table_number, phoneNumber);
  }, [findActiveOrderByTableOrPhone, tableNumber, qrContext?.table_number, phoneNumber, orders]);

  const activeRunningOrder =
    (liveOrder && !['COMPLETED','CANCELLED'].includes(liveOrder.status) ? liveOrder : null) ||
    (localActiveOrder && !['COMPLETED','CANCELLED'].includes(localActiveOrder.status) ? localActiveOrder : null);

  // Sync token from activeRunningOrder if trackingToken wasn't set
  useEffect(() => {
    if (!trackingToken && activeRunningOrder) {
      const backend = backendOrder(activeRunningOrder);
      const token = backend?.tracking_token || (activeRunningOrder as any).trackingToken || activeRunningOrder.kioskToken;
      if (token) {
        setTrackingToken(token);
        saveStoredToken(token, qrToken, qrContext?.branch_id || currentOutlet.id, tableNumber || qrContext?.table_number);
      }
    }
  }, [activeRunningOrder, trackingToken, qrToken, qrContext?.branch_id, currentOutlet.id, tableNumber, qrContext?.table_number]);

  // Clear token from storage when order is completed or cancelled
  useEffect(() => {
    if (activeRunningOrder && ['COMPLETED', 'CANCELLED'].includes(activeRunningOrder.status)) {
      clearStoredToken(qrToken, qrContext?.branch_id || currentOutlet.id, tableNumber || qrContext?.table_number);
    }
  }, [activeRunningOrder?.status, qrToken, qrContext?.branch_id, currentOutlet.id, tableNumber, qrContext?.table_number]);

  const activeBackend = backendOrder(activeRunningOrder) || (liveOrder ? backendOrder(liveOrder) : undefined);
  const checkoutBody={
    branch_id:Number(qrContext?.branch_id || currentOutlet.id),
    order_source:'TABLE_QR',
    ...(activeRunningOrder && !['COMPLETED','CANCELLED'].includes(activeRunningOrder.status)
      ? {
          tracking_token: trackingToken || activeBackend?.tracking_token || (activeRunningOrder as any).trackingToken || '',
          version: activeBackend?.version,
        }
      : {}),
    fulfillment_type:'DINE_IN',
    qr_token:qrToken,
    customer_name:guestName.trim(),
    customer_phone:phoneNumber.trim(),
    notes:tableNotes,
    items:cartLines(cart.items)
  };
  const serverQuote=useSelfServiceQuote(qrContext?checkoutBody:null);

  const effectiveOrderForRounds = useMemo(() => {
    const backend = backendOrder(activeRunningOrder) || (liveOrder ? backendOrder(liveOrder) : undefined);
    if (backend && !['COMPLETED', 'CANCELLED'].includes(backend.status)) {
      if (!backend.rounds?.length && backend.items?.length) {
        const roundNumbers = Array.from<number>(new Set(backend.items.map(i => i.round_number || 1))).sort((a, b) => a - b);
        const synthRounds: PreparationRound[] = roundNumbers.map((num) => ({
          number: num,
          status: (backend.status === 'READY' ? 'READY' : backend.status === 'PREPARING' ? 'PREPARING' : 'WAITING') as any,
          created_at: backend.created_at || new Date().toISOString(),
        }));
        return { ...backend, rounds: synthRounds };
      }
      return backend;
    }
    if (activeRunningOrder && !['COMPLETED', 'CANCELLED'].includes(activeRunningOrder.status) && activeRunningOrder.items.length) {
      const roundNumbers = Array.from<number>(new Set(activeRunningOrder.items.map(i => i.roundNumber || 1))).sort((a, b) => a - b);
      const synthRounds: PreparationRound[] = roundNumbers.map((num) => ({
        number: num,
        status: (activeRunningOrder.status === 'READY' ? 'READY' : activeRunningOrder.status === 'PROCESSING' ? 'PREPARING' : 'WAITING') as any,
        created_at: activeRunningOrder.createdAt || new Date().toISOString(),
      }));
      const synthItems: PosItem[] = activeRunningOrder.items.map((it, idx) => ({
        id: idx + 1,
        product_id: '',
        product_name: it.productName,
        variant_name: it.variantName || '',
        quantity: it.quantity,
        unit_price: String(it.unitPrice),
        line_total: String(it.lineTotal),
        requires_kitchen: it.requiresKitchen ?? true,
        kitchen_status: it.sentToKitchen ? 'PREPARING' : 'WAITING',
        round_number: it.roundNumber || 1,
        item_notes: '',
        is_voided: false,
        combo_components: [],
        modifiers: [],
        can_remove: false,
      }));
      return {
        status: activeRunningOrder.status === 'PROCESSING' ? 'PREPARING' : activeRunningOrder.status === 'CONFIRMED' ? 'ACCEPTED' : activeRunningOrder.status,
        fulfillment_type: activeRunningOrder.fulfillmentType,
        rounds: synthRounds,
        items: synthItems,
      };
    }
    return null;
  }, [activeRunningOrder, liveOrder]);

  // Available tables list
  const DEFAULT_TABLES = [
    "T-01", "T-02", "T-03", "T-04", "T-05", "T-06", "T-07", "T-08",
    "T-09", "T-10", "T-11", "T-12"
  ];
  const AVAILABLE_TABLES: string[] = qrContext
    ? [qrContext.table_number]
    : (orders.map(o => o.tableNumber).filter(Boolean) as string[]).length > 0
    ? Array.from(new Set([...(orders.map(o => o.tableNumber).filter(Boolean) as string[]), ...DEFAULT_TABLES]))
    : DEFAULT_TABLES;

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

  const handleConfirmOrder = async () => {
    if (submitLock.current || submitting) return;

    // Proper Validation checks
    if (!cart.items.length) {
      setCheckoutError("Your tray is empty. Please add items to place an order.");
      return;
    }

    if (diningMode === "DINE_IN" && !tableNumber && !qrContext?.table_number) {
      setCheckoutError("Please select your table number before submitting.");
      setIsTableSwitcherOpen(true);
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    setCheckoutError('');

    try {
      if(!qrContext)throw new Error('Scan a valid table QR code to order.');
      let quote = serverQuote.quote;
      if (!quote) {
        try {
          quote = await apiClient.post<any>('/orders/self-service/quote/', checkoutBody, { skipAuth: true });
        } catch (qErr: any) {
          throw new Error(qErr.message || 'Please wait for the current price quote.');
        }
      }
      if(activeRunningOrder && backendOrder(activeRunningOrder) && !backendOrder(activeRunningOrder)?.can_append) {
        throw new Error('This order cannot accept more items. Ask staff to start a new order.');
      }
      const result=await submitSelfService({...checkoutBody,expected_total:quote.total_payable});
      saveStoredToken(result.tracking_token, qrToken, qrContext?.branch_id || currentOutlet.id, tableNumber || qrContext?.table_number);
      setTrackingToken(result.tracking_token);
      setPlacedOrderResult(posOrderToOrder(result,currentOutlet.name));
      window.dispatchEvent(new Event('self-service:refresh'));
      clearCart();setIsConfirmDrawerOpen(false);playMobileSound('success');
    } catch (error: any) {
      setCheckoutError(error.message || 'Unable to confirm order. Please try again.');
      serverQuote.refresh();
    } finally {
      submitLock.current = false;
      setSubmitting(false);
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
    <div className="min-h-screen w-full max-w-full bg-[#09090C] text-zinc-100 flex flex-col font-sans pb-28 antialiased">
      {(checkoutError || serverQuote.error) && <p role="alert" className="p-3 text-xs text-rose-400 break-words">{checkoutError || serverQuote.error}</p>}
      {/* -------------------------------------------------------------
          TOP BAR: BRAND, TABLE CHIP, DINING MODE, AND EXIT
      ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#0E0E12]/95 backdrop-blur-md border-b border-zinc-800/80 px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-sm w-full max-w-full">
        <div className="max-w-md mx-auto flex items-center justify-between gap-1.5 sm:gap-2 w-full min-w-0">
          {/* Brand Logo only (compact on mobile to preserve row space) */}
          <div className="flex items-center shrink-0">
            <CrunchyLogo size="sm" className="h-6 sm:h-7 w-auto" />
          </div>

          {/* Table Badge & Dining Mode Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink min-w-0 justify-end">
            <button
              onClick={() => {if(!qrContext)setIsTableSwitcherOpen(true);}}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-amber-400 text-[11px] font-bold transition-colors cursor-pointer shrink-0 max-w-[105px] sm:max-w-none"
              title="Change Table"
            >
              <Utensils className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{tableNumber || "Select Table"}</span>
            </button>

            {/* Quick Dining Toggle */}
            <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 text-[9.5px] font-bold shrink-0">
              <button
                onClick={() => {
                  setDiningMode("DINE_IN");
                  playMobileSound("tap");
                }}
                className={`px-1.5 sm:px-2 py-0.5 transition-all ${
                  diningMode === "DINE_IN"
                    ? "bg-amber-500 text-black font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Dine-In
              </button>
              <button
                onClick={() => {
                  if(!qrContext)setDiningMode("TAKEAWAY");
                  playMobileSound("tap");
                }}
                className={`px-1.5 sm:px-2 py-0.5 transition-all ${
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
                className="p-1 sm:p-1.5 text-zinc-400 hover:text-white bg-zinc-800/80 border border-zinc-700/60 transition-colors ml-0.5 shrink-0"
                title="Exit"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
      {effectiveOrderForRounds && (
        <div className="max-w-md w-full mx-auto px-3 py-2">
          <OrderRoundsPanel
            order={effectiveOrderForRounds}
            busy={submitting}
            onRemove={async (itemId, quantity) => {
              if (submitLock.current) return;
              const order = backendOrder(activeRunningOrder) || (liveOrder ? backendOrder(liveOrder) : undefined);
              if (!order) return;
              submitLock.current = true;
              setSubmitting(true);
              setCheckoutError('');
              try {
                await apiClient.post('/orders/self-service/items/void/', {
                  tracking_token: trackingToken || (order as any).tracking_token,
                  qr_token: qrToken,
                  version: order.version,
                  item_id: itemId,
                  quantity,
                }, {
                  skipAuth: true,
                  headers: { 'Idempotency-Key': `qr-void:${order.id}:${order.version}:${itemId}:${quantity}` },
                });
              } catch (error: any) {
                setCheckoutError(error.message || 'Unable to remove item.');
              } finally {
                window.dispatchEvent(new Event('self-service:refresh'));
                submitLock.current = false;
                setSubmitting(false);
              }
            }}
          />
        </div>
      )}


      {/* -------------------------------------------------------------
          BEZEL-LESS SLIM CONTACT & SEARCH BAR (NOT COMPULSORY, OPTIONAL)
      ------------------------------------------------------------- */}
      <section className="bg-[#0D0D11] border-b border-zinc-800/60 px-2.5 sm:px-3.5 py-2 sm:py-2.5 w-full max-w-full">
        <div className="max-w-md mx-auto space-y-2 w-full min-w-0">
          {/* Optional Contact Number & Customer Name */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 w-full">
            <div className="min-w-0 flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-[#141418] border border-zinc-800/80 focus-within:border-amber-500/80 transition-colors overflow-hidden">
              <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone (Optional)"
                className="w-full min-w-0 bg-transparent text-base sm:text-xs text-white placeholder:text-zinc-500 focus:outline-none font-mono"
              />
            </div>

            <div className="min-w-0 flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-[#141418] border border-zinc-800/80 focus-within:border-amber-500/80 transition-colors overflow-hidden">
              <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Name (Optional)"
                className="w-full min-w-0 bg-transparent text-base sm:text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="relative flex items-center bg-[#141418] border border-zinc-800/80 px-2 sm:px-2.5 py-1.5 focus-within:border-amber-500/80 transition-colors w-full overflow-hidden">
            <Search className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search burgers, tenders, drinks..."
              className="w-full min-w-0 bg-transparent text-base sm:text-xs text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-zinc-500 hover:text-white text-xs shrink-0 pl-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ACTIVE RUNNING TAB ALERT (Shown when active ongoing order tab exists) */}
          {activeRunningOrder && (
            <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-[#141418] border border-amber-500/50 p-2.5 text-xs text-zinc-300 w-full shadow-md">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 font-bold text-white text-[11px] truncate">
                      <Receipt className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Active Tab #{activeRunningOrder.orderNumber}</span>
                      <span className="text-amber-400 font-mono text-[11px] font-bold">
                        (Rs. {activeRunningOrder.totalAmount})
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {activeRunningOrder.tableNumber ? `Table ${activeRunningOrder.tableNumber} · ` : ""}
                      Round {activeRunningOrder.roundsCount || 1} · {activeRunningOrder.status === 'PROCESSING' ? 'Cooking in Kitchen' : activeRunningOrder.status === 'READY' ? 'Ready for Pickup' : 'Order Placed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTrackReviewOpen(true);
                      playMobileSound("tap");
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
                  >
                    Track Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowActiveTabDetails(!showActiveTabDetails)}
                    className="text-[10px] text-zinc-400 hover:text-white underline font-medium cursor-pointer"
                  >
                    {showActiveTabDetails ? "Hide" : "View Items"}
                  </button>
                </div>
              </div>

              {showActiveTabDetails && (
                <div className="mt-2 pt-2 border-t border-zinc-800 space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Items in active tab:</p>
                  {activeRunningOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[10.5px] text-zinc-400 bg-black/40 px-2 py-0.5"
                    >
                      <span className="truncate pr-1">
                        {item.quantity}x {item.productName} ({item.variantName || 'Standard'}){item.roundNumber ? ` [R${item.roundNumber}]` : ''}
                      </span>
                      <span className="font-mono text-zinc-200 shrink-0">Rs. {item.lineTotal}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------------------
          CATEGORY FILTER TRACK (HORIZONTAL SCROLL WITH OVERSCROLL CONTAINMENT)
      ------------------------------------------------------------- */}
      <div className="sticky top-[45px] sm:top-[49px] z-30 bg-[#09090C]/95 backdrop-blur-md border-b border-zinc-800/80 py-2 px-2.5 sm:px-3.5 w-full max-w-full">
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

          {categories.filter(c => !c.isArchived).map((cat) => (
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
      <main className="max-w-md mx-auto px-2.5 sm:px-3.5 py-3 w-full flex-1 space-y-2 sm:space-y-2.5">
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
              className="bg-[#121217] border border-zinc-800/80 hover:border-zinc-700 transition-colors p-2 sm:p-2.5 flex items-center gap-2.5 sm:gap-3 shadow-sm w-full max-w-full overflow-hidden"
            >
              {/* Product Thumbnail */}
              <div
                onClick={() => setCustomizingProduct(product)}
                className="relative w-18 h-18 sm:w-20 sm:h-20 bg-zinc-900 overflow-hidden shrink-0 cursor-pointer"
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
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

                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className="text-xs font-black text-amber-400 font-mono shrink-0">
                    Rs. {product.basePrice}
                  </span>

                  {/* Add / Qty Controls */}
                  {qtyInCart > 0 ? (
                    <div className="flex items-center bg-zinc-900 border border-amber-500/50 shrink-0">
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
                        className="p-1 text-amber-400 hover:bg-zinc-800 transition-colors active:bg-zinc-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-white">
                        {qtyInCart}
                      </span>
                      <button
                        onClick={() => handleQuickAdd(product)}
                        className="p-1 text-amber-400 hover:bg-zinc-800 transition-colors active:bg-zinc-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleQuickAdd(product)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black uppercase tracking-wider transition-colors active:bg-amber-600 shadow cursor-pointer shrink-0"
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
      {cart.items.length > 0 ? (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0F0F14]/98 backdrop-blur-lg border-t border-zinc-800 px-3 py-2.5 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl w-full max-w-full overflow-hidden">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                <span className="font-bold text-white truncate">
                  {cart.items.reduce((s, i) => s + i.quantity, 0)} items in tray
                </span>
                <span>•</span>
                <span className="text-amber-400 font-mono font-black text-sm shrink-0">
                  Rs. {serverQuote.quote?.total_payable ?? cart.finalTotal}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 truncate mt-0.5">
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
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-500/20 transition-colors cursor-pointer shrink-0"
            >
              <span className="truncate">
                {activeRunningOrder
                  ? `Add to Tab (R${(activeRunningOrder.roundsCount || 1) + 1})`
                  : "Review & Order"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          </div>
        </div>
      ) : activeRunningOrder ? (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0F0F14]/98 backdrop-blur-lg border-t border-amber-500/30 px-3 py-2.5 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl w-full max-w-full overflow-hidden">
          <div className="max-w-md mx-auto flex items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-300 truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-bold text-white truncate">
                  Ongoing Tab #{activeRunningOrder.orderNumber}
                </span>
                <span>•</span>
                <span className="text-amber-400 font-mono font-bold text-xs shrink-0">
                  Rs. {activeRunningOrder.totalAmount}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                {activeRunningOrder.status === 'PROCESSING' || activeRunningOrder.status === 'CONFIRMED'
                  ? `In Kitchen · Round ${activeRunningOrder.roundsCount || 1}`
                  : activeRunningOrder.status === 'READY'
                    ? `Ready for Table · Round ${activeRunningOrder.roundsCount || 1}`
                    : `Active Tab · Round ${activeRunningOrder.roundsCount || 1}`}
                {" · Select items to add more"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playMobileSound("tap");
                setIsTrackReviewOpen(true);
              }}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Track Tab</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      ) : null}

      {/* -------------------------------------------------------------
          SUCCESS & KIOSK PRINT TOKEN MODAL
      ------------------------------------------------------------- */}
      {placedOrderResult && !isTrackReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#121217] border border-amber-500/60 max-w-sm w-full max-h-[90vh] p-3 text-center space-y-3 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto my-auto">
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

            {tableReceipt.receipt ? <CompactOrderReceipt receipt={tableReceipt.receipt}/> : <p role={tableReceipt.error?'alert':'status'} className="text-xs text-zinc-400">{tableReceipt.error || 'Loading saved receipt...'}{tableReceipt.error && <button onClick={tableReceipt.retry} className="ml-2 underline">Retry</button>}</p>}
            <button type="button" disabled={!tableReceipt.receipt} onClick={()=>void printReceiptDocument(tableReceipt.receipt!).catch(error=>setCheckoutError(error.message))} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 disabled:opacity-40">Print Slip</button>
            {checkoutError && <p role="alert" className="text-xs text-rose-400">{checkoutError}</p>}

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setIsTrackReviewOpen(true);
                  playMobileSound("tap");
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>Track Live Order & Review (QR Slip)</span>
              </button>

              <button
                onClick={() => {
                  setPlacedOrderResult(null);
                  playMobileSound("tap");
                }}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Order More Items (Add to Table)
              </button>

              <button
                onClick={() => {
                  setPlacedOrderResult(null);
                  if (onClose) onClose();
                }}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-400 font-bold text-xs uppercase tracking-wider transition-colors border border-zinc-800 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div className="bg-[#121217] border-t sm:border border-zinc-800 max-w-md w-full p-3.5 sm:p-5 text-left space-y-3 sm:space-y-3.5 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2 min-w-0">
                <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-black text-white uppercase truncate">
                  {activeRunningOrder
                    ? `Add Round ${(activeRunningOrder.roundsCount || 1) + 1} to Table Tab`
                    : "Confirm Table Order"}
                </h3>
              </div>
              <button
                onClick={() => setIsConfirmDrawerOpen(false)}
                className="p-1 text-zinc-400 hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items Summary in Tray */}
            <div className="space-y-1.5 sm:space-y-2 bg-black/40 p-2.5 border border-zinc-800/80 overflow-hidden">
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
                  Rs. {serverQuote.quote?.total_payable ?? cart.finalTotal}
                </span>
              </div>
            </div>

            {/* Table & Guest Details */}
            <div className="space-y-2.5 overflow-hidden">
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0">
                  <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1 truncate">
                    Table / Spot
                  </label>
                  <div className="bg-zinc-900 border border-zinc-700 px-2.5 py-2 text-xs sm:text-sm text-white font-mono font-bold flex items-center justify-between min-w-0">
                    <span className="truncate pr-1">{diningMode === "DINE_IN" ? (tableNumber || "Select Table") : "Takeaway"}</span>
                    <button
                      type="button"
                      onClick={() => {if(!qrContext)setIsTableSwitcherOpen(true);}}
                      className="text-[11px] text-amber-400 underline shrink-0 cursor-pointer font-bold"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="min-w-0">
                  <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1 truncate">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name"
                    className="w-full min-w-0 bg-zinc-900 border border-zinc-700 px-2.5 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1">
                  Contact Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 px-2.5 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Payment Method */}
              <div className="min-w-0">
                <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1">
                  Payment Preference
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("PAY_AT_COUNTER")}
                    className={`p-2 border text-center transition-colors break-words leading-tight cursor-pointer ${
                      selectedPaymentMethod === "PAY_AT_COUNTER"
                        ? "bg-amber-500 text-black border-amber-500 font-black"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    Pay Later
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("FONEPAY_QR")}
                    className={`p-2 border text-center transition-colors break-words leading-tight cursor-pointer ${
                      selectedPaymentMethod === "FONEPAY_QR"
                        ? "bg-amber-500 text-black border-amber-500 font-black"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    Fonepay / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("CASH_ON_PICKUP")}
                    className={`p-2 border text-center transition-colors break-words leading-tight cursor-pointer ${
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
              <div className="min-w-0">
                <label className="text-[10px] text-zinc-400 block uppercase font-bold mb-1">
                  Kitchen Notes / Requests
                </label>
                <input
                  type="text"
                  value={tableNotes}
                  onChange={(e) => setTableNotes(e.target.value)}
                  placeholder="Special notes for the kitchen"
                  className="w-full min-w-0 bg-zinc-900 border border-zinc-700 px-2.5 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Validation Notice or Server Quote Error */}
            {checkoutError && (
              <div role="alert" className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="flex-1 break-words">{checkoutError}</span>
              </div>
            )}

            {serverQuote.error && !checkoutError && (
              <div role="alert" className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-medium flex items-center justify-between gap-2">
                <span className="flex-1 break-words">{serverQuote.error}</span>
                <button
                  type="button"
                  onClick={() => serverQuote.refresh()}
                  className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold text-[10px] uppercase underline shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {serverQuote.quote && (
              <p className="text-xs text-zinc-300">
                This round: Rs. {serverQuote.quote.total_payable} • Payment due at counter
              </p>
            )}

            {/* Confirm Submit Button with Active Spinner & Dynamic Text */}
            <div className="pt-2">
              <button
                type="button"
                id="table-qr-checkout-btn"
                onClick={() => void handleConfirmOrder()}
                disabled={submitting}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-60 text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Sending Order to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeRunningOrder
                        ? `Send Round ${(activeRunningOrder.roundsCount || 1) + 1} to Kitchen`
                        : "Send Order to Kitchen"}
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TABLE SWITCHER MODAL
      ------------------------------------------------------------- */}
      {isTableSwitcherOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#121217] border border-zinc-800 max-w-sm w-full p-4 space-y-3 overflow-hidden my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2 min-w-0">
                <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                <h3 className="text-xs font-black text-white uppercase truncate">
                  Select Table or Dining Mode
                </h3>
              </div>
              <button
                onClick={() => setIsTableSwitcherOpen(false)}
                className="p-1 text-zinc-400 hover:text-white shrink-0"
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
                  if(!qrContext)setDiningMode("TAKEAWAY");
                  setIsTableSwitcherOpen(false);
                  playMobileSound("tap");
                }}
                className={`w-full py-2 text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  diningMode === "TAKEAWAY"
                    ? "bg-sky-500 text-black border-sky-500 font-black"
                    : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
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
        onClose={() => {
          setIsTrackReviewOpen(false);
          setPlacedOrderResult(null);
        }}
        initialOrder={placedOrderResult || activeRunningOrder}
      />
    </div>
  );
};
