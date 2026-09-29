import {useCustomerAddresses, addressPoint} from '../../lib/customerAddresses';
import { apiClient, ApiError, extractErrorMessage } from "../../lib/api";
import { customerPath, cartLines, customerRefresh } from "../../lib/customerApi";
import { useAuth } from "../../context/AuthContext";
import React, { useState, useEffect, useRef } from "react";
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
  const { cart, currentOutlet, consumePurchasedCart, customerProfile, cartSyncing, cartSyncError } = useApp();

  // 1. By default, DELIVERY is selected as requested!
  const [selectedFulfillment, setSelectedFulfillment] = useState<FulfillmentType>("DELIVERY");

  // Contact info
  const [name, setName] = useState(customerProfile.name || "");
  const [phone, setPhone] = useState(customerProfile.phone || "");
  const [notes, setNotes] = useState("");

  // Delivery address & location state
  const [deliveryAddress, setDeliveryAddress] = useState(
    customerProfile.address || ""
  );
  const [deliveryLocation, setDeliveryLocation] = useState<{lat:number;lng:number;landmark?:string} | undefined>();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isPreviewItemsOpen, setIsPreviewItemsOpen] = useState(false);

  // Fulfillment specific fields
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  // Payment method (eSewa Integration only)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("FONEPAY_QR");
  const savedAddresses = useCustomerAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [proofError, setProofError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync payment method when switching fulfillment
  const handleFulfillmentChange = (type: FulfillmentType) => {
    setSelectedFulfillment(type);
    setPaymentMethod("FONEPAY_QR");
  };

  const handleSaveLocation = (
    newAddress: string,
    location?: { lat: number; lng: number; landmark?: string }
  ) => {
    setDeliveryAddress(newAddress);
    setDeliveryLocation(location);setSelectedAddressId('');
  };

  const {authUser,isAuthenticated} = useAuth();
  const [meta,setMeta] = useState<any>(null);
  const [proof,setProof] = useState<File | null>(null);
  const [quoted,setQuoted] = useState<{signature:string;data:any}|null>(null);
  const [quoteVersion,setQuoteVersion] = useState(0);
  const [quoteError,setQuoteError] = useState('');
  const lock = useRef(false);
  const addressInitialized = useRef(false);
  const payload = {outlet_id:Number(currentOutlet.id),items:cartLines(cart.items),fulfillment_type:selectedFulfillment,
    cart_line_ids:cart.items.map(item=>item.cartItemId),
    customer_name:name.trim() || authUser?.username || '',delivery_address:selectedFulfillment==='DELIVERY'?deliveryAddress:'',
    table_id:selectedFulfillment==='DINE_IN'?meta?.tables.find((t:any)=>t.table_number===tableNumber)?.id || null:null,
    notes:[vehicleInfo?`Vehicle: ${vehicleInfo}`:'',notes].filter(Boolean).join(' — '),delivery_location:selectedFulfillment==='DELIVERY' ? deliveryLocation || {} : {}};
  const signature = JSON.stringify(payload);
  const quote = quoted?.signature===signature ? quoted.data : null;
  const grandPayableTotal = Number(quote?.total_payable ?? cart.finalTotal);
  const pendingKey = `customer-checkout:${authUser?.id}:${currentOutlet.id}`;
  const finishOrder = (order:any) => {const pending=JSON.parse(sessionStorage.getItem(pendingKey)||'null');consumePurchasedCart(pending?.cartLineIds || []);sessionStorage.removeItem(pendingKey);customerRefresh();onClose();onOrderSuccess(String(order.id));};
  useEffect(()=>{
    if(!isOpen)return;
    addressInitialized.current=false;setDeliveryAddress('');setDeliveryLocation(undefined);setSelectedAddressId('');setSaveAddress(false);
    setName(authUser?.username || customerProfile.name);setPhone((authUser as any)?.phone_number || customerProfile.phone);setError(null);setProofError('');setTouched(false);setProof(null);setMeta(null);
    const controller=new AbortController();let live=true;
    apiClient.get<any>(`${customerPath('checkout/meta/')}?outlet_id=${currentOutlet.id}`,{signal:controller.signal})
      .then(result=>{if(live){setMeta(result);if(!result.fulfillment_modes.includes(selectedFulfillment))setSelectedFulfillment(result.fulfillment_modes[0] || 'TAKEAWAY');}})
      .catch(e=>{if(live)setError(extractErrorMessage(e));});
    const pending=JSON.parse(sessionStorage.getItem(pendingKey)||'null');
    if(pending)apiClient.get<any>(customerPath('orders/'),{signal:controller.signal}).then(result=>{const order=result.results.find((o:any)=>o.request_key===pending.key);if(live&&order)finishOrder(order);}).catch(()=>{});
    return()=>{live=false;controller.abort();};
  },[isOpen,currentOutlet.id,authUser?.id]);
  useEffect(()=>{
    if(!isOpen||!isAuthenticated||!cart.items.length)return;
    const controller=new AbortController();let live=true;
    const timer=setTimeout(()=>apiClient.post<any>(customerPath('checkout/quote/'),JSON.parse(signature),{signal:controller.signal})
      .then(data=>{if(live){setQuoted({signature,data});setQuoteError('');}}).catch(e=>{if(live)setQuoteError(extractErrorMessage(e));}),250);
    return()=>{live=false;clearTimeout(timer);controller.abort();};
  },[isOpen,isAuthenticated,signature,quoteVersion]);
  useEffect(()=>{
    if (!isOpen || addressInitialized.current || savedAddresses.loading) return;
    addressInitialized.current=true;
    const row = savedAddresses.addresses.find(row=>row.is_default) || savedAddresses.addresses[0];
    if (row) {setSelectedAddressId(String(row.id));setDeliveryAddress(row.address);setDeliveryLocation(addressPoint(row));}
    else if(customerProfile.address) setDeliveryAddress(customerProfile.address);
  },[isOpen,savedAddresses.addresses,savedAddresses.loading,customerProfile.address,authUser?.id]);
  const addressError = selectedFulfillment==='DELIVERY' && !deliveryAddress.trim() ? 'Choose your delivery address.' : '';
  const nameError = !name.trim() ? 'Enter your name.' : name.trim().length > 120 ? 'Use no more than 120 characters.' : '';
  const tableError = selectedFulfillment==='DINE_IN' && !payload.table_id ? 'Choose a table.' : '';
  const handleProof = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget, file = input.files?.[0];
    setProof(null);setProofError('');
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {setProofError('Choose a PNG, JPEG, or WebP image.');input.value='';return;}
    if(file.size > 5*1024*1024) {setProofError('Receipt must be smaller than 5 MB.');input.value='';return;}
    if(!file.size) {setProofError('This file is empty. Choose another receipt.');input.value='';return;}
    setProof(file);
  };
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();setTouched(true);if(lock.current)return;
    if(nameError || addressError || tableError || cartSyncing || cartSyncError)return;
    if(!isAuthenticated||authUser?.role!=='CUSTOMER'){setError('Sign in before placing your order.');return;}
    if(!quote||!proof||!meta?.qr_url){setError('Scan the payment QR and upload your receipt before placing the order.');return;}
    if(selectedFulfillment==='DELIVERY'&&!deliveryAddress.trim()){setError('Enter your delivery address.');return;}
    lock.current=true;setIsSubmitting(true);setError(null);
    try {
      if(saveAddress && selectedFulfillment==='DELIVERY' && !selectedAddressId) {
        const row = await savedAddresses.save({label:addressLabel.trim() || 'Home',address:deliveryAddress,landmark:deliveryLocation?.landmark || '',latitude:deliveryLocation ? deliveryLocation.lat.toFixed(7):null,longitude:deliveryLocation ? deliveryLocation.lng.toFixed(7):null});
        setSelectedAddressId(String(row.id));setSaveAddress(false);
      }
      const body={...payload,expected_total:quote.total_payable};
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await proof.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');
      const fingerprint=JSON.stringify(body)+digest;
      const pending=JSON.parse(sessionStorage.getItem(pendingKey)||'null');
      if(pending&&pending.fingerprint!==fingerprint)throw new Error('A previous checkout is awaiting confirmation. Check My Orders before changing and resubmitting it.');
      const requestKey=pending?.key || crypto.randomUUID();sessionStorage.setItem(pendingKey,JSON.stringify({key:requestKey,fingerprint,cartLineIds:payload.cart_line_ids}));
      const form=new FormData();form.append('payload',JSON.stringify(body));form.append('receipt',proof);
      const result=await apiClient.post<any>(customerPath('checkout/'),form,{headers:{'Idempotency-Key':requestKey}});
      setProof(null);finishOrder(result);
    }catch(e){if(e instanceof ApiError&&e.status>=400&&e.status<500)sessionStorage.removeItem(pendingKey);if(e instanceof ApiError&&e.status===409){setQuoted(null);setQuoteVersion(v=>v+1);}setError(extractErrorMessage(e));}
    finally{lock.current=false;setIsSubmitting(false);}
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
          <fieldset disabled={isSubmitting} className="contents">
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
                  disabled={!meta?.fulfillment_modes.includes("DELIVERY")}
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
                  disabled={!meta?.fulfillment_modes.includes("TAKEAWAY")}
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
                    <span>{deliveryAddress ? "Edit address" : "Add address"}</span>
                  </button>
                </div>

                {savedAddresses.addresses.length > 0 && <select aria-label="Saved delivery address" value={selectedAddressId} onChange={e=>{
                  setSelectedAddressId(e.target.value);const row=savedAddresses.addresses.find(row=>String(row.id)===e.target.value);
                  if(row){setDeliveryAddress(row.address);setDeliveryLocation(addressPoint(row));setSaveAddress(false);}else{setDeliveryAddress('');setDeliveryLocation(undefined);}
                }} className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs"><option value="">New address</option>{savedAddresses.addresses.map(row=><option key={row.id} value={row.id}>{row.label}: {row.address}</option>)}</select>}
                {touched && addressError && <p className="text-xs text-rose-400">{addressError}</p>}
                {savedAddresses.error && <p role="alert" className="text-xs text-rose-400">{savedAddresses.error}</p>}
                {/* Address Card Display */}
                <div
                  onClick={() => setIsLocationModalOpen(true)}
                  className="p-1.5 sm:p-2 bg-white dark:bg-[#1E1E22] border border-zinc-200 dark:border-zinc-700 hover:border-amber-500 transition-colors cursor-pointer group flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {deliveryAddress || "Choose a delivery address"}
                    </p>
                    {deliveryLocation?.landmark && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                        Landmark: {deliveryLocation.landmark}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-amber-500 font-bold shrink-0">
                    Edit &rarr;
                  </span>
                </div>

                {!selectedAddressId && deliveryAddress && <div className="space-y-2"><label className="flex gap-2 items-center text-xs"><input type="checkbox" checked={saveAddress} onChange={e=>setSaveAddress(e.target.checked)} />Save this address</label>
                  {saveAddress && <Input label="Address label" value={addressLabel} onChange={e=>setAddressLabel(e.target.value)} maxLength={60} required />}</div>}
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
                  maxLength={150}
                  placeholder="Vehicle model & plate (e.g., White Swift Ba 2 Cha 4921)"
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#1E1E22] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {selectedFulfillment === "DINE_IN" && (
              <div className="p-2 bg-zinc-50 dark:bg-[#151518] border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-amber-500" />
                  <span>Table Number</span>
                </div>
                <select aria-label="Table number" value={tableNumber} onChange={e=>setTableNumber(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-700 text-xs"><option value="">Choose a table</option>{meta?.tables.map((table:any)=><option key={table.id} value={table.table_number}>{table.table_number}</option>)}</select>
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
                  maxLength={120}
                  error={touched ? nameError : undefined}
                  onBlur={()=>setTouched(true)}
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
                  readOnly
                  placeholder="+977 98XXXXXXXX"
                  leftIcon={<Phone className="h-3.5 w-3.5" />}
                  className="rounded-none text-xs h-7.5"
                  required
                />
              </div>

              <Input
                label="Kitchen / Delivery Note (Optional)"
                maxLength={1800}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special notes"
                className="rounded-none text-xs h-7.5"
              />
            </div>

            {/* Payment evidence uses the organization's uploaded merchant QR. */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-200 dark:border-zinc-800">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Scan & Pay</label>
              <div className="p-2 sm:p-2.5 bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5">
                {meta?.qr_url ? <a href={meta.qr_url} target="_blank" rel="noreferrer"><img src={meta.qr_url} alt="Merchant payment QR" className="w-32 h-32 object-contain bg-white" /></a> : <p className="text-xs text-amber-500">Payment QR is not configured for this outlet yet.</p>}
                <div className="space-y-2 min-w-0">
                  <p className="text-xs font-bold">{meta?.merchant}</p>
                  <p className="text-[10px] text-zinc-400">Pay {formatNPR(grandPayableTotal)}, then upload the payment receipt. The outlet will verify it.</p>
                  <input aria-label="Payment receipt" aria-invalid={!!proofError} aria-describedby={proofError ? 'receipt-error' : undefined} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProof} className="w-full text-xs" required />
                  {proofError && <p id="receipt-error" role="alert" className="text-xs text-rose-400">{proofError}</p>}
                  {proof && <p className="text-xs text-emerald-400">Receipt ready</p>}
                </div>
              </div>
            </div>

            {(error || quoteError) && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                {error || quoteError}
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
                  (VAT incl.)
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
              disabled={isSubmitting || cartSyncing || !!cartSyncError || !!nameError || !!addressError || !!tableError || !quote || !proof || !meta?.qr_url || !meta?.accepting_orders || cart.items.length === 0}
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
                <span>{isSubmitting ? "Submitting order..." : "Submit Receipt & Place Order"}</span>
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
          </fieldset>
        </form>
      </Modal>

      {/* Interactive Leaflet Map & Landmark Picker Modal */}
      <DeliveryLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentAddress={deliveryAddress}
        currentLocation={deliveryLocation}
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
