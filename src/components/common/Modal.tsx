import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl" | "6xl";
  className?: string;
  showCloseButton?: boolean;
  position?: "center" | "top";
  contentClassName?: string;
  headerClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  className,
  showCloseButton = true,
  position = "center",
  contentClassName,
  headerClassName,
}) => {
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex justify-center p-3 sm:p-6 overflow-y-auto",
            position === "top" ? "items-start pt-8 sm:pt-20" : "items-center"
          )}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: position === "top" ? -10 : 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: position === "top" ? -10 : 15 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={cn(
              "relative w-full bg-white dark:bg-[#121214] border border-black/15 dark:border-white/15 rounded-none shadow-2xl overflow-hidden z-10 text-zinc-900 dark:text-zinc-100",
              position !== "top" && "my-auto",
              maxWidthClasses[maxWidth],
              className
            )}
          >
            {(title || showCloseButton) && (
              <div
                className={cn(
                  "flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-2",
                  headerClassName
                )}
              >
                <div className="min-w-0 pr-2">
                  {title && (
                    <div className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-white truncate">
                      {title}
                    </div>
                  )}
                  {description && (
                    <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {description}
                    </div>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-1 sm:p-1.5 -mr-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-none transition-colors cursor-pointer shrink-0 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            <div className={cn("px-4 py-3 sm:px-6 sm:py-4", contentClassName)}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
