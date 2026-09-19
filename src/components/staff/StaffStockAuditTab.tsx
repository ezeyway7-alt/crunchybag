import React from "react";
import { StockAuditWorkbench } from "./inventory/StockAuditWorkbench";

export const StaffStockAuditTab: React.FC = () => {
  return (
    <div className="space-y-3">
      <StockAuditWorkbench />
    </div>
  );
};
