import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { PortalHeader } from "./components/portal-nav/PortalHeader";
import { CustomerPortal } from "./components/customer/CustomerPortal";
import { StaffPortal } from "./components/staff/StaffPortal";
import { KDSPortal } from "./components/kds/KDSPortal";
import { AdminPortal } from "./components/admin/AdminPortal";
import { StaffLoginModal } from "./components/auth/StaffLoginModal";
import { ToastContainer } from "./components/common/ToastContainer";

const AppContent: React.FC = () => {
  const { userRole, toasts, removeToast } = useApp();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0B] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-amber-500 selection:text-black">
      {/* Dynamic Header (Public Restaurant Header for Customer, Operational Top Bar for Staff) */}
      <PortalHeader />

      {/* Role-isolated Portal Rendering: Each user accesses only their own dashboard */}
      {userRole === "CUSTOMER" && <CustomerPortal />}
      {userRole === "KITCHEN" && <KDSPortal />}
      {userRole === "STAFF" && <StaffPortal />}
      {userRole === "ADMIN" && <AdminPortal />}

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
