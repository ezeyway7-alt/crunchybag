import {
  AuthTokens,
  BackendOutlet,
  BackendUser,
  LoginPayload,
  LoginResponse,
  RefreshPayload,
  RefreshResponse,
} from "../types/auth";
import { authStorage } from "./authStorage";

// Production backend live endpoints
export const LIVE_API_ORIGIN = "https://crunchybag.com";
export const API_BASE_URL = `${LIVE_API_ORIGIN}/api/v1`;

// Local & preview proxy base path (routed through Vite dev server proxy to handle CORS & strip X-Forwarded-Host)
export const PROXY_API_BASE_URL = "/api/v1";

// In the browser, unless already hosted on crunchybag.com, use the proxy path to avoid CORS blocks
const isHostedOnCrunchyBag = typeof window !== "undefined" && window.location.origin === LIVE_API_ORIGIN;
export const DEFAULT_API_BASE = isHostedOnCrunchyBag ? API_BASE_URL : PROXY_API_BASE_URL;

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

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      ...restOptions,
      headers: requestHeaders,
    });
  } catch (networkErr: any) {
    // If request failed (e.g. direct CORS failure), attempt fallback via proxy URL
    if (targetUrl.startsWith(LIVE_API_ORIGIN)) {
      try {
        const proxyUrl = targetUrl.replace(LIVE_API_ORIGIN, "");
        response = await fetch(proxyUrl, {
          ...restOptions,
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

  try {
    resp = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch (err) {
    // If relative fetch failed, try direct live origin
    const fallbackUrl = `${LIVE_API_ORIGIN}/api/v1/auth/token/refresh/`;
    resp = await fetch(fallbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
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
    const result = await baseRequest<LoginResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
      skipRefreshRetry: true,
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
