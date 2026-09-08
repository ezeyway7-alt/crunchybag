import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2";

    const variantClasses = {
      primary:
        "bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 border border-amber-400/40",
      secondary:
        "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-700",
      outline:
        "bg-transparent hover:bg-zinc-100 text-zinc-800 border border-zinc-300 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800/60",
      ghost:
        "bg-transparent hover:bg-zinc-100 text-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/70 border border-transparent",
      danger:
        "bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md shadow-rose-600/20 border border-rose-500/50",
      dark:
        "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 shadow-md",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-xs rounded-none gap-1.5",
      md: "h-10 px-4 text-sm rounded-none gap-2",
      lg: "h-12 px-6 text-base rounded-none gap-2.5",
      icon: "h-10 w-10 p-0 rounded-none",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
