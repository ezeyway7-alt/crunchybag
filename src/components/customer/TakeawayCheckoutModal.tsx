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
  Lock,
  Loader2,
  Bike,
  Car,
  UtensilsCrossed,
  MapPin,
  Plus,
  Compass,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { formatNPR } from "../../lib/utils";
import { FulfillmentType, PaymentMethod } from "../../types";
import { DeliveryLocationModal } from "./DeliveryLocationModal";

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

  // Fulfillment specific fields
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  // Payment method (defaults to CASH_ON_DELIVERY for delivery)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync payment method when switching fulfillment
  const handleFulfillmentChange = (type: FulfillmentType) => {
    setSelectedFulfillment(type);
    if (type === "DELIVERY") {
      setPaymentMethod("CASH_ON_DELIVERY");
    } else if (paymentMethod === "CASH_ON_DELIVERY") {
      setPaymentMethod("CASH_ON_PICKUP");
    }
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

    // Build extra notes for Drive-thru or Dine-in if present
    let finalNotes = notes.trim();
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

  const getFulfillmentDescription = () => {
    switch (selectedFulfillment) {
      case "DELIVERY":
        return `Doorstep delivery from ${currentOutlet.name}`;
      case "TAKEAWAY":
        return `Fulfillment pickup at ${currentOutlet.name}`;
      case "DRIVE_THRU":
        return `Drive-thru pickup at ${currentOutlet.name}`;
      case "DINE_IN":
        return `Table & counter service at ${currentOutlet.name}`;
      default:
        return `Fulfillment at ${currentOutlet.name}`;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => !isSubmitting && onClose()}
        title="Order Checkout"
        description={getFulfillmentDescription()}
        maxWidth="lg"
        showCloseButton={!isSubmitting}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[78vh] overflow-y-auto pr-1">
          {/* Fulfillment Type Selection (Default: DELIVERY) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Choose Fulfillment Method
              </label>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 border border-amber-500/30">
                Default: Delivery
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {/* 1. Delivery (Default) */}
              <button
                type="button"
                id="fulfillment-opt-delivery"
                onClick={() => handleFulfillmentChange("DELIVERY")}
                className={`p-2.5 border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[58px] ${
                  selectedFulfillment === "DELIVERY"
                    ? "bg-amber-500 text-black border-black dark:border-amber-400 font-bold shadow-sm ring-1 ring-black dark:ring-amber-400"
                    : "bg-white dark:bg-[#18181B] border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Bike className="h-4 w-4 shrink-0" />
                  {selectedFulfillment === "DELIVERY" && (
                    <span className="w-1.5 h-1.5 bg-black rounded-full" />
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-xs font-black leading-none">Delivery</p>
                  <p className={`text-[10px] mt-0.5 ${selectedFulfillment === "DELIVERY" ? "text-zinc-900" : "text-zinc-400"}`}>
                    To Doorstep
                  </p>
                </div>
              </button>

              {/* 2. Takeaway (Pickup) */}
              <button
                type="button"
                id="fulfillment-opt-takeaway"
                onClick={() => handleFulfillmentChange("TAKEAWAY")}
                className={`p-2.5 border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[58px] ${
                  selectedFulfillment === "TAKEAWAY"
                    ? "bg-amber-500 text-black border-black dark:border-amber-400 font-bold shadow-sm ring-1 ring-black dark:ring-amber-400"
                    : "bg-white dark:bg-[#18181B] border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  {selectedFulfillment === "TAKEAWAY" && (
                    <span className="w-1.5 h-1.5 bg-black rounded-full" />
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-xs font-black leading-none">Takeaway</p>
                  <p className={`text-[10px] mt-0.5 ${selectedFulfillment === "TAKEAWAY" ? "text-zinc-900" : "text-zinc-400"}`}>
                    Self Pickup
                  </p>
                </div>
              </button>

              {/* 3. Drive-thru / On Driving */}
              <button
                type="button"
                id="fulfillment-opt-drivethru"
                onClick={() => handleFulfillmentChange("DRIVE_THRU")}
                className={`p-2.5 border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[58px] ${
                  selectedFulfillment === "DRIVE_THRU"
                    ? "bg-amber-500 text-black border-black dark:border-amber-400 font-bold shadow-sm ring-1 ring-black dark:ring-amber-400"
                    : "bg-white dark:bg-[#18181B] border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Car className="h-4 w-4 shrink-0" />
                  {selectedFulfillment === "DRIVE_THRU" && (
                    <span className="w-1.5 h-1.5 bg-black rounded-full" />
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-xs font-black leading-none">Drive-Thru</p>
                  <p className={`text-[10px] mt-0.5 ${selectedFulfillment === "DRIVE_THRU" ? "text-zinc-900" : "text-zinc-400"}`}>
                    On Driving
                  </p>
                </div>
              </button>

              {/* 4. Table / Counter (Dine-in) */}
              <button
                type="button"
                id="fulfillment-opt-dinein"
                onClick={() => handleFulfillmentChange("DINE_IN")}
                className={`p-2.5 border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[58px] ${
                  selectedFulfillment === "DINE_IN"
                    ? "bg-amber-500 text-black border-black dark:border-amber-400 font-bold shadow-sm ring-1 ring-black dark:ring-amber-400"
                    : "bg-white dark:bg-[#18181B] border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <UtensilsCrossed className="h-4 w-4 shrink-0" />
                  {selectedFulfillment === "DINE_IN" && (
                    <span className="w-1.5 h-1.5 bg-black rounded-full" />
                  )}
                </div>
                <div className="mt-1">
                  <p className="text-xs font-black leading-none">Table / Dine</p>
                  <p className={`text-[10px] mt-0.5 ${selectedFulfillment === "DINE_IN" ? "text-zinc-900" : "text-zinc-400"}`}>
                    Counter Dine
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Fulfillment Blocks */}
          {selectedFulfillment === "DELIVERY" && (
            <div className="p-3 bg-zinc-50 dark:bg-[#151518] border border-zinc-300 dark:border-zinc-700 space-y-2.5">
              {/* Shipping Address Header & + Button */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  <span>Delivery Address</span>
                </span>

                {/* The requested + button to change address and choose from map / search landmark */}
                <button
                  type="button"
                  id="checkout-change-location-btn"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black border border-black dark:border-amber-400 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Change / Pin on Map</span>
                </button>
              </div>

              {/* Address Card Display */}
              <div
                onClick={() => setIsLocationModalOpen(true)}
                className="p-2.5 bg-white dark:bg-[#1E1E22] border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 transition-colors cursor-pointer group flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {deliveryAddress}
                  </p>
                  {deliveryLocation.landmark && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">
                      Landmark: {deliveryLocation.landmark}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-zinc-400">
                    GPS Pin: {deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}
                  </p>
                </div>
                <span className="text-[11px] text-zinc-400 group-hover:text-amber-500 font-bold shrink-0">
                  Edit &rarr;
                </span>
              </div>

              {/* Crucial small note: delivery charge paid according to ride sharing app */}
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                <Bike className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight">
                  <span className="font-bold text-zinc-900 dark:text-white">Delivery Note: </span>
                  Delivery charge need to pay according to the ride sharing app (Pathao / InDrive / Yango).
                </p>
              </div>
            </div>
          )}

          {selectedFulfillment === "TAKEAWAY" && (
            <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-500 text-black flex items-center justify-center font-black shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">
                    Estimated Prep Time: {currentOutlet.estimatedPrepTimeMin} Mins
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Pick up hot & fresh at {currentOutlet.name}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-amber-500 text-black">
                Self Pickup
              </span>
            </div>
          )}

          {selectedFulfillment === "DRIVE_THRU" && (
            <div className="p-3 bg-zinc-50 dark:bg-[#151518] border border-zinc-300 dark:border-zinc-700 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                <Car className="h-4 w-4 text-amber-500" />
                <span>Drive-thru / Vehicle Details</span>
              </div>
              <input
                type="text"
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                placeholder="Car / Bike Model & Plate (e.g., White Swift Ba 2 Cha 4921)"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1E1E22] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-zinc-400">
                Staff will bring the order to the designated curbside drive-thru lane.
              </p>
            </div>
          )}

          {selectedFulfillment === "DINE_IN" && (
            <div className="p-3 bg-zinc-50 dark:bg-[#151518] border border-zinc-300 dark:border-zinc-700 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                <UtensilsCrossed className="h-4 w-4 text-amber-500" />
                <span>Table or Counter Dining</span>
              </div>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Table Number (e.g., Table 4) or write 'Counter'"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#1E1E22] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Customer Contact Information (Compact grid) */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Customer Contact Info
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aayush Shrestha"
                leftIcon={<User className="h-3.5 w-3.5" />}
                className="rounded-none text-xs"
                required
              />
              <Input
                label="Contact Phone (for SMS/Rider)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                leftIcon={<Phone className="h-3.5 w-3.5" />}
                className="rounded-none text-xs"
                required
              />
            </div>

            <Input
              label="Kitchen / Delivery Note (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra napkins, no ice in shake, sauce on side"
              className="rounded-none text-xs"
            />
          </div>

          {/* Payment Method Selection (Straight neo-brutalist buttons) */}
          <div className="space-y-2 pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {/* COD / Cash */}
              <button
                type="button"
                id="pay-opt-cod"
                onClick={() =>
                  setPaymentMethod(
                    selectedFulfillment === "DELIVERY" ? "CASH_ON_DELIVERY" : "CASH_ON_PICKUP"
                  )
                }
                className={`p-2.5 border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[56px] ${
                  paymentMethod === "CASH_ON_DELIVERY" || paymentMethod === "CASH_ON_PICKUP"
                    ? "bg-amber-500 text-black border-black dark:border-amber-400 font-black shadow-xs ring-1 ring-black dark:ring-amber-400"
                    : "bg-white dark:bg-[#18181B] border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                }`}
              >
                <Banknote className="h-4 w-4" />
                <span className="text-[11px] font-bold">
                  {selectedFulfillment === "DELIVERY" ? "Cash on Delivery" : "Cash at Counter"}
                </span>
              </button>

              {/* Fonepay QR */}
              <button
                type="button"
                id="pay-opt-fonepay"
                onClick={() => setPaymentMethod("FONEPAY_QR")}
                className={`p-2.5 border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[56px] ${
                  paymentMethod === "FONEPAY_QR"
                    ? "bg-amber-500 text-black border-black dark:border-amber-400 font-black shadow-xs ring-1 ring-black dark:ring-amber-400"
                    : "bg-white dark:bg-[#18181B] border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span className="text-[11px] font-bold">Fonepay QR</span>
              </button>

              {/* Digital Wallet (eSewa / Khalti) */}
              <button
                type="button"
                id="pay-opt-wallet"
                onClick={() => setPaymentMethod("WALLET")}
                className={`p-2.5 border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[56px] ${
                  paymentMethod === "WALLET"
                    ? "bg-amber-500 text-black border-black dark:border-amber-400 font-black shadow-xs ring-1 ring-black dark:ring-amber-400"
                    : "bg-white dark:bg-[#18181B] border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-[11px] font-bold">eSewa / Khalti</span>
              </button>

              {/* Card / POS */}
              <button
                type="button"
                id="pay-opt-card"
                onClick={() => setPaymentMethod("CARD")}
                className={`p-2.5 border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[56px] ${
                  paymentMethod === "CARD"
                    ? "bg-amber-500 text-black border-black dark:border-amber-400 font-black shadow-xs ring-1 ring-black dark:ring-amber-400"
                    : "bg-white dark:bg-[#18181B] border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-[11px] font-bold">
                  {selectedFulfillment === "DELIVERY" ? "Card on Delivery" : "Card / POS"}
                </span>
              </button>
            </div>
          </div>

          {/* Compact Order Review Summary */}
          <div className="p-3 bg-zinc-50 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Items Total ({cart.items.length} lines)</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">
                {formatNPR(cart.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Inclusive of 13% PAN / VAT</span>
              <span className="font-mono">{formatNPR(cart.taxInclusiveAmount)}</span>
            </div>
            {selectedFulfillment === "DELIVERY" && (
              <div className="flex justify-between text-[11px] text-amber-600 dark:text-amber-400">
                <span>Delivery Charge</span>
                <span>Pay to Ride App (Pathao/Yango)</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-zinc-950 dark:text-white pt-1.5 border-t border-zinc-200 dark:border-zinc-700">
              <span>Payable Food Total</span>
              <span className="font-mono text-amber-500">{formatNPR(cart.finalTotal)}</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-1">
            <Button
              type="submit"
              size="lg"
              variant="primary"
              disabled={isSubmitting || cart.items.length === 0}
              className="w-full text-sm sm:text-base font-black rounded-none h-11 sm:h-12 bg-amber-500 hover:bg-amber-400 text-black border border-black shadow-md cursor-pointer"
              leftIcon={
                isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 stroke-[2.5]" />
                )
              }
            >
              {isSubmitting
                ? "Placing & Locking Order..."
                : `Place ${
                    selectedFulfillment === "DELIVERY"
                      ? "Delivery"
                      : selectedFulfillment === "TAKEAWAY"
                      ? "Takeaway"
                      : selectedFulfillment === "DRIVE_THRU"
                      ? "Drive-Thru"
                      : "Dine-In"
                  } Order • ${formatNPR(cart.finalTotal)}`}
            </Button>
            <p className="text-[10px] text-zinc-400 text-center mt-1.5 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>Idempotent submission: Protected against double-charging</span>
            </p>
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
    </>
  );
};
