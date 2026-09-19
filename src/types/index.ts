export type UserRole = "CUSTOMER" | "KITCHEN" | "STAFF" | "ADMIN" | "KIOSK";

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  points: number;
  tier: string;
  memberSince: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  badgeType: "order" | "kitchen" | "menu" | "staff" | "payment";
}

export type PortalType = "customer" | "staff" | "kitchen" | "platform" | "device" | "kiosk" | "table-qr" | "tv";

export interface Outlet {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  isOpen: boolean;
  timezone: string; // e.g. "Asia/Kathmandu (NPT +05:45)"
  operatingHours: string;
  estimatedPrepTimeMin: number;
  serviceModes?: string[];
}

export type DietaryTag = "Halal" | "Spicy" | "Vegetarian" | "Chef's Choice" | "Popular";

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number; // e.g. 50 NPR
  isDefault?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  options: ModifierOption[];
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Single Patty", "Double Patty", "Mega Combo"
  price: number;
  isDefault?: boolean;
}

export interface CustomAttributeField {
  id: string;
  key: string;   // e.g. "Size Type", "Spice Level", "Cheese Selection", "Bacon Style"
  value: string; // e.g. "Monster 8oz", "Extra Ghost Pepper", "Double Aged Cheddar"
  priceDelta: number; // e.g. 0, 50, 120
}

export interface ProductTimePricingSlot {
  id: string;
  slotName: string; // e.g. "Breakfast Rush (7AM-11AM)", "Happy Hours (4PM-7PM)", "Late Night (10PM-2AM)"
  startTime: string; // "HH:MM" 24hr format
  endTime: string;   // "HH:MM" 24hr format
  price: number;     // specific pricing for this time window
  days?: string;     // e.g. "All Days" or "Mon-Fri"
  isActive: boolean;
}

export interface SuggestedSauce {
  id: string;
  name: string; // e.g. "Mint Chutney", "Truffle Mayo", "Sweet Chili", "Spicy Chipotle Dip"
  isFree: boolean; // true if free allowance
  extraPrice: number; // 0 if free, or e.g. NPR 25, NPR 40
  freeLimitCount?: number; // e.g. 1 free
}

export interface ProductIngredientRecipe {
  id: string;
  inventoryItemId: string; // references InventoryItem.id
  inventoryItemName: string;
  quantityRequired: number; // amount deducted per item sold (e.g. 0.16 kg or 1 bun)
  unit: string; // "kg", "pcs", "litres", "packets", etc.
}

export interface PremiumAddOn {
  id: string;
  name: string; // e.g. "Double Crisp Bacon Strips", "Melted Swiss Raclette", "Truffle Glaze"
  price: number; // e.g. NPR 120
  isAvailable: boolean;
}

