import React, { useState, useRef } from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Eye,
  Sparkles,
  Check,
  PackageCheck,
  Utensils,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Drawer } from "../common/Drawer";
import { Button } from "../common/Button";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { formatNPR } from "../../lib/utils";
import { CartLineItem, Product } from "../../types";
import { CartItemDetailModal } from "./CartItemDetailModal";
import { ProductConfiguratorModal } from "./ProductConfiguratorModal";

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateCartItemQty,
    updateCartItemConfig,
    removeCartItem,
    clearCart,
    products,
    addToCart,
  } = useApp();

  const [inspectingItem, setInspectingItem] = useState<CartLineItem | null>(null);
  const [editingItem, setEditingItem] = useState<{
    item: CartLineItem;
    product: Product;
  } | null>(null);
  const [showSaucePrompt, setShowSaucePrompt] = useState(false);
  const sauceSectionRef = useRef<HTMLDivElement>(null);

  const totalItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const isEmpty = cart.items.length === 0;

  // Check whether the cart contains at least one sauce, dip, sausage, or paid add-on
  const hasSauceOrAddon = cart.items.some((item) => {
    const isSauceOrSide =
      /sauce|dip|mayo|glaze|sausage|ranch|queso/i.test(item.productName) ||
      /sauce|dip|mayo|glaze|sausage|ranch|queso/i.test(item.variant.name);
    const hasPaidMod = item.selectedModifiers.some((m) => m.priceDelta > 0);
    return isSauceOrSide || hasPaidMod;
  });

  // Curated quick-add signature sauces and add-ons
  const signatureSauces = [
    {
      id: "prod-sauce-01",
      name: "Smoked Garlic Aioli",
      price: 50,
      image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=200&auto=format&fit=crop&q=80",
      tag: "House Favorite",
    },
    {
      id: "prod-sauce-02",
      name: "Ghost Pepper Fire Glaze",
      price: 40,
      image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=200&auto=format&fit=crop&q=80",
      tag: "Spicy",
    },
    {
      id: "prod-sauce-03",
      name: "Black Truffle Raclette Mayo",
      price: 75,
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&auto=format&fit=crop&q=80",
      tag: "Truffle",
    },
    {
      id: "prod-sauce-04",
      name: "Crispy Sausage Bites (4 pcs)",
      price: 160,
      image: "https://images.unsplash.com/photo-1585325701165-351af916e581?w=200&auto=format&fit=crop&q=80",
      tag: "Hot Snack",
    },
    {
      id: "prod-sauce-05",
      name: "Herbed Buttermilk Ranch",
      price: 45,
      image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=200&auto=format&fit=crop&q=80",
      tag: "Cool & Tangy",
    },
    {
      id: "prod-sauce-06",
      name: "Cheesy Jalapeño Queso",
      price: 60,
      image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=200&auto=format&fit=crop&q=80",
      tag: "Warm Dip",
    },
  ];

  const handleQuickAddSauce = (sauce: typeof signatureSauces[0]) => {
    setShowSaucePrompt(false);
    const existingProduct = products.find((p) => p.id === sauce.id) || {
      id: sauce.id,
      categoryId: "cat-sides",
      name: sauce.name,
      description: "Signature craft pairing",
      basePrice: sauce.price,
      images: [sauce.image],
      dietary: ["Popular"],
      isDeliveryEligible: true,
      isAvailable: true,
      prepTimeMinutes: 2,
      variants: [{ id: `v-${sauce.id}`, name: "Regular Tub", price: sauce.price, isDefault: true }],
      modifierGroups: [],
    };

    const variant = existingProduct.variants[0];
    addToCart(existingProduct, variant, [], 1);
  };

  const handleCheckoutClick = () => {
    if (!hasSauceOrAddon) {
      setShowSaucePrompt(true);
      if (sauceSectionRef.current) {
        sauceSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setIsCartDrawerOpen(false);
    onOpenCheckout();
  };

  const handleReconfigureItem = (item: CartLineItem) => {
    const prod = products.find((p) => p.id === item.productId);
    if (prod) {
      setEditingItem({ item, product: prod });
    }
  };

  return (
    <>
      <Drawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        headerClassName="px-3 py-1.5 sm:py-2 border-b border-zinc-200 dark:border-zinc-800"
        bodyClassName="p-0 flex flex-col h-full overflow-hidden"
        title={
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-black text-xs sm:text-sm uppercase tracking-tight">Your Cart</span>
            {!isEmpty && (
              <span className="text-[10px] font-mono font-bold bg-amber-500 text-black px-1.5 py-0.2 border border-black leading-tight">
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>
        }
      >
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="flex items-center justify-center">
              <CrunchyLogo size="lg" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-zinc-900 dark:text-white">
                Your cart is empty
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                Add delicious burgers, crispy chicken, and shakes to start your order.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              className="mt-2 rounded-none text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black border border-black cursor-pointer"
              onClick={() => setIsCartDrawerOpen(false)}
            >
              Explore Menu
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between overflow-hidden">
            {/* Cart Item Rows - Ultra Compact High Density */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1.5">
              {cart.items.map((item) => {
                const isCombo =
                  item.productId.startsWith("combo-") ||
                  item.variant.id.includes("combo") ||
                  item.productName.toLowerCase().includes("combo") ||
                  item.productName.toLowerCase().includes("feast");

                return (
                  <div
                    key={item.cartItemId}
                    className="p-2 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2.5 group transition-all"
                  >
                    {/* Compact Thumbnail */}
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-12 object-cover shrink-0 border border-zinc-200 dark:border-zinc-800"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {/* Top Line: Item Name & Quick Action Icons */}
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                          {item.productName}
                        </h5>

                        <div className="flex items-center gap-0.5 shrink-0">
                          {/* Eye Icon to view details / configure */}
                          <button
                            type="button"
                            onClick={() => setInspectingItem(item)}
                            className="text-zinc-400 hover:text-amber-500 p-0.5 transition-colors cursor-pointer rounded-none hover:bg-amber-500/10"
                            title="View details & items"
                            aria-label="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item.cartItemId)}
                            className="text-zinc-400 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Variant / Combo Pack Indicator */}
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.2">
                        {isCombo ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            Combo ({item.selectedModifiers.length} items)
                          </span>
                        ) : (
                          <span>{item.variant.name}</span>
                        )}
                        {!isCombo && item.selectedModifiers.length > 0 && (
                          <span className="text-zinc-400 ml-1">
                            • {item.selectedModifiers.map((m) => m.optionName).join(", ")}
                          </span>
                        )}
                      </div>

                      {/* Bottom Line: Line Price & Compact Quantity Stepper */}
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/60">
                        <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">
                          {formatNPR(item.lineTotal)}
                        </span>

                        <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 h-5.5">
                          <button
                            onClick={() => updateCartItemQty(item.cartItemId, -1)}
                            className="w-5 h-full flex items-center justify-center text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Decrease quantity"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="px-1.5 font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-100 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQty(item.cartItemId, 1)}
                            className="w-5 h-full flex items-center justify-center text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Increase quantity"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* SAUCE & ADD-ON SUGGESTION SECTION (Effortless 1-tap UX on Mobile & Laptop) */}
              <div
                ref={sauceSectionRef}
                className={`mt-4 p-3 transition-all rounded-none border ${
                  showSaucePrompt && !hasSauceOrAddon
                    ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/50"
                    : hasSauceOrAddon
                    ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/10"
                    : "bg-zinc-50 dark:bg-[#18181B] border-zinc-200 dark:border-zinc-800"
                }`}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {hasSauceOrAddon ? (
                      <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Craft Sauce / Add-on Added</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Pair with a Craft Sauce / Add-on</span>
                      </span>
                    )}
                  </div>

                  {!hasSauceOrAddon ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-500 text-black shrink-0 tracking-wider">
                      Min. 1 Required
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      1-Tap Extras
                    </span>
                  )}
                </div>

                {/* Friendly Inline Notice when prompted */}
                {showSaucePrompt && !hasSauceOrAddon && (
                  <div className="mb-2 p-2 bg-amber-500 text-black text-xs font-bold flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Please tap <b>+ Add</b> on any sauce or bite below to proceed:</span>
                    </div>
                  </div>
                )}

                {/* Horizontal Quick-Add Scroll Strip */}
                <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                  {signatureSauces.map((sauce) => {
                    const inCartCount = cart.items
                      .filter((i) => i.productId === sauce.id || i.productName === sauce.name)
                      .reduce((sum, i) => sum + i.quantity, 0);

                    return (
                      <div
                        key={sauce.id}
                        className={`shrink-0 w-36 sm:w-40 p-2 bg-white dark:bg-[#121214] border transition-all flex flex-col justify-between ${
                          inCartCount > 0
                            ? "border-emerald-500 ring-1 ring-emerald-500"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-amber-400"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <img
                            src={sauce.image}
                            alt={sauce.name}
                            className="w-8 h-8 rounded-none object-cover shrink-0 border border-zinc-200 dark:border-zinc-800"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-mono text-zinc-400 block leading-none">
                              {sauce.tag}
                            </span>
                            <h6 className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                              {sauce.name}
                            </h6>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                          <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            {formatNPR(sauce.price)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleQuickAddSauce(sauce)}
                            className={`h-6 px-2 text-[10px] font-black uppercase tracking-wider rounded-none flex items-center gap-1 transition-all cursor-pointer ${
                              inCartCount > 0
                                ? "bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-600"
                                : "bg-amber-500 hover:bg-amber-400 text-black border border-amber-600 shadow-2xs"
                            }`}
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>{inCartCount > 0 ? `${inCartCount} Added` : "Add"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cart Footer - Compact Layout for Maximum Product Listing Height */}
            <div className="p-2.5 sm:p-3 bg-white dark:bg-[#121214] border-t border-zinc-200 dark:border-zinc-800 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Total</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    (VAT incl. • {cart.items.length} {cart.items.length === 1 ? "item" : "items"})
                  </span>
                </div>
                <span className="font-mono text-amber-600 dark:text-amber-400 text-sm sm:text-base font-black">
                  {formatNPR(cart.finalTotal)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] font-bold text-zinc-400 hover:text-rose-500 px-2.5 py-2 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/40 transition-colors cursor-pointer shrink-0 h-9 flex items-center justify-center"
                  title="Clear all items from cart"
                >
                  Clear
                </button>

                {/* Dynamic Checkout Button */}
                {hasSauceOrAddon ? (
                  <button
                    type="button"
                    id="cart-checkout-btn"
                    onClick={handleCheckoutClick}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black text-xs sm:text-sm h-9 px-3 border border-black shadow-xs transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>Checkout</span>
                    <div className="flex items-center gap-1 font-mono font-black">
                      <span>{formatNPR(cart.finalTotal)}</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="cart-checkout-btn"
                    onClick={handleCheckoutClick}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-amber-400 font-black text-xs h-9 px-2.5 border border-amber-500/80 shadow-xs transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5 text-left truncate">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-[11px] truncate">Select 1 Sauce to Proceed</span>
                    </div>
                    <span className="text-[9px] uppercase font-mono font-black bg-amber-500 text-black px-1.5 py-0.5 shrink-0 ml-1">
                      Choose
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Cart Item Detail Modal (Inspector for Combo Breakdown & Regular Product) */}
      <CartItemDetailModal
        item={inspectingItem}
        isOpen={!!inspectingItem}
        onClose={() => setInspectingItem(null)}
        onReconfigureItem={handleReconfigureItem}
      />

      {/* Reconfigure Modal for editing existing cart items */}
      {editingItem && (
        <ProductConfiguratorModal
          product={editingItem.product}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          editingCartItemId={editingItem.item.cartItemId}
          initialVariant={editingItem.item.variant}
          initialModifiers={editingItem.item.selectedModifiers}
          initialQuantity={editingItem.item.quantity}
          onAddToCart={() => {}}
          onUpdateCartItem={(cartItemId, variant, modifiers, quantity) => {
            updateCartItemConfig(cartItemId, variant, modifiers, quantity);
            setEditingItem(null);
          }}
        />
      )}
    </>
  );
};
