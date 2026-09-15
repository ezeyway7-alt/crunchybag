import React, { useState } from "react";

/**
 * Global Brand Logo Configuration:
 * To update the logo across the entire application with your own image,
 * simply paste your image URL or public path in `GLOBAL_LOGO_IMAGE_SRC` below!
 */
export const GLOBAL_LOGO_IMAGE_SRC = "/crunchy_logo.png";

export interface CrunchyLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  src?: string;
  alt?: string;
}

export const CrunchyLogo: React.FC<CrunchyLogoProps> = ({
  size = "md",
  className = "",
  src,
  alt = "Crunchy Bag Logo",
}) => {
  const [imageError, setImageError] = useState(false);

  // Responsive dimensions preserving the official 426:199 aspect ratio of the brand logo
  const dimensionMap = {
    xs: "h-6 w-auto aspect-[426/199]",
    sm: "h-8 sm:h-9 w-auto aspect-[426/199]",
    md: "h-10 sm:h-11 md:h-12 w-auto aspect-[426/199]",
    lg: "h-13 sm:h-15 md:h-16 w-auto aspect-[426/199]",
    xl: "h-18 sm:h-22 w-auto aspect-[426/199]",
  };

  const pixelHeightMap = {
    xs: 24,
    sm: 34,
    md: 46,
    lg: 60,
    xl: 84,
  };

  const targetSrc = src || GLOBAL_LOGO_IMAGE_SRC;
  const currentHeightPx = pixelHeightMap[size];
  const currentWidthPx = Math.round(currentHeightPx * 2.14);

  // If a custom image source is provided and hasn't errored out, render the image
  if (targetSrc && !imageError) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${dimensionMap[size]} ${className}`}
      >
        <img
          src={targetSrc}
          alt={alt}
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] drop-shadow-[0_2px_5px_rgba(0,0,0,0.35)] transition-transform duration-200"
        />
      </div>
    );
  }

  // Official Brand Logo: Arched white "crunchy", green leaf, bold golden-orange "bag" & speed lines
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${dimensionMap[size]} ${className}`}
      title="Crunchy Bag"
    >
      <svg
        width={currentWidthPx}
        height={currentHeightPx}
        viewBox="0 0 240 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain filter drop-shadow-xs"
        role="img"
        aria-label={alt}
      >
        <defs>
          {/* Vibrant golden-orange gradient for "bag" */}
          <linearGradient id="crunchyBagGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="35%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          {/* 3D Extrusion bevel shadow gradient for "bag" */}
          <linearGradient id="crunchyBagShadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>

          {/* Eco Green Leaf Gradient */}
          <linearGradient id="crunchyLeafGrad" x1="10%" y1="90%" x2="90%" y2="10%">
            <stop offset="0%" stopColor="#15803D" />
            <stop offset="40%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>

          {/* Pearlescent White Gradient for arched "crunchy" */}
          <linearGradient id="crunchyWordGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F4F4F5" />
            <stop offset="100%" stopColor="#E4E4E7" />
          </linearGradient>

          {/* Soft drop shadow to guarantee high-contrast legibility on light and dark surfaces */}
          <filter id="crunchyTextShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.8" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
          </filter>

          <filter id="crunchyBagGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="1.8" floodColor="#7C2D12" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Dynamic italic slant matching the official brand styling */}
        <g transform="skewX(-6)">
          {/* 1. LEFT SPEED STREAKS (flanking 'b') */}
          <g fill="#F59E0B">
            {/* Top streak */}
            <path d="M 12 68 Q 28 67 43 67 L 41 71 Q 26 71 14 70 Z" />
            {/* Middle streak (longest) */}
            <path d="M 4 77 Q 24 76 42 76 L 40 81 Q 22 81 6 80 Z" />
            {/* Bottom streak */}
            <path d="M 16 87 Q 28 86 40 86 L 38 89 Q 28 90 18 89 Z" />
          </g>

          {/* 2. RIGHT SPEED STREAKS (flanking 'g') */}
          <g fill="#F59E0B">
            {/* Top streak (longer) */}
            <path d="M 190 67 Q 208 67 226 66 L 222 70 Q 205 71 188 71 Z" />
            {/* Bottom streak */}
            <path d="M 189 77 Q 204 77 217 76 L 213 81 Q 201 81 187 81 Z" />
          </g>

          {/* 3. "bag" 3D UNDERLAYER (Extrusion / Bevel depth) */}
          <g transform="translate(0, 3.2)" filter="url(#crunchyBagGlow)">
            <text
              x="115"
              y="88"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', Impact, sans-serif"
              fontWeight="900"
              fontSize="62"
              letterSpacing="-1.5"
              fill="url(#crunchyBagShadowGrad)"
              stroke="#9A3412"
              strokeWidth="1.2"
            >
              bag
            </text>
          </g>

          {/* 4. "bag" MAIN VIBRANT GRADIENT */}
          <text
            x="115"
            y="88"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', Impact, sans-serif"
            fontWeight="900"
            fontSize="62"
            letterSpacing="-1.5"
            fill="url(#crunchyBagGrad)"
          >
            bag
          </text>

          {/* 5. ARCHED "crunchy" WORDMARK */}
          <g filter="url(#crunchyTextShadow)">
            {/* c */}
            <text
              x="42"
              y="49"
              transform="rotate(-15 42 49)"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              fontWeight="900"
              fontSize="34"
              fill="url(#crunchyWordGrad)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="0.8"
            >
              c
            </text>
            {/* r */}
            <text
              x="63"
              y="43"
              transform="rotate(-10 63 43)"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              fontWeight="900"
              fontSize="34"
              fill="url(#crunchyWordGrad)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="0.8"
            >
              r
            </text>
            {/* u */}
            <text
              x="86"
              y="37"
              transform="rotate(-5 86 37)"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              fontWeight="900"
              fontSize="34"
              fill="url(#crunchyWordGrad)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="0.8"
            >
              u
            </text>
            {/* n */}
            <text
              x="110"
              y="35"
              transform="rotate(0 110 35)"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              fontWeight="900"
              fontSize="34"
              fill="url(#crunchyWordGrad)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="0.8"
            >
              n
            </text>
            {/* c */}
            <text
              x="137"
              y="37"
              transform="rotate(5 137 37)"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              fontWeight="900"
              fontSize="34"
              fill="url(#crunchyWordGrad)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="0.8"
            >
              c
            </text>
            {/* h */}
            <text
              x="161"
              y="42"
              transform="rotate(10 161 42)"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              fontWeight="900"
              fontSize="34"
              fill="url(#crunchyWordGrad)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="0.8"
            >
              h
            </text>
            {/* y */}
            <text
              x="186"
              y="50"
              transform="rotate(15 186 50)"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
              fontWeight="900"
              fontSize="34"
              fill="url(#crunchyWordGrad)"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="0.8"
            >
              y
            </text>
          </g>

          {/* 6. GREEN ECO LEAF (Tilted ~45° above the 'y') */}
          <g transform="translate(204, 18) rotate(32)" filter="drop-shadow(0 2px 2px rgba(0,0,0,0.3))">
            {/* Leaf blade */}
            <path
              d="M 0 16 C -6 8 -2 0 12 -4 C 18 10 10 20 0 16 Z"
              fill="url(#crunchyLeafGrad)"
              stroke="#14532D"
              strokeWidth="0.6"
            />
            {/* Leaf center vein */}
            <path
              d="M 1 15 Q 6 8 11 -3"
              stroke="#DCFCE7"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
