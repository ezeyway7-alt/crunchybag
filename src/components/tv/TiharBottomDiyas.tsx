import React from "react";

interface TiharBottomDiyasProps {
  className?: string;
}

export const TiharBottomDiyas: React.FC<TiharBottomDiyasProps> = ({ className = "" }) => {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[35] flex justify-between px-0 pb-0 select-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* -------------------------------------------------------------
          LEFT BOTTOM DIYA (Hugging bottom-left corner with very little gap)
      ------------------------------------------------------------- */}
      <div className="relative flex items-end -ml-1 -mb-1 sm:-ml-2 sm:-mb-1.5 overflow-visible filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]">
        {/* Pulsing Warm Radiant Floor / Corner Halo Glow */}
        <div className="tihar-diya-glow absolute -left-10 -bottom-8 h-44 w-52 sm:h-56 sm:w-64 rounded-full bg-gradient-to-tr from-amber-500/35 via-orange-600/25 to-yellow-400/20 blur-2xl" />

        <div className="relative w-28 h-28 sm:w-36 sm:h-36 overflow-visible">
          <svg
            viewBox="0 0 160 140"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Terracotta Clay Gradients */}
              <linearGradient id="clayRimGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c2410c" />
                <stop offset="40%" stopColor="#9a3412" />
                <stop offset="85%" stopColor="#7c2d12" />
                <stop offset="100%" stopColor="#431407" />
              </linearGradient>

              <radialGradient id="clayBaseGradLeft" cx="45%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="35%" stopColor="#9a3412" />
                <stop offset="70%" stopColor="#7c2d12" />
                <stop offset="100%" stopColor="#300e05" />
              </radialGradient>

              <radialGradient id="oilPoolGradLeft" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#b45309" stopOpacity="0.95" />
                <stop offset="80%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </radialGradient>

              {/* Flame Gradients */}
              <linearGradient id="flameOuterGradLeft" x1="50%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
                <stop offset="15%" stopColor="#ea580c" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="90%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="flameInnerGradLeft" x1="50%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="25%" stopColor="#fbbf24" />
                <stop offset="70%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>

              <filter id="flameBlurLeft" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Clay Bowl Shadow on ground right at bottom */}
            <ellipse cx="68" cy="133" rx="60" ry="7" fill="rgba(0,0,0,0.75)" />

            {/* Scattered Marigold Petals around base */}
            <g className="tihar-petals-base opacity-90">
              <ellipse cx="14" cy="133" rx="6" ry="3.5" transform="rotate(-15 14 133)" fill="#f59e0b" />
              <ellipse cx="26" cy="136" rx="7" ry="4" transform="rotate(25 26 136)" fill="#ea580c" />
              <ellipse cx="122" cy="134" rx="6" ry="3.5" transform="rotate(35 122 134)" fill="#fbbf24" />
              <ellipse cx="132" cy="131" rx="5" ry="3" transform="rotate(-20 132 131)" fill="#f97316" />
              <circle cx="16" cy="134" r="1.5" fill="#fef08a" />
              <circle cx="128" cy="132" r="1.5" fill="#fef08a" />
            </g>

            {/* Clay Diya Body - Shifted closer to left and bottom edges */}
            <g transform="translate(-10, 8)">
              {/* Outer bowl body */}
              <path
                d="M 22 96 C 24 116, 50 128, 80 128 C 110 128, 136 116, 138 96 C 140 88, 130 84, 114 84 C 92 84, 70 86, 46 86 C 30 86, 20 88, 22 96 Z"
                fill="url(#clayBaseGradLeft)"
                stroke="#431407"
                strokeWidth="1.2"
              />

              {/* Handcrafted Diya Clay Rim & Flared Spout pointing right towards wick */}
              <path
                d="M 22 94 C 20 85, 36 78, 76 78 C 116 78, 140 85, 138 94 C 136 102, 112 108, 76 108 C 40 108, 24 102, 22 94 Z"
                fill="url(#clayRimGradLeft)"
                stroke="#5c2410"
                strokeWidth="1.5"
              />

              {/* Deep Basin with Golden Mustard Oil */}
              <ellipse cx="76" cy="93" rx="46" ry="12" fill="url(#oilPoolGradLeft)" />

              {/* Specular oil gleam from flame */}
              <ellipse cx="88" cy="91" rx="20" ry="4.5" fill="rgba(254, 240, 138, 0.45)" />

              {/* Terracotta Rim Highlights */}
              <path
                d="M 28 92 C 45 84, 98 84, 130 91"
                stroke="rgba(251, 146, 60, 0.45)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Cotton Wick (रूवाको बाटी) positioned at right lip */}
              <path
                d="M 92 92 Q 104 84 110 74"
                stroke="#fffbeb"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="110" cy="74" r="2.8" fill="#1c1917" />
              <circle cx="110" cy="73" r="1.8" fill="#ea580c" />

              {/* Tall Luminous Flame */}
              <g className="tihar-flame-wrapper origin-[110px_74px]" filter="url(#flameBlurLeft)">
                <path
                  d="M 110 74 C 98 62, 94 42, 108 14 C 112 8, 114 8, 115 14 C 124 38, 126 60, 110 74 Z"
                  fill="url(#flameOuterGradLeft)"
                  className="tihar-flame-outer"
                />
                <path
                  d="M 110 73 C 102 64, 100 48, 109 26 C 111 20, 113 20, 113 26 C 119 44, 120 62, 110 73 Z"
                  fill="url(#flameInnerGradLeft)"
                  className="tihar-flame-inner"
                />
                <ellipse cx="110" cy="56" rx="3.5" ry="11" fill="#ffffff" opacity="0.9" />
                <ellipse cx="110" cy="72" rx="4.5" ry="2.2" fill="#38bdf8" opacity="0.85" />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* -------------------------------------------------------------
          RIGHT BOTTOM DIYA (Hugging bottom-right corner with very little gap)
      ------------------------------------------------------------- */}
      <div className="relative flex items-end -mr-1 -mb-1 sm:-mr-2 sm:-mb-1.5 overflow-visible filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)]">
        {/* Pulsing Warm Radiant Floor / Corner Halo Glow */}
        <div className="tihar-diya-glow absolute -right-10 -bottom-8 h-44 w-52 sm:h-56 sm:w-64 rounded-full bg-gradient-to-tl from-amber-500/35 via-orange-600/25 to-yellow-400/20 blur-2xl" />

        <div className="relative w-28 h-28 sm:w-36 sm:h-36 overflow-visible">
          <svg
            viewBox="0 0 160 140"
            className="w-full h-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="clayRimGradRight" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c2410c" />
                <stop offset="40%" stopColor="#9a3412" />
                <stop offset="85%" stopColor="#7c2d12" />
                <stop offset="100%" stopColor="#431407" />
              </linearGradient>

              <radialGradient id="clayBaseGradRight" cx="55%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="35%" stopColor="#9a3412" />
                <stop offset="70%" stopColor="#7c2d12" />
                <stop offset="100%" stopColor="#300e05" />
              </radialGradient>

              <radialGradient id="oilPoolGradRight" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#b45309" stopOpacity="0.95" />
                <stop offset="80%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </radialGradient>

              <linearGradient id="flameOuterGradRight" x1="50%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
                <stop offset="15%" stopColor="#ea580c" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="90%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="flameInnerGradRight" x1="50%" y1="100%" x2="50%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="25%" stopColor="#fbbf24" />
                <stop offset="70%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>

              <filter id="flameBlurRight" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Clay Bowl Shadow right on bottom */}
            <ellipse cx="92" cy="133" rx="60" ry="7" fill="rgba(0,0,0,0.75)" />

            {/* Scattered Marigold Petals around base */}
            <g className="tihar-petals-base opacity-90">
              <ellipse cx="28" cy="131" rx="5" ry="3" transform="rotate(-20 28 131)" fill="#f97316" />
              <ellipse cx="38" cy="134" rx="6" ry="3.5" transform="rotate(30 38 134)" fill="#fbbf24" />
              <ellipse cx="134" cy="136" rx="7" ry="4" transform="rotate(-25 134 136)" fill="#ea580c" />
              <ellipse cx="146" cy="133" rx="6" ry="3.5" transform="rotate(15 146 133)" fill="#f59e0b" />
              <circle cx="32" cy="132" r="1.5" fill="#fef08a" />
              <circle cx="144" cy="134" r="1.5" fill="#fef08a" />
            </g>

            {/* Clay Diya Body - Shifted closer to right and bottom edges */}
            <g transform="translate(10, 8)">
              <path
                d="M 138 96 C 136 116, 110 128, 80 128 C 50 128, 24 116, 22 96 C 20 88, 30 84, 46 84 C 68 84, 90 86, 114 86 C 130 86, 140 88, 138 96 Z"
                fill="url(#clayBaseGradRight)"
                stroke="#431407"
                strokeWidth="1.2"
              />

              <path
                d="M 138 94 C 140 85, 124 78, 84 78 C 44 78, 20 85, 22 94 C 24 102, 48 108, 84 108 C 120 108, 136 102, 138 94 Z"
                fill="url(#clayRimGradRight)"
                stroke="#5c2410"
                strokeWidth="1.5"
              />

              <ellipse cx="84" cy="93" rx="46" ry="12" fill="url(#oilPoolGradRight)" />

              <ellipse cx="72" cy="91" rx="20" ry="4.5" fill="rgba(254, 240, 138, 0.45)" />

              <path
                d="M 132 92 C 115 84, 62 84, 30 91"
                stroke="rgba(251, 146, 60, 0.45)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Cotton Wick pointing left */}
              <path
                d="M 68 92 Q 56 84 50 74"
                stroke="#fffbeb"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="50" cy="74" r="2.8" fill="#1c1917" />
              <circle cx="50" cy="73" r="1.8" fill="#ea580c" />

              {/* Flame */}
              <g className="tihar-flame-wrapper-alt origin-[50px_74px]" filter="url(#flameBlurRight)">
                <path
                  d="M 50 74 C 38 62, 34 42, 48 14 C 52 8, 54 8, 55 14 C 64 38, 66 60, 50 74 Z"
                  fill="url(#flameOuterGradRight)"
                  className="tihar-flame-outer"
                />
                <path
                  d="M 50 73 C 42 64, 40 48, 49 26 C 51 20, 53 20, 53 26 C 59 44, 60 62, 50 73 Z"
                  fill="url(#flameInnerGradRight)"
                  className="tihar-flame-inner"
                />
                <ellipse cx="50" cy="56" rx="3.5" ry="11" fill="#ffffff" opacity="0.9" />
                <ellipse cx="50" cy="72" rx="4.5" ry="2.2" fill="#38bdf8" opacity="0.85" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
