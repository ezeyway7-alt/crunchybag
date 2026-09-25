import { AuthTokens, BackendOutlet, BackendUser } from "../types/auth";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "crunchy_access_token",
  REFRESH_TOKEN: "crunchy_refresh_token",
  USER: "crunchy_auth_user",
  OUTLET: "crunchy_auth_outlet",
} as const;

export const authStorage = {
  getAccessToken(): string | null {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  getRefreshToken(): string | null {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  getTokens(): AuthTokens | null {
    const access = this.getAccessToken();
    const refresh = this.getRefreshToken();
    if (!access && !refresh) return null;
    return {
      access: access || "",
      refresh: refresh || "",
    };
  },

  getUser(): BackendUser | null {
    try {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getOutlet(): BackendOutlet | null {
    try {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem(STORAGE_KEYS.OUTLET);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setSession(params: {
    access: string;
    refresh: string;
    user: BackendUser;
    outlet: BackendOutlet;
  }): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, params.access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, params.refresh);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(params.user));
      localStorage.setItem(STORAGE_KEYS.OUTLET, JSON.stringify(params.outlet));
      window.dispatchEvent(
        new CustomEvent("crunchy:auth_change", {
          detail: { user: params.user, outlet: params.outlet },
        })
      );
    } catch (e) {
      console.error("Failed to save auth session to localStorage", e);
    }
  },

  setAccessToken(access: string): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    } catch (e) {
      console.error("Failed to update access token in localStorage", e);
    }
  },

  setUser(user: BackendUser): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      window.dispatchEvent(
        new CustomEvent("crunchy:auth_user_change", { detail: user })
      );
    } catch (e) {
      console.error("Failed to save user in localStorage", e);
    }
  },

  setOutlet(outlet: BackendOutlet): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(STORAGE_KEYS.OUTLET, JSON.stringify(outlet));
      window.dispatchEvent(
        new CustomEvent("crunchy:outlet_change", { detail: outlet })
      );
    } catch (e) {
      console.error("Failed to save outlet in localStorage", e);
    }
  },

  clearSession(): void {
    try {
      if (typeof window === "undefined") return;
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.OUTLET);
      window.dispatchEvent(new CustomEvent("crunchy:auth_logout"));
    } catch (e) {
      console.error("Failed to clear auth session from localStorage", e);
    }
  },
};
