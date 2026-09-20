import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { PortalHeader } from "./components/portal-nav/PortalHeader";
import { CustomerPortal } from "./components/customer/CustomerPortal";
import { StaffPortal } from "./components/staff/StaffPortal";
import { KDSPortal } from "./components/kds/KDSPortal";
import { AdminPortal } from "./components/admin/AdminPortal";
import { KioskPortal } from "./components/kiosk/KioskPortal";
import { TableQrPortal } from "./components/customer/TableQrPortal";
import { TvOrderDisplayPortal } from "./components/tv/TvOrderDisplayPortal";
import { StaffLoginModal } from "./components/auth/StaffLoginModal";
import { AdminLoginPage } from "./components/auth/AdminLoginPage";
import { ToastContainer } from "./components/common/ToastContainer";
import { StaffFloatingOrderNotice } from "./components/staff/StaffFloatingOrderNotice";

const AppContent: React.FC = () => {
  const { userRole, setUserRole, activePortal, setActivePortal, isTableOrderMode, setIsTableOrderMode, toasts, removeToast } = useApp();

  // Track URL route for clean deep-linking (e.g. /admin-login)
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

  const isAdminLoginRoute = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, "");
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === "/admin-login" ||
      path.startsWith("/admin-login") ||
      hash.includes("admin-login") ||
      search.includes("admin-login")
    );
  }, [currentPath]);

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

  // Dedicated Admin Login route (/admin-login)
  if (isAdminLoginRoute) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
        <AdminLoginPage
          onBack={() => {
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

  // If in TV Big Screen / Order Status Display mode (Airport FIDS style)
  if (activePortal === "tv") {
    return (
      <div className="min-h-screen bg-[#060709] text-white antialiased select-none">
        <TvOrderDisplayPortal onClose={() => setActivePortal("customer")} />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // If in TABLE-QR mode (scanned table QR code on phone), render dedicated mobile table experience
  if (activePortal === "table-qr" || isTableOrderMode) {
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

  // If in KIOSK mode, render full-screen self-ordering touch experience
  if (userRole === "KIOSK" || activePortal === "kiosk") {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white antialiased select-none">
        <KioskPortal />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // Temporarily hide Staff / KDS / Manager portals as requested
  const SHOW_STAFF_PORTALS = false;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
      {/* Dynamic Header (Public Restaurant Header for Customer) */}
      <PortalHeader />

      {/* Customer Portal (Staff, KDS, and Manager portals temporarily hidden) */}
      {(!SHOW_STAFF_PORTALS || userRole === "CUSTOMER") && <CustomerPortal />}
      {SHOW_STAFF_PORTALS && userRole === "KITCHEN" && (
        <>
          <StaffFloatingOrderNotice
            onOpenOngoingOrder={() => {
              setUserRole("STAFF");
              setActivePortal("staff");
            }}
            onOpenBillingForOrder={() => {
              setUserRole("STAFF");
              setActivePortal("staff");
            }}
          />
          <KDSPortal />
        </>
      )}
      {SHOW_STAFF_PORTALS && userRole === "STAFF" && <StaffPortal />}
      {SHOW_STAFF_PORTALS && userRole === "ADMIN" && (
        <>
          <StaffFloatingOrderNotice
            onOpenOngoingOrder={() => {
              setUserRole("STAFF");
              setActivePortal("staff");
            }}
            onOpenBillingForOrder={() => {
              setUserRole("STAFF");
              setActivePortal("staff");
            }}
          />
          <AdminPortal />
        </>
      )}

      {/* Staff & Management Login Modal (temporarily hidden) */}
      {SHOW_STAFF_PORTALS && <StaffLoginModal />}

      {/* Global Notification Toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
