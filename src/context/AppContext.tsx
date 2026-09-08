import React, { createContext, useContext, useState, useEffect } from "react";
import {
  PortalType,
  Outlet,
  Product,
  Category,
  Cart,
  CartLineItem,
  Order,
  KdsTicket,
  Staff,
  PlatformOrganization,
  PlatformDevice,
  AuditEvent,
  TimePricingSchedule,
  ProductVariant,
  SelectedModifier,
  UserRole,
  AuthUser,
  ActivityLogItem,
  CustomerProfile,
  FulfillmentType,
  PaymentMethod,
} from "../types";
import {
  MOCK_OUTLETS,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_KDS_TICKETS,
  MOCK_STAFF,
  MOCK_ORGANIZATIONS,
  MOCK_DEVICES,
  MOCK_AUDIT_LOGS,
  MOCK_TIME_PRICING,
} from "../mock/data";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "warning" | "error" | "info";
}

export const DUMMY_USERS: Record<Exclude<UserRole, "CUSTOMER">, AuthUser & { passwordHint: string }> = {
  KITCHEN: {
    id: "usr-kitchen-1",
    name: "Chef Ramesh Thapa",
    email: "chef@crunchy.com",
    role: "KITCHEN",
    title: "Head Cook / Kitchen Display",
    passwordHint: "chef123",
  },
  STAFF: {
    id: "usr-staff-1",
    name: "Bikash Shrestha",
    email: "staff@crunchy.com",
    role: "STAFF",
    title: "Front Cashier & Orders",
    passwordHint: "staff123",
  },
  ADMIN: {
    id: "usr-admin-1",
    name: "Rahul Adhikari",
    email: "admin@crunchy.com",
    role: "ADMIN",
    title: "Store General Manager",
    passwordHint: "admin123",
  },
};

const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: "act-1",
    timestamp: "Just now",
    actorName: "Chef Ramesh Thapa",
    actorRole: "Head Cook",
    action: "Started Prep",
    details: "Order #CR-8921 moved to Grill Station (2x Crunchy Bacon Burger)",
    badgeType: "kitchen",
  },
  {
    id: "act-2",
    timestamp: "3 mins ago",
    actorName: "Bikash Shrestha",
    actorRole: "Front Cashier",
    action: "Payment Settled",
    details: "Order #CR-8920 (Fonepay QR Rs. 850) verified & completed",
    badgeType: "payment",
  },
  {
    id: "act-3",
    timestamp: "7 mins ago",
    actorName: "Chef Ramesh Thapa",
    actorRole: "Head Cook",
    action: "Marked Ready",
    details: "Order #CR-8919 transferred to Handover Counter",
    badgeType: "kitchen",
  },
  {
    id: "act-4",
    timestamp: "14 mins ago",
    actorName: "Rahul Adhikari",
    actorRole: "Store General Manager",
    action: "Menu Price Updated",
    details: "Crunchy Double Stack adjusted to NPR 540",
    badgeType: "menu",
  },
  {
    id: "act-5",
    timestamp: "26 mins ago",
    actorName: "Bikash Shrestha",
    actorRole: "Front Cashier",
    action: "Order Created",
    details: "Dine-in Takeaway Order #CR-8918 (Rs. 1,220)",
    badgeType: "order",
  },
  {
    id: "act-6",
    timestamp: "45 mins ago",
    actorName: "Rahul Adhikari",
    actorRole: "Store General Manager",
    action: "Shift Opened",
    details: "Morning Kathmandu Durbarmarg branch register opened",
    badgeType: "staff",
  },
];

interface AppContextType {
  // Authentication & Role-based Access
  userRole: UserRole;
  currentUser: AuthUser | null;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  loginAsRole: (role: UserRole) => void;
  loginWithCredentials: (email: string, pass: string) => boolean;
  logout: () => void;

  // Activity Logs (dummy logs for dashboard)
  activityLogs: ActivityLogItem[];
  addActivityLog: (log: Omit<ActivityLogItem, "id" | "timestamp">) => void;

  // Catalog State
  updateProductPrice: (productId: string, newPrice: number) => void;

  // Portal & Theme
  activePortal: PortalType;
  setActivePortal: (portal: PortalType) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  toggleTheme: () => void;

