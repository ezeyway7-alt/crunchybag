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
let refreshSubscribers: {resolve: (newToken: string) => void; reject: (error: unknown) => void}[] = [];

const subscribeTokenRefresh = (resolve: (newToken: string) => void, reject: (error: unknown) => void) => {
  refreshSubscribers.push({resolve, reject});
};

const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((subscriber) => subscriber.resolve(newToken));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach(subscriber => subscriber.reject(error));
  refreshSubscribers = [];
};

/**
 * Format human-friendly error messages from DRF backend error payloads.
 * Strictly guarantees no raw HTML strings or technical dumps are shown to the user.
 */
const genericMessages = /^(error|failed|failure|bad request|validation error|request failed|invalid input)[.!]?$/i;

function responseMessages(value: unknown, path: string[] = []): string[] {
  if (typeof value === "string") {
    const message = value.trim();
    if (!message || genericMessages.test(message) || /<\/?(?:html|body|script|head|!doctype)\b|Traceback \(most recent call last\)|\bat .+\([^)]*:\d+:\d+\)|SQLSTATE|django\.db|password\s*[=:]|authorization\s*[=:]/i.test(message)) return [];
    return [path.length ? `${path.join(' > ')}: ${message}` : message];
  }
  if (Array.isArray(value)) return value.flatMap((part, index) => responseMessages(part,
    part && typeof part === 'object' ? [...path, `Item ${index + 1}`] : path));
  if (!value || typeof value !== 'object') return [];
  const envelopes = new Set(['detail', 'details', 'error', 'errors', 'message', 'messages', 'non_field_errors', 'data']);
  const metadata = new Set(['code', 'status', 'status_code', 'success', 'type', 'request_id', 'trace_id']);
  return Object.entries(value).flatMap(([field, part]) => {
    if (metadata.has(field) && !Array.isArray(part) && (typeof part !== 'object' || part === null)) return [];
    const label = field.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
    return responseMessages(part, envelopes.has(field) ? path : [...path, label]);
  });
}

export function extractErrorMessage(error: unknown): string {
  const wrapped = error as {response?: {data?: unknown; status?: number}; data?: unknown; status?: number; message?: string} | null;
  if (!(error instanceof ApiError) && wrapped?.response) return extractErrorMessage(new ApiError(wrapped.message || '', wrapped.response.status || 0, wrapped.response.data));
  const data = error instanceof ApiError ? error.data : error instanceof Error ? null : error;
  const messages = [...new Set(responseMessages(data))];
  if (messages.length) return messages.join('\n');
  if (error instanceof ApiError) {
    const fallback: Record<number, string> = {
      0: 'Unable to reach the server. Check your connection and try again.',
      400: 'Please check the entered values and try again.',
      401: 'Your session has expired or your sign-in details are incorrect. Please sign in again.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested item could not be found.',
      409: 'This information has changed. Review the latest details and try again.',
      413: 'The upload is too large. Choose a smaller file.',
      422: 'Please correct the invalid values and try again.',
      429: 'Too many requests. Please wait a moment and try again.',
    };
    if ([502,503,504].includes(error.status)) return 'The service is temporarily unavailable. Please try again shortly.';
    if (error.status >= 500) return 'The server could not complete this request. Please try again shortly.';
    const specific = responseMessages(error.message).filter(message => !/^HTTP Error/i.test(message));
    return specific.join('\n') || fallback[error.status] || 'The request could not be completed. Please try again.';
  }
  if (error instanceof Error) {
    if (/failed to fetch|networkerror|load failed/i.test(error.message)) return 'Unable to reach the server. Check your connection and try again.';
    return responseMessages(error.message).join('\n') || 'The request could not be completed. Please try again.';
  }
  return 'The request could not be completed. Please try again.';
}

/**
 * Core HTTP client with automatic Authorization header and silent 401 token refresh
 */
