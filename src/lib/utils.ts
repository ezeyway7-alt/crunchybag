import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Nepalese Rupees (NPR) with deterministic two decimal places
 */
export function formatNPR(amount: number): string {
  return `NPR ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format seconds into MM:SS format for kitchen displays and OTP timers
 */
export function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.floor(Math.max(0, totalSeconds) % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Format time of day (e.g. "14:30")
 */
export function formatTimeOfDay(date: Date = new Date()): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export interface OrderReverseTimerInfo {
  isUndelivered: boolean;
  totalTargetSeconds: number;
  remainingSeconds: number;
  formattedCountdown: string; // "MM:SS" e.g. "23:45"
  displayLabel: string; // e.g. "23m 45s" or "Arriving now"
  progressPercent: number; // 0 - 100
}

/**
 * Calculates reverse live countdown timing for active / undelivered orders
 */
export function getOrderReverseTimer(order: {
  status: string;
  fulfillmentType?: string;
  elapsedSeconds: number;
}): OrderReverseTimerInfo {
  const isUndelivered = order.status !== "COMPLETED" && order.status !== "CANCELLED";

  if (!isUndelivered) {
    const isCompleted = order.status === "COMPLETED";
    return {
      isUndelivered: false,
      totalTargetSeconds: 0,
      remainingSeconds: 0,
      formattedCountdown: isCompleted ? "00:00" : "--:--",
      displayLabel: isCompleted ? "Delivered" : "Cancelled",
      progressPercent: isCompleted ? 100 : 0,
    };
  }

  // Delivery orders standard window: 30 mins (1800s); Takeaway/Dine-In: 15 mins (900s)
  let targetTotalSeconds = order.fulfillmentType === "DELIVERY" ? 30 * 60 : 15 * 60;

  if (order.status === "READY") {
    // Rider in final 2 minutes or food ready in rack
    targetTotalSeconds = Math.max(order.elapsedSeconds + 90, targetTotalSeconds);
  }

  const remainingSeconds = Math.max(0, targetTotalSeconds - (order.elapsedSeconds || 0));
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedCountdown = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  let displayLabel = "";
  if (remainingSeconds <= 0 || order.status === "READY") {
    displayLabel = order.fulfillmentType === "DELIVERY" ? "Arriving now" : "Ready for pickup";
  } else if (mins > 0) {
    displayLabel = `${mins}m ${String(secs).padStart(2, "0")}s`;
  } else {
    displayLabel = `${secs}s`;
  }

  // Calculate live progress percentage (clamped between 10% and 95% while in progress)
  const progressPercent =
    order.status === "READY"
      ? 92
      : Math.min(94, Math.max(12, Math.round(((targetTotalSeconds - remainingSeconds) / targetTotalSeconds) * 100)));

  return {
    isUndelivered: true,
    totalTargetSeconds: targetTotalSeconds,
    remainingSeconds,
    formattedCountdown,
    displayLabel,
    progressPercent,
  };
}

