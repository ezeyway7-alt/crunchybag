import {
  AuthTokens,
  BackendOutlet,
  BackendUser,
  LoginPayload,
  LoginResponse,
  RefreshPayload,
  RefreshResponse,
} from "../types/auth";
import { OrganizationSettings, PaymentMethod } from "../types";
import { authStorage } from "./authStorage";

// Production backend live endpoints
export const LIVE_API_ORIGIN = "https://crunchybag.com";
export const API_BASE_URL = `${LIVE_API_ORIGIN}/api/v1`;

// Local & preview proxy base path (routed through Vite dev server proxy to handle CORS & strip X-Forwarded-Host)
export const PROXY_API_BASE_URL = "/api/v1";

// In the browser, unless already hosted on crunchybag.com, use the proxy path to avoid CORS blocks
const isHostedOnCrunchyBag = typeof window !== "undefined" && window.location.origin === LIVE_API_ORIGIN;
export const DEFAULT_API_BASE = isHostedOnCrunchyBag ? API_BASE_URL : PROXY_API_BASE_URL;

/**
 * Safely extracts the Django CSRF token from browser cookies, DOM meta tags, hidden inputs, or storage.
 */
export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  // 1. Try reading the standard Django `csrftoken` cookie
  const match = document.cookie.match(/(?:^|;\s*)(?:csrftoken|csrf_token|XSRF-TOKEN)=([^;]+)/i);
  if (match) {
    const val = decodeURIComponent(match[1]).trim();
    if (val) return val;
  }

  // 2. Try reading from a meta tag <meta name="csrf-token" content="..."> or similar
  const meta = document.querySelector(
    'meta[name="csrf-token"], meta[name="csrf-param"], meta[name="csrf_token"], meta[name="csrfmiddlewaretoken"]'
  ) as HTMLMetaElement | null;
  if (meta && meta.content) {
    const val = meta.content.trim();
    if (val) return val;
  }

  // 3. Try reading from hidden input <input name="csrfmiddlewaretoken">
  const input = document.querySelector('input[name="csrfmiddlewaretoken"]') as HTMLInputElement | null;
  if (input && input.value) {
    const val = input.value.trim();
    if (val) return val;
  }

  // 4. Try sessionStorage or localStorage
  try {
    const stored =
      sessionStorage.getItem("crunchy_csrftoken") ||
      localStorage.getItem("crunchy_csrftoken");
    if (stored && stored.trim()) return stored.trim();
  } catch {}

  return null;
}

let csrfPromise: Promise<string | null> | null = null;

/**
 * Proactively fetches and ensures a valid Django CSRF cookie/token is present in the browser.
 * Hits Django endpoints with GET/HEAD to trigger Django's `ensure_csrf_cookie` middleware.
 */
