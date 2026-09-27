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
import { organizationApi, extractErrorMessage } from "../../lib/api";

const ALL_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "ESEWA", label: "eSewa QR & Web" },
  { id: "FONEPAY_QR", label: "Fonepay QR" },
  { id: "CASH_ON_PICKUP", label: "Cash on Counter" },
  { id: "CARD", label: "POS Terminal (Card)" },
  { id: "WALLET", label: "Khalti / Wallets" },
];

export const AdminOrganizationTab: React.FC = () => {
  const { orgSettings, updateOrgSettings, currentOutlet, addActivityLog, addToast } = useApp();
  const { authOutlet, authUser } = useAuth();
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-zinc-200">
      {/* -------------------------------------------------------------
          CLEAN HEADER BAR (Minimal & Direct)
      ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h1 className="text-base font-bold text-white tracking-tight">Organization Profile</h1>
            <span className="text-xs text-zinc-500 font-mono">
              • Branch: {branchDisplayName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchRemoteSettings(true)}
            disabled={isFetchingRemote}
            className="text-xs h-8 px-3"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetchingRemote ? "animate-spin text-amber-500" : ""}`} />}
          >
            {isFetchingRemote ? "Syncing..." : "Sync"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="text-xs h-8 px-3"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveOrg}
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-8 px-4"
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MAIN FORM CONTAINER
      ------------------------------------------------------------- */}
      <form onSubmit={handleSaveOrg} className="space-y-6">
        {/* BRAND LOGO ROW */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-lg p-5">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">
            Brand Logo
          </div>

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreviewUrl ? (
                <img
                  src={logoPreviewUrl}
                  alt="Logo"
                  className="w-full h-full object-contain p-1.5"
                  onError={() => setLogoPreviewUrl("")}
                />
              ) : (
                <Building2 className="w-8 h-8 text-zinc-700" />
              )}
            </div>

            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs h-8"
                  leftIcon={<Upload className="w-3.5 h-3.5 text-amber-500" />}
                >
                  Upload New Logo
                </Button>

                {logoPreviewUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveLogo}
                    className="text-xs h-8 text-zinc-400 hover:text-rose-400"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="text-[11px] text-zinc-500 font-mono">
                {selectedLogoFile
                  ? `${selectedLogoFile.name} (${(selectedLogoFile.size / 1024).toFixed(0)} KB)`
                  : "Supports PNG, JPG, or SVG up to 5MB."}
              </div>
            </div>
          </div>
        </div>

        {/* GENERAL INFORMATION */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-lg p-5 space-y-4">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            General Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Brand Name *
              </label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Crunchy Bag"
                required
                className="text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                PAN / VAT Number *
              </label>
              <Input
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="123456789"
                required
                className="text-xs font-mono font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Legal Entity Name
              </label>
              <Input
                value={legalEntity}
                onChange={(e) => setLegalEntity(e.target.value)}
                placeholder="Crunchy Bag Food & Beverages Pvt. Ltd."
                className="text-xs"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Description / Tagline
              </label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Crispy Fried Chicken & Gourmet Smash Burgers"
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* CONTACT & LOCATION */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-lg p-5 space-y-4">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Contact & Location
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="9805996874"
                  className="text-xs font-mono pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="crunchybag@gmail.com"
                  className="text-xs pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Official Website
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://crunchybag.com/"
                  className="text-xs font-mono pl-9"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Headquarters Address
              </label>
              <Input
                value={headquartersAddress}
                onChange={(e) => setHeadquartersAddress(e.target.value)}
                placeholder="Durbar Marg, Kathmandu, Nepal"
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* TAX & FISCAL RATES */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-lg p-5 space-y-4">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Tax Rates & Currency
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
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
                  className="text-xs font-mono pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
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
                  className="text-xs font-mono pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Currency
              </label>
              <div className="h-9 px-3 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between text-xs text-zinc-300 font-mono">
                <span>Nepalese Rupee</span>
                <span className="text-amber-400 font-bold">NPR (रु)</span>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT METHODS */}
        <div className="bg-[#121214] border border-zinc-800/80 rounded-lg p-5 space-y-3">
          <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Accepted Payment Channels
          </div>

          <div className="flex flex-wrap gap-2.5">
            {ALL_METHODS.map((m) => {
              const isEnabled = acceptedPaymentMethods.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => togglePaymentMethod(m.id)}
                  className={`px-3.5 py-2 rounded-md border text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                    isEnabled
                      ? "bg-amber-500/10 border-amber-500/60 text-amber-300"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
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

        {/* BOTTOM SAVE BAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            className="text-xs h-9 px-4"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-9 px-5"
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};
