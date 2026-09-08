import React, { useState } from "react";
import {
  Monitor,
  Tv,
  Smartphone,
  Tablet,
  Cpu,
  RefreshCw,
  Power,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Wifi,
  Radio,
  KeyRound,
  Lock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { PlatformDevice } from "../../types";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

export const DevicePortal: React.FC = () => {
  const {
    devices,
    provisionNewDevice,
    rotateDeviceSecret,
    pairedDevice,
    pairDeviceKiosk,
    unpairDeviceKiosk,
    outlets,
    addToast,
  } = useApp();

  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<PlatformDevice["deviceType"]>("KDS_WALL_SCREEN");
  const [deviceName, setDeviceName] = useState("");
  const [pairingCode, setPairingCode] = useState("CR-8921");
  const [isPairingSuccess, setIsPairingSuccess] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  // Kiosk quick pair simulator
  const [kioskStationName, setKioskStationName] = useState("Durbarmarg Takeaway Kiosk #1");
  const [kioskSecretInput, setKioskSecretInput] = useState("sec_live_9f82k1");

  const regenerateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "CR-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPairingCode(code);
    setIsPairingSuccess(false);
    setGeneratedSecret(null);
  };

  const handlePairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = provisionNewDevice(
      deviceName || `Station ${deviceType}`,
      deviceType,
      outlets[0].id
    );
    setGeneratedSecret(result.oneTimeSecret);
    setIsPairingSuccess(true);
  };

  const getDeviceIcon = (type: PlatformDevice["deviceType"]) => {
    switch (type) {
      case "POS_TERMINAL":
        return <Tablet className="h-5 w-5 text-amber-500" />;
      case "KDS_WALL_SCREEN":
        return <Tv className="h-5 w-5 text-sky-400" />;
      case "RECEIPT_KIOSK":
        return <Smartphone className="h-5 w-5 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-[#0A0A0B] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#121214] border-b border-zinc-200 dark:border-zinc-800 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
                Hardware Device Fleet & KDS Terminals
              </h2>
              <Badge variant="brand" size="sm">
                Edge Provisioning
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Secure local network device pairing, heartbeat telemetry, and remote terminal recovery
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            className="font-bold text-xs"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              regenerateCode();
              setIsPairModalOpen(true);
            }}
          >
            Pair New Terminal / Screen
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Active Kiosk Mode Indicator if Paired */}
        {pairedDevice ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-bold">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  Local Terminal Paired & Synchronized: {pairedDevice.name}
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                  Branch: {pairedDevice.outletName} • IP: {pairedDevice.ipAddress} • Heartbeat: 0s ago
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-emerald-500/50 hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-500"
              onClick={unpairDeviceKiosk}
            >
              Unpair Station
            </Button>
          </div>
        ) : (
          /* Quick Connect Station Simulator */
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Radio className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>Station Ready for Local Kiosk Pairing</span>
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Pair this browser instance as an edge POS terminal or self-ordering counter.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="font-bold text-xs"
              onClick={() =>
                pairDeviceKiosk({
                  outletCode: outlets[0].code,
                  secretToken: kioskSecretInput,
                  stationName: kioskStationName,
                })
              }
            >
              Pair Station Instantly
            </Button>
          </div>
        )}

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {devices.map((device) => {
            const isOnline = device.status === "ONLINE";

            return (
              <div
                key={device.id}
                className="p-5 bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {getDeviceIcon(device.deviceType)}
                  </div>
                  <Badge variant={isOnline ? "success" : "danger"} size="sm" dot pulseDot={isOnline}>
                    {device.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                    {device.name}
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {device.outletName} • {device.ipAddress}
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl space-y-1 text-xs text-zinc-500 font-mono">
                  <div className="flex justify-between">
                    <span>Token:</span>
                    <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">
                      {device.tokenSecretMasked}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heartbeat:</span>
                    <span className="text-emerald-500">{device.lastHeartbeatSecondsAgo}s ago</span>
                  </div>
                </div>

                {/* Remote Actions */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <button
                    onClick={() => rotateDeviceSecret(device.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-amber-500 cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Rotate Token</span>
                  </button>

                  <span className="text-[11px] text-zinc-400 font-mono">
                    Paired {device.pairedAt}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device Pairing Modal */}
      <Modal
        isOpen={isPairModalOpen}
        onClose={() => {
          setIsPairModalOpen(false);
          setIsPairingSuccess(false);
        }}
        title="Pair Hardware Terminal"
        description="Register a new touchscreen, kitchen display, or customer self-service kiosk"
        maxWidth="md"
      >
        {isPairingSuccess ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                Hardware Device Linked!
              </h4>
              <p className="text-xs text-zinc-500">
                Terminal token has been generated. Store this one-time secret securely.
              </p>
            </div>

            {generatedSecret && (
              <div className="p-3 bg-black text-amber-400 font-mono text-xs rounded-xl break-all">
                {generatedSecret}
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              className="w-full font-bold"
              onClick={() => {
                setIsPairModalOpen(false);
                setIsPairingSuccess(false);
                setDeviceName("");
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePairSubmit} className="space-y-4 py-2">
            {/* 6-char Activation Display Code */}
            <div className="p-4 bg-zinc-900 text-white rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                One-Time Hardware Activation Code
              </span>
              <div className="font-mono text-3xl font-black text-amber-400 tracking-widest py-1">
                {pairingCode}
              </div>
              <p className="text-[11px] text-zinc-400">
                Enter this code on the physical hardware screen upon initial boot.
              </p>
            </div>

            <Input
              label="Device Name / Station Identifier"
              placeholder="e.g. Counter POS Terminal 1"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Device Hardware Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: "KDS_WALL_SCREEN", label: "KDS Screen" },
                  { type: "POS_TERMINAL", label: "POS Counter" },
                  { type: "RECEIPT_KIOSK", label: "Kiosk Terminal" },
                ].map((role) => (
                  <button
                    key={role.type}
                    type="button"
                    onClick={() => setDeviceType(role.type as PlatformDevice["deviceType"])}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-colors cursor-pointer ${
                      deviceType === role.type
                        ? "bg-amber-500/15 border-amber-500 text-amber-500"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" type="button" onClick={() => setIsPairModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="font-bold">
                Confirm & Sync Hardware
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
