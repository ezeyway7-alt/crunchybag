import React, { useState } from "react";
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Info,
  Phone,
} from "lucide-react";
import { Modal } from "../common/Modal";
import { useApp } from "../../context/AppContext";

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { customerUser, setCustomerUser, showNotification } = useApp();

  const [phoneOrEmail, setPhoneOrEmail] = useState(
    customerUser?.phone || customerUser?.email || ""
  );
  const [reason, setReason] = useState<string>("no_longer_using");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOrEmail.trim() || !confirmCheckbox) return;

    setIsSubmitting(true);

    // Simulate backend deletion endpoint (POST /api/user/account-deletion)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      // If the current logged-in customer matches, clear customer session
      if (
        customerUser &&
        (customerUser.phone === phoneOrEmail || customerUser.email === phoneOrEmail)
      ) {
        setCustomerUser(null);
      }

      // Clear cached delivery addresses and local favorites
      try {
        localStorage.removeItem("crunchy_favorites");
        localStorage.removeItem("crunchy_last_address");
      } catch (err) {
        // ignore
      }

      showNotification("Account deletion request recorded successfully.", "info");
    }, 1000);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setConfirmCheckbox(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <Trash2 className="w-4 h-4" />
          <span className="font-black text-sm uppercase tracking-wider">
            User Account & Data Deletion
          </span>
        </div>
      }
      description={
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Manage your personal data in accordance with Google & privacy guidelines
        </span>
      }
    >
      {isSubmitted ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-base text-zinc-950 dark:text-white">
              Deletion Request Confirmed
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Your account deletion request for{" "}
              <strong className="text-zinc-900 dark:text-white font-mono">{phoneOrEmail}</strong> has been
              registered. All profile information, saved addresses, and active session tokens have been
              purged from this device.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleResetAndClose}
              className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black text-xs font-bold cursor-pointer transition-opacity hover:opacity-90"
            >
              Close Window
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Warning Banner */}
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <strong>Permanent Action:</strong> Deleting your account will erase your profile, delivery addresses, saved favorites, and loyalty records.
            </div>
          </div>

          {/* Policy summary box */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-[11px] text-zinc-600 dark:text-zinc-400">
            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-500" />
              <span>What gets deleted vs retained</span>
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Permanently Erased:</strong> Customer name, phone number, delivery locations, GPS points, dietary preferences, and saved cart items.
              </li>
              <li>
                <strong>Legally Retained:</strong> Historical fiscal VAT sales receipts are retained for 5 years strictly as mandated by the Inland Revenue Department (IRD) of Nepal for tax compliance.
              </li>
            </ul>
          </div>

          {/* Phone or Email Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Registered Phone Number or Email *
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="e.g. 9841000000 or name@example.com"
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Reason for Deletion (Optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="no_longer_using">No longer ordering from Crunchy</option>
              <option value="privacy_concerns">Privacy or data collection concerns</option>
              <option value="duplicate_account">Duplicate or old phone number</option>
              <option value="other">Other reason</option>
            </select>
          </div>

          {/* Confirmation Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={confirmCheckbox}
                onChange={(e) => setConfirmCheckbox(e.target.checked)}
                className="mt-0.5 accent-rose-600 rounded-none cursor-pointer"
              />
              <span className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                I understand that this action is irreversible and I request the complete deletion of my account data.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !confirmCheckbox || !phoneOrEmail.trim()}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete My Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
