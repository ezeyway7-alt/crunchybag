import React, { useRef, useState, useEffect, useCallback } from "react";
import { ArrowRight } from "lucide-react";

export interface BannerSlide {
  id: string;
  badge: string;
  badgeType?: "hot" | "chef" | "deal" | "shake";
  title: string;
  subtitle: string;
  promoText?: string;
  buttonLabel: string;
  targetCategory: string;
  bgGradient: string;
  image: string;
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    id: "slide-1",
    badge: "Fresh Kathmandu Batch",
    badgeType: "chef",
    title: "CRUNCH ON DEMAND",
    subtitle: "24-hr brined whole muscle chicken fried fresh in small batches with garlic aioli.",
    promoText: "USE CODE CRUNCH15 (15% OFF)",
    buttonLabel: "Order Chicken",
    targetCategory: "cat-chicken",
    bgGradient: "from-amber-600 via-amber-500 to-yellow-500",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "slide-2",
    badge: "Chef's Signature Smash",
    badgeType: "hot",
    title: "DOUBLE TRUFFLE SMASH",
    subtitle: "Angus beef chucks smashed crisp with balsamic shallots & black truffle raclette.",
    promoText: "TOP RATED BURGER",
    buttonLabel: "Explore Burgers",
    targetCategory: "cat-burgers",
    bgGradient: "from-zinc-900 via-zinc-800 to-amber-950",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "slide-3",
    badge: "Limited Value Deal",
    badgeType: "deal",
    title: "FEAST SAVER COMBO",
    subtitle: "4 crispy tenders, 1 smash burger, seasoned waffle fries, 2 dips & 2 drinks.",
    promoText: "SAVE NPR 340 TODAY",
    buttonLabel: "Grab Combo",
    targetCategory: "cat-combos",
    bgGradient: "from-rose-700 via-rose-600 to-amber-600",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "slide-4",
    badge: "Nashville Spicy Drop",
    badgeType: "hot",
    title: "GHOST CHILI GLAZE",
    subtitle: "Fiery dry rub dunked in smoked chili oil with thick crinkle-cut pickles on brioche.",
    promoText: "WARNING: VERY SPICY",
    buttonLabel: "Try Spicy",
    targetCategory: "cat-chicken",
    bgGradient: "from-red-900 via-red-800 to-orange-700",
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "slide-5",
    badge: "Hand-Spun Shakes",
    badgeType: "shake",
    title: "LOTUS SPECULOOS SHAKE",
    subtitle: "Slow-churned soft serve blended with genuine Biscoff cookie spread & sea salt whip.",
    promoText: "CHURNED FRESH DAILY",
    buttonLabel: "View Shakes",
    targetCategory: "cat-drinks",
    bgGradient: "from-amber-900 via-stone-800 to-yellow-900",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80",
  },
];

interface HeroBannerSliderProps {
  onSelectCategory?: (categoryId: string) => void;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({ onSelectCategory }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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

  // Autoplay slider every 5 seconds when not hovered
  useEffect(() => {
    if (isHovered) return;
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
    }, 5500);

    return () => clearInterval(timer);
  }, [isHovered]);

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
    if (onSelectCategory) {
      onSelectCategory(slide.targetCategory);
    }
    const targetElement = document.getElementById("categories-rail");
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className="relative w-full group/slider pt-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slider Viewport Track
          - Desktop (lg & xl): Exactly 2 full cards and 1 half card visible (flex-[0_0_calc(40%-10px)]):
            (100% / 40% = 2.5 cards visible at once)
          - Medium desktop/tablet (md): ~2 cards visible (flex-[0_0_calc(48%-8px)])
          - Mobile (< md): 1 full card + peeking second card (flex-[0_0_calc(86%-8px)])
      */}
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
              {/* Background Image with Dark Vignette Gradient */}
              <div className="absolute inset-0 z-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover group-hover/slider:scale-105 transition-transform duration-700 brightness-[0.7] contrast-[1.1]"
                  loading="lazy"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-75 mix-blend-multiply`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
              </div>

              {/* Card Content Overlay */}
              <div className="relative z-10 p-5 flex flex-col justify-between h-full text-white">
                {/* Main Big Headline Title Only */}
                <div className="my-auto py-2">
                  <h3 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-black tracking-tight leading-tight uppercase drop-shadow-md text-white line-clamp-2">
                    {slide.title}
                  </h3>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow-sm">
                    <span>{slide.buttonLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-300 font-bold">
                    0{index + 1} / 0{BANNER_SLIDES.length}
                  </span>
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
  );
};