export interface ComboPackageItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  costPrice?: number; // Raw ingredient cost for profit margin
  images: string[];
  mainImageIndex?: number; // index of the primary image
  dietary: DietaryTag[];
  isDeliveryEligible: boolean;
  isAvailable: boolean; // outlet-specific availability
  isWebVisible?: boolean; // toggle website visibility on/off
  showOnPos?: boolean; // toggle POS visibility on/off (default true)
  showOnQr?: boolean;  // toggle in-shop table QR menu visibility (default true)
  discountPercent?: number; // promotional percentage discount
  customAttributes?: CustomAttributeField[]; // dynamic key & value pairs
  variants: ProductVariant[];
  modifierGroups: ModifierGroup[];
  timePricings?: ProductTimePricingSlot[];
  suggestedSauces?: SuggestedSauce[];
  recipeIngredients?: ProductIngredientRecipe[];
  premiumAddOns?: PremiumAddOn[];
  prepTimeMinutes: number;
  calories?: number;
  requiresKitchen?: boolean; // If false (e.g. cigarettes, packed juice, soda, mineral water), not sent to kitchen KDS
  isCounterDirect?: boolean;
  isDirectInventoryItem?: boolean; // If item is directly sold from inventory purchases (e.g. cigarettes, red bull)
  linkedInventoryItemId?: string; // specific InventoryItem.id
  isComboPackage?: boolean; // True if this item is a Combo Package deal
  comboItems?: ComboPackageItem[]; // bundled menu items inside this package
  comboDiscountType?: "percentage" | "fixed_price" | "amount_off";
  comboDiscountValue?: number;
  comboOriginalPrice?: number;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  displayOrder: number;
  isArchived?: boolean;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartLineItem {
  cartItemId: string;
  productId: string;
  productName: string;
  image: string;
  variant: ProductVariant;
  selectedModifiers: SelectedModifier[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  addedAt: number;
  quoteExpiresAt: number; // 15-minute quote snapshot
}

export interface Cart {
  items: CartLineItem[];
  subtotal: number;
  taxInclusiveAmount: number; // VAT/PAN included (13%)
  cashRoundDownSavings: number; // Cash payment round-down
  finalTotal: number;
  quoteExpiresAt: number;
}

export type OrderStatus = 
  | "AWAITING_PAYMENT" 
  | "CONFIRMED" 
  | "PROCESSING" 
  | "READY" 
  | "COMPLETED" 
  | "CANCELLED";

export interface OrderItemSnapshot {
  id: string;
  productName: string;
  variantName: string;
  modifiersSummary: string[];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  roundNumber?: number;
  requiresKitchen?: boolean; // false for cigarettes, juices, etc. (direct counter item)
  sentToKitchen?: boolean;   // true if dispatched to KDS; false if pending/not sent (can be removed!)
  addedLater?: boolean;      // true if added to an ongoing order / table session
  addedAt?: string;          // ISO timestamp when added
}

export type FulfillmentType = "DELIVERY" | "TAKEAWAY" | "DRIVE_THRU" | "DINE_IN";
export type PaymentMethod = "ESEWA" | "CASH_ON_DELIVERY" | "CASH_ON_PICKUP" | "FONEPAY_QR" | "WALLET" | "CARD" | "PAY_AT_COUNTER" | "CREDIT";

export interface OrderRoundInfo {
  roundNumber: number;
  placedAt: string;
  items: OrderItemSnapshot[];
  roundSubtotal: number;
}

export interface SplitPaymentEntry {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "CR-8921"
  outletId: string;
  outletName: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: FulfillmentType;
  orderSource?: "WEBSITE" | "POS_COUNTER" | "TABLE_QR" | "KIOSK";
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotal: number;
  discountAmount?: number;
  discountReason?: string;
  vatIncludedAmount: number;
  totalAmount: number;
  createdAt: string; // ISO
  estimatedPickupTime: string;
  elapsedSeconds: number;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: "PAID" | "UNPAID";
  isBilled?: boolean; // true if bill is settled/closed; false if unsettled/pending payment
  settledAt?: string;
  refundStatus?: "NONE" | "REQUESTED" | "REFUNDED" | "VOIDED";
  refundAmount?: number;
  hasAddedLaterItems?: boolean;
  isSplitPayment?: boolean;
  splitPayments?: SplitPaymentEntry[];
  customerVisitCount?: number;
  deliveryAddress?: string;
  deliveryLocation?: {
    lat: number;
    lng: number;
    landmark?: string;
  };
  tableNumber?: string; // e.g. "Table 04" or "T-04"
  kioskToken?: string; // e.g. "TK-4821" for physical kiosk lookup & thermal print
  roundsCount?: number; // e.g. 1, 2, 3 (running table rounds)
  orderRounds?: OrderRoundInfo[];
  isTableSessionActive?: boolean; // active running table order open for add-ons
}

export type KdsColumn = "QUEUED" | "PREPARING" | "READY";

export interface KdsTicketItem {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  modifiers: string[]; // e.g. ["+ Extra Spicy", "NO Mayo"]
  completed?: boolean;
}

export interface KdsTicket {
  id: string;
  orderNumber: string;
  station: string; // e.g. "Grill & Fryer 1"
  fulfillmentType: FulfillmentType;
  column: KdsColumn;
  items: KdsTicketItem[];
  elapsedSeconds: number;
  customerName: string;
  priorityAlert?: boolean;
  deliveryAddress?: string;
  tableNumber?: string;
  kioskToken?: string;
  roundNumber?: number;
  isAddOnRound?: boolean;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: "Store Manager" | "Lead Cashier" | "Kitchen Supervisor" | "Floor Staff";
  outletId: string;
  outletName: string;
  permissions: string[]; // e.g. "orders.manage", "catalog.manage", "pricing.manage"
  isActive: boolean;
  avatarUrl?: string;
}

export interface PlatformOrganization {
  id: string;
  name: string;
  code: string;
  legalEntity: string;
  panNumber: string;
  status: "Active" | "Paused" | "Suspended";
  totalOutlets: number;
  activeDevices: number;
  monthlyOrders: number;
  contactEmail: string;
  createdAt: string;
}

export interface PlatformDevice {
  id: string;
  name: string;
  deviceType: "POS_TERMINAL" | "KDS_WALL_SCREEN" | "RECEIPT_KIOSK";
  outletId: string;
  outletName: string;
  ipAddress: string;
  lastHeartbeatSecondsAgo: number;
  status: "ONLINE" | "OFFLINE" | "SUSPENDED";
  tokenSecretMasked: string;
  pairedAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: "ORDER" | "CATALOG_PRODUCT" | "DEVICE" | "ORGANIZATION" | "TIME_PRICING";
  entityId: string;
  outletName: string;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
}

export interface TimePricingSchedule {
  id: string;
  title: string;
  outletId: string;
  productIds: string[];
  productNames: string[];
  daysOfWeek: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  startTime: string; // "16:00"
  endTime: string;   // "19:00"
  discountPercentage: number;
  isActive: boolean;
}

export type AdminSubPage =
  | "analytics"
  | "pos"
  | "kitchen"
  | "menu"
  | "inventory"
  | "purchases"
  | "daybook"
  | "employees"
  | "loyalty"
  | "organization"
  | "outlets"
  | "logs";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "SUPER_ADMIN" | "STORE_MANAGER" | "CASHIER" | "KITCHEN_SUPERVISOR" | "INVENTORY_MANAGER" | "FLOOR_STAFF";
  title: string;
  assignedOutletId: string;
  assignedPages: AdminSubPage[];
  isActive: boolean;
  salaryMonthly?: number;
  joinedDate: string;
  avatar?: string;
}

