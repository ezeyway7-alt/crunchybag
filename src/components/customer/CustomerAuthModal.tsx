import {Input} from '../common/Input';
import { apiClient, extractErrorMessage } from "../../lib/api";
import { customerPath, saveCustomerSession } from "../../lib/customerApi";
import { trackEvent } from "../../lib/journeyTracking";
import React, { useState, useEffect, useRef } from "react";
import { Phone, Lock, Eye, EyeOff, CheckCircle2, User, KeyRound, ArrowLeft, ShieldCheck, ArrowRight } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { formatTimer } from "../../lib/utils";
import { useApp } from "../../context/AppContext";

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onContinueAsGuest?: () => void;
}

type AuthView = "LOGIN" | "SIGNUP_PHONE" | "SIGNUP_OTP" | "SIGNUP_PROFILE" | "OTP_LOGIN_PHONE" | "OTP_LOGIN_OTP" | "RESET_PASSWORD";

const localPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return (digits.length > 10 && digits.startsWith("977") ? digits.slice(3) : digits).slice(0, 10);
};

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onContinueAsGuest,
}) => {
  const { addToast, currentOutlet } = useApp();

  const [authView, setAuthView] = useState<AuthView>("LOGIN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Input states
  const [phone, setPhone] = useState("");
  const [credential, setCredential] = useState("");
  const [showCredential, setShowCredential] = useState(false);

  // OTP state
  const [challenge, setChallenge] = useState("");
  const [resetToken,setResetToken] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(45);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Registration profile setup state
  const [registrationToken, setRegistrationToken] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const locked = useRef(false);

  const perform = async (work: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setInfoMessage("");
    try {
      await work();
    } catch (e: any) {
      if (e?.data?.next_action === 'signup') {
        setAuthView('SIGNUP_PHONE');
        setInfoMessage(e.data.detail);
        return;
      }
      setError(extractErrorMessage(e));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  const finish = (result: any) => {
    saveCustomerSession(result);
    setCredential("");
    setNewPin("");
    setNewPassword("");
    setOtpDigits(["", "", "", ""]);

    // If currently on /profile, immediately return to /menu unless returning to checkout
    if (typeof window !== "undefined") {
      const returnToCheckout = sessionStorage.getItem("customer:return-to-checkout") === "yes";
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, "");
      if (!returnToCheckout && (path === "/profile" || path === "/orders")) {
        window.history.pushState(null, "", "/menu");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }

    if (onSuccess) onSuccess();
    else onClose();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAuthView("LOGIN");
      setError("");
      setInfoMessage("");
      setCredential("");
      setShowCredential(false);
      setNewPin("");
      setNewPassword("");
    }
  }, [isOpen]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if ((authView === "SIGNUP_OTP" || authView === "OTP_LOGIN_OTP") && otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [authView, otpTimer]);

  // Unified eSewa-style Login: Mobile Number + MPIN/Password in same field
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    const cleanCred = credential;

    if (!/^(?:977)?9[78]\d{8}$/.test(cleanPhone)) {
      setError("Please enter your 10-digit mobile number.");
      return;
    }
    if (!cleanCred) {
      setError("Please enter your 4-digit MPIN or password.");
      return;
    }

    trackEvent("login_started", {method: /^\d{4}$/.test(cleanCred) ? "pin" : "password"});
    void perform(async () => {
      // Determine if numeric 4-digit PIN or text password
      const is4Digit = /^\d{4}$/.test(cleanCred);
      const primaryMethod = is4Digit ? "PIN" : "PASSWORD";

      try {
        const result = await apiClient.post<any>(
          customerPath("auth/login/"),
          { phone: cleanPhone, outlet_id:currentOutlet?.id, method: primaryMethod, credential: cleanCred },
          { skipAuth: true }
        );
        trackEvent("login_success");
        finish(result);
      } catch (error) {
        trackEvent("login_failed");
        throw error;
      }
    });
  };

  // Signup Step 1: Request OTP for new number
  const handleSendSignupOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!/^(?:977)?9[78]\d{8}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    void perform(async () => {
      const result = await apiClient.post<any>(
        customerPath("auth/start/"),
        { phone: cleanPhone, outlet_id: /^\d+$/.test(String(currentOutlet?.id)) ? currentOutlet.id : undefined },
        { skipAuth: true }
      );

      if (result.exists) {
        setAuthView("LOGIN");
        setInfoMessage("This mobile number is already registered. Sign in with your MPIN or password, or recover it with SMS.");
        return;
      }

      setChallenge(result.challenge_id);
      setOtpDigits(["", "", "", ""]);
      setAuthView("SIGNUP_OTP");
      setOtpTimer(result.resend_after || 60);
      setTimeout(() => inputRefs.current[0]?.focus(), 120);
    });
  };

  // Signup Step 2: Verify received OTP
  const handleVerifySignupOtp = () => {
    const code = otpDigits.join("");
    if (code.length < 4) {
      setError("Please enter all 4 digits of the OTP code.");
      return;
    }

    void perform(async () => {
      const result = await apiClient.post<any>(
        customerPath("auth/verify/"),
        { challenge_id: challenge, code },
        { skipAuth: true }
      );
      setRegistrationToken(result.registration_token);
      setAuthView("SIGNUP_PROFILE");
    });
  };

  // Signup Step 3: Complete profile and set MPIN + Password
  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError("Please enter a 4-digit numeric quick MPIN.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    void perform(async () => {
      // Clean and generate valid Django username (only letters, numbers, underscores, no spaces)
      const cleanSlug = username
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^\w.@+-]/g, "")
        .replace(/^_+|_+$/g, "");

      const phoneSuffix = phone.trim().replace(/\D/g, "").slice(-4) || String(Math.floor(1000 + Math.random() * 9000));
      const baseUsername = cleanSlug.length >= 3 ? cleanSlug : `customer_${phoneSuffix}`;

      let registerResult: any;
      try {
        registerResult = await apiClient.post<any>(
          customerPath("auth/register/"),
          {
            outlet_id:currentOutlet?.id, registration_token: registrationToken,
            username: baseUsername,
            name: username.trim(),
            email: email.trim(),
            pin: newPin,
            password: newPassword,
          },
          { skipAuth: true }
        );
      } catch (err: any) {
        const errMsg = extractErrorMessage(err).toLowerCase();
        // 1. If registration token expired on the backend, auto-request fresh OTP and keep user's profile inputs intact
        if (errMsg.includes("expired")) {
          try {
            const resend = await apiClient.post<any>(
              customerPath("auth/start/"),
              { phone: phone.trim().replace(/\D/g, ""), outlet_id: /^\d+$/.test(String(currentOutlet?.id)) ? currentOutlet.id : undefined },
              { skipAuth: true }
            );
            if (resend.exists) {
              setAuthView("LOGIN");
              setInfoMessage("This mobile number already has an account. Sign in or recover it with SMS.");
              return;
            }
            setInfoMessage("Verification session timed out. A fresh OTP has been requested.");
            setChallenge(resend.challenge_id);

            setOtpDigits(["", "", "", ""]);
            setOtpTimer(60);
            setAuthView("SIGNUP_OTP");
            return;
          } catch (resendError) {
            setError(extractErrorMessage(resendError));
            setAuthView("SIGNUP_PHONE");
            return;
          }
        }

        // Only a confirmed phone conflict should move signup back to login.
        if (err?.data?.code === 'phone_registered') {
          setAuthView("LOGIN");
          setInfoMessage("This mobile number already has an account. Sign in or recover your password with SMS.");
          return;
        }

        // 3. If username pattern error or taken, auto-retry with unique phone suffix
        if (errMsg.includes("pattern") || (errMsg.includes("username") && errMsg.includes("taken"))) {
          const uniqueUsername = `${baseUsername.slice(0, 20)}_${phoneSuffix}`;
          registerResult = await apiClient.post<any>(
            customerPath("auth/register/"),
            {
              outlet_id:currentOutlet?.id, registration_token: registrationToken,
              username: uniqueUsername,
              name: username.trim(),
              email: email.trim(),
              pin: newPin,
              password: newPassword,
            },
            { skipAuth: true }
          );
        } else {
          throw err;
        }
      }

      // 1. Save customer session
      saveCustomerSession(registerResult);

      // 2. Sync full name to customer profile
      try {
        await apiClient.patch(customerPath("profile/"), {
          name: username.trim(),
          email: email.trim(),
        });
      } catch {
        // Non-blocking profile name sync
      }

      finish(registerResult);
    });
  };

  const handleSendOtpLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanPhone=phone.trim().replace(/\D/g,'');
    if(!/^(?:977)?9[78]\d{8}$/.test(cleanPhone)){setError('Enter a valid Nepal mobile number.');return;}
    void perform(async()=>{
      const result=await apiClient.post<any>(customerPath('auth/recovery-start/'),{phone:cleanPhone,outlet_id:/^\d+$/.test(String(currentOutlet?.id))?currentOutlet.id:undefined},{skipAuth:true});
      setChallenge(result.challenge_id);setOtpDigits(['','','','']);
      setAuthView(result.next_action === 'signup' ? 'SIGNUP_OTP' : 'OTP_LOGIN_OTP');
      setOtpTimer(result.resend_after || 60);
      setInfoMessage(result.next_action === 'signup'
        ? 'Verify your mobile number, then set up your web account and MPIN.'
        : 'SMS code requested. It may take a moment to arrive.');
    });
  };
  const handleVerifyOtpLogin = () => {
    const code = otpDigits.join("");
    if (code.length < 4 || otpDigits.some((d) => !d)) {
      setError("Please enter all 4 digits of the SMS recovery code.");
      return;
    }
    void perform(async () => {
      const result = await apiClient.post<any>(
        customerPath("auth/recovery-verify/"),
        { challenge_id: challenge, code },
        { skipAuth: true }
      );
      setResetToken(result.reset_token);
      setNewPassword("");
      setNewPin("");
      setError("");
      setInfoMessage("Recovery code verified! Set your new password and 4-digit PIN below.");
      setAuthView("RESET_PASSWORD");
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError("Please enter a 4-digit numeric MPIN (e.g. 1234).");
      return;
    }
    void perform(async () => {
      const result = await apiClient.post<any>(
        customerPath("auth/reset/"),
        { reset_token: resetToken, password: newPassword, pin: newPin, outlet_id:currentOutlet?.id },
        { skipAuth: true }
      );
      setResetToken("");
      addToast({
        title: "Password & PIN Updated",
        message: "Your new credentials have been saved. Welcome back!",
        type: "success",
      });
      finish(result);
    });
  };
  const checkSmsStatus=()=>void perform(async()=>{
    const result=await apiClient.post<any>(customerPath('auth/sms-status/'),{challenge_id:challenge},{skipAuth:true});
    if(result.status==='FAILED'||result.status==='EXPIRED')throw new Error('SMS could not be sent or the code expired. Request a new code, or contact the outlet.');
    setInfoMessage(result.status==='SENT'?'Sparrow accepted your SMS. Check your mobile inbox.':'Your SMS is queued. Please wait a moment.');
  });

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const nextDigits = [...otpDigits];
    nextDigits[index] = value.slice(-1);
    setOtpDigits(nextDigits);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Get clean dynamic modal title with no subtitle clutter
  const getModalTitle = () => {
    switch (authView) {
      case "LOGIN":
        return "Customer Sign In";
      case "SIGNUP_PHONE":
        return "Create Your Account";
      case "SIGNUP_OTP":
        return "Verify Mobile Number";
      case "SIGNUP_PROFILE":
        return "Complete Your Profile";
      case "OTP_LOGIN_PHONE":
      case "OTP_LOGIN_OTP":
        return "Recover your account";
      case "RESET_PASSWORD": return "Set new password and PIN";
      default:
        return "Customer Sign In";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      maxWidth="md"
      className="rounded-none"
    >
      <fieldset disabled={busy} className="contents">
        {error && (
          <div role="alert" className="p-3 mb-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-none font-medium">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 mb-3 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-none font-medium">
            {infoMessage}
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 1: UNIFIED LOGIN (eSewa Style: Phone + MPIN/Password)
        ------------------------------------------------------------- */}
        {authView === "LOGIN" && (
          <form onSubmit={handleLogin} className="space-y-4 py-1">
            {onContinueAsGuest && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={busy}
                onClick={onContinueAsGuest}
                className="w-full font-bold h-10 rounded-none border border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              >
                Continue as a guest
              </Button>
            )}
            {/* Mobile Phone Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Mobile Number
              </label>
              <div className="flex rounded-none overflow-hidden border border-zinc-200 dark:border-zinc-800 focus-within:border-amber-500 bg-zinc-50/70 dark:bg-[#161619] transition-colors">
                <div className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-base sm:text-sm font-bold flex items-center border-r border-zinc-200 dark:border-zinc-800 shrink-0 rounded-none">
                  +977
                </div>
                <input
                  type="tel"
                  aria-label="Mobile Phone Number"
                  inputMode="numeric"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(localPhone(e.target.value))}
                  autoComplete="tel"
                  className="flex-1 px-3 py-2.5 bg-transparent text-base sm:text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 font-medium rounded-none"
                  required
                />
              </div>
            </div>

            {/* MPIN / Password Field (In the same input, eSewa style) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  4-Digit MPIN or Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    if (phone.trim().replace(/\D/g, "").length >= 10) {
                      handleSendOtpLogin();
                    } else {
                      setAuthView("OTP_LOGIN_PHONE");
                    }
                  }}
                  className="text-[11px] text-amber-500 hover:text-amber-400 font-medium cursor-pointer"
                >
                  Forgot PIN?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type={showCredential ? "text" : "password"}
                  aria-label="Account Password or PIN"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="Enter your 4-digit PIN or password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 h-11 text-base sm:text-sm bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 rounded-none focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCredential(!showCredential)}
                  className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCredential ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons Stack: Sign In, Sign Up, and Forgot Password/MPIN */}
            <div className="space-y-2 pt-1">
              {/* 1. Sign In Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-bold h-10 rounded-none shadow-none cursor-pointer"
              >
                Sign In
              </Button>

              {/* 2. Sign Up Button */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setError("");
                  setInfoMessage("");
                  setAuthView("SIGNUP_PHONE");
                }}
                className="w-full font-bold h-10 rounded-none border border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
              >
                Sign Up
              </Button>

              {/* 3. Forgot Password / MPIN Button (compact, smaller space) */}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  if (phone.trim().replace(/\D/g, "").length >= 10) {
                    handleSendOtpLogin();
                  } else {
                    setAuthView("OTP_LOGIN_PHONE");
                  }
                }}
                className="w-full h-9 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer rounded-none active:scale-[0.99]"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Forgot Password or MPIN? Recover with SMS</span>
              </button>
            </div>
          </form>
        )}

        {/* -------------------------------------------------------------
            VIEW 2: SIGNUP - STEP 1 (Enter Mobile Number)
        ------------------------------------------------------------- */}
        {authView === "SIGNUP_PHONE" && (
          <form onSubmit={handleSendSignupOtp} className="space-y-4 py-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Mobile Number
              </label>
              <div className="flex rounded-none overflow-hidden border border-zinc-200 dark:border-zinc-800 focus-within:border-amber-500 bg-zinc-50/70 dark:bg-[#161619] transition-colors">
                <div className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-base sm:text-sm font-bold flex items-center border-r border-zinc-200 dark:border-zinc-800 shrink-0 rounded-none">
                  +977
                </div>
                <input
                  type="tel"
                  aria-label="Mobile Phone Number"
                  inputMode="numeric"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(localPhone(e.target.value))}
                  autoComplete="tel"
                  className="flex-1 px-3 py-2.5 bg-transparent text-base sm:text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 font-medium rounded-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold h-11 rounded-none shadow-none cursor-pointer"
            >
              Get OTP Verification Code
            </Button>

            <div className="pt-2 text-center border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setAuthView("LOGIN");
                  }}
                  className="text-amber-500 hover:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        )}

        {/* -------------------------------------------------------------
            VIEW 3: SIGNUP - STEP 2 (Verify 4-Digit OTP)
        ------------------------------------------------------------- */}
        {authView === "SIGNUP_OTP" && (
          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>SMS code for {phone}</span>
              <button
                type="button"
                onClick={() => setAuthView("SIGNUP_PHONE")}
                className="text-amber-500 hover:underline cursor-pointer font-medium"
              >
                Change Number
              </button>
            </div>

            <div className="flex justify-center gap-2.5 my-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  aria-label={`Code digit ${idx + 1}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  className="w-12 h-14 text-center font-mono font-bold text-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-900 dark:text-white"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Resend in:{" "}
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-bold">
                  {formatTimer(otpTimer)}
                </span>
              </span>
              <button
                type="button"
                disabled={otpTimer > 0}
                onClick={handleSendSignupOtp}
                className="font-semibold text-amber-500 hover:underline disabled:opacity-40 cursor-pointer"
              >
                Resend OTP
              </button>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full font-bold h-11 rounded-none shadow-none cursor-pointer"
              disabled={otpDigits.some((d) => !d)}
              onClick={handleVerifySignupOtp}
            >
              Verify & Continue
            </Button>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 4: SIGNUP - STEP 3 (Complete Profile & Set PIN + Password)
        ------------------------------------------------------------- */}
        {authView === "SIGNUP_PROFILE" && (
          <form onSubmit={handleCompleteRegistration} className="space-y-3.5 py-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Full name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Aayush Sharma"
                  className="w-full pl-9 pr-3 h-10 text-base sm:text-sm bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 rounded-none focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Email Address <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 h-10 text-base sm:text-sm bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 rounded-none focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Set 4-Digit MPIN
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="password"
                    maxLength={4}
                    minLength={4}
                    pattern="[0-9]{4}"
                    inputMode="numeric"
                    aria-label="New 4-Digit Quick PIN"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="w-full pl-9 pr-3 h-10 text-base sm:text-sm font-mono tracking-widest bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 rounded-none focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Set Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    aria-label="Set Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 chars"
                    minLength={8}
                    className="w-full pl-9 pr-10 h-10 text-base sm:text-sm bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 rounded-none focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold h-11 rounded-none shadow-none cursor-pointer mt-2"
              rightIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Complete & Continue to Checkout
            </Button>
          </form>
        )}

        {/* -------------------------------------------------------------
            VIEW 5: OTP LOGIN (For users who forgot PIN/password)
        ------------------------------------------------------------- */}
        {authView === "OTP_LOGIN_PHONE" && (
          <form onSubmit={handleSendOtpLogin} className="space-y-4 py-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Registered Mobile Number
              </label>
              <div className="flex rounded-none overflow-hidden border border-zinc-200 dark:border-zinc-800 focus-within:border-amber-500 bg-zinc-50/70 dark:bg-[#161619] transition-colors">
                <div className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-base sm:text-sm font-bold flex items-center border-r border-zinc-200 dark:border-zinc-800 shrink-0 rounded-none">
                  +977
                </div>
                <input
                  type="tel"
                  aria-label="Mobile Phone Number"
                  inputMode="numeric"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(localPhone(e.target.value))}
                  autoComplete="tel"
                  className="flex-1 px-3 py-2.5 bg-transparent text-base sm:text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 font-medium rounded-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold h-11 rounded-none shadow-none cursor-pointer"
            >
              Send Recovery Code
            </Button>

            <div className="pt-2 text-center border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setAuthView("LOGIN");
                }}
                className="text-xs text-amber-500 hover:text-amber-400 font-medium hover:underline cursor-pointer"
              >
                Back to MPIN / Password Sign In
              </button>
            </div>
          </form>
        )}

        {/* -------------------------------------------------------------
            VIEW 6: OTP LOGIN - CODE VERIFY
        ------------------------------------------------------------- */}
        {authView === "OTP_LOGIN_OTP" && (
          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>SMS code for {phone}</span>
              <button
                type="button"
                onClick={() => setAuthView("OTP_LOGIN_PHONE")}
                className="text-amber-500 hover:underline cursor-pointer font-medium"
              >
                Change Number
              </button>
            </div>

            <div className="flex justify-center gap-2.5 my-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  aria-label={`Login code digit ${idx + 1}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  className="w-12 h-14 text-center font-mono font-bold text-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-900 dark:text-white"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Resend in:{" "}
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-bold">
                  {formatTimer(otpTimer)}
                </span>
              </span>
              <button
                type="button"
                disabled={otpTimer > 0}
                onClick={handleSendOtpLogin}
                className="font-semibold text-amber-500 hover:underline disabled:opacity-40 cursor-pointer"
              >
                Resend OTP
              </button>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full font-bold h-11 rounded-none shadow-none cursor-pointer"
              disabled={otpDigits.some((d) => !d)}
              onClick={handleVerifyOtpLogin}
            >
              Verify Recovery Code
            </Button>
          </div>
        )}
        {(authView==='SIGNUP_OTP'||authView==='OTP_LOGIN_OTP')&&<button type="button" onClick={checkSmsStatus} className="mt-3 text-xs text-amber-500 underline">Check SMS delivery</button>}
        {/* -------------------------------------------------------------
            VIEW 7: RESET PASSWORD & PIN (After successful SMS recovery OTP)
        ------------------------------------------------------------- */}
        {authView === "RESET_PASSWORD" && (
          <form onSubmit={handleResetPassword} className="space-y-4 py-1">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Mobile number verified! Create your new password and 4-digit PIN below.</span>
            </div>

            <div className="space-y-3">
              {/* New Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    New Password
                  </label>
                  <span className="text-[10px] text-zinc-400">Min. 8 characters</span>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    aria-label="New Password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 chars)"
                    className="w-full pl-9 pr-10 h-10 text-base sm:text-sm bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 rounded-none focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New 4-Digit MPIN */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    New 4-Digit Quick MPIN
                  </label>
                  <span className="text-[10px] text-zinc-400">4 numeric digits</span>
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="password"
                    maxLength={4}
                    minLength={4}
                    pattern="[0-9]{4}"
                    inputMode="numeric"
                    aria-label="New 4-Digit Quick PIN"
                    autoComplete="new-password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="w-full pl-9 pr-3 h-10 text-base sm:text-sm font-mono tracking-widest bg-zinc-50/70 dark:bg-[#161619] border border-zinc-200 dark:border-zinc-800 rounded-none focus:border-amber-500 focus:outline-none text-zinc-900 dark:text-white transition-colors"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-400">Used for fast 1-tap checkout and returning login.</p>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold h-11 rounded-none shadow-none cursor-pointer mt-2"
              rightIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Save New Credentials & Sign In
            </Button>
          </form>
        )}
      </fieldset>
    </Modal>
  );
};
