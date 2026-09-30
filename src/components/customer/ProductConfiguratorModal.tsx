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
  editingCartItemId?: string | null;
  initialVariant?: ProductVariant | null;
  initialModifiers?: SelectedModifier[] | null;
  initialQuantity?: number;
  onUpdateCartItem?: (
    cartItemId: string,
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
  editingCartItemId,
  initialVariant,
  initialModifiers,
  initialQuantity,
  onUpdateCartItem,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    initialVariant || product?.variants?.[0] || null
  );
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>(initialModifiers || []);
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize options when opening
  useEffect(() => {
    if (product && isOpen) {
      if (editingCartItemId && initialVariant) {
        setSelectedVariant(initialVariant);
        setSelectedModifiers(initialModifiers || []);
        setQuantity(initialQuantity || 1);
      } else {
        const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
        setSelectedVariant(defaultVariant || null);
        setQuantity(1);

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
      setActiveImageIndex(0);
      setValidationError(null);
    }
  }, [product, isOpen, editingCartItemId, initialVariant, initialModifiers, initialQuantity]);

  if (!product || !selectedVariant) return null;

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
    if (editingCartItemId && onUpdateCartItem) {
      onUpdateCartItem(editingCartItemId, selectedVariant, selectedModifiers, quantity);
    } else {
      onAddToCart(product, selectedVariant, selectedModifiers, quantity);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      showCloseButton={false}
      className="w-full max-w-[460px] sm:max-w-[520px] h-[85vh] sm:h-auto sm:max-h-[640px] min-h-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden rounded-none"
      contentClassName="p-0 h-full flex flex-col min-h-0"
    >
      <div className="flex flex-col h-full min-h-0 bg-white dark:bg-[#121214] text-zinc-900 dark:text-zinc-100 overflow-hidden w-full">
        {/* Top Image Showcase (Proper Food Dimensions) */}
        <div className="relative w-full h-36 sm:h-44 bg-zinc-950 shrink-0 overflow-hidden flex flex-col justify-between border-b border-zinc-200 dark:border-zinc-800">
          <img
            src={product.images[activeImageIndex] || product.images[0]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300"
          />

          {/* Gentle shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />

          {/* Floating Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 z-10 w-7.5 h-7.5 rounded-none bg-black/80 hover:bg-black active:bg-zinc-800 text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-md transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Bottom Overlays: Thumbnails & Info Pills */}
          <div className="relative z-10 p-2 sm:p-2.5 mt-auto flex items-end justify-between gap-1.5 w-full">
            {/* Thumbnail switchers (if multiple images) */}
            {product.images.length > 1 ? (
              <div className="flex gap-1.5">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-none overflow-hidden border transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-amber-500 scale-105 shadow-xs"
                        : "border-white/40 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : <div />}

            {/* Prep time & calories pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="bg-black/85 text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-none flex items-center gap-1 border border-white/20">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>{product.prepTimeMinutes}m</span>
              </span>
              {product.calories && (
                <span className="bg-black/85 text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-none flex items-center gap-1 border border-white/20">
                  <Flame className="h-3 w-3 text-amber-400" />
                  <span>{product.calories} kcal</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customization & Action Column */}
        <div className="flex-1 min-h-0 flex flex-col h-full bg-white dark:bg-[#121214] overflow-hidden">
          {/* Header with Title, Price, Description */}
          <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0 bg-zinc-50/80 dark:bg-zinc-900/60 w-full overflow-hidden">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-zinc-950 dark:text-white tracking-tight truncate">
                  {product.name}
                </h2>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 border border-amber-500/20 shrink-0">
                  {formatNPR(unitCalculatedPrice)}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {product.description}
              </p>
            </div>
          </div>

          {/* Scrollable Customization Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2.5 sm:p-3.5 space-y-2.5 text-xs">
            {/* Variant Selector (e.g. Regular vs Large) */}
            {product.variants.length > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                    Portion Size
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 border border-amber-500/20">
                    Required
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-none border text-left transition-all cursor-pointer min-h-[32px] sm:min-h-[36px] ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500 text-zinc-950 dark:text-white font-bold ring-1 ring-amber-500"
                            : "bg-zinc-50/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <div
                            className={`w-3 h-3 rounded-none border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-amber-500 bg-amber-500 text-black"
                                : "border-zinc-400 dark:border-zinc-600"
                            }`}
                          >
                            {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                          </div>
                          <span className="text-[11px] sm:text-xs truncate">{variant.name}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-zinc-900 dark:text-amber-400 shrink-0 ml-1">
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
              const count = selectionsInGroup.length;
              const isMulti = group.maxSelections > 1;
              const isSatisfied =
                !group.required || count >= group.minSelections;
              const atMax = count >= group.maxSelections;

              return (
                <div
                  key={group.id}
                  className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                        {group.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        {isMulti
                          ? group.minSelections > 0
                            ? `Pick ${group.minSelections}–${group.maxSelections} options`
                            : `Pick up to ${group.maxSelections} options`
                          : "Pick 1 option"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMulti && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 border ${atMax ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}>
                          {count}/{group.maxSelections}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 border ${
                          isSatisfied
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : group.required
                            ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {group.required ? (isSatisfied ? "✓" : "Required") : "Optional"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {group.options.map((option) => {
                      const isChecked = selectionsInGroup.some(
                        (m) => m.optionId === option.id
                      );
                      const isDisabled = !isChecked && atMax;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleToggleModifier(group, option)}
                          disabled={isDisabled}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-none border text-left transition-all min-h-[30px] sm:min-h-[34px] ${
                            isDisabled
                              ? "opacity-40 cursor-not-allowed bg-zinc-50/40 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800"
                              : isChecked
                              ? "bg-amber-500/15 border-amber-500 text-zinc-950 dark:text-white font-bold ring-1 ring-amber-500 cursor-pointer"
                              : "bg-zinc-50/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {/* Circle for radio (single), Square for checkbox (multi) */}
                            <div
                              className={`w-3 h-3 border flex items-center justify-center shrink-0 ${
                                isMulti ? "rounded-none" : "rounded-full"
                              } ${
                                isChecked
                                  ? "border-amber-500 bg-amber-500 text-black"
                                  : "border-zinc-400 dark:border-zinc-600"
                              }`}
                            >
                              {isChecked && <Check className="h-2 w-2 stroke-[3]" />}
                            </div>
                            <span className="text-[11px] sm:text-xs truncate">{option.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0 ml-1">
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
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-none text-rose-600 dark:text-rose-400 text-[11px] font-bold">
                {validationError}
              </div>
            )}
          </div>

          {/* Sticky Bottom Footer with Quantity & Add to Order */}
          <div className="shrink-0 bg-white dark:bg-[#121214] border-t border-zinc-200 dark:border-zinc-800 p-2 sm:p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex items-center gap-2 z-20 shadow-lg w-full overflow-hidden">
            {/* Quantity Controls */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600 rounded-none transition-colors cursor-pointer text-zinc-700 dark:text-zinc-200"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-7 text-center font-mono font-black text-xs sm:text-sm text-zinc-900 dark:text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600 rounded-none transition-colors cursor-pointer text-zinc-700 dark:text-zinc-200"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Add or Update Button */}
            <button
              type="button"
              id="modal-add-to-order-btn"
              onClick={handleConfirmAdd}
              className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-xs sm:text-sm h-9 sm:h-10 px-3 rounded-none shadow-xs transition-colors cursor-pointer flex items-center justify-between border border-amber-600"
            >
              <span>{editingCartItemId ? "Update Item" : "Add to Order"}</span>
              <span className="font-mono font-black text-xs sm:text-sm">
                {formatNPR(lineItemTotal)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