export async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfToken();
  if (existing) return existing;

  if (typeof window === "undefined") return null;

  if (csrfPromise) {
    return csrfPromise;
  }

  csrfPromise = (async () => {
    try {
      // Candidate endpoints on Django backend that issue csrftoken cookies
      const candidates = [
        "/superuser/login/",
        "/django-admin/login/",
        "/csrf/",
        `${LIVE_API_ORIGIN}/superuser/login/`,
      ];

      for (const endpoint of candidates) {
        try {
          await fetch(endpoint, {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "text/html,application/json,*/*",
            },
          });
          const token = getCsrfToken();
          if (token) {
            try {
              sessionStorage.setItem("crunchy_csrftoken", token);
            } catch {}
            return token;
          }
        } catch {
          // ignore candidate failure and try next
        }
      }

      return getCsrfToken();
    } catch {
      return null;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefreshRetry?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Concurrency lock and queue for silent token refresh
let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (newToken: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = () => {
  refreshSubscribers = [];
};

/**
 * Format human-friendly error messages from DRF backend error payloads.
 * Strictly guarantees no raw HTML strings or technical dumps are shown to the user.
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // If backend returned a structured JSON payload
    if (error.data && typeof error.data === "object") {
      if (error.data.detail) return String(error.data.detail);
      if (error.data.error) return String(error.data.error);
      if (error.data.message) return String(error.data.message);
      if (Array.isArray(error.data.non_field_errors) && error.data.non_field_errors.length > 0) {
        return error.data.non_field_errors[0];
      }
      // If object with field errors: e.g. { identifier: ["This field is required."] }
      const entries = Object.entries(error.data);
      if (entries.length > 0) {
        const [field, val] = entries[0];
        const formattedField = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
        if (Array.isArray(val) && val.length > 0) {
          return `${formattedField}: ${val[0]}`;
        }
        if (typeof val === "string") {
          return `${formattedField}: ${val}`;
        }
      }
    }

    // Check if error.data is a raw string (e.g. HTML error page or text)
    if (typeof error.data === "string") {
      const isHtml =
        error.data.includes("<html") ||
        error.data.includes("<!doctype") ||
        error.data.includes("<body") ||
        error.data.includes("<h1");
      if (!isHtml && error.data.trim().length > 0 && error.data.length < 200) {
        return error.data.trim();
      }
    }

    // Check if error is related to CSRF
    const detailLower = String(
      (error.data && typeof error.data === "object" ? error.data.detail || error.data.error || "" : "") ||
      (typeof error.data === "string" ? error.data : "") ||
      error.message ||
      ""
    ).toLowerCase();

    if (detailLower.includes("csrf failed") || detailLower.includes("csrf token")) {
      return "Security session verification failed (CSRF token missing). Please reload the page to refresh session.";
    }

    // Status code fallbacks
    if (error.status === 400) {
      return "Invalid credentials or malformed request. Please check your username/email and password.";
    }
    if (error.status === 401) {
      return "Invalid credentials. Please verify your email, phone, or username and password.";
    }
    if (error.status === 403) {
      return "Account disabled / Access restricted. Contact administration.";
    }
    if (error.status === 404) {
      return "Requested service or endpoint not found on server.";
    }
    if (error.status >= 500) {
      return "Crunchy Bag server error. Please try again shortly.";
    }

    if (error.message && !error.message.includes("<html") && !error.message.includes("<!doctype")) {
      return error.message;
    }
    return "An unexpected server response occurred. Please try again.";
  }

  if (error instanceof Error) {
    if (error.message.includes("<html") || error.message.includes("<!doctype")) {
      return "Server returned an unexpected response. Please try again.";
    }
    return error.message;
  }
  return "Unable to connect to server. Please check your internet connection.";
}

/**
 * Core HTTP client with automatic Authorization header and silent 401 token refresh
 */
export async function baseRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, skipRefreshRetry = false, headers, ...restOptions } = options;

  // Build target URL
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let targetUrl: string;
  if (endpoint.startsWith("http")) {
    targetUrl = endpoint;
  } else {
    targetUrl = `${DEFAULT_API_BASE}${cleanEndpoint}`;
  }

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type") && !(restOptions.body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  // Attach Authorization header if access token exists
  if (!skipAuth) {
    const accessToken = authStorage.getAccessToken();
    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  // Determine method and check if mutating (POST, PUT, PATCH, DELETE)
  const method = (restOptions.method || "GET").toUpperCase();
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Attach Django CSRF Token if present, or proactively prime it for mutating requests
  let csrfToken = getCsrfToken();
  if (isMutating && !csrfToken && typeof window !== "undefined") {
    csrfToken = await ensureCsrfToken();
  }

  if (csrfToken) {
    if (!requestHeaders.has("X-CSRFToken")) {
      requestHeaders.set("X-CSRFToken", csrfToken);
    }
    if (!requestHeaders.has("X-CSRF-Token")) {
      requestHeaders.set("X-CSRF-Token", csrfToken);
    }
  }

  // Determine safe credentials mode (include cookies when on same origin)
  let credentialsMode: RequestCredentials = restOptions.credentials || "same-origin";
  if (typeof window !== "undefined") {
    const isSameOrigin =
      targetUrl.startsWith("/") ||
      targetUrl.startsWith(window.location.origin) ||
      (window.location.hostname.includes("crunchybag.com") && targetUrl.includes("crunchybag.com"));
    if (isSameOrigin) {
      credentialsMode = "include";
    }
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      ...restOptions,
      credentials: credentialsMode,
      headers: requestHeaders,
    });
  } catch (networkErr: any) {
    // If request failed (e.g. direct CORS failure), attempt fallback via proxy URL
    if (targetUrl.startsWith(LIVE_API_ORIGIN)) {
      try {
        const proxyUrl = targetUrl.replace(LIVE_API_ORIGIN, "");
        response = await fetch(proxyUrl, {
          ...restOptions,
          credentials: credentialsMode,
          headers: requestHeaders,
        });
      } catch {
        throw new ApiError(
          "Network connection failed. Unable to reach Crunchy Bag server.",
          0,
          networkErr
        );
      }
    } else {
      throw new ApiError(
        "Network connection failed. Unable to reach Crunchy Bag server.",
        0,
        networkErr
      );
    }
  }

  // Handle 403 CSRF failure: automatically refresh token and retry once
  if (response.status === 403 && !skipRefreshRetry) {
    let isCsrfError = false;
    try {
      const cloned = response.clone();
      const text = await cloned.text();
      if (text.toLowerCase().includes("csrf")) {
        isCsrfError = true;
      }
    } catch {}

    if (isCsrfError && typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("crunchy_csrftoken");
        localStorage.removeItem("crunchy_csrftoken");
      } catch {}

      const freshToken = await ensureCsrfToken();
      if (freshToken) {
        requestHeaders.set("X-CSRFToken", freshToken);
        requestHeaders.set("X-CSRF-Token", freshToken);
        return baseRequest<T>(endpoint, {
          ...options,
          skipRefreshRetry: true,
          headers: requestHeaders,
        });
      }
    }
  }

  // Handle 401 Unauthorized with silent token refresh
  if (response.status === 401 && !skipRefreshRetry && !skipAuth) {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newAccess = await performTokenRefresh(refreshToken);
          isRefreshing = false;
          onTokenRefreshed(newAccess);
          // Retry original request with fresh token
          requestHeaders.set("Authorization", `Bearer ${newAccess}`);
          return baseRequest<T>(endpoint, {
            ...options,
            skipRefreshRetry: true,
            headers: requestHeaders,
          });
        } catch (refreshErr) {
          isRefreshing = false;
          onTokenRefreshFailed();
          authStorage.clearSession();
          throw new ApiError("Session expired. Please sign in again.", 401, refreshErr);
        }
      } else {
        // Queue parallel requests until refresh completes
        return new Promise<T>((resolve, reject) => {
          subscribeTokenRefresh((newToken: string) => {
            requestHeaders.set("Authorization", `Bearer ${newToken}`);
            baseRequest<T>(endpoint, {
              ...options,
              skipRefreshRetry: true,
              headers: requestHeaders,
            })
              .then(resolve)
              .catch(reject);
          });
        });
      }
    } else {
      // No refresh token available, session invalid
      authStorage.clearSession();
    }
  }

  // Parse response body
  let responseData: any = null;
  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    if (responseData && typeof responseData === "object") {
      errorMsg = responseData.detail || responseData.error || responseData.message || errorMsg;
    } else if (typeof responseData === "string") {
      const isHtml =
        responseData.includes("<html") ||
        responseData.includes("<!doctype") ||
        responseData.includes("<body") ||
        responseData.includes("<h1");
      if (!isHtml && responseData.trim().length > 0 && responseData.length < 200) {
        errorMsg = responseData.trim();
      }
    }
    throw new ApiError(errorMsg, response.status, responseData);
  }

  return responseData as T;
}

