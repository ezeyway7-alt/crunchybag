import React, { useState, useMemo } from "react";
import {
  Building2,
  FileCheck,
  CreditCard,
  Percent,
  CheckCircle2,
  Edit2,
  Plus,
  Phone,
  Mail,
  MapPin,
  Globe,
  Sliders,
  Store,
  Trash2,
  Clock,
  Check,
  Search,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { PaymentMethod, Outlet } from "../../types";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

const ALL_METHODS: { id: PaymentMethod; label: string; sub: string }[] = [
  { id: "ESEWA", label: "eSewa Wallet", sub: "Merchant QR & Web Gateway" },
  { id: "FONEPAY_QR", label: "Fonepay QR", sub: "Interbank Mobile Banking QR" },
  { id: "CASH_ON_PICKUP", label: "Cash on Counter", sub: "Physical Currency Bills" },
  { id: "CARD", label: "POS Terminal", sub: "Visa, Mastercard & SCT Card" },
  { id: "WALLET", label: "Khalti / IME Pay", sub: "Digital Wallet Gateways" },
];

export const AdminOrganizationTab: React.FC = () => {
  const { orgSettings, updateOrgSettings, outlets, createOutlet, updateOutlet, addToast } = useApp();

  // Organization settings local states
  const [brandName, setBrandName] = useState(orgSettings.brandName);
  const [tagline, setTagline] = useState(orgSettings.tagline);
  const [legalEntity, setLegalEntity] = useState(orgSettings.legalEntity);
  const [panNumber, setPanNumber] = useState(orgSettings.panNumber);
  const [logoUrl, setLogoUrl] = useState(orgSettings.logoUrl);
  const [websiteUrl, setWebsiteUrl] = useState(orgSettings.websiteUrl);
  const [contactEmail, setContactEmail] = useState(orgSettings.contactEmail);
  const [contactPhone, setContactPhone] = useState(orgSettings.contactPhone);
  const [headquartersAddress, setHeadquartersAddress] = useState(orgSettings.headquartersAddress);
  const [vatRatePercent, setVatRatePercent] = useState(orgSettings.vatRatePercent.toString());
  const [serviceChargePercent, setServiceChargePercent] = useState(
    orgSettings.serviceChargePercent.toString()
  );
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState<PaymentMethod[]>(
    orgSettings.acceptedPaymentMethods
  );

  // Outlet filter & modal state
  const [outletSearch, setOutletSearch] = useState("");
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [outletName, setOutletName] = useState("");
  const [outletCode, setOutletCode] = useState("");
  const [outletAddress, setOutletAddress] = useState("");
  const [outletPhone, setOutletPhone] = useState("");
  const [outletPrepTime, setOutletPrepTime] = useState("15");
  const [outletIsOpen, setOutletIsOpen] = useState(true);

  const togglePaymentMethod = (method: PaymentMethod) => {
    setAcceptedPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgSettings({
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
    });
    addToast({
      title: "Settings Saved",
      description: "Organization identity, tax rates and payment methods updated.",
      type: "success",
    });
  };

  const openCreateOutletModal = () => {
    setEditingOutlet(null);
    setOutletName("");
    setOutletCode(`CRU-0${outlets.length + 1}`);
    setOutletAddress("Lakeside, Ward 6, Pokhara, Nepal");
    setOutletPhone("+977 61-460111");
    setOutletPrepTime("15");
    setOutletIsOpen(true);
    setIsOutletModalOpen(true);
  };

  const openEditOutletModal = (o: Outlet) => {
    setEditingOutlet(o);
    setOutletName(o.name);
    setOutletCode(o.code);
    setOutletAddress(o.address);
    setOutletPhone(o.phone);
    setOutletPrepTime(o.estimatedPrepTimeMin ? o.estimatedPrepTimeMin.toString() : "15");
    setOutletIsOpen(o.isOpen);
    setIsOutletModalOpen(true);
  };

  const handleSaveOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletName.trim() || !outletCode.trim()) return;

    if (editingOutlet) {
      updateOutlet(editingOutlet.id, {
        name: outletName.trim(),
        code: outletCode.trim().toUpperCase(),
        address: outletAddress.trim(),
        phone: outletPhone.trim(),
        estimatedPrepTimeMin: parseInt(outletPrepTime) || 15,
        isOpen: outletIsOpen,
      });
      addToast({
        title: "Branch Updated",
        description: `Saved details for branch ${outletName.trim()}.`,
        type: "success",
      });
    } else {
      createOutlet({
        name: outletName.trim(),
        code: outletCode.trim().toUpperCase(),
        address: outletAddress.trim(),
        phone: outletPhone.trim(),
        isOpen: outletIsOpen,
        estimatedPrepTimeMin: parseInt(outletPrepTime) || 15,
        serviceModes: ["DINE_IN", "TAKEAWAY", "DELIVERY"],
      });
      addToast({
        title: "Branch Created",
        description: `Registered new branch ${outletName.trim()}.`,
        type: "success",
      });
    }

    setIsOutletModalOpen(false);
  };

  const filteredOutlets = useMemo(() => {
    if (!outletSearch.trim()) return outlets;
    const q = outletSearch.toLowerCase();
    return outlets.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.phone.includes(q)
    );
  }, [outlets, outletSearch]);

  const openOutletsCount = outlets.filter((o) => o.isOpen).length;

  return (
    <div className="space-y-4 text-xs">
      {/* -------------------------------------------------------------
          TOP HIGH-DENSITY LABEL-VALUE METRIC STRIP
      ------------------------------------------------------------- */}
      <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Total Outlets:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{outlets.length}</span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Open & Taking Orders:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {openOutletsCount} / {outlets.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Registered PAN:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{panNumber}</span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Tax Compliance:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              VAT {vatRatePercent}% • SC {serviceChargePercent}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Active Payment Gateways:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {acceptedPaymentMethods.length} / {ALL_METHODS.length}
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SECTION 1: OUTLETS & BRANCHES MANAGER
      ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
              Multi-Branch Outlets ({outlets.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={outletSearch}
                onChange={(e) => setOutletSearch(e.target.value)}
                placeholder="Filter branches..."
                className="h-7 pl-7 pr-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <Button
              size="sm"
              onClick={openCreateOutletModal}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] h-7 px-2.5"
            >
              + Add Branch Outlet
            </Button>
          </div>
        </div>

        {/* Dense Table of Outlets */}
        <div className="border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
                <th className="p-2.5">Branch Name</th>
                <th className="p-2.5 text-center">Code</th>
                <th className="p-2.5">Address</th>
                <th className="p-2.5">Contact Phone</th>
                <th className="p-2.5 text-center">Avg Prep Time</th>
                <th className="p-2.5 text-center">Store Status</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredOutlets.map((o) => (
                <tr key={o.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="p-2.5 font-bold text-zinc-900 dark:text-white">
                    {o.name}
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                    {o.code}
                  </td>
                  <td className="p-2.5 text-zinc-600 dark:text-zinc-400 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-xs">{o.address}</span>
                    </div>
                  </td>
                  <td className="p-2.5 font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{o.phone}</span>
                    </div>
                  </td>
                  <td className="p-2.5 text-center font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                    {o.estimatedPrepTimeMin || 15} mins
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        updateOutlet(o.id, { isOpen: !o.isOpen });
                        addToast({
                          title: o.isOpen ? "Branch Closed" : "Branch Opened",
                          description: `${o.name} status updated.`,
                          type: "info",
                        });
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border cursor-pointer ${
                        o.isOpen
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {o.isOpen ? "Open Now" : "Closed"}
                    </button>
                  </td>
                  <td className="p-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditOutletModal(o)}
                      className="px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                    >
                      Edit Branch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------------------------------------------------
          SECTION 2: ORGANIZATION IDENTITY & TAX COMPLIANCE
      ------------------------------------------------------------- */}
      <form onSubmit={handleSaveOrg} className="space-y-4">
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                Legal Entity & Fiscal Compliance
              </span>
            </div>

            <Button
              type="submit"
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] h-7 px-3"
            >
              Save Organization Settings
            </Button>
          </div>

          {/* 4-COLUMN ROW 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Brand Name *
              </label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                className="text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Tagline
              </label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Registered PAN Number *
              </label>
              <Input
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                required
                className="text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Legal Entity Name *
              </label>
              <Input
                value={legalEntity}
                onChange={(e) => setLegalEntity(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* 4-COLUMN ROW 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Central Contact Phone
              </label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Official Email
              </label>
              <Input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                VAT Rate (%) *
              </label>
              <Input
                type="number"
                value={vatRatePercent}
                onChange={(e) => setVatRatePercent(e.target.value)}
                className="text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Service Charge (%)
              </label>
              <Input
                type="number"
                value={serviceChargePercent}
                onChange={(e) => setServiceChargePercent(e.target.value)}
                className="text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* 4-COLUMN ROW 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Headquarters Address
              </label>
              <Input
                value={headquartersAddress}
                onChange={(e) => setHeadquartersAddress(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Website URL
              </label>
              <Input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Brand Logo URL
              </label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
            SECTION 3: PAYMENT GATEWAY CHANNELS
        ------------------------------------------------------------- */}
        <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
              Accepted Payment Gateways & Counter Modes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {ALL_METHODS.map((m) => {
              const isEnabled = acceptedPaymentMethods.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => togglePaymentMethod(m.id)}
                  className={`p-2.5 border cursor-pointer flex items-start gap-2 transition-all select-none ${
                    isEnabled
                      ? "bg-amber-500/10 border-amber-500 text-zinc-900 dark:text-white"
                      : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-400 opacity-70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => {}}
                    className="mt-0.5 accent-amber-500 cursor-pointer shrink-0"
                  />
                  <div>
                    <div className="text-[11px] font-black">{m.label}</div>
                    <div className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {m.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>

      {/* -------------------------------------------------------------
          MODAL: CREATE / EDIT BRANCH OUTLET (WIDER 4-COLUMN LAYOUT)
      ------------------------------------------------------------- */}
      <Modal
        isOpen={isOutletModalOpen}
        onClose={() => setIsOutletModalOpen(false)}
        title={editingOutlet ? `Edit Branch: ${editingOutlet.name}` : "Create New Branch Outlet"}
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveOutlet} className="space-y-4 text-xs">
          {/* 4-COLUMN ROW 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Branch Name *
              </label>
              <Input
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                placeholder="e.g. Crunchy Pokhara Lakeside"
                required
                className="text-xs font-bold"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Branch Code *
              </label>
              <Input
                value={outletCode}
                onChange={(e) => setOutletCode(e.target.value)}
                placeholder="e.g. PKR-01"
                required
                className="text-xs font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Direct Phone *
              </label>
              <Input
                value={outletPhone}
                onChange={(e) => setOutletPhone(e.target.value)}
                placeholder="+977 61-XXXXXX"
                required
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Avg Kitchen Prep (mins)
              </label>
              <Input
                type="number"
                value={outletPrepTime}
                onChange={(e) => setOutletPrepTime(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* 4-COLUMN ROW 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-3">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Street Address *
              </label>
              <Input
                value={outletAddress}
                onChange={(e) => setOutletAddress(e.target.value)}
                placeholder="e.g. Baidam 6, Lakeside, Pokhara"
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Operational Status
              </label>
              <div className="flex items-center h-9">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                  <input
                    type="checkbox"
                    checked={outletIsOpen}
                    onChange={(e) => setOutletIsOpen(e.target.checked)}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span>{outletIsOpen ? "Open Now" : "Temporarily Closed"}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOutletModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
            >
              {editingOutlet ? "Save Branch" : "Register Branch"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