export type InventoryCategory =
  | "Raw Meat & Poultry"
  | "Dairy & Cheese"
  | "Bakery & Buns"
  | "Vegetables & Produce"
  | "Sauces & Condiments"
  | "Beverage Syrups & Dairy"
  | "Beverages & Drinks"
  | "Retail Counter Goods"
  | "Packaging & Disposables";

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  currentStock: number;
  unit: "kg" | "pcs" | "litres" | "packets" | "boxes" | "cans" | "bottles";
  minThreshold: number;
  costPerUnit: number; // in NPR
  supplierName: string;
  lastRestocked: string;
  outletId?: string;
  batchNo?: string;
  expiryDate?: string;
  theoreticalStock?: number;
  lastCostPrice?: number;
}

export interface StockMovementRecord {
  id: string;
  itemId: string;
  itemName: string;
  category?: string;
  type: "INCREASE" | "DECREASE";
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  reason: string;
  note?: string;
  timestamp: string;
  outletId?: string;
  recordedBy?: string;
}

export interface PurchaseLineItem {
  itemId: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  discount?: number;
  totalCost: number;
  batchNo?: string;
  expiryDate?: string;
}

export interface PurchaseRecord {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierPhone?: string;
  supplierPan?: string;
  purchaseDate: string;
  items: PurchaseLineItem[];
  subtotal?: number;
  discountAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentStatus: "PAID" | "PENDING" | "PARTIAL";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "FONEPAY" | "CHEQUE" | "CREDIT";
  notes?: string;
  documentName?: string;
  documentUrl?: string;
  receivedBy: string;
  outletId?: string;
}

export type ExpenseCategory =
  | "Raw Material & Food"
  | "Kitchen Gas & Cylinders"
  | "Utility & Electricity"
  | "Staff Wages & Advances"
  | "Packaging & Delivery Bags"
  | "Maintenance & Repairs"
  | "Cleaning & Hygiene"
  | "Misc Store Expenses";

export interface DaybookExpense {
  id: string;
  date: string;
  time: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  recordedBy: string;
  paymentMode: "CASH" | "BANK_TRANSFER" | "FONEPAY";
  receiptNumber?: string;
  outletId?: string;
}

