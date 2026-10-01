import { BlogsPortalPage } from "./BlogsPortalPage";
import { BlogDetailPage } from "./BlogDetailPage";
import { ComboPackageModal } from "./ComboPackageModal";
import { comboDefinitions } from "../../lib/catalogApi";
import { useAuth } from "../../context/AuthContext";
import { updatePageSEO } from "../../lib/seo";
import React, { useState, useEffect } from "react";
import {
  Flame,
  Drumstick,
  UtensilsCrossed,
  Coffee,
  Sparkles,
  LayoutGrid,
  BadgePercent,
  Filter,
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
import { CustomerProfilePage } from "./CustomerProfilePage";
import { InstantSearchModal } from "./InstantSearchModal";
import { LiveOrderTracker } from "./LiveOrderTracker";
import { FavoritesModal } from "./FavoritesModal";
import { HeroBannerSlider } from "./HeroBannerSlider";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
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
    cartSyncing, cartSyncError, retryCartSync,
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
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (catId === "all") {
        url.searchParams.delete("category");
      } else {
        url.searchParams.set("category", catId);
      }
      window.history.replaceState({}, "", url.toString());
    }
    setTimeout(() => setIsCategoryLoading(false), 200);
  };

  const handleDietaryFilterSelect = (filterId: DietaryFilterType) => {
    if (filterId === selectedDietaryFilter) return;
    setIsCategoryLoading(true);
    setSelectedDietaryFilter(filterId);
    setTimeout(() => setIsCategoryLoading(false), 180);
  };

  // Track current route for deep-linking blogs & portal pages
  const [currentRoutePath, setCurrentRoutePath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    }
    return "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        setCurrentRoutePath(window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const isBlogsPortalRoute = currentRoutePath === "/blogs" || currentRoutePath === "/blog";
  const isBlogDetailRoute = currentRoutePath.startsWith("/blog/") || currentRoutePath.startsWith("/blogs/");
  const blogSlug = isBlogDetailRoute
    ? currentRoutePath.replace(/^\/(?:blogs?)\//, "").replace(/\/+$/, "")
    : "";

  // Modals
  const [activeProductForConfig, setActiveProductForConfig] = useState<Product | null>(null);

  const handleOpenProduct = (product: Product) => {
    setActiveProductForConfig(product);
    if (typeof window !== "undefined") {
      const cleanPath = `/product/${product.id}`;
      window.history.replaceState({}, "", cleanPath);
      updatePageSEO({
        title: `${product.name} (NPR ${product.basePrice}) | Crunchy Bag Kathmandu`,
        description: product.description || `Order ${product.name} online from Crunchy Bag Kathmandu with fast delivery & instant eSewa.`,
        image: product.images?.[0] || "https://crunchybag.com/crunchy_logo.png",
        canonical: `https://crunchybag.com/product/${encodeURIComponent(product.id)}`,
      });
    }
  };

  const handleCloseProduct = () => {
    setActiveProductForConfig(null);
    if (typeof window !== "undefined") {
      const current = window.location.pathname.toLowerCase();
      const returnPath = current.startsWith("/product/") ? "/menu" : current || "/";
      window.history.replaceState({}, "", returnPath);
      updatePageSEO({});
    }
  };

  // Deep-linking effect for shareable URLs: clean paths or ?product=..., ?category=..., ?page=...
  useEffect(() => {
    if (typeof window === "undefined" || products.length === 0) return;
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    let prodParam = params.get("product") || params.get("item") || params.get("combo");
    if (!prodParam && path.includes("/product/")) {
      prodParam = path.split("/product/")[1]?.replace(/\/+$/, "");
    } else if (!prodParam && path.includes("/item/")) {
      prodParam = path.split("/item/")[1]?.replace(/\/+$/, "");
    }
    const catParam = params.get("category");
    const pageParam = params.get("page");

    if (catParam) {
      setSelectedCategory(catParam);
    } else if (pageParam === "combos" || pageParam === "special" || path.includes("/combos")) {
      setSelectedCategory("cat-special-combo-12ad6cad202d");
    } else if (path.includes("/burger")) {
      setSelectedCategory("cat-burgers-97a60a528a81");
    } else if (path.includes("/fried-chicken")) {
      setSelectedCategory("cat-fried-chiken-330fbd829bc2");
    } else if (path.includes("/pakoda")) {
      setSelectedCategory("cat-pakoda-ff49ba205060");
    } else if (path.includes("/fries")) {
      setSelectedCategory("cat-fries-crispy-0ebc7a494c41");
    } else if (path.includes("/sandwich")) {
      setSelectedCategory("cat-sandwiches-82dedfda123f");
    } else if (path.includes("/drink") || path.includes("/shake")) {
      setSelectedCategory("cat-drinks-5493c0ec1baf");
    }

    if (prodParam) {
      const cleanProdId = decodeURIComponent(prodParam).toLowerCase();
      const found = products.find(
        (p) =>
          p.id.toLowerCase() === cleanProdId ||
          p.id.toLowerCase().includes(cleanProdId) ||
          p.name.toLowerCase().replace(/[^a-z0-9]/g, "-").includes(cleanProdId)
      );
      if (found) {
        handleOpenProduct(found);
      }
    }
  }, [products]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { isAuthenticated, authUser } = useAuth();
  const [resumeCheckout, setResumeCheckout] = useState(() => sessionStorage.getItem('customer:return-to-checkout') === 'yes');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | undefined>(undefined);

  const openCheckout = () => {
    if (!isAuthenticated || authUser?.role !== 'CUSTOMER') {sessionStorage.setItem('customer:return-to-checkout','yes');setResumeCheckout(true);setIsAuthOpen(true);}
    else {sessionStorage.setItem('customer:return-to-checkout','yes');setResumeCheckout(true);}
  };
  useEffect(() => {
    if (resumeCheckout && authUser?.role === 'CUSTOMER' && !cartSyncing && !cartSyncError) {
      sessionStorage.removeItem('customer:return-to-checkout');
      setResumeCheckout(false); setIsAuthOpen(false); setIsCheckoutOpen(true);
    }
  }, [resumeCheckout, authUser?.id, authUser?.role, cartSyncing, cartSyncError]);
  useEffect(() => { const open = () => setIsAuthOpen(true); window.addEventListener('customer:login',open); return () => window.removeEventListener('customer:login',open); },[]);
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

  useEffect(()=>{const configure=(event:Event)=>setActiveProductForConfig((event as CustomEvent<Product>).detail);window.addEventListener('customer:configure',configure);return()=>window.removeEventListener('customer:configure',configure);},[]);
  const getActiveCategoryTitle = () => {
    if (selectedCategory === "all") return "All Menu Items";
    if (selectedCategory === "special") return "Today's Special";
    if (selectedCategory === "offer") return "Offers & Combos";
    return categories.find((c) => c.id === selectedCategory)?.name || "this category";
  };

  const handleQuickAdd = (product: Product) => {
    if(product.isComboPackage){setActiveProductForConfig(product);return;}
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
      {isBlogDetailRoute && blogSlug ? (
        <BlogDetailPage
          slug={blogSlug}
          onNavigate={(path) => setCurrentRoutePath(path.toLowerCase().replace(/\/+$/, "") || "/")}
        />
      ) : isBlogsPortalRoute ? (
        <BlogsPortalPage
          onNavigate={(path) => setCurrentRoutePath(path.toLowerCase().replace(/\/+$/, "") || "/")}
        />
      ) : customerActiveTab === "menu" ? (
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
                {isLoadingSkeleton && categories.length === 0 ? (
                  <>
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-[31px] w-28 shrink-0 skeleton-shimmer bg-zinc-800/80 border border-zinc-800 flex items-center gap-2 px-3"
                      >
                        <div className="w-3.5 h-3.5 bg-zinc-700/60 rounded-xs shrink-0" />
                        <div className="h-3 w-16 bg-zinc-700/60 rounded-xs" />
                      </div>
                    ))}
                  </>
                ) : (
                  categories.filter(c => !c.isArchived).map((category) => {
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
                  })
                )}
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

              {/* Direct Quick Shortcut: Scan QR Tracker & Rate */}
              <div className="flex items-center gap-1.5 shrink-0 pl-2">
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLoading={false}
                  onSelect={(p) => handleOpenProduct(p)}
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
      ) : customerActiveTab === "profile" ? <CustomerProfilePage /> : (
        <LiveOrderTracker
          initialOrderId={trackedOrderId}
          onExploreMenu={() => setCustomerActiveTab("menu")}
        />
      )}

      {/* Seamless Customer Footer with Location Map & Easy Navigation */}
      <CustomerFooter />

      {/* Product Detail & Quote Configurator Modal */}
      {activeProductForConfig && !activeProductForConfig.isComboPackage && (
        <ProductConfiguratorModal
          product={activeProductForConfig}
          isOpen={!!activeProductForConfig}
          onClose={handleCloseProduct}
          onAddToCart={addToCart}
        />
      )}

      {activeProductForConfig?.isComboPackage && <ComboPackageModal combo={comboDefinitions([activeProductForConfig])[0]} isOpen onClose={handleCloseProduct} />}
      {/* Persistent Cart Drawer */}
      <CartDrawer onOpenCheckout={openCheckout} />

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
          handleOpenProduct(p);
        }}
      />

      {/* Customer Favorites Modal */}
      <FavoritesModal />

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        onSuccess={() => setIsAuthOpen(false)}
        isOpen={isAuthOpen}
        onClose={() => {setIsAuthOpen(false);setResumeCheckout(false);sessionStorage.removeItem('customer:return-to-checkout');}}
      />

      {/* Customer Profile Modal with Order History & 1-Click Reorder */}
      <Modal isOpen={resumeCheckout && authUser?.role === 'CUSTOMER' && !isAuthOpen} onClose={()=>{setResumeCheckout(false);sessionStorage.removeItem('customer:return-to-checkout');}} title="Preparing checkout" maxWidth="sm">
        {cartSyncError ? <div role="alert" className="space-y-3 text-sm"><p>Your items are saved on this device. We couldn’t finish restoring your cart.</p><Button onClick={()=>void retryCartSync()}>Try again</Button></div> : <p role="status" className="text-sm text-zinc-400">Restoring your cart…</p>}
      </Modal>

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
