import React from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Drawer } from "../common/Drawer";
import { Button } from "../common/Button";
import { formatNPR } from "../../lib/utils";

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    currentOutlet,
    fulfillmentType,
  } = useApp();

  const totalItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const isEmpty = cart.items.length === 0;

  return (
    <Drawer
      isOpen={isCartDrawerOpen}
      onClose={() => setIsCartDrawerOpen(false)}
      bodyClassName="p-0 flex flex-col h-full overflow-hidden"
      title={
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4.5 w-4.5 text-amber-500" />
          <span className="font-black text-base sm:text-lg">Your Cart</span>
          {!isEmpty && (
            <span className="text-[11px] font-mono font-bold bg-amber-500 text-black px-2 py-0.5 border border-black">
              {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      }
      description={
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {fulfillmentType === "DELIVERY" ? "Doorstep delivery from" : "Pickup at"} {currentOutlet.name}
        </span>
      }
    >
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
            <ShoppingBag className="h-8 w-8 stroke-[1.5] text-zinc-400 dark:text-zinc-500" />
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
            className="mt-2 rounded-none text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black border border-black"
            onClick={() => setIsCartDrawerOpen(false)}
          >
            Explore Menu
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between overflow-hidden">
          {/* Cart Item Rows */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.items.map((item) => (
              <div
                key={item.cartItemId}
                className="p-3 bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/80 dark:border-zinc-800 flex gap-3 group transition-all"
              >
                {/* Thumbnail */}
                <img
                  src={item.image}
                  alt={item.productName}
                  className="w-16 h-16 object-cover shrink-0 border border-zinc-200 dark:border-zinc-800"
                />

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h5 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                        {item.productName}
                      </h5>
                      <button
                        onClick={() => removeCartItem(item.cartItemId)}
                        className="text-zinc-400 hover:text-rose-500 p-1 -mr-1 transition-colors cursor-pointer"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Variant info */}
                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      {item.variant.name}
                    </p>

                    {/* Modifiers List */}
                    {item.selectedModifiers.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedModifiers.map((mod, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700"
                          >
                            {mod.optionName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price & Quantity Controls */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80">
                    <span className="font-mono font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                      {formatNPR(item.lineTotal)}
                    </span>

                    <div className="flex items-center border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                      <button
                        onClick={() => updateCartItemQty(item.cartItemId, -1)}
                        className="p-1 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Decrease quantity"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQty(item.cartItemId, 1)}
                        className="p-1 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Increase quantity"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Footer */}
          <div className="p-4 bg-white dark:bg-[#121214] border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">
                  {formatNPR(cart.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Tax (13% PAN/VAT Incl.)</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">
                  {formatNPR(cart.taxInclusiveAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-zinc-950 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span>Total</span>
                <span className="font-mono text-amber-500 text-base font-black">
                  {formatNPR(cart.finalTotal)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-zinc-400 hover:text-rose-500 px-3 py-2.5 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                id="cart-checkout-btn"
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  onOpenCheckout();
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-black font-black text-xs sm:text-sm h-11 sm:h-12 px-4 border border-black shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <span>Proceed to Checkout</span>
                <div className="flex items-center gap-1.5 font-mono font-black">
                  <span>{formatNPR(cart.finalTotal)}</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};

