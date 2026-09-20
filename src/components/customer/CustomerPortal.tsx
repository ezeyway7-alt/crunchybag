import React, { useState } from "react";
import {
  Flame,
  Drumstick,
  UtensilsCrossed,
  Coffee,
  Sparkles,
  LayoutGrid,
  BadgePercent,
  Filter,
  Receipt,
  QrCode,
  Star,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Product, Order } from "../../types";
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
import { PrintableTokenReceiptModal } from "./PrintableTokenReceiptModal";
import { QrOrderTrackAndReviewModal } from "./QrOrderTrackAndReviewModal";
import { SkeletonProductGrid } from "../common/Skeleton";

type DietaryFilterType =
  | "all"
  | "halal"
  | "nut_free"
  | "gluten_free"
  | "dairy_free"
  | "spicy"
  | "vegetarian";

const DIETARY_FILTERS: { id: DietaryFilterType; label: string }[] = [
  { id: "all", label: "All Items" },
  { id: "halal", label: "🌱 100% Halal" },
  { id: "nut_free", label: "🥜 Nut-Free" },
  { id: "gluten_free", label: "🌾 Gluten-Free" },
  { id: "dairy_free", label: "🥛 Dairy-Free" },
  { id: "spicy", label: "🌶️ Spicy" },
  { id: "vegetarian", label: "🥬 Vegetarian" },
];

