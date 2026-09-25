import React, { useState } from "react";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { Lock, User, Eye, EyeOff, AlertTriangle, Loader2, X, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { extractErrorMessage } from "../../lib/api";
import { ROLE_LABELS, ROLE_ROUTE_MAP } from "../../types/auth";

interface UnifiedLoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  fullPage?: boolean;
  onSuccess?: () => void;
}

export const UnifiedLoginModal: React.FC<UnifiedLoginModalProps> = ({
  isOpen = true,
  onClose,
  fullPage = false,
  onSuccess,
}) => {
  const { login, navigateToRoleDashboard } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen && !fullPage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage("Please enter your identifier and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await login({
        identifier: identifier.trim(),
        password,
      });

      const userRole = response.user.role;
      const roleLabel = ROLE_LABELS[userRole] || userRole;
      const targetRoute = ROLE_ROUTE_MAP[userRole] || "/menu";

      if (onSuccess) {
        onSuccess();
      } else if (onClose) {
        onClose();
      }

      // Automatically navigate to designated dashboard route
      navigateToRoleDashboard(userRole);
    } catch (err: any) {
      const formatted = extractErrorMessage(err);
      setErrorMessage(formatted);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    if (onClose) {
      onClose();
    } else if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const formContent = (
    <div className="w-full max-w-sm sm:max-w-md bg-[#121214] border border-zinc-800 p-6 sm:p-8 shadow-2xl relative">
      {/* Close button if modal */}
      {!fullPage && onClose && (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Brand Logo - clean without unwanted extra text */}
      <div className="flex justify-center mb-8">
        <CrunchyLogo size="lg" />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          id="auth-error-banner"
          className="mb-5 p-3.5 bg-rose-950/40 border border-rose-600/70 text-rose-200 text-xs flex items-start gap-3 rounded-none animate-in fade-in duration-150"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-300 text-xs tracking-tight">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Single identifier input: Email / Phone / Username */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Email / Phone / Username
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="auth-identifier-input"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Email, phone, or username"
              required
              autoFocus
              className="w-full h-11 pl-10 pr-3.5 bg-[#18181b] border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password input with eye toggle */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              id="auth-password-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Password"
              required
              className="w-full h-11 pl-10 pr-10 bg-[#18181b] border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button with Loading State */}
        <div className="pt-2">
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={isLoading}
            className="w-full h-11 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center px-4 py-8 select-none">
        <div className="w-full max-w-sm sm:max-w-md mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </button>
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md">
        {formContent}
      </div>
    </div>
  );
};
