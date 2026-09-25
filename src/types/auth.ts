export type BackendRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "RESTAURANT_OWNER"
  | "BRANCH_MANAGER"
  | "MANAGER"
  | "OWNER"
  | "CASHIER"
  | "CHEF"
  | "WAITER"
  | "RIDER"
  | "CUSTOMER"
  | string;

export interface BackendOutletOperatingChannels {
  dine_in?: boolean;
  pos?: boolean;
  delivery?: boolean;
  takeaway?: boolean;
  drive_thru?: boolean;
  [key: string]: unknown;
}

export interface BackendOutlet {
  id?: string | number;
  name?: string;
  branch_code?: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  is_active?: boolean;
  operating_channels?: BackendOutletOperatingChannels | string[];
  channels?: string[];
  dine_in?: boolean;
  pos?: boolean;
  delivery?: boolean;
  takeaway?: boolean;
  drive_thru?: boolean;
  [key: string]: unknown;
}

export interface BackendUser {
  id: string | number;
  username?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: BackendRole;
  is_active?: boolean;
  outlet_id?: string | number;
  assigned_outlet?: BackendOutlet;
  [key: string]: unknown;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: BackendUser;
  outlet: BackendOutlet;
}

export interface RefreshPayload {
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}

export interface ApiErrorResponse {
  detail?: string;
  error?: string;
  message?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
}

export const ROLE_ROUTE_MAP: Record<string, string> = {
  SUPERADMIN: "/admin",
  ADMIN: "/admin",
  RESTAURANT_OWNER: "/admin",
  BRANCH_MANAGER: "/admin",
  MANAGER: "/admin",
  OWNER: "/admin",
  CASHIER: "/pos",
  CHEF: "/kds",
  WAITER: "/waiter",
  RIDER: "/rider",
  CUSTOMER: "/menu",
};

export const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Store Administrator",
  RESTAURANT_OWNER: "Restaurant Owner",
  BRANCH_MANAGER: "Branch Manager",
  MANAGER: "Store Manager",
  OWNER: "Brand Owner",
  CASHIER: "Cashier / Front POS",
  CHEF: "Chef / Kitchen Station",
  WAITER: "Floor Waiter",
  RIDER: "Delivery Rider",
  CUSTOMER: "Customer",
};
