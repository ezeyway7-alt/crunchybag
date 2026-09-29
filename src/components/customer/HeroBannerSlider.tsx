import { useApp } from "../../context/AppContext";
import { comboDefinitions } from "../../lib/catalogApi";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { ArrowRight, Sparkles, SlidersHorizontal, Eye } from "lucide-react";
import { ComboPackageModal, ComboPackageDefinition } from "./ComboPackageModal";
import { formatNPR } from "../../lib/utils";
import { SkeletonHeroSlider } from "../common/Skeleton";

export interface BannerSlide extends ComboPackageDefinition {}

interface HeroBannerSliderProps {
  onSelectCategory?: (categoryId: string) => void;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ onSelectCategory }) => {
  const { products, isLoadingSkeleton } = useApp();
  const BANNER_SLIDES = comboDefinitions(products);
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
    const currentSlide = Math.round(el.scrollLeft / (slideWidth + 14));
    setActiveIndex(Math.min(Math.max(currentSlide, 0), BANNER_SLIDES.length - 1));
  }, [BANNER_SLIDES.length]);

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
      const nextLeft = el.scrollLeft + slideWidth + 14;
      if (nextLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: slideWidth + 14, behavior: "smooth" });
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

  if (isLoadingSkeleton) {
    return <SkeletonHeroSlider />;
  }

  if (BANNER_SLIDES.length === 0) {
    return null;
  }

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
          className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pt-0 pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {BANNER_SLIDES.map((slide, index) => {
            return (
              <div
                key={slide.id}
                data-slide
                onClick={() => handleSlideClick(slide)}
                className="relative shrink-0 snap-start select-none cursor-pointer overflow-hidden border border-zinc-300 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:border-amber-500
                  w-[82%] sm:w-[65%] md:w-[calc(40%-13px)] min-h-[185px] sm:min-h-[205px] md:min-h-[215px]"
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
                <div className="relative z-10 p-3 sm:p-4 flex flex-col justify-between h-full text-white">
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
                    <h3 className="text-lg sm:text-2xl md:text-2xl font-black tracking-tight leading-tight uppercase drop-shadow-md text-white line-clamp-1">
                      {slide.title}
                    </h3>
                  </div>

                  {/* Bottom Action Button & Price */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/20">
                    <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-amber-400 text-black font-black text-[11px] sm:text-xs uppercase tracking-wider transition-colors shadow-sm">
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
