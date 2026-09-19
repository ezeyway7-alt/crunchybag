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
import { ToastContainer } from "./components/common/ToastContainer";
import { StaffFloatingOrderNotice } from "./components/staff/StaffFloatingOrderNotice";

const AppContent: React.FC = () => {
  const { userRole, setUserRole, activePortal, setActivePortal, isTableOrderMode, setIsTableOrderMode, toasts, removeToast } = useApp();

  // Enforce permanent dark theme across all mobile and desktop browsers
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.backgroundColor = "#09090b";
    document.body.style.backgroundColor = "#09090b";
  }, []);

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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
      {/* Dynamic Header (Public Restaurant Header for Customer, Operational Top Bar for Staff) */}
      <PortalHeader />

      {/* Role-isolated Portal Rendering: Each user accesses only their own dashboard */}
      {userRole === "CUSTOMER" && <CustomerPortal />}
      {userRole === "KITCHEN" && (
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
      {userRole === "STAFF" && <StaffPortal />}
      {userRole === "ADMIN" && (
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

      {/* Staff & Management Login Modal */}
      <StaffLoginModal />

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
