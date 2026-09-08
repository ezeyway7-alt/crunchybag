import React, { useState } from "react";
import {
  Flame,
  Clock,
  Check,
  Maximize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { KdsColumn } from "../../types";
import { formatTimer } from "../../lib/utils";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";

export const KDSPortal: React.FC = () => {
  const {
    kdsTickets,
    bumpKdsTicket,
    kdsSoundEnabled,
    setKdsSoundEnabled,
    currentOutlet,
  } = useApp();

  const [selectedStation, setSelectedStation] = useState<string>("ALL");
  const [completedItemIds, setCompletedItemIds] = useState<Record<string, boolean>>({});

  const stations = [
    { id: "ALL", label: "All Stations" },
    { id: "Grill & Fryer 1", label: "Grill & Fryer" },
    { id: "Burger Station", label: "Burger Line" },
    { id: "Kitchen Main Line", label: "Main Line" },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleItemCheck = (ticketId: string, itemId: string) => {
    const key = `${ticketId}-${itemId}`;
    setCompletedItemIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredTickets = kdsTickets.filter((ticket) => {
    if (selectedStation === "ALL") return true;
    return ticket.station.toLowerCase().includes(selectedStation.toLowerCase());
  });

  const columns: { column: KdsColumn; title: string; color: string }[] = [
    { column: "QUEUED", title: "Incoming Orders", color: "border-amber-500 bg-amber-500/10 text-amber-400" },
    { column: "PREPARING", title: "In Preparation", color: "border-sky-500 bg-sky-500/10 text-sky-400" },
    { column: "READY", title: "Ready for Pickup", color: "border-emerald-500 bg-emerald-500/10 text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans">
      {/* Top Station Bar */}
      <header className="bg-[#121214] border-b border-zinc-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500" />
            <h2 className="text-base font-black tracking-wider text-white uppercase">
              KITCHEN DISPLAY • {currentOutlet.name}
            </h2>
          </div>
          <span className="text-zinc-700">|</span>
          <span className="font-mono text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 font-bold">
            {filteredTickets.length} ACTIVE
          </span>
        </div>

        {/* Station Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {stations.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStation(s.id)}
              className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                selectedStation === s.id
                  ? "bg-amber-500 text-black border-amber-500"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Sound & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKdsSoundEnabled(!kdsSoundEnabled)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
            title="Toggle Audio Chime"
          >
            {kdsSoundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-zinc-500" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Kanban Multi-Column Swimlanes */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[768px] h-full items-start">
          {columns.map((col) => {
            const columnTickets = filteredTickets.filter((t) => t.column === col.column);

            return (
              <div
                key={col.column}
                className="flex flex-col bg-[#121214] border border-zinc-800 overflow-hidden min-h-[600px]"
              >
                {/* Swimlane Column Header */}
                <div className={`p-3.5 border-b border-zinc-800 flex items-center justify-between ${col.color}`}>
                  <h3 className="font-black text-xs uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 bg-black/60 font-black text-white border border-zinc-700">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Ticket Cards Stream */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                  {columnTickets.length > 0 ? (
                    columnTickets.map((ticket) => {
                      const isOverdue = ticket.elapsedSeconds > 15 * 60;
                      const isWarning = ticket.elapsedSeconds > 10 * 60 && !isOverdue;

                      return (
                        <div
                          key={ticket.id}
                          className={`p-4 border transition-all relative bg-[#18181B] ${
                            isOverdue
                              ? "border-rose-500 shadow-rose-500/10 shadow-md"
                              : isWarning
                              ? "border-amber-500"
                              : "border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          {/* Ticket Header */}
                          <div className="flex items-start justify-between pb-2.5 border-b border-zinc-800">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-lg font-black text-white">
                                  #{ticket.orderNumber}
                                </span>
                                <Badge
                                  variant="brand"
                                  size="sm"
                                  className="font-extrabold uppercase"
                                >
                                  {ticket.fulfillmentType}
                                </Badge>
                              </div>
                              <p className="text-xs text-zinc-400 mt-0.5">
                                Customer: <strong className="text-zinc-200">{ticket.customerName}</strong>
                              </p>
                            </div>

                            {/* Elapsed Timer */}
                            <div
                              className={`flex items-center gap-1.5 px-2 py-1 font-mono text-xs font-black ${
                                isOverdue
                                  ? "bg-rose-500 text-white animate-pulse"
                                  : isWarning
                                  ? "bg-amber-500 text-black"
                                  : "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              <span>{formatTimer(ticket.elapsedSeconds)}</span>
                            </div>
                          </div>

                          {/* Item Rows */}
                          <div className="divide-y divide-zinc-800/60 my-2 space-y-1.5">
                            {ticket.items.map((item) => {
                              const isChecked = !!completedItemIds[`${ticket.id}-${item.id}`];

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => toggleItemCheck(ticket.id, item.id)}
                                  className={`pt-1.5 flex items-start justify-between gap-2 cursor-pointer select-none ${
                                    isChecked ? "opacity-35 line-through" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div
                                      className={`w-4 h-4 border flex items-center justify-center shrink-0 mt-0.5 ${
                                        isChecked
                                          ? "bg-emerald-500 border-emerald-500 text-black"
                                          : "border-zinc-600"
                                      }`}
                                    >
                                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                    </div>

                                    <div>
                                      <span className="font-black text-sm text-white">
                                        {item.quantity}x {item.productName}
                                      </span>
                                      <span className="ml-1 text-xs text-amber-400 font-semibold">
                                        ({item.variantName})
                                      </span>

                                      {item.modifiers.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                          {item.modifiers.map((m, idx) => (
                                            <span
                                              key={idx}
                                              className="text-[11px] font-bold uppercase text-amber-300 bg-amber-500/10 px-1.5 py-0.5 inline-block mr-1"
                                            >
                                              + {m}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-zinc-800">
                            {col.column === "QUEUED" && (
                              <Button
                                size="md"
                                variant="primary"
                                className="w-full font-black text-xs uppercase tracking-wider"
                                onClick={() => bumpKdsTicket(ticket.id)}
                              >
                                Start Cooking
                              </Button>
                            )}

                            {col.column === "PREPARING" && (
                              <Button
                                size="md"
                                variant="primary"
                                className="w-full font-black text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black"
                                onClick={() => bumpKdsTicket(ticket.id)}
                              >
                                Mark Ready
                              </Button>
                            )}

                            {col.column === "READY" && (
                              <Button
                                size="md"
                                variant="secondary"
                                className="w-full font-black text-xs uppercase tracking-wider bg-zinc-800 text-zinc-300"
                                onClick={() => bumpKdsTicket(ticket.id)}
                              >
                                Clear / Handed Over
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-zinc-600 space-y-1">
                      <Flame className="h-6 w-6 stroke-[1.2]" />
                      <p className="text-xs font-bold uppercase tracking-wider">
                        No tickets in lane
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
