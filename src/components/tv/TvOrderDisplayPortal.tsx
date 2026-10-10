import { NepaliAudioPlayer, announcementAudioUrl, NEPALI_VOICE_SAMPLE } from "../../lib/nepaliAudio";
import { apiClient, extractErrorMessage } from "../../lib/api";
import { useOutletEvents } from "../../lib/useOutletEvents";
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
import { formatNPR } from "../../lib/utils";

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
    products,
    categories,
    currentOutlet,
    updateOrderStatus,
    setActivePortal,
    isLoadingSkeleton,
  } = useApp();

  const outletParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('outlet_id') : null;
  const effectiveOutletId = outletParam || String(currentOutlet?.id || '1');

  const [orders,setOrders] = useState<Order[]>([]);
  const [lastKitchenCall,setLastKitchenCall] = useState<CallingAnnouncement|null>(null);
  const [syncError,setSyncError] = useState('');
  const loadSequence = useRef(0);
  const loadDisplay = async () => {
    const seq=++loadSequence.current;
    try {
      const data=await apiClient.get<any>(`/orders/display/${effectiveOutletId}/`,{skipAuth:true});
      if(seq!==loadSequence.current)return;
      setOrders((data.tickets || []).flatMap((order:any)=>(order.rounds || [{number:1,status:order.status,created_at:order.created_at}]).map((round:any)=>({
        ...order,id:`${order.id}:r${round.number}`,round_number:round.number,
        status:round.status==='WAITING'?'ACCEPTED':round.status==='SERVED'?'COMPLETED':round.status,
        created_at:round.created_at,
      }))).map((row:any)=>({
        id:String(row.id),orderNumber:`${row.order_number} / R${row.round_number || 1}`,kioskToken:`${row.order_number} / R${row.round_number || 1}`,
        status:row.status==='ACCEPTED'?'CONFIRMED':row.status==='PREPARING'?'PROCESSING':row.status,
        fulfillmentType:row.fulfillment_type,tableNumber:row.table_number,createdAt:row.created_at,
        customerName:'',outletId:effectiveOutletId,items:[],
      } as Order)));
      setSyncError('');
    }catch(error){setSyncError(extractErrorMessage(error));}
  };
  useEffect(()=>{setOrders([]);void loadDisplay();return()=>{loadSequence.current++;};},[effectiveOutletId]);
  const displayLive=useOutletEvents(effectiveOutletId,true,()=>void loadDisplay(),event=>{
    if(event.event_type==='ORDER_CALL')setLastKitchenCall({id:`${event.aggregate_id}:r${event.round_number || 1}`,orderNumber:`${event.order_number} / R${event.round_number || 1}`,
      token:`${event.order_number} / R${event.round_number || 1}`,customerName:'',fulfillmentType:event.fulfillment_type,tableNumber:event.table_number,timestamp:Date.now()});
  });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sound & Speech settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceError, setVoiceError] = useState("");
  const audioPlayer = useRef<NepaliAudioPlayer | null>(null);
  const speechBusy = useRef(false);
  const playbackId = useRef(0);
  const getAudioPlayer = () => audioPlayer.current ||= new NepaliAudioPlayer();
  const stopAnnouncement = () => {
    playbackId.current++;
    audioPlayer.current?.stop();
    speechBusy.current = false;
  };
  useEffect(() => {
    if (!soundEnabled) stopAnnouncement();
  }, [soundEnabled]);
  useEffect(() => () => {
    playbackId.current++;
    audioPlayer.current?.dispose();
    audioPlayer.current = null;
  }, []);

  // Real-time clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Active Calling Announcement Spotlight (The animated focus small rectangle UI)
  const [activeCall, setActiveCall] = useState<CallingAnnouncement | null>(null);
  const [callProgress, setCallProgress] = useState(100);
  const [callQueue,setCallQueue] = useState<CallingAnnouncement[]>([]);

  // Sliding Menu Carousel index
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [menuCarouselIndex, setMenuCarouselIndex] = useState(0);
  const [menuCarouselTransitionEnabled, setMenuCarouselTransitionEnabled] = useState(true);
  const [displayMode, setDisplayMode] = useState<"menu" | "orders">("menu");

  // Auto-pagination / scroll page for preparing orders when there are many (8-16+)
  const [prepPage, setPrepPage] = useState(0);
  const ORDERS_PER_PREP_PAGE = 8;

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
  const slideImageLoads = useRef(new Map<string, Promise<boolean>>());
  const slideRequestId = useRef(0);

  const preloadSlide = (index: number) => {
    const product = showcaseProducts[index];
    const src = product?.images[0];
    if (!src) return Promise.resolve(false);

    const cached = slideImageLoads.current.get(src);
    if (cached) return cached;

    let load: Promise<boolean>;
    load = new Promise((resolve) => {
      const image = new Image();
      image.decoding = "async";
      const finishLoading = () => {
        void image.decode().then(
          () => resolve(true),
          () => resolve(image.naturalWidth > 0),
        );
      };
      image.onload = finishLoading;
      image.onerror = () => resolve(false);
      image.src = src;
      if (image.complete && image.naturalWidth > 0) finishLoading();
    });
    slideImageLoads.current.set(src, load);
    void load.then((loaded) => {
      if (!loaded && slideImageLoads.current.get(src) === load) {
        slideImageLoads.current.delete(src);
      }
    });
    return load;
  };

  const requestSlide = (index: number) => {
    if (!showcaseProducts.length) return;
    const targetIndex = ((index % showcaseProducts.length) + showcaseProducts.length) % showcaseProducts.length;
    const requestId = ++slideRequestId.current;
    void preloadSlide(targetIndex).then((loaded) => {
      if (loaded && requestId === slideRequestId.current) {
        setActiveSlideIndex(targetIndex);
      }
    });
  };

  useEffect(() => {
    if (showcaseProducts.length <= 1) return;
    void preloadSlide((activeSlideIndex + 1) % showcaseProducts.length);
  }, [activeSlideIndex, showcaseProducts.length]);

  // Keep each menu image on screen longer and only switch after the next image is decoded.
  useEffect(() => {
    if (showcaseProducts.length <= 1) return;

    const interval = setInterval(() => {
      requestSlide((activeSlideIndex + 1) % showcaseProducts.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [activeSlideIndex, showcaseProducts.length]);

  // Recorded Kamala opening and ending surround one generated token recording.
  const speakAnnouncement = (announcement: CallingAnnouncement) => {
    if (!soundEnabled) return;
    const id = ++playbackId.current;
    speechBusy.current = true;
    setVoiceError("");
    void getAudioPlayer().play(announcement.id === "test-call" ? NEPALI_VOICE_SAMPLE : announcementAudioUrl(effectiveOutletId, announcement.token)).catch((error) => {
      if (id === playbackId.current) setVoiceError(error instanceof Error && error.name !== "AbortError" ? error.message : "Audio could not load. Please try the call again.");
    }).finally(() => {
      if (id === playbackId.current) speechBusy.current = false;
    });
  };

  // Helper to format token
  const formatTvToken = (order: { kioskToken?: string; orderNumber?: string }) => {
    const raw = (order.kioskToken || order.orderNumber || "").trim();
    return raw || 'Order';
  };

  // Dynamic responsive font size to guarantee 20-foot distance visibility while fitting snugly inside compact cards
  const getTokenFontSize = (token: string, column: "prep" | "ready") => {
    const len = token.length;
    if (column === "ready") {
      if (len <= 5) return "text-3xl sm:text-4xl lg:text-5xl";
      if (len <= 7) return "text-2xl sm:text-3xl lg:text-4xl";
      if (len <= 10) return "text-xl sm:text-2xl lg:text-3xl";
      return "text-lg sm:text-xl lg:text-2xl";
    } else {
      if (len <= 5) return "text-2xl sm:text-3xl lg:text-4xl";
      if (len <= 7) return "text-xl sm:text-2xl lg:text-3xl";
      if (len <= 10) return "text-lg sm:text-xl lg:text-2xl";
      return "text-base sm:text-lg lg:text-xl";
    }
  };

  // Trigger calling an order (Chime + Speech + Small Focus Rectangle UI)
  const triggerOrderCall = (order: Order) => {
    const announcement: CallingAnnouncement = {
      id: order.id,
      orderNumber: order.orderNumber,
      token: formatTvToken(order),
      customerName: order.customerName,
      fulfillmentType: order.fulfillmentType,
      tableNumber: order.tableNumber,
      timestamp: Date.now(),
    };

    setCallQueue(queue=>[...queue,announcement]);
  };

  useEffect(()=>{
    if(activeCall || !callQueue.length)return;
    const [next,...rest]=callQueue;setCallQueue(rest);setActiveCall(next);setCallProgress(100);
    speakAnnouncement(next);
  },[activeCall,callQueue]);

  // Auto-dismiss the calling spotlight rectangle over 8 seconds with smooth progress bar
  useEffect(() => {
    if (!activeCall) return;

    const startTime = Date.now();
    const duration = 8000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setCallProgress(remaining);

      if (elapsed >= duration && !speechBusy.current) {
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
      (o) => o.id === lastKitchenCall.id
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
      setCallQueue(queue=>[...queue,manualAnnouncement]);
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

  // Different dynamic in-animation effects for promotional ad slides
  const SLIDER_IN_ANIMATIONS = [
    { id: 'zoom-in', label: 'Zoom In', className: 'tv-anim-zoom-in' },
    { id: 'slide-right', label: 'Slide Right', className: 'tv-anim-slide-right' },
    { id: 'slide-up', label: 'Elevate Up', className: 'tv-anim-slide-up' },
    { id: 'zoom-out', label: 'Ken Burns', className: 'tv-anim-zoom-out' },
    { id: 'slide-left', label: 'Slide Left', className: 'tv-anim-slide-left' },
    { id: 'tilt-in', label: '3D Tilt', className: 'tv-anim-tilt-in' },
  ];

  const currentSlideProduct = showcaseProducts[activeSlideIndex] || showcaseProducts[0];
  const currentAnimation = SLIDER_IN_ANIMATIONS[activeSlideIndex % SLIDER_IN_ANIMATIONS.length];
  const menuCarouselClones = Math.min(4, showcaseProducts.length);
  const menuCarouselProducts = [
    ...showcaseProducts,
    ...showcaseProducts.slice(0, menuCarouselClones),
  ];

  useEffect(() => {
    if (displayMode !== "menu" || showcaseProducts.length <= 1) return;

    const interval = window.setInterval(() => {
      setMenuCarouselIndex((index) => index + 1);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [displayMode, showcaseProducts.length]);

  useEffect(() => {
    setMenuCarouselIndex(0);
  }, [showcaseProducts.length]);

  const handleMenuCarouselTransitionEnd = () => {
    if (menuCarouselIndex < showcaseProducts.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMenuCarouselTransitionEnabled(false);
      setMenuCarouselIndex(0);
      window.requestAnimationFrame(() => setMenuCarouselTransitionEnabled(true));
      return;
    }
    setMenuCarouselTransitionEnabled(false);
    setMenuCarouselIndex(0);
    window.requestAnimationFrame(() => setMenuCarouselTransitionEnabled(true));
  };

  if (displayMode === "menu") {
    return (
      <div className="tv-menu-screen flex h-screen w-screen select-none flex-col overflow-hidden bg-[#08090b] text-white">
        <header className="flex shrink-0 items-center justify-between gap-4 px-8 py-5 sm:px-12">
          <div className="flex items-center gap-5">
            <CrunchyLogo size="md" className="h-9 w-auto sm:h-11" />
            <span className="h-8 w-px bg-white/15" aria-hidden="true" />
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-300 sm:text-base">Our Menu</span>
          </div>
          <div className="flex items-center gap-5">
            {showcaseProducts.length > 0 && (
              <span className="font-mono text-sm tabular-nums text-zinc-400 sm:text-base">
                {`${(menuCarouselIndex % showcaseProducts.length) + 1} / ${showcaseProducts.length}`}
              </span>
            )}
            <button
              type="button"
              onClick={() => setDisplayMode("orders")}
              className="text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white sm:text-sm"
            >
              Order board
            </button>
            <button
              id="tv-fullscreen-toggle"
              type="button"
              onClick={toggleFullscreen}
              className="text-zinc-400 transition-colors hover:text-white"
              title="Toggle TV fullscreen"
              aria-label="Toggle TV fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5 sm:h-6 sm:w-6" /> : <Maximize2 className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-400 transition-colors hover:text-white"
                title="Exit TV display"
                aria-label="Exit TV display"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}
          </div>
        </header>

        {isLoadingSkeleton ? (
          <main className="grid min-h-0 flex-1 grid-cols-1 gap-8 px-8 py-6 sm:grid-cols-2 sm:px-12 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex flex-col gap-6">
                <Skeleton className="aspect-[1.08/1] w-full bg-zinc-900" />
                <Skeleton className="h-8 w-4/5 bg-zinc-900" />
                <Skeleton className="h-7 w-2/5 bg-zinc-900" />
              </div>
            ))}
          </main>
        ) : showcaseProducts.length > 0 ? (
          <main className="min-h-0 flex-1 overflow-hidden py-4 sm:py-6">
            <div
              className={`tv-menu-track flex h-full items-center ${menuCarouselTransitionEnabled ? "" : "tv-menu-track-reset"}`}
              style={{ transform: `translateX(calc(var(--tv-menu-card-width) * -${menuCarouselIndex}))` }}
              onTransitionEnd={handleMenuCarouselTransitionEnd}
            >
              {menuCarouselProducts.map((product, index) => {
                const category = categories.find((item) => item.id === product.categoryId);
                const image = product.images[product.mainImageIndex ?? 0] || product.images[0];
                const price = product.discountPercent
                  ? Math.round(product.basePrice * (100 - product.discountPercent) / 100)
                  : product.basePrice;

                return (
                  <article
                    key={`${product.id}-${index >= showcaseProducts.length ? "loop" : "item"}`}
                    className="tv-menu-slide flex h-full min-w-0 flex-col justify-center px-5 sm:px-8"
                  >
                    <div className="tv-menu-image relative aspect-[1.08/1] overflow-hidden bg-zinc-900/70">
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading={index < 4 ? "eager" : "lazy"}
                        decoding="async"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
                    </div>
                    <div className="flex min-h-28 flex-col justify-center gap-2 px-1 pt-5 sm:pt-6">
                      {category && (
                        <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 sm:text-sm">
                          {category.name}
                        </p>
                      )}
                      <h2 className="line-clamp-2 text-2xl font-semibold leading-tight text-white sm:text-3xl 2xl:text-4xl">
                        {product.name}
                      </h2>
                      <div className="flex items-baseline gap-3">
                        <p className="font-mono text-2xl font-bold tabular-nums text-amber-400 sm:text-3xl 2xl:text-4xl">
                          {formatNPR(price)}
                        </p>
                        {product.discountPercent ? (
                          <span className="font-mono text-base tabular-nums text-zinc-500 line-through sm:text-lg">
                            {formatNPR(product.basePrice)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </main>
        ) : (
          <main className="flex flex-1 items-center justify-center px-8 text-center">
            <div>
              <h1 className="text-3xl font-semibold text-white sm:text-5xl">Our menu is getting ready</h1>
              <p className="mt-4 text-lg text-zinc-400 sm:text-2xl">Available items with photos will appear here.</p>
            </div>
          </main>
        )}

        <footer className="flex shrink-0 items-center justify-between px-8 pb-5 pt-3 text-xs uppercase tracking-[0.16em] text-zinc-500 sm:px-12 sm:text-sm">
          <span>{currentOutlet?.name || "Freshly made, just for you"}</span>
          <span>Fresh favourites, all day</span>
        </footer>
      </div>
    );
  }

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

        {voiceError && <p role="status" className="text-sm text-amber-300 max-w-sm">{voiceError}</p>}
        {/* Right: Small Speaker Test Button + Quick Simulators + Fullscreen + Exit */}
        <div className="flex items-center gap-2">
          {/* Subtle Speaker Test Button (User requested: "just to test give somewhere small speaker button for now") */}
          <button
            id="tv-speaker-test-btn"
            onClick={async () => {
              try {
                await getAudioPlayer().unlock();
              } catch {
                setVoiceError("Sound could not start. Check the browser audio permission and try again.");
                return;
              }
              stopAnnouncement();
              setActiveCall(null);
              setSoundEnabled(true);
              setVoiceError("");
              const testOrder: Order = {
                id: "test-call",
                orderNumber: "POS-21",
                outletId: currentOutlet.id,
                outletName: currentOutlet.name,
                customerName: "Table Guest",
                customerPhone: "+977 9800-000000",
                fulfillmentType: "DINE_IN",
                tableNumber: undefined,
                kioskToken: "POS-21",
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
              setCallQueue(queue => [{id: testOrder.id, orderNumber: testOrder.orderNumber, token: formatTvToken(testOrder), customerName: testOrder.customerName, fulfillmentType: testOrder.fulfillmentType, tableNumber: testOrder.tableNumber, timestamp: Date.now()}, ...queue]);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-700/80 text-xs font-bold transition-colors cursor-pointer"
            title="Speaker Test: Gentle chime and Nepali pickup announcement"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-[11px]">SPEAKER TEST</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => {
              if (!soundEnabled) void getAudioPlayer().unlock().catch(() => setVoiceError("Click Speaker Test to enable sound."));
              setSoundEnabled(!soundEnabled);
            }}
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
          <button
            type="button"
            onClick={() => setDisplayMode("menu")}
            className="px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 transition-colors hover:text-amber-300"
            title="Show menu-only TV display"
          >
            Menu only
          </button>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full content-start">
                  {visiblePrepOrders.map((order) => {
                    const isTable = order.fulfillmentType === "DINE_IN" || !!order.tableNumber;
                    const tokenStr = formatTvToken(order);

                    return (
                      <div
                        key={order.id}
                        className="bg-[#0C0E14] border border-amber-500/35 hover:border-amber-500/80 p-2 flex flex-col justify-between shadow-sm transition-all rounded-none min-w-0"
                      >
                        {/* Top: Fulfillment Type Badge & Elapsed Kitchen Time */}
                        <div className="flex items-center justify-between gap-1 pb-1 border-b border-zinc-800/80 shrink-0">
                          {isTable ? (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] sm:text-[10px] font-mono font-black uppercase whitespace-nowrap shrink-0 max-w-[110px] truncate">
                              {order.tableNumber || "Dine-In"}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[9px] sm:text-[10px] font-mono font-black uppercase whitespace-nowrap shrink-0">
                              Takeaway
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-amber-400 font-mono text-[10px] sm:text-[11px] font-bold shrink-0">
                            <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            <span>{getElapsedString(order.createdAt)}</span>
                          </div>
                        </div>

                        {/* Center: Full-Width Token Number (Never Squeezed, Highly Visible from 20ft) */}
                        <div className="py-1 sm:py-1.5 text-center overflow-visible">
                          <div
                            className={`${getTokenFontSize(tokenStr, "prep")} font-mono font-black text-amber-400 tracking-normal drop-shadow-sm leading-tight inline-block max-w-full break-all`}
                          >
                            {tokenStr}
                          </div>
                        </div>

                        {/* Bottom: Sub-status */}
                        <div className="pt-0.5 border-t border-zinc-800/60 flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase font-bold shrink-0">
                          <span>KITCHEN PREP</span>
                          <span className="text-amber-500/70">IN PROGRESS</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full content-start">
                  {readyOrders.map((order) => {
                    const isTable = order.fulfillmentType === "DINE_IN" || !!order.tableNumber;
                    const tokenStr = formatTvToken(order);
                    const isCalling = activeCall?.id === order.id;

                    return (
                      <div
                        key={order.id}
                        className={`relative p-2 border-2 shadow-lg transition-all min-w-0 flex flex-col justify-between gap-1 rounded-none ${
                          isCalling
                            ? "bg-[#0E261A] border-emerald-400 ring-4 ring-emerald-500/50 scale-[1.01]"
                            : "bg-[#0A1811] border-emerald-500/80 hover:border-emerald-400"
                        }`}
                      >
                        {/* Live Ping Beacon & Clean Destination Badge (NO redundant READY TO COLLECT text) */}
                        <div className="flex items-center justify-between gap-1 pb-1 border-b border-emerald-500/30 shrink-0">
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                          </span>

                          {isTable ? (
                            <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[9px] sm:text-[10px] font-mono font-black uppercase whitespace-nowrap shrink-0 max-w-[120px] truncate shadow-xs">
                              {order.tableNumber || "Dine-In"}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-black text-[9px] sm:text-[10px] font-mono font-black uppercase whitespace-nowrap shrink-0 shadow-xs">
                              Takeaway
                            </span>
                          )}
                        </div>

                        {/* Center: Token Number for Distance Visibility */}
                        <div className="py-1 sm:py-1.5 text-center overflow-visible">
                          <div
                            className={`${getTokenFontSize(tokenStr, "ready")} font-mono font-black text-white tracking-normal drop-shadow-[0_2px_12px_rgba(16,185,129,0.35)] leading-tight inline-block max-w-full break-all`}
                          >
                            {tokenStr}
                          </div>
                          {order.customerName && order.customerName !== "Walk-in Guest" && order.customerName !== "Table Guest" && (
                            <div className="text-[10px] sm:text-[11px] text-emerald-300/80 font-medium truncate mt-0.5">
                              {order.customerName}
                            </div>
                          )}
                        </div>

                        {/* Action Bar */}
                        <div className="pt-1 border-t border-emerald-500/20 flex items-center justify-between gap-1.5 shrink-0">
                          <button
                            onClick={() => triggerOrderCall(order)}
                            className="flex-1 py-1 px-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold text-[11px] uppercase tracking-wider border border-amber-500/40 transition-colors cursor-pointer text-center whitespace-nowrap"
                            title="Announce token over TV speaker"
                          >
                            Call Voice
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, "COMPLETED")}
                            className="py-1 px-2.5 bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white font-bold text-[11px] uppercase border border-zinc-700 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                            title="Mark served"
                          >
                            Served ✓
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
                  const tokenStr = formatTvToken(order);
                  const isTable = order.fulfillmentType === "DINE_IN" || !!order.tableNumber;

                  return (
                    <span
                      key={order.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#101217] border border-zinc-800 text-xs font-mono text-zinc-300 shrink-0 whitespace-nowrap"
                    >
                      <strong className="text-zinc-100 font-bold">{tokenStr}</strong>
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
                  key={`${currentSlideProduct.id}-${activeSlideIndex}`}
                  src={currentSlideProduct.images[0]}
                  alt={currentSlideProduct.name}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover object-center select-none will-change-transform ${currentAnimation.className}`}
                />

                {/* Very light, delicate dark gradient overlay at the bottom as requested */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/20 to-black/10 pointer-events-none" />

                {/* Floating Slide Counter & Animation Effect Badge & Controls in Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <span className="text-[10px] font-mono text-amber-400 bg-black/75 px-2 py-0.5 border border-amber-500/30 backdrop-blur-sm shadow-xs flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{currentAnimation.label}</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-200 bg-black/70 px-2 py-0.5 border border-white/10 backdrop-blur-sm">
                    {activeSlideIndex + 1}/{showcaseProducts.length || 1}
                  </span>
                  <button
                    onClick={() => requestSlide(activeSlideIndex - 1)}
                    className="p-1 bg-black/70 hover:bg-black text-zinc-300 hover:text-white border border-white/10 backdrop-blur-sm transition-colors cursor-pointer"
                    title="Previous slide"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => requestSlide(activeSlideIndex + 1)}
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
                <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-normal break-all">
                  TOKEN {activeCall.token}
                </div>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => {
                stopAnnouncement();
                setActiveCall(null);
              }}
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
          <span role="status">{syncError || (displayLive ? "LIVE" : "RECONNECTING")}</span>
          <span className="text-zinc-700">•</span>
          <span>1080P/4K WIDESCREEN READY</span>
        </div>
      </footer>
    </div>
  );
};
