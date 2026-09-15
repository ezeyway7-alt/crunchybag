import React from "react";
import {
  Utensils,
  Award,
  Sparkles,
  MapPin,
  Clock,
  HeartHandshake,
  ChefHat,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "../common/Modal";

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreMenu?: () => void;
}

// Configurable backend schema placeholder:
// In the future, this object can be fetched directly from GET /api/cms/about
export const ABOUT_US_DATA = {
  headline: "Crispy Perfection Handcrafted in Kathmandu",
  tagline: "Durbar Marg's premier destination for artisan fried chicken, smash burgers, and signature shakes.",
  story: [
    "Crunchy was founded with a single obsession: to bring world-class crispy fried chicken and juicy artisanal smash burgers to the heart of Kathmandu Valley, prepared with uncompromising freshness and authentic Himalayan spices.",
    "Every piece of chicken is marinated for 18 hours in our secret herbal brine, hand-breaded in small batches with our signature 12-spice crunch coating, and flash-fried to golden perfection in 100% clean vegetable oil.",
    "From our flagship dining room on Kings Way opposite Narayanhiti Palace to our lightning-fast 30-minute delivery fleet across Kathmandu, Patan, and Lalitpur, we treat every order as a signature culinary experience.",
  ],
  pillars: [
    {
      icon: Flame,
      title: "18-Hour Secret Marinade",
      desc: "Deep flavour penetration with tender Himalayan herb brining. Never frozen, always juicy.",
    },
    {
      icon: ChefHat,
      title: "Hand-Breaded Small Batches",
      desc: "Fried fresh upon order with our proprietary crunch crust that stays crispy even during delivery.",
    },
    {
      icon: Award,
      title: "100% Fresh Local Poultry",
      desc: "Ethically raised chickens sourced directly from certified farms across Kavre & Chitwan.",
    },
    {
      icon: HeartHandshake,
      title: "Strict Food Hygiene",
      desc: "ISO-aligned food safety protocols with hospital-grade stainless steel kitchen assembly.",
    },
  ],
  stats: [
    { value: "50,000+", label: "Happy Customers Served" },
    { value: "18 hrs", label: "Heritage Spice Brining" },
    { value: "30 mins", label: "Average Delivery Time" },
    { value: "4.9 ★", label: "Kathmandu Foodie Rating" },
  ],
};

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  isOpen,
  onClose,
  onExploreMenu,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-amber-500" />
          <span className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
            About Crunchy
          </span>
        </div>
      }
      description={
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Kathmandu's premier artisan fried chicken & burger kitchen
        </span>
      }
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 text-zinc-800 dark:text-zinc-200">
        {/* Banner Hero */}
        <div className="p-5 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Craft & Heritage</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white tracking-tight leading-snug">
            {ABOUT_US_DATA.headline}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
            {ABOUT_US_DATA.tagline}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ABOUT_US_DATA.stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center"
            >
              <div className="font-mono font-black text-lg text-amber-500">
                {stat.value}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Our Story Paragraphs */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-amber-500" />
            <span>The Crunchy Story</span>
          </h4>
          <div className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {ABOUT_US_DATA.story.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* Four Pillars */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Why Foodies Love Us</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ABOUT_US_DATA.pillars.map((pillar, index) => {
              const IconComp = pillar.icon;
              return (
                <div
                  key={index}
                  className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-none bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">
                      {pillar.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flagship Location Info */}
        <div className="p-4 bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Durbar Marg Flagship Restaurant</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
              Kings Way, Opposite Narayanhiti Palace, Kathmandu • Open Daily 10:00 AM – 11:30 PM
            </p>
          </div>
          {onExploreMenu && (
            <button
              onClick={() => {
                onClose();
                onExploreMenu();
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs border border-black shadow-xs cursor-pointer transition-colors shrink-0"
            >
              Browse Menu
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
