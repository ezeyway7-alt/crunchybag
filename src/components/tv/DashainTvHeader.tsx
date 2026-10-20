import React from "react";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { Maximize2, Minimize2, X } from "lucide-react";

interface DashainTvHeaderProps {
  onSwitchToOrders: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onClose?: () => void;
}

export const DashainTvHeader: React.FC<DashainTvHeaderProps> = ({
  onSwitchToOrders,
  onToggleFullscreen,
  isFullscreen,
  onClose,
}) => {
  return (
    <header className="relative flex shrink-0 items-center justify-between gap-4 px-6 py-3 sm:px-10 sm:py-4 z-20 border-b border-amber-500/15 bg-gradient-to-b from-[#140b08]/90 via-[#0c0a0c]/80 to-transparent">
      {/* Ambient festive golden-red atmospheric glow in the header sky */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="dashain-halo absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-44 w-[750px] rounded-full bg-gradient-to-r from-amber-500/20 via-red-600/25 to-yellow-500/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>

      {/* LEFT: Crunchy Brand Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <CrunchyLogo size="md" className="h-9 w-auto sm:h-11 drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]" />
      </div>

      {/* CENTER: 3D Animated Dashain Sky with Flying Kites & Festive Celebration */}
      <div className="relative flex flex-1 items-center justify-center min-w-0 max-w-4xl h-14 sm:h-16 px-2 overflow-visible">
        {/* Floating 3D Flying Kite 1 (Left Forefront - Traditional Crimson & Marigold Changa) */}
        <div
          className="dashain-kite-1 pointer-events-none absolute left-3 sm:left-12 md:left-20 -top-2 sm:-top-3 w-16 h-20 sm:w-20 sm:h-24 z-10 filter drop-shadow-[0_8px_16px_rgba(220,38,38,0.45)]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 70 95" className="w-full h-full overflow-visible">
            {/* Thread / Dhago curving down */}
            <path
              d="M 35 38 Q 30 75 10 95"
              fill="none"
              stroke="rgba(254, 240, 138, 0.55)"
              strokeWidth="0.9"
              strokeDasharray="2 1"
            />
            {/* Diamond Kite Body */}
            <g>
              {/* Top-Left: Crimson Red */}
              <polygon points="35,2 3,35 35,35" fill="#dc2626" />
              {/* Top-Right: Marigold Orange */}
              <polygon points="35,2 67,35 35,35" fill="#f59e0b" />
              {/* Bottom-Left: Golden Yellow */}
              <polygon points="3,35 35,68 35,35" fill="#fbbf24" />
              {/* Bottom-Right: Emerald Green */}
              <polygon points="67,35 35,68 35,35" fill="#059669" />

              {/* Central Bamboo Spine (ठाडो सिन्का) */}
              <line x1="35" y1="1" x2="35" y2="69" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
              {/* Curved Bamboo Bow (धनुष सिन्का) */}
              <path d="M 3 35 Q 35 14 67 35" fill="none" stroke="#92400e" strokeWidth="1.8" strokeLinecap="round" />

              {/* Auspicious Center Medallion */}
              <circle cx="35" cy="35" r="5" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" />
              <circle cx="35" cy="35" r="2.2" fill="#dc2626" />

              {/* Bottom Corner Accent */}
              <polygon points="30,68 40,68 35,74" fill="#dc2626" />
            </g>

            {/* Fluttering Ribbon Tails */}
            <g className="dashain-tail">
              <path
                d="M 35 73 Q 32 82 38 88 T 34 98"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M 35 73 Q 39 81 33 87 T 37 99"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* Floating 3D Flying Kite 2 (Right Forefront - Royal Cyan & Saffron Changa) */}
        <div
          className="dashain-kite-2 pointer-events-none absolute right-3 sm:right-12 md:right-20 -top-1 sm:-top-2 w-14 h-18 sm:w-18 sm:h-22 z-10 filter drop-shadow-[0_8px_16px_rgba(2,132,199,0.45)]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 70 95" className="w-full h-full overflow-visible">
            {/* Thread / Dhago */}
            <path
              d="M 35 38 Q 42 75 60 95"
              fill="none"
              stroke="rgba(254, 240, 138, 0.55)"
              strokeWidth="0.9"
              strokeDasharray="2 1"
            />
            {/* Diamond Kite Body */}
            <g>
              {/* Top-Left: Sky Blue */}
              <polygon points="35,2 3,35 35,35" fill="#0284c7" />
              {/* Top-Right: Saffron Orange */}
              <polygon points="35,2 67,35 35,35" fill="#ea580c" />
              {/* Bottom-Left: Purple */}
              <polygon points="3,35 35,68 35,35" fill="#7c3aed" />
              {/* Bottom-Right: Sunburst Gold */}
              <polygon points="67,35 35,68 35,35" fill="#facc15" />

              {/* Bamboo Spine */}
              <line x1="35" y1="1" x2="35" y2="69" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
              {/* Curved Bamboo Bow */}
              <path d="M 3 35 Q 35 14 67 35" fill="none" stroke="#92400e" strokeWidth="1.6" strokeLinecap="round" />

              {/* Center Accent */}
              <circle cx="35" cy="35" r="4.5" fill="#fff7ed" stroke="#ea580c" strokeWidth="1" />
              <circle cx="35" cy="35" r="2" fill="#0284c7" />

              {/* Bottom Triangle */}
              <polygon points="30,68 40,68 35,73" fill="#ea580c" />
            </g>

            {/* Fluttering Ribbon Tail */}
            <g className="dashain-tail-rev">
              <path
                d="M 35 72 Q 40 80 32 86 T 38 98"
                fill="none"
                stroke="#e11d48"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 35 72 Q 31 79 38 85 T 32 97"
                fill="none"
                stroke="#facc15"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* Floating 3D Flying Kite 3 (Distant High Sky - Purple & Gold Mini Changa) */}
        <div
          className="dashain-kite-3 pointer-events-none absolute left-1/4 -top-3 sm:-top-4 w-10 h-14 sm:w-12 sm:h-16 hidden sm:block opacity-85 filter drop-shadow-[0_4px_10px_rgba(124,58,237,0.35)]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 70 95" className="w-full h-full overflow-visible">
            <polygon points="35,2 3,35 35,35" fill="#9333ea" />
            <polygon points="35,2 67,35 35,35" fill="#fbbf24" />
            <polygon points="3,35 35,68 35,35" fill="#ec4899" />
            <polygon points="67,35 35,68 35,35" fill="#06b6d4" />
            <line x1="35" y1="1" x2="35" y2="69" stroke="#581c87" strokeWidth="1.4" />
            <path d="M 3 35 Q 35 15 67 35" fill="none" stroke="#581c87" strokeWidth="1.4" />
            <path
              d="M 35 72 Q 38 79 32 85 T 36 94"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="dashain-tail"
            />
          </svg>
        </div>

        {/* Floating Marigold (Sayapatri) Petals & Festive Sparkles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* Marigold Petal 1 */}
          <span className="dashain-petal-1 absolute left-10 top-2 text-amber-400 text-xs sm:text-sm select-none">
            🍂
          </span>
          {/* Marigold Petal 2 */}
          <span className="dashain-petal-2 absolute left-1/3 top-6 text-yellow-400 text-xs sm:text-sm select-none">
            🌼
          </span>
          {/* Golden Sparkles */}
          <span className="dashain-sparkle-1 absolute left-1/4 top-1 text-amber-300 text-xs select-none">
            ✦
          </span>
          <span className="dashain-sparkle-2 absolute right-1/4 top-2 text-yellow-300 text-xs select-none">
            ✦
          </span>
          <span className="dashain-sparkle-3 absolute right-12 bottom-1 text-amber-200 text-[10px] select-none">
            ★
          </span>
        </div>

        {/* FESTIVE CENTERPIECE: Happy Dashain / शुभ विजया दशमी */}
        <div className="relative flex flex-col items-center justify-center text-center px-4 py-1 z-10">
          {/* Top Line: Auspicious Greeting in Devanagari */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-amber-400 text-xs sm:text-sm animate-pulse">✨</span>
            <span className="font-serif text-xs sm:text-sm md:text-[15px] font-bold tracking-[0.25em] text-amber-300 uppercase drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]">
              शुभ विजया दशमी
            </span>
            <span className="text-amber-400 text-xs sm:text-sm animate-pulse">✨</span>
          </div>

          {/* Main Title: 3D HAPPY DASHAIN */}
          <h1 className="dashain-shimmer-text font-black text-xl sm:text-2xl md:text-3xl lg:text-[2rem] uppercase tracking-[0.22em] leading-tight filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
            HAPPY DASHAIN
          </h1>
        </div>
      </div>

      {/* RIGHT: Essential TV Display Controls */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          type="button"
          onClick={onSwitchToOrders}
          className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-200 transition-all hover:bg-amber-500/20 hover:text-white hover:border-amber-500/40 sm:text-sm"
        >
          Order board
        </button>

        <button
          id="tv-fullscreen-toggle"
          type="button"
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg border border-white/10 text-zinc-400 transition-colors hover:text-white hover:border-white/25 hover:bg-white/5"
          title="Toggle TV fullscreen"
          aria-label="Toggle TV fullscreen"
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5 sm:h-5 sm:w-5" /> : <Maximize2 className="h-5 w-5 sm:h-5 sm:w-5" />}
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/10 text-zinc-400 transition-colors hover:text-white hover:border-white/25 hover:bg-white/5"
            title="Exit TV display"
            aria-label="Exit TV display"
          >
            <X className="h-5 w-5 sm:h-5 sm:w-5" />
          </button>
        )}
      </div>
    </header>
  );
};
