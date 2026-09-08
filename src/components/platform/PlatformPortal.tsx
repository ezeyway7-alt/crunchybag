import React, { useState } from "react";
import {
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  Plus,
  Edit2,
  FileText,
  Download,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Outlet, AuditEvent } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";
import { Drawer } from "../common/Drawer";

export const PlatformPortal: React.FC = () => {
  const { outlets, auditLogs, currentOutlet, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<"outlets" | "audit">("outlets");
  const [selectedOutletForConfig, setSelectedOutletForConfig] = useState<Outlet | null>(null);
  const [isDeployOutletModalOpen, setIsDeployOutletModalOpen] = useState(false);
  const [newOutletName, setNewOutletName] = useState("");
  const [newOutletAddress, setNewOutletAddress] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  const handleDeployOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      title: "New Outlet Provisioned",
      description: `Branch "${newOutletName || "Pokhara Lakeside"}" provisioned with tax code PK-01 and PAN rules.`,
      type: "success",
    });
    setIsDeployOutletModalOpen(false);
    setNewOutletName("");
    setNewOutletAddress("");
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.outletName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.entityType.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const exportAuditReport = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crunchy-statutory-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    addToast({
      title: "Audit Log Exported",
      description: "Statutory IRD-compliant JSON audit record downloaded.",
      type: "info",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-[#0A0A0B] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Platform Header */}
      <div className="bg-white dark:bg-[#121214] border-b border-zinc-200 dark:border-zinc-800 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
                Platform Multi-Tenant Governance
              </h2>
              <Badge variant="brand" size="sm">
                Kathmandu HQ
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Enterprise management of branches, IRD fiscal compliance, and security event logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              className="font-bold text-xs"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsDeployOutletModalOpen(true)}
            >
              Provision New Outlet
            </Button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-zinc-100 dark:border-zinc-800/60 pt-1 pb-1">
          <button
            onClick={() => setActiveTab("outlets")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "outlets"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-white"
            }`}
          >
            Registered Outlets ({outlets.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-white"
            }`}
          >
            Statutory Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === "outlets" ? (
          <div className="space-y-6">
            {/* High-level KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Total Branches</span>
                <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                  {outlets.length} Active
                </p>
                <span className="text-[11px] text-emerald-500 font-medium">100% Operational Ingress</span>
              </div>
              <div className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Gross Daily Throughput</span>
                <p className="text-2xl font-black text-amber-500 font-mono mt-1">
                  {formatNPR(384200)}
                </p>
                <span className="text-[11px] text-zinc-400 font-medium">+18.4% vs last week</span>
              </div>
              <div className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Statutory PAN/VAT Rate</span>
                <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                  13.00%
                </p>
                <span className="text-[11px] text-emerald-500 font-medium">Verified Inland Revenue (IRD)</span>
              </div>
              <div className="p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Avg Prep Latency</span>
                <p className="text-2xl font-black text-zinc-900 dark:text-white font-mono mt-1">
                  12.4 mins
                </p>
                <span className="text-[11px] text-emerald-500 font-medium">Well within 15m threshold</span>
              </div>
            </div>

            {/* Outlets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="p-5 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-zinc-900 dark:text-white">
                          {outlet.name}
                        </h4>
                        <span className="font-mono text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                          {outlet.code}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{outlet.address}, {outlet.city}</span>
                      </p>
                    </div>
                    <Badge variant={outlet.isOpen ? "success" : "neutral"} size="sm" dot>
                      {outlet.isOpen ? "Online" : "Closed"}
                    </Badge>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>PAN / Tax Registration:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">601928471</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operating Windows:</span>
                      <span className="font-semibold">{outlet.operatingHours}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Kitchen Prep:</span>
                      <span className="font-semibold">{outlet.estimatedPrepTimeMin} Minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-400 font-mono">{outlet.phone}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                      onClick={() => setSelectedOutletForConfig(outlet)}
                    >
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Audit Logs View */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by action, actor, or entity..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={exportAuditReport}
              >
                Export IRD Audit JSON
              </Button>
            </div>

            {/* Audit Table */}
            <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-[#18181B] border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">Action Event</th>
                      <th className="px-5 py-3.5">Actor (Role)</th>
                      <th className="px-5 py-3.5">Outlet</th>
                      <th className="px-5 py-3.5">Entity Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="px-5 py-3 text-zinc-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-800 dark:text-zinc-200 font-sans font-semibold">
                          {log.actorName} ({log.actorRole})
                        </td>
                        <td className="px-5 py-3 text-zinc-400 font-sans">
                          {log.outletName}
                        </td>
                        <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300 font-sans">
                          <Badge variant="outline" size="sm">
                            {log.entityType}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Outlet Configuration Drawer */}
      <Drawer
        isOpen={!!selectedOutletForConfig}
        onClose={() => setSelectedOutletForConfig(null)}
        title={`Configure Outlet: ${selectedOutletForConfig?.name}`}
        description={`Branch Code: ${selectedOutletForConfig?.code}`}
      >
        {selectedOutletForConfig && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addToast({
                title: "Outlet Configurations Saved",
                description: "Opening hours and fiscal VAT updated.",
                type: "success",
              });
              setSelectedOutletForConfig(null);
            }}
            className="space-y-4 text-xs"
          >
            <Input label="Branch Name" defaultValue={selectedOutletForConfig.name} required />
            <Input label="Street Address" defaultValue={selectedOutletForConfig.address} required />
            <Input label="Operating Hours" defaultValue={selectedOutletForConfig.operatingHours} required />
            <Input
              label="PAN Tax Registration Number"
              defaultValue="601928471"
              required
            />
            <Input
              label="Estimated Average Prep Time (Minutes)"
              type="number"
              defaultValue={selectedOutletForConfig.estimatedPrepTimeMin}
              required
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" onClick={() => setSelectedOutletForConfig(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="font-bold">
                Save Outlet Rules
              </Button>
            </div>
          </form>
        )}
      </Drawer>

      {/* Deploy Outlet Modal */}
      <Modal
        isOpen={isDeployOutletModalOpen}
        onClose={() => setIsDeployOutletModalOpen(false)}
        title="Provision New Crunchy Outlet"
        description="Deploy a new restaurant branch into the multi-tenant cluster"
      >
        <form onSubmit={handleDeployOutlet} className="space-y-4 py-2">
          <Input
            label="Outlet Display Name"
            placeholder="e.g. Crunchy Pokhara Lakeside"
            value={newOutletName}
            onChange={(e) => setNewOutletName(e.target.value)}
            required
          />
          <Input
            label="Physical Address & Geofence"
            placeholder="e.g. Baidam-6, Lakeside, Pokhara"
            value={newOutletAddress}
            onChange={(e) => setNewOutletAddress(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Auto Branch Code" defaultValue="PK-01" disabled />
            <Input label="Default PAN Rate" defaultValue="13% Statutory VAT" disabled />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsDeployOutletModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="font-bold">
              Provision Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
