import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { ShoppingBag, Eye, X, Check, Utensils, Tag } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatNPR } from "../../lib/utils";

interface OrderItemsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const OrderItemsPreviewModal: React.FC<OrderItemsPreviewModalProps> = ({
  isOpen,
  onClose,
  title = "Order Items Preview",
  description = "Review items in your order",
}) => {
  const { cart } = useApp();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-500" />
          <span className="font-black text-sm sm:text-base">{title}</span>
        </div>
      }
      description={description}
    >
      <div className="space-y-4">
        {cart.items.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Your cart is currently empty
            </p>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Add mouthwatering burgers, crispy chicken, combos, or shakes to preview your order.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onClose}
              className="rounded-none text-xs font-black bg-amber-500 text-black border border-black"
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <>
            {/* Summary Count Bar */}
            <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)} Items ({cart.items.length} Distinct Lines)
                </span>
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-black">
                Payable: {formatNPR(cart.finalTotal)}
              </span>
            </div>

            {/* List of Cart Items */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {cart.items.map((item, idx) => (
                <div
                  key={item.cartItemId || idx}
                  className="p-3 bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 flex gap-3 items-start"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800"
                    loading="lazy"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-zinc-950 dark:text-white leading-tight">
                        {item.productName}
                      </h4>
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                        {formatNPR(item.lineTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      <span>{item.variant.name}</span>
                      <span>•</span>
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono">
                        Qty: {item.quantity} × {formatNPR(item.unitPrice)}
                      </span>
                    </div>

                    {/* Modifiers / Included Items summary */}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="pt-1 space-y-0.5">
                        <p className="text-[10px] uppercase tracking-wider font-mono text-zinc-400 font-bold">
                          Selected Choices / Included Items:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.selectedModifiers.map((mod, mIdx) => (
                            <span
                              key={mIdx}
                              className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium"
                            >
                              {mod.groupName && !mod.groupName.startsWith("combo-item") ? `${mod.groupName}: ` : ""}
                              {mod.optionName}
                              {mod.priceDelta > 0 && ` (+${formatNPR(mod.priceDelta)})`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Total & Close */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Total with 13% PAN / VAT: </span>
                <span className="font-mono font-black text-zinc-950 dark:text-white text-sm">
                  {formatNPR(cart.finalTotal)}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-none text-xs font-bold"
              >
                Close View
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
