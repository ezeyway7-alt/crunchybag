import React, { useState, useEffect } from "react";
import { Clock, Check, Plus, Minus, Flame, X, ShoppingBag } from "lucide-react";
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
      maxWidth="2xl"
      showCloseButton={false}
      className="max-w-xl sm:max-w-2xl w-full h-[90vh] sm:h-[85vh] max-h-[720px] min-h-0 border border-zinc-800 shadow-2xl overflow-hidden rounded-xl bg-[#121214] text-zinc-100 flex flex-col"
      contentClassName="p-0 h-full flex flex-col min-h-0 overflow-hidden"
    >
      <div className="flex flex-col h-full min-h-0 bg-[#121214] text-zinc-100 overflow-hidden w-full">
        {/* Top Image Showcase (Cinematic Food Presentation) */}
        <div className="relative w-full h-44 sm:h-52 bg-zinc-950 shrink-0 overflow-hidden flex flex-col justify-between border-b border-zinc-800">
          <img
            src={product.images[activeImageIndex] || product.images[0]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300"
          />

          {/* Vignette & Contrast Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-black/25 to-black/40 pointer-events-none" />

          {/* Top Row: Dietary Pills & Floating Close Button */}
          <div className="relative z-10 p-3 flex items-center justify-between w-full">
            {/* Dietary Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.dietary?.map((tag) => (
                <span
                  key={tag}
                  className="bg-black/75 backdrop-blur-md text-amber-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border border-amber-500/30"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Floating Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white/90 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer shadow-lg transition-all ml-auto"
              aria-label="Close"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Bottom Overlays: Thumbnails & Prep/Calorie Badges */}
          <div className="relative z-10 px-3 pb-3 flex items-end justify-between gap-2 w-full">
            {/* Thumbnail switchers (if multiple images) */}
            {product.images.length > 1 ? (
              <div className="flex gap-1.5">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-8 h-8 rounded-md overflow-hidden border transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-amber-500 scale-105 shadow-sm ring-1 ring-amber-500/50"
                        : "border-white/30 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : <div />}

            {/* Prep time & calories badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="bg-black/80 backdrop-blur-md text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 border border-white/15">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>{product.prepTimeMinutes}m prep</span>
              </span>
              {product.calories && (
                <span className="bg-black/80 backdrop-blur-md text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 border border-white/15">
                  <Flame className="h-3 w-3 text-amber-400" />
                  <span>{product.calories} kcal</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customization & Action Column */}
        <div className="flex-1 min-h-0 flex flex-col h-full bg-[#121214] overflow-hidden">
          {/* Header with Title, Live Price, and Description */}
          <div className="px-4 sm:px-5 py-3 border-b border-zinc-800 bg-[#161619] flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {product.name}
                </h2>
                {product.isFeatured && (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-sm">
                    Popular
                  </span>
                )}
              </div>
              {product.description && (
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Unit Price</span>
              <span className="font-mono text-base font-bold text-amber-400">
                {formatNPR(unitCalculatedPrice)}
              </span>
            </div>
          </div>

          {/* Scrollable Customization Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 text-xs sm:text-sm overscroll-contain touch-pan-y">
            {/* Variant / Size Selector */}
            {product.variants.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-100">
                      Choose Size / Variant
                    </h3>
                    <span className="text-[10px] text-zinc-400">Select 1</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded-sm">
                    Required
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500/50 shadow-sm"
                            : "bg-[#18181B] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#1E1E22]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? "border-amber-500 bg-amber-500 text-black"
                                : "border-zinc-600 bg-transparent"
                            }`}
                          >
                            {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                          </div>
                          <span className="text-xs sm:text-sm font-semibold truncate">{variant.name}</span>
                        </div>
                        <span className="font-mono text-xs sm:text-sm font-bold text-amber-400 shrink-0 ml-2">
                          {formatNPR(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modifier Groups (Sauces, Extras, Toppings, Drinks) */}
            {product.modifierGroups.map((group) => {
              const selectionsInGroup = selectedModifiers.filter((m) => m.groupId === group.id);
              const isSatisfied =
                !group.required || selectionsInGroup.length >= group.minSelections;

              return (
                <div
                  key={group.id}
                  className="space-y-2 pt-3 border-t border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-zinc-100">
                        {group.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400">
                        {group.maxSelections === 1
                          ? "Pick 1 option"
                          : `Pick up to ${group.maxSelections} options`}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm border ${
                        isSatisfied
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                          : group.required
                          ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                          : "text-zinc-400 bg-zinc-800/80 border-zinc-700"
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
                          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border text-left transition-all cursor-pointer ${
                            isChecked
                              ? "bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500/50 shadow-sm"
                              : "bg-[#18181B] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#1E1E22]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div
                              className={`w-3.5 h-3.5 ${group.maxSelections === 1 ? "rounded-full" : "rounded-sm"} border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? "border-amber-500 bg-amber-500 text-black"
                                  : "border-zinc-600 bg-transparent"
                              }`}
                            >
                              {isChecked && <Check className="h-2 w-2 stroke-[3]" />}
                            </div>
                            <span className="text-xs sm:text-sm font-medium leading-tight truncate">{option.name}</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-zinc-400 shrink-0 ml-2">
                            {option.priceDelta === 0 ? (
                              <span className="text-zinc-500 font-normal">Free</span>
                            ) : (
                              <span className="text-amber-400">+{formatNPR(option.priceDelta)}</span>
                            )}
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
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Sticky Bottom Footer with Quantity & Add to Order */}
          <div className="shrink-0 bg-[#161619] border-t border-zinc-800 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3 z-20 shadow-2xl w-full">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-[#1D1D21] border border-zinc-700 rounded-lg p-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 active:bg-zinc-700 rounded-md transition-colors cursor-pointer text-zinc-300 hover:text-white"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
              <span className="w-8 text-center font-mono font-black text-sm text-white">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 active:bg-zinc-700 rounded-md transition-colors cursor-pointer text-zinc-300 hover:text-white"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Add or Update Button */}
            <button
              type="button"
              id="modal-add-to-order-btn"
              onClick={handleConfirmAdd}
              className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-xs sm:text-sm h-10 sm:h-11 px-4 rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-between border border-amber-600"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                <span>{editingCartItemId ? "Update Item" : "Add to Order"}</span>
              </span>
              <span className="font-mono font-black text-xs sm:text-sm bg-black/15 px-2 py-0.5 rounded">
                {formatNPR(lineItemTotal)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
