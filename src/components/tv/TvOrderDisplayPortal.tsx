import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Bell,
  CheckCircle2,
  Clock,
  Utensils,
  ShoppingBag,
  Megaphone,
  Radio,
  Flame,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Order, OrderStatus } from "../../types";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { Skeleton } from "../common/Skeleton";

interface CallingAnnouncement {
  id: string;
  orderNumber: string;
  token: string;
  customerName: string;
  fulfillmentType: string;
  tableNumber?: string;
  timestamp: number;
}

interface TvOrderDisplayPortalProps {
  onClose?: () => void;
}

export const TvOrderDisplayPortal: React.FC<TvOrderDisplayPortalProps> = ({ onClose }) => {
  const {
    orders,
    products,
    currentOutlet,
    updateOrderStatus,
    setActivePortal,
    isLoadingSkeleton,
    lastKitchenCall,
  } = useApp();

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sound & Speech settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Real-time clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Active Calling Announcement Spotlight (The animated focus small rectangle UI)
  const [activeCall, setActiveCall] = useState<CallingAnnouncement | null>(null);
  const [callProgress, setCallProgress] = useState(100);

  // Sliding Menu Carousel index
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Auto-pagination / scroll page for preparing orders when there are many (10-20+)
  const [prepPage, setPrepPage] = useState(0);
  const ORDERS_PER_PREP_PAGE = 12;

  // Track previously known order status map to detect automatic transitions to READY
  const knownOrderStatusesRef = useRef<Map<string, OrderStatus>>(new Map());
  const initialMountRef = useRef(true);

  // Clock tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter available products for sliding menu ad showcase
  const showcaseProducts = useMemo(() => {
    return products.filter((p) => p.isAvailable && p.images && p.images.length > 0);
  }, [products]);

  // Sliding menu ad carousel timer (auto-slides every 5.5 seconds)
  useEffect(() => {
    if (showcaseProducts.length <= 1) return;

    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % showcaseProducts.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [showcaseProducts.length]);

  // Web Audio API Airport Chime Synthesizer (Authentic 3-tone Airport chime: F4 -> A4 -> C5)
  const playAirportChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      const now = ctx.currentTime;

      const notes = [
        { freq: 349.23, time: now },
        { freq: 440.0, time: now + 0.22 },
        { freq: 523.25, time: now + 0.44 },
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, note.time);

        gain.gain.setValueAtTime(0.001, note.time);
        gain.gain.exponentialRampToValueAtTime(0.18, note.time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, note.time + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(note.time);
        osc.stop(note.time + 0.7);
      });
    } catch {
      // Audio playback restrictions fallback
    }
  };

  // Text-To-Speech announcement using Web Speech Synthesis API
  const speakAnnouncement = (announcement: CallingAnnouncement) => {
    if (!soundEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const isDineIn = announcement.fulfillmentType === "DINE_IN" || !!announcement.tableNumber;
      let text = "";

      if (isDineIn && announcement.tableNumber) {
        text = `Attention please. Order Token ${announcement.token}, for ${announcement.tableNumber}, your order is ready for collection at the counter.`;
      } else {
        text = `Attention please. Takeaway Order Token ${announcement.token}, your order is ready for pickup at Counter A.`;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            (v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")) &&
            v.name.toLowerCase().includes("natural")
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 700);
    } catch {
      // Speech synthesis error catch
    }
  };

  // Trigger calling an order (Chime + Speech + Small Focus Rectangle UI)
  const triggerOrderCall = (order: Order) => {
    playAirportChime();

    const announcement: CallingAnnouncement = {
      id: order.id,
      orderNumber: order.orderNumber,
      token: order.kioskToken || order.orderNumber.replace("CR-", "TK-"),
      customerName: order.customerName,
      fulfillmentType: order.fulfillmentType,
      tableNumber: order.tableNumber,
      timestamp: Date.now(),
    };

    setActiveCall(announcement);
    setCallProgress(100);

    speakAnnouncement(announcement);
  };

  // Auto-dismiss the calling spotlight rectangle over 8 seconds with smooth progress bar
  useEffect(() => {
    if (!activeCall) return;

    const startTime = Date.now();
    const duration = 8000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setCallProgress(remaining);

      if (elapsed >= duration) {
        setActiveCall(null);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeCall]);

  // Monitor backend orders for automated status transitions to READY
  useEffect(() => {
    if (initialMountRef.current) {
      orders.forEach((o) => {
        knownOrderStatusesRef.current.set(o.id, o.status);
      });
      initialMountRef.current = false;
      return;
    }

    orders.forEach((o) => {
      const prevStatus = knownOrderStatusesRef.current.get(o.id);
      if (prevStatus && prevStatus !== "READY" && o.status === "READY") {
        triggerOrderCall(o);
      }
      knownOrderStatusesRef.current.set(o.id, o.status);
    });
  }, [orders]);

  // Trigger announcement whenever kitchen call bell or manual recall is rung
  useEffect(() => {
    if (!lastKitchenCall) return;
    const matchOrder = orders.find(
      (o) => o.orderNumber === lastKitchenCall.orderNumber || o.kioskToken === lastKitchenCall.token
    );
    if (matchOrder) {
      triggerOrderCall(matchOrder);
    } else {
      const manualAnnouncement: CallingAnnouncement = {
        id: `call-${lastKitchenCall.timestamp}`,
        orderNumber: lastKitchenCall.orderNumber,
        token: lastKitchenCall.token,
        customerName: lastKitchenCall.customerName,
        fulfillmentType: lastKitchenCall.fulfillmentType,
        tableNumber: lastKitchenCall.tableNumber,
        timestamp: lastKitchenCall.timestamp,
      };
      setActiveCall(manualAnnouncement);
      setCallProgress(100);
      playAirportChime();
      speakAnnouncement(manualAnnouncement);
    }
  }, [lastKitchenCall]);

  // Orders in PREPARATION
  const preparingOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "CONFIRMED" || o.status === "PROCESSING")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [orders]);

  // Orders READY FOR PICKUP
  const readyOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "READY")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  // Orders COMPLETED / RECENTLY SERVED
  const completedOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "COMPLETED")
      .slice(0, 10);
  }, [orders]);

  // Auto-page preparing orders if there are more than ORDERS_PER_PREP_PAGE (so 10-20+ orders rotate smoothly without manual scrolling)
  const totalPrepPages = Math.ceil(preparingOrders.length / ORDERS_PER_PREP_PAGE) || 1;

  useEffect(() => {
    if (totalPrepPages <= 1) {
      setPrepPage(0);
      return;
    }

    const pageTimer = setInterval(() => {
      setPrepPage((prev) => (prev + 1) % totalPrepPages);
    }, 6000); // Rotate every 6 seconds

    return () => clearInterval(pageTimer);
  }, [totalPrepPages]);

  const visiblePrepOrders = useMemo(() => {
    if (preparingOrders.length <= ORDERS_PER_PREP_PAGE) return preparingOrders;
    const start = prepPage * ORDERS_PER_PREP_PAGE;
    return preparingOrders.slice(start, start + ORDERS_PER_PREP_PAGE);
  }, [preparingOrders, prepPage]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Helper to format elapsed kitchen timer
  const getElapsedString = (createdAt: string) => {
    const elapsedMs = Math.max(0, currentTime.getTime() - new Date(createdAt).getTime());
    const totalSecs = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Test simulation: add random order to test multi-order display
  const handleAddSampleOrder = () => {
    const randomToken = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomNum = `CR-${Math.floor(8000 + Math.random() * 1000)}`;
    const isTable = Math.random() > 0.4;
    const tableNum = isTable ? `Table 0${Math.floor(1 + Math.random() * 8)}` : undefined;

    const dummyOrder: Order = {
      id: `ord-sim-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber: randomNum,
      outletId: currentOutlet.id,
      outletName: currentOutlet.name,
      customerName: isTable ? "Table Guest" : "Takeaway Guest",
      customerPhone: "+977 9800-000000",
      fulfillmentType: isTable ? "DINE_IN" : "TAKEAWAY",
      tableNumber: tableNum,
      kioskToken: randomToken,
      status: "PROCESSING",
      items: [
        {
          id: `item-${Date.now()}-1`,
          productName: "The Golden Crunchy Beast",
          variantName: "Single Patty",
          modifiersSummary: ["Garlic Aioli"],
          unitPrice: 580,
          quantity: 1,
          lineTotal: 580,
        },
      ],
      subtotal: 580,
      vatIncludedAmount: 66.7,
      totalAmount: 580,
      createdAt: new Date().toISOString(),
      estimatedPickupTime: "In 8 mins",
      elapsedSeconds: 0,
      paymentMethod: "CASH_ON_PICKUP",
    };

    updateOrderStatus(dummyOrder.id, "PROCESSING");
  };

  // Test simulation: bump next preparing order to ready
  const handleBumpNextReady = () => {
    if (preparingOrders.length > 0) {
      const nextOrder = preparingOrders[0];
      updateOrderStatus(nextOrder.id, "READY");
      triggerOrderCall({ ...nextOrder, status: "READY" });
    } else {
      // Create and make ready
      const randomToken = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
      const dummyReadyOrder: Order = {
        id: `ord-ready-${Date.now()}`,
        orderNumber: `CR-${Math.floor(8000 + Math.random() * 1000)}`,
        outletId: currentOutlet.id,
        outletName: currentOutlet.name,
        customerName: "Dine-In Guest",
        customerPhone: "+977 9800-000000",
        fulfillmentType: "DINE_IN",
        tableNumber: `Table 0${Math.floor(1 + Math.random() * 8)}`,
        kioskToken: randomToken,
        status: "READY",
        items: [
          {
            id: `item-${Date.now()}`,
            productName: "Crunchy Feast Box",
            variantName: "Standard",
            modifiersSummary: [],
            unitPrice: 650,
            quantity: 1,
            lineTotal: 650,
          },
        ],
        subtotal: 650,
        vatIncludedAmount: 74,
        totalAmount: 650,
        createdAt: new Date().toISOString(),
        estimatedPickupTime: "Ready Now",
        elapsedSeconds: 0,
        paymentMethod: "CASH_ON_PICKUP",
      };
      updateOrderStatus(dummyReadyOrder.id, "READY");
      triggerOrderCall(dummyReadyOrder);
    }
  };

  const hasLiveOrders = preparingOrders.length > 0 || readyOrders.length > 0;
  const currentSlideProduct = showcaseProducts[activeSlideIndex] || showcaseProducts[0];

  return (
    <div className="h-screen w-screen bg-[#050608] text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
      {/* -------------------------------------------------------------
          TOP BAR: Airport Display Header + Subtle Small Speaker & Controls
      ------------------------------------------------------------- */}
      <header className="bg-[#0B0C10] border-b border-zinc-800/90 px-4 sm:px-6 py-2.5 shrink-0 shadow-lg flex items-center justify-between gap-3">
        {/* Left: Clean Brand Logo */}
        <div className="flex items-center gap-3">
          <CrunchyLogo size="md" className="h-8 sm:h-9 w-auto" />
        </div>

        {/* Right: Small Speaker Test Button + Quick Simulators + Fullscreen + Exit */}
        <div className="flex items-center gap-2">
          {/* Subtle Speaker Test Button (User requested: "just to test give somewhere small speaker button for now") */}
          <button
            id="tv-speaker-test-btn"
            onClick={() => {
              const testOrder: Order = {
                id: "test-call",
                orderNumber: "CR-7721",
                outletId: currentOutlet.id,
                outletName: currentOutlet.name,
                customerName: "Table Guest",
                customerPhone: "+977 9800-000000",
                fulfillmentType: "DINE_IN",
                tableNumber: "Table 04",
                kioskToken: "TK-7721",
                status: "READY",
                items: [],
                subtotal: 0,
                vatIncludedAmount: 0,
                totalAmount: 0,
                createdAt: new Date().toISOString(),
                estimatedPickupTime: "Ready Now",
                elapsedSeconds: 0,
                paymentMethod: "CASH_ON_PICKUP",
              };
              triggerOrderCall(testOrder);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-700/80 text-xs font-bold transition-colors cursor-pointer"
            title="Small Speaker Test: Plays airport chime & announces token"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">SPEAKER TEST</span>
          </button>

          {/* Quick Demo Simulators */}
          <button
            id="tv-sim-add-btn"
            onClick={handleAddSampleOrder}
            className="hidden lg:flex items-center gap-1 px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-bold transition-colors cursor-pointer"
            title="Simulate incoming order"
          >
            <Plus className="w-3 h-3 text-amber-500" />
            <span>+ Order</span>
          </button>
          <button
            id="tv-sim-ready-btn"
            onClick={handleBumpNextReady}
            className="hidden lg:flex items-center gap-1 px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 text-[11px] font-bold transition-colors cursor-pointer"
            title="Simulate bumping next order to Ready"
          >
            <Bell className="w-3 h-3 text-emerald-400" />
            <span>Ready Next</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 border transition-colors cursor-pointer ${
              soundEnabled
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500"
            }`}
            title={soundEnabled ? "Audio Active" : "Audio Muted"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen toggle */}
          <button
            id="tv-fullscreen-toggle"
            onClick={toggleFullscreen}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:text-white transition-colors cursor-pointer"
            title="Toggle TV Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit */}
          {onClose ? (
            <button
              onClick={onClose}
              className="p-1.5 bg-zinc-900 hover:bg-rose-600/30 text-zinc-400 hover:text-rose-300 border border-zinc-800 transition-colors cursor-pointer"
              title="Exit TV Display"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setActivePortal("customer")}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              title="Return to Customer Portal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN WIDESCREEN WORKSPACE
          Split between:
          Left Zone: Live Order Token Radar (Preparing & Ready Columns) - 8 cols (67% width)
          Right Zone: Animated Sliding Menu / Ad Showcase - 4 cols (33% width)
      ------------------------------------------------------------- */}
      <main className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-0 overflow-hidden">
        {/* =========================================================
            ZONE A: LIVE ORDER TOKEN BOARD (Col Span 8 on XL)
            Focus on showing all ongoing order tokens clearly with ample width!
            Zero scrolling required: auto-pages/auto-flows when 10-20+ orders
        ========================================================= */}
        <div className="xl:col-span-8 2xl:col-span-8 flex flex-col border-r border-zinc-800/80 bg-[#07080B] overflow-hidden">
          {/* Tokens Header Status Strip */}
          <div className="grid grid-cols-2 border-b border-zinc-800 shrink-0 bg-[#0E1015]">
            {/* Preparing Header */}
            <div className="p-3 border-r border-zinc-800 flex items-center justify-between bg-amber-950/10">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                <span className="text-sm font-black tracking-widest text-amber-400 uppercase">
                  PREPARING
                </span>
              </div>
              <div className="flex items-center gap-2">
                {totalPrepPages > 1 && (
                  <span className="text-[10px] font-mono text-zinc-400 bg-black/60 px-1.5 py-0.5 border border-zinc-800">
                    P{prepPage + 1}/{totalPrepPages}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-black">
                  {preparingOrders.length}
                </span>
              </div>
            </div>

            {/* Ready for Pickup Header */}
            <div className="p-3 flex items-center justify-between bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-black tracking-widest text-emerald-400 uppercase">
                  READY TO COLLECT
                </span>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500 text-black text-xs font-mono font-black">
                {readyOrders.length}
              </span>
            </div>
          </div>

          {/* Tokens Grid Area: High-Density, Ultra-Clear Typography */}
          <div className="flex-1 min-h-0 grid grid-cols-2 gap-0 overflow-hidden divide-x divide-zinc-800">
            {/* LEFT: PREPARING TOKENS LIST (Clean Cards, Auto-paged if > 12) */}
            <div className="p-3 sm:p-4 overflow-hidden flex flex-col justify-start">
              {isLoadingSkeleton ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full content-start">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-[#0C0E14] border border-zinc-800/90 p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-20 bg-zinc-800" />
                        <Skeleton className="h-5 w-14 bg-zinc-800" />
                      </div>
                      <Skeleton className="h-4 w-28 bg-zinc-800 mt-1" />
                    </div>
                  ))}
                </div>
              ) : preparingOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-600">
                  <Clock className="w-10 h-10 text-zinc-700 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Kitchen Up to Date
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    No orders currently in prep.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full content-start">
                  {visiblePrepOrders.map((order) => {
                    const isTable = order.fulfillmentType === "DINE_IN" || !!order.tableNumber;
                    const tokenStr = order.kioskToken || order.orderNumber.replace("CR-", "TK-");

                    return (
                      <div
                        key={order.id}
                        className="bg-[#0C0E14] border border-zinc-800/90 hover:border-amber-500/50 p-2.5 sm:p-3 flex flex-col justify-between gap-2 shadow-sm transition-all"
                      >
                        {/* Top: Bold Token Number & Table/Takeaway Badge (Never Cut Off) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xl sm:text-2xl font-mono font-black text-amber-400 tracking-wider whitespace-nowrap">
                            {tokenStr}
                          </div>
                          {isTable ? (
                            <span className="inline-block px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-black uppercase whitespace-nowrap shrink-0">
                              {order.tableNumber || "Table"}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-sky-500/20 border border-sky-500/50 text-sky-300 text-xs font-mono font-black uppercase whitespace-nowrap shrink-0">
                              Takeaway
                            </span>
                          )}
                        </div>

                        {/* Bottom: Large Prominent Timer Badge */}
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 w-fit shrink-0">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-mono text-xs sm:text-sm font-black tracking-wider whitespace-nowrap">
                              {getElapsedString(order.createdAt)}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                            PREPARING
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: READY FOR PICKUP TOKENS (Massive, Pulsing Emerald Cards) */}
            <div className="p-3 sm:p-4 overflow-hidden flex flex-col justify-start bg-emerald-950/5">
              {isLoadingSkeleton ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full content-start">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-[#0A1811] border-2 border-emerald-900/50 p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-20 bg-emerald-950/60" />
                        <Skeleton className="h-5 w-14 bg-emerald-950/60" />
                      </div>
                      <Skeleton className="h-4 w-28 bg-emerald-950/60 mt-1" />
                    </div>
                  ))}
                </div>
              ) : readyOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-600">
                  <Bell className="w-10 h-10 text-zinc-700 mb-2 stroke-[1.5]" />
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    No Orders Waiting
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Orders ready for pickup will appear here with big glowing tokens.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full content-start">
                  {readyOrders.map((order) => {
                    const isTable = order.fulfillmentType === "DINE_IN" || !!order.tableNumber;
                    const tokenStr = order.kioskToken || order.orderNumber.replace("CR-", "TK-");
                    const isCalling = activeCall?.id === order.id;

                    return (
                      <div
                        key={order.id}
                        className={`relative p-2.5 sm:p-3 border-2 shadow-lg transition-all min-w-0 overflow-hidden flex flex-col justify-between gap-1.5 ${
                          isCalling
                            ? "bg-[#0E261A] border-emerald-400 ring-2 ring-emerald-500/50 scale-[1.01]"
                            : "bg-[#0A1811] border-emerald-500/70 hover:border-emerald-400"
                        }`}
                      >
                        {/* Ping beacon & Destination */}
                        <div className="flex items-center justify-between gap-1 pb-1 border-b border-emerald-500/30 shrink-0">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                            <span className="whitespace-nowrap">COLLECT</span>
                          </span>

                          {isTable ? (
                            <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] sm:text-[11px] font-mono font-black uppercase whitespace-nowrap shrink-0">
                              {order.tableNumber || "Dine-In"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500 text-black text-[10px] sm:text-[11px] font-mono font-black uppercase whitespace-nowrap shrink-0">
                              Takeaway
                            </span>
                          )}
                        </div>

                        {/* Massive Token Number for Far Viewing */}
                        <div className="py-1 text-center min-w-0">
                          <div className="text-2xl sm:text-3xl lg:text-4xl font-mono font-black text-white tracking-widest drop-shadow-md truncate">
                            {tokenStr}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                            {order.customerName}
                          </div>
                        </div>

                        {/* Mini Call & Complete triggers */}
                        <div className="pt-1.5 border-t border-emerald-500/20 flex items-center justify-between gap-1 shrink-0">
                          <button
                            onClick={() => triggerOrderCall(order)}
                            className="flex-1 py-1 px-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-[10px] uppercase tracking-wider border border-amber-500/40 transition-colors cursor-pointer text-center whitespace-nowrap"
                            title="Announce token over TV speaker"
                          >
                            Call Voice
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                            className="py-1 px-2 bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-white font-bold text-[10px] uppercase border border-zinc-700 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                            title="Mark served"
                          >
                            Served
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM TICKER: RECENTLY COMPLETED / SERVED (Compact strip) */}
          <div className="bg-[#090A0E] border-t border-zinc-800 px-4 py-2 shrink-0 flex items-center justify-between gap-3 text-xs overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-mono font-bold text-[11px] text-zinc-400 uppercase whitespace-nowrap">
                RECENTLY SERVED:
              </span>
            </div>

            <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2 min-w-0">
              {completedOrders.length === 0 ? (
                <span className="text-[11px] text-zinc-600 font-mono whitespace-nowrap">
                  No recently served orders yet
                </span>
              ) : (
                completedOrders.map((order) => {
                  const tokenStr = order.kioskToken || order.orderNumber.replace("CR-", "TK-");
                  const isTable = order.fulfillmentType === "DINE_IN" || !!order.tableNumber;

                  return (
                    <span
                      key={order.id}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#101217] border border-zinc-800 text-[11px] font-mono text-zinc-300 shrink-0 whitespace-nowrap"
                    >
                      <strong className="text-zinc-100">{tokenStr}</strong>
                      <span className="text-zinc-500">
                        ({isTable ? order.tableNumber || "Dine" : "Takeaway"})
                      </span>
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            ZONE B: ANIMATED SLIDING MENU / SPECIALS AD SHOWCASE (Col Span 4 on XL)
            Full-bleed top image, zero margin/padding from top/sides, large & beautiful
        ========================================================= */}
        <div className="xl:col-span-4 2xl:col-span-4 flex flex-col bg-[#08090C] overflow-hidden relative">
          {/* Animated Slide Body: Full top image with zero margins/padding */}
          {currentSlideProduct ? (
            <div className="flex-1 min-h-0 flex flex-col justify-between relative overflow-hidden group">
              {/* Product Visual Container: from full top, bezel-less, large, very subtle dark overlay */}
              <div className="relative w-full flex-1 min-h-[300px] sm:min-h-[340px] bg-[#0A0B0E] overflow-hidden flex items-center justify-center">
                <img
                  key={currentSlideProduct.id}
                  src={currentSlideProduct.images[0]}
                  alt={currentSlideProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center select-none"
                />

                {/* Very light, delicate dark gradient overlay at the bottom as requested */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/20 to-black/10 pointer-events-none" />

                {/* Floating Slide Counter & Controls in Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <span className="text-[10px] font-mono text-zinc-200 bg-black/70 px-2 py-0.5 border border-white/10 backdrop-blur-sm">
                    {activeSlideIndex + 1}/{showcaseProducts.length || 1}
                  </span>
                  <button
                    onClick={() =>
                      setActiveSlideIndex(
                        (prev) => (prev - 1 + showcaseProducts.length) % showcaseProducts.length
                      )
                    }
                    className="p-1 bg-black/70 hover:bg-black text-zinc-300 hover:text-white border border-white/10 backdrop-blur-sm transition-colors cursor-pointer"
                    title="Previous slide"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveSlideIndex((prev) => (prev + 1) % showcaseProducts.length)
                    }
                    className="p-1 bg-black/70 hover:bg-black text-zinc-300 hover:text-white border border-white/10 backdrop-blur-sm transition-colors cursor-pointer"
                    title="Next slide"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Dietary & Featured Badges in Top Left */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
                  {currentSlideProduct.dietary.map((d, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow-md"
                    >
                      {d}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 bg-black/70 border border-white/15 text-white text-[10px] font-mono font-bold backdrop-blur-sm">
                    PREP ~{currentSlideProduct.prepTimeMinutes} MINS
                  </span>
                </div>

                {/* Price Tag Overlay in Bottom Right of Hero Image */}
                <div className="absolute bottom-3 right-3 bg-black/85 border border-amber-500/60 px-3 py-1.5 text-right pointer-events-none backdrop-blur-sm shadow-xl z-10">
                  <div className="text-[9px] text-zinc-400 font-mono leading-none">SPECIAL PRICE</div>
                  <div className="text-xl font-mono font-black text-amber-400 leading-tight">
                    Rs. {currentSlideProduct.basePrice}
                  </div>
                </div>
              </div>

              {/* Product Info & Editorial Typography */}
              <div className="p-4 sm:p-5 flex flex-col justify-between shrink-0 bg-[#08090C] border-t border-zinc-800/60">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>CHEF'S SIGNATURE CREATION</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 leading-tight">
                    {currentSlideProduct.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {currentSlideProduct.description}
                  </p>
                </div>

                {/* Bottom Callout & Slide Indicator Dots */}
                <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {showcaseProducts.slice(0, 8).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlideIndex(idx)}
                        className={`h-1.5 transition-all cursor-pointer ${
                          activeSlideIndex === idx
                            ? "w-6 bg-amber-500"
                            : "w-2 bg-zinc-800 hover:bg-zinc-600"
                        }`}
                        title={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 font-mono whitespace-nowrap">
                    <span>ORDER AT TABLE OR KIOSK</span>
                    <ArrowRight className="w-3 h-3 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-zinc-500">
              <Sparkles className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-xs">Menu Ad Showcase Active</p>
            </div>
          )}
        </div>
      </main>

      {/* -------------------------------------------------------------
          "LITTLE FOCUS ANIMATED SMALL RECTANGLE UI" (Floating Broadcaster)
          As requested by user:
          "SPEACK AUTORFM SKEPAR LIEK ORDER YAT READY AND SHWO IN SIDE LITTLE FOUSE ANIMATED SMALL RECTANLE UI"
      ------------------------------------------------------------- */}
      {activeCall && (
        <aside
          aria-live="assertive"
          id="tv-calling-spotlight-card"
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-sm w-full bg-[#0C0E14] border-2 border-amber-500 shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Pulsing radar light */}
          <div className="absolute -top-3 left-4 bg-amber-500 text-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
            <Radio className="w-3 h-3 animate-ping" />
            <span>NOW CALLING OVER SPEAKER</span>
          </div>

          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              {/* Equalizer Wave Animation */}
              <div className="w-9 h-9 bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-1 bg-amber-400 animate-pulse h-2"></span>
                  <span className="w-1 bg-amber-400 animate-pulse h-4"></span>
                  <span className="w-1 bg-amber-400 animate-pulse h-3"></span>
                  <span className="w-1 bg-amber-400 animate-pulse h-1.5"></span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                  ATTENTION PLEASE
                </div>
                <div className="text-2xl font-mono font-black text-white tracking-widest">
                  TOKEN {activeCall.token}
                </div>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => setActiveCall(null)}
              className="p-1 text-zinc-500 hover:text-white border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table / Pickup Detail */}
          <div className="mt-2.5 py-1.5 px-2.5 bg-black/70 border border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-200 font-bold">
              {activeCall.tableNumber ? `DELIVER TO ${activeCall.tableNumber}` : "COLLECT AT COUNTER A"}
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
              {activeCall.customerName}
            </span>
          </div>

          {/* Progress countdown bar */}
          <div className="mt-2.5 h-1 w-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-100 ease-linear"
              style={{ width: `${callProgress}%` }}
            />
          </div>
        </aside>
      )}

      {/* -------------------------------------------------------------
          BOTTOM TICKER
      ------------------------------------------------------------- */}
      <footer className="bg-[#08090C] border-t border-zinc-800/80 px-4 py-1.5 text-[11px] text-zinc-500 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-mono text-zinc-400 font-bold">CRUNCHY FIDS RADAR</span>
          <span className="text-zinc-700">|</span>
          <span className="hidden sm:inline text-zinc-500">
            Keep audio active for airport chime & token voice caller
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
          <span>AUTO-PAGE ACTIVE</span>
          <span className="text-zinc-700">•</span>
          <span>1080P/4K WIDESCREEN READY</span>
        </div>
      </footer>
    </div>
  );
};
