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
    <header className="relative flex shrink-0 items-center justify-between gap-4 px-6 py-3 sm:px-10 sm:py-4 z-30 overflow-visible border-b border-amber-500/20 bg-gradient-to-b from-[#140b08]/95 via-[#0c0a0c]/85 to-transparent">
      {/* Ambient festive golden-red atmospheric glow in the header sky */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="dashain-halo absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-48 w-[850px] rounded-full bg-gradient-to-r from-amber-500/25 via-red-600/30 to-yellow-500/25 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </div>

      {/* LEFT: Crunchy Brand Logo */}
      <div className="flex items-center gap-3 shrink-0 z-10">
        <CrunchyLogo size="md" className="h-9 w-auto sm:h-11 drop-shadow-[0_2px_12px_rgba(245,158,11,0.3)]" />
      </div>

      {/* CENTER: 3D Animated Dashain Sky with Flying Kites & Festive Celebration */}
      <div className="relative flex flex-1 items-center justify-center min-w-0 max-w-5xl h-14 sm:h-16 px-2 overflow-visible z-30">
        {/* Floating 3D Flying Kite 1 (Left Forefront - Traditional Crimson, Gold & Emerald Changa) */}
        {/* Overflowing significantly below the header into the screen foreground */}
        <div
          className="dashain-kite-1 pointer-events-none absolute left-2 sm:left-6 md:left-12 lg:left-16 -top-1 sm:-top-2 w-24 h-52 sm:w-28 sm:h-60 md:w-32 md:h-68 z-40 filter drop-shadow-[0_20px_28px_rgba(0,0,0,0.85)] drop-shadow-[0_4px_16px_rgba(220,38,38,0.55)]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 80 220" className="w-full h-full overflow-visible">
            {/* Long Trailing Thread / Dhago curving far down */}
            <path
              d="M 40 40 Q 25 100 12 160 T 4 220"
              fill="none"
              stroke="rgba(254, 240, 138, 0.65)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            {/* Diamond Kite Body */}
            <g>
              {/* Top-Left: Crimson Red */}
              <polygon points="40,4 4,40 40,40" fill="#dc2626" />
              {/* Top-Right: Marigold Orange */}
              <polygon points="40,4 76,40 40,40" fill="#f59e0b" />
              {/* Bottom-Left: Golden Amber */}
              <polygon points="4,40 40,76 40,40" fill="#fbbf24" />
              {/* Bottom-Right: Emerald Green */}
              <polygon points="76,40 40,76 40,40" fill="#059669" />

              {/* Central Bamboo Spine (ठाडो सिन्का) */}
              <line x1="40" y1="2" x2="40" y2="78" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
              {/* Curved Bamboo Bow (धनुष सिन्का) */}
              <path d="M 4 40 Q 40 16 76 40" fill="none" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />

              {/* Auspicious Center Medallion */}
              <circle cx="40" cy="40" r="5.5" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.2" />
              <circle cx="40" cy="40" r="2.5" fill="#dc2626" />

              {/* Bottom Tail Reinforcement Triangle */}
              <polygon points="34,76 46,76 40,84" fill="#dc2626" />
            </g>

            {/* Long Flowing Ribbon Tails with Flutter Ties (Overflowing Far Down Below) */}
            <g className="dashain-tail">
              {/* Main Golden Ribbon */}
              <path
                d="M 40 82 Q 28 112 50 142 T 26 182 T 44 218"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Twin Emerald Ribbon */}
              <path
                d="M 40 82 Q 52 110 30 140 T 54 180 T 36 216"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.6"
                strokeLinecap="round"
              />

              {/* Traditional Bow Ties along the tail */}
              {/* Bow 1 at y=112 (Emerald Green) */}
              <polygon points="34,110 44,114 36,118" fill="#10b981" />
              <polygon points="44,110 34,114 42,118" fill="#10b981" />
              <circle cx="39" cy="114" r="1.8" fill="#facc15" />

              {/* Bow 2 at y=146 (Crimson Red) */}
              <polygon points="35,144 47,148 37,152" fill="#ef4444" />
              <polygon points="47,144 35,148 45,152" fill="#ef4444" />
              <circle cx="41" cy="148" r="1.8" fill="#fef08a" />

              {/* Bow 3 at y=182 (Saffron Orange) */}
              <polygon points="32,180 44,184 34,188" fill="#f97316" />
              <polygon points="44,180 32,184 42,188" fill="#f97316" />
              <circle cx="38" cy="184" r="1.8" fill="#ffffff" />
            </g>
          </svg>
        </div>

        {/* Floating 3D Flying Kite 2 (Right Forefront - Royal Cyan & Saffron Changa) */}
        {/* Overflowing significantly below the header into the screen foreground */}
        <div
          className="dashain-kite-2 pointer-events-none absolute right-2 sm:right-6 md:right-12 lg:right-16 -top-0 sm:-top-1 w-22 h-48 sm:w-26 sm:h-56 md:w-30 md:h-64 z-40 filter drop-shadow-[0_20px_28px_rgba(0,0,0,0.85)] drop-shadow-[0_4px_16px_rgba(2,132,199,0.55)]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 80 220" className="w-full h-full overflow-visible">
            {/* Long Trailing Thread / Dhago */}
            <path
              d="M 40 40 Q 55 100 68 160 T 76 220"
              fill="none"
              stroke="rgba(254, 240, 138, 0.65)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            {/* Diamond Kite Body */}
            <g>
              {/* Top-Left: Sky Blue */}
              <polygon points="40,4 4,40 40,40" fill="#0284c7" />
              {/* Top-Right: Saffron Orange */}
              <polygon points="40,4 76,40 40,40" fill="#ea580c" />
              {/* Bottom-Left: Purple */}
              <polygon points="4,40 40,76 40,40" fill="#7c3aed" />
              {/* Bottom-Right: Sunburst Gold */}
              <polygon points="76,40 40,76 40,40" fill="#facc15" />

              {/* Bamboo Spine */}
              <line x1="40" y1="2" x2="40" y2="78" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
              {/* Curved Bamboo Bow */}
              <path d="M 4 40 Q 40 16 76 40" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />

              {/* Center Accent */}
              <circle cx="40" cy="40" r="5" fill="#fff7ed" stroke="#ea580c" strokeWidth="1.2" />
              <circle cx="40" cy="40" r="2.2" fill="#0284c7" />

              {/* Bottom Triangle */}
              <polygon points="34,76 46,76 40,83" fill="#ea580c" />
            </g>

            {/* Long Fluttering Ribbon Tail (Overflowing Far Down Below) */}
            <g className="dashain-tail-rev">
              <path
                d="M 40 82 Q 54 110 32 140 T 56 180 T 36 216"
                fill="none"
                stroke="#e11d48"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 40 82 Q 28 112 50 142 T 28 182 T 48 218"
                fill="none"
                stroke="#facc15"
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              {/* Bow 1 at y=110 (Crimson Rose) */}
              <polygon points="37,108 47,112 39,116" fill="#e11d48" />
              <polygon points="47,108 37,112 45,116" fill="#e11d48" />
              <circle cx="42" cy="112" r="1.6" fill="#fef08a" />

              {/* Bow 2 at y=144 (Cyan Teal) */}
              <polygon points="33,142 45,146 35,150" fill="#06b6d4" />
              <polygon points="45,142 33,146 43,150" fill="#06b6d4" />
              <circle cx="39" cy="146" r="1.6" fill="#ffffff" />

              {/* Bow 3 at y=180 (Purple) */}
              <polygon points="36,178 48,182 38,186" fill="#9333ea" />
              <polygon points="48,178 36,182 46,186" fill="#9333ea" />
              <circle cx="42" cy="182" r="1.6" fill="#facc15" />
            </g>
          </svg>
        </div>

        {/* Floating 3D Flying Kite 3 (Distant High Sky - Purple & Gold Mini Changa) */}
        <div
          className="dashain-kite-3 pointer-events-none absolute left-1/4 -top-3 sm:-top-4 w-12 h-20 sm:w-14 sm:h-24 hidden sm:block opacity-90 filter drop-shadow-[0_6px_14px_rgba(124,58,237,0.4)]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 70 120" className="w-full h-full overflow-visible">
            <polygon points="35,2 3,35 35,35" fill="#9333ea" />
            <polygon points="35,2 67,35 35,35" fill="#fbbf24" />
            <polygon points="3,35 35,68 35,35" fill="#ec4899" />
            <polygon points="67,35 35,68 35,35" fill="#06b6d4" />
            <line x1="35" y1="1" x2="35" y2="69" stroke="#581c87" strokeWidth="1.6" />
            <path d="M 3 35 Q 35 15 67 35" fill="none" stroke="#581c87" strokeWidth="1.6" />
            <path
              d="M 35 72 Q 42 85 28 98 T 38 116"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              className="dashain-tail"
            />
          </svg>
        </div>

        {/* Floating Marigold (Sayapatri) Petals & Festive Sparkles */}
        <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
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
        <div className="relative flex flex-col items-center justify-center text-center px-4 py-1 z-20">
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
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 z-10">
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