async function unobservedRequest<T = any>(
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
    if (restOptions.signal?.aborted || networkErr?.name === "AbortError") throw networkErr;
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
          const failure = refreshErr instanceof ApiError ? refreshErr : new ApiError("Session expired. Please sign in again.", 401);
          onTokenRefreshFailed(failure);
          authStorage.clearSession();
          throw failure;
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
          }, reject);
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
  if ((contentType.includes("application/json") || contentType.includes("+json"))) {
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
    const error = new ApiError('', response.status, responseData);
    error.message = extractErrorMessage(error);
    throw error;
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
    let data: unknown;
    try { data = await resp.json(); } catch { data = null; }
    const error = new ApiError('', resp.status, data);
    error.message = extractErrorMessage(error);
    throw error;
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
export function normalizeOutletId(id?: string | number | null): string {
  if (id === null || id === undefined) return "1";
  const str = String(id).trim();
  if (!str) return "1";
  if (/^\d+$/.test(str)) return str;
  const digits = str.replace(/\D/g, "");
  if (digits) {
    const num = parseInt(digits, 10);
    if (!Number.isNaN(num) && num > 0) return String(num);
  }
  return "1";
}

export const branchApi = {
  async getBranches(restaurantId: string | number = 1): Promise<BackendOutlet[]> {
    try {
      const raw = await baseRequest<any>(`/restaurants/${restaurantId}/branches/`, {
        skipAuth: true,
      });
      if (Array.isArray(raw)) return raw;
      if (raw?.results && Array.isArray(raw.results)) return raw.results;
      return [];
    } catch (e) {
      throw e;
    }
  },
};

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
      const rawOutlet = result.outlet;
      const rawUser = result.user as any;
      const userAssigned = rawUser?.assigned_outlet || rawUser?.outlet;
      const userOutletId = rawUser?.outlet_id || rawUser?.assignedOutletId;

      const outletId = normalizeOutletId(rawOutlet?.id || userAssigned?.id || userOutletId || "1");
      const outletName = rawOutlet?.name || userAssigned?.name || "Main Branch";

      const resolvedOutlet: BackendOutlet = {
        ...(userAssigned || {}),
        ...(rawOutlet || {}),
        id: outletId,
        name: outletName,
        branch_code: rawOutlet?.branch_code || userAssigned?.branch_code || "01",
      };

      authStorage.setSession({
        access: result.access,
        refresh: result.refresh || "",
        user: result.user,
        outlet: resolvedOutlet,
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
 * Automatically interfaces with live DRF /api/v1/restaurants/ and /api/v1/organization/
 */
let cachedRestaurantId: string | number = 1;

export const organizationApi = {
  async getSettings(): Promise<OrganizationSettings> {
    let data: any = null;

    // 1. Try real live endpoint /restaurants/
    try {
      const raw = await baseRequest<any>("/restaurants/");
      if (Array.isArray(raw) && raw.length > 0) {
        data = raw[0];
        if (data.id) cachedRestaurantId = data.id;
      } else if (raw?.results && Array.isArray(raw.results) && raw.results.length > 0) {
        data = raw.results[0];
        if (data.id) cachedRestaurantId = data.id;
      } else if (raw && typeof raw === "object") {
        data = raw;
        if (data.id) cachedRestaurantId = data.id;
      }
    } catch (restErr) {
      // 2. Fallback to /organization/
      try {
        const rawOrg = await baseRequest<any>("/organization/");
        data = rawOrg?.data || rawOrg?.organization || rawOrg?.result || rawOrg || {};
      } catch (orgErr) {
        // rethrow to let caller handle
        throw restErr;
      }
    }

    if (!data) {
      throw new Error("No organization or restaurant details found on server");
    }

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
      brandName: data.name || data.brand_name || data.brandName || "Crunchy Bag",
      tagline: data.description || data.tagline || data.tagLine || "",
      legalEntity: data.legal_entity || data.legalEntity || data.name || "Crunchy Bag",
      panNumber: data.pan_number || data.panNumber || "",
      logoUrl: data.logo_url || data.logo || data.logoUrl || "",
      websiteUrl: data.website || data.website_url || data.websiteUrl || "https://crunchybag.com/",
      contactEmail: data.email || data.contact_email || data.contactEmail || "",
      contactPhone: data.phone || data.contact_phone || data.contactPhone || "",
      headquartersAddress: data.address || data.headquarters_address || data.headquartersAddress || "Kathmandu, Nepal",
      vatRatePercent: parseFloat(data.vat_rate_percent ?? data.vatRatePercent ?? 13) || 13,
      serviceChargePercent: parseFloat(data.service_charge_percent ?? data.serviceChargePercent ?? 0) || 0,
      defaultCurrency: data.default_currency || data.defaultCurrency || "NPR",
      acceptedPaymentMethods: parsedMethods,
    };
  },

  async updateSettings(settings: Partial<OrganizationSettings>, logoFile?: File | null): Promise<OrganizationSettings> {
    let data: any = null;
    const restId = cachedRestaurantId || 1;

    // Helper to attempt PATCH on /restaurants/{id}/ first, then fallback to /organization/
    const sendUpdate = async (endpoint: string, isMultipart: boolean, body: any) => {
      return baseRequest<any>(endpoint, {
        method: "PATCH",
        body: isMultipart ? body : JSON.stringify(body),
      });
    };

    if (logoFile) {
      const restFormData = new FormData();
      if (settings.brandName) restFormData.append("name", settings.brandName);
      if (settings.tagline !== undefined) restFormData.append("description", settings.tagline);
      if (settings.panNumber) restFormData.append("pan_number", settings.panNumber);
      if (settings.websiteUrl !== undefined) restFormData.append("website", settings.websiteUrl);
      if (settings.contactEmail !== undefined) restFormData.append("email", settings.contactEmail);
      if (settings.contactPhone !== undefined) restFormData.append("phone", settings.contactPhone);
      // Also add standard organization field aliases in case server supports them
      if (settings.brandName) restFormData.append("brand_name", settings.brandName);
      if (settings.legalEntity) restFormData.append("legal_entity", settings.legalEntity);
      restFormData.append("logo", logoFile);

      try {
        const raw = await sendUpdate(`/restaurants/${restId}/`, true, restFormData);
        data = raw?.data || raw || {};
      } catch (err1) {
        // Fallback to /organization/
        try {
          const orgFormData = new FormData();
          if (settings.brandName) orgFormData.append("brand_name", settings.brandName);
          if (settings.tagline !== undefined) orgFormData.append("tagline", settings.tagline);
          if (settings.legalEntity) orgFormData.append("legal_entity", settings.legalEntity);
          if (settings.panNumber) orgFormData.append("pan_number", settings.panNumber);
          if (settings.websiteUrl !== undefined) orgFormData.append("website_url", settings.websiteUrl);
          if (settings.contactEmail !== undefined) orgFormData.append("contact_email", settings.contactEmail);
          if (settings.contactPhone !== undefined) orgFormData.append("contact_phone", settings.contactPhone);
          if (settings.headquartersAddress !== undefined) orgFormData.append("headquarters_address", settings.headquartersAddress);
          orgFormData.append("logo", logoFile);
          const raw2 = await sendUpdate("/organization/", true, orgFormData);
          data = raw2?.data || raw2 || {};
        } catch (err2) {
          throw err1; // Throw original error
        }
      }
    } else {
      const restPayload: any = {};
      if (settings.brandName) restPayload.name = settings.brandName;
      if (settings.tagline !== undefined) restPayload.description = settings.tagline;
      if (settings.panNumber) restPayload.pan_number = settings.panNumber;
      if (settings.websiteUrl !== undefined) restPayload.website = settings.websiteUrl;
      if (settings.contactEmail !== undefined) restPayload.email = settings.contactEmail;
      if (settings.contactPhone !== undefined) restPayload.phone = settings.contactPhone;
      if (settings.logoUrl !== undefined) restPayload.logo_url = settings.logoUrl;

      try {
        const raw = await sendUpdate(`/restaurants/${restId}/`, false, restPayload);
        data = raw?.data || raw || {};
      } catch (err1) {
        // Fallback to /organization/
        try {
          const orgPayload: any = {};
          if (settings.brandName) orgPayload.brand_name = settings.brandName;
          if (settings.tagline !== undefined) orgPayload.tagline = settings.tagline;
          if (settings.legalEntity) orgPayload.legal_entity = settings.legalEntity;
          if (settings.panNumber) orgPayload.pan_number = settings.panNumber;
          if (settings.logoUrl !== undefined) orgPayload.logo_url = settings.logoUrl;
          if (settings.websiteUrl !== undefined) orgPayload.website_url = settings.websiteUrl;
          if (settings.contactEmail !== undefined) orgPayload.contact_email = settings.contactEmail;
          if (settings.contactPhone !== undefined) orgPayload.contact_phone = settings.contactPhone;
          if (settings.headquartersAddress !== undefined) orgPayload.headquarters_address = settings.headquartersAddress;
          const raw2 = await sendUpdate("/organization/", false, orgPayload);
          data = raw2?.data || raw2 || {};
        } catch (err2) {
          throw err1;
        }
      }
    }

    let parsedMethods: PaymentMethod[] = settings.acceptedPaymentMethods || ["ESEWA", "FONEPAY_QR", "CASH_ON_PICKUP", "CARD", "WALLET"];
    const rawMethods = data?.accepted_payment_methods ?? data?.acceptedPaymentMethods;
    if (Array.isArray(rawMethods)) {
      parsedMethods = rawMethods;
    } else if (typeof rawMethods === "string") {
      try {
        const parsed = JSON.parse(rawMethods);
        if (Array.isArray(parsed)) parsedMethods = parsed;
      } catch {}
    }

    return {
      brandName: data?.name || data?.brand_name || data?.brandName || settings.brandName || "Crunchy Bag",
      tagline: data?.description ?? data?.tagline ?? data?.tagLine ?? settings.tagline ?? "",
      legalEntity: data?.legal_entity || data?.legalEntity || data?.name || settings.legalEntity || "Crunchy Bag",
      panNumber: data?.pan_number || data?.panNumber || settings.panNumber || "",
      logoUrl: data?.logo_url || data?.logo || data?.logoUrl || settings.logoUrl || "",
      websiteUrl: data?.website ?? data?.website_url ?? data?.websiteUrl ?? settings.websiteUrl ?? "https://crunchybag.com/",
      contactEmail: data?.email ?? data?.contact_email ?? data?.contactEmail ?? settings.contactEmail ?? "",
      contactPhone: data?.phone ?? data?.contact_phone ?? data?.contactPhone ?? settings.contactPhone ?? "",
      headquartersAddress: data?.address ?? data?.headquarters_address ?? data?.headquartersAddress ?? settings.headquartersAddress ?? "",
      vatRatePercent: parseFloat(data?.vat_rate_percent ?? data?.vatRatePercent ?? settings.vatRatePercent ?? 13) || 13,
      serviceChargePercent: parseFloat(data?.service_charge_percent ?? data?.serviceChargePercent ?? settings.serviceChargePercent ?? 0) || 0,
      defaultCurrency: data?.default_currency || data?.defaultCurrency || settings.defaultCurrency || "NPR",
      acceptedPaymentMethods: parsedMethods,
    };
  },

  async uploadLogo(file: File): Promise<{ logo_url: string }> {
    const formData = new FormData();
    formData.append("logo", file);
    try {
      return await baseRequest<{ logo_url: string }>(`/restaurants/${cachedRestaurantId || 1}/`, {
        method: "PATCH",
        body: formData,
      });
    } catch {
      return baseRequest<{ logo_url: string }>("/organization/logo/", {
        method: "POST",
        body: formData,
      });
    }
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


export function reportApiError(error: unknown, title = 'Request could not be completed') {
  if ((error as {name?: string})?.name === 'AbortError') return;
  window.dispatchEvent(new CustomEvent('crunchy:api-error', {detail:{title, description:extractErrorMessage(error), type:'error'}}));
}

// Only endpoint category, status and timing leave the HTTP client. Never headers or payloads.
export async function baseRequest<T = any>(endpoint:string, options:RequestOptions={}):Promise<T> {
  const started=performance.now();
  const observed=/^\/?(?:customer\/(?:checkout|cart|orders)|catalog\/(?:menu|quote))/.test(endpoint);
  const emit=(status:number)=>{
    if(observed && typeof window!=='undefined') window.dispatchEvent(new CustomEvent('journey:api',{detail:{
      endpoint:endpoint.split('?')[0].replace(/\/\d+(?=\/|$)/g,'/:id'),method:options.method || 'GET',status,duration_ms:Math.max(0,performance.now()-started),
      error_category:status===0?'network':status>=500?'server':status>=400?'request_rejected':'none',
    }}));
  };
  try{const result=await unobservedRequest<T>(endpoint,options);emit(200);return result;}
  catch(error){if(!(error instanceof DOMException && error.name==='AbortError')&&!options.signal?.aborted)emit(error instanceof ApiError?error.status:0);throw error;}
}
