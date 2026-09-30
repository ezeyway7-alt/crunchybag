import {OrganizationSmsSettings} from './OrganizationSmsSettings';
import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Store,
  Phone,
  Mail,
  Globe,
  Save,
  RotateCcw,
  Upload,
  Trash2,
  RefreshCw,
  Check,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { PaymentMethod } from "../../types";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { organizationApi, apiClient, extractErrorMessage } from "../../lib/api";

const ALL_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "ESEWA", label: "eSewa" },
  { id: "FONEPAY_QR", label: "Fonepay QR" },
  { id: "CASH_ON_PICKUP", label: "Cash" },
  { id: "CARD", label: "Card (POS)" },
  { id: "WALLET", label: "Wallets" },
];

const CURRENCY_OPTIONS = [
  { code: "NPR", label: "NPR (रु - Nepalese Rupee)" },
  { code: "USD", label: "USD ($ - US Dollar)" },
  { code: "INR", label: "INR (₹ - Indian Rupee)" },
  { code: "EUR", label: "EUR (€ - Euro)" },
  { code: "GBP", label: "GBP (£ - British Pound)" },
  { code: "AED", label: "AED (د.إ - UAE Dirham)" },
];

export const AdminOrganizationTab: React.FC = () => {
  const { orgSettings, updateOrgSettings, currentOutlet, addActivityLog, addToast } = useApp();
  const { authOutlet, authUser } = useAuth();
  const [paymentQr,setPaymentQr] = useState('');
  const [qrBusy,setQrBusy] = useState(false);
  useEffect(()=>{apiClient.get<any>('/organization/').then(value=>setPaymentQr(value.payment_qr || '')).catch(()=>{});},[]);
  const uploadPaymentQr = async (file:File) => {
    if(file.size>5*1024*1024){addToast({title:'QR image must be smaller than 5 MB',type:'error'});return;}
    setQrBusy(true);try{const form=new FormData();form.append('payment_qr',file);const value=await apiClient.patch<any>('/organization/',form);setPaymentQr(value.payment_qr || '');addToast({title:'Payment QR saved',type:'success'});}catch(e){addToast({title:'QR upload failed',description:extractErrorMessage(e),type:'error'});}finally{setQrBusy(false);}
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scoped branch display
  const activeBranchName = authOutlet?.name || currentOutlet?.name || "Durbar Marg HQ";
  const activeBranchCode = authOutlet?.branch_code || authOutlet?.code || currentOutlet?.code || "CRU-01";
  const branchDisplayName = `${activeBranchName} (${activeBranchCode})`;

  // Organization settings local states
  const [brandName, setBrandName] = useState(orgSettings.brandName || "Crunchy Bag");
  const [tagline, setTagline] = useState(orgSettings.tagline || "");
  const [legalEntity, setLegalEntity] = useState(orgSettings.legalEntity || "");
  const [panNumber, setPanNumber] = useState(orgSettings.panNumber || "");
  const [logoUrl, setLogoUrl] = useState(orgSettings.logoUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(orgSettings.websiteUrl || "");
  const [contactEmail, setContactEmail] = useState(orgSettings.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(orgSettings.contactPhone || "");
  const [headquartersAddress, setHeadquartersAddress] = useState(orgSettings.headquartersAddress || "");
  const [vatRatePercent, setVatRatePercent] = useState((orgSettings.vatRatePercent ?? 13).toString());
  const [serviceChargePercent, setServiceChargePercent] = useState(
    (orgSettings.serviceChargePercent ?? 0).toString()
  );
  const [defaultCurrency, setDefaultCurrency] = useState(orgSettings.defaultCurrency || "NPR");
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState<PaymentMethod[]>(
    orgSettings.acceptedPaymentMethods || ["ESEWA", "FONEPAY_QR", "CASH_ON_PICKUP", "CARD", "WALLET"]
  );

  // File Upload State
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(orgSettings.logoUrl || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);

  // Fetch settings from live backend
  const fetchRemoteSettings = async (isManual = false) => {
    setIsFetchingRemote(true);
    try {
      const remote = await organizationApi.getSettings();
      if (remote) {
        updateOrgSettings(remote);
        setBrandName(remote.brandName);
        setTagline(remote.tagline || "");
        setLegalEntity(remote.legalEntity);
        setPanNumber(remote.panNumber);
        setLogoUrl(remote.logoUrl || "");
        setLogoPreviewUrl(remote.logoUrl || "");
        setSelectedLogoFile(null);
        setWebsiteUrl(remote.websiteUrl || "");
        setContactEmail(remote.contactEmail || "");
        setContactPhone(remote.contactPhone || "");
        setHeadquartersAddress(remote.headquartersAddress || "");
        setVatRatePercent(remote.vatRatePercent.toString());
        setServiceChargePercent(remote.serviceChargePercent.toString());
        if (remote.defaultCurrency) setDefaultCurrency(remote.defaultCurrency);
        setAcceptedPaymentMethods(remote.acceptedPaymentMethods);

        if (isManual) {
          addToast({
            title: "Settings Synced",
            description: "Organization details updated from server.",
            type: "success",
          });
        }
      }
    } catch (err) {
      if (isManual) {
        addToast({
          title: "Sync Failed",
          description: extractErrorMessage(err),
          type: "warning",
        });
      }
    } finally {
      setIsFetchingRemote(false);
    }
  };

  useEffect(() => {
    fetchRemoteSettings(false);
  }, []);

  // Sync state if orgSettings changes externally
  useEffect(() => {
    setBrandName(orgSettings.brandName || "Crunchy Bag");
    setTagline(orgSettings.tagline || "");
    setLegalEntity(orgSettings.legalEntity || "");
    setPanNumber(orgSettings.panNumber || "");
    setLogoUrl(orgSettings.logoUrl || "");
    if (!selectedLogoFile) {
      setLogoPreviewUrl(orgSettings.logoUrl || "");
    }
    setWebsiteUrl(orgSettings.websiteUrl || "");
    setContactEmail(orgSettings.contactEmail || "");
    setContactPhone(orgSettings.contactPhone || "");
    setHeadquartersAddress(orgSettings.headquartersAddress || "");
    setVatRatePercent((orgSettings.vatRatePercent ?? 13).toString());
    setServiceChargePercent((orgSettings.serviceChargePercent ?? 0).toString());
    if (orgSettings.defaultCurrency) {
      setDefaultCurrency(orgSettings.defaultCurrency);
    }
    if (orgSettings.acceptedPaymentMethods) {
      setAcceptedPaymentMethods(orgSettings.acceptedPaymentMethods);
    }
  }, [orgSettings]);

  // Handle local file selection
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      addToast({
        title: "Invalid File",
        description: "Please select an image file (PNG, JPG, or WEBP).",
        type: "error",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "File Too Large",
        description: "Logo image should be under 5MB.",
        type: "warning",
      });
      return;
    }

    setSelectedLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoPreviewUrl(dataUrl);
      setLogoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setSelectedLogoFile(null);
    setLogoPreviewUrl("");
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setAcceptedPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleReset = () => {
    setBrandName(orgSettings.brandName || "Crunchy Bag");
    setTagline(orgSettings.tagline || "");
    setLegalEntity(orgSettings.legalEntity || "");
    setPanNumber(orgSettings.panNumber || "");
    setLogoUrl(orgSettings.logoUrl || "");
    setLogoPreviewUrl(orgSettings.logoUrl || "");
    setSelectedLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setWebsiteUrl(orgSettings.websiteUrl || "");
    setContactEmail(orgSettings.contactEmail || "");
    setContactPhone(orgSettings.contactPhone || "");
    setHeadquartersAddress(orgSettings.headquartersAddress || "");
    setVatRatePercent((orgSettings.vatRatePercent ?? 13).toString());
    setServiceChargePercent((orgSettings.serviceChargePercent ?? 0).toString());
    setDefaultCurrency(orgSettings.defaultCurrency || "NPR");
    setAcceptedPaymentMethods(
      orgSettings.acceptedPaymentMethods || ["ESEWA", "FONEPAY_QR", "CASH_ON_PICKUP", "CARD", "WALLET"]
    );
    addToast({
      title: "Reset",
      description: "Restored fields to last saved values.",
      type: "info",
    });
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedSettings = {
      brandName: brandName.trim(),
      tagline: tagline.trim(),
      legalEntity: legalEntity.trim() || brandName.trim(),
      panNumber: panNumber.trim(),
      logoUrl: logoUrl.trim() || logoPreviewUrl,
      websiteUrl: websiteUrl.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      headquartersAddress: headquartersAddress.trim(),
      vatRatePercent: parseFloat(vatRatePercent) || 0,
      serviceChargePercent: parseFloat(serviceChargePercent) || 0,
      defaultCurrency,
      acceptedPaymentMethods,
    };

    updateOrgSettings(updatedSettings);

    try {
      const remoteSaved = await organizationApi.updateSettings(updatedSettings, selectedLogoFile);
      if (remoteSaved) {
        if (remoteSaved.logoUrl) {
          setLogoUrl(remoteSaved.logoUrl);
          setLogoPreviewUrl(remoteSaved.logoUrl);
        }
        updateOrgSettings(remoteSaved);
      }
      setSelectedLogoFile(null);
      addToast({
        title: "Saved",
        description: "Organization profile updated successfully.",
        type: "success",
      });
    } catch (err) {
      addToast({
        title: "Saved Locally",
        description: "Settings updated in session.",
        type: "info",
      });
    } finally {
      if (addActivityLog) {
        addActivityLog(
          "ORGANIZATION_UPDATE",
          `Updated organization settings (${brandName.trim()})`,
          authUser?.name || "Admin"
        );
      }
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full text-zinc-200">
      {/* -------------------------------------------------------------
          SINGLE UNIFIED FORM BOX (ALL IN ONE BOX, 5-COLUMN HIGH-DENSITY ROWS)
      ------------------------------------------------------------- */}
      <form
        onSubmit={handleSaveOrg}
        className="bg-[#121214] border border-zinc-800 rounded-lg p-5 space-y-5 shadow-sm"
      >
        <div className="space-y-2 border-b border-zinc-800 pb-3">
          <label className="text-xs font-bold text-zinc-400">Customer Checkout Payment QR</label>
          {paymentQr && <img src={paymentQr} alt="Saved merchant payment QR" className="w-28 h-28 object-contain bg-white" />}
          <input aria-label="Upload merchant payment QR" type="file" accept="image/png,image/jpeg,image/webp" disabled={qrBusy} onChange={e=>{if(e.target.files?.[0])void uploadPaymentQr(e.target.files[0]);}} className="block text-xs text-zinc-400" />
        </div>
        {/* SINGLE BOX HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-sm font-bold text-white tracking-tight">Organization Settings</span>
            <span className="text-xs text-zinc-500 font-mono">
              • Branch: {branchDisplayName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchRemoteSettings(true)}
              disabled={isFetchingRemote}
              className="text-xs h-7 px-2.5"
              leftIcon={
                <RefreshCw
                  className={`w-3 h-3 ${isFetchingRemote ? "animate-spin text-amber-500" : ""}`}
                />
              }
            >
              {isFetchingRemote ? "Syncing..." : "Sync"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="text-xs h-7 px-2.5"
              leftIcon={<RotateCcw className="w-3 h-3" />}
            >
              Reset
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-7 px-3.5"
              leftIcon={<Save className="w-3 h-3" />}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* -------------------------------------------------------------
            ROW 1: IDENTITY & LOGO (5 COLUMNS)
        ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-end">
          {/* Col 1: Brand Logo (Click box to upload or change) */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Brand Logo
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 h-9 px-2 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/60 rounded cursor-pointer transition-colors group select-none"
              title="Click to choose a brand logo image file"
            >
              <div className="w-7 h-7 rounded bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    onError={() => setLogoPreviewUrl("")}
                  />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                )}
              </div>
              <span className="text-[11px] font-medium text-zinc-300 group-hover:text-amber-400 truncate flex-1">
                {selectedLogoFile
                  ? selectedLogoFile.name
                  : logoPreviewUrl
                  ? "Change Logo"
                  : "Upload Logo"}
              </span>
              {logoPreviewUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveLogo();
                  }}
                  title="Remove Logo"
                  className="text-zinc-500 hover:text-rose-400 p-1 shrink-0 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Col 2: Brand Name */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Brand Name *
            </label>
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Crunchy Bag"
              required
              className="text-xs h-9 font-medium"
            />
          </div>

          {/* Col 3: PAN / VAT */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              PAN / VAT Number *
            </label>
            <Input
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              placeholder="123456789"
              required
              className="text-xs h-9 font-mono font-medium"
            />
          </div>

          {/* Col 4: Legal Entity */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Legal Entity Name
            </label>
            <Input
              value={legalEntity}
              onChange={(e) => setLegalEntity(e.target.value)}
              placeholder="Crunchy Bag Pvt. Ltd."
              className="text-xs h-9"
            />
          </div>

          {/* Col 5: Description / Tagline */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Description / Slogan
            </label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Crispy Fast Casual Dining"
              className="text-xs h-9"
            />
          </div>
        </div>

        {/* -------------------------------------------------------------
            ROW 2: CONTACT & ADDRESS (5 COLUMNS)
        ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Col 1: Phone */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="9805996874"
                className="text-xs h-9 font-mono pl-8"
              />
            </div>
          </div>

          {/* Col 2: Email */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Official Email
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="crunchybag@gmail.com"
                className="text-xs h-9 pl-8"
              />
            </div>
          </div>

          {/* Col 3: Website */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Website URL
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://crunchybag.com/"
                className="text-xs h-9 font-mono pl-8"
              />
            </div>
          </div>

          {/* Col 4: Headquarters Address */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Headquarters Address
            </label>
            <Input
              value={headquartersAddress}
              onChange={(e) => setHeadquartersAddress(e.target.value)}
              placeholder="Durbar Marg, Kathmandu"
              className="text-xs h-9"
            />
          </div>

          {/* Col 5: Currency */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Currency
            </label>
            <div className="relative">
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full h-9 px-2.5 pr-7 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-amber-500 rounded text-xs text-zinc-200 font-mono focus:outline-none cursor-pointer appearance-none"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code} className="bg-zinc-900 text-zinc-200">
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
            ROW 3: TAX RATES & PAYMENT CHANNELS (5 COLUMNS: 2 TAX + 3 PAYMENT)
        ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-end pt-1">
          {/* Col 1: VAT % */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              VAT Rate (%)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={vatRatePercent}
                onChange={(e) => setVatRatePercent(e.target.value)}
                className="text-xs h-9 font-mono pr-7"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">
                %
              </span>
            </div>
          </div>

          {/* Col 2: Service Charge % */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Service Charge (%)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={serviceChargePercent}
                onChange={(e) => setServiceChargePercent(e.target.value)}
                className="text-xs h-9 font-mono pr-7"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">
                %
              </span>
            </div>
          </div>

          {/* Col 3, 4, 5: Payment Channels (Spanning 3 columns) */}
          <div className="lg:col-span-3">
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">
              Accepted Payment Channels
            </label>
            <div className="flex flex-wrap items-center gap-1.5 h-auto min-h-9">
              {ALL_METHODS.map((m) => {
                const isEnabled = acceptedPaymentMethods.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => togglePaymentMethod(m.id)}
                    className={`h-9 px-2.5 rounded border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                      isEnabled
                        ? "bg-amber-500/10 border-amber-500/60 text-amber-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                        isEnabled
                          ? "bg-amber-500 border-amber-500 text-black"
                          : "border-zinc-700 bg-zinc-800"
                      }`}
                    >
                      {isEnabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <OrganizationSmsSettings/>
        {/* -------------------------------------------------------------
            BOTTOM ACTIONS ROW (Inside the single container)
        ------------------------------------------------------------- */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="text-xs h-8 px-4"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-8 px-5"
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};
