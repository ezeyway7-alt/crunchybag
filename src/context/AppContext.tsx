import { useCustomerAccount, customerRefresh } from "../lib/customerApi";
import { useCatalog } from "./useCatalog";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  OrderRoundInfo,
  OrderItemSnapshot,
  OrderStatus,
  Employee,
  InventoryItem,
  PurchaseRecord,
  DaybookExpense,
  CustomerLoyaltyRecord,
  LoyaltySettings,
  LoyaltyVisitRule,
  AppliedLoyaltyDiscount,
  OrganizationSettings,
  AdminSubPage,
  StockAuditRecord,
  StockMovementRecord,
  Party,
  PartyCategory,
  DaybookVoucherType,
  DaybookAccountEntry,
} from "../types";
import {
  MOCK_OUTLETS,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  INITIAL_ORDERS,
  MOCK_STAFF,
  MOCK_ORGANIZATIONS,
  MOCK_DEVICES,
  MOCK_AUDIT_LOGS,
  MOCK_TIME_PRICING,
} from "../mock/data";
import {
  INITIAL_ORG_SETTINGS,
  INITIAL_LOYALTY_SETTINGS,
  INITIAL_EMPLOYEES,
  INITIAL_INVENTORY,
  INITIAL_PURCHASES,
  INITIAL_DAYBOOK_EXPENSES,
  INITIAL_LOYALTY_RECORDS,
  INITIAL_APPLIED_LOYALTY_DISCOUNTS,
  INITIAL_STOCK_AUDITS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_PARTIES,
  INITIAL_DAYBOOK_ENTRIES,
} from "../mock/adminData";
import { authStorage } from "../lib/authStorage";
import { branchApi, normalizeOutletId } from "../lib/api";

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
  KIOSK: {
    id: "usr-kiosk-1",
    name: "Express Touch Kiosk #1",
    email: "kiosk1@crunchy.com",
    role: "KIOSK",
    title: "Self-Order Touchscreen Kiosk",
    passwordHint: "kiosk123",
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
  createCategory: (name: string) => Promise<Category>;
  catalogLoading: boolean;
  catalogError: string;
  setCategoryArchived: (id: string, archived: boolean) => void;
  deleteCategory: (id: string) => Promise<any>;
  saveTimePricing: (schedule: TimePricingSchedule) => Promise<void>;
  deleteTimePricing: (id: string) => void;
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
  addCustomComboToCart: (combo: {
    productId: string;
    comboSelections: { product_id: string; variant_id: string | null; modifier_option_ids: string[]; quantity: number }[];
    title: string;
    image: string;
    unitPrice: number;
    quantity: number;
    items: {
      productName: string;
      variantName: string;
      modifiers: string[];
    }[];
  }) => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
  updateCartItemConfig: (
    cartItemId: string,
    variant: ProductVariant,
    selectedModifiers: SelectedModifier[],
    quantity: number
  ) => void;
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
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Table QR Ordering & Running Tabs
  tableNumber: string | null;
  setTableNumber: (table: string | null) => void;
  isTableOrderMode: boolean;
  setIsTableOrderMode: (open: boolean) => void;
  findActiveOrderByTableOrPhone: (table?: string | null, phone?: string | null) => Order | null;
  placeTableOrder: (details: {
    tableNumber: string;
    customerName: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
    fulfillmentType?: FulfillmentType;
    notes?: string;
  }) => Order;
  addItemsToRunningOrder: (
    orderId: string,
    itemsToAdd?: any[]
  ) => Order | null;
  removeItemFromRunningOrder: (
    orderId: string,
    itemId: string
  ) => { success: boolean; message: string };
  markOrderBilled: (orderId: string) => Order | null;
  lookupOrderByTokenOrCode: (query: string) => Order | null;

  // KDS State
  kdsTickets: KdsTicket[];
  bumpKdsTicket: (ticketId: string) => void;
  kdsSoundEnabled: boolean;
  setKdsSoundEnabled: (enabled: boolean) => void;
  lastKitchenCall: {
    orderNumber: string;
    token: string;
    customerName: string;
    fulfillmentType: string;
    tableNumber?: string;
    timestamp: number;
  } | null;
  triggerKitchenCall: (details: {
    orderNumber: string;
    kioskToken?: string;
    customerName: string;
    fulfillmentType?: FulfillmentType | string;
    tableNumber?: string;
  }) => void;
  simulateIncomingOrder: (type: "TABLE_QR" | "WEBSITE") => Order;

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

  // Organization & Admin Suite State
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, "id" | "joinedDate">) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, "id" | "lastRestocked">) => void;
  updateInventoryStock: (id: string, newStock: number, reason?: string, note?: string) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  clearInventoryDummyData: () => void;
  syncBackendInventory: (items: any[]) => void;
  stockMovements: StockMovementRecord[];
  recordStockMovement: (movement: Omit<StockMovementRecord, "id" | "timestamp">) => void;

  purchases: PurchaseRecord[];
  addPurchaseRecord: (record: Omit<PurchaseRecord, "id">) => void;

  daybookExpenses: DaybookExpense[];
  addDaybookExpense: (exp: Omit<DaybookExpense, "id">) => void;
  deleteDaybookExpense: (id: string) => void;

  // Daybook & Accounts Sub-modules (Parties, Register, General Ledger)
  parties: Party[];
  addParty: (party: Omit<Party, "id" | "createdAt">) => void;
  updateParty: (id: string, updates: Partial<Party>) => void;
  deleteParty: (id: string) => void;
  customPartyTypes: string[];
  addCustomPartyType: (type: string) => void;

  daybookAccountEntries: DaybookAccountEntry[];
  addDaybookAccountEntry: (entry: Omit<DaybookAccountEntry, "id">) => void;
  deleteDaybookAccountEntry: (id: string) => void;

  openingBalanceSetting: number;
  setOpeningBalanceSetting: (bal: number) => void;

  loyaltyRecords: CustomerLoyaltyRecord[];
  loyaltySettings: LoyaltySettings;
  updateLoyaltySettings: (settings: Partial<LoyaltySettings>) => void;
  lookupLoyaltyByPhone: (phone: string) => CustomerLoyaltyRecord | null;
  recordCustomerVisit: (phone: string, name: string, spentAmount: number) => CustomerLoyaltyRecord;
  appliedLoyaltyDiscounts: AppliedLoyaltyDiscount[];
  recordAppliedLoyaltyDiscount: (entry: Omit<AppliedLoyaltyDiscount, "id" | "appliedAt">) => void;
  evaluateLoyaltyDiscountForCustomer: (phone: string, subtotal: number) => {
    rule: LoyaltyVisitRule;
    discountAmount: number;
    visitNumber: number;
    summaryText: string;
  } | null;

  orgSettings: OrganizationSettings;
  updateOrgSettings: (settings: Partial<OrganizationSettings>) => void;

  createProduct: (prod: Omit<Product, "id">) => Promise<Product>;
  updateProductFull: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => void;

  createOutlet: (outlet: Omit<Outlet, "id">) => void;
  updateOutlet: (id: string, updates: Partial<Outlet>) => void;

  settleSplitPaymentOrder: (
    orderId: string,
    splits: { method: PaymentMethod; amount: number; reference?: string }[],
    discountAmount?: number,
    discountReason?: string,
    customerInfo?: { customerName?: string; customerPhone?: string }
  ) => Order | null;

  stockAudits: StockAuditRecord[];
  addStockAuditRecord: (record: Omit<StockAuditRecord, "id">) => void;
  createStaffOrder: (details: {
    customerName: string;
    customerPhone?: string;
    fulfillmentType: FulfillmentType;
    tableNumber?: string;
    items: {
      product: Product;
      variant: ProductVariant;
      quantity: number;
      modifiers: string[];
      price: number;
    }[];
    paymentMethod: PaymentMethod;
    paymentStatus: "PAID" | "UNPAID";
    notes?: string;
    discountAmount?: number;
    isSplitPayment?: boolean;
    splitPayments?: { method: PaymentMethod; amount: number; reference?: string }[];
  }) => Order;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & theme - permanently default to dark/black theme everywhere
  const [activePortal, setActivePortal] = useState<PortalType>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase();
      if (
        p === "/admin" ||
        p.startsWith("/admin/") ||
        p.startsWith("/superadmin") ||
        p.startsWith("/brand") ||
        p.startsWith("/outlet") ||
        p.startsWith("/dashboard") ||
        p.startsWith("/admin-portal")
      ) {
        return "admin";
      }
      if (p.startsWith("/pos")) return "staff";
      if (p.startsWith("/kds")) return "kitchen";
      if (p.startsWith("/waiter")) return "staff";
      if (p.startsWith("/rider")) return "staff";
      if (p.startsWith("/tv")) return "tv";
      if (p.startsWith("/table-qr")) return "table-qr";
      if (p.startsWith("/kiosk")) return "kiosk";
    }
    return "customer";
  });
  const [isDark, setIsDark] = useState<boolean>(true);

  // Authentication & Role Access
  const [userRole, setUserRole] = useState<UserRole>("CUSTOMER");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOGS);

  // Outlets
  const [outlets, setOutlets] = useState<Outlet[]>(MOCK_OUTLETS);
  const [currentOutlet, setCurrentOutlet] = useState<Outlet>(() => {
    const saved = authStorage.getOutlet();
    const user = authStorage.getUser();
    const userAssigned = (user as any)?.assigned_outlet || (user as any)?.outlet;
    const userOutletId = user?.outlet_id || (user as any)?.assignedOutletId;

    const urlOutletId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("outlet_id")
        : null;

    const rawId = urlOutletId || saved?.id || userAssigned?.id || userOutletId || (import.meta as any).env.VITE_DEFAULT_OUTLET_ID || "1";
    const normalizedId = normalizeOutletId(rawId);

    const name = saved?.name || userAssigned?.name || MOCK_OUTLETS[0].name;
    const code = saved?.branch_code || saved?.code || userAssigned?.branch_code || MOCK_OUTLETS[0].code;
    const address = saved?.address || userAssigned?.address || MOCK_OUTLETS[0].address;
    const phone = saved?.phone || userAssigned?.phone || MOCK_OUTLETS[0].phone;

    return {
      ...MOCK_OUTLETS[0],
      id: normalizedId,
      name,
      code,
      address,
      phone,
    };
  });
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("DELIVERY");

  // Sync with authStorage outlet changes & load live branches from backend
  useEffect(() => {
    let mounted = true;

    const handleOutletSync = () => {
      const saved = authStorage.getOutlet();
      const user = authStorage.getUser();
      const userAssigned = (user as any)?.assigned_outlet || (user as any)?.outlet;
      const userOutletId = user?.outlet_id || (user as any)?.assignedOutletId;

      const rawId = saved?.id || userAssigned?.id || userOutletId;
      const normalizedId = normalizeOutletId(rawId);
      const name = saved?.name || userAssigned?.name;
      const code = saved?.branch_code || saved?.code || userAssigned?.branch_code;
      const address = saved?.address || userAssigned?.address;
      const phone = saved?.phone || userAssigned?.phone;

      setCurrentOutlet((prev) => ({
        ...prev,
        id: normalizedId || prev.id || "1",
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(address ? { address } : {}),
        ...(phone ? { phone } : {}),
      }));
    };

    window.addEventListener("crunchy:outlet_change", handleOutletSync);
    window.addEventListener("crunchy:auth_change", handleOutletSync);

    // Fetch live restaurant branches from backend on startup
    const fetchBranches = async () => {
      try {
        const liveBranches = await branchApi.getBranches(1);
        if (mounted && Array.isArray(liveBranches) && liveBranches.length > 0) {
          const mapped: Outlet[] = liveBranches.map((b: any) => ({
            id: String(b.id),
            name: b.name ? (b.name === "Main" ? "Crunchy Main - Kathmandu" : b.name) : "Main Branch",
            code: b.branch_code || `0${b.id}`,
            address: b.address_line || "Kathmandu, Nepal",
            city: b.city || "Kathmandu",
            phone: b.phone_number || "+977 1-4229988",
            isOpen: b.accepting_orders ?? b.is_active ?? true,
            timezone: "Asia/Kathmandu (NPT +05:45)",
            operatingHours: "10:30 AM – 11:00 PM",
            estimatedPrepTimeMin: 15,
            serviceModes: ["Dine-in", "Takeaway", "Delivery"],
          }));
          setOutlets(mapped);

          // Auto-select or hydrate currentOutlet to the user's branch
          setCurrentOutlet((prev) => {
            const saved = authStorage.getOutlet();
            const user = authStorage.getUser();
            const targetId = normalizeOutletId(saved?.id || user?.outlet_id || prev.id || "1");
            const matched = mapped.find((o) => o.id === targetId) || mapped[0];
            return {
              ...prev,
              id: matched.id,
              name: prev.name && prev.name !== "Crunchy Flagship - Durbar Marg" ? prev.name : matched.name,
              code: matched.code || prev.code,
              address: matched.address || prev.address,
              phone: matched.phone || prev.phone,
            };
          });
        }
      } catch (err) {
        console.warn("Could not fetch branches from backend:", err);
      }
    };

    fetchBranches();

    return () => {
      mounted = false;
      window.removeEventListener("crunchy:outlet_change", handleOutletSync);
      window.removeEventListener("crunchy:auth_change", handleOutletSync);
    };
  }, []);

  // Organization Suite States
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("crunchy_real_purchases");
        if (saved !== null) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_PURCHASES;
  });
  const [daybookExpenses, setDaybookExpenses] = useState<DaybookExpense[]>(INITIAL_DAYBOOK_EXPENSES);
  const [parties, setParties] = useState<Party[]>(INITIAL_PARTIES);
  const [customPartyTypes, setCustomPartyTypes] = useState<string[]>([
    "STAFF",
    "VENDOR",
    "CUSTOMER",
    "OTHER",
  ]);
  const [daybookAccountEntries, setDaybookAccountEntries] = useState<DaybookAccountEntry[]>(INITIAL_DAYBOOK_ENTRIES);
  const [openingBalanceSetting, setOpeningBalanceSetting] = useState<number>(5000);
  const [loyaltyRecords, setLoyaltyRecords] = useState<CustomerLoyaltyRecord[]>(INITIAL_LOYALTY_RECORDS);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(INITIAL_LOYALTY_SETTINGS);
  const [appliedLoyaltyDiscounts, setAppliedLoyaltyDiscounts] = useState<AppliedLoyaltyDiscount[]>(INITIAL_APPLIED_LOYALTY_DISCOUNTS);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("crunchy_org_settings");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // ignore fallback to initial
      }
    }
    return INITIAL_ORG_SETTINGS;
  });
  const [stockAudits, setStockAudits] = useState<StockAuditRecord[]>(INITIAL_STOCK_AUDITS);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("crunchy_real_movements");
        if (saved !== null) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_STOCK_MOVEMENTS;
  });

  // Clear any stale cached inventory from localStorage so dummy data never leaks back
  useEffect(() => {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem("crunchy_real_inventory"); } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("crunchy_real_purchases", JSON.stringify(purchases));
      } catch {}
    }
  }, [purchases]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("crunchy_real_movements", JSON.stringify(stockMovements));
      } catch {}
    }
  }, [stockMovements]);

  // Table QR Ordering & Running Tabs State
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [isTableOrderMode, setIsTableOrderMode] = useState<boolean>(false);

  // Auto-detect table parameter in URL e.g. ?table=T4 or ?table=4 or ?mode=table
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.location && window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        const tableParam = searchParams.get("table") || searchParams.get("tbl") || searchParams.get("t");
        if (tableParam) {
          const clean = tableParam.trim().toUpperCase();
          const digits = clean.replace(/\D/g, "");
          const formatted = digits
            ? `Table ${digits.padStart(2, "0")}`
            : clean.startsWith("TBL-") || clean.startsWith("TABLE")
              ? clean
              : `Table ${clean}`;
          setTableNumber(formatted);
          setIsTableOrderMode(true);
        }
        const modeParam = searchParams.get("mode") || searchParams.get("portal");
        if (modeParam === "table" || modeParam === "table-qr" || modeParam === "qr") {
          setIsTableOrderMode(true);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Persisted catalog: backend snapshots and live invalidation.
  const { categories, products, setProducts, timePricingSchedules, catalogLoading, catalogError,
    createCategory, setCategoryArchived, deleteCategory, saveTimePricing, deleteTimePricing, toggleTimePricing,
    createProduct, updateProductFull, deleteProduct, toggleProductAvailability } = useCatalog(currentOutlet.id, activePortal, isTableOrderMode, (toast) => addToast(toast));
  const [draftChangesCount, setDraftChangesCount] = useState(0);

  // Cart
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Orders & KDS
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [kdsTickets, setKdsTickets] = useState<KdsTicket[]>([]);
  const [kdsSoundEnabled, setKdsSoundEnabled] = useState(true);
  const [lastKitchenCall, setLastKitchenCall] = useState<{
    orderNumber: string;
    token: string;
    customerName: string;
    fulfillmentType: string;
    tableNumber?: string;
    timestamp: number;
  } | null>(null);

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
  const effectiveIsLoadingSkeleton = isLoadingSkeleton || catalogLoading;

  // Customer Navigation, Favorites & Search
  const customerAccount = useCustomerAccount();
  const [customerActiveTab, setCustomerActiveTab] = useState<"menu" | "orders">("menu");
  const favorites = customerAccount.favorites;
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Customer Profile State
  const customerProfile = customerAccount.profile;
  const setCustomerProfile = (_value: any) => {};
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const updateCustomerProfile = (updated: Partial<CustomerProfile>) => customerAccount.saveProfile(updated);
  const toggleFavorite = (productId: string) => { void customerAccount.toggleFavorite(productId); };

  const isFavorite = (productId: string) => favorites.includes(productId);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Apply dark mode class to html and body permanently for overall site black theme
  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (document.body) {
      document.body.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (document.body) {
      document.body.classList.add("dark");
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

  useEffect(() => { if(customerAccount.error) addToast({title:'Customer request failed',description:customerAccount.error,type:'error'}); }, [customerAccount.error]);

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

  const addCustomComboToCart = (combo: {
    productId: string;
    comboSelections: { product_id: string; variant_id: string | null; modifier_option_ids: string[]; quantity: number }[];
    title: string;
    image: string;
    unitPrice: number;
    quantity: number;
    items: {
      productName: string;
      variantName: string;
      modifiers: string[];
    }[];
  }) => {
    const selectedModifiers: SelectedModifier[] = combo.items.map((it, idx) => ({
      groupId: `combo-item-${idx}`,
      groupName: it.productName,
      optionId: `opt-${idx}`,
      optionName: `${it.variantName}${it.modifiers && it.modifiers.length > 0 ? ` [${it.modifiers.join(", ")}]` : ""}`,
      priceDelta: 0,
    }));

    const newItem: CartLineItem = {
      cartItemId: `ci-combo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: combo.productId,
      comboSelections: combo.comboSelections,
      productName: combo.title,
      image: combo.image,
      variant: {
        id: "combo-custom-pack",
        name: `Combo Package (${combo.items.length} Items Included)`,
        price: combo.unitPrice,
      },
      selectedModifiers,
      quantity: combo.quantity,
      unitPrice: combo.unitPrice,
      lineTotal: combo.unitPrice * combo.quantity,
      addedAt: Date.now(),
      quoteExpiresAt: Date.now() + 15 * 60 * 1000,
    };

    setCartItems((prev) => [...prev, newItem]);
    addToast({
      title: "Combo Package Added",
      description: `${combo.quantity}x ${combo.title} (${combo.items.length} customized items)`,
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

  const updateCartItemConfig = (
    cartItemId: string,
    variant: ProductVariant,
    selectedModifiers: SelectedModifier[],
    quantity: number
  ) => {
    const modifiersDelta = selectedModifiers.reduce((acc, m) => acc + m.priceDelta, 0);
    const unitPrice = variant.price + modifiersDelta;
    const lineTotal = unitPrice * quantity;

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            variant,
            selectedModifiers,
            quantity,
            unitPrice,
            lineTotal,
          };
        }
        return item;
      })
    );
    addToast({
      title: "Cart Updated",
      description: `Updated ${variant.name}`,
      type: "success",
    });
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
      orderSource: "WEBSITE",
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

  // -------------------------------------------------------------
  // TABLE QR ORDERING & RUNNING TABS METHODS
  // -------------------------------------------------------------
  const findActiveOrderByTableOrPhone = (
    targetTable?: string | null,
    targetPhone?: string | null
  ): Order | null => {
    const cleanTable = targetTable ? targetTable.replace(/\s+/g, "").toLowerCase() : null;
    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, "") : null;

    return (
      orders.find((o) => {
        if (o.status === "CANCELLED" || o.status === "COMPLETED") return false;
        if (cleanTable && o.tableNumber) {
          const orderTableClean = o.tableNumber.replace(/\s+/g, "").toLowerCase();
          if (orderTableClean === cleanTable) return true;
        }
        if (cleanPhone && cleanPhone.length >= 7 && o.customerPhone) {
          const orderPhoneClean = o.customerPhone.replace(/\D/g, "");
          if (orderPhoneClean.includes(cleanPhone) || cleanPhone.includes(orderPhoneClean)) return true;
        }
        return false;
      }) || null
    );
  };

  const placeTableOrder = (details: {
    tableNumber: string;
    customerName: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
    fulfillmentType?: FulfillmentType;
    notes?: string;
  }): Order => {
    const orderNum = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const shortToken = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const effectiveFulfillment: FulfillmentType = details.fulfillmentType || "DINE_IN";

    const lineItemSnapshots: OrderItemSnapshot[] = cart.items.map((ci) => ({
      id: ci.cartItemId,
      productName: ci.productName,
      variantName: ci.variant.name,
      modifiersSummary: ci.selectedModifiers.map((m) =>
        m.priceDelta > 0 ? `+ ${m.optionName}` : m.optionName
      ),
      unitPrice: ci.unitPrice,
      quantity: ci.quantity,
      lineTotal: ci.lineTotal,
      roundNumber: 1,
    }));

    const round1: OrderRoundInfo = {
      roundNumber: 1,
      placedAt: new Date().toISOString(),
      items: lineItemSnapshots,
      roundSubtotal: cart.subtotal,
    };

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      outletId: currentOutlet.id,
      outletName: currentOutlet.name,
      customerName: details.customerName || "Table Guest",
      customerPhone: details.customerPhone || customerProfile.phone,
      fulfillmentType: effectiveFulfillment,
      orderSource: "TABLE_QR",
      tableNumber: details.tableNumber,
      kioskToken: shortToken,
      status: "CONFIRMED",
      items: lineItemSnapshots,
      subtotal: cart.subtotal,
      vatIncludedAmount: cart.taxInclusiveAmount,
      totalAmount: cart.finalTotal,
      createdAt: new Date().toISOString(),
      estimatedPickupTime: `Served at ${details.tableNumber} (~12 mins)`,
      elapsedSeconds: 0,
      paymentMethod: details.paymentMethod,
      notes: details.notes,
      roundsCount: 1,
      orderRounds: [round1],
      isTableSessionActive: true,
    };

    // Push live initial ticket to KDS
    const newKdsTicket: KdsTicket = {
      id: `kds-${Date.now()}`,
      orderNumber: orderNum,
      station: "Kitchen Main Line",
      fulfillmentType: effectiveFulfillment,
      tableNumber: details.tableNumber,
      kioskToken: shortToken,
      roundNumber: 1,
      column: "QUEUED",
      elapsedSeconds: 0,
      customerName: `${details.customerName || "Guest"} (${details.tableNumber})`,
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

    addToast({
      title: "Table Order Placed!",
      description: `Order #${orderNum} for ${details.tableNumber}. Print Token: ${shortToken}`,
      type: "success",
    });

    return newOrder;
  };

  const addItemsToRunningOrder = (
    orderId: string,
    itemsToAdd?: any[]
  ): Order | null => {
    const targetOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!targetOrder) return null;

    const sourceItems: any[] = itemsToAdd && itemsToAdd.length > 0 ? itemsToAdd : cart.items;
    if (sourceItems.length === 0) return null;

    const nextRoundNumber = (targetOrder.roundsCount || 1) + 1;

    // Distinguish kitchen prep items vs direct counter items (cigarettes, packed juice, water)
    const newSnapshots: OrderItemSnapshot[] = sourceItems.map((ci, idx) => {
      const prodName = ci.productName || ci.product?.name || "Item";
      const varName = ci.variantName || ci.variant?.name || "Standard";
      const modifiers = ci.modifiers || (ci.selectedModifiers ? ci.selectedModifiers.map((m: any) => m.priceDelta > 0 ? `+ ${m.optionName}` : m.optionName) : []);
      const unitPrice = ci.unitPrice ?? ci.price ?? 0;
      const quantity = ci.quantity || 1;
      const lineTotal = ci.lineTotal ?? (unitPrice * quantity);

      let requiresKitchen = true;
      if (ci.product && ci.product.requiresKitchen === false) {
        requiresKitchen = false;
      } else {
        const foundProd = products.find((p) => p.id === ci.productId || p.name === prodName);
        if (foundProd && foundProd.requiresKitchen === false) {
          requiresKitchen = false;
        }
      }

      return {
        id: `item-${Date.now()}-${idx}-r${nextRoundNumber}`,
        productName: prodName,
        variantName: varName,
        modifiersSummary: modifiers,
        unitPrice,
        quantity,
        lineTotal,
        roundNumber: nextRoundNumber,
        requiresKitchen,
        sentToKitchen: requiresKitchen, // Dispatched to KDS if true, direct counter handover if false
        addedLater: true,
        addedAt: new Date().toISOString(),
      };
    });

    const kitchenSnapshots = newSnapshots.filter((s) => s.requiresKitchen);
    const directCounterSnapshots = newSnapshots.filter((s) => !s.requiresKitchen);

    const roundSubtotal = newSnapshots.reduce((acc, i) => acc + i.lineTotal, 0);
    const newRound: OrderRoundInfo = {
      roundNumber: nextRoundNumber,
      placedAt: new Date().toISOString(),
      items: newSnapshots,
      roundSubtotal,
    };

    const updatedSubtotal = targetOrder.subtotal + roundSubtotal;
    const updatedVat = +(updatedSubtotal * 0.13).toFixed(2);
    const updatedTotal = targetOrder.totalAmount + roundSubtotal;

    const updatedOrder: Order = {
      ...targetOrder,
      items: [...targetOrder.items, ...newSnapshots],
      subtotal: updatedSubtotal,
      vatIncludedAmount: updatedVat,
      totalAmount: updatedTotal,
      roundsCount: nextRoundNumber,
      orderRounds: [...(targetOrder.orderRounds || []), newRound],
      status: kitchenSnapshots.length > 0 ? "PROCESSING" : targetOrder.status,
      isTableSessionActive: true,
      hasAddedLaterItems: true,
    };

    // Only push KDS ticket if there are kitchen items to prepare!
    if (kitchenSnapshots.length > 0) {
      const addOnTicket: KdsTicket = {
        id: `kds-addon-${Date.now()}`,
        orderNumber: `${targetOrder.orderNumber}-R${nextRoundNumber}`,
        station: "Kitchen Main Line",
        fulfillmentType: targetOrder.fulfillmentType,
        tableNumber: targetOrder.tableNumber,
        kioskToken: targetOrder.kioskToken,
        roundNumber: nextRoundNumber,
        isAddOnRound: true,
        column: "QUEUED",
        elapsedSeconds: 0,
        customerName: `${targetOrder.customerName} [R${nextRoundNumber} ADDED LATER: ${targetOrder.tableNumber || "Table"}]`,
        items: kitchenSnapshots.map((s) => ({
          id: s.id,
          productName: s.productName,
          variantName: s.variantName,
          quantity: s.quantity,
          modifiers: [`ROUND ${nextRoundNumber} ADDED LATER`, ...s.modifiersSummary],
        })),
      };
      setKdsTickets((prev) => [addOnTicket, ...prev]);
    }

    setOrders((prev) => prev.map((o) => (o.id === targetOrder.id ? updatedOrder : o)));
    setActiveOrder(updatedOrder);
    if (!itemsToAdd || itemsToAdd === (cart.items as any)) {
      clearCart();
    }

    let descriptionMsg = "";
    if (kitchenSnapshots.length > 0 && directCounterSnapshots.length > 0) {
      descriptionMsg = `${kitchenSnapshots.length} items sent to Kitchen. ${directCounterSnapshots.length} direct counter items added.`;
    } else if (kitchenSnapshots.length > 0) {
      descriptionMsg = `${kitchenSnapshots.length} items sent to Kitchen KDS.`;
    } else {
      descriptionMsg = `${directCounterSnapshots.length} direct counter items added (no kitchen ticket sent).`;
    }

    addToast({
      title: `Round ${nextRoundNumber} Added to Order #${targetOrder.orderNumber}!`,
      description: descriptionMsg,
      type: "success",
    });

    return updatedOrder;
  };

  const removeItemFromRunningOrder = (
    orderId: string,
    itemId: string
  ): { success: boolean; message: string } => {
    const targetOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!targetOrder) return { success: false, message: "Order not found" };

    const targetItem = targetOrder.items.find((i) => i.id === itemId);
    if (!targetItem) return { success: false, message: "Item not found in order" };

    // If sentToKitchen is true, it is already cooking on the line - reject casual removal!
    if (targetItem.sentToKitchen === true) {
      addToast({
        title: "Cannot Remove Item",
        description: `"${targetItem.productName}" is already sent to the kitchen line. Requires Manager/Kitchen Void.`,
        type: "warning",
      });
      return {
        success: false,
        message: `"${targetItem.productName}" was already sent to the kitchen line.`,
      };
    }

    // Item was not sent to kitchen (or is direct counter item) - remove it!
    const updatedItems = targetOrder.items.filter((i) => i.id !== itemId);
    const updatedSubtotal = updatedItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const updatedVat = +(updatedSubtotal * 0.13).toFixed(2);
    const updatedTotal = Math.max(0, updatedSubtotal - (targetOrder.discountAmount || 0));

    const updatedOrder: Order = {
      ...targetOrder,
      items: updatedItems,
      subtotal: updatedSubtotal,
      vatIncludedAmount: updatedVat,
      totalAmount: updatedTotal,
    };

    setOrders((prev) => prev.map((o) => (o.id === targetOrder.id ? updatedOrder : o)));
    if (activeOrder?.id === targetOrder.id) {
      setActiveOrder(updatedOrder);
    }

    addToast({
      title: "Item Removed",
      description: `Removed "${targetItem.productName}" from Order #${targetOrder.orderNumber}.`,
      type: "info",
    });

    return { success: true, message: `Removed "${targetItem.productName}"` };
  };

  const markOrderBilled = (orderId: string): Order | null => {
    let updated: Order | null = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId || o.orderNumber === orderId) {
          updated = {
            ...o,
            isBilled: true,
            paymentStatus: "PAID",
            settledAt: new Date().toISOString(),
          };
          return updated;
        }
        return o;
      })
    );
    return updated;
  };

  const lookupOrderByTokenOrCode = (query: string): Order | null => {
    if (!query || !query.trim()) return null;
    const clean = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const digitsOnly = query.replace(/\D/g, "");

    return (
      orders.find((o) => {
        // Check Kiosk Token (e.g. TK-4821 or 4821)
        if (o.kioskToken) {
          const tokenClean = o.kioskToken.toUpperCase().replace(/[^A-Z0-9]/g, "");
          if (tokenClean === clean || tokenClean.includes(clean) || clean.includes(tokenClean)) return true;
        }
        // Check Order Number (e.g. CR-8921)
        const ordNumClean = o.orderNumber.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (ordNumClean === clean || ordNumClean.includes(clean) || clean.includes(ordNumClean)) return true;

        // Check Table (e.g. Table 04, T4)
        if (o.tableNumber) {
          const tableClean = o.tableNumber.toUpperCase().replace(/[^A-Z0-9]/g, "");
          if (tableClean === clean) return true;
        }
        // Check Customer Phone
        if (digitsOnly.length >= 7 && o.customerPhone) {
          const phoneDigits = o.customerPhone.replace(/\D/g, "");
          if (phoneDigits.includes(digitsOnly) || digitsOnly.includes(phoneDigits)) return true;
        }
        return false;
      }) || null
    );
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
    const source = (order as any)._customerOrder;
    if (!source?.reorder_items) {addToast({title:'Open the menu to choose your items',type:'info'});return;}
    const restored: CartLineItem[] = [];
    for(const line of source.reorder_items) {
      const product=products.find(p=>String(p.id)===String(line.product_id));
      if(!product?.isAvailable){addToast({title:'Item no longer available',description:product?.name || 'Choose a replacement from the menu.',type:'warning'});continue;}
      const variant=product.variants.find(v=>String(v.id)===String(line.variant_id)) || (!line.variant_id ? product.variants.find(v=>v.isDefault)||product.variants[0] : null);
      if(!variant&&!line.combo_selections){addToast({title:'Choose current options for '+product.name,type:'warning'});continue;}
      const modifiers=product.modifierGroups.flatMap(g=>g.options.filter(o=>line.modifier_option_ids.includes(o.id)).map(o=>({groupId:g.id,groupName:g.name,optionId:o.id,optionName:o.name,priceDelta:o.priceDelta})));
      const price=line.combo_selections?product.basePrice:(variant!.price+modifiers.reduce((sum,m)=>sum+m.priceDelta,0));
      restored.push({cartItemId:crypto.randomUUID(),productId:product.id,productName:product.name,image:product.images[0]||'',variant:variant||{id:'',name:'Combo',price},selectedModifiers:modifiers,quantity:line.quantity,unitPrice:price,lineTotal:price*line.quantity,addedAt:Date.now(),quoteExpiresAt:Date.now()+900000,comboSelections:line.combo_selections});
    }
    setCartItems(previous=>[...previous,...restored]);setIsCartDrawerOpen(true);
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

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, status } : o))
    );
    const targetOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (targetOrder) {
      if (status === "READY") {
        setKdsTickets((prev) =>
          prev.map((t) =>
            t.orderNumber === targetOrder.orderNumber ? { ...t, column: "READY" } : t
          )
        );
      } else if (status === "COMPLETED") {
        setKdsTickets((prev) =>
          prev.filter((t) => t.orderNumber !== targetOrder.orderNumber)
        );
      }
    }
  };

  const triggerKitchenCall = (details: {
    orderNumber: string;
    kioskToken?: string;
    customerName: string;
    fulfillmentType?: FulfillmentType | string;
    tableNumber?: string;
  }) => {
    const tokenDisplay = details.tableNumber ? details.tableNumber : (details.kioskToken || details.orderNumber.replace("CR-", "TK-"));
    const callData = {
      orderNumber: details.orderNumber,
      token: tokenDisplay,
      customerName: details.customerName,
      fulfillmentType: details.fulfillmentType || "TAKEAWAY",
      tableNumber: details.tableNumber,
      timestamp: Date.now(),
    };
    setLastKitchenCall(callData);

    // Play 3-tone acoustic bell chime (C5 -> E5 -> G5)
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.16, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.32);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.32);
        });
      }
    } catch {
      // AudioContext blocked
    }

    // Speech Synthesis voice announcement
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const callSubject = details.tableNumber ? `Table ${details.tableNumber}` : `Order Token ${tokenDisplay}`;
        const utterance = new SpeechSynthesisUtterance(`Kitchen call: ${callSubject}, your order is ready at the counter!`);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // SpeechSynthesis blocked
    }

    addToast({
      title: `🔔 Kitchen Call: ${tokenDisplay}`,
      description: `${details.customerName} called to pickup counter!`,
      type: "info",
    });
  };

  const simulateIncomingOrder = (type: "TABLE_QR" | "WEBSITE"): Order => {
    const isTable = type === "TABLE_QR";
    const ordNum = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const shortToken = isTable ? "T-04" : `TK-${Math.floor(10 + Math.random() * 89)}`;

    const p1 = products[0] || { name: "Crunchy Classic Burger", price: 340, variants: [{ name: "Standard", price: 340 }] };
    const p2 = products[1] || { name: "Crispy Peri-Peri Wings", price: 360, variants: [{ name: "6 Pcs", price: 360 }] };

    const items: OrderItemSnapshot[] = [
      {
        id: `sim-it-1-${Date.now()}`,
        productName: p1.name,
        variantName: p1.variants[0]?.name || "Regular",
        modifiersSummary: ["Extra Spicy Dip"],
        unitPrice: p1.price,
        quantity: 2,
        lineTotal: p1.price * 2,
      },
      {
        id: `sim-it-2-${Date.now()}`,
        productName: p2.name,
        variantName: p2.variants[0]?.name || "Regular",
        modifiersSummary: ["Garlic Mayo"],
        unitPrice: p2.price,
        quantity: 1,
        lineTotal: p2.price,
      },
    ];

    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);

    const newOrder: Order = {
      id: `ord-sim-${Date.now()}`,
      orderNumber: ordNum,
      outletId: currentOutlet.id,
      outletName: currentOutlet.name,
      customerName: isTable ? "Pooja Gurung" : "Rohan Shrestha",
      customerPhone: "9841234567",
      fulfillmentType: isTable ? "DINE_IN" : "TAKEAWAY",
      orderSource: isTable ? "TABLE_QR" : "WEBSITE",
      tableNumber: isTable ? "T-04" : undefined,
      kioskToken: shortToken,
      status: "CONFIRMED",
      items,
      subtotal,
      vatIncludedAmount: +(subtotal * 0.13).toFixed(2),
      totalAmount: subtotal,
      createdAt: new Date().toISOString(),
      estimatedPickupTime: isTable ? "Table 04 (~10 mins)" : "Pickup Counter (~15 mins)",
      elapsedSeconds: 0,
      paymentMethod: isTable ? "CASH_ON_PICKUP" : "ESEWA",
      paymentStatus: isTable ? "UNPAID" : "PAID",
      isTableSessionActive: isTable,
    };

    setOrders((prev) => [newOrder, ...prev]);

    const newKdsTicket: KdsTicket = {
      id: `kds-${Date.now()}`,
      orderNumber: ordNum,
      station: "Kitchen Main Line",
      fulfillmentType: newOrder.fulfillmentType,
      tableNumber: newOrder.tableNumber,
      kioskToken: shortToken,
      roundNumber: 1,
      column: "QUEUED",
      elapsedSeconds: 0,
      customerName: `${newOrder.customerName} (${newOrder.tableNumber || "Takeaway"})`,
      items: items.map((i) => ({
        id: i.id,
        productName: i.productName,
        variantName: i.variantName,
        quantity: i.quantity,
        modifiers: i.modifiersSummary,
      })),
    };

    setKdsTickets((prev) => [newKdsTicket, ...prev]);

    addToast({
      title: isTable ? "⚡ Simulated Table QR Order!" : "⚡ Simulated Web Takeaway Order!",
      description: `Order #${ordNum} (${shortToken}) dispatched to Incoming Queue!`,
      type: "success",
    });

    return newOrder;
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
              // Trigger acoustic + TTS Kitchen Call announcement
              triggerKitchenCall({
                orderNumber: ticket.orderNumber,
                kioskToken: ticket.kioskToken,
                customerName: ticket.customerName,
                fulfillmentType: ticket.fulfillmentType,
                tableNumber: ticket.tableNumber,
              });
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
    else if (role === "ADMIN") setActivePortal("admin");
    else if (role === "KIOSK") setActivePortal("kiosk");

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
      else if (match.role === "ADMIN") setActivePortal("admin");
      else if (match.role === "KIOSK") setActivePortal("kiosk");

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

  const publishMenuDraft = () => {
    addToast({ title: "Menu changes are saved automatically", type: "info" });
    return { checksum: "", updatedCount: 0 };
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

  // Employee Management
  const addEmployee = (emp: Omit<Employee, "id" | "joinedDate">) => {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`,
      joinedDate: new Date().toISOString().split("T")[0],
    };
    setEmployees((prev) => [...prev, newEmp]);
    addToast({
      title: "Employee Created",
      description: `${newEmp.name} assigned to ${newEmp.assignedPages.length} pages`,
      type: "success",
    });
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    addToast({
      title: "Employee Updated",
      description: "Permissions and details updated",
      type: "success",
    });
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    addToast({
      title: "Employee Removed",
      description: "Employee deleted from staff roster",
      type: "info",
    });
  };

  // Inventory Management
  const addInventoryItem = (item: Omit<InventoryItem, "id" | "lastRestocked">) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      lastRestocked: "Just now",
    };
    setInventory((prev) => [...prev, newItem]);
    addToast({
      title: "Stock Added",
      description: `${newItem.name} (${newItem.currentStock} ${newItem.unit}) added to inventory`,
      type: "success",
    });
  };

  const updateInventoryStock = (id: string, newStock: number, reason?: string, note?: string) => {
    const item = inventory.find((i) => i.id === id);
    const prevStock = item ? item.currentStock : 0;
    const delta = Number((newStock - prevStock).toFixed(2));

    setInventory((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, currentStock: newStock, lastRestocked: "Just now" } : i
      )
    );

    if (item && delta !== 0) {
      const isIncrease = delta > 0;
      const defaultReason = isIncrease
        ? (reason || "Supplier delivery restock")
        : (reason || "Daily kitchen usage / prep");

      const newMovement: StockMovementRecord = {
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        type: isIncrease ? "INCREASE" : "DECREASE",
        quantity: Math.abs(delta),
        unit: item.unit,
        previousStock: prevStock,
        newStock: newStock,
        reason: defaultReason,
        note: note || undefined,
        timestamp: new Date().toISOString(),
        outletId: currentOutlet.id,
        recordedBy: "Staff Member",
      };
      setStockMovements((prev) => [newMovement, ...prev]);
    }

    addToast({
      title: delta >= 0 ? "Stock Level Increased" : "Stock Level Decreased",
      description: `${item ? item.name : "Item"}: ${newStock} (${delta >= 0 ? "+" : ""}${delta}). Reason: ${reason || "Stock adjustment"}`,
      type: "success",
    });
  };

  const recordStockMovement = (movement: Omit<StockMovementRecord, "id" | "timestamp">) => {
    const newRecord: StockMovementRecord = {
      ...movement,
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setStockMovements((prev) => [newRecord, ...prev]);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    addToast({
      title: "Inventory Item Deleted",
      description: "Item removed from inventory tracking",
      type: "info",
    });
  };

  const clearInventoryDummyData = () => {
    setInventory([]);
    setPurchases([]);
    setStockMovements([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("crunchy_real_inventory", JSON.stringify([]));
        localStorage.setItem("crunchy_real_purchases", JSON.stringify([]));
        localStorage.setItem("crunchy_real_movements", JSON.stringify([]));
      } catch {}
    }
    addToast({
      title: "Demo Data Cleared",
      description: "All dummy inventory, purchase bills, and movements removed.",
      type: "info",
    });
  };

  const syncBackendInventory = useCallback((backendItems: any[]) => {
    if (!Array.isArray(backendItems) || backendItems.length === 0) return;

    setInventory((prev) => {
      const updated = [...prev];
      backendItems.forEach((bItem: any) => {
        const bId = String(bItem.id);
        const bSku = bItem.sku ? String(bItem.sku).toLowerCase() : "";
        const bName = String(bItem.name || "").toLowerCase().trim();
        const bStock = parseFloat(bItem.current_stock ?? bItem.currentStock) || 0;
        const bCost = parseFloat(bItem.cost_per_unit ?? bItem.costPerUnit) || 0;
        const bMin = parseFloat(bItem.min_threshold ?? bItem.minThreshold) || 5;
        const bUnit = String(bItem.unit || "KG").toLowerCase();
        const bCategory = bItem.category_name || (typeof bItem.category === "string" ? bItem.category : "Raw Meat & Poultry");
        const bSupplier = bItem.supplier_name || bItem.supplierName || "";

        const matchIdx = updated.findIndex(
          (loc) =>
            loc.id === bId ||
            (loc.sku && bSku && loc.sku.toLowerCase() === bSku) ||
            loc.name.toLowerCase().trim() === bName
        );

        if (matchIdx >= 0) {
          updated[matchIdx] = {
            ...updated[matchIdx],
            currentStock: bStock,
            costPerUnit: bCost > 0 ? bCost : updated[matchIdx].costPerUnit,
            minThreshold: bMin,
            supplierName: bSupplier || updated[matchIdx].supplierName,
            category: bCategory || updated[matchIdx].category,
          };
        } else {
          updated.push({
            id: bId.startsWith("inv-") ? bId : `inv-${bId}`,
            sku: bItem.sku || `SKU-${bId.slice(0, 8).toUpperCase()}`,
            name: bItem.name,
            category: bCategory as any,
            currentStock: bStock,
            unit: bUnit as any,
            minThreshold: bMin,
            costPerUnit: bCost,
            supplierName: bSupplier,
            lastRestocked: bItem.last_restocked || "Live Backend Sync",
            outletId: currentOutlet.id,
          });
        }
      });
      return updated;
    });
  }, [currentOutlet.id]);

  // Purchases Management
  const addPurchaseRecord = (record: Omit<PurchaseRecord, "id">) => {
    const newRecord: PurchaseRecord = {
      ...record,
      id: `po-${Date.now()}`,
    };
    setPurchases((prev) => [newRecord, ...prev]);

    // Automatically increase inventory stock for matching items
    setInventory((prev) =>
      prev.map((inv) => {
        const matching = record.items.find(
          (p) => p.itemId === inv.id || p.itemName.toLowerCase() === inv.name.toLowerCase()
        );
        if (matching) {
          return {
            ...inv,
            currentStock: inv.currentStock + matching.quantity,
            lastRestocked: "Today (PO Received)",
          };
        }
        return inv;
      })
    );

    addToast({
      title: "Purchase Bill Recorded",
      description: `Invoice ${newRecord.invoiceNumber} (NPR ${newRecord.totalAmount}) logged and stock updated`,
      type: "success",
    });
  };

  // Daybook Expenses
  const addDaybookExpense = (exp: Omit<DaybookExpense, "id">) => {
    const newExp: DaybookExpense = {
      ...exp,
      id: `exp-${Date.now()}`,
    };
    setDaybookExpenses((prev) => [newExp, ...prev]);
    addToast({
      title: "Expense Logged",
      description: `${newExp.category}: NPR ${newExp.amount} recorded in daybook`,
      type: "success",
    });
  };

  const deleteDaybookExpense = (id: string) => {
    setDaybookExpenses((prev) => prev.filter((e) => e.id !== id));
    addToast({
      title: "Expense Entry Deleted",
      description: "Daybook expense record deleted",
      type: "info",
    });
  };

  // Daybook & Accounts Sub-modules (Party Master & Financial Ledgers)
  const addParty = (party: Omit<Party, "id" | "createdAt">) => {
    const newParty: Party = {
      ...party,
      id: `party-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      currentBalance: party.openingBalance,
      totalIn: 0,
      totalOut: 0,
    };
    setParties((prev) => [...prev, newParty]);
    addToast({
      title: "Party Created",
      description: `${newParty.name} (${newParty.category}) added to party master`,
      type: "success",
    });
  };

  const updateParty = (id: string, updates: Partial<Party>) => {
    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    addToast({
      title: "Party Updated",
      description: "Party record updated successfully",
      type: "success",
    });
  };

  const deleteParty = (id: string) => {
    setParties((prev) => prev.filter((p) => p.id !== id));
    addToast({
      title: "Party Deleted",
      description: "Party deleted from ledger",
      type: "info",
    });
  };

  const addCustomPartyType = (type: string) => {
    const clean = type.trim().toUpperCase();
    if (!clean) return;
    if (!customPartyTypes.includes(clean)) {
      setCustomPartyTypes((prev) => [...prev, clean]);
      addToast({
        title: "Party Type Added",
        description: `New party type "${clean}" is now available`,
        type: "success",
      });
    }
  };

  const addDaybookAccountEntry = (entry: Omit<DaybookAccountEntry, "id">) => {
    const newEntry: DaybookAccountEntry = {
      ...entry,
      id: `entry-${Date.now()}`,
    };
    setDaybookAccountEntries((prev) => [newEntry, ...prev]);

    // Also update party balance and in/out totals if linked
    if (newEntry.partyId) {
      setParties((prev) =>
        prev.map((p) => {
          if (p.id === newEntry.partyId) {
            const inAmt = newEntry.inOutType === "IN" ? newEntry.amount : 0;
            const outAmt = newEntry.inOutType === "OUT" ? newEntry.amount : 0;
            const currentBal =
              (p.currentBalance ?? p.openingBalance) +
              (newEntry.inOutType === "IN" ? -newEntry.amount : newEntry.amount);
            return {
              ...p,
              totalIn: (p.totalIn || 0) + inAmt,
              totalOut: (p.totalOut || 0) + outAmt,
              currentBalance: currentBal,
            };
          }
          return p;
        })
      );
    }

    addToast({
      title: "Voucher Recorded",
      description: `${newEntry.voucherType} #${newEntry.voucherNumber}: NPR ${newEntry.amount} (${newEntry.inOutType}) saved`,
      type: "success",
    });
  };

  const deleteDaybookAccountEntry = (id: string) => {
    setDaybookAccountEntries((prev) => prev.filter((e) => e.id !== id));
    addToast({
      title: "Voucher Deleted",
      description: "Daybook voucher removed",
      type: "info",
    });
  };

  // Customer Loyalty, Visit Rules & Applied Discounts Log
  const updateLoyaltySettings = (settings: Partial<LoyaltySettings>) => {
    setLoyaltySettings((prev) => ({ ...prev, ...settings }));
    addToast({
      title: "Loyalty Configuration Saved",
      description: "Visit-based discount rules and reward settings updated successfully",
      type: "success",
    });
  };

  const lookupLoyaltyByPhone = (phone: string): CustomerLoyaltyRecord | null => {
    const clean = phone.replace(/\D/g, "");
    if (!clean || clean.length < 5) return null;
    return loyaltyRecords.find((r) => r.phone.replace(/\D/g, "").includes(clean)) || null;
  };

  const recordAppliedLoyaltyDiscount = (entry: Omit<AppliedLoyaltyDiscount, "id" | "appliedAt">) => {
    const newRecord: AppliedLoyaltyDiscount = {
      ...entry,
      id: `ald-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      appliedAt: "Just now",
    };
    setAppliedLoyaltyDiscounts((prev) => [newRecord, ...prev]);
  };

  const evaluateLoyaltyDiscountForCustomer = (phone: string, subtotal: number) => {
    if (!loyaltySettings.revisitOfferEnabled || !phone || subtotal <= 0) return null;
    const customer = lookupLoyaltyByPhone(phone);
    const visitNum = customer ? customer.visitCount + 1 : 1;
    const currentRecorded = customer ? customer.visitCount : 1;

    const rules = loyaltySettings.visitRules || [];
    const matchedRule = rules.find((rule) => {
      if (!rule.isActive) return false;

      // Check visit count match
      const matchesVisit =
        rule.visitOperator === "GTE"
          ? (visitNum >= rule.visitCount || currentRecorded >= rule.visitCount)
          : (rule.visitCount === visitNum || rule.visitCount === currentRecorded);

      if (!matchesVisit) return false;

      // Check bill amount range
      const minOk = subtotal >= (rule.minPurchaseAmount || 0);
      const maxOk =
        !rule.maxPurchaseAmount || rule.maxPurchaseAmount <= 0 || subtotal <= rule.maxPurchaseAmount;

      return minOk && maxOk;
    });

    if (!matchedRule) return null;

    const discountAmount =
      matchedRule.discountType === "PERCENT"
        ? Math.round((subtotal * matchedRule.discountValue) / 100)
        : Math.min(matchedRule.discountValue, subtotal);

    const summaryText =
      matchedRule.discountType === "PERCENT"
        ? `${matchedRule.discountValue}% OFF (NPR ${discountAmount})`
        : `NPR ${discountAmount} FLAT OFF`;

    return {
      rule: matchedRule,
      discountAmount,
      visitNumber: visitNum,
      summaryText,
    };
  };

  const recordCustomerVisit = (phone: string, name: string, spentAmount: number): CustomerLoyaltyRecord => {
    const cleanPhone = phone.trim();
    const existingIndex = loyaltyRecords.findIndex(
      (r) => r.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, "")
    );
    const today = new Date().toISOString().split("T")[0];

    if (existingIndex >= 0) {
      const existing = loyaltyRecords[existingIndex];
      const updated: CustomerLoyaltyRecord = {
        ...existing,
        name: name || existing.name,
        visitCount: existing.visitCount + 1,
        lastVisitDate: today,
        totalSpent: existing.totalSpent + spentAmount,
        loyaltyPoints:
          existing.loyaltyPoints + Math.floor(spentAmount / 100) * loyaltySettings.pointsPerHundredNpr,
        eligibleRevisitDiscountPercent: loyaltySettings.revisitOfferEnabled
          ? loyaltySettings.revisitDiscountPercent
          : 0,
      };
      setLoyaltyRecords((prev) => {
        const next = [...prev];
        next[existingIndex] = updated;
        return next;
      });
      return updated;
    } else {
      const created: CustomerLoyaltyRecord = {
        id: `loy-${Date.now()}`,
        phone: cleanPhone,
        name: name || "Walk-in Customer",
        visitCount: 1,
        firstVisitDate: today,
        lastVisitDate: today,
        totalSpent: spentAmount,
        loyaltyPoints: Math.floor(spentAmount / 100) * loyaltySettings.pointsPerHundredNpr,
        eligibleRevisitDiscountPercent: 0,
      };
      setLoyaltyRecords((prev) => [created, ...prev]);
      return created;
    }
  };

  // Organization Settings
  const updateOrgSettings = (settings: Partial<OrganizationSettings>) => {
    setOrgSettings((prev) => {
      const updated = { ...prev, ...settings };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("crunchy_org_settings", JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }
      return updated;
    });
    addToast({
      title: "Organization Profile Updated",
      description: "Brand logo, PAN, legal identity, and outlet policies updated",
      type: "success",
    });
  };

  // Outlets CRUD
  const createOutlet = (outletData: Omit<Outlet, "id">) => {
    const newOutlet: Outlet = {
      ...outletData,
      id: `out-0${outlets.length + 1}`,
    };
    setOutlets((prev) => [...prev, newOutlet]);
    addToast({
      title: "New Outlet Created",
      description: `${newOutlet.name} (${newOutlet.code}) is now ready`,
      type: "success",
    });
  };

  const updateOutlet = (id: string, updates: Partial<Outlet>) => {
    setOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
    if (currentOutlet.id === id) {
      setCurrentOutlet((prev) => ({ ...prev, ...updates }));
    }
    addToast({
      title: "Outlet Details Updated",
      description: "Branch settings successfully saved",
      type: "success",
    });
  };

  // Settle Split Payment (supports Credit Sale & Customer Phone persistence)
  const settleSplitPaymentOrder = (
    orderId: string,
    splits: { method: PaymentMethod; amount: number; reference?: string }[],
    discountAmount = 0,
    discountReason?: string,
    customerInfo?: { customerName?: string; customerPhone?: string }
  ): Order | null => {
    let settledOrder: Order | null = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId || o.orderNumber === orderId) {
          const finalTotal = Math.max(0, o.subtotal - discountAmount);
          const hasCredit = splits.some((s) => s.method === "CREDIT" && s.amount > 0);
          const allCredit = splits.every((s) => s.method === "CREDIT");
          const primaryMethod = splits.length === 1 ? splits[0].method : (hasCredit ? "CREDIT" : splits[0].method);

          settledOrder = {
            ...o,
            status: "COMPLETED",
            isBilled: true,
            settledAt: new Date().toISOString(),
            isSplitPayment: splits.length > 1,
            splitPayments: splits,
            discountAmount,
            discountReason,
            totalAmount: finalTotal,
            paymentMethod: primaryMethod,
            paymentStatus: allCredit ? "UNPAID" : "PAID",
            customerName: customerInfo?.customerName?.trim() || o.customerName,
            customerPhone: customerInfo?.customerPhone?.trim() || o.customerPhone,
          };
          return settledOrder;
        }
        return o;
      })
    );

    if (settledOrder) {
      const so: Order = settledOrder;
      recordCustomerVisit(so.customerPhone, so.customerName, so.totalAmount);
      const hasCredit = splits.some((s) => s.method === "CREDIT" && s.amount > 0);
      addToast({
        title: hasCredit ? "Order Settled with Credit (Khata)" : "Order Settled & Closed",
        description: `Order #${so.orderNumber} closed via ${splits?.map((s) => s.method === "CREDIT" ? "Credit (Khata)" : s.method.replace(/_/g, " "))?.join(" + ") || "Direct Payment"}`,
        type: "success",
      });
    }
    return settledOrder;
  };

  // Stock Audit Implementation
  const addStockAuditRecord = (record: Omit<StockAuditRecord, "id">) => {
    const newRecord: StockAuditRecord = {
      ...record,
      id: `audit-${Date.now()}`,
    };
    setStockAudits((prev) => [newRecord, ...prev]);

    // When reconciled, automatically update currentStock in inventory to physicalStock
    if (record.status === "RECONCILED") {
      setInventory((prev) =>
        prev.map((inv) => {
          const matched = record.items.find((item) => item.itemId === inv.id);
          if (matched) {
            return {
              ...inv,
              currentStock: matched.physicalStock,
              lastRestocked: "Reconciled via Physical Audit",
            };
          }
          return inv;
        })
      );
    }

    addToast({
      title: "Stock Audit Recorded",
      description: `Audit #${newRecord.auditNumber} successfully logged and inventory reconciled.`,
      type: "success",
    });
  };

  // Staff POS Quick Order Creation
  const createStaffOrder = (details: {
    customerName: string;
    customerPhone?: string;
    fulfillmentType: FulfillmentType;
    tableNumber?: string;
    items: {
      product: Product;
      variant: ProductVariant;
      quantity: number;
      modifiers: string[];
      price: number;
    }[];
    paymentMethod: PaymentMethod;
    paymentStatus: "PAID" | "UNPAID";
    notes?: string;
    discountAmount?: number;
    isSplitPayment?: boolean;
    splitPayments?: { method: PaymentMethod; amount: number; reference?: string }[];
  }): Order => {
    const orderNum = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const shortToken = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = details.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = details.discountAmount || 0;
    const finalTotal = Math.max(0, subtotal - discount);

    const hasCredit =
      details.paymentMethod === "CREDIT" ||
      (details.splitPayments && details.splitPayments.some((s) => s.method === "CREDIT" && s.amount > 0));
    const isSplit = Boolean(
      details.isSplitPayment || (details.splitPayments && details.splitPayments.length > 1)
    );

    const kitchenItems = details.items.filter((i) => i.product.requiresKitchen !== false);
    const directCounterItems = details.items.filter((i) => i.product.requiresKitchen === false);

    const snapshots: OrderItemSnapshot[] = details.items.map((i, idx) => {
      const reqKitchen = i.product.requiresKitchen !== false;
      return {
        id: `ci-${Date.now()}-${idx}`,
        productName: i.product.name,
        variantName: i.variant.name,
        modifiersSummary: i.modifiers,
        unitPrice: i.price,
        quantity: i.quantity,
        lineTotal: i.price * i.quantity,
        roundNumber: 1,
        requiresKitchen: reqKitchen,
        sentToKitchen: reqKitchen,
        addedLater: false,
        addedAt: new Date().toISOString(),
      };
    });

    const round1: OrderRoundInfo = {
      roundNumber: 1,
      placedAt: new Date().toISOString(),
      items: snapshots,
      roundSubtotal: subtotal,
    };

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: orderNum,
      kioskToken: shortToken,
      outletId: currentOutlet.id,
      outletName: currentOutlet.name,
      customerName: details.customerName || "Walk-in Guest",
      customerPhone: details.customerPhone || "9800000000",
      fulfillmentType: details.fulfillmentType,
      tableNumber: details.tableNumber,
      status: kitchenItems.length > 0 ? "CONFIRMED" : "READY",
      items: snapshots,
      subtotal,
      vatIncludedAmount: Math.round(finalTotal * 0.13),
      discountAmount: discount,
      totalAmount: finalTotal,
      createdAt: new Date().toISOString(),
      estimatedPickupTime: kitchenItems.length > 0 ? `In ${currentOutlet.estimatedPrepTimeMin} mins` : "Ready at Counter",
      elapsedSeconds: 0,
      paymentMethod: details.paymentMethod,
      paymentStatus: details.paymentStatus,
      isBilled: details.paymentStatus === "PAID" || Boolean(hasCredit),
      settledAt: details.paymentStatus === "PAID" || Boolean(hasCredit) ? new Date().toISOString() : undefined,
      notes: details.notes,
      roundsCount: 1,
      orderRounds: [round1],
      isSplitPayment: isSplit,
      splitPayments: details.splitPayments,
      isTableSessionActive: details.fulfillmentType === "DINE_IN",
    };

    if (newOrder.customerPhone && newOrder.isBilled) {
      recordCustomerVisit(newOrder.customerPhone, newOrder.customerName, newOrder.totalAmount);
    }

    if (kitchenItems.length > 0) {
      const newKdsTicket: KdsTicket = {
        id: `kds-${Date.now()}`,
        orderNumber: orderNum,
        station: "Kitchen Main Line",
        fulfillmentType: details.fulfillmentType,
        tableNumber: details.tableNumber,
        kioskToken: shortToken,
        roundNumber: 1,
        column: "QUEUED",
        elapsedSeconds: 0,
        customerName: `${details.customerName || "Counter Guest"}${details.tableNumber ? ` (${details.tableNumber})` : ""}`,
        items: kitchenItems.map((i, idx) => ({
          id: `kds-item-${Date.now()}-${idx}`,
          productName: i.product.name,
          variantName: i.variant.name,
          quantity: i.quantity,
          modifiers: i.modifiers,
        })),
      };
      setKdsTickets((prev) => [newKdsTicket, ...prev]);
    }

    setOrders((prev) => [newOrder, ...prev]);

    if (details.customerPhone) {
      recordCustomerVisit(details.customerPhone, details.customerName || "Counter Guest", finalTotal);
    }

    if (kitchenItems.length > 0 && directCounterItems.length > 0) {
      addToast({
        title: "Order Placed & Kitchen Notified",
        description: `Order #${orderNum} (${kitchenItems.length} kitchen items to cook line, ${directCounterItems.length} direct counter items).`,
        type: "success",
      });
    } else if (kitchenItems.length > 0) {
      addToast({
        title: "Kitchen Order Placed",
        description: `Order #${orderNum} • Token: ${shortToken} sent to Kitchen KDS.`,
        type: "success",
      });
    } else {
      addToast({
        title: "Direct Counter Order Ready",
        description: `Order #${orderNum} • Token: ${shortToken} (Direct handover, no kitchen prep).`,
        type: "success",
      });
    }

    return newOrder;
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
        categories, catalogLoading, catalogError, createCategory, setCategoryArchived, deleteCategory, saveTimePricing, deleteTimePricing,
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
        addCustomComboToCart,
        updateCartItemQty,
        updateCartItemConfig,
        removeCartItem,
        clearCart,
        orders: activePortal === "customer" ? customerAccount.orders : orders,
        activeOrder: activePortal === "customer" ? customerAccount.orders[0] || null : activeOrder,
        setActiveOrder,
        placeTakeawayOrder,
        cancelOrder: activePortal === "customer" ? customerAccount.cancel : cancelOrder,
        reorderItems,
        acknowledgeOrder,
        markTakeawayComplete,
        updateOrderStatus,
        tableNumber,
        setTableNumber,
        isTableOrderMode,
        setIsTableOrderMode,
        findActiveOrderByTableOrPhone,
        placeTableOrder,
        addItemsToRunningOrder,
        lookupOrderByTokenOrCode,
        kdsTickets,
        bumpKdsTicket,
        kdsSoundEnabled,
        setKdsSoundEnabled,
        lastKitchenCall,
        triggerKitchenCall,
        simulateIncomingOrder,
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
        isLoadingSkeleton: effectiveIsLoadingSkeleton,
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
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        inventory,
        addInventoryItem,
        updateInventoryStock,
        updateInventoryItem,
        deleteInventoryItem,
        clearInventoryDummyData,
        syncBackendInventory,
        purchases,
        addPurchaseRecord,
        daybookExpenses,
        addDaybookExpense,
        deleteDaybookExpense,
        parties,
        addParty,
        updateParty,
        deleteParty,
        customPartyTypes,
        addCustomPartyType,
        daybookAccountEntries,
        addDaybookAccountEntry,
        deleteDaybookAccountEntry,
        openingBalanceSetting,
        setOpeningBalanceSetting,
        loyaltyRecords,
        loyaltySettings,
        updateLoyaltySettings,
        lookupLoyaltyByPhone,
        recordCustomerVisit,
        appliedLoyaltyDiscounts,
        recordAppliedLoyaltyDiscount,
        evaluateLoyaltyDiscountForCustomer,
        orgSettings,
        updateOrgSettings,
        createProduct,
        updateProductFull,
        deleteProduct,
        createOutlet,
        updateOutlet,
        settleSplitPaymentOrder,
        stockAudits,
        addStockAuditRecord,
        stockMovements,
        recordStockMovement,
        createStaffOrder,
        removeItemFromRunningOrder,
        markOrderBilled,
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
