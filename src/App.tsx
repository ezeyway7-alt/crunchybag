import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PortalHeader } from "./components/portal-nav/PortalHeader";
import { CustomerPortal } from "./components/customer/CustomerPortal";
import { StaffPortal } from "./components/staff/StaffPortal";
import { KDSPortal } from "./components/kds/KDSPortal";
import { AdminPortal } from "./components/admin/AdminPortal";
import { PlatformPortal } from "./components/platform/PlatformPortal";
import { WaiterPortal } from "./components/staff/WaiterPortal";
import { RiderPortal } from "./components/staff/RiderPortal";
import { KioskPortal } from "./components/kiosk/KioskPortal";
import { TableQrPortal } from "./components/customer/TableQrPortal";
import { TvOrderDisplayPortal } from "./components/tv/TvOrderDisplayPortal";
import { UnifiedLoginModal } from "./components/auth/UnifiedLoginModal";
import { ToastContainer } from "./components/common/ToastContainer";

const AppContent: React.FC = () => {
  const {
    activePortal,
    setActivePortal,
    isTableOrderMode,
    setIsTableOrderMode,
    toasts,
    removeToast,
  } = useApp();

  const {
    authUser,
    isAuthenticated,
    isLoginModalOpen,
    closeLoginModal,
  } = useAuth();

  // Track URL route for clean deep-linking
  const [currentPath, setCurrentPath] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    }
    return "/";
  });

  React.useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== "undefined") {
        const path = window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
        setCurrentPath(path);
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  // Enforce permanent dark theme across all mobile and desktop browsers
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
    document.documentElement.style.backgroundColor = "#09090b";
    document.body.classList.add("dark");
    document.body.style.colorScheme = "dark";
    document.body.style.backgroundColor = "#09090b";
  }, []);

  // Route classifications
  const isLoginRoute =
    currentPath === "/admin-login" ||
    currentPath.startsWith("/admin-login") ||
    currentPath === "/login" ||
    currentPath.startsWith("/login");

  // All administrative manager and superadmin routes lead directly to the full Admin Dashboard (AdminPortal)
  const isAdminRoute =
    currentPath === "/admin" ||
    (currentPath.startsWith("/admin") && currentPath !== "/admin-login" && !currentPath.startsWith("/admin-login")) ||
    currentPath === "/superadmin" ||
    currentPath.startsWith("/superadmin") ||
    currentPath === "/brand/dashboard" ||
    currentPath.startsWith("/brand") ||
    currentPath === "/outlet/dashboard" ||
    currentPath.startsWith("/outlet") ||
    currentPath === "/dashboard" ||
    activePortal === "admin" ||
    activePortal === "platform";

  const isPosRoute = currentPath === "/pos" || currentPath.startsWith("/pos") || activePortal === "staff";
  const isKdsRoute = currentPath === "/kds" || currentPath.startsWith("/kds") || activePortal === "kitchen";
  const isWaiterRoute = currentPath === "/waiter" || currentPath.startsWith("/waiter");
  const isRiderRoute = currentPath === "/rider" || currentPath.startsWith("/rider");

  const isProtectedRoleRoute =
    isAdminRoute ||
    isPosRoute ||
    isKdsRoute ||
    isWaiterRoute ||
    isRiderRoute;

  // 1. Direct Login Page route (/admin-login or /login)
  if (isLoginRoute) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        <UnifiedLoginModal
          fullPage={true}
          onClose={() => {
            if (typeof window !== "undefined") {
              window.history.pushState(null, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
              setCurrentPath("/");
            }
          }}
        />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 2. Protected routes guard: If user accesses staff/admin portal while logged out, show Login screen
  if (isProtectedRoleRoute && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        <UnifiedLoginModal
          fullPage={true}
          onClose={() => {
            if (typeof window !== "undefined") {
              window.history.pushState(null, "", "/menu");
              window.dispatchEvent(new PopStateEvent("popstate"));
              setCurrentPath("/menu");
            }
          }}
        />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 3. Admin & Manager Portal (/admin, /superadmin, /brand/dashboard, /outlet/dashboard, /dashboard)
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        <AdminPortal />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 6. Cashier POS Counter (/pos)
  if (isPosRoute) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        <StaffPortal />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 7. Chef KDS Kitchen Station (/kds)
  if (isKdsRoute) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        <KDSPortal />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 8. Waiter Portal (/waiter)
  if (isWaiterRoute) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        <WaiterPortal />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 9. Delivery Rider Portal (/rider)
  if (isRiderRoute) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        <RiderPortal />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 10. TV Big Screen / Order Status Display mode
  if (activePortal === "tv" || currentPath === "/tv") {
    return (
      <div className="min-h-screen bg-[#060709] text-white antialiased select-none">
        <TvOrderDisplayPortal onClose={() => setActivePortal("customer")} />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 11. TABLE-QR mode (scanned table QR code on phone)
  if (activePortal === "table-qr" || isTableOrderMode || currentPath === "/table-qr") {
    return (
      <div className="min-h-screen bg-[#09090C] text-white antialiased select-none">
        <TableQrPortal
          onClose={() => {
            setIsTableOrderMode(false);
            setActivePortal("customer");
          }}
        />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 12. KIOSK mode
  if (activePortal === "kiosk" || currentPath === "/kiosk") {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white antialiased select-none">
        <KioskPortal />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // 13. Default Customer Storefront & Menu (/menu or /)
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
      <PortalHeader />
      <CustomerPortal />

      {/* Popup Login Modal triggered by footer admin button or login action */}
      <UnifiedLoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
      />

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
