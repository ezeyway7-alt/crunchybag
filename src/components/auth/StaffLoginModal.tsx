import React from "react";
import { UnifiedLoginModal } from "./UnifiedLoginModal";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

export const StaffLoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const { isLoginModalOpen: appLoginModalOpen, setIsLoginModalOpen: setAppLoginModalOpen } = useApp();

  const isOpen = isLoginModalOpen || appLoginModalOpen;
  const handleClose = () => {
    setIsLoginModalOpen(false);
    setAppLoginModalOpen(false);
  };

  return <UnifiedLoginModal isOpen={isOpen} onClose={handleClose} />;
};
