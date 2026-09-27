import { useEffect, useRef, useState, useCallback } from "react";
import { authStorage } from "./authStorage";

export interface InventoryRestockedEvent {
  event: "INVENTORY_RESTOCKED";
  outlet_id?: string;
  invoice_number?: string;
  supplier_name?: string;
  updated_items?: Array<{ item_id: string | number; new_stock: number; unit: string; cost_per_unit?: number }>;
  timestamp?: string;
}

export interface StockDeductedEvent {
  event: "STOCK_DEDUCTED_BY_SALE";
  outlet_id?: string;
  order_number?: string;
  deductions?: Array<{ item_id: string | number; quantity_deducted: number; remaining_stock: number }>;
  timestamp?: string;
}

export interface LowStockAlertEvent {
  event: "LOW_STOCK_ALERT";
  outlet_id?: string;
  item_id: string | number;
  item_name: string;
  current_stock: number;
  min_threshold: number;
  timestamp?: string;
}

export interface StockAuditAdjustedEvent {
  event: "STOCK_AUDIT_ADJUSTED";
  outlet_id?: string;
  audit_id?: string | number;
  adjustments?: Array<{ item_id: string | number; adjusted_stock: number }>;
  timestamp?: string;
}

export type InventoryWebSocketMessage =
  | InventoryRestockedEvent
  | StockDeductedEvent
  | LowStockAlertEvent
  | StockAuditAdjustedEvent
  | { event: string; [key: string]: any };

interface UseInventoryWebSocketOptions {
  outletId?: string;
  onRestocked?: (data: InventoryRestockedEvent) => void;
  onStockDeducted?: (data: StockDeductedEvent) => void;
  onLowStockAlert?: (data: LowStockAlertEvent) => void;
  onAuditAdjusted?: (data: StockAuditAdjustedEvent) => void;
  onAnyUpdate?: () => void;
  enabled?: boolean;
}

export function useInventoryWebSocket({
  outletId = "DM-01",
  onRestocked,
  onStockDeducted,
  onLowStockAlert,
  onAuditAdjusted,
  onAnyUpdate,
  enabled = true,
}: UseInventoryWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<InventoryWebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const retryCountRef = useRef(0);

  // Keep callback refs fresh
  const onRestockedRef = useRef(onRestocked);
  onRestockedRef.current = onRestocked;
  const onStockDeductedRef = useRef(onStockDeducted);
  onStockDeductedRef.current = onStockDeducted;
  const onLowStockAlertRef = useRef(onLowStockAlert);
  onLowStockAlertRef.current = onLowStockAlert;
  const onAuditAdjustedRef = useRef(onAuditAdjusted);
  onAuditAdjustedRef.current = onAuditAdjusted;
  const onAnyUpdateRef = useRef(onAnyUpdate);
  onAnyUpdateRef.current = onAnyUpdate;

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const token = authStorage.getAccessToken() || "";
      const baseWsUrl = "wss://crunchybag.com/ws/inventory";
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
      const wsUrl = `${baseWsUrl}/${encodeURIComponent(outletId)}/${tokenParam}`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retryCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as InventoryWebSocketMessage;
          setLastMessage(parsed);

          switch (parsed.event) {
            case "INVENTORY_RESTOCKED":
              onRestockedRef.current?.(parsed as InventoryRestockedEvent);
              break;
            case "STOCK_DEDUCTED_BY_SALE":
              onStockDeductedRef.current?.(parsed as StockDeductedEvent);
              break;
            case "LOW_STOCK_ALERT":
              onLowStockAlertRef.current?.(parsed as LowStockAlertEvent);
              break;
            case "STOCK_AUDIT_ADJUSTED":
              onAuditAdjustedRef.current?.(parsed as StockAuditAdjustedEvent);
              break;
          }

          onAnyUpdateRef.current?.();
        } catch {
          // Non-JSON ping/pong or message
        }
      };

      ws.onerror = () => {
        // Handled silently to avoid console flooding when dev server or backend WS is unavailable
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;

        // Reconnect with exponential backoff (capped at 15s)
        if (enabled) {
          const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 15000);
          retryCountRef.current += 1;
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch {
      // Fallback
    }
  }, [outletId, enabled]);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