export type PartyCategory = "STAFF" | "VENDOR" | "CUSTOMER" | "OTHER";

export interface Party {
  id: string;
  name: string;
  category: PartyCategory;
  phone?: string;
  pan?: string;
  openingBalance: number;
  openingBalanceType: "DR" | "CR"; // DR = Receivable / Advance, CR = Payable / Due
  currentBalance?: number;
  totalIn?: number;
  totalOut?: number;
  notes?: string;
  createdAt: string;
  outletId?: string;
}

export type DaybookVoucherType =
  | "PURCHASE"
  | "PURCHASE_RETURN"
  | "SALES"
  | "SALES_RETURN"
  | "EMPLOYEE"
  | "PAYABLE_PAID"
  | "RECEIVABLE_RECEIVED"
  | "EXPENSE"
  | "CASH_IN"
  | "CASH_OUT";

export interface DaybookAccountEntry {
  id: string;
  voucherNumber: string;
  date: string;
  time: string;
  partyId?: string;
  partyName: string;
  partyCategory?: PartyCategory;
  voucherType: DaybookVoucherType;
  inOutType: "IN" | "OUT";
  amount: number;
  paymentMode: "CASH" | "BANK_TRANSFER" | "FONEPAY" | "CHEQUE";
  drAmount?: number;
  crAmount?: number;
  description: string;
  referenceNo?: string;
  recordedBy: string;
  outletId?: string;
}

export interface DailyDaybookSummary {
  date: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  isClosed?: boolean;
}

export interface CustomerLoyaltyRecord {
  id: string;
  phone: string;
  name: string;
  visitCount: number;
  firstVisitDate: string;
  lastVisitDate: string;
  totalSpent: number;
  loyaltyPoints: number;
  eligibleRevisitDiscountPercent: number;
  notes?: string;
}

export interface LoyaltyVisitRule {
  id: string;
  name: string; // e.g. "2nd Visit Welcome Reward (Standard Range)"
  visitCount: number; // e.g. 2, 3, 5
  visitOperator?: "EXACT" | "GTE"; // "EXACT" for visit #2, "GTE" for 5th visit and above
  minPurchaseAmount: number; // Minimum order subtotal e.g. NPR 400
  maxPurchaseAmount?: number; // Maximum order subtotal e.g. NPR 1500 (or 0 for no limit)
  discountType: "PERCENT" | "FLAT";
  discountValue: number; // e.g. 10 (for 10%) or 150 (for NPR 150 off)
  isActive: boolean;
  description?: string;
}

export interface AppliedLoyaltyDiscount {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  visitNumber: number;
  subtotal: number;
  ruleName: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  discountAmount: number; // NPR saved
  finalAmount: number; // subtotal - discountAmount
  appliedAt: string; // timestamp
  outletName?: string;
}

export interface LoyaltySettings {
  revisitOfferEnabled: boolean;
  revisitDiscountPercent: number; // legacy default e.g. 15%
  qualifyingDaysWindow: number; // e.g. 14 days
  tokenResetDays?: number; // optional, deprecated since no token reset is kept
  pointsPerHundredNpr: number;
  visitRules: LoyaltyVisitRule[];
}

export interface OrganizationSettings {
  brandName: string;
  tagline: string;
  legalEntity: string;
  panNumber: string;
  logoUrl: string;
  websiteUrl: string;
  contactEmail: string;
  contactPhone: string;
  headquartersAddress: string;
  vatRatePercent: number;
  serviceChargePercent: number;
  defaultCurrency: string;
  acceptedPaymentMethods: PaymentMethod[];
}

export interface StockAuditItem {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  systemStock: number;
  physicalStock: number;
  variance: number; // physicalStock - systemStock
  varianceCost: number; // variance * costPerUnit
  discrepancyReason?: string;
}

export interface StockAuditRecord {
  id: string;
  auditNumber: string;
  outletId: string;
  outletName: string;
  auditedAt: string;
  auditorName: string;
  auditorRole: string;
  notes?: string;
  items: StockAuditItem[];
  totalVarianceCount: number;
  netVarianceCost: number;
  status: "COMPLETED" | "RECONCILED";
}

