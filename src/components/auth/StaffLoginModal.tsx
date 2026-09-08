import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { useApp } from "../../context/AppContext";
import { UserRole } from "../../types";
import { ChefHat, CreditCard, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle } from "lucide-react";

export const StaffLoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    setIsLoginModalOpen,
    loginAsRole,
    loginWithCredentials,
  } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickLogin = (role: UserRole) => {
    setErrorMsg("");
    loginAsRole(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    setTimeout(() => {
      const success = loginWithCredentials(email, password);
      setIsSubmitting(false);
      if (!success) {
        setErrorMsg("Invalid staff credentials. Tip: Use one of the 1-click test roles above or check your password.");
      }
    }, 200);
  };

  return (
    <Modal
      isOpen={isLoginModalOpen}
      onClose={() => setIsLoginModalOpen(false)}
      title="Staff & Management Login"
      description="Access role-restricted operational dashboards. Customers do not need to log in."
      maxWidth="lg"
    >
      <div className="space-y-6 pt-2">
        {/* Quick 1-Click Role Login for instant access */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
            1-Click Demo Login (Select Role)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Kitchen Cook */}
            <button
              type="button"
              onClick={() => handleQuickLogin("KITCHEN")}
              className="p-3.5 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 bg-zinc-50/70 dark:bg-zinc-900/50 hover:bg-amber-500/5 dark:hover:bg-amber-500/5 text-left transition-all duration-150 rounded-none group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <ChefHat className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Cook
                </span>
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                Kitchen KDS
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                Orders prep queue & live station tickets
              </p>
              <div className="mt-3 flex items-center text-[11px] font-semibold text-amber-600 dark:text-amber-400 gap-1">
                <span>Enter Station</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Front Staff / Cashier */}
            <button
              type="button"
              onClick={() => handleQuickLogin("STAFF")}
              className="p-3.5 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 bg-zinc-50/70 dark:bg-zinc-900/50 hover:bg-amber-500/5 dark:hover:bg-amber-500/5 text-left transition-all duration-150 rounded-none group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Cashier
                </span>
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400">
                Staff Counter
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                Order dispatch & item stock (86ing)
              </p>
              <div className="mt-3 flex items-center text-[11px] font-semibold text-sky-600 dark:text-sky-400 gap-1">
                <span>Enter Counter</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Store Manager / Admin */}
            <button
              type="button"
              onClick={() => handleQuickLogin("ADMIN")}
              className="p-3.5 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500 dark:hover:border-amber-500 bg-zinc-50/70 dark:bg-zinc-900/50 hover:bg-amber-500/5 dark:hover:bg-amber-500/5 text-left transition-all duration-150 rounded-none group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Manager
                </span>
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Store Manager
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                Sales KPIs, menu prices & staff logs
              </p>
              <div className="mt-3 flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 gap-1">
                <span>Enter Admin</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Separator */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
          <span className="bg-white dark:bg-[#121214] px-3 text-[11px] font-bold tracking-wider text-zinc-400 uppercase absolute">
            Or Manual Credentials
          </span>
        </div>

        {/* Manual Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <Input
              label="Staff Email"
              type="email"
              placeholder="e.g. chef@crunchy.com, staff@crunchy.com, admin@crunchy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              hint="Demo Passwords: chef123, staff123, admin123"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLoginModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Sign In to Dashboard
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
