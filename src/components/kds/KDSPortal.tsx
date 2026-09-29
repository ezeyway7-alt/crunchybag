import React, { useState, useEffect, useMemo } from "react";
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
  CheckCircle2,
  Bell,
  Grid,
  Columns,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { KdsColumn, KdsTicket, FulfillmentType, Order } from "../../types";
import { usePosSession, usePosCommand, posOrderToOrder } from "../../lib/posApi";
import { usePosOrderFeed } from "../../lib/posWorkspace";
import { formatTimer } from "../../lib/utils";
import { SkeletonTicketGrid } from "../common/Skeleton";
import { INITIAL_KDS_TICKETS, INITIAL_ORDERS } from "../../mock/data";

// Subtle Web Audio chime for kitchen feedback
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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "complete") {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
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
    kdsSoundEnabled,
    setKdsSoundEnabled,
    currentOutlet,
    addToast,
    isLoadingSkeleton,
    kdsTickets: appKdsTickets,
    bumpKdsTicket,
    orders: appOrders,
    triggerKitchenCall: appTriggerKitchenCall,
  } = useApp();

  const posSession = usePosSession();
  const posCommand = usePosCommand(posSession);
  const feed = usePosOrderFeed(posSession, { kitchen: true });

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derive active kitchen tickets (server live feed first, fallback to context/mock)
  const kdsTickets: (KdsTicket & { orderNotes?: string })[] = useMemo(() => {
    if (feed.results && feed.results.length > 0) {
      return feed.results.map((source) => {
        const order = posOrderToOrder(source, currentOutlet.name);
        return {
          id: String(source.id),
          orderNumber: order.orderNumber,
          station: "",
          fulfillmentType: order.fulfillmentType,
          column:
            source.status === "READY"
              ? "READY"
              : source.status === "PREPARING"
              ? "PREPARING"
              : "QUEUED",
          items: source.items
            .filter((i) => !i.is_voided && i.requires_kitchen)
            .flatMap((item) =>
              item.combo_components?.length
                ? item.combo_components
                    .filter((c) => c.requires_kitchen)
                    .map((component, index) => ({
                      id: `${item.id}-${index}`,
                      productName: component.product_name,
                      variantName: component.variant_name,
                      quantity: component.quantity * item.quantity,
                      modifiers: component.modifiers.map((m) => m.name),
                    }))
                : [
                    {
                      id: String(item.id),
                      productName: item.product_name,
                      variantName: item.variant_name,
                      quantity: item.quantity,
                      modifiers: [
                        ...item.modifiers.map((m) => m.name),
                        ...(item.item_notes ? [item.item_notes] : []),
                      ],
                    },
                  ]
            ),
          elapsedSeconds: Math.max(
            0,
            Math.floor((now - Date.parse(source.created_at)) / 1000)
          ),
          customerName: order.customerName,
          tableNumber: order.tableNumber,
          kioskToken: order.kioskToken,
          roundNumber: order.roundsCount,
          isAddOnRound: (order.roundsCount || 1) > 1,
          orderNotes: source.notes,
        };
      });
    }

    // Fallback to local AppContext tickets or initial tickets
    const sourceTickets =
      appKdsTickets && appKdsTickets.length > 0 ? appKdsTickets : INITIAL_KDS_TICKETS;

    return sourceTickets.map((t) => ({
      ...t,
      orderNotes: (t as any).orderNotes || "",
    }));
  }, [feed.results, appKdsTickets, currentOutlet.name, now]);

  const orders: Order[] = useMemo(() => {
    if (feed.results && feed.results.length > 0) {
      return feed.results.map((o) => posOrderToOrder(o, currentOutlet.name));
    }
    return appOrders && appOrders.length > 0 ? appOrders : INITIAL_ORDERS;
  }, [feed.results, appOrders, currentOutlet.name]);

  useEffect(() => {
    const error = feed.error || posSession.error || posCommand.error;
    if (error) {
      addToast({ title: "Kitchen request failed", description: error, type: "error" });
    }
  }, [feed.error, posSession.error, posCommand.error, addToast]);

  const triggerKitchenCall = async (info: {
    orderNumber: string;
    kioskToken?: string;
    customerName: string;
    fulfillmentType?: FulfillmentType | string;
    tableNumber?: string;
  }) => {
    const order = feed.results.find((o) => o.order_number === info.orderNumber);
    if (order) {
      await posCommand.run(`${order.id}/call/`, { version: order.version });
    } else if (appTriggerKitchenCall) {
      appTriggerKitchenCall(info);
    }
    if (kdsSoundEnabled) playKitchenChime("complete");
  };

  // Queue stage filter (All, Incoming, Cooking, Ready)
  const [activeStage, setActiveStage] = useState<KdsColumn | "ALL">("ALL");
  const [isStageLoading, setIsStageLoading] = useState(false);

  const handleStageChange = (stage: KdsColumn | "ALL") => {
    if (stage === activeStage) return;
    setIsStageLoading(true);
    setActiveStage(stage);
    setTimeout(() => setIsStageLoading(false), 150);
  };

  // Fulfillment filter (All, Dine-in, Takeaway, Delivery)
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentType | "ALL">("ALL");

  // Search by token number, table, or order #
  const [searchQuery, setSearchQuery] = useState("");

  // Individual item check states (for cooks ticking off items as they grill/fry)
  const [completedItemIds, setCompletedItemIds] = useState<Record<string, boolean>>({});

  // Layout view mode: compact grid vs kanban 3-lane
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");

  // Ultra-compact density toggle for 14-inch screens during rush hours
  const [density, setDensity] = useState<"compact" | "ultra">("compact");

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

  const handleBump = async (ticketId: string, currentColumn: KdsColumn) => {
    const order = feed.results.find((o) => String(o.id) === ticketId);
    if (order) {
      const status =
        currentColumn === "QUEUED"
          ? order.status === "PENDING"
            ? "ACCEPTED"
            : "PREPARING"
          : currentColumn === "PREPARING"
          ? "READY"
          : order.fulfillment_type === "DELIVERY"
          ? "OUT_FOR_DELIVERY"
          : "COMPLETED";
      const result = await posCommand.run(`${order.id}/transition/`, {
        version: order.version,
        status,
      });
      if (result && kdsSoundEnabled) {
        playKitchenChime(currentColumn === "READY" ? "complete" : "advance");
      }
    } else {
      // Local AppContext fallback
      bumpKdsTicket(ticketId);
      if (kdsSoundEnabled) {
        playKitchenChime(currentColumn === "READY" ? "complete" : "advance");
      }
    }
  };

  // Filter tickets based on stage, fulfillment, and search
  const filteredTickets = useMemo(() => {
    return kdsTickets.filter((ticket) => {
      if (activeStage !== "ALL" && ticket.column !== activeStage) return false;
      if (fulfillmentFilter !== "ALL" && ticket.fulfillmentType !== fulfillmentFilter)
        return false;

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
  }, [kdsTickets, activeStage, fulfillmentFilter, searchQuery]);

  // Stage counts
  const countQueued = kdsTickets.filter((t) => t.column === "QUEUED").length;
  const countPreparing = kdsTickets.filter((t) => t.column === "PREPARING").length;
  const countReady = kdsTickets.filter((t) => t.column === "READY").length;

  const getFulfillmentBadge = (type: FulfillmentType, tableNumber?: string) => {
    switch (type) {
      case "DINE_IN":
        return {
          icon: <UtensilsCrossed className="w-3 h-3 text-amber-400" />,
          label: tableNumber ? `${tableNumber.toUpperCase()}` : "DINE-IN",
          badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/40",
        };
      case "TAKEAWAY":
        return {
          icon: <ShoppingBag className="w-3 h-3 text-sky-400" />,
          label: "TAKEAWAY",
          badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/40",
        };
      case "DELIVERY":
        return {
          icon: <Bike className="w-3 h-3 text-emerald-400" />,
          label: "DELIVERY",
          badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
        };
      default:
        return {
          icon: <ShoppingBag className="w-3 h-3 text-zinc-400" />,
          label: "ORDER",
          badgeColor: "bg-zinc-800 text-zinc-300 border-zinc-700",
        };
    }
  };

  // Render individual compact ticket card
  const renderTicketCard = (ticket: KdsTicket & { orderNotes?: string }) => {
    const matchedOrder = orders.find(
      (o) =>
        o.orderNumber === ticket.orderNumber ||
        (o.kioskToken && o.kioskToken === ticket.kioskToken)
    );

    const customerNotes = matchedOrder?.notes || ticket.orderNotes;
    const isOverdue = ticket.elapsedSeconds > 15 * 60;
    const isUrgent = ticket.elapsedSeconds > 8 * 60 && !isOverdue;
    const packaging = getFulfillmentBadge(ticket.fulfillmentType, ticket.tableNumber);

    const totalItemsCount = ticket.items.reduce((sum, item) => sum + item.quantity, 0);
    const checkedCount = ticket.items.filter(
      (item) => completedItemIds[`${ticket.id}-${item.id}`]
    ).length;
    const allChecked = checkedCount === ticket.items.length && ticket.items.length > 0;

    const isUltra = density === "ultra";

    return (
      <div
        key={ticket.id}
        className={`bg-[#121215] border rounded-md flex flex-col justify-between transition-all duration-150 shadow-sm overflow-hidden ${
          isOverdue
            ? "border-rose-500 shadow-rose-950/30 ring-1 ring-rose-500/60"
            : isUrgent
            ? "border-amber-500 shadow-amber-950/20"
            : ticket.column === "READY"
            ? "border-emerald-500/60"
            : ticket.column === "PREPARING"
            ? "border-sky-500/60"
            : "border-zinc-800 hover:border-zinc-700"
        }`}
      >
        {/* CARD TOP BAR: Token, Table, Customer & Live Elapsed Timer */}
        <div
          className={`bg-[#16161a] border-b border-zinc-800/80 ${
            isUltra ? "p-1.5 space-y-1" : "p-2 sm:p-2.5 space-y-1.5"
          }`}
        >
          {/* Row 1: Token Slip, Order Number, Fulfillment Badge & Elapsed Timer */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Primary Token Callout */}
              <span className="font-mono text-sm sm:text-base font-black text-amber-400 tracking-wide leading-none shrink-0">
                {ticket.kioskToken || ticket.orderNumber}
              </span>

              {/* Order Number (if token differs) */}
              {ticket.kioskToken && (
                <span className="font-mono text-[10px] text-zinc-500 font-semibold shrink-0">
                  #{ticket.orderNumber}
                </span>
              )}

              {/* Fulfillment Type / Table Pill */}
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase shrink-0 ${packaging.badgeColor}`}
              >
                {packaging.icon}
                <span>{packaging.label}</span>
              </span>

              {ticket.isAddOnRound && (
                <span className="px-1 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded uppercase tracking-wider shrink-0">
                  R{ticket.roundNumber || 2}
                </span>
              )}
            </div>

            {/* Live Timer Badge with Rush Warning */}
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 font-mono text-[11px] font-black rounded shrink-0 ${
                isOverdue
                  ? "bg-rose-500 text-white animate-pulse"
                  : isUrgent
                  ? "bg-amber-500 text-black"
                  : "bg-zinc-800/90 text-zinc-300 border border-zinc-700/60"
              }`}
              title="Time elapsed since order placed"
            >
              <Clock className="w-3 h-3" />
              <span>{formatTimer(ticket.elapsedSeconds)}</span>
              {isOverdue && (
                <span className="text-[9px] uppercase tracking-tighter font-black">
                  RUSH
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Customer Name & Special Notes Banner */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-medium text-zinc-300 truncate max-w-[170px]">
              {ticket.customerName || "Walk-in Guest"}
            </span>

            <span className="text-[10px] font-mono text-zinc-500">
              {ticket.items.length} {ticket.items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Customer Special Preparation Instruction (Only shown if note exists) */}
          {customerNotes && (
            <div className="px-1.5 py-1 bg-amber-500/10 border-l-2 border-amber-500 text-amber-300 text-[11px] font-semibold flex items-start gap-1 rounded-r leading-tight">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">"{customerNotes}"</span>
            </div>
          )}
        </div>

        {/* CARD ITEMS LIST: High-density, crystal clear typography */}
        <div
          className={`flex-1 divide-y divide-zinc-800/70 overflow-hidden ${
            isUltra ? "p-1.5 space-y-1" : "p-2 sm:p-2.5 space-y-1.5"
          }`}
        >
          {ticket.items.map((item) => {
            const itemKey = `${ticket.id}-${item.id}`;
            const isItemChecked = !!completedItemIds[itemKey];

            return (
              <div
                key={item.id}
                onClick={() => toggleItemCheck(ticket.id, item.id)}
                className={`flex items-start justify-between gap-2 cursor-pointer select-none transition-all rounded px-1 -mx-1 ${
                  isUltra ? "pt-1" : "pt-1.5"
                } ${
                  isItemChecked
                    ? "opacity-35 line-through"
                    : "hover:bg-zinc-800/40"
                }`}
              >
                {/* Quantity Box + Product & Modifiers */}
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  {/* High Contrast Quantity Box */}
                  <span
                    className={`font-mono text-xs font-black w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                      isItemChecked
                        ? "bg-zinc-800 text-zinc-500"
                        : "bg-amber-500 text-black shadow-sm"
                    }`}
                  >
                    {item.quantity}×
                  </span>

                  {/* Product Name, Variant & Clean Modifier Bullets */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-xs font-black text-white leading-tight">
                        {item.productName}
                      </span>
                      {item.variantName && (
                        <span className="text-[11px] font-bold text-amber-400">
                          {item.variantName}
                        </span>
                      )}
                    </div>

                    {/* Modifiers as clean inline bullet string */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="text-[10px] text-zinc-300 font-medium flex flex-wrap gap-x-1.5 gap-y-0.5 pt-0.5">
                        {item.modifiers.map((mod, idx) => (
                          <span key={idx} className="inline-flex items-center gap-0.5">
                            <span className="text-zinc-500">•</span>
                            <span>
                              {mod.startsWith("+") || mod.startsWith("NO")
                                ? mod
                                : `+ ${mod}`}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tactile Cross-off Checkbox */}
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isItemChecked
                      ? "bg-emerald-500 border-emerald-500 text-black font-black"
                      : "border-zinc-700 bg-zinc-900/80 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CARD ACTION FOOTER: Streamlined height buttons */}
        <div
          className={`bg-[#16161a] border-t border-zinc-800/80 ${
            isUltra ? "p-1.5 space-y-1" : "p-2 sm:p-2.5 space-y-1.5"
          }`}
        >
          {ticket.column === "QUEUED" && (
            <button
              type="button"
              onClick={() => handleBump(ticket.id, "QUEUED")}
              className="w-full h-8 sm:h-8.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 rounded transition-all active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>START COOKING</span>
            </button>
          )}

          {ticket.column === "PREPARING" && (
            <button
              type="button"
              onClick={() => handleBump(ticket.id, "PREPARING")}
              className="w-full h-8 sm:h-8.5 bg-sky-500 hover:bg-sky-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 rounded transition-all active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>MARK READY</span>
            </button>
          )}

          {ticket.column === "READY" && (
            <div className="flex items-center gap-1.5">
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
                className="flex-1 h-8 sm:h-8.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1 rounded transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                title="Ring kitchen bell & call guest"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>CALL</span>
              </button>

              <button
                type="button"
                onClick={() => handleBump(ticket.id, "READY")}
                className="flex-1 h-8 sm:h-8.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1 rounded transition-all active:scale-[0.98] cursor-pointer shadow-sm"
              >
                <Package className="w-3.5 h-3.5" />
                <span>DISPATCH</span>
              </button>
            </div>
          )}

          {/* Micro Progress Line */}
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold px-0.5">
            <span>
              {allChecked ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Check className="w-3 h-3 stroke-[3]" /> All items cooked
                </span>
              ) : (
                <span>
                  Prep:{" "}
                  <strong className="text-zinc-200">
                    {checkedCount}/{totalItemsCount}
                  </strong>
                </span>
              )}
            </span>
            <span className="uppercase text-[9px] tracking-wider text-zinc-500">
              {ticket.column === "QUEUED"
                ? "Incoming"
                : ticket.column === "PREPARING"
                ? "Cooking"
                : "Ready"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full min-h-[calc(100vh-60px)] bg-[#09090B] text-zinc-100 flex flex-col font-sans">
      {/* Pending Action Recovery (POS Session edge cases) */}
      {posCommand.hasPending && (
        <div className="bg-amber-500 text-black px-3 py-1 text-xs font-bold flex items-center justify-between">
          <span>Pending kitchen sync action exists</span>
          <button
            className="px-2 py-0.5 bg-black text-amber-400 rounded text-[10px] font-black uppercase cursor-pointer"
            disabled={posCommand.busy}
            onClick={() => posCommand.recover()}
          >
            Recover
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          COMPACT TOP CONTROL BAR: Fits seamlessly on 14-inch screens
          Replaces the bulky 3-row header with a sleek, consolidated bar.
      ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-[#101013] border-b border-zinc-800 px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-md shrink-0">
        <div className="w-full flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          {/* Section 1: Brand & Live Active Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-amber-500 text-black rounded flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <h1 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase">
                  KDS
                </h1>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {kdsTickets.length} ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-none mt-0.5 hidden sm:block">
                {currentOutlet.name}
              </p>
            </div>
          </div>

          {/* Section 2: Queue Stage Filters (Sleek Compact Segmented Pills) */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded p-0.5 gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => handleStageChange("ALL")}
              className={`h-7 px-2 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                activeStage === "ALL"
                  ? "bg-zinc-100 text-black shadow-sm font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>All</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  activeStage === "ALL"
                    ? "bg-zinc-300 text-black"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {kdsTickets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStageChange("QUEUED")}
              className={`h-7 px-2 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                activeStage === "QUEUED"
                  ? "bg-amber-500 text-black shadow-sm font-black"
                  : "text-amber-400/90 hover:text-amber-300"
              }`}
            >
              <span>Incoming</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  activeStage === "QUEUED"
                    ? "bg-amber-600 text-black font-black"
                    : "bg-amber-500/15 text-amber-400 font-bold"
                }`}
              >
                {countQueued}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStageChange("PREPARING")}
              className={`h-7 px-2 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                activeStage === "PREPARING"
                  ? "bg-sky-500 text-black shadow-sm font-black"
                  : "text-sky-400/90 hover:text-sky-300"
              }`}
            >
              <span>Cooking</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  activeStage === "PREPARING"
                    ? "bg-sky-600 text-black font-black"
                    : "bg-sky-500/15 text-sky-400 font-bold"
                }`}
              >
                {countPreparing}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStageChange("READY")}
              className={`h-7 px-2 text-xs font-bold rounded flex items-center gap-1 transition-all cursor-pointer ${
                activeStage === "READY"
                  ? "bg-emerald-500 text-black shadow-sm font-black"
                  : "text-emerald-400/90 hover:text-emerald-300"
              }`}
            >
              <span>Ready</span>
              <span
                className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                  activeStage === "READY"
                    ? "bg-emerald-600 text-black font-black"
                    : "bg-emerald-500/15 text-emerald-400 font-bold"
                }`}
              >
                {countReady}
              </span>
            </button>
          </div>

          {/* Section 3: Search, Fulfillment Filter & Quick Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Token / table / item..."
                className="h-7 w-24 sm:w-36 lg:w-44 pl-6 pr-5 bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 rounded focus:outline-none focus:border-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Dining / Fulfillment Select */}
            <select
              value={fulfillmentFilter}
              onChange={(e) =>
                setFulfillmentFilter(e.target.value as FulfillmentType | "ALL")
              }
              className="h-7 px-1.5 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-semibold rounded focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="DINE_IN">🍽️ Dine-In</option>
              <option value="TAKEAWAY">🛍️ Takeaway</option>
              <option value="DELIVERY">🛵 Delivery</option>
            </select>

            {/* Density Toggle (Standard vs Ultra-Compact for 14-inch screen) */}
            <button
              type="button"
              onClick={() =>
                setDensity((prev) => (prev === "compact" ? "ultra" : "compact"))
              }
              title={`Switch Density (Current: ${
                density === "ultra" ? "Ultra-Compact" : "Standard Compact"
              })`}
              className={`h-7 px-2 text-[11px] font-bold border rounded flex items-center gap-1 cursor-pointer transition-colors ${
                density === "ultra"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span className="hidden xl:inline">
                {density === "ultra" ? "Dense" : "Normal"}
              </span>
            </button>

            {/* Grid vs Kanban View Toggle */}
            <div className="hidden md:flex items-center border border-zinc-800 bg-zinc-900 rounded p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Card Grid Mode"
                className={`h-6 px-1.5 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-amber-500 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Grid className="w-3 h-3" />
                <span className="hidden xl:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                title="3-Lane Kanban Mode"
                className={`h-6 px-1.5 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-amber-500 text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Columns className="w-3 h-3" />
                <span className="hidden xl:inline">Lanes</span>
              </button>
            </div>

            {/* Audio Alert Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !kdsSoundEnabled;
                setKdsSoundEnabled(next);
                if (next) playKitchenChime("advance");
              }}
              className={`w-7 h-7 border rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                kdsSoundEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800"
              }`}
              title={kdsSoundEnabled ? "Kitchen Chimes ON" : "Kitchen Chimes MUTED"}
            >
              {kdsSoundEnabled ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Kitchen Call Test Trigger */}
            <button
              type="button"
              onClick={() =>
                triggerKitchenCall({
                  orderNumber: "CR-8921",
                  kioskToken: "TK-4821",
                  customerName: "Aayush Shrestha",
                  fulfillmentType: "DINE_IN",
                  tableNumber: "Table 04",
                })
              }
              className="w-7 h-7 bg-amber-500 hover:bg-amber-400 text-black rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
              title="Test Kitchen Call Audio & TV Announcement"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Mode */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-7 h-7 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Fullscreen Display"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN KITCHEN WORKSPACE: Max Details Visible for 14-inch Displays
      ------------------------------------------------------------- */}
      <main className="w-full p-2 sm:p-2.5 flex-1 overflow-y-auto">
        {isLoadingSkeleton || isStageLoading ? (
          <SkeletonTicketGrid count={6} />
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center space-y-2 bg-[#121215] border border-zinc-800 rounded-md p-6 my-2 max-w-xl mx-auto">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded flex items-center justify-center mx-auto">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              No Kitchen Tickets in Queue
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery || fulfillmentFilter !== "ALL" || activeStage !== "ALL"
                ? "No active orders match the current filters. Try resetting the stage or search query."
                : "All orders have been prepared and dispatched. Incoming tickets will alert with sound chime."}
            </p>
            {(searchQuery || fulfillmentFilter !== "ALL" || activeStage !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setActiveStage("ALL");
                  setFulfillmentFilter("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded cursor-pointer transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : viewMode === "kanban" ? (
          /* KANBAN 3-LANE VIEW: Incoming | Cooking | Ready */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-start">
            {/* Lane 1: Incoming */}
            <div className="flex flex-col bg-[#0e0e11] border border-zinc-800/90 rounded-md overflow-hidden">
              <div className="h-8 px-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Incoming Queue
                </span>
                <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                  {countQueued}
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                {filteredTickets.filter((t) => t.column === "QUEUED").length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 py-8 font-medium">
                    No incoming orders
                  </p>
                ) : (
                  filteredTickets
                    .filter((t) => t.column === "QUEUED")
                    .map((ticket) => renderTicketCard(ticket))
                )}
              </div>
            </div>

            {/* Lane 2: Cooking */}
            <div className="flex flex-col bg-[#0e0e11] border border-zinc-800/90 rounded-md overflow-hidden">
              <div className="h-8 px-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  On Grill / Fryer
                </span>
                <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                  {countPreparing}
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                {filteredTickets.filter((t) => t.column === "PREPARING").length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 py-8 font-medium">
                    No orders being cooked
                  </p>
                ) : (
                  filteredTickets
                    .filter((t) => t.column === "PREPARING")
                    .map((ticket) => renderTicketCard(ticket))
                )}
              </div>
            </div>

            {/* Lane 3: Ready */}
            <div className="flex flex-col bg-[#0e0e11] border border-zinc-800/90 rounded-md overflow-hidden">
              <div className="h-8 px-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ready on Counter
                </span>
                <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                  {countReady}
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
                {filteredTickets.filter((t) => t.column === "READY").length === 0 ? (
                  <p className="text-center text-xs text-zinc-500 py-8 font-medium">
                    No orders awaiting pickup
                  </p>
                ) : (
                  filteredTickets
                    .filter((t) => t.column === "READY")
                    .map((ticket) => renderTicketCard(ticket))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* HIGH-DENSITY CARD GRID: Optimized for 14-inch Displays (3 to 4 columns, 2 rows visible without scroll) */
          <div
            className={`grid gap-2.5 items-start ${
              density === "ultra"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            }`}
          >
            {filteredTickets.map((ticket) => renderTicketCard(ticket))}
          </div>
        )}
      </main>
    </div>
  );
};
