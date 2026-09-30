import React from "react";
import {
  Users,
  Smartphone,
  QrCode,
  Monitor,
  ShoppingBag,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  TrendingUp,
  Flame,
  Package,
  Receipt,
  AlertTriangle,
  Radio,
  Sparkles,
} from "lucide-react";
import { LiveVisitorStats } from "../../lib/useLiveSiteVisitors";
import { formatNPR } from "../../lib/utils";

interface Props {
  visitorStats: LiveVisitorStats;
  totalRevenue: number;
  totalOrders: number;
  activeKitchenOrders: number;
  readyOrders: number;
  lowStockCount: number;
}

export const LiveSiteVisitorsBanner: React.FC<Props> = ({
  visitorStats,
  totalRevenue,
  totalOrders,
  activeKitchenOrders,
  readyOrders,
  lowStockCount,
}) => {
  const {
    totalVisitors,
    mobileCount,
    desktopCount,
    tableQrCount,
    activeCartsCount,
    wssLive,
    wssLatencyMs,
    peakStatus,
    trafficTrend,
    soundEnabled,
    toggleSound,
  } = visitorStats;

  // Render SVG mini-sparkline safely
  const safeTrend = Array.isArray(trafficTrend) && trafficTrend.length > 1
    ? trafficTrend
    : [8, 10, 12, 14, 16, 14, 15, 18, 16, 17];
  const maxVal = Math.max(...safeTrend, 1);
  const minVal = Math.min(...safeTrend, 0);
  const range = maxVal - minVal || 1;
  const points = safeTrend
    .map((val, idx) => {
      const x = (idx / (safeTrend.length - 1)) * 100;
      const y = 30 - ((val - minVal) / range) * 24;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-3">
      {/* -------------------------------------------------------------
          TOP LIVE STOREFRONT RADAR & REAL-TIME PRESENCE CARD
      ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-none border border-zinc-800 bg-gradient-to-r from-[#121214] via-[#151518] to-[#121214] p-3.5 sm:p-4 shadow-lg">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 -mt-12 w-64 h-24 bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-20 bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Big Live Counter with Pulse Radar */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
            {/* Live Indicator Icon */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-none bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-[#121214]" />
                </span>
                <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-zinc-100 tracking-tight">
                    {totalVisitors}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-none bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live on Site
                  </span>
                  <span className="hidden sm:inline-block text-[11px] font-medium text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-none">
                    ⚡ {peakStatus}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                  <span>Active Storefront Users Browsing & Ordering</span>
                  <span className="text-zinc-600 hidden md:inline">•</span>
                  <span className="text-zinc-400 hidden md:inline font-mono text-[11px]">
                    {activeCartsCount} in checkout / carts
                  </span>
                </p>
              </div>
            </div>

            {/* Sparkline Visual */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-none bg-zinc-900/60 border border-zinc-800/80">
              <div className="w-24 h-8">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 32">
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono leading-tight">
                <div className="text-emerald-400 font-bold">+18%</div>
                <div>Trend</div>
              </div>
            </div>
          </div>

          {/* Center/Right: Device Breakdown & Channel Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Mobile Visitors */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-zinc-900/80 border border-zinc-800 text-xs">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-zinc-400">Mobile:</span>
              <span className="font-mono font-bold text-zinc-100">{mobileCount}</span>
            </div>

            {/* Table QR Guests */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-zinc-900/80 border border-zinc-800 text-xs">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-400">Table QR:</span>
              <span className="font-mono font-bold text-zinc-100">{tableQrCount}</span>
            </div>

            {/* Desktop / Web Storefront */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none bg-zinc-900/80 border border-zinc-800 text-xs">
              <Monitor className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-zinc-400">Desktop:</span>
              <span className="font-mono font-bold text-zinc-100">{desktopCount}</span>
            </div>

            {/* WSS Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-none border text-xs font-mono transition-colors ${
                wssLive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
              title={`WebSocket Connection: ${wssLive ? "Active" : "Reconnecting"} (Latency ~${wssLatencyMs}ms)`}
            >
              {wssLive ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="font-semibold hidden sm:inline">WSS Live</span>
                  <span className="text-[10px] opacity-80">{wssLatencyMs}ms</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-semibold">Reconnecting</span>
                </>
              )}
            </div>

            {/* Chime Sound Alert Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-1.5 rounded-none border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                soundEnabled
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                  : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200"
              }`}
              title={soundEnabled ? "Order Alert Chime is ON (Click to mute)" : "Order Alert Chime is MUTED (Click to enable)"}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline font-medium text-[11px]">Chime ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden md:inline font-medium text-[11px]">Muted</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          OPERATIONAL BUSINESS KPIS STRIP (Clean & Compact)
      ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Net Sales */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Today's Net Sales
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-emerald-400">
              {formatNPR(totalRevenue)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-none bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Orders Today
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-zinc-100">
              {totalOrders}
            </span>
          </div>
          <div className="w-8 h-8 rounded-none bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        {/* Active Kitchen Queue */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              In Kitchen Queue
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-amber-400">
              {activeKitchenOrders}
            </span>
          </div>
          <div className="w-8 h-8 rounded-none bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {/* Ready for Pickup */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Ready / Pickup
            </span>
            <span className="font-mono text-sm sm:text-base font-bold text-sky-400">
              {readyOrders}
            </span>
          </div>
          <div className="w-8 h-8 rounded-none bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* Low Stock or Status */}
        <div className="col-span-2 sm:col-span-1 bg-[#121214] border border-zinc-800/80 rounded-none p-2.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Low Stock Alerts
            </span>
            <span
              className={`font-mono text-sm sm:text-base font-bold ${
                lowStockCount > 0 ? "text-rose-400" : "text-zinc-400"
              }`}
            >
              {lowStockCount} {lowStockCount === 1 ? "item" : "items"}
            </span>
          </div>
          <div
            className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${
              lowStockCount > 0
                ? "bg-rose-500/10 text-rose-400 animate-pulse"
                : "bg-zinc-800 text-zinc-500"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
