import { baseRequest, ApiError } from "./api";
import { authStorage } from "./authStorage";

export interface BackendInventoryItem {
  id: string | number;
  sku?: string;
  name: string;
  category?: string | number;
  category_name?: string;
  supplier_name?: string;
  current_stock: string | number;
  unit: string;
  min_threshold: string | number;
  cost_per_unit: string | number;
  total_valuation?: string | number;
  is_low_stock?: boolean;
  last_restocked?: string;
  batch_no?: string;
  expiry_date?: string;
}

export interface StockCatalogResponse {
  status: string;
  data: {
    count: number;
    low_stock_count: number;
    total_valuation: number;
    results: BackendInventoryItem[];
  };
}

export interface SupplierItem {
  id: string | number;
  name: string;
  phone?: string;
  pan_number?: string;
  credit_balance?: string | number;
}

export interface CategoryItem {
  id: string | number;
  name: string;
  description?: string;
  item_count?: number;
}

export interface InwardPurchaseItemPayload {
  item_name: string;
  category: string;
  quantity: string;
  unit: string;
  unit_cost: string;
  discount: string;
  total_cost: string;
  batch_no?: string;
  expiry_date?: string;
}

export interface InwardPurchasePayload {
  invoice_number: string;
  supplier_name: string;
  supplier_phone?: string;
  purchase_date: string;
  payment_method: "CASH" | "FONEPAY" | "BANK_TRANSFER" | "CHEQUE" | "CREDIT";
  payment_status: "PAID" | "PENDING" | "PARTIAL";
  subtotal: string;
  discount_amount: string;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  notes?: string;
  items: InwardPurchaseItemPayload[];
}

export interface PhysicalAuditItemPayload {
  item_id: string | number;
  physical_stock: string;
  note?: string;
}

export interface PhysicalAuditPayload {
  items: PhysicalAuditItemPayload[];
}

export interface StockMovementItem {
  id: string | number;
  item_id: string | number;
  item_name: string;
  category?: string;
  type: "INCREASE" | "DECREASE";
  quantity: string | number;
  unit: string;
  previous_stock: string | number;
  new_stock: string | number;
  reason: string;
  note?: string;
  recorded_by?: string;
  timestamp: string;
}

