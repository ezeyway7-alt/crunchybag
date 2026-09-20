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
      "bg-[#121214] border border-white/10 shadow-sm rounded-none text-zinc-100",
    elevated:
      "bg-[#121214] border border-white/10 shadow-md shadow-black/50 rounded-none text-zinc-100",
    flat:
      "bg-[#18181B] border border-zinc-800 rounded-none text-zinc-100",
    interactive:
      "bg-[#121214] border border-white/10 shadow-sm hover:border-amber-500 transition-all duration-150 cursor-pointer rounded-none text-zinc-100",
  };

  return (
    <div className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </div>
  );
};
