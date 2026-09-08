import React, { useState, useEffect } from "react";
import { Clock, Check, Plus, Minus, Flame, X } from "lucide-react";
import { Product, ProductVariant, SelectedModifier } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Modal } from "../common/Modal";

interface ProductConfiguratorModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    variant: ProductVariant,
    modifiers: SelectedModifier[],
    quantity: number
  ) => void;
}

export const ProductConfiguratorModal: React.FC<ProductConfiguratorModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || { id: "default", name: "Standard", price: product.basePrice }
  );
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize default options when opening
  useEffect(() => {
    if (product) {
      const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
      setSelectedVariant(defaultVariant);
      setActiveImageIndex(0);
      setQuantity(1);
      setValidationError(null);

      const initialMods: SelectedModifier[] = [];
      product.modifierGroups.forEach((group) => {
        const defOption = group.options.find((o) => o.isDefault);
        if (defOption) {
          initialMods.push({
            groupId: group.id,
            groupName: group.name,
            optionId: defOption.id,
            optionName: defOption.name,
            priceDelta: defOption.priceDelta,
          });
        }
      });
      setSelectedModifiers(initialMods);
    }
  }, [product, isOpen]);

  // Handle modifier selection toggle
  const handleToggleModifier = (group: Product["modifierGroups"][0], option: typeof group.options[0]) => {
    setValidationError(null);
    setSelectedModifiers((prev) => {
      const currentInGroup = prev.filter((m) => m.groupId === group.id);
      const isAlreadySelected = currentInGroup.some((m) => m.optionId === option.id);

      if (group.maxSelections === 1) {
        // Radio style: replace selection in this group
        const withoutGroup = prev.filter((m) => m.groupId !== group.id);
        return [
          ...withoutGroup,
          {
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            priceDelta: option.priceDelta,
          },
        ];
      }

      if (isAlreadySelected) {
        // Deselect
        return prev.filter(
          (m) => !(m.groupId === group.id && m.optionId === option.id)
        );
      } else {
        // Enforce max selections
        if (currentInGroup.length >= group.maxSelections) {
          return prev;
        }
        return [
          ...prev,
          {
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            priceDelta: option.priceDelta,
          },
        ];
      }
    });
  };

  // Price calculations
  const modifiersTotalDelta = selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  const unitCalculatedPrice = selectedVariant.price + modifiersTotalDelta;
  const lineItemTotal = unitCalculatedPrice * quantity;

  const handleConfirmAdd = () => {
    // Check required options
    for (const group of product.modifierGroups) {
      if (group.required) {
        const countInGroup = selectedModifiers.filter((m) => m.groupId === group.id).length;
        if (countInGroup < group.minSelections) {
          setValidationError(`Please choose an option for "${group.name}".`);
          return;
        }
      }
    }

    setValidationError(null);
    onAddToCart(product, selectedVariant, selectedModifiers, quantity);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      showCloseButton={false}
      className="h-[88vh] max-h-[640px] min-h-[460px] border border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden rounded-none"
      contentClassName="p-0 h-full flex flex-col min-h-0"
    >
      <div className="flex flex-col md:flex-row h-full min-h-0 bg-white dark:bg-[#121214] text-zinc-900 dark:text-zinc-100 overflow-hidden">
        {/* Left Image Showcase (Desktop: Left 40% full height, Mobile: Top Banner) */}
        <div className="relative w-full md:w-[42%] lg:w-[40%] h-40 sm:h-44 md:h-full bg-zinc-950 shrink-0 overflow-hidden flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
          <img
            src={product.images[activeImageIndex] || product.images[0]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Gentle shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

          {/* Floating Close Button (Mobile Only) */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-none bg-black/80 hover:bg-black text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-md active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Bottom Overlays: Thumbnails & Info Pills */}
          <div className="relative z-10 p-3 mt-auto flex items-end justify-between gap-2 w-full">
            {/* Thumbnail switchers (if multiple images) */}
            {product.images.length > 1 ? (
              <div className="flex gap-1.5">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-9 h-9 rounded-none overflow-hidden border transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-amber-500 scale-105 shadow-md"
                        : "border-white/40 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : <div />}

            {/* Prep time & calories pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="bg-black/80 text-zinc-200 text-[11px] font-bold px-2 py-0.5 rounded-none flex items-center gap-1 border border-white/20">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>{product.prepTimeMinutes}m</span>
              </span>
              {product.calories && (
                <span className="bg-black/80 text-zinc-200 text-[11px] font-bold px-2 py-0.5 rounded-none flex items-center gap-1 border border-white/20">
                  <Flame className="h-3 w-3 text-amber-400" />
                  <span>{product.calories} kcal</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Customization & Action Column */}
        <div className="flex-1 min-h-0 flex flex-col h-full bg-white dark:bg-[#121214]">
          {/* Header with Title, Price, Description & Desktop Close Button */}
          <div className="p-3.5 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3 shrink-0 bg-zinc-50/70 dark:bg-zinc-900/40">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg md:text-xl font-black text-zinc-950 dark:text-white tracking-tight">
                  {product.name}
                </h2>
                <span className="font-mono text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 border border-amber-500/20">
                  {formatNPR(unitCalculatedPrice)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Desktop Close Button */}
            <button
              onClick={onClose}
              className="hidden md:flex w-8 h-8 rounded-none bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 items-center justify-center cursor-pointer shrink-0 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Customization Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Variant Selector (e.g. Regular vs Large) */}
            {product.variants.length > 1 && (
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                    Choose Size
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20">
                    Required
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-none border text-left transition-all cursor-pointer min-h-[44px] ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 text-zinc-950 dark:text-white font-bold ring-1 ring-amber-500"
                            : "bg-zinc-50/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-amber-500 bg-amber-500 text-black"
                                : "border-zinc-400 dark:border-zinc-600"
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs sm:text-sm">{variant.name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-amber-400">
                          {formatNPR(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modifier Groups (Sauces, Add-ons, etc.) */}
            {product.modifierGroups.map((group) => {
              const selectionsInGroup = selectedModifiers.filter((m) => m.groupId === group.id);
              const isSatisfied =
                !group.required || selectionsInGroup.length >= group.minSelections;

              return (
                <div
                  key={group.id}
                  className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                        {group.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {group.maxSelections === 1
                          ? "Pick 1 option"
                          : `Pick up to ${group.maxSelections} options`}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                        isSatisfied
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : group.required
                          ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
                          : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {group.required ? (isSatisfied ? "Selected" : "Required") : "Optional"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.options.map((option) => {
                      const isChecked = selectionsInGroup.some(
                        (m) => m.optionId === option.id
                      );

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleToggleModifier(group, option)}
                          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-none border text-left transition-all cursor-pointer min-h-[44px] ${
                            isChecked
                              ? "bg-amber-500/10 border-amber-500 text-zinc-950 dark:text-white font-bold ring-1 ring-amber-500"
                              : "bg-zinc-50/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? "border-amber-500 bg-amber-500 text-black"
                                  : "border-zinc-400 dark:border-zinc-600"
                              }`}
                            >
                              {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs sm:text-sm">{option.name}</span>
                          </div>
                          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {option.priceDelta === 0 ? "Free" : `+${formatNPR(option.priceDelta)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Validation Notice */}
            {validationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-none text-rose-600 dark:text-rose-400 text-xs font-bold">
                {validationError}
              </div>
            )}
          </div>

          {/* Sticky Bottom Footer with Quantity & Add to Order */}
          <div className="shrink-0 bg-white dark:bg-[#121214] border-t border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 flex items-center gap-3 z-20 shadow-lg">
            {/* Quantity Controls */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-none transition-colors cursor-pointer text-zinc-700 dark:text-zinc-200 active:scale-95"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-mono font-black text-sm text-zinc-900 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-none transition-colors cursor-pointer text-zinc-700 dark:text-zinc-200 active:scale-95"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Order Button */}
            <button
              type="button"
              id="modal-add-to-order-btn"
              onClick={handleConfirmAdd}
              className="flex-1 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black text-xs sm:text-sm h-11 sm:h-12 px-4 rounded-none shadow-md transition-all cursor-pointer flex items-center justify-between border border-amber-600"
            >
              <span>Add to Order</span>
              <span className="font-mono font-black text-sm sm:text-base">
                {formatNPR(lineItemTotal)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