export const inventoryApi = {
  /**
   * Fetch Stock Catalog & Summary Metrics
   * GET /api/v1/inventory/items/?search=<query>&category_id=<id>&low_stock=true
   */
  async fetchItems(params?: {
    search?: string;
    category_id?: string | number;
    low_stock?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<StockCatalogResponse["data"]> {
    const query = new URLSearchParams();
    if (params?.search?.trim()) query.set("search", params.search.trim());
    if (params?.category_id !== undefined && params.category_id !== "ALL") {
      query.set("category_id", String(params.category_id));
    }
    if (params?.low_stock) query.set("low_stock", "true");
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));

    const qs = query.toString();
    const endpoint = `/inventory/items/${qs ? `?${qs}` : ""}`;

    const res = await baseRequest<any>(endpoint, { method: "GET" });
    if (res?.data && typeof res.data.count === "number") {
      return res.data;
    }
    if (Array.isArray(res?.results)) {
      const results = res.results;
      const count = res.count ?? results.length;
      const low_stock_count = results.filter((i: any) => i.is_low_stock || parseFloat(i.current_stock) <= parseFloat(i.min_threshold)).length;
      const total_valuation = results.reduce((acc: number, cur: any) => acc + (parseFloat(cur.current_stock || 0) * parseFloat(cur.cost_per_unit || 0)), 0);
      return { count, low_stock_count, total_valuation, results };
    }
    if (Array.isArray(res)) {
      const results = res;
      const low_stock_count = results.filter((i: any) => i.is_low_stock || parseFloat(i.current_stock) <= parseFloat(i.min_threshold)).length;
      const total_valuation = results.reduce((acc: number, cur: any) => acc + (parseFloat(cur.current_stock || 0) * parseFloat(cur.cost_per_unit || 0)), 0);
      return { count: results.length, low_stock_count, total_valuation, results };
    }
    return {
      count: 0,
      low_stock_count: 0,
      total_valuation: 0,
      results: [],
    };
  },

  /**
   * Fetch Suppliers List for Select2 Combobox
   * GET /api/v1/inventory/suppliers/?search=<query>
   */
  async fetchSuppliers(searchQuery?: string): Promise<SupplierItem[]> {
    const query = new URLSearchParams();
    if (searchQuery?.trim()) query.set("search", searchQuery.trim());
    const qs = query.toString();
    const endpoint = `/inventory/suppliers/${qs ? `?${qs}` : ""}`;

    try {
      const res = await baseRequest<any>(endpoint, { method: "GET" });
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.results)) return res.results;
      if (Array.isArray(res)) return res;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch Categories List for Select2 Combobox
   * GET /api/v1/inventory/categories/?search=<query>
   */
  async fetchCategories(searchQuery?: string): Promise<CategoryItem[]> {
    const query = new URLSearchParams();
    if (searchQuery?.trim()) query.set("search", searchQuery.trim());
    const qs = query.toString();
    const endpoint = `/inventory/categories/${qs ? `?${qs}` : ""}`;

    try {
      const res = await baseRequest<any>(endpoint, { method: "GET" });
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.results)) return res.results;
      if (Array.isArray(res)) return res;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Delete or Deactivate Category
   * 1. Looks up category ID if only name was passed
   * 2. Attempts DELETE /api/v1/inventory/categories/<id>/
   * 3. Fallback: PATCH /api/v1/inventory/categories/<id>/ with { is_active: false }
   */
  async deleteOrDeactivateCategory(
    categoryNameOrId: string | number
  ): Promise<{ success: boolean; method: string; message: string; id?: string | number }> {
    let targetId: string | number | undefined = undefined;

    if (typeof categoryNameOrId === "number" || (!isNaN(Number(categoryNameOrId)) && !categoryNameOrId.toString().includes(" "))) {
      targetId = categoryNameOrId;
    } else {
      try {
        const categories = await this.fetchCategories(String(categoryNameOrId));
        const matched = categories.find(
          (c) => String(c.name).toLowerCase() === String(categoryNameOrId).toLowerCase()
        );
        if (matched && matched.id) {
          targetId = matched.id;
        }
      } catch {
        // Ignored
      }
    }

    if (targetId !== undefined) {
      // 1. Try DELETE
      try {
        await baseRequest(`/inventory/categories/${targetId}/`, {
          method: "DELETE",
        });
        return {
          success: true,
          method: "DELETE",
          id: targetId,
          message: `Category #${targetId} deleted from backend database.`,
        };
      } catch (delErr: any) {
        // 2. Try PATCH deactivate
        try {
          await baseRequest(`/inventory/categories/${targetId}/`, {
            method: "PATCH",
            body: JSON.stringify({ is_active: false }),
          });
          return {
            success: true,
            method: "PATCH",
            id: targetId,
            message: `Category #${targetId} deactivated in backend database.`,
          };
        } catch {
          // 3. Try POST deactivate endpoint
          try {
            await baseRequest(`/inventory/categories/${targetId}/deactivate/`, {
              method: "POST",
            });
            return {
              success: true,
              method: "POST_DEACTIVATE",
              id: targetId,
              message: `Category #${targetId} marked inactive.`,
            };
          } catch {
            return {
              success: false,
              method: "FAILED",
              id: targetId,
              message: `Backend returned error deleting category #${targetId}. Deactivated in UI.`,
            };
          }
        }
      }
    }

    return {
      success: true,
      method: "LOCAL",
      message: `Category "${categoryNameOrId}" removed from UI selection.`,
    };
  },

  /**
   * Submit Inward Purchase Bill
   * POST /api/v1/inventory/purchases/
   * Headers: Idempotency-Key: <unique-uuid>
   */
  async submitPurchase(payload: InwardPurchasePayload): Promise<any> {
    const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return baseRequest<any>("/inventory/purchases/", {
      method: "POST",
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Physical Stock Audit & Variance Reconciliation
   * POST /api/v1/inventory/audits/reconcile/
   */
  async reconcileAudit(payload: PhysicalAuditPayload): Promise<any> {
    return baseRequest<any>("/inventory/audits/reconcile/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Stock Movement Ledger Audit Trail
   * GET /api/v1/inventory/movements/?item_id=<id>
   */
  async fetchMovements(params?: {
    item_id?: string | number;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ count: number; results: StockMovementItem[] }> {
    const query = new URLSearchParams();
    if (params?.item_id) query.set("item_id", String(params.item_id));
    if (params?.search?.trim()) query.set("search", params.search.trim());
    if (params?.page) query.set("page", String(params.page));
    if (params?.page_size) query.set("page_size", String(params.page_size));

    const qs = query.toString();
    const endpoint = `/inventory/movements/${qs ? `?${qs}` : ""}`;

    try {
      const res = await baseRequest<any>(endpoint, { method: "GET" });
      if (Array.isArray(res?.data)) return { count: res.data.length, results: res.data };
      if (Array.isArray(res?.results)) return { count: res.count ?? res.results.length, results: res.results };
      if (Array.isArray(res)) return { count: res.length, results: res };
      return { count: 0, results: [] };
    } catch {
      return { count: 0, results: [] };
    }
  },
};
