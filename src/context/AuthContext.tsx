import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  AuthTokens,
  BackendOutlet,
  BackendRole,
  BackendUser,
  LoginPayload,
  LoginResponse,
  ROLE_ROUTE_MAP,
} from "../types/auth";
import { authStorage } from "../lib/authStorage";
import { authApi, extractErrorMessage } from "../lib/api";

interface AuthContextType {
  authUser: BackendUser | null;
  authOutlet: BackendOutlet | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (credentials: LoginPayload) => Promise<LoginResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  navigateToRoleDashboard: (role?: BackendRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<BackendUser | null>(() => authStorage.getUser());
  const [authOutlet, setAuthOutlet] = useState<BackendOutlet | null>(() => authStorage.getOutlet());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Initialize and validate session with GET /api/v1/auth/me/ on app start
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      const tokens = authStorage.getTokens();
      if (!tokens?.access) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const meResult = await authApi.getMe();
        if (mounted && meResult) {
          // meResult can be { user: ..., outlet: ... } or direct user object
          const rawMe = meResult as any;
          const userObj: BackendUser | null = rawMe?.user || (rawMe?.role ? rawMe : null);
          const outletObj: BackendOutlet | null = rawMe?.outlet || null;
          
          if (userObj) {
            setAuthUser(userObj);
            authStorage.setUser(userObj);
          }
          if (outletObj) {
            setAuthOutlet(outletObj);
            authStorage.setOutlet(outletObj);
          }
        }
      } catch (err) {
        // If 401 and refresh also failed, clear session
        console.warn("Auth initialization check:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Listen for storage events across tabs or local dispatch
    const handleAuthChange = (e: Event) => {
      const custom = e as CustomEvent<{ user: BackendUser; outlet: BackendOutlet }>;
      if (custom.detail) {
        setAuthUser(custom.detail.user);
        setAuthOutlet(custom.detail.outlet);
      } else {
        setAuthUser(authStorage.getUser());
        setAuthOutlet(authStorage.getOutlet());
      }
    };

    const handleAuthLogout = () => {
      setAuthUser(null);
      setAuthOutlet(null);
    };

    const handleOutletChange = (e: Event) => {
      const custom = e as CustomEvent<BackendOutlet>;
      if (custom.detail) {
        setAuthOutlet(custom.detail);
      } else {
        setAuthOutlet(authStorage.getOutlet());
      }
    };

    window.addEventListener("crunchy:auth_change", handleAuthChange);
    window.addEventListener("crunchy:auth_logout", handleAuthLogout);
    window.addEventListener("crunchy:outlet_change", handleOutletChange);

    return () => {
      mounted = false;
      window.removeEventListener("crunchy:auth_change", handleAuthChange);
      window.removeEventListener("crunchy:auth_logout", handleAuthLogout);
      window.removeEventListener("crunchy:outlet_change", handleOutletChange);
    };
  }, []);

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const navigateToRoleDashboard = useCallback((role?: BackendRole) => {
    const rawRole = String(role || authUser?.role || "").toUpperCase();
    if (!rawRole) {
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", "/menu");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
      return;
    }

    const isAdmin = [
      "SUPERADMIN",
      "ADMIN",
      "RESTAURANT_OWNER",
      "BRANCH_MANAGER",
      "MANAGER",
      "OWNER",
      "SUPERUSER",
      "GENERAL_MANAGER",
    ].includes(rawRole);

    const route = isAdmin ? "/admin" : (ROLE_ROUTE_MAP[rawRole] || "/menu");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", route);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [authUser?.role]);

  const login = async (credentials: LoginPayload): Promise<LoginResponse> => {
    const res = await authApi.login(credentials);
    setAuthUser(res.user);
    setAuthOutlet(res.outlet || null);
    setIsLoginModalOpen(false);
    return res;
  };

  const logout = useCallback(() => {
    authApi.logout();
    setAuthUser(null);
    setAuthOutlet(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  const refreshProfile = async () => {
    try {
      const meResult = await authApi.getMe();
      if (meResult) {
        const rawMe = meResult as any;
        const userObj: BackendUser | null = rawMe?.user || (rawMe?.role ? rawMe : null);
        const outletObj: BackendOutlet | null = rawMe?.outlet || null;
        if (userObj) {
          setAuthUser(userObj);
          authStorage.setUser(userObj);
        }
        if (outletObj) {
          setAuthOutlet(outletObj);
          authStorage.setOutlet(outletObj);
        }
      }
    } catch (err) {
      console.warn("Could not refresh profile", err);
    }
  };

  const isAuthenticated = !!authUser && !!authStorage.getAccessToken();

  return (
    <AuthContext.Provider
      value={{
        authUser,
        authOutlet,
        isAuthenticated,
        isLoading,
        isLoginModalOpen,
        setIsLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
        refreshProfile,
        navigateToRoleDashboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Global Outlet Hook for POS, KDS, Menu components to read branch settings
export const useOutletContext = () => {
  const { authOutlet } = useAuth();
  return {
    outlet: authOutlet,
    outletId: authOutlet?.id || null,
    branchCode: authOutlet?.branch_code || authOutlet?.code || null,
    outletName: authOutlet?.name || "Kathmandu Flagship",
    operatingChannels: authOutlet?.operating_channels || {
      dine_in: authOutlet?.dine_in ?? true,
      pos: authOutlet?.pos ?? true,
      delivery: authOutlet?.delivery ?? true,
      takeaway: authOutlet?.takeaway ?? true,
      drive_thru: authOutlet?.drive_thru ?? true,
    },
    isDineInAllowed: authOutlet?.dine_in ?? true,
    isPosAllowed: authOutlet?.pos ?? true,
    isDeliveryAllowed: authOutlet?.delivery ?? true,
  };
};
