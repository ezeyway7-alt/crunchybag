import { apiClient, extractErrorMessage } from "../../lib/api";
import { customerPath, saveCustomerSession } from "../../lib/customerApi";
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
  onSuccess?: () => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useApp();
  const [authMethod, setAuthMethod] = useState<"OTP" | "PIN" | "PASSWORD">("OTP");

  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [challenge,setChallenge] = useState('');
  const [demoCode,setDemoCode] = useState('');
  const [registrationToken,setRegistrationToken] = useState('');
  const [username,setUsername] = useState('');
  const [email,setEmail] = useState('');
  const locked = useRef(false);
  const perform = async (work: () => Promise<void>) => { if(locked.current)return;locked.current=true;setBusy(true);setError('');try{await work();}catch(e){setError(extractErrorMessage(e));}finally{locked.current=false;setBusy(false);} };
  const finish = (result:any) => {saveCustomerSession(result);setPassword('');setNewPin('');setPinDigits(['','','','']);setOtpDigits(['','','','']);onSuccess?.();onClose();};
  // OTP State
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
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

  useEffect(()=>{if(isOpen){setIsSecuritySetupOpen(false);setOtpSent(false);setAuthMethod('OTP');setError('');setPassword('');setNewPin('');}},[isOpen]);
  const handleSendOtp = (e: any) => {
    e.preventDefault();
    void perform(async () => {
      const result = await apiClient.post<any>(customerPath('auth/start/'), {phone}, {skipAuth:true});
      if(result.exists){setAuthMethod('PIN');setOtpSent(false);return;}
      setChallenge(result.challenge_id);setDemoCode(result.demo_code);setOtpDigits(['','','','']);setOtpSent(true);setOtpTimer(45);
      setTimeout(()=>inputRefs.current[0]?.focus(),100);
    });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    // Auto focus next input
    if (value && index < 3) {
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

  const handleVerifyOtp = () => void perform(async () => {
    const result = await apiClient.post<any>(customerPath('auth/verify/'), {challenge_id:challenge,code:otpDigits.join('')}, {skipAuth:true});
    setRegistrationToken(result.registration_token);setIsSecuritySetupOpen(true);
  });
  const handleVerifyPin = () => void perform(async () => {
    const result = await apiClient.post<any>(customerPath('auth/login/'), {phone,method:authMethod,credential:authMethod==='PASSWORD'?password:pinDigits.join('')}, {skipAuth:true});
    finish(result);
  });
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();void perform(async () => {
      const result = await apiClient.post<any>(customerPath('auth/register/'), {registration_token:registrationToken,username,email,pin:newPin,password}, {skipAuth:true});
      finish(result);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSecuritySetupOpen ? "Create Your Account" : "Customer Sign In"}
      description={
        isSecuritySetupOpen
          ? "Choose your username, PIN and password"
          : "Access your past orders, favorite combos, and one-tap reorders"
      }
      maxWidth="md"
    >
      <fieldset disabled={busy} className="contents">
      {error && <p role="alert" className="text-xs text-rose-500 mb-3">{error}</p>}
      {isSecuritySetupOpen ? (
        <form onSubmit={handleSaveSecurity} className="space-y-4 py-2">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-amber-500 shrink-0" />
            <p className="text-xs text-zinc-700 dark:text-zinc-300">
              Use your mobile number with your PIN or password next time.
            </p>
          </div>

          <Input label="Username" value={username} onChange={e=>setUsername(e.target.value)} minLength={3} required autoComplete="username" />
          <Input label="Email (optional)" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" />
          <Input label="Set Password" type="password" value={password} minLength={8} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password" />
          <Input
            label="New 4-Digit Quick PIN"
            type="password"
            maxLength={4}
            minLength={4}
            pattern="[0-9]{4}"
            inputMode="numeric"
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
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1 font-bold"
              rightIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Create Account & Continue
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
              Mobile Number
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

          {/* Mobile Number Flow */}
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
                    hint="Enter your mobile to sign in or create an account."
                    required
                  />
                  <Button type="submit" variant="primary" size="lg" className="w-full font-bold">
                    Continue
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Signup code for {phone}</span>
                    <button
                      onClick={() => setOtpSent(false)}
                      className="text-amber-500 hover:underline cursor-pointer"
                    >
                      Change Phone
                    </button>
                  </div>

                  {demoCode && <p className="text-xs text-amber-500">Temporary test code: <strong>{demoCode}</strong> (SMS is not sent yet)</p>}
                  <div className="flex justify-between gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        aria-label={`Signup code digit ${idx+1}`}
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

          {authMethod === "PIN" && <Input label="Mobile Phone Number" value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="tel" required />}
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
                    aria-label={`PIN digit ${idx+1}`}
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
                label="Mobile Phone Number"
                value={phone}
                onChange={e=>setPhone(e.target.value)}
                autoComplete="tel"
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
      </fieldset>
    </Modal>
  );
};
