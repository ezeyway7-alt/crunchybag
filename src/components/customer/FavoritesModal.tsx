import React from "react";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Modal } from "../common/Modal";
import { formatNPR } from "../../lib/utils";
import { Button } from "../common/Button";

export const FavoritesModal: React.FC = () => {
  const {
    isFavoritesModalOpen,
    setIsFavoritesModalOpen,
    favorites,
    products,
    toggleFavorite,
    addToCart,
    addToast,
  } = useApp();

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  const handleQuickAdd = (product: typeof products[0]) => {
    addToCart(product, product.variants[0], [], 1);
    addToast({
      title: "Added to Cart",
      description: `${product.name} added to your order.`,
      type: "success",
    });
  };

  return (
    <Modal
      isOpen={isFavoritesModalOpen}
      onClose={() => setIsFavoritesModalOpen(false)}
      title="Saved Favorites"
      description="Quickly order your favorite crispy chicken & burgers"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {favoriteProducts.length > 0 ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {favoriteProducts.map((product) => (
              <div
                key={product.id}
                className="py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-14 h-14 object-cover shrink-0 border border-zinc-200 dark:border-zinc-800"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-[13px] text-zinc-900 dark:text-white truncate">
                      {product.name}
                    </h4>
                    <p className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                      {formatNPR(product.basePrice)}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate max-w-xs">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleQuickAdd(product)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Heart className="w-6 h-6 text-zinc-400" />
            </div>
            <h4 className="font-bold text-base text-zinc-900 dark:text-white">
              No favorites saved yet
            </h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Tap the heart icon on any burger, meal, or crispy chicken item to keep it handy here.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsFavoritesModalOpen(false)}
              className="mt-2"
            >
              Browse Menu
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