/**
 * Execute silent refresh against /api/v1/auth/token/refresh/
 */
async function performTokenRefresh(refreshToken: string): Promise<string> {
  const refreshUrl = `${DEFAULT_API_BASE}/auth/token/refresh/`;
  let resp: Response;

  const csrf = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (csrf) {
    headers["X-CSRFToken"] = csrf;
    headers["X-CSRF-Token"] = csrf;
  }

  try {
    resp = await fetch(refreshUrl, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch (err) {
    // If relative fetch failed, try direct live origin
    const fallbackUrl = `${LIVE_API_ORIGIN}/api/v1/auth/token/refresh/`;
    resp = await fetch(fallbackUrl, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  if (!resp.ok) {
    throw new Error(`Refresh token rejected with status ${resp.status}`);
  }

  const data: RefreshResponse = await resp.json();
  if (!data.access) {
    throw new Error("Invalid refresh token response from server");
  }

  authStorage.setAccessToken(data.access);
  return data.access;
}

/**
 * Authentication Endpoints
 */
export const authApi = {
  /**
   * POST /api/v1/auth/login/
   * Payload: { identifier: string, password: string }
   * Response: { access: string, refresh: string, user: BackendUser, outlet: BackendOutlet }
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    // Proactively prime CSRF cookie if in browser
    if (typeof window !== "undefined") {
      await ensureCsrfToken().catch(() => null);
    }

    const result = await baseRequest<LoginResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
      skipRefreshRetry: false,
    });

    if (result && result.access && result.user) {
      authStorage.setSession({
        access: result.access,
        refresh: result.refresh || "",
        user: result.user,
        outlet: (result.outlet || {}) as BackendOutlet,
      });
    }

    return result;
  },

  /**
   * POST /api/v1/auth/token/refresh/
   * Payload: { refresh: string }
   * Response: { access: string }
   */
  async refreshToken(refresh: string): Promise<RefreshResponse> {
    const result = await baseRequest<RefreshResponse>("/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
      skipAuth: true,
      skipRefreshRetry: true,
    });

    if (result && result.access) {
      authStorage.setAccessToken(result.access);
    }

    return result;
  },

  /**
   * GET /api/v1/auth/me/
   * Header: Authorization: Bearer <access>
   */
  async getMe(): Promise<{ user?: BackendUser; outlet?: BackendOutlet } | BackendUser> {
    return baseRequest("/auth/me/", {
      method: "GET",
    });
  },

  /**
   * Sign out locally: clears storage and fires event
   */
  logout(): void {
    authStorage.clearSession();
  },
};

/**
 * Organization Profile & Logo Endpoints
 */
export const organizationApi = {
  async getSettings(): Promise<OrganizationSettings> {
    const raw = await baseRequest<any>("/organization/");
    const data = raw?.data || raw?.organization || raw?.result || raw || {};
    
    let parsedMethods: PaymentMethod[] = ["ESEWA", "FONEPAY_QR", "CASH_ON_PICKUP", "CARD", "WALLET"];
    const rawMethods = data.accepted_payment_methods ?? data.acceptedPaymentMethods;
    if (Array.isArray(rawMethods)) {
      parsedMethods = rawMethods;
    } else if (typeof rawMethods === "string") {
      try {
        const parsed = JSON.parse(rawMethods);
        if (Array.isArray(parsed)) parsedMethods = parsed;
      } catch {}
    }

    return {
      brandName: data.brand_name || data.brandName || "Crunchy",
      tagline: data.tagline ?? data.tagLine ?? "",
      legalEntity: data.legal_entity || data.legalEntity || "",
      panNumber: data.pan_number || data.panNumber || "",
      logoUrl: data.logo_url || data.logo || data.logoUrl || "",
      websiteUrl: data.website_url || data.websiteUrl || "",
      contactEmail: data.contact_email || data.contactEmail || "",
      contactPhone: data.contact_phone || data.contactPhone || "",
      headquartersAddress: data.headquarters_address || data.headquartersAddress || "",
      vatRatePercent: parseFloat(data.vat_rate_percent ?? data.vatRatePercent ?? 13) || 13,
      serviceChargePercent: parseFloat(data.service_charge_percent ?? data.serviceChargePercent ?? 0) || 0,
      defaultCurrency: data.default_currency || data.defaultCurrency || "NPR",
      acceptedPaymentMethods: parsedMethods,
    };
  },

  async updateSettings(settings: Partial<OrganizationSettings>, logoFile?: File | null): Promise<OrganizationSettings> {
    let data: any;
    if (logoFile) {
      const formData = new FormData();
      if (settings.brandName) formData.append("brand_name", settings.brandName);
      if (settings.tagline !== undefined) formData.append("tagline", settings.tagline);
      if (settings.legalEntity) formData.append("legal_entity", settings.legalEntity);
      if (settings.panNumber) formData.append("pan_number", settings.panNumber);
      if (settings.websiteUrl !== undefined) formData.append("website_url", settings.websiteUrl);
      if (settings.contactEmail !== undefined) formData.append("contact_email", settings.contactEmail);
      if (settings.contactPhone !== undefined) formData.append("contact_phone", settings.contactPhone);
      if (settings.headquartersAddress !== undefined) formData.append("headquarters_address", settings.headquartersAddress);
      if (settings.vatRatePercent !== undefined) formData.append("vat_rate_percent", String(settings.vatRatePercent));
      if (settings.serviceChargePercent !== undefined) formData.append("service_charge_percent", String(settings.serviceChargePercent));
      if (settings.acceptedPaymentMethods) {
        formData.append("accepted_payment_methods", JSON.stringify(settings.acceptedPaymentMethods));
      }
      formData.append("logo", logoFile);

      const raw = await baseRequest<any>("/organization/", {
        method: "PATCH",
        body: formData,
      });
      data = raw?.data || raw?.organization || raw?.result || raw || {};
    } else {
      const payload: any = {};
      if (settings.brandName) payload.brand_name = settings.brandName;
      if (settings.tagline !== undefined) payload.tagline = settings.tagline;
      if (settings.legalEntity) payload.legal_entity = settings.legalEntity;
      if (settings.panNumber) payload.pan_number = settings.panNumber;
      if (settings.logoUrl !== undefined) payload.logo_url = settings.logoUrl;
      if (settings.websiteUrl !== undefined) payload.website_url = settings.websiteUrl;
      if (settings.contactEmail !== undefined) payload.contact_email = settings.contactEmail;
      if (settings.contactPhone !== undefined) payload.contact_phone = settings.contactPhone;
      if (settings.headquartersAddress !== undefined) payload.headquarters_address = settings.headquartersAddress;
      if (settings.vatRatePercent !== undefined) payload.vat_rate_percent = settings.vatRatePercent;
      if (settings.serviceChargePercent !== undefined) payload.service_charge_percent = settings.serviceChargePercent;
      if (settings.acceptedPaymentMethods) payload.accepted_payment_methods = settings.acceptedPaymentMethods;

      const raw = await baseRequest<any>("/organization/", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      data = raw?.data || raw?.organization || raw?.result || raw || {};
    }

    let parsedMethods: PaymentMethod[] = settings.acceptedPaymentMethods || ["ESEWA", "FONEPAY_QR", "CASH_ON_PICKUP", "CARD", "WALLET"];
    const rawMethods = data.accepted_payment_methods ?? data.acceptedPaymentMethods;
    if (Array.isArray(rawMethods)) {
      parsedMethods = rawMethods;
    } else if (typeof rawMethods === "string") {
      try {
        const parsed = JSON.parse(rawMethods);
        if (Array.isArray(parsed)) parsedMethods = parsed;
      } catch {}
    }

    return {
      brandName: data.brand_name || data.brandName || settings.brandName || "Crunchy",
      tagline: data.tagline ?? data.tagLine ?? settings.tagline ?? "",
      legalEntity: data.legal_entity || data.legalEntity || settings.legalEntity || "",
      panNumber: data.pan_number || data.panNumber || settings.panNumber || "",
      logoUrl: data.logo_url || data.logo || data.logoUrl || settings.logoUrl || "",
      websiteUrl: data.website_url ?? data.websiteUrl ?? settings.websiteUrl ?? "",
      contactEmail: data.contact_email ?? data.contactEmail ?? settings.contactEmail ?? "",
      contactPhone: data.contact_phone ?? data.contactPhone ?? settings.contactPhone ?? "",
      headquartersAddress: data.headquarters_address ?? data.headquartersAddress ?? settings.headquartersAddress ?? "",
      vatRatePercent: parseFloat(data.vat_rate_percent ?? data.vatRatePercent ?? settings.vatRatePercent ?? 13) || 13,
      serviceChargePercent: parseFloat(data.service_charge_percent ?? data.serviceChargePercent ?? settings.serviceChargePercent ?? 0) || 0,
      defaultCurrency: data.default_currency || data.defaultCurrency || settings.defaultCurrency || "NPR",
      acceptedPaymentMethods: parsedMethods,
    };
  },

  async uploadLogo(file: File): Promise<{ logo_url: string }> {
    const formData = new FormData();
    formData.append("logo", file);
    return baseRequest<{ logo_url: string }>("/organization/logo/", {
      method: "POST",
      body: formData,
    });
  },
};

/**
 * Generic REST client
 */
export const apiClient = {
  get: <T = any>(path: string, options?: RequestOptions) =>
    baseRequest<T>(path, { ...options, method: "GET" }),

  post: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    baseRequest<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    baseRequest<T>(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(path: string, body?: any, options?: RequestOptions) =>
    baseRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(path: string, options?: RequestOptions) =>
    baseRequest<T>(path, { ...options, method: "DELETE" }),
};
