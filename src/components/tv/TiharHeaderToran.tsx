import React from "react";

/* -------------------------------------------------------------------------
   TIHAR TRADITIONAL DOORWAY TORAN (शुभ दीपावली तथा छठ तोरण)
   Attached seamlessly right along the bottom border of the top header.
   Matching the user's sketch & authentic Nepali/Indian festival toran:
   - Fluffy continuous golden marigold garland running horizontally along the header border
   - Repeating U-shaped scalloped arches with double marigold layers (yellow outer, orange inner)
   - Central hanging orange marigold blossom inside each arch
   - Vertical hanging drop pendants with white jasmine (चमेली) beads, marigolds, and green mango leaf tassels
------------------------------------------------------------------------- */

interface TiharHeaderToranProps {
  className?: string;
}

export const TiharHeaderToran: React.FC<TiharHeaderToranProps> = ({ className }) => {
  // 8 repeating arches across 1600 viewBox units (200 units per arch)
  const arches = [
    { x1: 0, x2: 200 },
    { x1: 200, x2: 400 },
    { x1: 400, x2: 600 },
    { x1: 600, x2: 800 },
    { x1: 800, x2: 1000 },
    { x1: 1000, x2: 1200 },
    { x1: 1200, x2: 1400 },
    { x1: 1400, x2: 1600 },
  ];

  const pendantPositions = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600];

  return (
    <div
      className={
        className ||
        "pointer-events-none absolute top-[4.75rem] sm:top-[5.5rem] -mt-2 sm:-mt-2.5 inset-x-0 z-15 h-20 sm:h-24 md:h-28 select-none overflow-visible filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.92)] drop-shadow-[0_2px_12px_rgba(245,158,11,0.55)]"
      }
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1600 110"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Radial gradient for Realistic Yellow Marigold (सयपत्री) */}
          <radialGradient id="toran-marigold-yellow" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </radialGradient>

          {/* Radial gradient for Realistic Orange Marigold (सुन्तला गेंदा) */}
          <radialGradient id="toran-marigold-orange" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffedd5" />
            <stop offset="25%" stopColor="#fdba74" />
            <stop offset="55%" stopColor="#fb923c" />
            <stop offset="85%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>

          {/* Radial gradient for White Jasmine (चमेली / मोगरा) Beads */}
          <radialGradient id="toran-jasmine-grad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fef9c3" />
            <stop offset="90%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </radialGradient>

          {/* Linear gradient for Mango Leaves */}
          <linearGradient id="toran-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="60%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          {/* 3D Fluffy Yellow Marigold Blossom Model */}
          <g id="flower-yellow">
            {/* Outer ruffled petals layer */}
            <circle cx="0" cy="0" r="8.2" fill="url(#toran-marigold-yellow)" />
            <circle cx="-3.5" cy="-3.5" r="3.8" fill="url(#toran-marigold-yellow)" />
            <circle cx="3.5" cy="-3.5" r="3.8" fill="url(#toran-marigold-yellow)" />
            <circle cx="-3.5" cy="3.5" r="3.8" fill="url(#toran-marigold-yellow)" />
            <circle cx="3.5" cy="3.5" r="3.8" fill="url(#toran-marigold-yellow)" />
            <circle cx="0" cy="-4.8" r="3.6" fill="url(#toran-marigold-yellow)" />
            <circle cx="0" cy="4.8" r="3.6" fill="url(#toran-marigold-yellow)" />
            <circle cx="-4.8" cy="0" r="3.6" fill="url(#toran-marigold-yellow)" />
            <circle cx="4.8" cy="0" r="3.6" fill="url(#toran-marigold-yellow)" />
            {/* Middle crinkled layer */}
            <circle cx="0" cy="0" r="5.6" fill="#facc15" />
            <circle cx="-2" cy="-2" r="2.6" fill="#fef08a" />
            <circle cx="2" cy="-2" r="2.6" fill="#facc15" />
            <circle cx="-2" cy="2" r="2.6" fill="#facc15" />
            <circle cx="2" cy="2" r="2.6" fill="#eab308" />
            {/* Inner blossom core highlight */}
            <circle cx="0" cy="0" r="2.8" fill="#fef08a" />
            <circle cx="0" cy="0" r="1.3" fill="#ffffff" />
          </g>

          {/* 3D Fluffy Orange Marigold Blossom Model */}
          <g id="flower-orange">
            {/* Outer ruffled petals layer */}
            <circle cx="0" cy="0" r="7.8" fill="url(#toran-marigold-orange)" />
            <circle cx="-3.2" cy="-3.2" r="3.6" fill="url(#toran-marigold-orange)" />
            <circle cx="3.2" cy="-3.2" r="3.6" fill="url(#toran-marigold-orange)" />
            <circle cx="-3.2" cy="3.2" r="3.6" fill="url(#toran-marigold-orange)" />
            <circle cx="3.2" cy="3.2" r="3.6" fill="url(#toran-marigold-orange)" />
            <circle cx="0" cy="-4.5" r="3.4" fill="url(#toran-marigold-orange)" />
            <circle cx="0" cy="4.5" r="3.4" fill="url(#toran-marigold-orange)" />
            <circle cx="-4.5" cy="0" r="3.4" fill="url(#toran-marigold-orange)" />
            <circle cx="4.5" cy="0" r="3.4" fill="url(#toran-marigold-orange)" />
            {/* Middle crinkled layer */}
            <circle cx="0" cy="0" r="5.2" fill="#fb923c" />
            <circle cx="-1.8" cy="-1.8" r="2.4" fill="#fdba74" />
            <circle cx="1.8" cy="-1.8" r="2.4" fill="#fb923c" />
            <circle cx="-1.8" cy="1.8" r="2.4" fill="#ea580c" />
            <circle cx="1.8" cy="1.8" r="2.4" fill="#c2410c" />
            {/* Inner blossom core highlight */}
            <circle cx="0" cy="0" r="2.5" fill="#fed7aa" />
            <circle cx="0" cy="0" r="1.1" fill="#fff7ed" />
          </g>

          {/* Jasmine / Mogra White Blossom Bead */}
          <g id="jasmine-bead">
            <ellipse cx="0" cy="0" rx="3.6" ry="2.6" fill="url(#toran-jasmine-grad)" />
            <circle cx="0" cy="0" r="1.2" fill="#fef08a" />
          </g>

          {/* Mango Leaf Cluster Tassel */}
          <g id="leaf-tassel">
            <path
              d="M 0 0 C -5 6, -8 15, -4 22 C -1 15, 0 8, 0 0 Z"
              fill="url(#toran-leaf-grad)"
              stroke="#14532d"
              strokeWidth="0.4"
            />
            <path
              d="M 0 0 C 5 6, 8 15, 4 22 C 1 15, 0 8, 0 0 Z"
              fill="url(#toran-leaf-grad)"
              stroke="#14532d"
              strokeWidth="0.4"
            />
            <line x1="0" y1="0" x2="0" y2="16" stroke="#166534" strokeWidth="0.6" />
          </g>

          {/* Single Mango Leaf Cap for suspended flowers */}
          <g id="leaf-cap">
            <path d="M 0 0 C -4 -2, -6 -6, -4 -9 C -1 -5, 0 -2, 0 0 Z" fill="#15803d" />
            <path d="M 0 0 C 4 -2, 6 -6, 4 -9 C 1 -5, 0 -2, 0 0 Z" fill="#16a34a" />
            <circle cx="0" cy="0" r="2" fill="#14532d" />
          </g>
        </defs>

        {/* -------------------------------------------------------------
            1. SCALLOPED FESTOONS / SWAGS (U-shaped half-circles)
        ------------------------------------------------------------- */}
        {arches.map((arch, archIndex) => {
          const xc = (arch.x1 + arch.x2) / 2;
          const width = arch.x2 - arch.x1;
          const outerStepCount = 13;
          const innerStepCount = 9;

          // Outer yellow arc marigolds
          const outerYellow = [];
          for (let i = 1; i < outerStepCount; i++) {
            const t = i / outerStepCount;
            const x = arch.x1 + t * width;
            const sag = Math.sin(t * Math.PI);
            const y = 8 + sag * 42;
            outerYellow.push(
              <use
                key={`oy-${archIndex}-${i}`}
                href="#flower-yellow"
                x={x}
                y={y}
                transform={`scale(${1 + sag * 0.12})`}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
            );
          }

          // Inner orange arc marigolds
          const innerOrange = [];
          for (let i = 1; i < innerStepCount; i++) {
            const t = i / innerStepCount;
            const x = arch.x1 + t * width;
            const sag = Math.sin(t * Math.PI);
            const y = 8 + sag * 28;
            innerOrange.push(
              <use
                key={`io-${archIndex}-${i}`}
                href="#flower-orange"
                x={x}
                y={y}
                transform={`scale(${0.92 + sag * 0.08})`}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
            );
          }

          return (
            <g key={`arch-${archIndex}`} className="toran-arch-group">
              {/* Supporting garland binding threads */}
              <path
                d={`M ${arch.x1} 8 Q ${xc} 52 ${arch.x2} 8`}
                stroke="#15803d"
                strokeWidth="1.6"
                fill="none"
                opacity="0.85"
              />
              <path
                d={`M ${arch.x1} 8 Q ${xc} 36 ${arch.x2} 8`}
                stroke="#166534"
                strokeWidth="1.2"
                fill="none"
                opacity="0.75"
              />

              {/* Flowers for the U-arch */}
              {outerYellow}
              {innerOrange}

              {/* Central suspended marigold blossom with green leaf cap */}
              <g className="toran-suspended-flower">
                <line x1={xc} y1={8} x2={xc} y2={30} stroke="#15803d" strokeWidth="1.2" />
                <use href="#leaf-cap" x={xc} y={28} />
                <use href="#flower-orange" x={xc} y={34} transform="scale(1.05)" style={{ transformOrigin: `${xc}px 34px` }} />
              </g>
            </g>
          );
        })}

        {/* -------------------------------------------------------------
            2. VERTICAL HANGING DROP PENDANTS (Between the scalloped arches)
            Matching real festival toran: white jasmine garland + marigold balls + mango leaf tassels
        ------------------------------------------------------------- */}
        {pendantPositions.map((x, pendIndex) => {
          // Slight alternating sway delays for natural festive micro-movement
          const swayDelay = (pendIndex % 3) * 0.4;

          return (
            <g
              key={`pend-${pendIndex}`}
              className="toran-pendant"
              style={{
                transformOrigin: `${x}px 8px`,
                animation: `toranPendantSway 5.5s ease-in-out infinite ${swayDelay}s`,
              }}
            >
              {/* Vertical string */}
              <line x1={x} y1={8} x2={x} y2={84} stroke="#15803d" strokeWidth="1.4" opacity="0.9" />

              {/* 1st White Jasmine string (4 beads) */}
              {[15, 20, 25, 30].map((y) => (
                <use key={`j1-${pendIndex}-${y}`} href="#jasmine-bead" x={x} y={y} />
              ))}

              {/* Upper Marigold ball (Orange) with leaf backing */}
              <use href="#leaf-cap" x={x} y={37} />
              <use href="#flower-orange" x={x} y={40} transform="scale(1.08)" style={{ transformOrigin: `${x}px 40px` }} />

              {/* 2nd White Jasmine string (4 beads) */}
              {[49, 54, 59, 64].map((y) => (
                <use key={`j2-${pendIndex}-${y}`} href="#jasmine-bead" x={x} y={y} />
              ))}

              {/* Lower Marigold ball (Yellow) */}
              <use href="#leaf-cap" x={x} y={71} />
              <use href="#flower-yellow" x={x} y={74} transform="scale(1.12)" style={{ transformOrigin: `${x}px 74px` }} />

              {/* Bottom terminal cluster: Fresh Mango Leaf Tassel & Accent Marigold Duo */}
              <use href="#leaf-tassel" x={x} y={82} />
              <use href="#flower-orange" x={x - 4.5} y={88} transform="scale(0.85)" style={{ transformOrigin: `${x - 4.5}px 88px` }} />
              <use href="#flower-yellow" x={x + 4.5} y={88} transform="scale(0.85)" style={{ transformOrigin: `${x + 4.5}px 88px` }} />
            </g>
          );
        })}

        {/* -------------------------------------------------------------
            3. TOP CONTINUOUS HORIZONTAL MARIGOLD GARLAND BAND
            Dense, plush rope of bright yellow marigolds running along the header border
        ------------------------------------------------------------- */}
        <line x1="0" y1="8" x2="1600" y2="8" stroke="#15803d" strokeWidth="3" />
        {Array.from({ length: 115 }).map((_, i) => {
          const x = i * 14;
          return (
            <use
              key={`topband-${i}`}
              href={i % 5 === 0 ? "#flower-orange" : "#flower-yellow"}
              x={x}
              y={7}
              transform="scale(1.04)"
              style={{ transformOrigin: `${x}px 7px` }}
            />
          );
        })}
      </svg>
    </div>
  );
};
