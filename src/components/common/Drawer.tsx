import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  position?: "right" | "bottom";
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  position = "right",
  className,
  bodyClassName,
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

  const isBottom = position === "bottom";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div
            className={cn(
              "fixed inset-y-0 flex pointer-events-none",
              isBottom ? "inset-x-0 bottom-0 top-auto" : "right-0 max-w-full sm:pl-10"
            )}
          >
            <motion.div
              initial={isBottom ? { y: "100%" } : { x: "100%" }}
              animate={isBottom ? { y: 0 } : { x: 0 }}
              exit={isBottom ? { y: "100%" } : { x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className={cn(
                "pointer-events-auto w-screen bg-[#121214] text-zinc-100 shadow-2xl flex flex-col border-zinc-800",
                isBottom
                  ? "max-h-[85vh] border-t"
                  : "w-full sm:max-w-md md:max-w-lg border-l h-full",
                className
              )}
            >
              {/* Header */}
              <div
                className={cn(
                  "px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800 flex items-center justify-between shrink-0",
                  headerClassName
                )}
              >
                <div className="min-w-0 pr-2">
                  {title && (
                    <div className="text-base sm:text-lg font-bold text-white truncate">
                      {title}
                    </div>
                  )}
                  {description && (
                    <div className="text-xs text-zinc-400 mt-0.5 truncate">
                      {description}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 -mr-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-none transition-colors cursor-pointer shrink-0"
                  aria-label="Close drawer"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.2]" />
                </button>
              </div>

              {/* Body */}
              <div className={cn("flex-1 overflow-y-auto p-4 sm:p-6", bodyClassName)}>
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
