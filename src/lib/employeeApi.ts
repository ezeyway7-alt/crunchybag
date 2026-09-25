import { apiClient, extractErrorMessage } from "./api";
import { AdminSubPage, Employee } from "../types";

export interface BackendAssignedOutlet {
  id: string | number;
  name: string;
  code?: string;
  branch_code?: string;
}

export interface EmployeeMetrics {
  total_staff: number;
  active_staff: number;
  active_percentage: number;
  total_monthly_payroll: number;
  branches_staffed?: number;
  total_branches?: number;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  phone: string;
  role: string;
  title: string;
  salary_monthly: string;
  assigned_pages: AdminSubPage[];
  is_active: boolean;
  temporary_password?: string;
  pin_code?: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  title?: string;
  salary_monthly?: string;
  assigned_pages?: AdminSubPage[];
  is_active?: boolean;
  temporary_password?: string;
  pin_code?: string;
}

export interface QuickPinLoginPayload {
  outlet_id: string | number;
  pin_code: string;
}

export interface QuickPinLoginResponse {
  access: string;
  refresh: string;
  employee: any;
  outlet: any;
}

/**
 * Normalizes an employee record from the backend into a consistent structure
 * supporting both camelCase and snake_case frontend access patterns.
 */
export function normalizeEmployee(raw: any): Employee {
  const assignedOutlet = raw.assigned_outlet || (raw.assignedOutletId ? { id: raw.assignedOutletId, name: "Branch Outlet" } : undefined);
  const salaryRaw = raw.salary_monthly ?? raw.salaryMonthly ?? 0;
  const salaryNum = typeof salaryRaw === "string" ? parseFloat(salaryRaw) || 0 : Number(salaryRaw) || 0;
  const pages: AdminSubPage[] = Array.isArray(raw.assigned_pages)
    ? raw.assigned_pages
    : Array.isArray(raw.assignedPages)
    ? raw.assignedPages
    : ["pos", "daybook", "loyalty"];

  const active = typeof raw.is_active === "boolean" ? raw.is_active : typeof raw.isActive === "boolean" ? raw.isActive : true;
  const joined = raw.joined_date || raw.joinedDate || new Date().toISOString().split("T")[0];

  return {
    id: String(raw.id || `emp-${Date.now()}`),
    name: raw.name || "Team Member",
    email: raw.email || "",
    phone: raw.phone || "",
    role: raw.role || "CASHIER",
    title: raw.title || "Staff Member",
    assignedOutletId: assignedOutlet ? String(assignedOutlet.id) : String(raw.assignedOutletId || ""),
    assigned_outlet: assignedOutlet,
    assignedPages: pages,
    assigned_pages: pages,
    isActive: active,
    is_active: active,
    salaryMonthly: salaryNum,
    salary_monthly: String(salaryNum),
    joinedDate: joined,
    joined_date: joined,
    avatar: raw.avatar || null,
    pin_code: raw.pin_code || raw.pinCode || "",
  };
}

export const employeeApi = {
  /**
   * GET /api/v1/employees/
   * Fetches employee list & metrics with optional search, role, status query params
   */
  async list(params?: {
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{ metrics: EmployeeMetrics; results: Employee[] }> {
    const searchParams = new URLSearchParams();
    if (params?.search && params.search.trim()) {
      searchParams.set("search", params.search.trim());
    }
    if (params?.role && params.role !== "ALL") {
      searchParams.set("role", params.role);
    }
    if (params?.status && params.status !== "ALL") {
      searchParams.set("status", params.status);
    }

    const qs = searchParams.toString();
    const endpoint = `/employees/${qs ? `?${qs}` : ""}`;

    const res = await apiClient.get(endpoint);

    let rawList: any[] = [];
    let metricsData: EmployeeMetrics | null = null;

    if (res && typeof res === "object") {
      if (Array.isArray(res)) {
        rawList = res;
      } else if (Array.isArray(res.results)) {
        rawList = res.results;
        if (res.metrics && typeof res.metrics === "object") {
          metricsData = res.metrics;
        }
      } else if (Array.isArray(res.data)) {
        rawList = res.data;
      }
    }

    const normalizedList = rawList.map(normalizeEmployee);

    // Compute or verify metrics
    const totalStaff = metricsData?.total_staff ?? normalizedList.length;
    const activeStaff = metricsData?.active_staff ?? normalizedList.filter((e) => e.isActive).length;
    const activePercentage =
      metricsData?.active_percentage ??
      (totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0);
    const totalPayroll =
      metricsData?.total_monthly_payroll ??
      normalizedList.reduce((sum, e) => sum + (e.salaryMonthly || 0), 0);

    const metrics: EmployeeMetrics = {
      total_staff: totalStaff,
      active_staff: activeStaff,
      active_percentage: activePercentage,
      total_monthly_payroll: totalPayroll,
      branches_staffed: metricsData?.branches_staffed ?? 1,
      total_branches: metricsData?.total_branches ?? 1,
    };

    return {
      metrics,
      results: normalizedList,
    };
  },

  /**
   * POST /api/v1/employees/
   * Creates a new employee bounded to the admin's outlet
   */
  async create(payload: CreateEmployeePayload): Promise<Employee> {
    const res = await apiClient.post("/employees/", payload);
    return normalizeEmployee(res);
  },

  /**
   * PATCH /api/v1/employees/{id}/
   * Updates employee attributes & permissions
   */
  async update(id: string | number, payload: UpdateEmployeePayload): Promise<Employee> {
    const res = await apiClient.patch(`/employees/${id}/`, payload);
    return normalizeEmployee(res);
  },

  /**
   * DELETE /api/v1/employees/{id}/
   * Deletes employee record (SUPER_ADMIN is protected)
   */
  async delete(id: string | number): Promise<void> {
    await apiClient.delete(`/employees/${id}/`);
  },

  /**
   * POST /api/v1/auth/staff-pin-login/
   * Quick POS PIN login for rapid terminal cashier switching
   */
  async quickPinLogin(payload: QuickPinLoginPayload): Promise<QuickPinLoginResponse> {
    return apiClient.post("/auth/staff-pin-login/", payload);
  },
};
