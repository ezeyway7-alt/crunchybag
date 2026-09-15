export type UserRole = "CUSTOMER" | "KITCHEN" | "STAFF" | "ADMIN";

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

export type PortalType = "customer" | "staff" | "kitchen" | "platform" | "device";

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

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  images: string[];
  dietary: DietaryTag[];
  isDeliveryEligible: boolean;
  isAvailable: boolean; // outlet-specific availability
  variants: ProductVariant[];
  modifierGroups: ModifierGroup[];
  prepTimeMinutes: number;
  calories?: number;
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
}

export type FulfillmentType = "DELIVERY" | "TAKEAWAY" | "DRIVE_THRU" | "DINE_IN";
export type PaymentMethod = "ESEWA" | "CASH_ON_DELIVERY" | "CASH_ON_PICKUP" | "FONEPAY_QR" | "WALLET" | "CARD";

export interface Order {
  id: string;
  orderNumber: string; // e.g. "CR-8921"
  outletId: string;
  outletName: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: FulfillmentType;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotal: number;
  vatIncludedAmount: number;
  totalAmount: number;
  createdAt: string; // ISO
  estimatedPickupTime: string;
  elapsedSeconds: number;
  notes?: string;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  deliveryLocation?: {
    lat: number;
    lng: number;
    landmark?: string;
  };
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
