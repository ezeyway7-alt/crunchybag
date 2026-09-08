import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "neutral" | "brand" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
  pulseDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  pulseDot = false,
  ...props
}) => {
  const variantStyles = {
    brand: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    neutral: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
    outline: "bg-transparent text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700",
  };

  const dotStyles = {
    brand: "bg-amber-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-zinc-400",
    outline: "bg-zinc-400",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 rounded-none gap-1.5 font-medium",
    md: "text-xs px-2.5 py-1 rounded-none gap-2 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center border whitespace-nowrap select-none tracking-wide",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulseDot && (
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                dotStyles[variant]
              )}
            />
          )}
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", dotStyles[variant])}
          />
        </span>
      )}
      {children}
    </span>
  );
};
