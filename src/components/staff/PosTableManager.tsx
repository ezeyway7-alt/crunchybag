import { extractErrorMessage } from "../../lib/api";
import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "../../lib/api";
import { PosSession, usePosCommand, posPath } from "../../lib/posApi";
import { useApp } from "../../context/AppContext";
import { isSameTable } from "../../lib/utils";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Printer,
  QrCode,
  Download,
  ExternalLink,
  Search,
  Users,
  Check,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Zap,
  RefreshCw,
  Layers,
  Copy,
} from "lucide-react";

interface PosTableManagerProps {
  session: PosSession;
  onClose: () => void;
}

interface TableItem {
  id: number;
  table_number: string;
  capacity: number;
  section: string;
  is_active: boolean;
  active_order_id?: number | null;
}

export function PosTableManager({ session, onClose }: PosTableManagerProps) {
  const { addToast, orders } = useApp();
  const command = usePosCommand(session);

  const groups = session.meta?.table_groups || [];
  const rawTables = session.meta?.tables || [];
  const rawInactiveTables = session.meta?.inactive_tables || [];

  // Merge active and inactive tables into a single unified list
  const tables: TableItem[] = useMemo(() => {
    const list: TableItem[] = [
      ...rawTables.map((t: any) => ({
        id: t.id,
        table_number: t.table_number,
        capacity: t.capacity || 4,
        section: t.section || "General",
        is_active: true,
        active_order_id: t.active_order_id,
      })),
      ...rawInactiveTables.map((t: any) => ({
        id: t.id,
        table_number: t.table_number,
        capacity: t.capacity || 4,
        section: t.section || "General",
        is_active: false,
        active_order_id: null,
      })),
    ];
    // Sort tables by natural table number ordering
    return list.sort((a, b) =>
      a.table_number.localeCompare(b.table_number, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [rawTables, rawInactiveTables]);

  // Tab mode for top creation: 'table' or 'group'
  const [createMode, setCreateMode] = useState<"table" | "group">("table");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Table Form State
  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState(4);
  const [newSection, setNewSection] = useState(String(groups[0]?.id || ""));
  const [newActive, setNewActive] = useState(true);
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Inline Editing Table State
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editCapacity, setEditCapacity] = useState(4);
  const [editSection, setEditSection] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Confirmation State
  const [deletingTableId, setDeletingTableId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // QR Modal State
  const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);
  const [qrData, setQrData] = useState<{ image: string; url: string; table_number: string } | null>(null);
  const [qrError, setQrError] = useState("");
  const [qrBusy, setQrBusy] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (qrModalTable) {
          setQrModalTable(null);
        } else if (editingTableId !== null) {
          setEditingTableId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [qrModalTable, editingTableId, onClose]);

  // Keep section selected if default is empty
  useEffect(() => {
    if (!newSection && groups.length > 0) {
      setNewSection(String(groups[0].id));
    }
  }, [groups, newSection]);

  // Fetch QR Code for a table
  const loadQrForTable = async (table: TableItem) => {
    setQrModalTable(table);
    setQrData(null);
    setQrError("");
    setQrBusy(true);
    setCopiedLink(false);

    try {
      const data = await apiClient.get<any>(`/tables/${table.id}/qr/?outlet_id=${session.outlet}`);
      setQrData(data);
    } catch (err: any) {
      setQrError(extractErrorMessage(err));
    } finally {
      setQrBusy(false);
    }
  };

  // Direct Browser Printing of Table QR Ticket
  const handlePrintTableQr = (data: { image: string; url: string; table_number: string }, tableName: string) => {
    const printWindow = window.open("", "_blank", "width=480,height=680");
    if (!printWindow) {
      addToast({
        title: "Print Popup Blocked",
        description: "Please allow popups in your browser to print the table QR ticket.",
        type: "error",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Table QR - ${tableName}</title>
          <style>
            @page { size: auto; margin: 8mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              text-align: center;
              margin: 0;
              padding: 16px;
              color: #111;
              background: #fff;
            }
            .card {
              border: 2px dashed #222;
              border-radius: 12px;
              padding: 24px 20px;
              max-width: 320px;
              margin: 0 auto;
            }
            .brand {
              font-size: 24px;
              font-weight: 900;
              letter-spacing: -0.5px;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .tagline {
              font-size: 10px;
              color: #555;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 16px;
            }
            .table-badge {
              display: inline-block;
              background: #111;
              color: #fff;
              font-size: 20px;
              font-weight: 900;
              padding: 6px 18px;
              border-radius: 6px;
              margin-bottom: 18px;
              letter-spacing: 0.5px;
            }
            .qr-img {
              width: 210px;
              height: 210px;
              display: block;
              margin: 0 auto 16px;
            }
            .instructions {
              font-size: 13px;
              font-weight: 800;
              margin-bottom: 4px;
            }
            .sub {
              font-size: 10.5px;
              color: #666;
              line-height: 1.4;
            }
            .footer-url {
              margin-top: 14px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 9px;
              color: #777;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">Crunchy Bag</div>
            <div class="tagline">Crispy Fried Chicken & Gourmet Smash Burgers</div>
            <div class="table-badge">${tableName}</div>
            <img src="${data.image}" class="qr-img" alt="QR Code for ${tableName}" />
            <div class="instructions">Scan to View Menu & Order</div>
            <div class="sub">Point your phone camera to browse dishes, add combos, and order directly to kitchen!</div>
            <div class="footer-url">${data.url}</div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Submit New Table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    setIsSubmittingTable(true);
    try {
      const result = await command.run("tables/", {
        table_number: newLabel.trim(),
        capacity: Number(newCapacity) || 4,
        group_id: newSection ? Number(newSection) : undefined,
        is_active: newActive,
      });

      if (result) {
        addToast({
          title: "Table Created",
          description: `Table ${newLabel.trim()} successfully added.`,
          type: "success",
        });
        setNewLabel("");
        setNewCapacity(4);
        setIsCreateOpen(false);
        session.refresh();
      }
    } catch (err: any) {
      addToast({
        title: "Failed to Add Table",
        description: extractErrorMessage(err),
        type: "error",
      });
    } finally {
      setIsSubmittingTable(false);
    }
  };

  // Submit New Floor Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setIsSubmittingGroup(true);
    try {
      const result = await command.run("table-groups/", {
        name: newGroupName.trim(),
      });

      if (result) {
        addToast({
          title: "Floor Section Created",
          description: `Section "${newGroupName.trim()}" added successfully.`,
          type: "success",
        });
        setNewGroupName("");
        session.refresh();
      }
    } catch (err: any) {
      addToast({
        title: "Failed to Add Floor",
        description: extractErrorMessage(err),
        type: "error",
      });
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Start Inline Editing for Table
  const handleStartEdit = (table: TableItem) => {
    setEditingTableId(table.id);
    setEditLabel(table.table_number);
    setEditCapacity(table.capacity);
    const matchedGroup = groups.find((g) => g.name === table.section);
    setEditSection(matchedGroup ? String(matchedGroup.id) : String(groups[0]?.id || ""));
    setEditActive(table.is_active);
  };

  // Save Inline Edit
  const handleSaveEdit = async (tableId: number) => {
    if (!editLabel.trim()) return;

    setIsSavingEdit(true);
    try {
      const result = await command.run(`tables/${tableId}/`, {
        table_number: editLabel.trim(),
        capacity: Number(editCapacity) || 4,
        group_id: editSection ? Number(editSection) : undefined,
        is_active: editActive,
      });

      if (result) {
        addToast({
          title: "Table Updated",
          description: `Table ${editLabel.trim()} details saved.`,
          type: "success",
        });
        setEditingTableId(null);
        session.refresh();
      }
    } catch (err: any) {
      addToast({
        title: "Update Failed",
        description: extractErrorMessage(err),
        type: "error",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete / Deactivate Table
  const handleDeleteTable = async (table: TableItem) => {
    setIsDeleting(true);
    try {
      // First attempt hard delete
      try {
        await apiClient.delete(posPath(session.outlet, `tables/${table.id}/`));
      } catch {
        // Fallback: mark is_active as false if foreign keys or permissions restrict DELETE
        await command.run(`tables/${table.id}/`, {
          table_number: table.table_number,
          capacity: table.capacity,
          is_active: false,
        });
      }

      addToast({
        title: "Table Removed",
        description: `Table ${table.table_number} has been deleted or deactivated.`,
        type: "info",
      });
      setDeletingTableId(null);
      session.refresh();
    } catch (err: any) {
      addToast({
        title: "Delete Failed",
        description: extractErrorMessage(err),
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = t.table_number.toLowerCase().includes(q);
        const matchSec = (t.section || "").toLowerCase().includes(q);
        if (!matchNum && !matchSec) return false;
      }
      // 2. Section filter
      if (selectedSectionFilter !== "ALL" && t.section !== selectedSectionFilter) {
        return false;
      }
      // 3. Status filter
      if (statusFilter === "ACTIVE" && !t.is_active) return false;
      if (statusFilter === "INACTIVE" && t.is_active) return false;
      return true;
    });
  }, [tables, searchQuery, selectedSectionFilter, statusFilter]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Sliding Drawer Container: Taking more than half of the screen (62vw / 75vw) */}
      <div className="w-full sm:w-[90vw] md:w-[75vw] lg:w-[62vw] max-w-4xl h-full bg-[#101014] border-l border-zinc-800 text-zinc-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* 1. DRAWER TOP HEADER */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#141418] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
                  Manage Floors & Tables
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2">
                  {tables.length} Total
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Configure tables, assign floor zones, and generate printable QR slips.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => session.refresh()}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:text-white transition-colors cursor-pointer"
              title="Refresh table list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-zinc-900 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-400 border border-zinc-700 hover:border-rose-700 transition-colors cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. ACTIONS & CREATION BAR (Toggleable Accordion / Quick Form) */}
        <div className="border-b border-zinc-800 bg-[#16161B] px-4 sm:px-6 py-2.5 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setCreateMode("table");
                  setIsCreateOpen(createMode === "table" ? !isCreateOpen : true);
                }}
                className={`px-3 py-1 text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCreateOpen && createMode === "table"
                    ? "bg-amber-500 text-black border-amber-500 font-black shadow-xs"
                    : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Table</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateMode("group");
                  setIsCreateOpen(createMode === "group" ? !isCreateOpen : true);
                }}
                className={`px-3 py-1 text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCreateOpen && createMode === "group"
                    ? "bg-amber-500 text-black border-amber-500 font-black shadow-xs"
                    : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Floor Groups ({groups.length})</span>
              </button>
            </div>

            <span className="text-[11px] text-zinc-400 font-medium">
              {tables.filter((t) => t.is_active).length} Active Tables • {groups.length} Floor Zones
            </span>
          </div>

          {/* Collapsible Create Form */}
          {isCreateOpen && (
            <div className="bg-[#121216] border border-zinc-700/80 p-3 animate-in slide-in-from-top-2 duration-150">
              {createMode === "table" ? (
                <form onSubmit={handleCreateTable} className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                    <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                      <Plus className="w-3 h-3" />
                      Create New Dining Table
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-1">
                      <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold uppercase">
                        Table Name / # *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={32}
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="e.g. T-12 or VIP-1"
                        className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold uppercase">
                        Floor / Zone
                      </label>
                      <select
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold uppercase">
                        Seats (Capacity)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-end gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-zinc-300 pb-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newActive}
                          onChange={(e) => setNewActive(e.target.checked)}
                          className="accent-amber-500"
                        />
                        <span>Active</span>
                      </label>

                      <button
                        type="submit"
                        disabled={isSubmittingTable || !newLabel.trim()}
                        className="flex-1 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide disabled:opacity-50 transition-colors shadow-xs"
                      >
                        {isSubmittingTable ? "Adding..." : "Add Table"}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateGroup} className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                    <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      Add Floor Section / Zone
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        maxLength={64}
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g. Ground Floor, Rooftop Terrace, Outdoor Patio"
                        className="w-full bg-zinc-950 border border-zinc-700 px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingGroup || !newGroupName.trim()}
                      className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide disabled:opacity-50 transition-colors shadow-xs shrink-0"
                    >
                      {isSubmittingGroup ? "Saving..." : "Create Floor Section"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* 3. SEARCH & QUICK FILTER BAR */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#121216] border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search table or section..."
                className="w-full bg-zinc-900 border border-zinc-700/80 pl-8 pr-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Zone Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setSelectedSectionFilter("ALL")}
                className={`px-2 py-0.5 text-[11px] font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                  selectedSectionFilter === "ALL"
                    ? "bg-zinc-200 text-black border-zinc-200 font-black"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                All Zones
              </button>

              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedSectionFilter(g.name)}
                  className={`px-2 py-0.5 text-[11px] font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                    selectedSectionFilter === g.name
                      ? "bg-amber-500 text-black border-amber-500 font-black"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-2 py-0.5 text-[10.5px] font-semibold border ${
                statusFilter === "ALL"
                  ? "bg-zinc-700 text-white border-zinc-600"
                  : "bg-zinc-950 text-zinc-500 border-zinc-800"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-2 py-0.5 text-[10.5px] font-semibold border ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-950 text-emerald-400 border-emerald-700"
                  : "bg-zinc-950 text-zinc-500 border-zinc-800"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-2 py-0.5 text-[10.5px] font-semibold border ${
                statusFilter === "INACTIVE"
                  ? "bg-rose-950 text-rose-400 border-rose-700"
                  : "bg-zinc-950 text-zinc-500 border-zinc-800"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* 4. SCROLLABLE ALL CREATED TABLES LIST */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-2">
          {filteredTables.length === 0 ? (
            <div className="py-16 text-center space-y-2 border border-dashed border-zinc-800 p-8">
              <UtensilsCrossed className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-bold text-zinc-400">No tables matching active filters</p>
              <p className="text-[11px] text-zinc-500">
                Click "+ Add Table" above to create dining tables for your outlet.
              </p>
            </div>
          ) : (
            filteredTables.map((table) => {
              const isEditing = editingTableId === table.id;
              const isOccupied = Boolean(table.active_order_id) || Boolean(orders.find(o => isSameTable(o.tableNumber, table.table_number) && !['COMPLETED', 'CANCELLED'].includes(o.status) && !((o.isBilled && o.paymentStatus === 'PAID') || (o as any)._posOrder?.settlement === 'PAID')));

              return (
                <div
                  key={table.id}
                  className={`border transition-all ${
                    isEditing
                      ? "bg-[#181820] border-amber-500 p-3 shadow-md"
                      : "bg-[#141418] hover:bg-[#18181D] border-zinc-800 hover:border-zinc-700 p-2.5 sm:p-3"
                  }`}
                >
                  {isEditing ? (
                    /* INLINE EDIT MODE */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                        <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" />
                          Editing Table: {table.table_number}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">ID: #{table.id}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold uppercase">
                            Table Name / #
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={32}
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold uppercase">
                            Floor Section
                          </label>
                          <select
                            value={editSection}
                            onChange={(e) => setEditSection(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          >
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5 font-bold uppercase">
                            Seats (Capacity)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={editCapacity}
                            onChange={(e) => setEditCapacity(Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                          />
                        </div>

                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-zinc-300 pb-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                              className="accent-amber-500"
                            />
                            <span>Active</span>
                          </label>

                          <div className="flex items-center gap-1 flex-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(table.id)}
                              disabled={isSavingEdit || !editLabel.trim()}
                              className="flex-1 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase disabled:opacity-50"
                            >
                              {isSavingEdit ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTableId(null)}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* NORMAL TABLE ROW DISPLAY */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Table Identifier & Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="px-2.5 py-1 bg-zinc-900 border border-zinc-700/90 text-center shrink-0">
                          <span className="font-mono font-black text-sm text-amber-400 block leading-tight">
                            {table.table_number}
                          </span>
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-zinc-200">
                              {table.table_number}
                            </span>
                            <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 border border-zinc-700/60 font-medium">
                              {table.section || "Main Zone"}
                            </span>
                            <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 font-mono">
                              <Users className="w-2.5 h-2.5 text-zinc-500" />
                              {table.capacity} Seats
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px]">
                            {table.is_active ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="text-zinc-500 flex items-center gap-1 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                Inactive
                              </span>
                            )}

                            {isOccupied && (
                              <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0 font-bold">
                                Occupied Tab
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions (QR / Print, Edit, Delete) */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {/* 1. Generate & Print QR */}
                        <button
                          type="button"
                          onClick={() => loadQrForTable(table)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Generate, view, or print QR code for this table"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>QR & Print</span>
                        </button>

                        {/* 2. Edit / Change Name */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(table)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit table name, capacity, or section"
                        >
                          <Edit2 className="w-3 h-3 text-zinc-400" />
                          <span>Edit</span>
                        </button>

                        {/* 3. Delete Table */}
                        {deletingTableId === table.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-700 px-2 py-0.5 animate-in fade-in">
                            <span className="text-[10px] text-rose-300 font-bold">Confirm delete?</span>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteTable(table)}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black"
                            >
                              {isDeleting ? "..." : "Yes"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTableId(null)}
                              className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingTableId(table.id)}
                            className="p-1.5 bg-zinc-900 hover:bg-rose-950/50 border border-zinc-700 hover:border-rose-700 text-zinc-400 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                            title="Delete or deactivate this table"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 5. FOOTER INFO */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#141418] border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
          <span>Showing {filteredTables.length} of {tables.length} tables</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs cursor-pointer"
          >
            Done / Close
          </button>
        </div>
      </div>

      {/* 6. QR CODE MODAL & PRINT PREVIEW POPUP */}
      {qrModalTable && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#141418] border border-zinc-700 max-w-sm w-full p-4 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase text-white tracking-wide">
                  Table {qrModalTable.table_number} QR Slip
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalTable(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {qrBusy ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                <p className="text-xs text-zinc-400 font-mono">Generating Table QR Code...</p>
              </div>
            ) : qrError ? (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>QR Error</span>
                </div>
                <p className="text-[11px]">{qrError}</p>
                <button
                  type="button"
                  onClick={() => loadQrForTable(qrModalTable)}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-xs text-white"
                >
                  Retry
                </button>
              </div>
            ) : qrData ? (
              <div className="space-y-3 text-center">
                {/* Visual Printable Ticket Card Preview */}
                <div className="bg-white text-black p-4 border border-zinc-300 rounded-sm shadow-sm space-y-2">
                  <div className="font-black text-sm uppercase tracking-tight">Crunchy Bag</div>
                  <div className="text-[9.5px] uppercase text-zinc-600 font-medium tracking-wider">
                    {session.meta?.outlet_name || "Restaurant Table Order"}
                  </div>

                  <div className="inline-block bg-black text-white font-mono font-black text-base px-3 py-0.5 rounded-xs my-1">
                    {qrData.table_number || qrModalTable.table_number}
                  </div>

                  <img
                    src={qrData.image}
                    alt={`QR Code for ${qrData.table_number}`}
                    className="w-44 h-44 mx-auto block bg-white"
                  />

                  <div className="text-[11px] font-bold text-zinc-900 leading-tight">
                    Scan with Phone Camera to Order
                  </div>
                  <div className="text-[9px] text-zinc-600 leading-tight">
                    Browse menu, configure modifiers & dispatch orders directly
                  </div>
                </div>

                {/* Print & Action Buttons */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handlePrintTableQr(qrData, qrData.table_number || qrModalTable.table_number)
                    }
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Print Table QR Ticket</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={qrData.image}
                      download={`table-${qrModalTable.table_number}-qr.svg`}
                      className="py-1 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 text-center"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download File</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (qrData.url) {
                          navigator.clipboard.writeText(qrData.url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                          addToast({
                            title: "Link Copied",
                            description: "Table menu URL copied to clipboard.",
                            type: "success",
                          });
                        }
                      }}
                      className="py-1 px-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedLink ? "Copied!" : "Copy URL"}</span>
                    </button>
                  </div>

                  <a
                    href={qrData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10.5px] text-amber-400 hover:underline pt-1"
                  >
                    <span>Test Table Menu URL</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
