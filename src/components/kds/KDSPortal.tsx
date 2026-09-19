import React, { useState } from "react";
import {
  Flame,
  Clock,
  Check,
  Maximize2,
  Volume2,
  VolumeX,
  Search,
  RotateCcw,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  AlertTriangle,
  ChefHat,
  Package,
  Sparkles,
  Layers,
  CheckCircle2,
  Bell,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { KdsColumn, FulfillmentType } from "../../types";
import { formatTimer } from "../../lib/utils";
import { SkeletonTicketGrid } from "../common/Skeleton";

// Subtle Web Audio chime for mobile kitchen feedback
const playKitchenChime = (type: "advance" | "complete" | "toggle") => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "advance") {
      // Crisp 2-tone pleasant kitchen notification
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "complete") {
      // Success tone
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Tap toggle
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  } catch {
    // AudioContext blocked or not supported
  }
};

export const KDSPortal: React.FC = () => {
  const {
    kdsTickets,
    bumpKdsTicket,
    kdsSoundEnabled,
    setKdsSoundEnabled,
    currentOutlet,
    orders,
    addToast,
    isLoadingSkeleton,
    triggerKitchenCall,
  } = useApp();

  // Queue stage filter for mobile (All, Incoming, In Prep, Ready)
  const [activeStage, setActiveStage] = useState<KdsColumn | "ALL">("ALL");
  const [isStageLoading, setIsStageLoading] = useState(false);

  const handleStageChange = (stage: KdsColumn | "ALL") => {
    if (stage === activeStage) return;
    setIsStageLoading(true);
    setActiveStage(stage);
    setTimeout(() => setIsStageLoading(false), 180);
  };

  // Fulfillment filter (All, Dine-in, Takeaway, Delivery)
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentType | "ALL">("ALL");

  // Search by token number, table, or order #
  const [searchQuery, setSearchQuery] = useState("");

  // Individual item check states (for cooks ticking off items as they grill/fry)
  const [completedItemIds, setCompletedItemIds] = useState<Record<string, boolean>>({});

  // Layout view mode: stack (mobile-friendly cards) vs kanban (desktop swimlanes)
  const [viewMode, setViewMode] = useState<"stack" | "kanban">("stack");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleItemCheck = (ticketId: string, itemId: string) => {
    const key = `${ticketId}-${itemId}`;
    setCompletedItemIds((prev) => {
      const next = !prev[key];
      if (kdsSoundEnabled) playKitchenChime("toggle");
      return { ...prev, [key]: next };
    });
  };

  const handleBump = (ticketId: string, currentColumn: KdsColumn) => {
    if (kdsSoundEnabled) {
      if (currentColumn === "READY") {
        playKitchenChime("complete");
      } else {
        playKitchenChime("advance");
      }
    }
    bumpKdsTicket(ticketId);
  };

  // Filter tickets based on stage, fulfillment, and search
  const filteredTickets = kdsTickets.filter((ticket) => {
    // Stage check
    if (activeStage !== "ALL" && ticket.column !== activeStage) return false;

    // Fulfillment check
    if (fulfillmentFilter !== "ALL" && ticket.fulfillmentType !== fulfillmentFilter) return false;

    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchOrderNum = ticket.orderNumber.toLowerCase().includes(q);
      const matchToken = (ticket.kioskToken || "").toLowerCase().includes(q);
      const matchTable = (ticket.tableNumber || "").toLowerCase().includes(q);
      const matchCustomer = ticket.customerName.toLowerCase().includes(q);
      const matchItem = ticket.items.some((i) => i.productName.toLowerCase().includes(q));
      if (!matchOrderNum && !matchToken && !matchTable && !matchCustomer && !matchItem) {
        return false;
      }
    }

    return true;
  });

  // Stage counts
  const countQueued = kdsTickets.filter((t) => t.column === "QUEUED").length;
  const countPreparing = kdsTickets.filter((t) => t.column === "PREPARING").length;
  const countReady = kdsTickets.filter((t) => t.column === "READY").length;

  const getFulfillmentIcon = (type: FulfillmentType) => {
    switch (type) {
      case "DINE_IN":
        return <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />;
      case "TAKEAWAY":
        return <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />;
      case "DELIVERY":
        return <Bike className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getPackagingDetails = (type: FulfillmentType, tableNumber?: string) => {
    switch (type) {
      case "DINE_IN":
        return {
          badge: `🍽️ DINE-IN ${tableNumber ? `• ${tableNumber.toUpperCase()}` : ""}`,
          packNote: "Dine-in Plating: Metal basket + checkered greaseproof paper + napkins",
          badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/40",
        };
      case "TAKEAWAY":
        return {
          badge: "🛍️ TAKEAWAY • CARRY BAG",
          packNote: "Packaging: Seal burger in foil wrap + vented fry box + carry bag with handle",
          badgeColor: "bg-sky-500/15 text-sky-400 border-sky-500/40",
        };
      case "DELIVERY":
        return {
          badge: "🛵 DELIVERY • PARCEL PACK",
          packNote: "Packaging: Double insulated bag + cup holder tape + tamper-evident sticker",
          badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
        };
      default:
        return {
          badge: "🛍️ TAKEAWAY",
          packNote: "Packaging: Sealed carry pack",
          badgeColor: "bg-zinc-800 text-zinc-300 border-zinc-700",
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans pb-16">
      {/* -------------------------------------------------------------
          TOP BAR: Mobile-Optimized, Clutter-Free
      ------------------------------------------------------------- */}
      <header className="sticky top-14 z-30 bg-[#121214] border-b border-zinc-800 px-3 sm:px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
          {/* Row 1: Brand & Control Utilities */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-500 text-black flex items-center justify-center font-black text-xs shrink-0">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-black tracking-wide text-white uppercase leading-none">
                  KITCHEN ORDER SCREEN
                </h1>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {currentOutlet.name} • <span className="text-amber-400 font-bold">{kdsTickets.length} ACTIVE</span>
                </p>
              </div>
            </div>

            {/* Quick Action Utilities */}
            <div className="flex items-center gap-1.5">
              {/* Test Kitchen Call Trigger */}
              <button
                type="button"
                onClick={() =>
                  triggerKitchenCall({
                    orderNumber: "CR-4821",
                    kioskToken: "TK-42",
                    customerName: "Sanjay Thapa",
                    fulfillmentType: "TAKEAWAY",
                  })
                }
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                title="Test Kitchen Call Chime & TTS Announcement"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Test Kitchen Call</span>
              </button>

              {/* Audio Chime Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !kdsSoundEnabled;
                  setKdsSoundEnabled(next);
                  if (next) playKitchenChime("advance");
                }}
                className={`p-2 border transition-colors cursor-pointer ${
                  kdsSoundEnabled
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                }`}
                title={kdsSoundEnabled ? "Sound Alert ON" : "Sound Alert OFF"}
              >
                {kdsSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              {/* Fullscreen Toggle for Mobile Browser */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* Desktop View Switcher (Hidden on Small Mobile) */}
              <div className="hidden lg:flex items-center border border-zinc-800 bg-zinc-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("stack")}
                  className={`px-2 py-1 text-[11px] font-bold ${
                    viewMode === "stack" ? "bg-amber-500 text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Stack
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`px-2 py-1 text-[11px] font-bold ${
                    viewMode === "kanban" ? "bg-amber-500 text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  3-Lane
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Queue Stage Filters (Thumb-friendly mobile pills) */}
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleStageChange("ALL")}
              className={`py-2 px-1 text-center font-black text-xs border transition-all cursor-pointer ${
                activeStage === "ALL"
                  ? "bg-zinc-100 text-black border-zinc-100 shadow-sm"
                  : "bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="text-[10px] leading-tight text-zinc-500 uppercase">All</div>
              <div className="font-mono text-xs">{kdsTickets.length}</div>
            </button>

            <button
              type="button"
              onClick={() => handleStageChange("QUEUED")}
              className={`py-2 px-1 text-center font-black text-xs border transition-all cursor-pointer ${
                activeStage === "QUEUED"
                  ? "bg-amber-500 text-black border-amber-500 shadow-sm"
                  : "bg-zinc-900/90 text-amber-400 border-zinc-800 hover:border-amber-500/50"
              }`}
            >
              <div className="text-[10px] leading-tight uppercase opacity-80">Incoming</div>
              <div className="font-mono text-xs">{countQueued}</div>
            </button>

            <button
              type="button"
              onClick={() => handleStageChange("PREPARING")}
              className={`py-2 px-1 text-center font-black text-xs border transition-all cursor-pointer ${
                activeStage === "PREPARING"
                  ? "bg-sky-500 text-black border-sky-500 shadow-sm"
                  : "bg-zinc-900/90 text-sky-400 border-zinc-800 hover:border-sky-500/50"
              }`}
            >
              <div className="text-[10px] leading-tight uppercase opacity-80">Cooking</div>
              <div className="font-mono text-xs">{countPreparing}</div>
            </button>

            <button
              type="button"
              onClick={() => handleStageChange("READY")}
              className={`py-2 px-1 text-center font-black text-xs border transition-all cursor-pointer ${
                activeStage === "READY"
                  ? "bg-emerald-500 text-black border-emerald-500 shadow-sm"
                  : "bg-zinc-900/90 text-emerald-400 border-zinc-800 hover:border-emerald-500/50"
              }`}
            >
              <div className="text-[10px] leading-tight uppercase opacity-80">Ready</div>
              <div className="font-mono text-xs">{countReady}</div>
            </button>
          </div>

          {/* Row 3: Fast Search & Dining Type Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find token (e.g. 4821) or table..."
                className="w-full h-8 pl-8 pr-3 bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Fulfillment Filter Selector */}
            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value as FulfillmentType | "ALL")}
              className="h-8 px-2 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="DINE_IN">🍽️ Dine-In</option>
              <option value="TAKEAWAY">🛍️ Takeaway</option>
              <option value="DELIVERY">🛵 Delivery</option>
            </select>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN TICKET FEED: Mobile Responsive Card Stream
      ------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 pt-3 flex-1">
        {isLoadingSkeleton || isStageLoading ? (
          <SkeletonTicketGrid count={6} />
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#121214] border border-zinc-800 p-8 my-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Flame className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              No Kitchen Tickets in Queue
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery || fulfillmentFilter !== "ALL" || activeStage !== "ALL"
                ? "No active orders match current filters. Try resetting the stage or search term."
                : "All orders have been prepared and dispatched. New incoming orders will alert with chime sound."}
            </p>
            {(searchQuery || fulfillmentFilter !== "ALL" || activeStage !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setActiveStage("ALL");
                  setFulfillmentFilter("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 px-4 py-2 bg-amber-500 text-black text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "kanban"
                ? "grid grid-cols-1 md:grid-cols-3 gap-4 items-start"
                : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 items-start"
            }
          >
            {filteredTickets.map((ticket) => {
              // Cross-reference matched full order for customer notes & packaging requests
              const matchedOrder = orders.find(
                (o) =>
                  o.orderNumber === ticket.orderNumber ||
                  (o.kioskToken && o.kioskToken === ticket.kioskToken)
              );

              const customerNotes = matchedOrder?.notes || ticket.orderNotes;
              const isOverdue = ticket.elapsedSeconds > 15 * 60;
              const isUrgent = ticket.elapsedSeconds > 8 * 60 && !isOverdue;

              const packaging = getPackagingDetails(ticket.fulfillmentType, ticket.tableNumber);

              const totalItemsCount = ticket.items.reduce((sum, item) => sum + item.quantity, 0);
              const checkedCount = ticket.items.filter(
                (item) => completedItemIds[`${ticket.id}-${item.id}`]
              ).length;
              const allChecked = checkedCount === ticket.items.length && ticket.items.length > 0;

              return (
                <div
                  key={ticket.id}
                  className={`bg-[#141417] border flex flex-col justify-between transition-all duration-150 ${
                    isOverdue
                      ? "border-rose-500 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50"
                      : isUrgent
                      ? "border-amber-500 shadow-md shadow-amber-950/20"
                      : ticket.column === "READY"
                      ? "border-emerald-500/60"
                      : ticket.column === "PREPARING"
                      ? "border-sky-500/60"
                      : "border-zinc-800"
                  }`}
                >
                  {/* TICKET HEADER */}
                  <div className="p-3 bg-[#18181C] border-b border-zinc-800 space-y-2">
                    {/* Top Row: Big Token Number + Elapsed Live Timer */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Token Slip ID */}
                        <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
                          {ticket.kioskToken || ticket.orderNumber}
                        </span>

                        <span className="font-mono text-xs text-zinc-400 font-bold">
                          #{ticket.orderNumber}
                        </span>
                      </div>

                      {/* Elapsed Timer Badge with Color Logic */}
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 font-mono text-xs font-black shrink-0 ${
                          isOverdue
                            ? "bg-rose-500 text-white animate-pulse"
                            : isUrgent
                            ? "bg-amber-500 text-black"
                            : "bg-zinc-800 text-zinc-200"
                        }`}
                        title="Time elapsed since order placed"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimer(ticket.elapsedSeconds)}</span>
                        {isOverdue && <span className="ml-1 text-[9px] uppercase tracking-tighter">RUSH</span>}
                      </div>
                    </div>

                    {/* Middle Row: Fulfillment Mode & Table */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase border ${packaging.badgeColor}`}
                        >
                          {getFulfillmentIcon(ticket.fulfillmentType)}
                          <span>{packaging.badge}</span>
                        </span>

                        {ticket.isAddOnRound && (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                            R{ticket.roundNumber || 2} ADD-ON
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-bold text-zinc-400 truncate max-w-[140px]">
                        {ticket.customerName}
                      </span>
                    </div>

                    {/* Customer Special Preparation Note Banner (No Unwanted text, Only Essential Notes) */}
                    {customerNotes && (
                      <div className="p-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold leading-snug flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="uppercase text-[10px] font-black tracking-wider text-amber-400 block">
                            Special Instructions / Packaging Note:
                          </span>
                          <span>"{customerNotes}"</span>
                        </div>
                      </div>
                    )}

                    {/* Packaging Protocol Hint */}
                    <div className="text-[10px] font-mono text-zinc-400 bg-black/40 px-2 py-1 border border-zinc-800/80 flex items-center gap-1.5">
                      <Package className="w-3 h-3 text-zinc-500 shrink-0" />
                      <span className="truncate">{packaging.packNote}</span>
                    </div>
                  </div>

                  {/* TICKET ITEMS BREAKDOWN (Proper Menu, Variants & Modifiers) */}
                  <div className="p-3 space-y-2 flex-1 divide-y divide-zinc-800/80">
                    <div className="pb-1 flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span>
                        Items to Prepare ({checkedCount}/{totalItemsCount})
                      </span>
                      <span className="text-[10px] text-zinc-500 lowercase">tap to cross-off</span>
                    </div>

                    {ticket.items.map((item) => {
                      const itemKey = `${ticket.id}-${item.id}`;
                      const isItemChecked = !!completedItemIds[itemKey];

                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItemCheck(ticket.id, item.id)}
                          className={`pt-2 flex items-start justify-between gap-3 cursor-pointer select-none transition-opacity ${
                            isItemChecked ? "opacity-35 line-through" : "hover:bg-zinc-900/40"
                          }`}
                        >
                          {/* Item Quantity & Name */}
                          <div className="flex items-start gap-2.5 min-w-0">
                            {/* Quantity Multiplier (High Contrast Box) */}
                            <span
                              className={`font-mono text-sm font-black px-2 py-0.5 shrink-0 ${
                                isItemChecked
                                  ? "bg-zinc-800 text-zinc-500"
                                  : "bg-amber-500 text-black border border-amber-400"
                              }`}
                            >
                              {item.quantity}x
                            </span>

                            {/* Item Name, Variant & Modifiers */}
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm font-black text-white leading-tight">
                                {item.productName}
                              </p>

                              {/* Variant Name (e.g. Double Monster, 4 Pcs, etc.) */}
                              <p className="text-xs font-extrabold text-amber-400">
                                {item.variantName}
                              </p>

                              {/* Modifiers & Add-ons list */}
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {item.modifiers.map((mod, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-zinc-800/90 text-zinc-200 border border-zinc-700"
                                    >
                                      {mod.startsWith("+") || mod.startsWith("NO") ? mod : `+ ${mod}`}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Tactile Checkbox */}
                          <div
                            className={`w-6 h-6 border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isItemChecked
                                ? "bg-emerald-500 border-emerald-500 text-black font-black"
                                : "border-zinc-700 bg-zinc-900 text-transparent"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ACTION BAR: Large Touch-Friendly Mobile Buttons */}
                  <div className="p-3 bg-[#18181C] border-t border-zinc-800 space-y-2">
                    {/* Primary Step Transition Button */}
                    {ticket.column === "QUEUED" && (
                      <button
                        type="button"
                        onClick={() => handleBump(ticket.id, "QUEUED")}
                        className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                      >
                        <Flame className="w-4 h-4" />
                        <span>START COOKING (MOVE TO PREP)</span>
                      </button>
                    )}

                    {ticket.column === "PREPARING" && (
                      <button
                        type="button"
                        onClick={() => handleBump(ticket.id, "PREPARING")}
                        className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>MARK READY FOR PICKUP</span>
                      </button>
                    )}

                    {ticket.column === "READY" && (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            triggerKitchenCall({
                              orderNumber: ticket.orderNumber,
                              kioskToken: ticket.kioskToken,
                              customerName: ticket.customerName,
                              fulfillmentType: ticket.fulfillmentType,
                              tableNumber: ticket.tableNumber,
                            })
                          }
                          className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>KITCHEN CALL (RING BELL & ANNOUNCE)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBump(ticket.id, "READY")}
                          className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-emerald-400" />
                          <span>DISPATCH & HAND OVER</span>
                        </button>
                      </div>
                    )}

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold px-1">
                      <span className="uppercase">
                        Stage:{" "}
                        <strong
                          className={
                            ticket.column === "QUEUED"
                              ? "text-amber-400"
                              : ticket.column === "PREPARING"
                              ? "text-sky-400"
                              : "text-emerald-400"
                          }
                        >
                          {ticket.column === "QUEUED"
                            ? "Incoming Order"
                            : ticket.column === "PREPARING"
                            ? "Active on Grill/Fryer"
                            : "Ready on Counter"}
                        </strong>
                      </span>

                      {allChecked && (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <Check className="w-3 h-3 stroke-[3]" /> All items cooked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
