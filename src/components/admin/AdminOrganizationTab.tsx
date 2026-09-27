import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  FileCheck,
  CreditCard,
  Percent,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Store,
  Phone,
  Mail,
  MapPin,
  Globe,
  Save,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
  Receipt,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { PaymentMethod } from "../../types";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { organizationApi, extractErrorMessage } from "../../lib/api";

const ALL_METHODS: { id: PaymentMethod; label: string; sub: string; icon: string }[] = [
  { id: "ESEWA", label: "eSewa Wallet", sub: "Merchant QR & Web Gateway", icon: "🟢" },
  { id: "FONEPAY_QR", label: "Fonepay QR", sub: "Interbank Mobile Banking QR", icon: "🔴" },
  { id: "CASH_ON_PICKUP", label: "Cash on Counter", sub: "Physical Currency Bills", icon: "💵" },
  { id: "CARD", label: "POS Terminal", sub: "Visa, Mastercard & SCT Cards", icon: "💳" },
  { id: "WALLET", label: "Khalti / IME Pay", sub: "Alternative Digital Wallets", icon: "🟣" },
];

export const AdminOrganizationTab: React.FC = () => {
  const { orgSettings, updateOrgSettings, currentOutlet, addActivityLog, addToast } = useApp();
  const { authOutlet, authUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scoped branch display
  const activeBranchName = authOutlet?.name || currentOutlet?.name || "Durbar Marg HQ";
  const activeBranchCode = authOutlet?.branch_code || authOutlet?.code || currentOutlet?.code || "CRU-01";
  const branchDisplayName = `${activeBranchName} (${activeBranchCode})`;

  // Organization settings local states initialized from orgSettings
  const [brandName, setBrandName] = useState(orgSettings.brandName || "Crunchy");
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
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  const [apiStatusMessage, setApiStatusMessage] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);

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
        setApiStatusMessage({
          text: "Synchronized with live backend at crunchybag.com",
          type: "success",
        });
        if (isManual) {
          addToast({
            title: "Settings Refreshed",
            description: "Loaded latest organization profile & fiscal configuration from backend.",
            type: "success",
          });
        }
      }
    } catch (err) {
      const errMsg = extractErrorMessage(err);
      if (isManual) {
        addToast({
          title: "Remote Sync Failed",
          description: errMsg,
          type: "warning",
        });
      }
    } finally {
      setIsFetchingRemote(false);
    }
  };

  // Initial fetch from backend on mount
  useEffect(() => {
    fetchRemoteSettings(false);
  }, []);

  // Sync state if orgSettings changes externally
  useEffect(() => {
    setBrandName(orgSettings.brandName || "Crunchy");
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
        title: "Invalid File Type",
        description: "Please choose an image file (PNG, JPG, WEBP, or SVG).",
        type: "error",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "File Too Large",
        description: "Logo image should be under 5MB for optimal POS performance.",
        type: "warning",
      });
      return;
    }

    setSelectedLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogoPreviewUrl(dataUrl);
      setLogoUrl(dataUrl); // Also set in local state so preview components pick it up
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
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
    setBrandName(orgSettings.brandName || "Crunchy");
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
      title: "Settings Reverted",
      description: "Organization fields restored to last saved state.",
      type: "info",
    });
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setApiStatusMessage(null);

    const updatedSettings = {
      brandName: brandName.trim(),
      tagline: tagline.trim(),
      legalEntity: legalEntity.trim(),
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

    // Always update client state & localStorage first for instant responsiveness
    updateOrgSettings(updatedSettings);

    // Attempt to persist to live backend
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
      setApiStatusMessage({
        text: "Organization and logo saved to server database",
        type: "success",
      });
    } catch (err) {
      const errMsg = extractErrorMessage(err);
      if (errMsg.includes("404") || errMsg.includes("not found")) {
        setApiStatusMessage({
          text: "Organization saved locally in application storage.",
          type: "info",
        });
      } else {
        setApiStatusMessage({
          text: `Save status: ${errMsg}`,
          type: "warning",
        });
      }
    } finally {
      // Record audit log entry
      if (addActivityLog) {
        addActivityLog(
          "ORGANIZATION_UPDATE",
          `Updated company profile for ${brandName.trim()} (PAN: ${panNumber.trim()})`,
          authUser?.name || "Branch Admin"
        );
      }

      setIsSaving(false);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3500);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* -------------------------------------------------------------
          TOP HIGH-DENSITY HEADER & CONTEXT BAR
      ------------------------------------------------------------- */}
      <div className="bg-[#121214] border border-zinc-800 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100">
              Organization & Fiscal Profile
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Superadmin Provisioned
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Central company identity, legal entity registration, logo asset management, and Inland Revenue Department (IRD) Nepal fiscal policies.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchRemoteSettings(true)}
            disabled={isFetchingRemote}
            title="Fetch latest organization settings from backend"
            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isFetchingRemote ? "animate-spin" : ""}`} />
            <span>{isFetchingRemote ? "Syncing..." : "Sync Backend"}</span>
          </button>

          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-amber-500" />
            <div className="text-left">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-bold">
                Operating Branch
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {branchDisplayName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API sync notice if applicable */}
      {apiStatusMessage && (
        <div
          className={`px-3 py-2 text-[11px] rounded border flex items-center justify-between gap-2 ${
            apiStatusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : apiStatusMessage.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-sky-500/10 border-sky-500/30 text-sky-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{apiStatusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setApiStatusMessage(null)}
            className="text-[10px] opacity-70 hover:opacity-100 uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          TOP HIGH-DENSITY METRIC STRIP (COMPLIANCE & FISCAL STATUS)
      ------------------------------------------------------------- */}
      <div className="bg-[#101012] border border-zinc-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px] rounded-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-zinc-400">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-500">Registered PAN:</span>
            <span className="font-mono font-bold text-zinc-100">{panNumber || "Not Set"}</span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-zinc-500">Legal Entity:</span>
            <span className="font-bold text-zinc-200 truncate max-w-[200px]" title={legalEntity}>
              {legalEntity || brandName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span className="text-zinc-500">Fiscal Tax:</span>
            <span className="font-mono font-bold text-sky-400">
              VAT {vatRatePercent}% • SC {serviceChargePercent}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-zinc-500">Counter Gateways:</span>
            <span className="font-mono font-bold text-zinc-200">
              {acceptedPaymentMethods.length} / {ALL_METHODS.length} Active
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-500">Currency:</span>
            <span className="font-mono font-bold text-emerald-400">NPR (रु)</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MAIN EDITABLE FORM (ORGANIZATION DETAILS UPDATABLE BY ADMIN)
      ------------------------------------------------------------- */}
      <form onSubmit={handleSaveOrg} className="space-y-4">
        {/* CARD 1: CORPORATE & BRAND IDENTITY + DIRECT LOGO UPLOAD */}
        <div className="bg-[#121214] border border-zinc-800 p-4 space-y-4 rounded-sm">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
                Corporate Identity & Brand Assets
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">
              Values synced with billing headers and customer invoices
            </span>
          </div>

          {/* SECTION A: DIRECT LOGO UPLOAD COMPONENT (NO URL REQUIRED) */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                Brand Logo (Direct File Upload)
              </label>
              <button
                type="button"
                onClick={() => setShowUrlFallback(!showUrlFallback)}
                className="text-[10px] text-amber-400 hover:underline font-medium cursor-pointer"
              >
                {showUrlFallback ? "Hide URL Option" : "Or use image URL"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
              {/* Logo Preview Avatar */}
              <div className="md:col-span-3 flex flex-col items-center justify-center p-3 bg-[#101012] border border-zinc-800 rounded text-center">
                <div className="w-20 h-20 rounded-lg bg-zinc-800 border-2 border-dashed border-zinc-700 overflow-hidden flex items-center justify-center shadow-inner relative group">
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt="Brand Logo Preview"
                      className="w-full h-full object-contain p-1"
                      onError={() => setLogoPreviewUrl("")}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 p-2">
                      <ImageIcon className="w-6 h-6 stroke-1 mb-1" />
                      <span className="text-[9px]">No Logo</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono mt-1.5">
                  {selectedLogoFile ? selectedLogoFile.name : logoPreviewUrl ? "Current Active Logo" : "Upload PNG/JPG"}
                </span>
                {selectedLogoFile && (
                  <span className="text-[9px] text-amber-400 font-mono">
                    ({(selectedLogoFile.size / 1024).toFixed(0)} KB • Ready to save)
                  </span>
                )}
              </div>

              {/* Drag & Drop Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`md:col-span-9 p-4 border-2 border-dashed rounded flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none ${
                  isDragOver
                    ? "border-amber-500 bg-amber-500/10 text-amber-300"
                    : "border-zinc-700/80 hover:border-amber-500/60 bg-zinc-900/40 hover:bg-zinc-900/80 text-zinc-400"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-zinc-200">
                  Click to select brand logo, or drag & drop image file here
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Supports PNG, JPG, WEBP or SVG up to 5MB. Automatically optimized for receipt thermal printers.
                </div>

                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-black rounded cursor-pointer"
                  >
                    Select Image File
                  </button>

                  {logoPreviewUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLogo();
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-400 text-zinc-400 border border-zinc-700 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Optional URL input toggle */}
            {showUrlFallback && (
              <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 whitespace-nowrap">External CDN URL:</span>
                <Input
                  value={logoUrl}
                  onChange={(e) => {
                    setLogoUrl(e.target.value);
                    setLogoPreviewUrl(e.target.value);
                  }}
                  placeholder="https://.../brand-logo.png"
                  className="text-xs font-mono flex-1 h-7"
                />
              </div>
            )}
          </div>

          {/* 4-COLUMN ROW 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Brand Name <span className="text-amber-500">*</span>
              </label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Crunchy Bag"
                required
                className="text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Tagline / Slogan
              </label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Crispy Fast Casual Dining"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Registered PAN / VAT Number <span className="text-amber-500">*</span>
              </label>
              <Input
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="9-digit IRD PAN"
                required
                className="text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Legal Entity Name <span className="text-amber-500">*</span>
              </label>
              <Input
                value={legalEntity}
                onChange={(e) => setLegalEntity(e.target.value)}
                placeholder="e.g. Crunchy Hospitality & Foods Pvt. Ltd."
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Website URL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Official Website URL
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://crunchybag.com"
                  className="text-xs font-mono pl-8"
                />
              </div>
            </div>

            {/* Quick Live Preview Mockup Box */}
            <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded bg-black border border-zinc-700 shrink-0 flex items-center justify-center overflow-hidden">
                  {logoPreviewUrl ? (
                    <img src={logoPreviewUrl} alt="" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <Store className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="truncate">
                  <span className="text-[11px] font-bold text-white block truncate">
                    {brandName || "Crunchy"}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono">
                    PAN: {panNumber || "609823145"}
                  </span>
                </div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded shrink-0">
                Receipt Ready
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: FISCAL TAX COMPLIANCE (NEPAL IRD) */}
        <div className="bg-[#121214] border border-zinc-800 p-4 space-y-3.5 rounded-sm">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
                Inland Revenue Department (IRD) Fiscal Tax Rates
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">
              Computed on all customer checkout orders and billing receipts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Standard VAT Rate (%) <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={vatRatePercent}
                  onChange={(e) => setVatRatePercent(e.target.value)}
                  required
                  className="text-xs font-mono font-bold pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                  %
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Standard Nepal VAT is 13.0%
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Restaurant Service Charge (%)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={serviceChargePercent}
                  onChange={(e) => setServiceChargePercent(e.target.value)}
                  className="text-xs font-mono font-bold pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                  %
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Optional hospitality fee (typically 0% or 10%)
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                System Currency
              </label>
              <div className="h-9 px-3 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300">Nepalese Rupee</span>
                <span className="font-mono font-bold text-amber-400">NPR (रु)</span>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Default currency for invoices and daybook
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: CENTRAL CONTACT & HEADQUARTERS */}
        <div className="bg-[#121214] border border-zinc-800 p-4 space-y-3.5 rounded-sm">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
                Central Headquarters & Corporate Contact
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">
              Printed on official vendor purchase orders and audit reports
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Central Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+977 1-XXXXXXX"
                  className="text-xs font-mono pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Official Support / Billing Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="admin@crunchybag.com"
                  className="text-xs pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Headquarters Registered Address
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={headquartersAddress}
                  onChange={(e) => setHeadquartersAddress(e.target.value)}
                  placeholder="e.g. Durbar Marg, Kathmandu, Nepal"
                  className="text-xs pl-8"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: ACCEPTED PAYMENT GATEWAYS & COUNTER MODES */}
        <div className="bg-[#121214] border border-zinc-800 p-4 space-y-3.5 rounded-sm">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
                Accepted Payment Gateways & Counter Modes
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              Toggle channels available to cashiers at checkout
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {ALL_METHODS.map((m) => {
              const isEnabled = acceptedPaymentMethods.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => togglePaymentMethod(m.id)}
                  className={`p-3 border rounded-sm cursor-pointer flex flex-col justify-between transition-all select-none ${
                    isEnabled
                      ? "bg-amber-500/10 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/30"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-500 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.icon}</span>
                      <span className="text-xs font-bold text-zinc-100">{m.label}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        isEnabled
                          ? "bg-amber-500 border-amber-500 text-black"
                          : "border-zinc-700 bg-zinc-800"
                      }`}
                    >
                      {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2 leading-tight">
                    {m.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* -------------------------------------------------------------
            BOTTOM ACTION & SAVE CONTROLS
        ------------------------------------------------------------- */}
        <div className="bg-[#121214] border border-zinc-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-3 z-10 shadow-xl rounded-sm">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            {isSavedRecently ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Organization profile saved successfully!
              </span>
            ) : (
              <span>
                Changes take effect across the POS, customer billing receipts, and daybook closing.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Reset
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs px-4"
            >
              {isSaving ? "Saving..." : "Save Organization Settings"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
