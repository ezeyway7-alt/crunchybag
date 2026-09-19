import React, { useState } from "react";
import {
  ShoppingBag,
  Clock,
  Phone,
  User,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Check,
  ShieldCheck,
  Lock,
  Loader2,
  Bike,
  Car,
  UtensilsCrossed,
  MapPin,
  Plus,
  Compass,
  AlertCircle,
  Eye,
  Heart,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { formatNPR } from "../../lib/utils";
import { FulfillmentType, PaymentMethod } from "../../types";
import { DeliveryLocationModal } from "./DeliveryLocationModal";
import { OrderItemsPreviewModal } from "./OrderItemsPreviewModal";

interface TakeawayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const TakeawayCheckoutModal: React.FC<TakeawayCheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { cart, currentOutlet, placeTakeawayOrder, customerProfile } = useApp();

  // 1. By default, DELIVERY is selected as requested!
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentType>("DELIVERY");

  // Contact info
  const [name, setName] = useState(customerProfile.name || "Aayush Shrestha");
  const [phone, setPhone] = useState(customerProfile.phone || "+977 9841-882299");
  const [notes, setNotes] = useState("");

  // Delivery address & location state
  const [deliveryAddress, setDeliveryAddress] = useState(
    customerProfile.address || "House #14, Lazimpat, Kathmandu, Nepal"
  );
  const [deliveryLocation, setDeliveryLocation] = useState<{
    lat: number;
    lng: number;
    landmark?: string;
  }>({
    lat: 27.7125,
    lng: 85.3175,
    landmark: "Near Standard Chartered Bank",
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isPreviewItemsOpen, setIsPreviewItemsOpen] = useState(false);

  // Fulfillment specific fields
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  // Payment method (eSewa Integration only)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ESEWA");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync payment method when switching fulfillment
  const handleFulfillmentChange = (type: FulfillmentType) => {
    setSelectedFulfillment(type);
    setPaymentMethod("ESEWA");
  };

  const handleSaveLocation = (
    newAddress: string,
    location?: { lat: number; lng: number; landmark?: string }
  ) => {
    setDeliveryAddress(newAddress);
    if (location) {
      setDeliveryLocation(location);
    }
  };

  const grandPayableTotal = cart.finalTotal + tipAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide your name for the order.");
      return;
    }
    if (!phone.trim()) {
      setError("Contact phone number is required for SMS receipt and delivery dispatch.");
      return;
    }
    if (selectedFulfillment === "DELIVERY" && !deliveryAddress.trim()) {
      setError("Please provide a delivery address or pin your location on the map.");
      return;
    }

    // Idempotent lock simulation
    setIsSubmitting(true);
    setError(null);

    // Build extra notes for Drive-thru or Dine-in or Tip if present
    let finalNotes = notes.trim();
    if (tipAmount > 0) {
      finalNotes = finalNotes
        ? `[Rider Tip: NPR ${tipAmount}] ${finalNotes}`
        : `[Rider Tip: NPR ${tipAmount}]`;
    }
    if (selectedFulfillment === "DRIVE_THRU" && vehicleInfo.trim()) {
      finalNotes = finalNotes
        ? `[Vehicle: ${vehicleInfo.trim()}] - ${finalNotes}`
        : `[Vehicle: ${vehicleInfo.trim()}]`;
    } else if (selectedFulfillment === "DINE_IN" && tableNumber.trim()) {
      finalNotes = finalNotes
        ? `[Table: ${tableNumber.trim()}] - ${finalNotes}`
        : `[Table: ${tableNumber.trim()}]`;
    }

    setTimeout(() => {
      const order = placeTakeawayOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        fulfillmentType: selectedFulfillment,
        paymentMethod,
        notes: finalNotes || undefined,
        deliveryAddress: selectedFulfillment === "DELIVERY" ? deliveryAddress : undefined,
        deliveryLocation: selectedFulfillment === "DELIVERY" ? deliveryLocation : undefined,
      });
      setIsSubmitting(false);
      onClose();
      onOrderSuccess(order.id);
    }, 850);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => !isSubmitting && onClose()}
        title={
          <div className="flex items-center gap-2">
            <span className="font-black text-xs sm:text-sm uppercase tracking-tight">Order Checkout</span>
            <span className="text-[9px] font-mono font-bold bg-amber-500 text-black px-1.5 py-0.2 border border-black">
              {cart.items.reduce((s, it) => s + it.quantity, 0)} items
            </span>
          </div>
        }
        maxWidth="lg"
        showCloseButton={!isSubmitting}
        headerClassName="px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0"
        className="h-[90vh] max-h-[660px] flex flex-col overflow-hidden rounded-none"
        contentClassName="p-0 flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          {/* Scrollable Form Body - Maximized Height */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2 sm:py-2.5 space-y-2.5">
            {/* 1. Fulfillment Type Selection - Ultra Compact Horizontal Strip */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Fulfillment Method
                </label>
                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 border border-amber-500/20">
                  Default: Delivery
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                {/* 1. Delivery */}
                <button
                  type="button"
                  id="fulfillment-opt-delivery"
                  onClick={() => handleFulfillmentChange("DELIVERY")}
                  className={`h-8 px-1 sm:px-2 border flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    selectedFulfillment === "DELIVERY"
                      ? "bg-amber-500 text-black border-black font-black shadow-xs ring-1 ring-black"
                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                  }`}
                  title="Doorstep Courier Delivery"
                >
                  <Bike className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-bold truncate">Delivery</span>
                </button>

                {/* 2. Takeaway (Pickup) */}
                <button
                  type="button"
                  id="fulfillment-opt-takeaway"
                  onClick={() => handleFulfillmentChange("TAKEAWAY")}
                  className={`h-8 px-1 sm:px-2 border flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    selectedFulfillment === "TAKEAWAY"
                      ? "bg-amber-500 text-black border-black font-black shadow-xs ring-1 ring-black"
                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                  }`}
                  title="Self Counter Pickup"
                >
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-bold truncate">Pickup</span>
                </button>

                {/* 3. Drive-thru */}
                <button
                  type="button"
                  id="fulfillment-opt-drivethru"
                  onClick={() => handleFulfillmentChange("DRIVE_THRU")}
                  className={`h-8 px-1 sm:px-2 border flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    selectedFulfillment === "DRIVE_THRU"
                      ? "bg-amber-500 text-black border-black font-black shadow-xs ring-1 ring-black"
                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                  }`}
                  title="Drive-thru Curbside Pickup"
                >
                  <Car className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-bold truncate">Drive-thru</span>
                </button>

                {/* 4. Table / Dine-in */}
                <button
                  type="button"
                  id="fulfillment-opt-dinein"
                  onClick={() => handleFulfillmentChange("DINE_IN")}
                  className={`h-8 px-1 sm:px-2 border flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
                    selectedFulfillment === "DINE_IN"
                      ? "bg-amber-500 text-black border-black font-black shadow-xs ring-1 ring-black"
                      : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                  }`}
                  title="Dine-in at Counter / Table"
                >
                  <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-bold truncate">Dine-in</span>
                </button>
              </div>
            </div>

            {/* Conditional Fulfillment Blocks - Very Compact */}
            {selectedFulfillment === "DELIVERY" && (
              <div className="p-2 bg-zinc-50 dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                {/* Shipping Address Header & Action Buttons */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-amber-500" />
                    <span>Delivery Address</span>
                  </span>

                  <button
                    type="button"
                    id="checkout-change-location-btn"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-black border border-black cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="h-3 w-3 stroke-[2.5]" />
                    <span>Change Pin</span>
                  </button>
                </div>

                {/* Address Card Display */}
                <div
                  onClick={() => setIsLocationModalOpen(true)}
                  className="p-1.5 sm:p-2 bg-white dark:bg-[#1E1E22] border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 transition-colors cursor-pointer group flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {deliveryAddress}
                    </p>
                    {deliveryLocation.landmark && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                        Landmark: {deliveryLocation.landmark}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-amber-500 font-bold shrink-0">
                    Edit &rarr;
                  </span>
                </div>

                {/* Ride Sharing Delivery Fee Note */}
                <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Bike className="h-3 w-3 text-amber-500 shrink-0" />
                  <p className="text-[10px] leading-tight">
                    <span className="font-bold text-zinc-900 dark:text-white">Courier Note: </span>
                    Rider fee paid per ride sharing app rate (Pathao / InDrive / Yango).
                  </p>
                </div>
              </div>
            )}

            {selectedFulfillment === "TAKEAWAY" && (
              <div className="flex items-center justify-between p-2 bg-amber-500/10 border border-amber-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-500 text-black flex items-center justify-center font-black shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white text-xs">
                      Ready in {currentOutlet.estimatedPrepTimeMin} Mins
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      Pick up at {currentOutlet.name}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-500 text-black">
                  Pickup
                </span>
              </div>
            )}

            {selectedFulfillment === "DRIVE_THRU" && (
              <div className="p-2 bg-zinc-50 dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                  <Car className="h-3.5 w-3.5 text-amber-500" />
                  <span>Vehicle Plate / Model</span>
                </div>
                <input
                  type="text"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  placeholder="Vehicle model & plate (e.g., White Swift Ba 2 Cha 4921)"
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#1E1E22] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {selectedFulfillment === "DINE_IN" && (
              <div className="p-2 bg-zinc-50 dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-amber-500" />
                  <span>Table Number or Counter</span>
                </div>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Table number (e.g. Table 4) or write 'Counter'"
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#1E1E22] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Customer Contact Information (Compact grid) */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Contact & Details
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  leftIcon={<User className="h-3.5 w-3.5" />}
                  className="rounded-none text-xs h-7.5"
                  required
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  leftIcon={<Phone className="h-3.5 w-3.5" />}
                  className="rounded-none text-xs h-7.5"
                  required
                />
              </div>

              <Input
                label="Kitchen / Delivery Note (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special notes"
                className="rounded-none text-xs h-7.5"
              />
            </div>

            {/* Payment Method - Dedicated eSewa Integration UI */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Payment Method
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#60BB46] font-mono">
                  <ShieldCheck className="h-3 w-3" />
                  Official eSewa Gateway
                </span>
              </div>

              {/* eSewa Integration Box */}
              <div
                id="esewa-payment-integration"
                className="p-2 sm:p-2.5 bg-[#60BB46]/10 dark:bg-[#60BB46]/15 border-2 border-[#60BB46] flex items-center justify-between gap-2.5 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Authentic eSewa Logo / Brand Icon */}
                  <div className="w-8 h-8 rounded-none bg-[#60BB46] text-white font-black text-xs flex items-center justify-center tracking-tight shrink-0 shadow-xs border border-white/25">
                    eSewa
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-zinc-950 dark:text-white">
                        eSewa Mobile Wallet
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#60BB46] shrink-0" />
                    </div>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">
                      Instant online checkout via eSewa account ({phone.trim() || "Linked Mobile"})
                    </p>
                  </div>
                </div>

                <div className="px-2 py-0.5 bg-[#60BB46] text-white text-[10px] font-mono font-black tracking-wider uppercase flex items-center gap-1 shrink-0 shadow-2xs">
                  <Check className="h-3 w-3 stroke-[3]" />
                  <span>SELECTED</span>
                </div>
              </div>
            </div>

            {/* Bezel-less Rider Tip Buttons (Clean flat chips) */}
            <div className="flex items-center justify-between gap-2 py-1 bg-zinc-50 dark:bg-zinc-900/60 px-2.5">
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
                <span className="text-[11px] font-bold">Rider Tip</span>
              </div>
              <div className="flex items-center gap-1">
                {[0, 20, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTipAmount(amount === tipAmount ? 0 : amount)}
                    className={`text-[11px] font-mono font-bold px-2 py-1 border-0 transition-all cursor-pointer ${
                      tipAmount === amount
                        ? "bg-amber-500 text-black shadow-xs font-black"
                        : "bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {amount === 0 ? "None" : `+${formatNPR(amount)}`}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                {error}
              </div>
            )}
          </div>

          {/* Minimal Height Sticky Bottom Order Summary & Action Bar */}
          <div className="shrink-0 bg-white dark:bg-[#121214] border-t border-zinc-200 dark:border-zinc-800 px-3 py-1.5 sm:py-2 space-y-1.5 shadow-lg z-20">
            {/* Ultra-compact summary bar */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewItemsOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-amber-500 cursor-pointer"
                  title="View products in this order"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                  <span>Items ({cart.items.reduce((s, it) => s + it.quantity, 0)})</span>
                </button>
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                  (VAT incl.{tipAmount > 0 ? ` • Tip ${formatNPR(tipAmount)}` : ""})
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Payable:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 text-sm sm:text-base font-black">
                  {formatNPR(grandPayableTotal)}
                </span>
              </div>
            </div>

            {/* Place Order CTA Button - eSewa Pay */}
            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={isSubmitting || cart.items.length === 0}
              className="w-full text-xs sm:text-sm font-black rounded-none h-8 sm:h-8.5 bg-[#60BB46] hover:bg-[#52a43b] text-white border border-[#44912e] shadow-xs cursor-pointer flex items-center justify-between px-3 transition-colors"
              leftIcon={
                isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                )
              }
            >
              <span className="flex items-center gap-1.5">
                <span>{isSubmitting ? "Connecting to eSewa..." : "Pay with eSewa"}</span>
                {!isSubmitting && (
                  <span className="text-[10px] font-normal opacity-90 hidden sm:inline">
                    • {selectedFulfillment === "DELIVERY"
                        ? "Delivery"
                        : selectedFulfillment === "TAKEAWAY"
                        ? "Takeaway"
                        : selectedFulfillment === "DRIVE_THRU"
                        ? "Drive-Thru"
                        : "Dine-In"}
                  </span>
                )}
              </span>
              <span className="font-mono font-black">
                {formatNPR(grandPayableTotal)}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Interactive Leaflet Map & Landmark Picker Modal */}
      <DeliveryLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentAddress={deliveryAddress}
        onSaveAddress={handleSaveLocation}
      />

      {/* Order Items Review Modal (Eye button) */}
      <OrderItemsPreviewModal
        isOpen={isPreviewItemsOpen}
        onClose={() => setIsPreviewItemsOpen(false)}
        title="Delivery Order Items"
        description="Review all dishes and combo customizations before ordering"
      />
    </>
  );
};
