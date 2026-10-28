import React from "react";

/* -------------------------------------------------------------------------
   TIHAR MARIGOLD GARLANDS (सयपत्री फूलको माला / Toran)
   Hanging from both top corners with stepped cascading strands.
   Positioned at z-index 15, BELOW the Banana Plants (z-25).
------------------------------------------------------------------------- */

const MarigoldFlower: React.FC<{
  cx: number;
  cy: number;
  r?: number;
  colorType?: "orange" | "yellow";
}> = ({ cx, cy, r = 7.5, colorType = "orange" }) => {
  const isYellow = colorType === "yellow";
  const outerPetalColor = isYellow ? "#facc15" : "#f59e0b";
  const midPetalColor = isYellow ? "#eab308" : "#ea580c";
  const centerColor = isYellow ? "#ca8a04" : "#c2410c";

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle cx="0" cy="0" r={r} fill={outerPetalColor} />
      <circle cx="-3" cy="-3" r={r * 0.46} fill={outerPetalColor} />
      <circle cx="3" cy="-3" r={r * 0.46} fill={outerPetalColor} />
      <circle cx="-3" cy="3" r={r * 0.46} fill={outerPetalColor} />
      <circle cx="3" cy="3" r={r * 0.46} fill={outerPetalColor} />
      <circle cx="0" cy={`-${r * 0.6}`} r={r * 0.42} fill={outerPetalColor} />
      <circle cx="0" cy={r * 0.6} r={r * 0.42} fill={outerPetalColor} />
      <circle cx={`-${r * 0.6}`} cy="0" r={r * 0.42} fill={outerPetalColor} />
      <circle cx={r * 0.6} cy="0" r={r * 0.42} fill={outerPetalColor} />

      <circle cx="0" cy="0" r={r * 0.66} fill={midPetalColor} />
      <circle cx="-1.5" cy="-1.5" r={r * 0.32} fill={midPetalColor} />
      <circle cx="1.5" cy="-1.5" r={r * 0.32} fill={midPetalColor} />
      <circle cx="-1.5" cy="1.5" r={r * 0.32} fill={midPetalColor} />
      <circle cx="1.5" cy="1.5" r={r * 0.32} fill={midPetalColor} />

      <circle cx="0" cy="0" r={r * 0.34} fill={centerColor} />
      <circle cx="0" cy="0" r={r * 0.15} fill="#fef08a" />
    </g>
  );
};

const LeafTassel: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d="M 0 0 C -6 6, -10 16, -6 26 C -2 18, 0 10, 0 0 Z"
        fill="#16a34a"
        stroke="#15803d"
        strokeWidth="0.6"
      />
      <path
        d="M 0 0 C 6 6, 10 16, 6 26 C 2 18, 0 10, 0 0 Z"
        fill="#22c55e"
        stroke="#15803d"
        strokeWidth="0.6"
      />
      <line x1="0" y1="0" x2="0" y2="18" stroke="#14532d" strokeWidth="0.8" />
    </g>
  );
};

