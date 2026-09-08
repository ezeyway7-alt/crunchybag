import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "flat" | "interactive";
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    default:
      "bg-white dark:bg-[#121214] border border-black/10 dark:border-white/10 shadow-sm rounded-none",
    elevated:
      "bg-white dark:bg-[#121214] border border-black/10 dark:border-white/10 shadow-md dark:shadow-black/50 rounded-none",
    flat:
      "bg-zinc-50 dark:bg-[#18181B] border border-zinc-200/80 dark:border-zinc-800 rounded-none",
    interactive:
      "bg-white dark:bg-[#121214] border border-black/10 dark:border-white/10 shadow-sm hover:border-amber-500 dark:hover:border-amber-500 transition-all duration-150 cursor-pointer rounded-none",
  };

  return (
    <div className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </div>
  );
};
