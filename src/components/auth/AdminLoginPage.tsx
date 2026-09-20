import React, { useState } from "react";
import { CrunchyLogo } from "../common/CrunchyLogo";
import { Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";

interface AdminLoginPageProps {
  onBack?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBack }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      return;
    }

    setIsLoading(true);
    setServerError(null);

    // Simulate authentication call to backend service
    setTimeout(() => {
      setIsLoading(false);
      // Log HTTP 500 error to browser console for realistic developer inspection
      console.error(
        "POST /api/v1/admin/login 500 (Internal Server Error)\n" +
        "Response: { status: 500, error: 'Internal Server Error', message: 'Failed to establish connection with authentication provider.' }"
      );
      setServerError("500 Internal Server Error");
    }, 500);
  };

  const handleReturn = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center px-4 py-8 select-none">
      {/* Back button */}
      <div className="w-full max-w-sm sm:max-w-md mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleReturn}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm sm:max-w-md bg-[#121214] border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        {/* Brand Logo - clean with no unwanted text */}
        <div className="flex justify-center mb-8">
          <CrunchyLogo size="lg" />
        </div>

        {/* 500 Internal Server Error Banner */}
        {serverError && (
          <div
            id="server-500-error"
            className="mb-5 p-3.5 bg-rose-950/40 border border-rose-600/70 text-rose-200 text-xs flex items-start gap-3 rounded-none animate-in fade-in duration-150"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-300 text-xs tracking-tight">
                {serverError}
              </p>
              <p className="text-rose-400/90 text-[11px] font-mono leading-relaxed">
                Internal Server Error: Authentication service failed to respond.
              </p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (serverError) setServerError(null);
                }}
                placeholder="Username or email"
                className="w-full h-11 pl-10 pr-3.5 bg-[#18181b] border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (serverError) setServerError(null);
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

          <div className="pt-2">
            <button
              type="submit"
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
    </div>
  );
};
