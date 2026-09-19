import React from "react";
import { cn } from "../../lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  rounded = "xl",
  ...props
}) => {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  };

  return (
    <div
      className={cn(
        "skeleton-shimmer bg-zinc-800/80 border border-zinc-800/50",
        roundedClasses[rounded],
        className
      )}
      {...props}
    />
  );
};

/* =========================================================================
   SPECIALIZED SKELETON PLACEHOLDERS FOR EVERY PAGE & DESIGN
   ========================================================================= */

/**
 * Product Card Skeleton (Menu, Catalog, Kiosk, Table QR)
 */
export const SkeletonProductCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "bg-[#121214] border border-zinc-800/80 p-3 sm:p-4 flex flex-col gap-3 rounded-none overflow-hidden",
        className
      )}
    >
      {/* Image box */}
      <Skeleton className="w-full aspect-4/3 rounded-none bg-zinc-800/70" />

      {/* Category tag & spice rating */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Skeleton className="h-4 w-20 rounded-sm" />
        <Skeleton className="h-4 w-12 rounded-sm" />
      </div>

      {/* Product Title */}
      <Skeleton className="h-5 w-3/4 rounded-sm" />

      {/* Product Description */}
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3.5 w-full rounded-sm" />
        <Skeleton className="h-3.5 w-4/5 rounded-sm" />
      </div>

      {/* Price & Add Action */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 mt-auto">
        <Skeleton className="h-6 w-20 rounded-sm" />
        <Skeleton className="h-8 w-24 rounded-none" />
      </div>
    </div>
  );
};

/**
 * Grid of Product Card Skeletons
 */
export const SkeletonProductGrid: React.FC<{ count?: number; className?: string }> = ({
  count = 8,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5",
        className
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonProductCard key={idx} />
      ))}
    </div>
  );
};

/**
 * Horizontal Category Filter Pills Skeleton
 */
export const SkeletonCategoryPills: React.FC<{ count?: number; className?: string }> = ({
  count = 6,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto py-2 no-scrollbar", className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton
          key={idx}
          className="h-8.5 w-28 shrink-0 rounded-none bg-zinc-800/70 border border-zinc-800"
        />
      ))}
    </div>
  );
};

/**
 * Hero Promotional Banner Skeleton (Customer & Kiosk)
 */
export const SkeletonHeroBanner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "w-full h-48 sm:h-64 lg:h-80 bg-[#121214] border border-zinc-800/80 p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden",
        className
      )}
    >
      <div className="space-y-3 max-w-lg">
        <Skeleton className="h-5 w-28 rounded-sm bg-amber-500/20 border-amber-500/30" />
        <Skeleton className="h-8 sm:h-10 w-full sm:w-4/5 rounded-sm" />
        <Skeleton className="h-4 w-3/4 rounded-sm" />
        <Skeleton className="h-4 w-1/2 rounded-sm" />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Skeleton className="h-10 w-32 rounded-none bg-amber-500/20" />
        <Skeleton className="h-10 w-28 rounded-none" />
      </div>
    </div>
  );
};

/**
 * Metric Card Skeleton (Admin Overview, Staff Inventory, Staff Billing, Daybook)
 */
export const SkeletonMetricCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "bg-[#121214] border border-zinc-800/80 p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3.5 w-24 rounded-sm" />
        <Skeleton className="w-8 h-8 rounded-sm bg-zinc-800/90" />
      </div>
      <div>
        <Skeleton className="h-7 sm:h-8 w-32 rounded-sm" />
        <Skeleton className="h-3.5 w-40 rounded-sm mt-2" />
      </div>
    </div>
  );
};

/**
 * Row of Metric Cards (3, 4, or 5 cards)
 */
export const SkeletonMetricsRow: React.FC<{ count?: number; className?: string }> = ({
  count = 4,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4",
        count === 3 && "lg:grid-cols-3",
        count === 5 && "lg:grid-cols-5",
        className
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonMetricCard key={idx} />
      ))}
    </div>
  );
};

/**
 * Table Row Skeleton
 */
export const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-zinc-800/60">
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="p-3">
          <Skeleton
            className={cn(
              "h-4 rounded-sm",
              idx === 0 && "w-20",
              idx === 1 && "w-36",
              idx === 2 && "w-24",
              idx === 3 && "w-16",
              idx === 4 && "w-24",
              idx >= 5 && "w-20"
            )}
          />
        </td>
      ))}
    </tr>
  );
};

/**
 * Full Table Skeleton (Orders, Inventory, Daybook, Employees, Purchases, Loyalty)
 */
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  headers?: string[];
  className?: string;
}> = ({ rows = 6, columns = 5, headers, className }) => {
  return (
    <div
      className={cn(
        "bg-[#121214] border border-zinc-800/80 overflow-hidden shadow-sm flex flex-col",
        className
      )}
    >
      {/* Search & Actions Header */}
      <div className="p-3 sm:p-4 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-60 sm:w-72 rounded-none" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-none" />
          <Skeleton className="h-8 w-28 rounded-none" />
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-400">
          <thead className="bg-[#18181B] text-zinc-400 border-b border-zinc-800 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              {headers ? (
                headers.map((h, i) => (
                  <th key={i} className="p-3">
                    {h}
                  </th>
                ))
              ) : (
                Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="p-3">
                    <Skeleton className="h-3.5 w-16 rounded-sm bg-zinc-700/60" />
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, idx) => (
              <SkeletonTableRow key={idx} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <Skeleton className="h-3.5 w-36 rounded-sm" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16 rounded-none" />
          <Skeleton className="h-7 w-16 rounded-none" />
        </div>
      </div>
    </div>
  );
};

/**
 * Ticket / Order Card Skeleton (KDS, Kitchen, Staff Order Queue)
 */
