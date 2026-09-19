import React, { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Shield,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  Key,
  Trash2,
  Edit2,
  DollarSign,
  Calendar,
  Search,
  Check,
  X,
  Sliders,
  Sparkles,
  Lock,
  Layers,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Employee, AdminSubPage } from "../../types";
import { formatNPR } from "../../lib/utils";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Modal } from "../common/Modal";

interface PageDefinition {
  id: AdminSubPage;
  label: string;
  category: "operations" | "financial" | "management";
  description: string;
}

const ALL_PAGES: PageDefinition[] = [
  { id: "pos", label: "POS & Orders", category: "operations", description: "Take orders, dine-in & takeaway" },
  { id: "kitchen", label: "Kitchen KDS", category: "operations", description: "Kitchen ticket queue & prep status" },
  { id: "inventory", label: "Inventory Stock", category: "operations", description: "Monitor raw materials & stock" },
  { id: "menu", label: "Menu Catalog", category: "operations", description: "Modifiers, prices & 86 items" },
  { id: "daybook", label: "Shift Daybook", category: "financial", description: "Cash in/out, expenses & closing" },
  { id: "purchases", label: "Purchases & Invoices", category: "financial", description: "Vendor bills & raw purchases" },
  { id: "loyalty", label: "Loyalty & Khata", category: "financial", description: "Visit offers & credit balances" },
  { id: "analytics", label: "Reports & KPIs", category: "financial", description: "Sales analytics & settlement logs" },
  { id: "employees", label: "Staff & Access", category: "management", description: "Team accounts & role access" },
  { id: "outlets", label: "Branch Outlets", category: "management", description: "Multi-branch store settings" },
  { id: "organization", label: "Fiscal & PAN", category: "management", description: "VAT rates, entity & gateways" },
  { id: "logs", label: "Activity Logs", category: "management", description: "Chronological operational audit" },
];

