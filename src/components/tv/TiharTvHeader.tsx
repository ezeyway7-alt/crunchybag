import React from "react";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { Maximize2, Minimize2, X } from "lucide-react";

interface TiharTvHeaderProps {
  onSwitchToOrders?: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onClose?: () => void;
}

/* -------------------------------------------------------------
   MAIN COMPONENT: TiharTvHeader (Top banner at z-35)
   Grand, spacious festive presence matching previous size
------------------------------------------------------------- */
export const TiharTvHeader: React.FC<TiharTvHeaderProps> = ({
  onToggleFullscreen,
  isFullscreen,
  onClose,
}) => {
  return (
    <header className="relative flex shrink-0 items-center justify-between gap-2 px-4 py-2.5 sm:px-6 sm:py-3.5 min-h-[4.75rem] sm:min-h-[5.5rem] z-35 overflow-visible border-b border-amber-500/30 bg-gradient-to-b from-[#180d07]/95 via-[#0e0a0a]/90 to-[#0e0a0a]/80 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      {/* Ambient festive golden-ruby atmospheric sky aura */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="tihar-halo absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-52 w-[960px] rounded-full bg-gradient-to-r from-amber-500/25 via-orange-600/35 to-yellow-500/25 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      </div>

      {/* LEFT: Crunchy Brand Logo */}
      <div className="flex items-center gap-3 shrink-0 z-20 pl-2 sm:pl-4">
        <CrunchyLogo
          size="md"
          className="h-9 w-auto sm:h-11 drop-shadow-[0_2px_14px_rgba(245,158,11,0.45)]"
        />
      </div>

      {/* CENTER: FESTIVE SUVKAMNA CENTERPIECE */}
      <div className="relative flex flex-1 items-center justify-center min-w-0 max-w-5xl px-2 overflow-visible z-20 text-center">
        {/* Floating golden festival sparkles & sayapatri petal drifts */}
        <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
          <span className="tihar-sparkle-1 absolute -top-1 left-8 text-amber-300 text-sm select-none">
            ✦
          </span>
          <span className="tihar-sparkle-2 absolute top-2 right-8 text-yellow-300 text-xs select-none">
            ★
          </span>
          <span className="tihar-sparkle-3 absolute -bottom-1 left-1/4 text-amber-200 text-xs select-none">
            ✦
          </span>
          <span className="tihar-sparkle-2 absolute top-0 right-1/4 text-orange-300 text-sm select-none">
            ✨
          </span>
        </div>

        <div className="relative flex items-center justify-center text-center px-1 z-20">
          {/* PRIMARY: PROMINENT NEPALI GREETING */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-amber-400 text-xl sm:text-2xl lg:text-3xl filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)] animate-pulse">
              🪔
            </span>
            <h1 className="tihar-shimmer-text font-black text-xl sm:text-2xl md:text-3xl lg:text-[2.35rem] xl:text-[2.65rem] tracking-wide leading-tight filter drop-shadow-[0_4px_18px_rgba(245,158,11,0.7)]">
              शुभ दीपावली तथा छठ पर्वको हार्दिक शुभकामना
            </h1>
            <span className="text-amber-400 text-xl sm:text-2xl lg:text-3xl filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)] animate-pulse">
              🪔
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Display Controls */}
      <div className="flex items-center gap-2 shrink-0 z-20 pr-2 sm:pr-4">
        <button
          id="tv-fullscreen-toggle"
          type="button"
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg border border-white/10 text-zinc-400 transition-colors hover:text-white hover:border-white/25 hover:bg-white/5"
          title="Toggle TV fullscreen"
          aria-label="Toggle TV fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Maximize2 className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-zinc-400 transition-colors hover:text-white hover:border-white/25 hover:bg-white/5"
            title="Exit TV display"
            aria-label="Exit TV display"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}
      </div>
    </header>
  );
};