export const SkeletonTicketCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "bg-[#121214] border border-zinc-800/80 p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-md",
        className
      )}
    >
      {/* Header with Order # and Elapsed Timer */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-none bg-amber-500/20" />
          <Skeleton className="h-4 w-24 rounded-sm" />
        </div>
        <Skeleton className="h-5 w-14 rounded-sm" />
      </div>

      {/* Customer / Fulfillment Info */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded-sm" />
        <Skeleton className="h-4 w-20 rounded-sm" />
      </div>

      {/* Items list */}
      <div className="space-y-2 py-2 border-y border-zinc-800/60 my-1">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-44 rounded-sm" />
          <Skeleton className="h-4 w-8 rounded-sm" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-36 rounded-sm" />
          <Skeleton className="h-4 w-8 rounded-sm" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-48 rounded-sm" />
          <Skeleton className="h-4 w-8 rounded-sm" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded-none bg-amber-500/20" />
        <Skeleton className="h-8 w-20 rounded-none" />
      </div>
    </div>
  );
};

/**
 * Grid of Ticket Cards (KDS / Kitchen / Staff Order Queue)
 */
export const SkeletonTicketGrid: React.FC<{ count?: number; className?: string }> = ({
  count = 6,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonTicketCard key={idx} />
      ))}
    </div>
  );
};

/**
 * Chart Skeleton (Admin Analytics, Revenue trends)
 */
export const SkeletonChartCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "bg-[#121214] border border-zinc-800/80 p-5 flex flex-col gap-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-40 rounded-sm" />
          <Skeleton className="h-3.5 w-64 rounded-sm mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-none" />
          <Skeleton className="h-7 w-20 rounded-none" />
        </div>
      </div>

      {/* Simulated Chart Bars */}
      <div className="h-56 sm:h-64 flex items-end justify-between gap-2 pt-8 pb-2 border-b border-zinc-800/80">
        {[40, 65, 80, 55, 90, 75, 100, 60, 85, 95, 70, 85].map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <Skeleton
              className="w-full rounded-none"
              style={{ height: `${height}%` }}
            />
            <Skeleton className="h-2.5 w-5 rounded-xs" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * POS / Split Billing Workbench Skeleton
 */
export const SkeletonWorkbench: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Top Stats Strip Skeleton */}
      <div className="p-3 bg-[#121214] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-5 w-48 rounded-sm" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-28 rounded-sm" />
          <Skeleton className="h-4 w-28 rounded-sm" />
          <Skeleton className="h-4 w-28 rounded-sm" />
        </div>
      </div>

      {/* 2-Column Split Billing Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Bill Summary */}
        <div className="bg-[#121214] border border-zinc-800/80 p-4 space-y-3">
          <Skeleton className="h-5 w-36 rounded-sm" />
          <div className="space-y-2 py-2 border-y border-zinc-800/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-44 rounded-sm" />
                <Skeleton className="h-4 w-16 rounded-sm" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-6 w-24 rounded-sm" />
            <Skeleton className="h-6 w-28 rounded-sm bg-amber-500/20" />
          </div>
        </div>

        {/* Right Column: Tender Allocation */}
        <div className="bg-[#121214] border border-zinc-800/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40 rounded-sm" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-6 w-16 rounded-none" />
              <Skeleton className="h-6 w-20 rounded-none" />
            </div>
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-none" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-none bg-emerald-500/20 mt-4" />
        </div>
      </div>

      {/* Orders Table Skeleton */}
      <SkeletonTable rows={5} columns={6} />
    </div>
  );
};

/**
 * Floor Plan / Tables Layout Skeleton (Staff & Dine-In)
 */
export const SkeletonFloorPlan: React.FC<{ count?: number; className?: string }> = ({
  count = 12,
  className,
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#121214] border border-zinc-800/80 p-3 flex flex-col items-center justify-center gap-2 aspect-square"
        >
          <Skeleton className="w-8 h-8 rounded-full bg-zinc-800/90" />
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="h-3.5 w-12 rounded-xs" />
        </div>
      ))}
    </div>
  );
};

/**
 * Order Tracking / Rider Animation Skeleton (Live Order Tracker)
 */
export const SkeletonOrderTracker: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="bg-[#121214] border border-zinc-800/80 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <Skeleton className="h-6 w-40 rounded-sm" />
          <Skeleton className="h-6 w-28 rounded-none bg-amber-500/20" />
        </div>
        {/* Tracker Steps */}
        <div className="grid grid-cols-4 gap-2 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full bg-zinc-800/90" />
              <Skeleton className="h-3 w-16 rounded-xs" />
            </div>
          ))}
        </div>
        {/* Map / Graphic Placeholder */}
        <Skeleton className="w-full h-48 sm:h-64 rounded-none" />
      </div>
    </div>
  );
};

/**
 * TV Display Airport FIDS Board Skeleton
 */
export const SkeletonTvDisplay: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("p-6 space-y-6 min-h-screen bg-[#060709]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <Skeleton className="h-8 w-56 rounded-none bg-amber-500/20" />
        <Skeleton className="h-8 w-32 rounded-sm" />
      </div>
      {/* 2 Big Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Now Cooking */}
        <div className="bg-[#0e0e12] border border-zinc-800 p-5 space-y-4">
          <Skeleton className="h-7 w-48 rounded-sm bg-amber-500/20" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-none" />
            ))}
          </div>
        </div>
        {/* Ready for Pickup */}
        <div className="bg-[#0e0e12] border border-zinc-800 p-5 space-y-4">
          <Skeleton className="h-7 w-48 rounded-sm bg-emerald-500/20" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-none bg-emerald-500/10 border-emerald-500/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
