import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Hash,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { AdminSubPage, Employee } from "../../types";
import { formatNPR } from "../../lib/utils";
import { extractErrorMessage } from "../../lib/api";
import {
  employeeApi,
  EmployeeMetrics,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from "../../lib/employeeApi";
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
  // Operations
  { id: "pos", label: "POS & Orders", category: "operations", description: "Take orders, dine-in & takeaway counter" },
  { id: "kitchen", label: "Kitchen KDS", category: "operations", description: "Kitchen ticket queue & prep status" },
  { id: "inventory", label: "Inventory Stock", category: "operations", description: "Monitor raw materials & stock alerts" },
  { id: "menu", label: "Menu Catalog", category: "operations", description: "Modifiers, base prices & 86 items" },
  // Financial
  { id: "daybook", label: "Shift Daybook", category: "financial", description: "Cash in/out, register balance & closing" },
  { id: "purchases", label: "Purchases & Invoices", category: "financial", description: "Vendor bills & raw purchases" },
  { id: "loyalty", label: "Loyalty & Khata", category: "financial", description: "Visit offers & customer credit ledgers" },
  { id: "analytics", label: "Reports & KPIs", category: "financial", description: "Sales analytics & settlement logs" },
  // Management
  { id: "employees", label: "Staff & Access", category: "management", description: "Team accounts, roles & credentials" },
  { id: "outlets", label: "Branch Outlets", category: "management", description: "Multi-branch store configuration" },
  { id: "organization", label: "Fiscal & PAN", category: "management", description: "VAT rates, entity & payment gateways" },
  { id: "logs", label: "Activity Logs", category: "management", description: "Chronological operational audit trail" },
];

