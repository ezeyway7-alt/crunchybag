import React, { useState, useEffect, useRef } from "react";
import { Phone, KeyRound, Lock, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { formatTimer } from "../../lib/utils";
import { useApp } from "../../context/AppContext";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addToast } = useApp();
  const [authMethod, setAuthMethod] = useState<"OTP" | "PIN" | "PASSWORD">("OTP");

  // OTP State
  const [phone, setPhone] = useState("+977 9841-882299");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(45);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // PIN State
  const [pinDigits, setPinDigits] = useState(["", "", "", ""]);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password State
  const [password, setPassword] = useState("");

  // Post-auth security setup state
  const [isSecuritySetupOpen, setIsSecuritySetupOpen] = useState(false);
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    let timer: any;
    if (otpSent && otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpTimer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setOtpSent(true);
    setOtpTimer(45);
    addToast({
      title: "6-Digit OTP Dispatched",
      description: `Verification code sent to ${phone}. (Mock: Enter any 6 digits)`,
      type: "info",
    });
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPinArr = [...pinDigits];
    newPinArr[index] = value.slice(-1);
    setPinDigits(newPinArr);

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    addToast({
      title: "Authentication Successful",
      description: "Welcome back, Aayush! Logged in securely.",
      type: "success",
    });
    setIsSecuritySetupOpen(true);
  };

  const handleVerifyPin = () => {
    addToast({
      title: "PIN Verified",
      description: "Session restored with quick security PIN.",
      type: "success",
    });
    onClose();
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      title: "Security Settings Saved",
      description: "Your 4-digit quick checkout PIN has been established.",
      type: "success",
    });
    setIsSecuritySetupOpen(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSecuritySetupOpen ? "Quick Security Setup" : "Customer Sign In"}
      description={
        isSecuritySetupOpen
          ? "Set your 4-digit fast checkout PIN"
          : "Access your past orders, favorite combos, and one-tap reorders"
      }
      maxWidth="md"
    >
      {isSecuritySetupOpen ? (
        <form onSubmit={handleSaveSecurity} className="space-y-4 py-2">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-amber-500 shrink-0" />
            <p className="text-xs text-zinc-700 dark:text-zinc-300">
              Set up a 4-digit PIN for lightning-fast 1-tap checkout next time without waiting for SMS OTPs.
            </p>
          </div>

          <Input
            label="New 4-Digit Quick PIN"
            type="password"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder="••••"
            required
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => {
                setIsSecuritySetupOpen(false);
                onClose();
              }}
            >
              Skip For Now
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1 font-bold"
              rightIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Save Security PIN
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          {/* Method Tabs */}
          <div className="grid grid-cols-3 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setAuthMethod("OTP");
                setOtpSent(false);
              }}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                authMethod === "OTP"
                  ? "bg-white dark:bg-[#1A1A1E] text-zinc-950 dark:text-white shadow-sm font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Phone OTP
            </button>
            <button
              onClick={() => setAuthMethod("PIN")}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                authMethod === "PIN"
                  ? "bg-white dark:bg-[#1A1A1E] text-zinc-950 dark:text-white shadow-sm font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              4-Digit PIN
            </button>
            <button
              onClick={() => setAuthMethod("PASSWORD")}
              className={`py-2 rounded-lg transition-colors cursor-pointer ${
                authMethod === "PASSWORD"
                  ? "bg-white dark:bg-[#1A1A1E] text-zinc-950 dark:text-white shadow-sm font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Password
            </button>
          </div>

          {/* Phone OTP Flow */}
          {authMethod === "OTP" && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <Input
                    label="Mobile Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+977 98XXXXXXXX"
                    leftIcon={<Phone className="h-4 w-4" />}
                    hint="A 6-digit SMS verification code will be sent instantly."
                    required
                  />
                  <Button type="submit" variant="primary" size="lg" className="w-full font-bold">
                    Send Verification Code
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Code sent to {phone}</span>
                    <button
                      onClick={() => setOtpSent(false)}
                      className="text-amber-500 hover:underline cursor-pointer"
                    >
                      Change Phone
                    </button>
                  </div>

                  {/* 6 Auto-focus OTP boxes */}
                  <div className="flex justify-between gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-12 text-center font-mono font-bold text-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500 outline-none text-zinc-900 dark:text-white"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      Resend in:{" "}
                      <span className="font-mono text-zinc-900 dark:text-zinc-200">
                        {formatTimer(otpTimer)}
                      </span>
                    </span>
                    <button
                      disabled={otpTimer > 0}
                      onClick={handleSendOtp}
                      className="font-semibold text-amber-500 hover:underline disabled:opacity-40 cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full font-bold"
                    disabled={otpDigits.some((d) => !d)}
                    onClick={handleVerifyOtp}
                  >
                    Verify & Continue
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 4-digit PIN Flow */}
          {authMethod === "PIN" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 text-center">
                Enter your 4-digit Crunchy Security PIN
              </p>
              <div className="flex justify-center gap-3">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { pinRefs.current[idx] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                    className="w-12 h-14 text-center font-mono font-extrabold text-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500 outline-none text-zinc-900 dark:text-white"
                  />
                ))}
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold mt-2"
                disabled={pinDigits.some((d) => !d)}
                onClick={handleVerifyPin}
              >
                Unlock Account
              </Button>
            </div>
          )}

          {/* Password Flow */}
          {authMethod === "PASSWORD" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyPin();
              }}
              className="space-y-3"
            >
              <Input
                label="Registered Mobile or Email"
                defaultValue="aayush@gmail.com"
                required
              />
              <Input
                label="Account Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
              <Button type="submit" variant="primary" size="lg" className="w-full font-bold">
                Log In
              </Button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
};