export const TiharMarigoldGarlands: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-15 select-none overflow-visible"
      aria-hidden="true"
    >
      {/* -------------------------------------------------------------
          LEFT HANGING MARIGOLD GARLAND CASCADE (Fixed in position)
      ------------------------------------------------------------- */}
      <div className="pointer-events-none absolute top-0 left-0 h-48 w-40 sm:h-60 sm:w-48 md:h-72 md:w-56 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)] drop-shadow-[0_3px_12px_rgba(245,158,11,0.55)]">
        <svg viewBox="0 0 160 230" className="w-full h-full overflow-visible">
          {[0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160].map((x, i) => (
            <MarigoldFlower key={`lh-${i}`} cx={x} cy={6} r={7} colorType={i % 2 === 0 ? "orange" : "yellow"} />
          ))}

          {/* Strand 1 (Flush against edge at x=8) */}
          <line x1="8" y1="6" x2="8" y2="202" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81, 96, 111, 126, 141, 156, 171, 186].map((y, idx) => (
            <MarigoldFlower key={`s1-${idx}`} cx={8} cy={y} colorType={idx % 2 === 0 ? "orange" : "yellow"} />
          ))}
          <MarigoldFlower cx={4} cy={198} r={6} colorType="yellow" />
          <MarigoldFlower cx={12} cy={198} r={6} colorType="orange" />
          <LeafTassel x={8} y={202} />

          {/* Strand 2 (x=30) */}
          <line x1="30" y1="6" x2="30" y2="178" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81, 96, 111, 126, 141, 156].map((y, idx) => (
            <MarigoldFlower key={`s2-${idx}`} cx={30} cy={y} colorType={idx % 2 === 1 ? "orange" : "yellow"} />
          ))}
          <MarigoldFlower cx={26} cy={173} r={6} colorType="yellow" />
          <MarigoldFlower cx={34} cy={173} r={6} colorType="orange" />
          <LeafTassel x={30} y={177} />

          {/* Strand 3 (x=52) */}
          <line x1="52" y1="6" x2="52" y2="152" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81, 96, 111, 126, 141].map((y, idx) => (
            <MarigoldFlower key={`s3-${idx}`} cx={52} cy={y} colorType={idx % 2 === 0 ? "orange" : "yellow"} />
          ))}
          <MarigoldFlower cx={48} cy={147} r={6} colorType="orange" />
          <MarigoldFlower cx={56} cy={147} r={6} colorType="yellow" />
          <LeafTassel x={52} y={151} />

          {/* Strand 4 (x=74) */}
          <line x1="74" y1="6" x2="74" y2="124" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81, 96, 111].map((y, idx) => (
            <MarigoldFlower key={`s4-${idx}`} cx={74} cy={y} colorType={idx % 2 === 1 ? "orange" : "yellow"} />
          ))}
          <MarigoldFlower cx={70} cy={119} r={5.5} colorType="yellow" />
          <MarigoldFlower cx={78} cy={119} r={5.5} colorType="orange" />
          <LeafTassel x={74} y={123} />

          {/* Strand 5 (x=96) */}
          <line x1="96" y1="6" x2="96" y2="98" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81].map((y, idx) => (
            <MarigoldFlower key={`s5-${idx}`} cx={96} cy={y} colorType={idx % 2 === 0 ? "orange" : "yellow"} />
          ))}
          <MarigoldFlower cx={92} cy={93} r={5.5} colorType="orange" />
          <MarigoldFlower cx={100} cy={93} r={5.5} colorType="yellow" />
          <LeafTassel x={96} y={97} />

          {/* Strand 6 (x=118) */}
          <line x1="118" y1="6" x2="118" y2="72" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51].map((y, idx) => (
            <MarigoldFlower key={`s6-${idx}`} cx={118} cy={y} colorType={idx % 2 === 1 ? "orange" : "yellow"} />
          ))}
          <MarigoldFlower cx={114} cy={67} r={5} colorType="yellow" />
          <MarigoldFlower cx={122} cy={67} r={5} colorType="orange" />
          <LeafTassel x={118} y={71} />

          {/* Strand 7 (x=140) */}
          <line x1="140" y1="6" x2="140" y2="50" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36].map((y, idx) => (
            <MarigoldFlower key={`s7-${idx}`} cx={140} cy={y} colorType={idx % 2 === 0 ? "orange" : "yellow"} />
          ))}
          <MarigoldFlower cx={136} cy={45} r={5} colorType="orange" />
          <MarigoldFlower cx={144} cy={45} r={5} colorType="yellow" />
          <LeafTassel x={140} y={49} />
        </svg>
      </div>

      {/* -------------------------------------------------------------
          RIGHT HANGING MARIGOLD GARLAND CASCADE (Fixed in position)
      ------------------------------------------------------------- */}
      <div className="pointer-events-none absolute top-0 right-0 h-48 w-40 sm:h-60 sm:w-48 md:h-72 md:w-56 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)] drop-shadow-[0_3px_12px_rgba(245,158,11,0.55)]">
        <svg viewBox="0 0 160 230" className="w-full h-full overflow-visible">
          {[0, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160].map((x, i) => (
            <MarigoldFlower key={`rh-${i}`} cx={x} cy={6} r={7} colorType={i % 2 === 0 ? "yellow" : "orange"} />
          ))}

          {/* Strand 1 (Flush against right edge at x=152) */}
          <line x1="152" y1="6" x2="152" y2="202" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81, 96, 111, 126, 141, 156, 171, 186].map((y, idx) => (
            <MarigoldFlower key={`r1-${idx}`} cx={152} cy={y} colorType={idx % 2 === 0 ? "yellow" : "orange"} />
          ))}
          <MarigoldFlower cx={148} cy={198} r={6} colorType="orange" />
          <MarigoldFlower cx={156} cy={198} r={6} colorType="yellow" />
          <LeafTassel x={152} y={202} />

          {/* Strand 2 (x=130) */}
          <line x1="130" y1="6" x2="130" y2="178" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81, 96, 111, 126, 141, 156].map((y, idx) => (
            <MarigoldFlower key={`r2-${idx}`} cx={130} cy={y} colorType={idx % 2 === 1 ? "yellow" : "orange"} />
          ))}
          <MarigoldFlower cx={126} cy={173} r={6} colorType="orange" />
          <MarigoldFlower cx={134} cy={173} r={6} colorType="yellow" />
          <LeafTassel x={130} y={177} />

          {/* Strand 3 (x=108) */}
          <line x1="108" y1="6" x2="108" y2="152" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81, 96, 111, 126, 141].map((y, idx) => (
            <MarigoldFlower key={`r3-${idx}`} cx={108} cy={y} colorType={idx % 2 === 0 ? "yellow" : "orange"} />
          ))}
          <MarigoldFlower cx={104} cy={147} r={6} colorType="yellow" />
          <MarigoldFlower cx={112} cy={147} r={6} colorType="orange" />
          <LeafTassel x={108} y={151} />

          {/* Strand 4 (x=86) */}
          <line x1="86" y1="6" x2="86" y2="124" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81, 96, 111].map((y, idx) => (
            <MarigoldFlower key={`r4-${idx}`} cx={86} cy={y} colorType={idx % 2 === 1 ? "yellow" : "orange"} />
          ))}
          <MarigoldFlower cx={82} cy={119} r={5.5} colorType="orange" />
          <MarigoldFlower cx={90} cy={119} r={5.5} colorType="yellow" />
          <LeafTassel x={86} y={123} />

          {/* Strand 5 (x=64) */}
          <line x1="64" y1="6" x2="64" y2="98" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51, 66, 81].map((y, idx) => (
            <MarigoldFlower key={`r5-${idx}`} cx={64} cy={y} colorType={idx % 2 === 0 ? "yellow" : "orange"} />
          ))}
          <MarigoldFlower cx={60} cy={93} r={5.5} colorType="yellow" />
          <MarigoldFlower cx={68} cy={93} r={5.5} colorType="orange" />
          <LeafTassel x={64} y={97} />

          {/* Strand 6 (x=42) */}
          <line x1="42" y1="6" x2="42" y2="72" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36, 51].map((y, idx) => (
            <MarigoldFlower key={`r6-${idx}`} cx={42} cy={y} colorType={idx % 2 === 1 ? "yellow" : "orange"} />
          ))}
          <MarigoldFlower cx={38} cy={67} r={5} colorType="orange" />
          <MarigoldFlower cx={46} cy={67} r={5} colorType="yellow" />
          <LeafTassel x={42} y={71} />

          {/* Strand 7 (x=20) */}
          <line x1="20" y1="6" x2="20" y2="50" stroke="#15803d" strokeWidth="1" strokeDasharray="2 1" />
          {[6, 21, 36].map((y, idx) => (
            <MarigoldFlower key={`r7-${idx}`} cx={20} cy={y} colorType={idx % 2 === 0 ? "yellow" : "orange"} />
          ))}
          <MarigoldFlower cx={16} cy={45} r={5} colorType="yellow" />
          <MarigoldFlower cx={24} cy={45} r={5} colorType="orange" />
          <LeafTassel x={20} y={49} />
        </svg>
      </div>
    </div>
  );
};
