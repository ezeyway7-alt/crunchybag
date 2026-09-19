import React, { useState, useMemo } from "react";
import {
  Plus,
  Minus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Flame,
  Package,
  XCircle,
  Eye,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Receipt,
  User,
  Phone,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Lock,
  Calendar,
  Filter,
  RotateCcw,
  X,
  Banknote,
  Smartphone,
  Wallet,
  Zap,
  Bell,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  Product,
  ProductVariant,
  FulfillmentType,
  PaymentMethod,
  OrderStatus,
  Order,
} from "../../types";
import { formatNPR, formatTimer } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Drawer } from "../common/Drawer";
import { Modal } from "../common/Modal";
import { StaffTableGrid } from "./StaffTableGrid";

interface SelectedCartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  modifiers: string[];
  price: number;
}

interface Props {
  onOpenBillingForOrder?: (order: Order) => void;
}

export const StaffPosOrderTab: React.FC<Props> = ({ onOpenBillingForOrder }) => {
  const {
    products,
    categories,
    orders,
    currentOutlet,
    createStaffOrder,
    updateOrderStatus,
    lookupLoyaltyByPhone,
    evaluateLoyaltyDiscountForCustomer,
    recordAppliedLoyaltyDiscount,
    addToast,
    addItemsToRunningOrder,
    removeItemFromRunningOrder,
    markOrderBilled,
    triggerKitchenCall,
    simulateIncomingOrder,
  } = useApp();

  // -------------------------------------------------------------
  // POS MODE & ONGOING ORDER TAB STATE
  // -------------------------------------------------------------
  const [posMode, setPosMode] = useState<"NEW_ORDER" | "ADD_TO_ONGOING" | "FLOOR_TABLES">("NEW_ORDER");
  const [selectedOngoingOrderId, setSelectedOngoingOrderId] = useState<string>("");

  // Filter open running orders for ongoing addition
  const ongoingOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status !== "CANCELLED" && (o.isBilled === false || o.status !== "COMPLETED")
    );
  }, [orders]);

  const targetOngoingOrder = useMemo(() => {
    if (selectedOngoingOrderId) {
      const found = orders.find((o) => o.id === selectedOngoingOrderId);
      if (found) return found;
    }
    return ongoingOrders[0] || null;
  }, [orders, selectedOngoingOrderId, ongoingOrders]);

  // -------------------------------------------------------------
  // CREATE ORDER STATE
  // -------------------------------------------------------------
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("TAKEAWAY");
  const [tableNumber, setTableNumber] = useState("T-01");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_PICKUP");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">("PAID");
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [posSplits, setPosSplits] = useState<{ method: PaymentMethod; amount: number }[]>([
    { method: "CASH_ON_PICKUP", amount: 0 },
    { method: "CREDIT", amount: 0 },
  ]);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderDiscountAmount, setOrderDiscountAmount] = useState(0);

  // Checks whether the order involves Credit (Khata)
  const hasCreditMethod = useMemo(() => {
    if (isSplitMode) {
      return posSplits.some((s) => s.method === "CREDIT" && s.amount > 0);
    }
    return paymentMethod === "CREDIT";
  }, [isSplitMode, posSplits, paymentMethod]);

  // Menu Selection for Order Creation
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedCartItem[]>([]);

  // Modals & Drawers
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<Order | null>(null);
  const [printSlipOrder, setPrintSlipOrder] = useState<Order | null>(null);

  // -------------------------------------------------------------
  // ORDERS DATATABLE & FILTER STATE
  // -------------------------------------------------------------
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState<string>(() => getTodayStr());
  const [endDate, setEndDate] = useState<string>(() => getTodayStr());
  const [orderTypeFilter, setOrderTypeFilter] = useState<"ALL" | "ONLINE_DELIVERY" | "TAKEAWAY" | "DINE_IN">("ALL");
  const [settlementFilter, setSettlementFilter] = useState<"ALL" | "PAID" | "UNPAID" | "CREDIT">("ALL");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Loyalty Phone Auto-Check
  const loyaltyInfo = useMemo(() => {
    if (customerPhone.trim().length >= 7) {
      return lookupLoyaltyByPhone(customerPhone.trim());
    }
    return null;
  }, [customerPhone, lookupLoyaltyByPhone]);

  // Filtered Products for POS Quick-Add
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.is86ed) return false;
      if (p.showOnPos === false) return false;
      if (selectedCategory !== "ALL" && p.categoryId !== selectedCategory) return false;
      if (menuSearch.trim()) {
        const q = menuSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCategory, menuSearch]);

  // Order Subtotal
  const orderSubtotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [selectedItems]);

  const [appliedLoyaltyOfferName, setAppliedLoyaltyOfferName] = useState<string>("");

  // Evaluate visit-count and bill range loyalty offer
  const loyaltyOffer = useMemo(() => {
    if (customerPhone.trim().length >= 7 && orderSubtotal > 0) {
      return evaluateLoyaltyDiscountForCustomer(customerPhone.trim(), orderSubtotal);
    }
    return null;
  }, [customerPhone, orderSubtotal, evaluateLoyaltyDiscountForCustomer]);

  const orderTotal = Math.max(0, orderSubtotal - orderDiscountAmount);

  // Add Item to POS Cart
  const handleAddItem = (prod: Product) => {
    const defaultVariant: ProductVariant = prod.variants[0] || {
      id: "std",
      name: "Standard",
      price: prod.basePrice,
      isDefault: true,
    };

    setSelectedItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product.id === prod.id && i.variant.id === defaultVariant.id
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            product: prod,
            variant: defaultVariant,
            quantity: 1,
            modifiers: [],
            price: defaultVariant.price,
          },
        ];
      }
    });
  };

  const updateItemQty = (index: number, delta: number) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, idx) => idx !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePlaceOrder = () => {
    if (selectedItems.length === 0) {
      addToast({
        title: "Cart is Empty",
        description: "Please add at least one item to create an order.",
        type: "warning",
      });
      return;
    }

    // Enforce compulsory phone number for Credit (Khata) orders
    if (hasCreditMethod) {
      const cleanPhone = customerPhone.trim().replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length < 10) {
        addToast({
          title: "Customer Mobile Number Compulsory",
          description:
            "Credit Sale (Khata / उधारो) requires a valid 10-digit customer mobile number to maintain their credit balance.",
          type: "error",
        });
        const el = document.getElementById("pos-customer-phone");
        if (el) el.focus();
        return;
      }
    }

    // If split mode, ensure allocated sum matches order total
    if (isSplitMode) {
      const totalAllocated = posSplits.reduce((acc, s) => acc + s.amount, 0);
      if (Math.abs(totalAllocated - orderTotal) > 0.01) {
        addToast({
          title: "Split Tenders Unbalanced",
          description: `Total allocated (NPR ${totalAllocated}) must equal Total Payable (NPR ${orderTotal}).`,
          type: "warning",
        });
        return;
      }
    }

    const effectiveName = customerName.trim() || (fulfillmentType === "DINE_IN" ? `Table ${tableNumber} Guest` : "Counter Walk-in");
    const effectivePaymentMethod = isSplitMode ? posSplits[0]?.method || paymentMethod : paymentMethod;
    const effectivePaymentStatus: "PAID" | "UNPAID" = hasCreditMethod
      ? isSplitMode && posSplits.some((s) => s.method !== "CREDIT" && s.amount > 0)
        ? "PAID"
        : "UNPAID"
      : paymentStatus;

    createStaffOrder({
      customerName: effectiveName,
      customerPhone: customerPhone.trim() || undefined,
      fulfillmentType,
      tableNumber: fulfillmentType === "DINE_IN" ? tableNumber : undefined,
      items: selectedItems,
      paymentMethod: effectivePaymentMethod,
      paymentStatus: effectivePaymentStatus,
      notes: orderNotes.trim() || undefined,
      discountAmount: orderDiscountAmount,
      isSplitPayment: isSplitMode,
      splitPayments: isSplitMode ? posSplits : undefined,
    });

    if (orderDiscountAmount > 0 && appliedLoyaltyOfferName && customerPhone.trim()) {
      recordAppliedLoyaltyDiscount({
        orderNumber: `CR-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: effectiveName,
        customerPhone: customerPhone.trim(),
        visitNumber: loyaltyInfo ? loyaltyInfo.visitCount + 1 : 1,
        subtotal: orderSubtotal,
        ruleName: appliedLoyaltyOfferName,
        discountType: "PERCENT",
        discountValue: orderDiscountAmount,
        discountAmount: orderDiscountAmount,
        finalAmount: Math.max(0, orderSubtotal - orderDiscountAmount),
        outletName: currentOutlet.name,
      });
    }

    // Reset Form
    setSelectedItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setOrderNotes("");
    setOrderDiscountAmount(0);
    setAppliedLoyaltyOfferName("");
    setIsSplitMode(false);
    setPosSplits([
      { method: "CASH_ON_PICKUP", amount: 0 },
      { method: "CREDIT", amount: 0 },
    ]);
    setCurrentPage(1);
  };

  // Add Items to Running/Ongoing Order Handler
  const handleAddItemsToOngoingOrder = () => {
    if (!targetOngoingOrder) {
      addToast({
        title: "No Target Tab Selected",
        description: "Please select an ongoing order tab to add items to.",
        type: "warning",
      });
      return;
    }
    if (selectedItems.length === 0) {
      addToast({
        title: "No Items Selected",
        description: "Please tap items from the menu to add to this running order.",
        type: "warning",
      });
      return;
    }

    const kitchenCount = selectedItems.filter((i) => i.product.requiresKitchen !== false).length;
    const directCount = selectedItems.filter((i) => i.product.requiresKitchen === false).length;

    addItemsToRunningOrder(targetOngoingOrder.id, selectedItems);

    setSelectedItems([]);
    addToast({
      title: "Tab Updated Successfully",
      description: `Updated #${targetOngoingOrder.orderNumber}: ${kitchenCount > 0 ? `${kitchenCount} sent to kitchen cook line. ` : ""}${directCount > 0 ? `${directCount} direct counter items ready.` : ""}`,
      type: "success",
    });
  };

  // Remove Item from Running Order Handler
  const handleRemoveItemFromRunningOrder = (orderId: string, itemId: string) => {
    const success = removeItemFromRunningOrder(orderId, itemId);
    if (success && selectedOrderForDrawer && selectedOrderForDrawer.id === orderId) {
      const updated = orders.find((o) => o.id === orderId);
      if (updated) setSelectedOrderForDrawer(updated);
    }
  };

  // Initiate Adding Items from Table Row
  const handleStartAddingItemsToOrder = (order: Order) => {
    setPosMode("ADD_TO_ONGOING");
    setSelectedOngoingOrderId(order.id);
    setSelectedItems([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast({
      title: "Tab Selected",
      description: `Now adding items to Order #${order.orderNumber} (${order.customerName}). Select items from menu.`,
      type: "info",
    });
  };

  // -------------------------------------------------------------
  // DATATABLE FILTERING & PAGINATION
  // -------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Date Range Filter (Default: today)
      if (startDate) {
        const orderDate = (o.createdAt || "").slice(0, 10);
        if (orderDate && orderDate < startDate) return false;
      }
      if (endDate) {
        const orderDate = (o.createdAt || "").slice(0, 10);
        if (orderDate && orderDate > endDate) return false;
      }

      // Order Type Filter (Online / Delivery vs Dine-In vs Takeaway)
      if (orderTypeFilter === "ONLINE_DELIVERY") {
        if (o.fulfillmentType !== "DELIVERY" && o.orderSource !== "WEBSITE") return false;
      } else if (orderTypeFilter === "DINE_IN") {
        if (o.fulfillmentType !== "DINE_IN") return false;
      } else if (orderTypeFilter === "TAKEAWAY") {
        if (o.fulfillmentType !== "TAKEAWAY" && o.fulfillmentType !== "DRIVE_THRU") return false;
      }

      // Settlement Status Filter
      if (settlementFilter === "PAID") {
        if (o.paymentStatus !== "PAID" && !o.isBilled) return false;
      } else if (settlementFilter === "UNPAID") {
        if (o.paymentStatus === "PAID" || o.isBilled) return false;
      } else if (settlementFilter === "CREDIT") {
        const isCredit =
          o.paymentMethod === "CREDIT" ||
          (o.splitPayments && o.splitPayments.some((s) => s.method === "CREDIT" && s.amount > 0));
        if (!isCredit) return false;
      }

      // Status Filter
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;

      // Search Query
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase();
        const matchToken = (o.kioskToken || "").toLowerCase().includes(q);
        const matchOrderNum = o.orderNumber.toLowerCase().includes(q);
        const matchCust = o.customerName.toLowerCase().includes(q);
        const matchPhone = (o.customerPhone || "").toLowerCase().includes(q);
        const matchTable = (o.tableNumber || "").toLowerCase().includes(q);
        const matchMethod = (o.paymentMethod || "").toLowerCase().includes(q);
        const matchItem = o.items.some((i) => i.productName.toLowerCase().includes(q));
        if (!matchToken && !matchOrderNum && !matchCust && !matchPhone && !matchTable && !matchMethod && !matchItem) {
          return false;
        }
      }
      return true;
    });
  }, [orders, startDate, endDate, orderTypeFilter, settlementFilter, statusFilter, tableSearchQuery]);

  // Statistics reflecting the active filtered dataset
  const datatableStats = useMemo(() => {
    let grossSubtotal = 0;
    let totalDiscounts = 0;
    let netFinal = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    let cashTotal = 0;
    let cashCount = 0;
    let qrFonepayTotal = 0;
    let qrFonepayCount = 0;
    let esewaTotal = 0;
    let esewaCount = 0;
    let cardTotal = 0;
    let cardCount = 0;
    let creditTotal = 0;
    let creditCount = 0;
    let refundVoidTotal = 0;
    let refundVoidCount = 0;

    filteredOrders.forEach((o) => {
      const isCancelledOrVoid =
        o.status === "CANCELLED" || o.refundStatus === "REFUNDED" || o.refundStatus === "VOIDED";

      const sub = o.subtotal || o.totalAmount || 0;
      const disc = o.discountAmount || 0;
      const net = o.totalAmount;

      if (isCancelledOrVoid) {
        refundVoidCount += 1;
        refundVoidTotal += o.refundAmount || o.totalAmount || 0;
      } else {
        grossSubtotal += sub;
        totalDiscounts += disc;
        netFinal += net;

        const isCredit =
          o.paymentMethod === "CREDIT" ||
          (o.splitPayments && o.splitPayments.some((s) => s.method === "CREDIT" && s.amount > 0));

        if (isCredit) {
          const creditPart =
            o.splitPayments?.find((s) => s.method === "CREDIT")?.amount ?? net;
          creditTotal += creditPart;
          creditCount += 1;
        }

        const isPaid = o.paymentStatus === "PAID" || o.isBilled;
        if (isPaid) {
          totalPaid += net;
        } else {
          totalUnpaid += net;
        }

        if (o.paymentMethod === "CASH_ON_PICKUP" || o.paymentMethod === "CASH_ON_DELIVERY") {
          cashTotal += net;
          cashCount += 1;
        } else if (o.paymentMethod === "FONEPAY_QR") {
          qrFonepayTotal += net;
          qrFonepayCount += 1;
        } else if (o.paymentMethod === "ESEWA") {
          esewaTotal += net;
          esewaCount += 1;
        } else if (o.paymentMethod === "CARD") {
          cardTotal += net;
          cardCount += 1;
        } else if (o.paymentMethod !== "CREDIT") {
          cashTotal += net;
          cashCount += 1;
        }
      }
    });

    return {
      orderCount: filteredOrders.length,
      grossSubtotal,
      totalDiscounts,
      netFinal,
      totalPaid,
      totalUnpaid,
      cashTotal,
      cashCount,
      qrFonepayTotal,
      qrFonepayCount,
      esewaTotal,
      esewaCount,
      cardTotal,
      cardCount,
      creditTotal,
      creditCount,
      refundVoidTotal,
      refundVoidCount,
    };
  }, [filteredOrders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIdx, startIdx + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Fast Bump Status
  const handleQuickBumpStatus = (order: Order) => {
    if (order.status === "CONFIRMED") {
      updateOrderStatus(order.id, "PROCESSING");
      addToast({
        title: "Order Sent to Kitchen",
        description: `Order #${order.orderNumber} is now being prepared.`,
        type: "info",
      });
    } else if (order.status === "PROCESSING") {
      updateOrderStatus(order.id, "READY");
      addToast({
        title: "Order Marked Ready",
        description: `Token ${order.kioskToken || order.orderNumber} is ready at pickup counter!`,
        type: "success",
      });
    } else if (order.status === "READY") {
      updateOrderStatus(order.id, "COMPLETED");
      addToast({
        title: "Order Completed & Dispatched",
        description: `Order #${order.orderNumber} handed over to customer.`,
        type: "success",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------
          TOP SECTION: POS CREATE ORDER WORKSPACE
      ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Workspace Title Header & Mode Switcher */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-[#18181C] border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPosMode("NEW_ORDER");
                setSelectedItems([]);
              }}
              className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border ${
                posMode === "NEW_ORDER"
                  ? "bg-amber-500 text-black border-amber-500 font-extrabold"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
              }`}
            >
              New Order
            </button>

            <button
              type="button"
              onClick={() => {
                setPosMode("ADD_TO_ONGOING");
                setSelectedItems([]);
                if (!selectedOngoingOrderId && ongoingOrders.length > 0) {
                  setSelectedOngoingOrderId(ongoingOrders[0].id);
                }
              }}
              className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1 ${
                posMode === "ADD_TO_ONGOING"
                  ? "bg-amber-500 text-black border-amber-500 font-extrabold"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>Add to Ongoing Tab ({ongoingOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setPosMode("FLOOR_TABLES")}
              className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                posMode === "FLOOR_TABLES"
                  ? "bg-amber-500 text-black border-amber-500 font-extrabold"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
              }`}
            >
              <UtensilsCrossed className="w-3 h-3" />
              <span>Floor Tables (16)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const isTable = Math.random() > 0.4;
                const simulated = simulateIncomingOrder(isTable ? "TABLE_QR" : "WEBSITE");
                if (simulated.fulfillmentType === "DINE_IN") {
                  setPosMode("FLOOR_TABLES");
                }
              }}
              className="px-2.5 py-1 text-xs font-black bg-amber-500 hover:bg-amber-400 text-black border border-amber-400 transition-all cursor-pointer shadow-xs flex items-center gap-1"
              title="Click to simulate an incoming Table QR or Web Takeaway order"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>⚡ Test Incoming Order</span>
            </button>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {posMode === "FLOOR_TABLES" ? (
              <span className="text-zinc-500">Floor map: tap any vacant table to order, or occupied table to add food / bill</span>
            ) : posMode === "NEW_ORDER" ? (
              <>
                {selectedItems.length} items staged • Total:{" "}
                <strong className="text-amber-600 dark:text-amber-400 font-mono">
                  {formatNPR(orderTotal)}
                </strong>
              </>
            ) : (
              <>
                Updating:{" "}
                <strong className="text-zinc-900 dark:text-white font-mono">
                  {targetOngoingOrder ? `#${targetOngoingOrder.orderNumber} (${targetOngoingOrder.customerName})` : "None"}
                </strong>{" "}
                • {selectedItems.length} items staged (+{formatNPR(orderSubtotal)})
              </>
            )}
          </div>
        </div>

        {posMode === "FLOOR_TABLES" ? (
          <StaffTableGrid
            onSelectTableForNewOrder={(tableId) => {
              setFulfillmentType("DINE_IN");
              setTableNumber(tableId);
              setPosMode("NEW_ORDER");
              addToast({
                title: `Table ${tableId} Selected`,
                description: `Creating new Dine-In order for Table ${tableId}. Pick items from menu below.`,
                type: "info",
              });
            }}
            onSelectOngoingOrder={(order) => {
              handleStartAddingItemsToOrder(order);
            }}
            onOpenBillingForOrder={(order) => {
              if (onOpenBillingForOrder) onOpenBillingForOrder(order);
            }}
          />
        ) : (
        /* 2-Column POS Layout: Left = Menu Selection, Right = Order Ticket & Tender */
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
          {/* LEFT: Quick Menu Item Selector (Cols 1-7) */}
          <div className="lg:col-span-7 p-4 space-y-3.5">
            {/* Category Filter Pills & Search */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="Search menu item (burger, wings, shake)..."
                    className="w-full h-8 pl-8 pr-3 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                {menuSearch && (
                  <button
                    onClick={() => setMenuSearch("")}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                    selectedCategory === "ALL"
                      ? "bg-amber-500 text-black border-amber-500 font-extrabold"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                      selectedCategory === cat.id
                        ? "bg-amber-500 text-black border-amber-500 font-extrabold"
                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {availableProducts.map((prod) => {
                const inCart = selectedItems.find((i) => i.product.id === prod.id);
                const imgSrc = prod.images && prod.images.length > 0 ? prod.images[0] : null;

                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddItem(prod)}
                    className={`text-left p-2 border transition-all flex items-center gap-2.5 cursor-pointer group relative ${
                      inCart
                        ? "bg-amber-500/10 border-amber-500/50 dark:border-amber-500/40"
                        : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/90 hover:border-amber-400 dark:hover:border-amber-500"
                    }`}
                  >
                    {/* Small Product Image on left */}
                    <div className="w-12 h-12 shrink-0 bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-zinc-400 opacity-40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-amber-500 transition-colors">
                        {prod.name}
                      </p>
                      
                      <div className="flex items-center gap-1 mt-0.5">
                        {prod.requiresKitchen === false ? (
                          <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1 py-0.2">
                            Direct Counter
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">
                            {prod.variants.length > 1 ? `${prod.variants.length} options` : prod.categoryName}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {formatNPR(prod.basePriceNpr)}
                        </span>
                        {inCart ? (
                          <span className="bg-amber-500 text-black font-mono font-black text-[10px] px-1 py-0.2">
                            x{inCart.quantity}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            + Add
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Order Builder Slip, Customer & Tender (Cols 8-12) */}
          {posMode === "ADD_TO_ONGOING" ? (
            <div className="lg:col-span-5 p-4 bg-zinc-50/50 dark:bg-[#121215] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* 1. Target Ongoing Order Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block">
                      1. Select Active Order / Tab
                    </span>
                    <span className="text-[10px] text-amber-500 font-bold">
                      {ongoingOrders.length} Open Tabs
                    </span>
                  </div>

                  {ongoingOrders.length === 0 ? (
                    <div className="p-3 border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300">
                      No active open orders currently. Please switch to "New Order" to create one.
                    </div>
                  ) : (
                    <select
                      value={targetOngoingOrder?.id || ""}
                      onChange={(e) => setSelectedOngoingOrderId(e.target.value)}
                      className="w-full h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold focus:outline-none focus:border-amber-500"
                    >
                      {ongoingOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.kioskToken || o.orderNumber} • {o.customerName} ({o.fulfillmentType}{o.tableNumber ? ` ${o.tableNumber}` : ""}) - {formatNPR(o.totalAmount)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Target Order Summary Card */}
                {targetOngoingOrder && (
                  <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                          {targetOngoingOrder.kioskToken || targetOngoingOrder.orderNumber}
                        </span>
                        <span className="text-zinc-400">•</span>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {targetOngoingOrder.customerName}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 uppercase">
                        {targetOngoingOrder.fulfillmentType} {targetOngoingOrder.tableNumber ? `• ${targetOngoingOrder.tableNumber}` : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <span>Existing: <strong>{targetOngoingOrder.items.length} items</strong></span>
                      <span>Total: <strong className="font-mono font-bold text-zinc-900 dark:text-white">{formatNPR(targetOngoingOrder.totalAmount)}</strong></span>
                      <span className="text-amber-500 font-bold">Round {(targetOngoingOrder.roundCount || 1) + 1} Batch</span>
                    </div>
                  </div>
                )}

                {/* 2. Staged Items for this Round */}
                {selectedItems.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block">
                        2. Staged Items to Add ({selectedItems.length})
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-zinc-200 dark:divide-zinc-800/80">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {item.product.name}
                              </p>
                              {item.product.requiresKitchen === false ? (
                                <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1 py-0.2 shrink-0">
                                  Direct Counter
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 shrink-0">
                                  Kitchen Prep
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {formatNPR(item.price)} each
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, -1)}
                              className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-mono font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, 1)}
                              className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="w-16 text-right font-mono font-bold text-zinc-900 dark:text-zinc-200">
                            {formatNPR(item.price * item.quantity)}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </div>

              {/* Bottom Dispatch Button */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Staged Round Value ({selectedItems.length} items):</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    +{formatNPR(orderSubtotal)}
                  </span>
                </div>

                {targetOngoingOrder && (
                  <div className="flex items-center justify-between text-sm pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <span className="font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                      Updated Tab Total:
                    </span>
                    <span className="font-mono text-lg font-black text-amber-600 dark:text-amber-400">
                      {formatNPR(targetOngoingOrder.totalAmount + orderSubtotal)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPosMode("NEW_ORDER");
                      setSelectedItems([]);
                    }}
                    className="h-11 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleAddItemsToOngoingOrder}
                    disabled={selectedItems.length === 0 || !targetOngoingOrder}
                    className="h-11 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Round to Tab</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-5 p-4 bg-zinc-50/50 dark:bg-[#121215] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Dining Mode Selector (Takeaway, Dine-In, Delivery) */}
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block mb-1">
                    1. Order Fulfillment Mode
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType("TAKEAWAY")}
                      className={`py-1.5 px-2 text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        fulfillmentType === "TAKEAWAY"
                          ? "bg-sky-500 text-black border-sky-500 font-extrabold"
                          : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Takeaway</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFulfillmentType("DINE_IN")}
                      className={`py-1.5 px-2 text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        fulfillmentType === "DINE_IN"
                          ? "bg-amber-500 text-black border-amber-500 font-extrabold"
                          : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Dine-In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFulfillmentType("DELIVERY")}
                      className={`py-1.5 px-2 text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        fulfillmentType === "DELIVERY"
                          ? "bg-emerald-500 text-black border-emerald-500 font-extrabold"
                          : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Delivery</span>
                    </button>
                  </div>
                </div>

                {/* Customer Phone & Name */}
                <div className="space-y-1.5">
                  <div className={`grid ${fulfillmentType === "DINE_IN" ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Walk-in Guest"
                        className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold block mb-0.5 flex items-center justify-between">
                        <span className={hasCreditMethod ? "text-rose-400 font-black animate-pulse" : "text-zinc-400"}>
                          Mobile No {hasCreditMethod ? "(COMPULSORY)*" : "(Khata / Loyalty)"}
                        </span>
                      </label>
                      <input
                        id="pos-customer-phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="98XXXXXXXX"
                        className={`w-full h-8 px-2 text-xs font-mono bg-zinc-900 border focus:outline-none ${
                          hasCreditMethod && (!customerPhone.trim() || customerPhone.trim().replace(/\D/g, "").length < 10)
                            ? "border-rose-500 text-rose-300 ring-1 ring-rose-500 font-bold"
                            : "border-zinc-800 text-zinc-100 focus:border-amber-500"
                        }`}
                      />
                    </div>

                    {fulfillmentType === "DINE_IN" && (
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                          Table #
                        </label>
                        <select
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                        >
                          {Array.from({ length: 16 }, (_, i) => `T-${String(i + 1).padStart(2, "0")}`).map(
                            (t) => (
                              <option key={t} value={t}>
                                {t} (Dining Table)
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Compulsory phone warning for Khata Credit */}
                  {hasCreditMethod && (!customerPhone.trim() || customerPhone.trim().replace(/\D/g, "").length < 10) && (
                    <div className="p-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Customer Mobile Number (10 digits) is compulsory to record Credit Sale (Khata).</span>
                    </div>
                  )}
                </div>

                {/* Loyalty Recognized Banner */}
                {loyaltyInfo && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5 text-zinc-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          Customer: <strong className="text-amber-400">{loyaltyInfo.name}</strong> (Visit #{loyaltyInfo.visitCount + 1})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {loyaltyInfo.loyaltyPoints} pts • Spent: {formatNPR(loyaltyInfo.totalSpent)}
                      </span>
                    </div>

                    {loyaltyOffer ? (
                      <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-[11px]">
                        <div className="truncate pr-2">
                          <span className="font-black text-emerald-400">🎉 Visit Offer: </span>
                          <span className="text-zinc-300 font-medium">{loyaltyOffer.rule.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOrderDiscountAmount(loyaltyOffer.discountAmount);
                            setAppliedLoyaltyOfferName(loyaltyOffer.rule.name);
                            addToast({
                              title: "Visit Loyalty Reward Applied",
                              description: `${loyaltyOffer.summaryText} applied to current order.`,
                              type: "success",
                            });
                          }}
                          className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-wider shrink-0 cursor-pointer shadow-sm"
                        >
                          Apply {loyaltyOffer.summaryText}
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-400 pt-0.5 border-t border-zinc-800 flex items-center justify-between">
                        <span>Current bill {formatNPR(orderSubtotal)} has no matching rule for Visit #{loyaltyInfo.visitCount + 1}.</span>
                        {orderDiscountAmount > 0 && (
                          <span className="text-emerald-400 font-bold font-mono">Manual Disc: -{formatNPR(orderDiscountAmount)}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Items Table in Cart */}
                {selectedItems.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block">
                      2. Selected Items ({selectedItems.length})
                    </span>

                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 divide-y divide-zinc-200 dark:divide-zinc-800/80">
                      {selectedItems.map((item, idx) => (
                        <div key={idx} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              {formatNPR(item.price)} each
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, -1)}
                              className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-mono font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemQty(idx, 1)}
                              className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="w-16 text-right font-mono font-bold text-zinc-900 dark:text-zinc-200">
                            {formatNPR(item.price * item.quantity)}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kitchen Note */}
                <div>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Special notes"
                    className="w-full h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Payment Method & Status */}
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      Tender / Settlement
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newMode = !isSplitMode;
                        setIsSplitMode(newMode);
                        if (newMode) {
                          const half = Math.round(orderTotal / 2);
                          setPosSplits([
                            { method: "CASH_ON_PICKUP", amount: half },
                            { method: "CREDIT", amount: orderTotal - half },
                          ]);
                        }
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 border flex items-center gap-1 cursor-pointer transition-colors ${
                        isSplitMode
                          ? "bg-amber-500 text-black border-amber-500"
                          : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      <span>⚡ Split Tender (Part Cash / Khata)</span>
                    </button>
                  </div>

                  {!isSplitMode ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => {
                            const val = e.target.value as PaymentMethod;
                            setPaymentMethod(val);
                            if (val === "CREDIT") {
                              setPaymentStatus("UNPAID");
                            }
                          }}
                          className={`w-full h-8 px-2 text-xs bg-zinc-900 border text-zinc-100 font-bold focus:outline-none ${
                            paymentMethod === "CREDIT"
                              ? "border-amber-500 text-amber-400"
                              : "border-zinc-800 focus:border-amber-500"
                          }`}
                        >
                          <option value="CASH_ON_PICKUP">💵 Cash Tender</option>
                          <option value="FONEPAY_QR">📱 FonePay QR</option>
                          <option value="ESEWA">🟢 eSewa Digital</option>
                          <option value="CARD">💳 POS Card Machine</option>
                          <option value="CREDIT">📒 Credit Sale (Khata / उधारो)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                          Settlement Status
                        </label>
                        <select
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value as "PAID" | "UNPAID")}
                          disabled={paymentMethod === "CREDIT"}
                          className="w-full h-8 px-2 text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 font-bold focus:outline-none focus:border-amber-500 disabled:opacity-50"
                        >
                          {paymentMethod === "CREDIT" ? (
                            <option value="UNPAID">📒 Khata Balance (Due)</option>
                          ) : (
                            <>
                              <option value="PAID">✅ Paid at Counter</option>
                              <option value="UNPAID">⏳ Unpaid (Pay on Exit / Table)</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  ) : (
                    /* Split Tender Workbench (e.g. Part Cash & Part Credit Khata) */
                    <div className="p-2 bg-zinc-900/90 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-zinc-300">Split Payment Allocation:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const half = Math.round(orderTotal / 2);
                              setPosSplits([
                                { method: "CASH_ON_PICKUP", amount: half },
                                { method: "CREDIT", amount: orderTotal - half },
                              ]);
                            }}
                            className="px-1.5 py-0.5 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-mono"
                          >
                            50/50 Cash & Khata
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const alloc = posSplits[0]?.amount || 0;
                              setPosSplits([
                                posSplits[0] || { method: "CASH_ON_PICKUP", amount: 0 },
                                { method: "CREDIT", amount: Math.max(0, orderTotal - alloc) },
                              ]);
                            }}
                            className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-mono font-bold"
                          >
                            Auto Balance
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {posSplits.map((split, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <select
                              value={split.method}
                              onChange={(e) => {
                                const newSplits = [...posSplits];
                                newSplits[idx].method = e.target.value as PaymentMethod;
                                setPosSplits(newSplits);
                              }}
                              className="w-1/2 h-7 px-1.5 text-xs bg-zinc-950 border border-zinc-700 text-zinc-200 font-bold focus:outline-none"
                            >
                              <option value="CASH_ON_PICKUP">💵 Cash</option>
                              <option value="FONEPAY_QR">📱 FonePay QR</option>
                              <option value="ESEWA">🟢 eSewa</option>
                              <option value="CARD">💳 POS Card</option>
                              <option value="CREDIT">📒 Credit (Khata)</option>
                            </select>

                            <div className="flex-1 relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono">
                                Rs.
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={orderTotal}
                                value={split.amount || ""}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  const newSplits = [...posSplits];
                                  newSplits[idx].amount = val;
                                  setPosSplits(newSplits);
                                }}
                                placeholder="0"
                                className="w-full h-7 pl-7 pr-2 text-xs font-mono font-bold bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            {posSplits.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPosSplits(posSplits.filter((_, i) => i !== idx));
                                }}
                                className="p-1 text-zinc-500 hover:text-rose-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {posSplits.length < 3 && (
                        <button
                          type="button"
                          onClick={() => {
                            const alloc = posSplits.reduce((a, b) => a + b.amount, 0);
                            const rem = Math.max(0, orderTotal - alloc);
                            setPosSplits([...posSplits, { method: "CREDIT", amount: rem }]);
                          }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Another Split Tender
                        </button>
                      )}

                      {/* Split Balance Tracker */}
                      {(() => {
                        const totalAllocated = posSplits.reduce((acc, s) => acc + s.amount, 0);
                        const diff = orderTotal - totalAllocated;
                        const isBalanced = Math.abs(diff) < 0.01;
                        return (
                          <div
                            className={`p-1.5 text-[11px] font-mono flex items-center justify-between border ${
                              isBalanced
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold"
                            }`}
                          >
                            <span>Allocated: {formatNPR(totalAllocated)} / {formatNPR(orderTotal)}</span>
                            <span>{isBalanced ? "✅ Perfectly Balanced" : `⚠️ Remaining: ${formatNPR(diff)}`}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Khata / Credit Info Note */}
                  {hasCreditMethod && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Recorded in <strong>Customer Khata Ledger</strong>. Linked to mobile:{" "}
                        <strong className="font-mono text-white">
                          {customerPhone.trim() || "(Phone required)"}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill Total & Create Action Button */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Subtotal ({selectedItems.length} items):</span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    {formatNPR(orderSubtotal)}
                  </span>
                </div>

                {orderDiscountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                    <span>Discount Deducted:</span>
                    <span className="font-mono font-bold">-{formatNPR(orderDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <span className="font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                    Total Payable:
                  </span>
                  <span className="font-mono text-lg font-black text-amber-600 dark:text-amber-400">
                    {formatNPR(orderTotal)}
                  </span>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={selectedItems.length === 0}
                  className="w-full h-11 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
                >
                  <Flame className="w-4 h-4" />
                  <span>FIRE ORDER TO KITCHEN KDS & PRINT TOKEN</span>
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          BOTTOM SECTION: ORDERS DATATABLE WITH PAGINATION, FILTERS & STATISTICS
      ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3.5 p-4">
        {/* TOP FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 pb-2.5 border-b border-zinc-200 dark:border-zinc-800 items-end">
          {/* Start Date */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* End Date */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* Order Channel / Type */}
          <div className="lg:col-span-3">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
              Order Channel / Type
            </label>
            <select
              value={orderTypeFilter}
              onChange={(e) => {
                setOrderTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Channels (Dine-In, Takeaway, Online)</option>
              <option value="ONLINE_DELIVERY">🛵 Online & Delivery</option>
              <option value="TAKEAWAY">🛍️ Takeaway & Drive-Thru</option>
              <option value="DINE_IN">🍽️ Dine-In Tables</option>
            </select>
          </div>

          {/* Settlement */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
              Settlement
            </label>
            <select
              value={settlementFilter}
              onChange={(e) => {
                setSettlementFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-8 px-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Bills</option>
              <option value="PAID">✅ Paid / Settled</option>
              <option value="UNPAID">⏳ Unsettled / Open</option>
              <option value="CREDIT">📒 Credit Sale (Khata)</option>
            </select>
          </div>

          {/* Datatable Search */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
              Datatable Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={tableSearchQuery}
                onChange={(e) => {
                  setTableSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Token, #CR, item, phone..."
                className="w-full h-8 pl-7 pr-6 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 font-mono"
              />
              {tableSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setTableSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Page Size */}
          <div className="lg:col-span-1">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">
              Page
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full h-8 px-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer text-center"
              title="Rows per page"
            >
              <option value={10}>10/p</option>
              <option value={20}>20/p</option>
              <option value={50}>50/p</option>
            </select>
          </div>
        </div>

        {/* INLINE STATS & CASH BREAKDOWN (Single row, clean text & values with gaps, no cards or boxes) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 py-1 font-medium overflow-x-auto no-scrollbar">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">Orders:</span>
            <strong className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{datatableStats.orderCount}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">Gross:</span>
            <strong className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{formatNPR(datatableStats.grossSubtotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">Discount:</span>
            <strong className="font-mono text-rose-600 dark:text-rose-400 font-bold">
              {datatableStats.totalDiscounts > 0 ? `-${formatNPR(datatableStats.totalDiscounts)}` : "Rs. 0"}
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">Final:</span>
            <strong className="font-mono text-amber-600 dark:text-amber-400 font-bold">{formatNPR(datatableStats.netFinal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">Paid:</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatNPR(datatableStats.totalPaid)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">Unpaid:</span>
            <strong className="font-mono text-amber-600 dark:text-amber-400 font-bold">{formatNPR(datatableStats.totalUnpaid)}</strong>
          </span>

          <span className="text-zinc-300 dark:text-zinc-700 select-none">|</span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">Cash:</span>
            <strong className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{formatNPR(datatableStats.cashTotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">FonePay:</span>
            <strong className="font-mono text-rose-500 font-bold">{formatNPR(datatableStats.qrFonepayTotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">eSewa:</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatNPR(datatableStats.esewaTotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">Card:</span>
            <strong className="font-mono text-sky-600 dark:text-sky-400 font-bold">{formatNPR(datatableStats.cardTotal)}</strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-amber-400">📒 Khata Credit:</span>
            <strong className="font-mono text-amber-400 font-bold">
              {formatNPR(datatableStats.creditTotal)} ({datatableStats.creditCount})
            </strong>
          </span>

          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-zinc-400">Void/Refund:</span>
            <strong className="font-mono text-rose-500 font-bold">{formatNPR(datatableStats.refundVoidTotal)}</strong>
          </span>
        </div>

        {/* STATUS FILTER TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1 text-xs font-bold">
          {(
            [
              { key: "ALL", label: "All Orders", count: orders.length },
              { key: "CONFIRMED", label: "Incoming New", count: orders.filter((o) => o.status === "CONFIRMED").length },
              { key: "PROCESSING", label: "Kitchen Cooking", count: orders.filter((o) => o.status === "PROCESSING").length },
              { key: "READY", label: "Ready for Pickup", count: orders.filter((o) => o.status === "READY").length },
              { key: "COMPLETED", label: "Completed / Dispatched", count: orders.filter((o) => o.status === "COMPLETED").length },
              { key: "CANCELLED", label: "Cancelled", count: orders.filter((o) => o.status === "CANCELLED").length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? "bg-amber-500 text-black border-amber-500 font-black"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] px-1 bg-black/10 dark:bg-white/10">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* REFINED DATATABLE */}
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-100 dark:bg-zinc-900/90 text-zinc-500 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-2 text-center w-10">S.N.</th>
                <th className="p-2.5">Token</th>
                <th className="p-2.5">Order</th>
                <th className="p-2.5">Customer & Channel</th>
                <th className="p-2.5">Items</th>
                <th className="p-2.5 text-right font-black text-zinc-800 dark:text-zinc-200">Amount</th>
                <th className="p-2.5 text-center">Billing & Payment</th>
                <th className="p-2.5 text-center">Refund</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 font-medium">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, idx) => {
                  const isReady = order.status === "READY";
                  const isProcessing = order.status === "PROCESSING";
                  const isConfirmed = order.status === "CONFIRMED";
                  const isCompleted = order.status === "COMPLETED";
                  const isCancelled = order.status === "CANCELLED";

                  const serialNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isBilledOrPaid = order.paymentStatus === "PAID" || order.isBilled;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      {/* S.N. */}
                      <td className="p-2 text-center font-mono text-[11px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        {String(serialNumber).padStart(2, "0")}
                      </td>

                      {/* Token Slip */}
                      <td className="p-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black px-1.5 py-0.5 bg-amber-500 text-black">
                            {order.kioskToken || order.orderNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPrintSlipOrder(order)}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                            title="Print Token Slip / Kitchen Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Order Info & Time */}
                      <td className="p-2.5 whitespace-nowrap">
                        <p className="font-mono font-bold text-zinc-900 dark:text-white">
                          #{order.orderNumber}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{order.createdAt.split("T")[1]?.slice(0, 5) || "Now"}</span>
                          <span>• {formatTimer(order.elapsedSeconds)}</span>
                        </div>
                      </td>

                      {/* Customer & Channel */}
                      <td className="p-2.5 min-w-[130px]">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                          {order.customerName}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`text-[9px] font-black uppercase px-1 py-0.2 border ${
                              order.fulfillmentType === "DINE_IN"
                                ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                                : order.fulfillmentType === "DELIVERY"
                                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                                : "bg-sky-500/15 text-sky-500 border-sky-500/30"
                            }`}
                          >
                            {order.fulfillmentType === "DINE_IN"
                              ? `🍽️ ${order.tableNumber || "Table"}`
                              : order.fulfillmentType === "DELIVERY"
                              ? "🛵 Online"
                              : "🛍️ Takeaway"}
                          </span>
                          {order.customerPhone && (
                            <span className="font-mono text-[9px] text-zinc-400">
                              {order.customerPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="p-2.5 max-w-[180px]">
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 line-clamp-1">
                          {order.items?.map((i) => `${i.quantity}x ${i.productName}`)?.join(", ") || "No items"}
                        </p>
                        {order.notes && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold truncate mt-0.5">
                            Note: "{order.notes}"
                          </p>
                        )}
                      </td>

                      {/* Total, Discount & Final Amount in same column */}
                      <td className="p-2.5 whitespace-nowrap text-right font-mono">
                        <div className="font-black text-amber-600 dark:text-amber-400 text-xs">
                          {formatNPR(order.totalAmount)}
                        </div>
                        {order.discountAmount && order.discountAmount > 0 ? (
                          <div className="text-[10px] flex items-center justify-end gap-1 mt-0.5">
                            <span className="line-through text-zinc-400">
                              {formatNPR(order.subtotal || order.totalAmount + order.discountAmount)}
                            </span>
                            <span
                              className="text-rose-600 dark:text-rose-400 font-bold"
                              title={order.discountReason || "Discount"}
                            >
                              -{formatNPR(order.discountAmount)}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            Total: {formatNPR(order.subtotal || order.totalAmount)}
                          </div>
                        )}
                      </td>

                      {/* Billing Status, Payment Method & Paid Amount in same column */}
                      <td className="p-2.5 whitespace-nowrap text-center">
                        {(() => {
                          const isCreditOrder =
                            order.paymentMethod === "CREDIT" ||
                            (order.splitPayments && order.splitPayments.some((s) => s.method === "CREDIT" && s.amount > 0));
                          const creditAmt =
                            order.splitPayments?.find((s) => s.method === "CREDIT")?.amount ?? order.totalAmount;
                          const paidPortion =
                            order.splitPayments
                              ? order.splitPayments.filter((s) => s.method !== "CREDIT").reduce((a, b) => a + b.amount, 0)
                              : (order.paymentMethod !== "CREDIT" && isBilledOrPaid ? order.totalAmount : 0);

                          if (isCreditOrder) {
                            return (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                  <BookOpen className="w-2.5 h-2.5 text-amber-400" />
                                  {order.splitPayments && order.splitPayments.length > 1 ? "Split Khata" : "Khata Credit"}
                                </span>
                                <span className="font-mono text-[10px] font-bold text-amber-400">
                                  Due: {formatNPR(creditAmt)}
                                </span>
                                {paidPortion > 0 && (
                                  <span className="font-mono text-[9px] text-emerald-400">
                                    Paid: {formatNPR(paidPortion)}
                                  </span>
                                )}
                              </div>
                            );
                          }

                          if (isBilledOrPaid) {
                            return (
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Paid • {
                                    order.paymentMethod === "CASH_ON_PICKUP" || order.paymentMethod === "CASH_ON_DELIVERY"
                                      ? "Cash"
                                      : order.paymentMethod === "FONEPAY_QR"
                                      ? "FonePay"
                                      : order.paymentMethod === "ESEWA"
                                      ? "eSewa"
                                      : order.paymentMethod === "CARD"
                                      ? "Card"
                                      : order.paymentMethod
                                      ? order.paymentMethod.replace(/_/g, " ")
                                      : "Cash"
                                  }
                                </span>
                                <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  Paid: {formatNPR(order.totalAmount)}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                Unpaid
                              </span>
                              <span className="font-mono text-[10px] text-zinc-400">
                                Due: {formatNPR(order.totalAmount)}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Refund / Void Status (Minimal text) */}
                      <td className="p-2.5 whitespace-nowrap text-center">
                        {order.refundStatus === "REFUNDED" ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/30">
                            Refunded
                          </span>
                        ) : order.refundStatus === "VOIDED" || order.status === "CANCELLED" ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20">
                            Voided
                          </span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Current Status */}
                      <td className="p-2.5 whitespace-nowrap text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase border ${
                            isReady
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                              : isProcessing
                              ? "bg-sky-500/20 text-sky-400 border-sky-500/50"
                              : isConfirmed
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                              : isCompleted
                              ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                              : "bg-rose-500/20 text-rose-400 border-rose-500/50"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Quick Status Update & Actions */}
                      <td className="p-2.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Add Items to Ongoing Order Tab */}
                          {!isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleStartAddingItemsToOrder(order)}
                              className="px-2 py-1 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center gap-1 transition-colors"
                              title="Add more items (drinks, food, snacks) to this active tab"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          )}

                          {/* 1-Click Bump Status Button */}
                          {!isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleQuickBumpStatus(order)}
                              className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                                isConfirmed
                                  ? "bg-amber-500 hover:bg-amber-400 text-black"
                                  : isProcessing
                                  ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                              }`}
                            >
                              {isConfirmed && (
                                <>
                                  <Flame className="w-3 h-3" />
                                  <span>Cook</span>
                                </>
                              )}
                              {isProcessing && (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Ready</span>
                                </>
                              )}
                              {isReady && (
                                <>
                                  <Package className="w-3 h-3 text-emerald-400" />
                                  <span>Hand Over</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Direct Status Changer Dropdown */}
                          <select
                            value={order.status}
                            onChange={(e) => {
                              updateOrderStatus(order.id, e.target.value as OrderStatus);
                              addToast({
                                title: "Status Updated",
                                description: `Order #${order.orderNumber} changed to ${e.target.value}`,
                                type: "info",
                              });
                            }}
                            className="h-7 px-1.5 text-[11px] font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                          >
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PROCESSING">In Kitchen</option>
                            <option value="READY">Ready</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>

                          {/* Settle Bill Button (Enabled even when completed if not billed) */}
                          {(!order.isBilled || order.paymentStatus !== "PAID") && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenBillingForOrder) {
                                  onOpenBillingForOrder(order);
                                } else {
                                  markOrderBilled(order.id, order.paymentMethod);
                                  addToast({
                                    title: "Order Billed & Settled",
                                    description: `Order #${order.orderNumber} marked as settled (${formatNPR(order.totalAmount)})`,
                                    type: "success",
                                  });
                                }
                              }}
                              className={`px-2.5 py-1 text-xs font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                                isCompleted
                                  ? "bg-amber-500 hover:bg-amber-400 text-black border-amber-500 font-black shadow-sm"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-amber-500/40 hover:text-white"
                              }`}
                              title={isCompleted ? "Order completed! Click to settle bill" : "Settle Bill"}
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Bill</span>
                            </button>
                          )}

                          {/* Kitchen Call / Ring Pickup Bell */}
                          <button
                            type="button"
                            onClick={() =>
                              triggerKitchenCall({
                                orderNumber: order.orderNumber,
                                kioskToken: order.kioskToken,
                                customerName: order.customerName,
                                fulfillmentType: order.fulfillmentType,
                                tableNumber: order.tableNumber,
                              })
                            }
                            className="p-1 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-500 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 rounded cursor-pointer transition-colors"
                            title="Ring Bell & Announce on TV Screen"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>

                          {/* View Details Drawer */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDrawer(order)}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                            title="View Full Order Drawer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-zinc-500">
          <div>
            Showing{" "}
            <strong className="text-zinc-900 dark:text-white">
              {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-zinc-900 dark:text-white">
              {Math.min(currentPage * pageSize, filteredOrders.length)}
            </strong>{" "}
            of <strong className="text-zinc-900 dark:text-white">{filteredOrders.length}</strong> orders
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 font-bold"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
              // Only show nearby pages if many
              if (totalPages > 6 && Math.abs(pg - currentPage) > 2 && pg !== 1 && pg !== totalPages) {
                return null;
              }
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => handlePageChange(pg)}
                  className={`w-7 h-7 text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    currentPage === pg
                      ? "bg-amber-500 text-black border-amber-500"
                      : "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {pg}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1 font-bold"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          ORDER DETAILS DRAWER
      ------------------------------------------------------------- */}
      <Drawer
        isOpen={!!selectedOrderForDrawer}
        onClose={() => setSelectedOrderForDrawer(null)}
        title={`Order Details #${selectedOrderForDrawer?.orderNumber || ""}`}
        position="right"
      >
        {selectedOrderForDrawer && (
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-black text-amber-500">
                  {selectedOrderForDrawer.kioskToken || selectedOrderForDrawer.orderNumber}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  #{selectedOrderForDrawer.orderNumber}
                </span>
              </div>
              <p className="font-bold text-zinc-900 dark:text-white">
                Customer: {selectedOrderForDrawer.customerName} ({selectedOrderForDrawer.customerPhone})
              </p>
              <p className="text-zinc-500">
                Type: {selectedOrderForDrawer.fulfillmentType} • Table: {selectedOrderForDrawer.tableNumber || "N/A"}
              </p>
            </div>

            {/* Items list with Kitchen vs Direct Counter distinction */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                  Item Breakdown ({selectedOrderForDrawer.items.length})
                </h4>
                <span className="text-[10px] text-zinc-400">
                  Kitchen items locked once fired
                </span>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 p-2 space-y-1 bg-white dark:bg-zinc-900/50">
                {selectedOrderForDrawer.items.map((it, idx) => {
                  const isDirect = it.requiresKitchen === false;
                  return (
                    <div key={idx} className="pt-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-zinc-900 dark:text-white truncate">
                            {it.quantity}x {it.productName}
                          </p>
                          {isDirect ? (
                            <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1 py-0.2 shrink-0">
                              Direct Counter
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 shrink-0 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Kitchen
                            </span>
                          )}
                        </div>
                        {it.variantName && (
                          <p className="text-[10px] text-zinc-500">{it.variantName}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-500 text-xs">
                          {formatNPR(it.lineTotal)}
                        </span>

                        {/* Removal button for ongoing orders */}
                        {selectedOrderForDrawer.status !== "COMPLETED" && selectedOrderForDrawer.status !== "CANCELLED" && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = removeItemFromRunningOrder(selectedOrderForDrawer.id, it.productId);
                              if (res.success) {
                                addToast({
                                  title: "Item Removed",
                                  description: res.message,
                                  type: "success",
                                });
                                // Keep drawer in sync
                                const updated = orders.find((o) => o.id === selectedOrderForDrawer.id);
                                if (updated) setSelectedOrderForDrawer(updated);
                              } else {
                                addToast({
                                  title: "Removal Blocked",
                                  description: res.message,
                                  type: "error",
                                });
                              }
                            }}
                            className={`p-1 transition-colors cursor-pointer ${
                              isDirect
                                ? "text-zinc-400 hover:text-rose-500"
                                : "text-zinc-300 dark:text-zinc-600 hover:text-rose-400"
                            }`}
                            title={
                              isDirect
                                ? "Remove direct counter item from tab"
                                : "Item already sent to kitchen. Cannot be removed from counter POS without kitchen void."
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment & Status Summary */}
            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Subtotal:</span>
                <span className="font-mono font-bold">
                  {formatNPR(selectedOrderForDrawer.subtotal)}
                </span>
              </div>
              {selectedOrderForDrawer.discountAmount ? (
                <div className="flex items-center justify-between text-amber-500">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">
                    -{formatNPR(selectedOrderForDrawer.discountAmount)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between font-bold text-sm pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span>Total Amount:</span>
                <span className="font-mono text-amber-500 font-black">
                  {formatNPR(selectedOrderForDrawer.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500">Settlement Status:</span>
                {selectedOrderForDrawer.isBilled || selectedOrderForDrawer.paymentStatus === "PAID" ? (
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Fully Settled & Paid
                  </span>
                ) : (
                  <span className="font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/30">
                    Open / Unbilled Tab
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {/* Settle Bill Action (Crucial for unbilled or completed-unbilled orders) */}
              {(!selectedOrderForDrawer.isBilled || selectedOrderForDrawer.paymentStatus !== "PAID") && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenBillingForOrder) {
                      onOpenBillingForOrder(selectedOrderForDrawer);
                    } else {
                      markOrderBilled(selectedOrderForDrawer.id, selectedOrderForDrawer.paymentMethod);
                      addToast({
                        title: "Bill Settled Successfully",
                        description: `Order #${selectedOrderForDrawer.orderNumber} marked as paid (${formatNPR(selectedOrderForDrawer.totalAmount)})`,
                        type: "success",
                      });
                    }
                    setSelectedOrderForDrawer(null);
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Settle & Mark Billed ({formatNPR(selectedOrderForDrawer.totalAmount)})</span>
                </button>
              )}

              {/* Add more items to ongoing tab */}
              {selectedOrderForDrawer.status !== "COMPLETED" && selectedOrderForDrawer.status !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => {
                    handleStartAddingItemsToOrder(selectedOrderForDrawer);
                    setSelectedOrderForDrawer(null);
                  }}
                  className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-900 dark:text-zinc-100 font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More Items to Active Tab</span>
                </button>
              )}

              {/* Kitchen Call / Ring Bell Button */}
              <button
                type="button"
                onClick={() =>
                  triggerKitchenCall({
                    orderNumber: selectedOrderForDrawer.orderNumber,
                    kioskToken: selectedOrderForDrawer.kioskToken,
                    customerName: selectedOrderForDrawer.customerName,
                    fulfillmentType: selectedOrderForDrawer.fulfillmentType,
                    tableNumber: selectedOrderForDrawer.tableNumber,
                  })
                }
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 cursor-pointer transition-colors"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Call Customer to Counter (Ring Bell & TV Announcement)</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintSlipOrder(selectedOrderForDrawer)}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-zinc-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Thermal Slip
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* -------------------------------------------------------------
          THERMAL RECEIPT / SLIP PRINT MODAL
      ------------------------------------------------------------- */}
      {printSlipOrder && (
        <Modal
          isOpen={!!printSlipOrder}
          onClose={() => setPrintSlipOrder(null)}
          title="Thermal Order Slip Preview"
          size="sm"
        >
          <div className="p-4 bg-white text-black font-mono text-xs space-y-3 border border-zinc-300 max-w-sm mx-auto shadow-lg">
            <div className="text-center space-y-0.5 border-b border-dashed border-zinc-400 pb-3">
              <h3 className="font-black text-base uppercase tracking-widest">CRUNCHY FOODS</h3>
              <p className="text-[10px] text-zinc-600">{currentOutlet.name}</p>
              <p className="text-[10px] text-zinc-600">Kathmandu, Nepal • PAN: 609823145</p>
              <div className="mt-2 py-1 bg-black text-white font-black text-xl tracking-widest">
                {printSlipOrder.kioskToken || printSlipOrder.orderNumber}
              </div>
            </div>

            <div className="flex justify-between text-[11px] border-b border-zinc-300 pb-2">
              <span>Order: #{printSlipOrder.orderNumber}</span>
              <span>{printSlipOrder.createdAt.split("T")[0]}</span>
            </div>

            <div className="text-[11px] space-y-0.5">
              <p>Customer: {printSlipOrder.customerName}</p>
              <p>Type: {printSlipOrder.fulfillmentType} {printSlipOrder.tableNumber ? `(${printSlipOrder.tableNumber})` : ""}</p>
              {printSlipOrder.customerPhone && <p>Phone: {printSlipOrder.customerPhone}</p>}
            </div>

            <div className="border-t border-b border-dashed border-zinc-400 py-2 space-y-1">
              {printSlipOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{it.quantity}x {it.productName}</span>
                  <span>{formatNPR(it.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatNPR(printSlipOrder.subtotal)}</span>
              </div>
              {printSlipOrder.discountAmount ? (
                <div className="flex justify-between text-zinc-600">
                  <span>Discount:</span>
                  <span>-{formatNPR(printSlipOrder.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                <span>TOTAL:</span>
                <span>{formatNPR(printSlipOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[10px] text-zinc-500 border-t border-dashed border-zinc-300">
              <p>Thank you for choosing Crunchy!</p>
              <p>Show token slip at pick-up counter.</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print?.();
                  addToast({
                    title: "Slip Sent to Thermal Printer",
                    description: `Token ${printSlipOrder.kioskToken || printSlipOrder.orderNumber} queued.`,
                    type: "success",
                  });
                  setPrintSlipOrder(null);
                }}
                className="w-full py-2 bg-black text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Print Slip
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
