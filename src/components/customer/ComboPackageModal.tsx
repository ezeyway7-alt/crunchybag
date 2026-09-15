import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "../common/Modal";
import {
  Eye,
  Trash2,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  RotateCcw,
  X,
  Search,
} from "lucide-react";
import { Product, ProductVariant, SelectedModifier } from "../../types";
import { useApp } from "../../context/AppContext";
import { formatNPR } from "../../lib/utils";
import { ProductDetailModal } from "./ProductDetailModal";

export interface ComboPackageDefinition {
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
  basePrice: number;
  originalPrice: number;
  includedProductIds: string[];
}

interface ComboItemConfig {
  instanceId: string;
  product: Product;
  selectedVariant: ProductVariant;
  selectedModifiers: SelectedModifier[];
  quantity: number;
  isBaseItem: boolean;
  baseEstimatedCredit: number; // Credit if removed
  isRemoved?: boolean;
}

interface ComboPackageModalProps {
  combo: ComboPackageDefinition | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ComboPackageModal: React.FC<ComboPackageModalProps> = ({
  combo,
  isOpen,
  onClose,
}) => {
  const { products, addCustomComboToCart } = useApp();

  // Selected items in the combo
  const [items, setItems] = useState<ComboItemConfig[]>([]);
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [isAddMoreOpen, setIsAddMoreOpen] = useState(false);
  const [selectedAddCategory, setSelectedAddCategory] = useState<string>("all");
  const [addSearchQuery, setAddSearchQuery] = useState("");

  // Initialize combo items whenever combo or products change
  useEffect(() => {
    if (!combo || !isOpen) return;

    setIsAddMoreOpen(false);
    setAddSearchQuery("");

    // Map included product IDs to ComboItemConfigs
    const initialItems: ComboItemConfig[] = combo.includedProductIds
      .map((pid, idx) => {
        const prod = products.find((p) => p.id === pid);
        if (!prod) return null;

        const defaultVariant = prod.variants.find((v) => v.isDefault) || prod.variants[0];
        const defaultMods: SelectedModifier[] = [];

        prod.modifierGroups.forEach((group) => {
          const defOpt = group.options.find((o) => o.isDefault);
          if (defOpt) {
            defaultMods.push({
              groupId: group.id,
              groupName: group.name,
              optionId: defOpt.id,
              optionName: defOpt.name,
              priceDelta: defOpt.priceDelta,
            });
          }
        });

        // Credit if removed: approximate proportion of basePrice
        const estimatedCredit = Math.round(prod.basePrice * 0.75);

        return {
          instanceId: `base-${prod.id}-${idx}`,
          product: prod,
          selectedVariant: defaultVariant,
          selectedModifiers: defaultMods,
          quantity: 1,
          isBaseItem: true,
          baseEstimatedCredit: estimatedCredit,
          isRemoved: false,
        };
      })
      .filter(Boolean) as ComboItemConfig[];

    setItems(initialItems);
  }, [combo, isOpen, products]);

  // Active items (not removed and quantity > 0)
  const activeItems = useMemo(
    () => items.filter((it) => !it.isRemoved && it.quantity > 0),
    [items]
  );

  const removedItems = useMemo(
    () => items.filter((it) => it.isRemoved || it.quantity === 0),
    [items]
  );

  // Calculate live dynamic combo total price
  const { comboTotalPrice, totalSavings, totalItemCount } = useMemo(() => {
    if (!combo) return { comboTotalPrice: 0, totalSavings: 0, totalItemCount: 0 };

    let price = combo.basePrice;
    let count = 0;

    items.forEach((it) => {
      if (it.isBaseItem) {
        if (it.isRemoved || it.quantity === 0) {
          // Deduct credit for removed base item
          price = Math.max(0, price - it.baseEstimatedCredit);
        } else {
          count += it.quantity;
          const defaultVar = it.product.variants.find((v) => v.isDefault) || it.product.variants[0];
          const variantDelta = it.selectedVariant.price - defaultVar.price;
          const modsDelta = it.selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);

          // 1st unit covered by combo + upgrades
          price += variantDelta + modsDelta;

          // Extra units if quantity > 1 (10% combo discount)
          if (it.quantity > 1) {
            const extraUnitCost = Math.round((it.selectedVariant.price + modsDelta) * 0.9);
            price += extraUnitCost * (it.quantity - 1);
          }
        }
      } else {
        if (!it.isRemoved && it.quantity > 0) {
          count += it.quantity;
          const modsDelta = it.selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);
          const unitCost = Math.round((it.selectedVariant.price + modsDelta) * 0.9);
          price += unitCost * it.quantity;
        }
      }
    });

    const savings = Math.max(0, (combo.originalPrice || combo.basePrice + 350) - price);

    return {
      comboTotalPrice: Math.max(150, price),
      totalSavings: savings,
      totalItemCount: count,
    };
  }, [combo, items]);

  if (!combo) return null;

  // Handler: change variant for a specific item
  const handleSelectVariant = (instanceId: string, variant: ProductVariant) => {
    setItems((prev) =>
      prev.map((it) => (it.instanceId === instanceId ? { ...it, selectedVariant: variant } : it))
    );
  };

  // Handler: toggle or select modifier for a specific item
  const handleToggleModifier = (
    instanceId: string,
    group: Product["modifierGroups"][0],
    option: typeof group.options[0]
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.instanceId !== instanceId) return it;

        const currentInGroup = it.selectedModifiers.filter((m) => m.groupId === group.id);
        const isAlreadySelected = currentInGroup.some((m) => m.optionId === option.id);

        if (group.maxSelections === 1) {
          const withoutGroup = it.selectedModifiers.filter((m) => m.groupId !== group.id);
          return {
            ...it,
            selectedModifiers: [
              ...withoutGroup,
              {
                groupId: group.id,
                groupName: group.name,
                optionId: option.id,
                optionName: option.name,
                priceDelta: option.priceDelta,
              },
            ],
          };
        }

        if (isAlreadySelected) {
          return {
            ...it,
            selectedModifiers: it.selectedModifiers.filter(
              (m) => !(m.groupId === group.id && m.optionId === option.id)
            ),
          };
        } else {
          if (currentInGroup.length >= group.maxSelections) return it;
          return {
            ...it,
            selectedModifiers: [
              ...it.selectedModifiers,
              {
                groupId: group.id,
                groupName: group.name,
                optionId: option.id,
                optionName: option.name,
                priceDelta: option.priceDelta,
              },
            ],
          };
        }
      })
    );
  };

  // Handler: change quantity for a specific item
  const handleQuantityChange = (instanceId: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.instanceId !== instanceId) return it;
        const newQty = it.quantity + delta;
        if (newQty <= 0) {
          return { ...it, quantity: 0, isRemoved: true };
        }
        return { ...it, quantity: newQty, isRemoved: false };
      })
    );
  };

  // Handler: remove item completely from combo
  const handleRemoveItem = (instanceId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.instanceId === instanceId ? { ...it, isRemoved: true, quantity: 0 } : it))
    );
  };

  // Handler: restore removed item
  const handleRestoreItem = (instanceId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.instanceId === instanceId ? { ...it, isRemoved: false, quantity: 1 } : it))
    );
  };

  // Handler: add other product from menu to combo
  const handleAddProductToCombo = (prod: Product) => {
    const defaultVariant = prod.variants.find((v) => v.isDefault) || prod.variants[0];
    const defaultMods: SelectedModifier[] = [];

    prod.modifierGroups.forEach((group) => {
      const defOpt = group.options.find((o) => o.isDefault);
      if (defOpt) {
        defaultMods.push({
          groupId: group.id,
          groupName: group.name,
          optionId: defOpt.id,
          optionName: defOpt.name,
          priceDelta: defOpt.priceDelta,
        });
      }
    });

    const newItem: ComboItemConfig = {
      instanceId: `extra-${prod.id}-${Date.now()}`,
      product: prod,
      selectedVariant: defaultVariant,
      selectedModifiers: defaultMods,
      quantity: 1,
      isBaseItem: false,
      baseEstimatedCredit: 0,
      isRemoved: false,
    };

    setItems((prev) => [...prev, newItem]);
    setIsAddMoreOpen(false);
  };

  // Inspect product details
  const handleInspectProduct = (prod: Product) => {
    setInspectProduct(prod);
    setIsInspectOpen(true);
  };

  // Add Combo to Cart
  const handleAddToCart = () => {
    if (activeItems.length === 0) return;

    addCustomComboToCart({
      title: combo.title,
      image: combo.image,
      unitPrice: comboTotalPrice,
      quantity: 1,
      items: activeItems.map((it) => ({
        productName: it.quantity > 1 ? `${it.quantity}x ${it.product.name}` : it.product.name,
        variantName: it.selectedVariant.name,
        modifiers: it.selectedModifiers.map((m) =>
          m.priceDelta > 0 ? `${m.optionName} (+${formatNPR(m.priceDelta)})` : m.optionName
        ),
      })),
    });

    onClose();
  };

  // Menu items eligible to be added to combo
  const addableProducts = products.filter((p) => {
    if (selectedAddCategory !== "all" && p.categoryId !== selectedAddCategory) {
      return false;
    }
    if (addSearchQuery.trim() !== "") {
      const q = addSearchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="2xl"
        showCloseButton={false}
        className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-[#121214] rounded-none"
        contentClassName="p-0"
      >
        <div className="flex flex-col max-h-[88vh] overflow-hidden">
          {/* ALWAYS VISIBLE TOP BAR: Title, Live Total Price, "+ Add Item" & "Add to Cart" */}
          <div className="sticky top-0 z-30 bg-white dark:bg-[#151518] px-3 sm:px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shadow-xs">
            {/* Left: Clean Combo Title & Dynamic Package Price */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-xs sm:text-sm uppercase tracking-tight text-zinc-950 dark:text-white truncate">
                  {combo.title}
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  {totalItemCount} items
                </span>
                {totalSavings > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                    Save {formatNPR(totalSavings)}
                  </span>
                )}
              </div>

              {/* Dynamic total price */}
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                  {formatNPR(comboTotalPrice)}
                </span>
                {combo.originalPrice && combo.originalPrice > comboTotalPrice && (
                  <span className="text-[10px] font-mono text-zinc-400 line-through">
                    {formatNPR(combo.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Right: "+ Add Item" Button, "Add to Cart" with Cart Icon, and Close X */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Add New Product Button at Top */}
              <button
                type="button"
                onClick={() => setIsAddMoreOpen(!isAddMoreOpen)}
                className={`h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 shadow-2xs ${
                  isAddMoreOpen
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent"
                    : "bg-zinc-100 dark:bg-[#1E1E22] hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700"
                }`}
                title="Add another product from menu to this package"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Item</span>
              </button>

              {/* Add to Cart Button Always Visible at Top */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={activeItems.length === 0}
                className="h-8 sm:h-8.5 px-3 sm:px-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 border border-amber-600"
              >
                <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add to Cart</span>
              </button>

              {/* Dismiss X */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TOP DRAWER: ADD ITEM SELECTOR (When "+ Add Item" is clicked at top) */}
          {isAddMoreOpen && (
            <div className="bg-zinc-50 dark:bg-[#161619] border-b border-zinc-200 dark:border-zinc-800 p-2.5 space-y-2 shrink-0 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <Plus className="w-3 h-3 text-amber-500" />
                  <span>Choose Extra Item to Add (10% Off)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddMoreOpen(false)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Search & Categories */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    placeholder="Search dishes to add..."
                    className="w-full pl-6 pr-2 py-1 text-xs bg-white dark:bg-[#1E1E22] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Category filters */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: "all", label: "All" },
                    { id: "cat-burgers", label: "Burgers" },
                    { id: "cat-chicken", label: "Chicken" },
                    { id: "cat-sides", label: "Sides" },
                    { id: "cat-drinks", label: "Drinks" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedAddCategory(c.id)}
                      className={`px-2 py-0.5 text-[10px] font-bold whitespace-nowrap border cursor-pointer ${
                        selectedAddCategory === c.id
                          ? "bg-amber-500 text-black border-amber-500"
                          : "bg-white dark:bg-[#1E1E22] border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horizontal / Compact List of addable items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {addableProducts.slice(0, 8).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-1.5 bg-white dark:bg-[#1A1A1E] border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-2"
                  >
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-9 h-9 object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {prod.name}
                      </p>
                      <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                        +{formatNPR(Math.round(prod.basePrice * 0.9))}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleInspectProduct(prod)}
                        className="p-1 text-zinc-400 hover:text-amber-500 cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddProductToCombo(prod)}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] cursor-pointer shadow-xs transition-colors flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAIN PRODUCT LIST: COMPACT VERTICAL LEFT SIDE & WIDER RIGHT SIDE */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2.5 space-y-2">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {activeItems.map((item) => {
                const prod = item.product;
                const defaultVar = prod.variants.find((v) => v.isDefault) || prod.variants[0];

                return (
                  <div
                    key={item.instanceId}
                    className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-start hover:bg-zinc-50/50 dark:hover:bg-[#17171A]/50 transition-colors px-1"
                  >
                    {/* LEFT COLUMN: Ultra-compact vertical stack (Image at top with Eye & Delete on side, Name at bottom, Qty at bottom) */}
                    <div className="w-full sm:w-28 md:w-32 shrink-0 flex flex-col items-center text-center bg-zinc-50/80 dark:bg-[#161619] p-2 border border-zinc-200/80 dark:border-zinc-800">
                      {/* Image with Details Eye & Delete buttons at the side of the image */}
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 mx-auto shrink-0">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
                          loading="lazy"
                        />

                        {/* Details (Eye) and Delete (Trash) icons at the side/corner of the image */}
                        <div className="absolute top-0.5 right-0.5 flex flex-col gap-1 z-10">
                          {/* Eye Details button */}
                          <button
                            type="button"
                            onClick={() => handleInspectProduct(prod)}
                            className="p-1 bg-black/80 hover:bg-black text-white hover:text-amber-400 transition-colors cursor-pointer shadow-xs"
                            title="Inspect details & nutrition"
                          >
                            <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.instanceId)}
                            className="p-1 bg-black/80 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs"
                            title="Remove item from package"
                          >
                            <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Product Name at bottom */}
                      <div className="mt-1.5 w-full text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className="text-[11px] sm:text-xs font-bold text-zinc-950 dark:text-zinc-100 truncate block max-w-full"
                            title={prod.name}
                          >
                            {prod.name}
                          </span>
                          {!item.isBaseItem && (
                            <span className="text-[8px] px-1 py-0.2 bg-amber-500 text-black font-black uppercase shrink-0">
                              Extra
                            </span>
                          )}
                        </div>

                        {/* Upgrade / Price readout */}
                        <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {item.isBaseItem ? (
                            item.selectedVariant.id !== defaultVar.id ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                +{formatNPR(item.selectedVariant.price - defaultVar.price)}
                              </span>
                            ) : (
                              <span className="text-zinc-400">Included</span>
                            )
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              +{formatNPR(Math.round(item.selectedVariant.price * 0.9))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper at the bottom of left column */}
                      <div className="mt-1.5 flex items-center justify-center border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#1E1E22] h-6 w-full max-w-[85px]">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.instanceId, -1)}
                          className="w-5 h-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="flex-1 text-center text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.instanceId, 1)}
                          className="w-5 h-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Full Remaining Width for Choices (Sizes & Modifiers) */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 sm:pl-3 pt-2 sm:pt-0 self-center">
                      {/* Portion / Size Selector */}
                      {prod.variants.length > 1 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 shrink-0">
                            Size:
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {prod.variants.map((v) => {
                              const isSelected = item.selectedVariant.id === v.id;
                              const delta = item.isBaseItem
                                ? v.price - defaultVar.price
                                : v.price;

                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleSelectVariant(item.instanceId, v)}
                                  className={`px-2 py-0.5 text-[11px] font-bold border transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-amber-500 text-black border-amber-600 font-black shadow-xs"
                                      : "bg-zinc-100 dark:bg-[#1E1E22] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                                  }`}
                                >
                                  <span>{v.name}</span>
                                  {delta > 0 && (
                                    <span className="ml-1 text-[10px] font-mono">
                                      +{formatNPR(delta)}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Modifiers (Sauce, Bun, Heat, Cheese, Extras) */}
                      {prod.modifierGroups.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          {prod.modifierGroups.map((group) => (
                            <div key={group.id} className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 shrink-0">
                                {group.name}:
                              </span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {group.options.map((opt) => {
                                  const isSel = item.selectedModifiers.some(
                                    (m) => m.groupId === group.id && m.optionId === opt.id
                                  );

                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() =>
                                        handleToggleModifier(item.instanceId, group, opt)
                                      }
                                      className={`px-1.5 py-0.5 text-[10px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                                        isSel
                                          ? "bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent font-bold"
                                          : "bg-zinc-100 dark:bg-[#1E1E22] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                                      }`}
                                    >
                                      {isSel && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                      <span>{opt.name}</span>
                                      {opt.priceDelta > 0 && (
                                        <span className="text-[9px] font-mono">
                                          (+{formatNPR(opt.priceDelta)})
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* If product has no variants or modifiers */}
                      {prod.variants.length <= 1 && prod.modifierGroups.length === 0 && (
                        <span className="text-[11px] text-zinc-400 italic">
                          Standard Chef Recipe included
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state if all items removed */}
            {activeItems.length === 0 && (
              <div className="py-6 text-center border border-dashed border-zinc-300 dark:border-zinc-700 space-y-1">
                <p className="text-xs font-bold text-zinc-500">
                  All items removed from this package.
                </p>
                <p className="text-[11px] text-zinc-400">
                  Restore an item below or click "+ Add Item" at the top to add other dishes.
                </p>
              </div>
            )}

            {/* Restorable Removed Items */}
            {removedItems.length > 0 && (
              <div className="p-2 bg-zinc-50 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  <span>Removed:</span>
                </span>
                {removedItems.map((rem) => (
                  <button
                    key={rem.instanceId}
                    type="button"
                    onClick={() => handleRestoreItem(rem.instanceId)}
                    className="px-2 py-0.5 bg-white dark:bg-[#1E1E22] border border-dashed border-zinc-300 dark:border-zinc-700 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:border-amber-500 hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Restore {rem.product.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Product Details Inspector Modal */}
      <ProductDetailModal
        product={inspectProduct}
        isOpen={isInspectOpen}
        onClose={() => setIsInspectOpen(false)}
      />
    </>
  );
};
