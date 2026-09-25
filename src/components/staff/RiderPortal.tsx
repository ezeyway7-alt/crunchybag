import React, { useState } from "react";
import {
  Bike,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  DollarSign,
  Navigation,
  LogOut,
  AlertCircle,
  PackageCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { formatNPR } from "../../lib/utils";

interface RiderDelivery {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  landmark: string;
  status: "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED";
  paymentMethod: string;
  codAmount: number;
  itemsCount: number;
  assignedTime: string;
}

export const RiderPortal: React.FC = () => {
  const { currentOutlet, addToast } = useApp();
  const { authUser, logout } = useAuth();

  const [deliveries, setDeliveries] = useState<RiderDelivery[]>([
    {
      id: "del-1",
      orderNumber: "CR-8922",
      customerName: "Suman Maharjan",
      customerPhone: "+977 9841234567",
      address: "Lazimpat, Near Embassy of France, House #14",
      landmark: "Opposite Standard Chartered ATM",
      status: "READY_FOR_PICKUP",
      paymentMethod: "CASH_ON_DELIVERY",
      codAmount: 1450,
      itemsCount: 3,
      assignedTime: "5 mins ago",
    },
    {
      id: "del-2",
      orderNumber: "CR-8917",
      customerName: "Pooja Gurung",
      customerPhone: "+977 9812987654",
      address: "Baluwatar, Prime Minister Residence Lane",
      landmark: "Next to Bakery Cafe",
      status: "OUT_FOR_DELIVERY",
      paymentMethod: "ESEWA",
      codAmount: 0,
      itemsCount: 2,
      assignedTime: "18 mins ago",
    },
    {
      id: "del-3",
      orderNumber: "CR-8910",
      customerName: "Aayush Shrestha",
      customerPhone: "+977 9801122334",
      address: "Naxal, Bhagawati Bahal",
      landmark: "Near Police Headquarter gate",
      status: "DELIVERED",
      paymentMethod: "CASH_ON_DELIVERY",
      codAmount: 890,
      itemsCount: 1,
      assignedTime: "40 mins ago",
    },
  ]);

  const handleUpdateDelivery = (id: string, nextStatus: RiderDelivery["status"]) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: nextStatus } : d))
    );
    addToast({
      title: "Delivery Status Updated",
      description: `Order marked as ${nextStatus.replace(/_/g, " ")}`,
      type: "success",
    });
  };

  const activeCount = deliveries.filter((d) => d.status !== "DELIVERED").length;
  const totalCashCollected = deliveries
    .filter((d) => d.status === "DELIVERED" && d.paymentMethod === "CASH_ON_DELIVERY")
    .reduce((acc, d) => acc + d.codAmount, 0);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800 bg-[#121214] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Rider Dispatch Portal</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                Live Runner
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {currentOutlet.name} • Active Orders: {activeCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-zinc-200">
              {authUser?.name || authUser?.username || "Dispatch Rider"}
            </p>
            <p className="text-[10px] text-zinc-400">{authUser?.role || "RIDER"}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-zinc-300 hover:text-rose-400 text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Metrics Banner */}
      <div className="bg-[#18181b] border-b border-zinc-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-zinc-500 block text-[10px]">Active Deliveries</span>
            <span className="font-bold text-white text-sm">{activeCount} Pending</span>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">Cash In Hand (COD)</span>
            <span className="font-bold text-amber-400 text-sm">{formatNPR(totalCashCollected)}</span>
          </div>
        </div>
        <div className="text-zinc-400 text-[11px]">
          Target Delivery Window: <span className="text-zinc-200 font-bold">25-35 mins</span>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="flex-1 p-4 max-w-4xl w-full mx-auto space-y-4">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Assigned Deliveries Queue
        </h2>

        <div className="space-y-3">
          {deliveries.map((del) => {
            const isPickedUp = del.status === "OUT_FOR_DELIVERY";
            const isDelivered = del.status === "DELIVERED";

            return (
              <div
                key={del.id}
                className={`p-4 bg-[#121214] border transition-all ${
                  isDelivered
                    ? "border-zinc-800 opacity-60"
                    : isPickedUp
                    ? "border-sky-500/50 shadow-lg"
                    : "border-amber-500/50 shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      #{del.orderNumber}
                    </span>
                    <span className="text-xs font-semibold text-white">{del.customerName}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 font-mono">
                      {del.itemsCount} Items
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${
                      del.status === "READY_FOR_PICKUP"
                        ? "bg-amber-500/20 text-amber-300"
                        : del.status === "OUT_FOR_DELIVERY"
                        ? "bg-sky-500/20 text-sky-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {del.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-zinc-300">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-white">{del.address}</p>
                        <p className="text-[11px] text-zinc-400">Landmark: {del.landmark}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Payment Method:</span>
                      <span className="font-bold text-zinc-200">{del.paymentMethod}</span>
                    </div>
                    {del.paymentMethod === "CASH_ON_DELIVERY" && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Collect Cash (COD):</span>
                        <span className="font-bold text-amber-400 font-mono text-sm">
                          {formatNPR(del.codAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${del.customerPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-colors"
                      >
                        <Phone className="w-3 h-3 text-amber-400" />
                        <span>Call Customer</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!isDelivered && (
                  <div className="pt-3 border-t border-zinc-800 flex gap-2">
                    {del.status === "READY_FOR_PICKUP" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateDelivery(del.id, "OUT_FOR_DELIVERY")}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Pick Up Package & Start Trip</span>
                      </button>
                    )}
                    {del.status === "OUT_FOR_DELIVERY" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateDelivery(del.id, "DELIVERED")}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Confirm Delivered {del.codAmount > 0 ? `& Collect ${formatNPR(del.codAmount)}` : ""}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
