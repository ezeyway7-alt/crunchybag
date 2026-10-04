import { ComboPackageModal } from "./ComboPackageModal";
import { comboDefinitions } from "../../lib/catalogApi";
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
    cart, cartSyncError, retryCartSync,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateCartItemQty,
    updateCartItemConfig,
    removeCartItem,
    clearCart,
    products,
    addToCart,
    addCustomComboToCart,
  } = useApp();

  const [inspectingItem, setInspectingItem] = useState<CartLineItem | null>(null);
  const [editingItem, setEditingItem] = useState<{
    item: CartLineItem;
    product: Product;
  } | null>(null);
  const totalItemCount = cart.items.reduce((sum,item) => sum+item.quantity,0);
  const isEmpty = cart.items.length === 0;
  const handleCheckoutClick = () => {setIsCartDrawerOpen(false);onOpenCheckout();};

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
        size="lg"
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
        {cartSyncError && <div role="alert" className="p-3 text-xs text-amber-400">{cartSyncError} <button onClick={()=>void retryCartSync()} className="underline">Retry</button></div>}
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
                        {!isCombo && item.selectedModifiers && item.selectedModifiers.length > 0 && (
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

      {editingItem?.product.isComboPackage && <ComboPackageModal combo={comboDefinitions([editingItem.product])[0]} initialSelections={editingItem.item.comboSelections} isOpen onClose={()=>setEditingItem(null)} onAddToCartCustom={data=>{removeCartItem(editingItem.item.cartItemId);addCustomComboToCart({...data,quantity:editingItem.item.quantity});}} />}
      {/* Reconfigure Modal for editing existing cart items */}
      {editingItem && !editingItem.product.isComboPackage && (
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
