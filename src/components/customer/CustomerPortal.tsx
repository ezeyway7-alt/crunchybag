import React, { useState } from "react";
import {
  Flame,
  Drumstick,
  UtensilsCrossed,
  Coffee,
  Sparkles,
  LayoutGrid,
  BadgePercent,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Product } from "../../types";
import { ProductCard } from "./ProductCard";
import { ProductConfiguratorModal } from "./ProductConfiguratorModal";
import { CartDrawer } from "./CartDrawer";
import { TakeawayCheckoutModal } from "./TakeawayCheckoutModal";
import { CustomerAuthModal } from "./CustomerAuthModal";
import { CustomerProfileModal } from "./CustomerProfileModal";
import { InstantSearchModal } from "./InstantSearchModal";
import { LiveOrderTracker } from "./LiveOrderTracker";
import { FavoritesModal } from "./FavoritesModal";
import { HeroBannerSlider } from "./HeroBannerSlider";
import { Button } from "../common/Button";
import { CustomerFooter } from "./CustomerFooter";

export const CustomerPortal: React.FC = () => {
  const {
    products,
    categories,
    addToCart,
    isLoadingSkeleton,
    customerActiveTab,
    setCustomerActiveTab,
    isSearchModalOpen,
    setIsSearchModalOpen,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modals
  const [activeProductForConfig, setActiveProductForConfig] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | undefined>(undefined);

  // Category icons mapper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Flame":
        return <Flame className="h-4 w-4 text-amber-500" />;
      case "Drumstick":
        return <Drumstick className="h-4 w-4 text-amber-500" />;
      case "UtensilsCrossed":
        return <UtensilsCrossed className="h-4 w-4 text-amber-500" />;
      case "Coffee":
        return <Coffee className="h-4 w-4 text-amber-500" />;
      case "Sparkles":
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      default:
        return <Flame className="h-4 w-4 text-amber-500" />;
    }
  };

  // Filter products by active category / special / offer
  const displayedProducts = products.filter((p) => {
    if (selectedCategory === "all") {
      return true;
    }
    if (selectedCategory === "special") {
      return p.dietary.includes("Chef's Choice") || p.dietary.includes("Popular");
    }
    if (selectedCategory === "offer") {
      return (
        p.categoryId === "cat-combos" ||
        p.variants.some(
          (v) =>
            v.name.toLowerCase().includes("combo") ||
            v.name.toLowerCase().includes("meal") ||
            v.name.toLowerCase().includes("double")
        )
      );
    }
    return p.categoryId === selectedCategory;
  });

  const getActiveCategoryTitle = () => {
    if (selectedCategory === "all") return "All Menu Items";
    if (selectedCategory === "special") return "Today's Special";
    if (selectedCategory === "offer") return "Offers & Combos";
    return categories.find((c) => c.id === selectedCategory)?.name || "this category";
  };

  const handleQuickAdd = (product: Product) => {
    addToCart(product, product.variants[0], [], 1);
  };

  const handleOrderSuccess = (orderId: string) => {
    setTrackedOrderId(orderId);
    setCustomerActiveTab("orders");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0B] text-zinc-900 dark:text-zinc-100 transition-colors">
      {customerActiveTab === "menu" ? (
        <main id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-8 space-y-8">
          {/* Semantic SEO Primary Headline for Search Engines & Screen Readers */}
          <h1 className="sr-only">
            Crunchy – Crispy Fried Chicken, Gourmet Smash Burgers & Food Delivery in Kathmandu with eSewa
          </h1>

          {/* Hero Promotional Banner Slider (2.5 cards visible in desktop view) */}
          <HeroBannerSlider onSelectCategory={(catId) => setSelectedCategory(catId)} />

          {/* Sticky Category Rail */}
          <div
            id="categories-rail"
            className="sticky top-[98px] md:top-16 z-30 bg-zinc-50/95 dark:bg-[#0A0A0B]/95 backdrop-blur-md py-3 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {/* 1. All (Default) */}
                <button
                  id="category-tab-all"
                  onClick={() => setSelectedCategory("all")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === "all"
                      ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                      : "bg-white dark:bg-[#18181B] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 text-amber-500" />
                  <span>All</span>
                </button>

                {/* 2. Today's Special */}
                <button
                  id="category-tab-special"
                  onClick={() => setSelectedCategory("special")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === "special"
                      ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                      : "bg-white dark:bg-[#18181B] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Today's Special</span>
                </button>

                {/* 3. Offer */}
                <button
                  id="category-tab-offer"
                  onClick={() => setSelectedCategory("offer")}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === "offer"
                      ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                      : "bg-white dark:bg-[#18181B] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <BadgePercent className="h-4 w-4 text-amber-500" />
                  <span>Offer</span>
                </button>

                {/* 4. Category List (Gourmet Burgers, Crispy Chicken, etc.) */}
                {categories.map((category) => {
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                          : "bg-white dark:bg-[#18181B] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {getCategoryIcon(category.iconName)}
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isLoading={isLoadingSkeleton}
                onSelect={(p) => setActiveProductForConfig(p)}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>

          {/* Empty Results Recovery */}
          {displayedProducts.length === 0 && (
            <div className="py-16 text-center space-y-3 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-8">
              <Sparkles className="h-10 w-10 text-amber-500 mx-auto" />
              <h4 className="font-bold text-lg text-zinc-900 dark:text-white">
                No items found in {getActiveCategoryTitle()}
              </h4>
              <p className="text-xs text-zinc-500">
                Explore our full range of items by selecting "All".
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                View All Items
              </Button>
            </div>
          )}
        </main>
      ) : (
        <LiveOrderTracker
          initialOrderId={trackedOrderId}
          onExploreMenu={() => setCustomerActiveTab("menu")}
        />
      )}

      {/* Seamless Customer Footer with Location Map & Easy Navigation */}
      <CustomerFooter />

      {/* Product Detail & Quote Configurator Modal */}
      <ProductConfiguratorModal
        product={activeProductForConfig}
        isOpen={!!activeProductForConfig}
        onClose={() => setActiveProductForConfig(null)}
        onAddToCart={addToCart}
      />

      {/* Persistent Cart Drawer */}
      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />

      {/* Takeaway Checkout Modal */}
      <TakeawayCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Instant Search Modal */}
      <InstantSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectProduct={(p) => {
          setIsSearchModalOpen(false);
          setActiveProductForConfig(p);
        }}
      />

      {/* Customer Favorites Modal */}
      <FavoritesModal />

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Customer Profile Modal */}
      <CustomerProfileModal />
    </div>
  );
};