export const AdminEmployeesTab: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, outlets, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedOutlet, setSelectedOutlet] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Employee["role"]>("CASHIER");
  const [title, setTitle] = useState("");
  const [assignedOutletId, setAssignedOutletId] = useState(outlets[0]?.id || "out-01");
  const [salaryMonthly, setSalaryMonthly] = useState("35000");
  const [isActive, setIsActive] = useState(true);
  const [assignedPages, setAssignedPages] = useState<AdminSubPage[]>([
    "pos",
    "daybook",
    "loyalty",
  ]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setName("");
    setEmail("");
    setPhone("+977 98");
    setRole("CASHIER");
    setTitle("Counter Cashier & Shift Lead");
    setAssignedOutletId(outlets[0]?.id || "out-01");
    setSalaryMonthly("35000");
    setIsActive(true);
    setAssignedPages(["pos", "daybook", "loyalty"]);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setRole(emp.role);
    setTitle(emp.title);
    setAssignedOutletId(emp.assignedOutletId);
    setSalaryMonthly(emp.salaryMonthly ? emp.salaryMonthly.toString() : "0");
    setIsActive(emp.isActive);
    setAssignedPages(emp.assignedPages || []);
    setIsCreateModalOpen(true);
  };

  const togglePageAssignment = (pageId: AdminSubPage) => {
    setAssignedPages((prev) =>
      prev.includes(pageId) ? prev.filter((p) => p !== pageId) : [...prev, pageId]
    );
  };

  // Quick Preset Handlers
  const applyPreset = (preset: "cashier" | "kitchen" | "inventory" | "manager" | "all" | "clear") => {
    switch (preset) {
      case "cashier":
        setAssignedPages(["pos", "daybook", "loyalty"]);
        break;
      case "kitchen":
        setAssignedPages(["kitchen", "inventory"]);
        break;
      case "inventory":
        setAssignedPages(["inventory", "purchases", "daybook"]);
        break;
      case "manager":
        setAssignedPages(["pos", "kitchen", "inventory", "purchases", "daybook", "menu", "loyalty", "analytics"]);
        break;
      case "all":
        setAssignedPages(ALL_PAGES.map((p) => p.id));
        break;
      case "clear":
        setAssignedPages([]);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        title: title.trim(),
        assignedOutletId,
        salaryMonthly: parseFloat(salaryMonthly) || 0,
        isActive,
        assignedPages,
      });
      addToast({
        title: "Employee Updated",
        description: `Permissions and credentials saved for ${name.trim()}.`,
        type: "success",
      });
    } else {
      addEmployee({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        title: title.trim(),
        assignedOutletId,
        salaryMonthly: parseFloat(salaryMonthly) || 0,
        assignedPages,
        isActive,
      });
      addToast({
        title: "Employee Created",
        description: `New user account created for ${name.trim()}.`,
        type: "success",
      });
    }

    setIsCreateModalOpen(false);
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedRole !== "ALL" && emp.role !== selectedRole) return false;
      if (selectedOutlet !== "ALL" && emp.assignedOutletId !== selectedOutlet) return false;
      if (selectedStatus === "ACTIVE" && !emp.isActive) return false;
      if (selectedStatus === "INACTIVE" && emp.isActive) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          emp.name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.phone.includes(q) ||
          emp.title.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [employees, selectedRole, selectedOutlet, selectedStatus, searchQuery]);

  // Metrics
  const totalStaff = employees.length;
  const activeStaff = employees.filter((e) => e.isActive).length;
  const totalPayroll = employees.reduce((sum, e) => sum + (e.salaryMonthly || 0), 0);
  const coveredOutlets = new Set(employees.map((e) => e.assignedOutletId)).size;

  const roleBadges: Record<Employee["role"], { bg: string; text: string; border: string }> = {
    SUPER_ADMIN: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/30" },
    STORE_MANAGER: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30" },
    CASHIER: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30" },
    KITCHEN_SUPERVISOR: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/30" },
    INVENTORY_MANAGER: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30" },
    FLOOR_STAFF: { bg: "bg-zinc-500/10", text: "text-zinc-600 dark:text-zinc-400", border: "border-zinc-500/30" },
  };

  return (
    <div className="space-y-3.5">
      {/* -------------------------------------------------------------
          TOP HIGH-DENSITY LABEL-VALUE METRIC STRIP
      ------------------------------------------------------------- */}
      <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Total Staff:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{totalStaff}</span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active Accounts:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {activeStaff} <span className="text-[10px] text-zinc-400 font-normal">({totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0}%)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Monthly Payroll:</span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {formatNPR(totalPayroll)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>Branches Staffed:</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
              {coveredOutlets} / {outlets.length}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          onClick={openCreateModal}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] h-7 px-2.5"
        >
          + Create User Account
        </Button>
      </div>

      {/* -------------------------------------------------------------
          SIMPLE TEXT FILTERS DIRECTLY ABOVE DATATABLE
      ------------------------------------------------------------- */}
      <div className="bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, phone or title..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span>Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="STORE_MANAGER">Store Manager</option>
              <option value="CASHIER">Cashier</option>
              <option value="KITCHEN_SUPERVISOR">Kitchen Supervisor</option>
              <option value="INVENTORY_MANAGER">Inventory Manager</option>
              <option value="FLOOR_STAFF">Floor Staff</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span>Branch:</span>
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Branches</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {(searchQuery || selectedRole !== "ALL" || selectedOutlet !== "ALL" || selectedStatus !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedRole("ALL");
                setSelectedOutlet("ALL");
                setSelectedStatus("ALL");
              }}
              className="text-[11px] text-rose-500 hover:underline px-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          Showing: <strong>{filteredEmployees.length}</strong> / {employees.length} Users
        </div>
      </div>

      {/* -------------------------------------------------------------
          HIGH-DENSITY DATATABLE OF EMPLOYEES & PERMISSIONS
      ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[10px]">
              <th className="p-2.5">Staff Member</th>
              <th className="p-2.5 text-center">System Role</th>
              <th className="p-2.5">Assigned Branch</th>
              <th className="p-2.5">Contact Details</th>
              <th className="p-2.5 text-right">Monthly Salary</th>
              <th className="p-2.5">Authorized Permissions & Pages</th>
              <th className="p-2.5 text-center">Status</th>
              <th className="p-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-zinc-400 text-xs">
                  No staff accounts matched your filters.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => {
                const outletName = outlets.find((o) => o.id === emp.assignedOutletId)?.name || "All Outlets";
                const badgeStyle = roleBadges[emp.role] || roleBadges.FLOOR_STAFF;

                return (
                  <tr key={emp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <span>{emp.name}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{emp.title}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                        {emp.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="p-2.5 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{outletName}</span>
                      </div>
                    </td>

                    <td className="p-2.5">
                      <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{emp.phone}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5 truncate max-w-[170px]">
                        <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{emp.email}</span>
                      </div>
                    </td>

                    <td className="p-2.5 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                      {emp.salaryMonthly ? formatNPR(emp.salaryMonthly) : "—"}
                    </td>

                    <td className="p-2.5 max-w-xs">
                      <div className="flex flex-wrap items-center gap-1">
                        {emp.assignedPages.map((page) => (
                          <span
                            key={page}
                            className="text-[9px] font-bold px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          >
                            {page}
                          </span>
                        ))}
                        {emp.assignedPages.length === 0 && (
                          <span className="text-[10px] text-zinc-400 italic">No access granted</span>
                        )}
                      </div>
                    </td>

                    <td className="p-2.5 text-center">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                          emp.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 border-zinc-300 dark:border-zinc-700"
                        }`}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="p-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(emp)}
                          className="px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                        >
                          Edit Access
                        </button>
                        {emp.role !== "SUPER_ADMIN" && (
                          <button
                            type="button"
                            onClick={() => {
                              deleteEmployee(emp.id);
                              addToast({
                                title: "Employee Deleted",
                                description: `Removed account for ${emp.name}.`,
                                type: "info",
                              });
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                            title="Delete staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------------------------------------------------
          MODAL: CREATE / EDIT EMPLOYEE (WIDER 4-COLUMN LAYOUT)
      ------------------------------------------------------------- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingEmployee ? `Edit Permissions: ${editingEmployee.name}` : "Create Staff Account & Module Access"}
        maxWidth="5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 4-COLUMN ROW 1: CORE CREDENTIALS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Full Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Karki"
                required
                className="text-xs font-bold"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Job Title / Designation *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Head Cashier & Shift Lead"
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                System Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Employee["role"])}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
                <option value="STORE_MANAGER">STORE MANAGER</option>
                <option value="CASHIER">CASHIER</option>
                <option value="KITCHEN_SUPERVISOR">KITCHEN SUPERVISOR</option>
                <option value="INVENTORY_MANAGER">INVENTORY MANAGER</option>
                <option value="FLOOR_STAFF">FLOOR STAFF</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Assigned Branch Outlet *
              </label>
              <select
                value={assignedOutletId}
                onChange={(e) => setAssignedOutletId(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold focus:outline-none focus:border-amber-500"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4-COLUMN ROW 2: CONTACT & COMPLIANCE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Work Email *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@crunchy.com"
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Contact Phone *
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
                required
                className="text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Monthly Salary (NPR)
              </label>
              <Input
                type="number"
                value={salaryMonthly}
                onChange={(e) => setSalaryMonthly(e.target.value)}
                className="text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Account Status
              </label>
              <div className="flex items-center h-9">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span>{isActive ? "Active & Authorized" : "Disabled (No Login)"}</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 3: ASSIGNED OPERATIONAL MODULES & PERMISSIONS (4-COLUMN GRID) */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                  Assigned Operational Pages & Permissions ({assignedPages.length} of {ALL_PAGES.length})
                </span>
              </div>

              {/* Quick Role Presets */}
              <div className="flex items-center flex-wrap gap-1 text-[10px]">
                <span className="text-zinc-400 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset("cashier")}
                  className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black font-bold border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  Cashier
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("kitchen")}
                  className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black font-bold border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  Kitchen
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("inventory")}
                  className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black font-bold border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  Inventory
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("manager")}
                  className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black font-bold border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  Manager
                </button>
                <span className="text-zinc-400">|</span>
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  className="text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  All
                </button>
                <span className="text-zinc-400">|</span>
                <button
                  type="button"
                  onClick={() => applyPreset("clear")}
                  className="text-zinc-400 hover:underline font-bold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* 4-COLUMN RESPONSIVE GRID FOR PERMISSIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              {ALL_PAGES.map((page) => {
                const isChecked = assignedPages.includes(page.id);
                return (
                  <label
                    key={page.id}
                    className={`flex items-start gap-2 p-2 border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-amber-500/10 border-amber-500/50 text-zinc-900 dark:text-zinc-100"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePageAssignment(page.id)}
                      className="mt-0.5 accent-amber-500 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-black truncate">{page.label}</div>
                      <div className="text-[9px] text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-tight mt-0.5">
                        {page.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
            >
              {editingEmployee ? "Save Changes" : "Register Employee"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
