import React, { useRef, useState, useEffect, useCallback } from "react";
import { ArrowRight, Sparkles, SlidersHorizontal, Eye } from "lucide-react";
import { ComboPackageModal, ComboPackageDefinition } from "./ComboPackageModal";
import { formatNPR } from "../../lib/utils";

export interface BannerSlide extends ComboPackageDefinition {}

export const BANNER_SLIDES: BannerSlide[] = [
  {
    id: "slide-1",
    badge: "",
    badgeType: "chef",
    title: "CRUNCH ON DEMAND",
    subtitle: "",
    promoText: "SAVE NPR 280 (SPECIAL COMBO)",
    buttonLabel: "Customize",
    targetCategory: "cat-combos",
    bgGradient: "from-amber-600 via-amber-500 to-yellow-500",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
    basePrice: 1280,
    originalPrice: 1560,
    includedProductIds: ["prod-01", "prod-04", "prod-05", "prod-06"],
  },
  {
    id: "slide-2",
    badge: "Chef's Signature Smash",
    badgeType: "hot",
    title: "DOUBLE TRUFFLE SMASH",
    subtitle: "Angus beef chucks smashed crisp with balsamic shallots & black truffle raclette, fries, tenders & shake.",
    promoText: "TOP RATED COMBO",
    buttonLabel: "Customize",
    targetCategory: "cat-combos",
    bgGradient: "from-zinc-900 via-zinc-800 to-amber-950",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    basePrice: 1420,
    originalPrice: 1740,
    includedProductIds: ["prod-02", "prod-05", "prod-06", "prod-04"],
  },
  {
    id: "slide-3",
    badge: "Limited Value Deal",
    badgeType: "deal",
    title: "FEAST SAVER COMBO",
    subtitle: "4 crispy tenders, 2 smash burgers, seasoned waffle fries, 2 dips & Lotus Biscoff craft shake.",
    promoText: "SAVE NPR 340 TODAY",
    buttonLabel: "Customize",
    targetCategory: "cat-combos",
    bgGradient: "from-rose-700 via-rose-600 to-amber-600",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    basePrice: 1850,
    originalPrice: 2190,
    includedProductIds: ["prod-01", "prod-02", "prod-04", "prod-05", "prod-06"],
  },
  {
    id: "slide-4",
    badge: "Nashville Spicy Drop",
    badgeType: "hot",
    title: "GHOST CHILI GLAZE",
    subtitle: "Fiery dry rub tenders dunked in smoked chili oil, spicy paneer tikka crunch, animal fries & sweet shake.",
    promoText: "WARNING: VERY SPICY",
    buttonLabel: "Customize",
    targetCategory: "cat-combos",
    bgGradient: "from-red-900 via-red-800 to-orange-700",
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&auto=format&fit=crop&q=80",
    basePrice: 1290,
    originalPrice: 1580,
    includedProductIds: ["prod-04", "prod-03", "prod-05", "prod-06"],
  },
  {
    id: "slide-5",
    badge: "Hand-Spun Shakes",
    badgeType: "shake",
    title: "LOTUS SPECULOOS SHAKE",
    subtitle: "Slow-churned soft serve blended with genuine Biscoff cookie spread paired with burger & truffle fries.",
    promoText: "SWEET & SAVORY PACK",
    buttonLabel: "Customize",
    targetCategory: "cat-combos",
    bgGradient: "from-amber-900 via-stone-800 to-yellow-900",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80",
    basePrice: 1040,
    originalPrice: 1280,
    includedProductIds: ["prod-06", "prod-01", "prod-05"],
  },
];

interface HeroBannerSliderProps {
  onSelectCategory?: (categoryId: string) => void;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ onSelectCategory }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<ComboPackageDefinition | null>(null);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);

  // Check scroll position to update active dot
  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Calculate approximate active slide index
    const slideWidth = el.querySelector<HTMLElement>("[data-slide]")?.offsetWidth || el.clientWidth / 2.5;
    const currentSlide = Math.round(el.scrollLeft / (slideWidth + 16));
    setActiveIndex(Math.min(Math.max(currentSlide, 0), BANNER_SLIDES.length - 1));
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

  // Autoplay slider every 6 seconds when not hovered
  useEffect(() => {
    if (isHovered || isComboModalOpen) return;
    const timer = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const slideWidth = el.querySelector<HTMLElement>("[data-slide]")?.offsetWidth || 340;
      const nextLeft = el.scrollLeft + slideWidth + 16;
      if (nextLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: slideWidth + 16, behavior: "smooth" });
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [isHovered, isComboModalOpen]);

  const scrollToSlide = (index: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const slide = el.querySelectorAll<HTMLElement>("[data-slide]")[index];
    if (slide) {
      el.scrollTo({
        left: slide.offsetLeft - el.offsetLeft,
        behavior: "smooth",
      });
    }
  };

  const handleSlideClick = (slide: BannerSlide) => {
    // Open the special combo package configurator modal directly
    setSelectedCombo(slide);
    setIsComboModalOpen(true);
  };

  return (
    <>
      <div
        className="relative w-full group/slider mt-2 sm:mt-2.5 pt-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Slider Viewport Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pt-0 pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {BANNER_SLIDES.map((slide, index) => {
            return (
              <div
                key={slide.id}
                data-slide
                onClick={() => handleSlideClick(slide)}
                className="relative shrink-0 snap-start select-none cursor-pointer overflow-hidden border border-zinc-300 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:border-amber-500
                  w-[86%] sm:w-[65%] md:w-[calc(40%-13px)] min-h-[190px] sm:min-h-[205px] md:min-h-[215px]"
              >
                {/* Background Image with Lower Gradient for Maximum Food Visibility */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover group-hover/slider:scale-105 transition-transform duration-700 brightness-[0.88] contrast-[1.05]"
                    loading="lazy"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-20 mix-blend-multiply`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                </div>

                {/* Card Content Overlay */}
                <div className="relative z-10 p-3.5 sm:p-4 flex flex-col justify-between h-full text-white">
                  {/* Top Right: Detail / Eye Icon to inspect package items & quantities */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlideClick(slide);
                      }}
                      className="p-1.5 bg-black/60 hover:bg-amber-500 hover:text-black text-white backdrop-blur-xs transition-colors cursor-pointer border border-white/20 shadow-xs"
                      title="Inspect items & quantities"
                      aria-label="Inspect combo items"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Main Clean Package Name (No extra clutter) */}
                  <div className="my-auto py-1">
                    <h3 className="text-xl sm:text-2xl md:text-2xl font-black tracking-tight leading-tight uppercase drop-shadow-md text-white line-clamp-1">
                      {slide.title}
                    </h3>
                  </div>

                  {/* Bottom Action Button & Price */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/20">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-colors shadow-sm">
                      <SlidersHorizontal className="w-3 h-3 text-amber-600" />
                      <span>{slide.buttonLabel}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-200 line-through mr-1 font-mono">
                        {formatNPR(slide.originalPrice)}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-amber-400 font-mono drop-shadow-xs">
                        {formatNPR(slide.basePrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dot Indicators */}
        <div className="flex items-center justify-center gap-1.5 pt-3">
          {BANNER_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToSlide(idx)}
              className={`h-1.5 transition-all cursor-pointer ${
                activeIndex === idx
                  ? "w-6 bg-amber-500"
                  : "w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Combo Package Configurator Modal */}
      <ComboPackageModal
        combo={selectedCombo}
        isOpen={isComboModalOpen}
        onClose={() => {
          setIsComboModalOpen(false);
          setSelectedCombo(null);
        }}
      />
    </>
  );
};
