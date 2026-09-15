import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Eye, Sparkles, SlidersHorizontal, Utensils, Check, PackageCheck } from "lucide-react";
import { CartLineItem } from "../../types";
import { formatNPR } from "../../lib/utils";

interface CartItemDetailModalProps {
  item: CartLineItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReconfigureItem?: (item: CartLineItem) => void;
}

export const CartItemDetailModal: React.FC<CartItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onReconfigureItem,
}) => {
  if (!item) return null;

  const isCombo =
    item.productId.startsWith("combo-") ||
    item.variant.id.includes("combo") ||
    item.productName.toLowerCase().includes("combo") ||
    item.productName.toLowerCase().includes("feast");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-500" />
          <span className="font-black text-sm uppercase tracking-tight truncate">
            {item.productName}
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Visual Banner */}
        <div className="relative w-full h-40 sm:h-44 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950">
          <img
            src={item.image}
            alt={item.productName}
            className="w-full h-full object-cover object-center brightness-95"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {isCombo ? (
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black border border-black shadow-xs">
                Combo Package
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-black/80 text-amber-400 border border-amber-500/40">
                Single Dish
              </span>
            )}
          </div>
          <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/90 backdrop-blur-xs text-amber-400 font-mono font-black text-xs sm:text-sm border border-white/20">
            {formatNPR(item.lineTotal)}
          </div>
        </div>

        {/* Combo Package Breakdown */}
        {isCombo ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-amber-500" />
                Package Items & Quantities ({item.selectedModifiers.length})
              </span>
              <span className="text-[11px] font-mono font-bold text-zinc-500">
                Qty: {item.quantity} {item.quantity === 1 ? "pack" : "packs"}
              </span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {item.selectedModifiers.map((mod, index) => (
                <div
                  key={index}
                  className="p-2.5 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <h6 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {mod.groupName}
                      </h6>
                    </div>
                    {mod.optionName && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-5.5 mt-0.5 leading-snug">
                        {mod.optionName}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white dark:bg-zinc-800 px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 shrink-0">
                    {item.quantity}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Regular Product Details */
          <div className="space-y-3">
            <div className="p-3 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Selected Portion:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {item.variant.name} ({formatNPR(item.variant.price)})
                </span>
              </div>

              {item.selectedModifiers.length > 0 && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Custom Add-ons & Sauces
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.selectedModifiers.map((mod, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1"
                      >
                        <Check className="w-2.5 h-2.5 text-amber-500" />
                        {mod.optionName}
                        {mod.priceDelta > 0 && (
                          <span className="text-amber-600 font-mono font-bold">
                            (+{formatNPR(mod.priceDelta)})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs font-mono">
                <span className="text-zinc-500">Order Quantity:</span>
                <span className="font-black text-zinc-900 dark:text-white">
                  {item.quantity}x
                </span>
              </div>
            </div>

            {/* Reconfigure Button for Regular Products */}
            {onReconfigureItem && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onReconfigureItem(item);
                }}
                className="w-full rounded-none text-xs font-bold h-9 border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-black flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Configure Options / Change Portion</span>
              </Button>
            )}
          </div>
        )}

        {/* Pricing Summary Row & Close */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="font-mono">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-tight">
              Line Total
            </span>
            <span className="text-base font-black text-amber-500">
              {formatNPR(item.lineTotal)}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-none text-xs font-bold h-8 px-4 cursor-pointer"
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
