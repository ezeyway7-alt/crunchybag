import React from "react";

/* -------------------------------------------------------------------------
   TIHAR PHOTOREALISTIC BANANA TREES (केराको बोट / केराको थाम)
   Auspicious Kadali Vriksha placed right at the corner edges:
   - Half of each plant (52%) is tucked outside the bezel.
   - The stem rises right at the corner edge directly where the lighting deyo is.
   - Only the inner half of the lush leaves reaches inward to frame the screen.
   - Layered at z-index 25: behind bottom lighting diyas (z-35) and above flower garland (z-15).
------------------------------------------------------------------------- */

export const TiharBananaPlants: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[25] h-full w-full select-none overflow-hidden"
      aria-hidden="true"
    >
      {/* -------------------------------------------------------------
          LEFT BANANA TREE (Stem at corner edge where deyo is, 52% hidden)
      ------------------------------------------------------------- */}
      <div
        className="absolute left-0 bottom-0 pointer-events-none flex items-end overflow-visible"
        style={{ transform: "translateX(-52%)" }}
      >
        <div className="tihar-real-banana-left flex items-end overflow-visible filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.95)]">
          <img
            src="/tihar_banana_tree.png"
            alt="Traditional Tihar Banana Tree Left"
            className="h-[80vh] sm:h-[86vh] md:h-[90vh] lg:h-[94vh] w-auto max-w-none object-bottom object-contain select-none pointer-events-none"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      {/* -------------------------------------------------------------
          RIGHT BANANA TREE (Stem at corner edge where deyo is, 52% hidden)
      ------------------------------------------------------------- */}
      <div
        className="absolute right-0 bottom-0 pointer-events-none flex items-end overflow-visible"
        style={{ transform: "translateX(52%)" }}
      >
        <div className="tihar-real-banana-right flex items-end overflow-visible filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.95)]">
          <img
            src="/tihar_banana_tree.png"
            alt="Traditional Tihar Banana Tree Right"
            className="h-[80vh] sm:h-[86vh] md:h-[90vh] lg:h-[94vh] w-auto max-w-none object-bottom object-contain select-none pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
};