  // Outlet State
  outlets: Outlet[];
  currentOutlet: Outlet;
  setCurrentOutlet: (outlet: Outlet) => void;
  fulfillmentType: FulfillmentType;
  setFulfillmentType: (type: FulfillmentType) => void;

  // Catalog State
  categories: Category[];
  products: Product[];
  draftChangesCount: number;
  toggleProductAvailability: (productId: string) => void;
  publishMenuDraft: () => { checksum: string; updatedCount: number };
  timePricingSchedules: TimePricingSchedule[];
  toggleTimePricing: (id: string) => void;

  // Cart & Quote State
  cart: Cart;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    variant: ProductVariant,
    selectedModifiers: SelectedModifier[],
    quantity: number
  ) => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;

  // Orders State
  orders: Order[];
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  placeTakeawayOrder: (details: {
    customerName: string;
    customerPhone: string;
    fulfillmentType?: FulfillmentType;
    paymentMethod: PaymentMethod;
    notes?: string;
    deliveryAddress?: string;
    deliveryLocation?: {
      lat: number;
      lng: number;
      landmark?: string;
    };
  }) => Order;
  cancelOrder: (orderId: string) => void;
  reorderItems: (order: Order) => void;
  acknowledgeOrder: (orderId: string) => void;
  markTakeawayComplete: (orderId: string) => void;

  // KDS State
  kdsTickets: KdsTicket[];
  bumpKdsTicket: (ticketId: string) => void;
  kdsSoundEnabled: boolean;
  setKdsSoundEnabled: (enabled: boolean) => void;

  // Staff State
  currentStaff: Staff;
  allStaff: Staff[];

  // Platform & Hardware State
  organizations: PlatformOrganization[];
  devices: PlatformDevice[];
  auditLogs: AuditEvent[];
  provisionNewDevice: (
    name: string,
    deviceType: PlatformDevice["deviceType"],
    outletId: string
  ) => { device: PlatformDevice; oneTimeSecret: string };
  rotateDeviceSecret: (deviceId: string) => string;

  // Paired Device (Kiosk mode)
  pairedDevice: PlatformDevice | null;
  pairDeviceKiosk: (credentials: { outletCode: string; secretToken: string; stationName: string }) => boolean;
  unpairDeviceKiosk: () => void;

  // Simulation & Resilient States
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  isStale: boolean;
  setIsStale: (stale: boolean) => void;
  isLoadingSkeleton: boolean;
  setIsLoadingSkeleton: (loading: boolean) => void;

  // Customer Navigation & Favorites & Search
  customerActiveTab: "menu" | "orders";
  setCustomerActiveTab: (tab: "menu" | "orders") => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  isFavoritesModalOpen: boolean;
  setIsFavoritesModalOpen: (open: boolean) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Customer Profile & Modals
  customerProfile: CustomerProfile;
  updateCustomerProfile: (profile: Partial<CustomerProfile>) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;

  // Toasts
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & theme
  const [activePortal, setActivePortal] = useState<PortalType>("customer");
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Authentication & Role Access
  const [userRole, setUserRole] = useState<UserRole>("CUSTOMER");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOGS);

  // Outlets
  const [outlets] = useState<Outlet[]>(MOCK_OUTLETS);
  const [currentOutlet, setCurrentOutlet] = useState<Outlet>(MOCK_OUTLETS[0]);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("DELIVERY");

  // Catalog
  const [categories] = useState<Category[]>(MOCK_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [draftChangesCount, setDraftChangesCount] = useState<number>(2); // Seeded with 2 draft changes
  const [timePricingSchedules, setTimePricingSchedules] = useState<TimePricingSchedule[]>(MOCK_TIME_PRICING);

  // Cart
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Orders & KDS
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeOrder, setActiveOrder] = useState<Order | null>(INITIAL_ORDERS[0]);
  const [kdsTickets, setKdsTickets] = useState<KdsTicket[]>(INITIAL_KDS_TICKETS);
  const [kdsSoundEnabled, setKdsSoundEnabled] = useState(true);

  // Staff & Platform
  const [allStaff] = useState<Staff[]>(MOCK_STAFF);
  const [currentStaff] = useState<Staff>(MOCK_STAFF[0]);
  const [organizations] = useState<PlatformOrganization[]>(MOCK_ORGANIZATIONS);
  const [devices, setDevices] = useState<PlatformDevice[]>(MOCK_DEVICES);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(MOCK_AUDIT_LOGS);

  // Paired Device
  const [pairedDevice, setPairedDevice] = useState<PlatformDevice | null>(MOCK_DEVICES[1]);

  // Resilient state simulators
  const [isOffline, setIsOffline] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(false);

  // Customer Navigation, Favorites & Search
  const [customerActiveTab, setCustomerActiveTab] = useState<"menu" | "orders">("menu");
  const [favorites, setFavorites] = useState<string[]>(["prod-crunchy-classic", "prod-bacon-bbq"]);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Customer Profile State
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>({
    name: "Aayush Shrestha",
    email: "aayush@gmail.com",
    phone: "+977 9841-882299",
    address: "House #14, Lazimpat, Kathmandu, Nepal",
    points: 420,
    tier: "Gold Club",
    memberSince: "Jan 2025",
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const updateCustomerProfile = (updated: Partial<CustomerProfile>) => {
    setCustomerProfile((prev) => ({ ...prev, ...updated }));
    addToast({
      title: "Profile Updated",
      description: "Your account details have been saved successfully.",
      type: "success",
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Apply dark mode class to html
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const addToast = (toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time timers increment every second for KDS and Orders
  useEffect(() => {
    const timer = setInterval(() => {
      setKdsTickets((prev) =>
        prev.map((t) => ({ ...t, elapsedSeconds: t.elapsedSeconds + 1 }))
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.status !== "COMPLETED" && o.status !== "CANCELLED"
            ? { ...o, elapsedSeconds: o.elapsedSeconds + 1 }
            : o
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Cart Derived Totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxInclusiveAmount = +(subtotal * 0.13).toFixed(2); // 13% VAT included
  // Cash round-down savings: rounds down to nearest integer (e.g. 543.50 -> 543.00, savings 0.50)
  const cashRoundDownSavings = subtotal > 0 ? +(subtotal - Math.floor(subtotal)).toFixed(2) : 0;
  const finalTotal = subtotal - cashRoundDownSavings;
  const quoteExpiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

  const cart: Cart = {
    items: cartItems,
    subtotal,
    taxInclusiveAmount,
    cashRoundDownSavings,
    finalTotal,
    quoteExpiresAt,
  };

  // Cart operations
  const addToCart = (
    product: Product,
    variant: ProductVariant,
    selectedModifiers: SelectedModifier[],
    quantity: number
  ) => {
    const modifiersDelta = selectedModifiers.reduce((acc, m) => acc + m.priceDelta, 0);
    const unitPrice = variant.price + modifiersDelta;
    const lineTotal = unitPrice * quantity;

    const newItem: CartLineItem = {
      cartItemId: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: product.id,
      productName: product.name,
      image: product.images[0],
      variant,
      selectedModifiers,
      quantity,
      unitPrice,
      lineTotal,
      addedAt: Date.now(),
      quoteExpiresAt: Date.now() + 15 * 60 * 1000,
    };

    setCartItems((prev) => [...prev, newItem]);
    addToast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} (${variant.name})`,
      type: "success",
    });
  };

  const updateCartItemQty = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              lineTotal: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartLineItem[]
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    addToast({
      title: "Item Removed",
      description: "Line item removed from your cart",
      type: "info",
    });
  };

  const clearCart = () => setCartItems([]);

  // Orders and KDS integrations
  const placeTakeawayOrder = (details: {
    customerName: string;
    customerPhone: string;
    fulfillmentType?: FulfillmentType;
    paymentMethod: PaymentMethod;
    notes?: string;
    deliveryAddress?: string;
    deliveryLocation?: {
      lat: number;
      lng: number;
      landmark?: string;
    };
  }) => {
    const orderNum = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveFulfillment: FulfillmentType = details.fulfillmentType || fulfillmentType || "DELIVERY";

    // If customer provided/updated address, update customer profile address as well
    if (details.deliveryAddress && details.deliveryAddress.trim()) {
      setCustomerProfile((prev) => ({
        ...prev,
        address: details.deliveryAddress!.trim(),
      }));
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      outletId: currentOutlet.id,
      outletName: currentOutlet.name,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      fulfillmentType: effectiveFulfillment,
      status: "CONFIRMED",
      items: cart.items.map((ci) => ({
        id: ci.cartItemId,
        productName: ci.productName,
        variantName: ci.variant.name,
        modifiersSummary: ci.selectedModifiers.map((m) =>
          m.priceDelta > 0 ? `+ ${m.optionName}` : m.optionName
        ),
        unitPrice: ci.unitPrice,
        quantity: ci.quantity,
        lineTotal: ci.lineTotal,
      })),
      subtotal: cart.subtotal,
      vatIncludedAmount: cart.taxInclusiveAmount,
      totalAmount: cart.finalTotal,
      createdAt: new Date().toISOString(),
      estimatedPickupTime:
        effectiveFulfillment === "DELIVERY"
          ? `30-40 mins (Ride App Dispatch)`
          : `In ${currentOutlet.estimatedPrepTimeMin} mins`,
      elapsedSeconds: 0,
      paymentMethod: details.paymentMethod,
      notes: details.notes,
      deliveryAddress: details.deliveryAddress,
      deliveryLocation: details.deliveryLocation,
    };

    // Also push a live KDS Ticket immediately!
    const newKdsTicket: KdsTicket = {
      id: `kds-${Date.now()}`,
      orderNumber: orderNum,
      station: "Kitchen Main Line",
      fulfillmentType: effectiveFulfillment,
      column: "QUEUED",
      elapsedSeconds: 0,
      customerName: details.customerName,
      deliveryAddress: details.deliveryAddress,
      items: cart.items.map((ci) => ({
        id: ci.cartItemId,
        productName: ci.productName,
        variantName: ci.variant.name,
        quantity: ci.quantity,
        modifiers: ci.selectedModifiers.map((m) => m.optionName),
      })),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setKdsTickets((prev) => [newKdsTicket, ...prev]);
    setActiveOrder(newOrder);
    clearCart();

    const fulfillmentLabels: Record<FulfillmentType, string> = {
      DELIVERY: "doorstep delivery",
      TAKEAWAY: "express pickup",
      DRIVE_THRU: "drive-thru collection",
      DINE_IN: "table dining",
    };

    addToast({
      title: "Order Placed Successfully!",
      description: `Order #${orderNum} confirmed for ${fulfillmentLabels[effectiveFulfillment]}.`,
      type: "success",
    });

    return newOrder;
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
    );
    setKdsTickets((prev) => prev.filter((t) => t.orderNumber !== orders.find(o => o.id === orderId)?.orderNumber));
    addToast({
      title: "Order Cancelled",
      description: "Order has been successfully cancelled.",
      type: "warning",
    });
  };

  const reorderItems = (order: Order) => {
    order.items.forEach((item) => {
      const matchProduct = products.find((p) => p.name === item.productName) || products[0];
      const matchVariant = matchProduct.variants.find((v) => v.name === item.variantName) || matchProduct.variants[0];
      addToCart(matchProduct, matchVariant, [], item.quantity);
    });
    setIsCartDrawerOpen(true);
    addToast({
      title: "Items Added from Previous Order",
      description: `Reordered ${order.items.length} items to cart`,
      type: "success",
    });
  };

  const acknowledgeOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "PROCESSING" } : o))
    );
    // update KDS column to PREPARING
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      setKdsTickets((prev) =>
        prev.map((t) =>
          t.orderNumber === targetOrder.orderNumber ? { ...t, column: "PREPARING" } : t
        )
      );
    }
    addToast({
      title: "Order Acknowledged",
      description: "Kitchen has been notified and prep has started",
      type: "success",
    });
  };

  const markTakeawayComplete = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "COMPLETED" } : o))
    );
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      setKdsTickets((prev) => prev.filter((t) => t.orderNumber !== targetOrder.orderNumber));
    }
    addToast({
      title: "Takeaway Completed",
      description: "Order fulfilled and handed to customer",
      type: "success",
    });
  };

  const bumpKdsTicket = (ticketId: string) => {
    setKdsTickets((prev) =>
      prev
        .map((ticket) => {
          if (ticket.id === ticketId) {
            if (ticket.column === "QUEUED") {
              return { ...ticket, column: "PREPARING" as const };
            } else if (ticket.column === "PREPARING") {
              // Mark order ready in order list too!
              setOrders((ords) =>
                ords.map((o) =>
                  o.orderNumber === ticket.orderNumber ? { ...o, status: "READY" } : o
                )
              );
              return { ...ticket, column: "READY" as const };
            } else {
              // From READY -> Completed (remove from KDS)
              setOrders((ords) =>
                ords.map((o) =>
                  o.orderNumber === ticket.orderNumber ? { ...o, status: "COMPLETED" } : o
                )
              );
              return null;
            }
          }
          return ticket;
        })
        .filter(Boolean) as KdsTicket[]
    );
  };

  const addActivityLog = (log: Omit<ActivityLogItem, "id" | "timestamp">) => {
    const newLog: ActivityLogItem = {
      ...log,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: "Just now",
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const loginAsRole = (role: UserRole) => {
    if (role === "CUSTOMER") {
      setUserRole("CUSTOMER");
      setCurrentUser(null);
      setActivePortal("customer");
      return;
    }
    const userPreset = DUMMY_USERS[role];
    setUserRole(role);
    setCurrentUser(userPreset);
    setIsLoginModalOpen(false);

    if (role === "KITCHEN") setActivePortal("kitchen");
    else if (role === "STAFF") setActivePortal("staff");
    else if (role === "ADMIN") setActivePortal("platform");

    addActivityLog({
      actorName: userPreset.name,
      actorRole: userPreset.title,
      action: "Logged In",
      details: `Signed into ${userPreset.role} dashboard`,
      badgeType: "staff",
    });

    addToast({
      title: `Logged in as ${userPreset.name}`,
      description: `Role: ${userPreset.title}`,
      type: "success",
    });
  };

  const loginWithCredentials = (email: string, _pass: string): boolean => {
    const match = Object.values(DUMMY_USERS).find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (match) {
      setUserRole(match.role);
      setCurrentUser(match);
      setIsLoginModalOpen(false);
      if (match.role === "KITCHEN") setActivePortal("kitchen");
      else if (match.role === "STAFF") setActivePortal("staff");
      else if (match.role === "ADMIN") setActivePortal("platform");

      addActivityLog({
        actorName: match.name,
        actorRole: match.title,
        action: "Logged In",
        details: `Signed into ${match.role} dashboard via email`,
        badgeType: "staff",
      });

      addToast({
        title: `Welcome back, ${match.name}!`,
        description: `Active Station: ${match.title}`,
        type: "success",
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUserRole("CUSTOMER");
    setCurrentUser(null);
    setActivePortal("customer");
    addToast({
      title: "Logged Out",
      description: "Returned to the customer website.",
      type: "info",
    });
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, basePrice: newPrice } : p))
    );
    const prod = products.find((p) => p.id === productId);
    addActivityLog({
      actorName: currentUser?.name || "Rahul Adhikari",
      actorRole: currentUser?.title || "Store General Manager",
      action: "Menu Price Updated",
      details: `${prod?.name || "Item"} base price updated to NPR ${newPrice}`,
      badgeType: "menu",
    });
    addToast({
      title: "Price Updated",
      description: `${prod?.name || "Item"} price set to NPR ${newPrice}`,
      type: "success",
    });
  };

  // Product availability toggling
  const toggleProductAvailability = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p))
    );
    setDraftChangesCount((prev) => prev + 1);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      const newStatus = !prod.isAvailable;
      // Record audit event
      const audit: AuditEvent = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName: currentStaff.name,
        actorRole: currentStaff.role,
        action: "CATALOG_PRODUCT_AVAILABILITY_CHANGED",
        entityType: "CATALOG_PRODUCT",
        entityId: productId,
        outletName: currentOutlet.name,
        beforeState: { isAvailable: prod.isAvailable, name: prod.name },
        afterState: { isAvailable: newStatus, name: prod.name },
      };
      setAuditLogs((prev) => [audit, ...prev]);

      addToast({
        title: `Product Marked ${newStatus ? "Available" : "Sold Out"}`,
        description: `${prod.name} updated for ${currentOutlet.code}`,
        type: newStatus ? "success" : "warning",
      });
    }
  };

  const publishMenuDraft = () => {
    const updatedCount = draftChangesCount;
    setDraftChangesCount(0);
    const checksum = `sha256_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    addToast({
      title: "Menu Published Globally",
      description: `Immutable catalog revision ${checksum.substring(0, 12)}... published to all POS/KDS`,
      type: "success",
    });
    return { checksum, updatedCount };
  };

  const toggleTimePricing = (id: string) => {
    setTimePricingSchedules((prev) =>
      prev.map((tp) => (tp.id === id ? { ...tp, isActive: !tp.isActive } : tp))
    );
    addToast({
      title: "Time-Pricing Schedule Updated",
      description: "Effective promotional prices recalculated",
      type: "info",
    });
  };

  // Device provisioning
  const provisionNewDevice = (
    name: string,
    deviceType: PlatformDevice["deviceType"],
    outletId: string
  ) => {
    const outlet = outlets.find((o) => o.id === outletId) || outlets[0];
    const rawSecret = `sec_live_${Math.random().toString(36).substring(2, 12)}`;
    const newDev: PlatformDevice = {
      id: `dev-0${devices.length + 1}`,
      name,
      deviceType,
      outletId: outlet.id,
      outletName: outlet.name,
      ipAddress: `192.168.1.${110 + devices.length}`,
      lastHeartbeatSecondsAgo: 2,
      status: "ONLINE",
      tokenSecretMasked: `${rawSecret.substring(0, 9)}••••••••${rawSecret.substring(rawSecret.length - 3)}`,
      pairedAt: new Date().toISOString().split("T")[0],
    };
    setDevices((prev) => [...prev, newDev]);
    return { device: newDev, oneTimeSecret: rawSecret };
  };

  const rotateDeviceSecret = (deviceId: string) => {
    const newSecret = `sec_live_${Math.random().toString(36).substring(2, 12)}`;
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? {
              ...d,
              tokenSecretMasked: `${newSecret.substring(0, 9)}••••••••${newSecret.substring(newSecret.length - 3)}`,
              lastHeartbeatSecondsAgo: 1,
            }
          : d
      )
    );
    addToast({
      title: "Device Token Rotated",
      description: `Credentials regenerated for ${deviceId}`,
      type: "success",
    });
    return newSecret;
  };

  const pairDeviceKiosk = (credentials: {
    outletCode: string;
    secretToken: string;
    stationName: string;
  }) => {
    const matched = devices.find((d) => d.status === "ONLINE") || devices[0];
    setPairedDevice({
      ...matched,
      name: credentials.stationName,
      lastHeartbeatSecondsAgo: 0,
    });
    addToast({
      title: "Device Successfully Paired",
      description: `Station ${credentials.stationName} online with live heartbeat.`,
      type: "success",
    });
    return true;
  };

  const unpairDeviceKiosk = () => {
    setPairedDevice(null);
    addToast({
      title: "Device Unpaired",
      description: "Hardware token deauthorized.",
      type: "warning",
    });
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        currentUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginAsRole,
        loginWithCredentials,
        logout,
        activityLogs,
        addActivityLog,
        updateProductPrice,
        activePortal,
        setActivePortal,
        isDark,
        setIsDark,
        toggleTheme,
        outlets,
        currentOutlet,
        setCurrentOutlet,
        fulfillmentType,
        setFulfillmentType,
        categories,
        products,
        draftChangesCount,
        toggleProductAvailability,
        publishMenuDraft,
        timePricingSchedules,
        toggleTimePricing,
        cart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateCartItemQty,
        removeCartItem,
        clearCart,
        orders,
        activeOrder,
        setActiveOrder,
        placeTakeawayOrder,
        cancelOrder,
        reorderItems,
        acknowledgeOrder,
        markTakeawayComplete,
        kdsTickets,
        bumpKdsTicket,
        kdsSoundEnabled,
        setKdsSoundEnabled,
        currentStaff,
        allStaff,
        organizations,
        devices,
        auditLogs,
        provisionNewDevice,
        rotateDeviceSecret,
        pairedDevice,
        pairDeviceKiosk,
        unpairDeviceKiosk,
        isOffline,
        setIsOffline,
        isStale,
        setIsStale,
        isLoadingSkeleton,
        setIsLoadingSkeleton,
        customerActiveTab,
        setCustomerActiveTab,
        favorites,
        toggleFavorite,
        isFavorite,
        isFavoritesModalOpen,
        setIsFavoritesModalOpen,
        isSearchModalOpen,
        setIsSearchModalOpen,
        globalSearchQuery,
        setGlobalSearchQuery,
        customerProfile,
        updateCustomerProfile,
        isProfileModalOpen,
        setIsProfileModalOpen,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
