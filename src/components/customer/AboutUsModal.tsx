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
  headline: "Crunchy Bag — Dhungesadhu Chowk, Imadol",
  tagline: "Burgers, fried chicken, chicken 65 pakoda, fries, sandwiches and more.",
  story: [
    "Crunchy Bag serves food from one restaurant and kitchen at Dhungesadhu Chowk, Imadol, Lalitpur.",
    "Delivery and takeaway run 24/7 across Kathmandu, Lalitpur and Bhaktapur. Dine-in is available from 5 AM to 11 PM daily.",
    "Our website lists the current menu and prices. Preparation usually takes 7–15 minutes depending on order size, with additional time for delivery. There is no minimum order.",
  ],
  pillars: [
    { icon: Flame, title: "Burgers & Chicken", desc: "Browse chicken and aloo tikki burgers, fried chicken and sandwiches." },
    { icon: ChefHat, title: "Pakoda & Snacks", desc: "Explore chicken 65 pakoda, vegetable pakoda, fries and crispy sides." },
    { icon: Clock, title: "24/7 Delivery & Takeaway", desc: "Order day or night. Check live dish availability before confirming." },
    { icon: MapPin, title: "One Imadol Restaurant", desc: "Visit Dhungesadhu Chowk for collection or dine-in from 5 AM to 11 PM." },
  ],
  stats: [
    { value: "24/7", label: "Delivery & Takeaway" },
    { value: "5 AM–11 PM", label: "Dine-in" },
    { value: "7–15 min", label: "Usual Preparation" },
    { value: "None", label: "Minimum Order" },
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
              <span>Crunchy Bag - Imadol Outlet &amp; Kitchen</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
              Dhungesadhu Chowk, Imadol • Delivery &amp; takeaway 24/7 • Dine-in 5 AM–11 PM
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
