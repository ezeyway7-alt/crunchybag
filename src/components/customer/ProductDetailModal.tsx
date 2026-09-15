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
        <div className="grid grid-cols-2 gap-2 p-2 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-tight">
                Prep Time
              </span>
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono">
                {product.prepTimeMinutes} mins
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-tight">
                Energy
              </span>
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono">
                {product.calories ? `${product.calories} kcal` : "Fresh Made"}
              </span>
            </div>
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
