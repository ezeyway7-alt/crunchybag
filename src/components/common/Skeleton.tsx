import React from "react";
import { cn } from "../../lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  rounded = "xl",
  ...props
}) => {
  const roundedClasses = {
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
        "skeleton-shimmer bg-zinc-200/80 dark:bg-zinc-800/80",
        roundedClasses[rounded],
        className
      )}
      {...props}
    />
  );
};