export const AdminEmployeesTab: React.FC = () => {
  const { addToast, currentOutlet } = useApp();
  const { authOutlet } = useAuth();

  // Branch is auto-scoped by logged-in admin's outlet
  const activeBranchName = authOutlet?.name || currentOutlet?.name || "Durbar Marg HQ";
  const activeBranchCode = authOutlet?.branch_code || authOutlet?.code || currentOutlet?.code || "CRU-01";
  const activeBranchId = authOutlet?.id || currentOutlet?.id || "out-01";
  const branchDisplayName = `${activeBranchName} (${activeBranchCode})`;

  // Data & loading states
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [metrics, setMetrics] = useState<EmployeeMetrics>({
    total_staff: 0,
    active_staff: 0,
    active_percentage: 0,
    total_monthly_payroll: 0,
    branches_staffed: 1,
    total_branches: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters (NO branch filter as it is auto-scoped)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Quick POS PIN login tester modal
  const [isPinTestModalOpen, setIsPinTestModalOpen] = useState(false);
  const [testPin, setTestPin] = useState("");
  const [isPinTesting, setIsPinTesting] = useState(false);
  const [pinTestResult, setPinTestResult] = useState<string | null>(null);

  // Add / Edit Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+977 ");
  const [role, setRole] = useState<string>("CASHIER");
  const [title, setTitle] = useState("");
  const [salaryMonthly, setSalaryMonthly] = useState("35000");
  const [isActive, setIsActive] = useState(true);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [assignedPages, setAssignedPages] = useState<AdminSubPage[]>([
    "pos",
    "daybook",
    "loyalty",
  ]);

  // Fetch employees from live backend API
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await employeeApi.list({
        search: debouncedSearch,
        role: selectedRole,
        status: selectedStatus,
      });

      setEmployeeList(data.results);
      setMetrics(data.metrics);
    } catch (err: any) {
      const errorMsg = extractErrorMessage(err);
      setApiError(errorMsg);
      console.warn("Failed to fetch employees from backend:", err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setName("");
    setEmail("");
    setPhone("+977 98");
    setRole("CASHIER");
    setTitle("Counter Cashier & Shift Lead");
    setSalaryMonthly("35000");
    setIsActive(true);
    setTemporaryPassword("CrunchyStaff2026!");
    setShowPassword(false);
    setPinCode(String(Math.floor(1000 + Math.random() * 9000)));
    setShowPin(false);
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
    setSalaryMonthly(
      emp.salaryMonthly !== undefined
        ? emp.salaryMonthly.toString()
        : emp.salary_monthly
        ? String(emp.salary_monthly)
        : "0"
    );
    setIsActive(emp.isActive ?? emp.is_active ?? true);
    setTemporaryPassword("");
    setShowPassword(false);
    setPinCode(emp.pin_code || "");
    setShowPin(false);
    setAssignedPages(emp.assignedPages || emp.assigned_pages || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        const updatePayload: UpdateEmployeePayload = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          title: title.trim(),
          salary_monthly: String(parseFloat(salaryMonthly) || 0),
          assigned_pages: assignedPages,
          is_active: isActive,
        };
        if (pinCode.trim()) {
          updatePayload.pin_code = pinCode.trim();
        }
        if (temporaryPassword.trim()) {
          updatePayload.temporary_password = temporaryPassword.trim();
        }

        const updated = await employeeApi.update(editingEmployee.id, updatePayload);

        // Optimistically update list
        setEmployeeList((prev) =>
          prev.map((e) => (e.id === editingEmployee.id ? { ...e, ...updated } : e))
        );

        addToast({
          title: "Employee Updated",
          description: `Permissions and credentials saved for ${name.trim()}.`,
          type: "success",
        });
      } else {
        const createPayload: CreateEmployeePayload = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          title: title.trim(),
          salary_monthly: String(parseFloat(salaryMonthly) || 0),
          assigned_pages: assignedPages,
          is_active: isActive,
          temporary_password: temporaryPassword.trim() || "CrunchyStaff2026!",
          pin_code: pinCode.trim() || "1234",
        };

        const created = await employeeApi.create(createPayload);

        // Optimistically prepend to list
        setEmployeeList((prev) => [created, ...prev]);

        addToast({
          title: "Team Member Added",
          description: `Account created for ${name.trim()} bound to ${branchDisplayName}.`,
          type: "success",
        });
      }

      setIsCreateModalOpen(false);
      // Refresh list to sync updated server metrics
      fetchEmployees();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      addToast({
        title: "Action Failed",
        description: msg,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (emp.role === "SUPER_ADMIN") {
      addToast({
        title: "Cannot Delete Super Admin",
        description: "Root SUPER_ADMIN account cannot be removed from system.",
        type: "warning",
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${emp.name} from the branch roster?`)) {
      return;
    }

    try {
      await employeeApi.delete(emp.id);
      setEmployeeList((prev) => prev.filter((e) => e.id !== emp.id));
      addToast({
        title: "Employee Removed",
        description: `Removed account for ${emp.name}.`,
        type: "info",
      });
      fetchEmployees();
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      addToast({
        title: "Delete Failed",
        description: msg,
        type: "error",
      });
    }
  };

  const handleTestPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPin.trim()) return;

    setIsPinTesting(true);
    setPinTestResult(null);

    try {
      const res = await employeeApi.quickPinLogin({
        outlet_id: activeBranchId,
        pin_code: testPin.trim(),
      });
      setPinTestResult(`Verified: Logged in as ${res.employee?.name || "Staff"} (${res.employee?.role || "Cashier"})`);
      addToast({
        title: "PIN Validated",
        description: `Terminal switched to ${res.employee?.name || "Cashier"}.`,
        type: "success",
      });
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      setPinTestResult(`Verification Failed: ${msg}`);
    } finally {
      setIsPinTesting(false);
    }
  };

  const roleBadges: Record<string, { bg: string; text: string; border: string }> = {
    SUPER_ADMIN: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    STORE_MANAGER: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    CASHIER: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
    KITCHEN_SUPERVISOR: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
    INVENTORY_MANAGER: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    FLOOR_STAFF: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30" },
  };

  return (
    <div className="space-y-3.5">
      {/* -------------------------------------------------------------
          1. TOP KPI METRICS BAR (WITH READ-ONLY AUTO-SCOPED OUTLET BADGE)
      ------------------------------------------------------------- */}
      <div className="bg-[#121214] border border-zinc-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-[11px] rounded-none">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-zinc-400">
          {/* Total Staff */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-zinc-500">Total Staff:</span>
            <span className="font-mono font-bold text-zinc-100">{metrics.total_staff}</span>
          </div>

          {/* Active Staff & Percentage */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-500">Active Staff:</span>
            <span className="font-mono font-bold text-emerald-400">
              {metrics.active_staff}{" "}
              <span className="text-[10px] text-zinc-500 font-normal">
                ({metrics.active_percentage}%)
              </span>
            </span>
          </div>

          {/* Monthly Payroll */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span className="text-zinc-500">Monthly Payroll:</span>
            <span className="font-mono font-bold text-zinc-100">
              {formatNPR(metrics.total_monthly_payroll)}
            </span>
          </div>

          {/* Auto-Scoped Fixed Branch Badge (Rule: Branch is Auto-Scoped) */}
          <div className="flex items-center gap-1.5 whitespace-nowrap bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-amber-400 font-mono text-[11px]">
            <Building2 className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="text-zinc-400 font-normal">Branch:</span>
            <span className="font-bold text-amber-400">{branchDisplayName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick POS PIN tester */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTestPin("");
              setPinTestResult(null);
              setIsPinTestModalOpen(true);
            }}
            leftIcon={<Key className="w-3 h-3 text-amber-500" />}
            className="text-[11px] h-7 px-2.5 border-zinc-700 hover:border-amber-500"
          >
            Test POS PIN
          </Button>

          {/* Add Team Member Button */}
          <Button
            size="sm"
            onClick={openCreateModal}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] h-7 px-3 rounded-none"
          >
            Add Team Member
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. FILTER & CONTROLS BAR (BRANCH FILTER REMOVED)
      ------------------------------------------------------------- */}
      <div className="bg-[#121214] border border-zinc-800 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs rounded-none">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl">
          {/* Search Input with Live Debounce */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, phone or title..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-[#18181b] border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Role Filter Dropdown */}
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span>Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-8 px-2 text-xs bg-[#18181b] border border-zinc-800 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Roles</option>
              <option value="STORE_MANAGER">Store Manager</option>
              <option value="CASHIER">Cashier</option>
              <option value="KITCHEN_SUPERVISOR">Kitchen Supervisor</option>
              <option value="INVENTORY_MANAGER">Inventory Manager</option>
              <option value="FLOOR_STAFF">Floor Staff</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2 text-xs bg-[#18181b] border border-zinc-800 text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {(searchQuery || selectedRole !== "ALL" || selectedStatus !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedRole("ALL");
                setSelectedStatus("ALL");
              }}
              className="text-[11px] text-rose-400 hover:underline px-1 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
          <button
            type="button"
            onClick={fetchEmployees}
            title="Refresh staff list"
            className="p-1 hover:text-amber-400 text-zinc-500 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-500" : ""}`} />
          </button>
          <span>
            Showing: <strong className="text-zinc-200">{employeeList.length}</strong> Staff Members
          </span>
        </div>
      </div>

      {/* Error alert banner if any */}
      {apiError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between">
          <span>{apiError}</span>
          <button
            type="button"
            onClick={fetchEmployees}
            className="text-amber-400 font-bold hover:underline cursor-pointer ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          3. STAFF ROSTER TABLE
      ------------------------------------------------------------- */}
      <div className="bg-[#121214] border border-zinc-800 overflow-x-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Fetching branch staff...</span>
            </div>
          </div>
        )}

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-[#161619] text-zinc-400 uppercase font-black tracking-wider text-[10px]">
              <th className="p-3">Staff Member</th>
              <th className="p-3 text-center">System Role</th>
              <th className="p-3">Designation / Title</th>
              <th className="p-3">Contact Details</th>
              <th className="p-3 text-right">Monthly Salary</th>
              <th className="p-3">Authorized Modules</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Joined Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {employeeList.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-zinc-500 text-xs">
                  <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-zinc-400">No staff members found</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Click "Add Team Member" above to register an employee for {branchDisplayName}.
                  </p>
                </td>
              </tr>
            ) : (
              employeeList.map((emp) => {
                const badgeStyle = roleBadges[emp.role] || roleBadges.FLOOR_STAFF;
                const pages = emp.assignedPages || emp.assigned_pages || [];
                const isSuperAdmin = emp.role === "SUPER_ADMIN";
                const isCurrentActive = emp.isActive ?? emp.is_active ?? true;
                const salary =
                  emp.salaryMonthly !== undefined
                    ? emp.salaryMonthly
                    : emp.salary_monthly
                    ? Number(emp.salary_monthly)
                    : 0;

                return (
                  <tr key={emp.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Staff Member (Avatar, Name, Email) */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-amber-400 shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-100 truncate">{emp.name}</div>
                          <div className="text-[11px] text-zinc-500 truncate">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* System Role */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                      >
                        {emp.role.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Job Title */}
                    <td className="p-3 text-zinc-300 font-medium">
                      <span>{emp.title || "—"}</span>
                    </td>

                    {/* Contact Phone & Email */}
                    <td className="p-3">
                      <div className="font-mono text-[11px] text-zinc-400 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span>{emp.phone || "—"}</span>
                      </div>
                    </td>

                    {/* Monthly Salary */}
                    <td className="p-3 text-right font-mono font-bold text-zinc-200 text-xs">
                      {salary > 0 ? formatNPR(salary) : "—"}
                    </td>

                    {/* Authorized Modules */}
                    <td className="p-3 max-w-xs">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-amber-400 font-mono mr-1">
                          {pages.length} modules:
                        </span>
                        {pages.slice(0, 3).map((page) => (
                          <span
                            key={page}
                            className="text-[9px] font-mono px-1 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700"
                          >
                            {page}
                          </span>
                        ))}
                        {pages.length > 3 && (
                          <span className="text-[9px] font-mono text-zinc-500">
                            +{pages.length - 3} more
                          </span>
                        )}
                        {pages.length === 0 && (
                          <span className="text-[10px] text-zinc-500 italic">No access</span>
                        )}
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="p-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                          isCurrentActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {isCurrentActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="p-3 text-center font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {emp.joinedDate || emp.joined_date || "—"}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(emp)}
                          className="px-2 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        {!isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(emp)}
                            className="p-1 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete team member"
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
          4. ADD / EDIT EMPLOYEE MODAL (NO OUTLET SELECTOR - FIXED BADGE)
      ------------------------------------------------------------- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          editingEmployee
            ? `Edit Staff Member: ${editingEmployee.name}`
            : "Add Team Member & Assign Module Permissions"
        }
        maxWidth="5xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Branch Indicator Banner (Architectural Rule: Branch is auto-scoped) */}
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-400">
              <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-bold">
                Auto-Scoped Branch: <strong>{branchDisplayName}</strong>
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              Bound to logged-in administrator branch
            </span>
          </div>

          {/* 4-COLUMN ROW 1: PRIMARY CREDENTIALS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Full Name */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Full Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sita Sharma"
                required
                className="text-xs font-bold"
                autoFocus
              />
            </div>

            {/* Work Email */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Work Email *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sita.sharma@crunchy.com"
                required
                className="text-xs"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
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

            {/* System Role */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                System Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-9 px-2.5 text-xs bg-[#18181b] border border-zinc-800 text-zinc-100 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="STORE_MANAGER">Store Manager</option>
                <option value="CASHIER">Cashier</option>
                <option value="KITCHEN_SUPERVISOR">Kitchen Supervisor</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="FLOOR_STAFF">Floor Staff</option>
                {editingEmployee?.role === "SUPER_ADMIN" && (
                  <option value="SUPER_ADMIN">Super Admin</option>
                )}
              </select>
            </div>
          </div>

          {/* 4-COLUMN ROW 2: JOB DETAILS, SALARY, PASSWORDS & STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Job Title */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Job Title / Designation *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Counter Cashier & Shift Lead"
                required
                className="text-xs"
              />
            </div>

            {/* Monthly Salary */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                Monthly Salary (NPR)
              </label>
              <Input
                type="number"
                value={salaryMonthly}
                onChange={(e) => setSalaryMonthly(e.target.value)}
                placeholder="35000"
                className="text-xs font-mono font-bold"
              />
            </div>

            {/* Temporary Password */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                {editingEmployee ? "Reset Login Password (Optional)" : "Temporary Password *"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  placeholder={editingEmployee ? "Leave empty to keep current" : "Min 8 characters"}
                  required={!editingEmployee}
                  className="w-full h-9 pl-2.5 pr-8 text-xs bg-[#18181b] border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 4-to-6 Digit POS Switch PIN */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                4-6 Digit POS Switch PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 4821"
                  className="w-full h-9 pl-2.5 pr-8 text-xs bg-[#18181b] border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono tracking-widest font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* ROW 3: STATUS TOGGLE */}
          <div className="flex items-center justify-between p-2.5 bg-[#18181b] border border-zinc-800">
            <div>
              <span className="font-bold text-zinc-200 block text-xs">Authorized Account Status</span>
              <span className="text-[10px] text-zinc-400">
                Disabled accounts cannot login to POS counter, KDS, or management dashboards.
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-zinc-200">
                {isActive ? "Active & Authorized" : "Disabled"}
              </span>
            </label>
          </div>

          {/* SECTION 4: 12 CATEGORIZED MODULE CHECKBOXES & PRESETS */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-200">
                  Assigned Operational Modules ({assignedPages.length} of {ALL_PAGES.length})
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center flex-wrap gap-1 text-[10px]">
                <span className="text-zinc-500 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset("cashier")}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-amber-500 hover:text-black font-bold border border-zinc-700 cursor-pointer transition-colors"
                >
                  Cashier
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("kitchen")}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-amber-500 hover:text-black font-bold border border-zinc-700 cursor-pointer transition-colors"
                >
                  Kitchen
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("inventory")}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-amber-500 hover:text-black font-bold border border-zinc-700 cursor-pointer transition-colors"
                >
                  Inventory
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("manager")}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-amber-500 hover:text-black font-bold border border-zinc-700 cursor-pointer transition-colors"
                >
                  Manager
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  className="text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  All
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={() => applyPreset("clear")}
                  className="text-zinc-400 hover:underline font-bold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Categorized 12-Module Grid */}
            <div className="space-y-3 max-h-72 overflow-y-auto p-2.5 bg-[#161619] border border-zinc-800">
              {/* Operations Category */}
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block mb-1.5">
                  1. Operations Modules
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {ALL_PAGES.filter((p) => p.category === "operations").map((page) => {
                    const isChecked = assignedPages.includes(page.id);
                    return (
                      <label
                        key={page.id}
                        className={`flex items-start gap-2 p-2 border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-amber-500/10 border-amber-500/60 text-zinc-100"
                            : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePageAssignment(page.id)}
                          className="mt-0.5 accent-amber-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold truncate">{page.label}</div>
                          <div className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">
                            {page.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Financial Category */}
              <div>
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider block mb-1.5">
                  2. Financial & Accounting Modules
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {ALL_PAGES.filter((p) => p.category === "financial").map((page) => {
                    const isChecked = assignedPages.includes(page.id);
                    return (
                      <label
                        key={page.id}
                        className={`flex items-start gap-2 p-2 border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-sky-500/10 border-sky-500/60 text-zinc-100"
                            : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePageAssignment(page.id)}
                          className="mt-0.5 accent-amber-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold truncate">{page.label}</div>
                          <div className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">
                            {page.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Management Category */}
              <div>
                <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider block mb-1.5">
                  3. Branch Governance & Management Modules
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {ALL_PAGES.filter((p) => p.category === "management").map((page) => {
                    const isChecked = assignedPages.includes(page.id);
                    return (
                      <label
                        key={page.id}
                        className={`flex items-start gap-2 p-2 border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-purple-500/10 border-purple-500/60 text-zinc-100"
                            : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePageAssignment(page.id)}
                          className="mt-0.5 accent-amber-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold truncate">{page.label}</div>
                          <div className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">
                            {page.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Server...</span>
                </div>
              ) : editingEmployee ? (
                "Save Changes"
              ) : (
                "Register Team Member"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------------------------------------------------
          5. QUICK POS PIN TESTER MODAL (/api/v1/auth/staff-pin-login/)
      ------------------------------------------------------------- */}
      <Modal
        isOpen={isPinTestModalOpen}
        onClose={() => setIsPinTestModalOpen(false)}
        title="Test Quick Terminal POS PIN Login"
        maxWidth="md"
      >
        <form onSubmit={handleTestPinLogin} className="space-y-4 text-xs">
          <p className="text-zinc-400 text-xs leading-relaxed">
            Verify cashier fast PIN handovers at branch <strong>{branchDisplayName}</strong>.
            This executes <code>POST /api/v1/auth/staff-pin-login/</code>.
          </p>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Enter 4-to-6 Digit Staff PIN
            </label>
            <input
              type="password"
              maxLength={6}
              value={testPin}
              onChange={(e) => setTestPin(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 4821"
              required
              autoFocus
              className="w-full h-11 px-3 text-center text-lg tracking-widest font-mono font-bold bg-[#18181b] border border-zinc-800 text-amber-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {pinTestResult && (
            <div
              className={`p-2.5 text-xs font-mono ${
                pinTestResult.startsWith("Verified")
                  ? "bg-emerald-950/40 border border-emerald-800 text-emerald-300"
                  : "bg-rose-950/40 border border-rose-800 text-rose-300"
              }`}
            >
              {pinTestResult}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPinTestModalOpen(false)}
            >
              Close
            </Button>
            <Button
              type="submit"
              disabled={isPinTesting || !testPin.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold"
            >
              {isPinTesting ? "Verifying..." : "Validate PIN"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
