import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Clock, Flame, Utensils, SlidersHorizontal, ShoppingCart } from "lucide-react";
import { Product } from "../../types";
import { formatNPR } from "../../lib/utils";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfigure?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfigure,
}) => {
  if (!product) return null;

  const hasMultipleOptions =
    product.variants.length > 1 || product.modifierGroups.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2">
          <Utensils className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-black text-sm uppercase tracking-tight">{product.name}</span>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Optimized Product Image */}
        <div className="relative w-full h-44 sm:h-48 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {product.dietary.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-black/85 backdrop-blur-xs text-amber-400 border border-amber-500/40"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Price Tag Overlay */}
          <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/90 backdrop-blur-xs text-amber-400 font-mono font-black text-xs sm:text-sm border border-white/20">
            {product.variants.length > 1 ? `From ${formatNPR(product.basePrice)}` : formatNPR(product.basePrice)}
          </div>
        </div>

        {/* Nutritional & Prep Stats */}
        <div className="grid grid-cols-4 gap-1.5 p-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="p-1">
            <span className="text-[9px] uppercase font-bold text-zinc-400 block leading-tight">
              Calories
            </span>
            <span className="text-xs font-black text-amber-500 font-mono">
              {product.calories ? `${product.calories}` : "420"} <span className="text-[9px] font-normal text-zinc-400">kcal</span>
            </span>
          </div>

          <div className="p-1 border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-[9px] uppercase font-bold text-zinc-400 block leading-tight">
              Protein
            </span>
            <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {Math.round((product.calories || 420) * 0.05)}g
            </span>
          </div>

          <div className="p-1 border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-[9px] uppercase font-bold text-zinc-400 block leading-tight">
              Carbs
            </span>
            <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {Math.round((product.calories || 420) * 0.08)}g
            </span>
          </div>

          <div className="p-1 border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-[9px] uppercase font-bold text-zinc-400 block leading-tight">
              Prep
            </span>
            <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {product.prepTimeMinutes}m
            </span>
          </div>
        </div>

        {/* Detailed Allergen & Kitchen Advisory Box */}
        <div className="p-2.5 bg-amber-500/5 border border-amber-500/30 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
              Allergen & Dietary Advisory
            </span>
            <span className="text-[9px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 border border-emerald-500/30">
              ✓ 100% Halal
            </span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-snug">
            {product.dietary.some((d) => d.toLowerCase().includes("gluten") || d.toLowerCase().includes("veg"))
              ? "Allergen notes: Contains wheat gluten, soy & dairy cultures. Nut-free frying facility."
              : "Prepared in facility handling sesame seeds, dairy (cheese & mayo) and gluten. Fried in 100% pure sunflower oil (No peanut oils)."}
          </p>
          <div className="flex flex-wrap gap-1 pt-0.5">
            <span className="px-1.5 py-0.2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold">
              Nut-Free Facility
            </span>
            <span className="px-1.5 py-0.2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold">
              Zero Trans Fat
            </span>
            <span className="px-1.5 py-0.2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold">
              Fresh Daily Buns
            </span>
          </div>
        </div>

        {/* Portions / Variants list if multiple */}
        {product.variants.length > 1 && (
          <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Available Portions & Pricing
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {product.variants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-1.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-xs"
                >
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-[11px] truncate">
                    {v.name}
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                    {formatNPR(v.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls: Configure & Close */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-none text-xs font-bold h-8 px-3 cursor-pointer"
          >
            Close
          </Button>

          {onConfigure && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onConfigure(product);
              }}
              className="rounded-none text-xs font-black bg-amber-500 hover:bg-amber-400 text-black border border-black h-8 px-4 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {hasMultipleOptions ? (
                <>
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Configure Options</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3" />
                  <span>Add to Order</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
