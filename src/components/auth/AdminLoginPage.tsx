import React from "react";
import { UnifiedLoginModal } from "./UnifiedLoginModal";

interface AdminLoginPageProps {
  onBack?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBack }) => {
  return <UnifiedLoginModal fullPage={true} onClose={onBack} />;
};