export const CustomerPortal: React.FC = () => {
  const {
    products,
    categories,
    orders,
    addToCart,
    isLoadingSkeleton,
    customerActiveTab,
    setCustomerActiveTab,
    isSearchModalOpen,
    setIsSearchModalOpen,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDietaryFilter, setSelectedDietaryFilter] = useState<DietaryFilterType>("all");
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  const handleCategorySelect = (catId: string) => {
    if (catId === selectedCategory) return;
    setIsCategoryLoading(true);
    setSelectedCategory(catId);
    setTimeout(() => setIsCategoryLoading(false), 200);
  };

  const handleDietaryFilterSelect = (filterId: DietaryFilterType) => {
    if (filterId === selectedDietaryFilter) return;
    setIsCategoryLoading(true);
    setSelectedDietaryFilter(filterId);
    setTimeout(() => setIsCategoryLoading(false), 180);
  };

  // Modals
  const [activeProductForConfig, setActiveProductForConfig] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | undefined>(undefined);

  // Receipt & QR Slip Review Modals
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isQrReviewModalOpen, setIsQrReviewModalOpen] = useState(false);
  const [selectedModalOrder, setSelectedModalOrder] = useState<Order | null>(null);

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

  // Filter products by active category / special / offer and dietary filter
  const displayedProducts = products.filter((p) => {
    if (p.isWebVisible === false) return false;
    // 1. Category check
    let categoryMatch = false;
    if (selectedCategory === "all") {
      categoryMatch = true;
    } else if (selectedCategory === "special") {
      categoryMatch = p.dietary.includes("Chef's Choice") || p.dietary.includes("Popular");
    } else if (selectedCategory === "offer") {
      categoryMatch =
        p.categoryId === "cat-combos" ||
        p.variants.some(
          (v) =>
            v.name.toLowerCase().includes("combo") ||
            v.name.toLowerCase().includes("meal") ||
            v.name.toLowerCase().includes("double")
        );
    } else {
      categoryMatch = p.categoryId === selectedCategory;
    }

    if (!categoryMatch) return false;

    // 2. Dietary & Allergen check
    if (selectedDietaryFilter === "all") return true;
    if (selectedDietaryFilter === "halal") {
      return p.dietary.some((d) => d.toLowerCase().includes("halal"));
    }
    if (selectedDietaryFilter === "nut_free") {
      return (
        !p.description.toLowerCase().includes("peanut") &&
        !p.description.toLowerCase().includes("nut")
      );
    }
    if (selectedDietaryFilter === "gluten_free") {
      return p.dietary.some((d) => d.toLowerCase().includes("gluten") || d.toLowerCase().includes("rice"));
    }
    if (selectedDietaryFilter === "dairy_free") {
      return p.dietary.some((d) => d.toLowerCase().includes("dairy-free") || d.toLowerCase().includes("vegan"));
    }
    if (selectedDietaryFilter === "spicy") {
      return (
        p.dietary.some((d) => d.toLowerCase().includes("spicy") || d.toLowerCase().includes("peri")) ||
        p.name.toLowerCase().includes("spicy") ||
        p.name.toLowerCase().includes("fire") ||
        p.name.toLowerCase().includes("peri")
      );
    }
    if (selectedDietaryFilter === "vegetarian") {
      return (
        p.dietary.some((d) => d.toLowerCase().includes("veg") || d.toLowerCase().includes("plant")) ||
        p.categoryId === "cat-beverages" ||
        p.name.toLowerCase().includes("shake") ||
        p.name.toLowerCase().includes("lemonade") ||
        p.name.toLowerCase().includes("fries")
      );
    }

    return true;
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
    const placed = orders.find((o) => o.id === orderId);
    if (placed) {
      setSelectedModalOrder(placed);
      setIsReceiptModalOpen(true);
    }
    setCustomerActiveTab("orders");
  };

  const latestOrder = orders[0] || null;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 transition-colors">
      {customerActiveTab === "menu" ? (
        <main id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-8 space-y-6">
          {/* Semantic SEO Primary Headline for Search Engines & Screen Readers */}
          <h1 className="sr-only">
            Crunchy – Crispy Fried Chicken, Gourmet Smash Burgers & Food Delivery in Kathmandu with eSewa
          </h1>

          {/* Hero Promotional Banner Slider */}
          <HeroBannerSlider onSelectCategory={(catId) => setSelectedCategory(catId)} />

          {/* Sticky Category Rail & Allergen/Dietary Filters */}
          <div
            id="categories-rail"
            className="sticky top-[98px] md:top-16 z-30 bg-[#0A0A0B]/95 backdrop-blur-md py-2.5 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-zinc-800 space-y-2"
          >
            {/* Row 1: Categories */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {/* 1. All (Default) */}
                <button
                  id="category-tab-all"
                  onClick={() => handleCategorySelect("all")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === "all"
                      ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                      : "bg-[#18181B] text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 text-amber-500" />
                  <span>All</span>
                </button>

                {/* 2. Today's Special */}
                <button
                  id="category-tab-special"
                  onClick={() => handleCategorySelect("special")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === "special"
                      ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                      : "bg-[#18181B] text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Today's Special</span>
                </button>

                {/* 3. Offer */}
                <button
                  id="category-tab-offer"
                  onClick={() => handleCategorySelect("offer")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedCategory === "offer"
                      ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                      : "bg-[#18181B] text-zinc-300 border-zinc-800 hover:border-zinc-700"
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
                      onClick={() => handleCategorySelect(category.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? "bg-amber-500 text-black border-amber-500 font-black shadow-sm"
                          : "bg-[#18181B] text-zinc-300 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {getCategoryIcon(category.iconName)}
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Allergen & Nutritional Filter Chips Rail */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3 text-amber-500" />
                  <span>Dietary:</span>
                </span>
                {DIETARY_FILTERS.map((filter) => {
                  const isActive = selectedDietaryFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => handleDietaryFilterSelect(filter.id)}
                      className={`h-6.5 px-2.5 text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        isActive
                          ? "bg-zinc-100 text-black border-white font-black"
                          : "bg-[#14161C] text-zinc-400 border-zinc-800 hover:border-zinc-400"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              {/* Direct Quick Shortcuts: Print Receipt & Scan QR Tracker */}
              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModalOrder(latestOrder);
                    setIsReceiptModalOpen(true);
                  }}
                  className="h-6.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold flex items-center gap-1 border border-zinc-700 transition-colors cursor-pointer"
                  title="View digital token receipt slip"
                >
                  <Receipt className="w-3 h-3 text-amber-500" />
                  <span className="hidden sm:inline">Receipt Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedModalOrder(latestOrder);
                    setIsQrReviewModalOpen(true);
                  }}
                  className="h-6.5 px-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-[11px] font-black flex items-center gap-1 border border-amber-500/30 transition-colors cursor-pointer"
                  title="Scan printed QR slip to track & rate experience"
                >
                  <QrCode className="w-3 h-3" />
                  <span>Scan Slip & Rate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Cards Grid with Skeleton Placeholder */}
          {isLoadingSkeleton || isCategoryLoading ? (
            <SkeletonProductGrid count={8} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLoading={false}
                  onSelect={(p) => setActiveProductForConfig(p)}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
          )}

          {/* Empty Results Recovery */}
          {!isLoadingSkeleton && !isCategoryLoading && displayedProducts.length === 0 && (
            <div className="py-16 text-center space-y-3 bg-[#121214] border border-zinc-800 p-8">
              <Sparkles className="h-10 w-10 text-amber-500 mx-auto" />
              <h4 className="font-bold text-lg text-white">
                No items found matching filter in {getActiveCategoryTitle()}
              </h4>
              <p className="text-xs text-zinc-500">
                Try switching dietary filter or exploring all items.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDietaryFilter("all")}
                >
                  Reset Dietary Filter
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedDietaryFilter("all");
                  }}
                  className="bg-amber-500 text-black font-bold"
                >
                  View All Items
                </Button>
              </div>
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
      {activeProductForConfig && (
        <ProductConfiguratorModal
          product={activeProductForConfig}
          isOpen={!!activeProductForConfig}
          onClose={() => setActiveProductForConfig(null)}
          onAddToCart={addToCart}
        />
      )}

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

      {/* Customer Profile Modal with Order History & 1-Click Reorder */}
      <CustomerProfileModal />

      {/* Printable Digital Receipt & Token Slip Modal */}
      <PrintableTokenReceiptModal
        order={selectedModalOrder || latestOrder}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onOpenTrackerAndReview={(ord) => {
          setSelectedModalOrder(ord);
          setIsReceiptModalOpen(false);
          setIsQrReviewModalOpen(true);
        }}
      />

      {/* QR Token Slip Tracker & Rate/Review Modal */}
      <QrOrderTrackAndReviewModal
        isOpen={isQrReviewModalOpen}
        onClose={() => setIsQrReviewModalOpen(false)}
        initialOrder={selectedModalOrder || latestOrder}
        onOpenReceipt={(ord) => {
          setSelectedModalOrder(ord);
          setIsQrReviewModalOpen(false);
          setIsReceiptModalOpen(true);
        }}
      />
    </div>
  );
};
