import React, { useState, useEffect } from "react";
import {
  Building2,
  FileCheck,
  CreditCard,
  Percent,
  CheckCircle2,
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
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { PaymentMethod } from "../../types";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

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

  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if orgSettings changes externally
  useEffect(() => {
    setBrandName(orgSettings.brandName || "Crunchy");
    setTagline(orgSettings.tagline || "");
    setLegalEntity(orgSettings.legalEntity || "");
    setPanNumber(orgSettings.panNumber || "");
    setLogoUrl(orgSettings.logoUrl || "");
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

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated = {
      brandName: brandName.trim(),
      tagline: tagline.trim(),
      legalEntity: legalEntity.trim(),
      panNumber: panNumber.trim(),
      logoUrl: logoUrl.trim(),
      websiteUrl: websiteUrl.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      headquartersAddress: headquartersAddress.trim(),
      vatRatePercent: parseFloat(vatRatePercent) || 0,
      serviceChargePercent: parseFloat(serviceChargePercent) || 0,
      acceptedPaymentMethods,
    };

    updateOrgSettings(updated);

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
    setTimeout(() => setIsSavedRecently(false), 3000);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* -------------------------------------------------------------
          TOP HIGH-DENSITY HEADER & CONTEXT BAR
      ------------------------------------------------------------- */}
      <div className="bg-[#121214] border border-zinc-800 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
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
            Central company identity, legal entity registration, and Inland Revenue Department (IRD) Nepal fiscal policies.
          </p>
        </div>

        {/* Read-only Scoped Branch Badge */}
        <div className="flex items-center gap-2 shrink-0">
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

      {/* -------------------------------------------------------------
          TOP HIGH-DENSITY METRIC STRIP (COMPLIANCE & FISCAL STATUS)
      ------------------------------------------------------------- */}
      <div className="bg-[#101012] border border-zinc-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px]">
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
        {/* CARD 1: CORPORATE & BRAND IDENTITY */}
        <div className="bg-[#121214] border border-zinc-800 p-4 space-y-3.5 rounded-sm">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
                Corporate Identity & Legal Entity
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">
              Values synced with billing headers and customer invoices
            </span>
          </div>

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

          {/* Logo & Website with live visual thumbnail */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Official Brand Logo URL
              </label>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded bg-zinc-800 border border-zinc-700 shrink-0 overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Brand Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Building2 className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://.../logo.png"
                  className="text-xs font-mono flex-1"
                />
              </div>
            </div>

            <div>
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
