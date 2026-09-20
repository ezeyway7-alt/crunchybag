import React, { useState } from "react";
import { Plus, SlidersHorizontal, Flame, Sparkles, Clock, Heart, Eye, ShoppingCart } from "lucide-react";
import { Product } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Skeleton } from "../common/Skeleton";
import { useApp } from "../../context/AppContext";
import { ProductDetailModal } from "./ProductDetailModal";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isLoading?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickAdd,
  isLoading = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useApp();
  const favorited = isFavorite(product.id);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3 shadow-sm rounded-none">
        <Skeleton className="w-full aspect-4/3 rounded-none" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-none" />
          <Skeleton className="h-4 w-full rounded-none" />
          <Skeleton className="h-4 w-2/3 rounded-none" />
        </div>
        <div className="flex items-center justify-between pt-2 mt-auto">
          <Skeleton className="h-6 w-24 rounded-none" />
          <Skeleton className="h-10 w-24 rounded-none" />
        </div>
      </div>
    );
  }

  const hasMultipleVariantsOrModifiers =
    product.variants.length > 1 || product.modifierGroups.length > 0;

  return (
    <>
      <div
        onClick={() => onSelect(product)}
      className="group relative bg-[#121214] border border-zinc-800 hover:border-amber-500 rounded-none overflow-hidden shadow-sm transition-all duration-150 flex flex-col cursor-pointer"
    >
      {/* Product Media with Zero CLS container */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/11 bg-zinc-900 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-zinc-800" />
        )}
        <img
          src={product.images[0]}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } ${!product.isAvailable ? "grayscale contrast-125 opacity-40" : ""}`}
          loading="lazy"
        />

        {/* Sold out banner if unavailable */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1.5 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-none border border-rose-400">
              Sold Out Today
            </span>
          </div>
        )}

        {/* Single Black Badge Overlay (Chef's Choice removed, single sleek black badge kept) */}
        {(() => {
          const displayTag = product.dietary.find(
            (t) => t.toLowerCase() !== "chef's choice" && t.toLowerCase() !== "chefs choice"
          ) || (product.dietary.length > 0 && product.dietary[0].toLowerCase().includes("chef") ? "Popular" : product.dietary[0]);

          if (!displayTag) return null;

          return (
            <div className="absolute top-2.5 left-2.5 pointer-events-none z-10">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-black/90 text-white border border-white/20 backdrop-blur-xs flex items-center gap-1 shadow-xs">
                {displayTag}
              </span>
            </div>
          );
        })()}

        {/* Prep Time */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-none bg-black/85 text-zinc-200 text-[10px] font-mono font-bold flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-400" />
          <span>{product.prepTimeMinutes}m</span>
        </div>

        {/* Action icons: Eye (Details) & Favorite Heart */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailOpen(true);
            }}
            className="p-1.5 bg-black/60 hover:bg-black/90 text-white hover:text-amber-400 backdrop-blur-xs transition-colors cursor-pointer"
            title="Inspect dish ingredients, prep time & calories"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className="p-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-xs transition-colors cursor-pointer"
            title={favorited ? "Remove favorite" : "Save to favorites"}
          >
            <Heart
              className={`h-4 w-4 ${
                favorited ? "fill-rose-500 text-rose-500" : "text-white hover:text-rose-400"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-xs sm:text-[13px] text-white group-hover:text-amber-500 transition-colors line-clamp-1 leading-snug">
              {product.name}
            </h4>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider block">
              {product.variants.length > 1 ? "Starts From" : "Price"}
            </span>
            <span className="font-mono font-bold text-sm sm:text-base text-amber-400 tracking-tight">
              {formatNPR(product.basePrice)}
            </span>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            {hasMultipleVariantsOrModifiers ? (
              <button
                disabled={!product.isAvailable}
                onClick={() => onSelect(product)}
                className="flex items-center gap-1.5 h-8.5 px-3 text-xs font-bold bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-200 rounded-none transition-all disabled:opacity-40 cursor-pointer border border-zinc-700 hover:border-amber-500"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Customize</span>
              </button>
            ) : (
              <button
                disabled={!product.isAvailable}
                onClick={() => onQuickAdd(product)}
                className="flex items-center gap-1.5 h-8.5 px-3.5 text-xs font-black bg-amber-500 hover:bg-amber-400 text-black rounded-none shadow-sm transition-all disabled:opacity-40 cursor-pointer border border-amber-600"
              >
                <ShoppingCart className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Product Nutrition & Spec Inspector */}
    <ProductDetailModal
      product={product}
      isOpen={isDetailOpen}
      onClose={() => setIsDetailOpen(false)}
      onConfigure={(p) => onSelect(p)}
    />
  </>
  );
};
