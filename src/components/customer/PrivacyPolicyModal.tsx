import React from "react";
import { ShieldCheck, Lock, FileText, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { Modal } from "../common/Modal";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDeletion?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onRequestDeletion,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#60BB46]" />
          <span className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
            Privacy Policy & Data Protection
          </span>
        </div>
      }
      description={
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Last updated: September 15, 2026 • Compliant with Nepal Privacy Act 2075 & Global Standards
        </span>
      }
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
        {/* Intro Highlight Box */}
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-zinc-900 dark:text-zinc-100 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-[#60BB46]">
            <Lock className="w-3.5 h-3.5" />
            <span>Our Privacy Commitment</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
            Crunchy Restaurant ("we", "us", "our") respects your personal privacy. We only collect the minimal information necessary to prepare your food, coordinate delivery, process secure payments, and fulfill statutory tax requirements. We never sell your personal data to third parties.
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-1.5">
          <h4 className="font-black text-zinc-950 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-amber-500 font-mono">01.</span>
            <span>Information We Collect</span>
          </h4>
          <p>
            When you use our ordering platform, dine at our restaurant, or request delivery, we may collect the following:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>Contact Details:</strong> Your name, phone number, and optional email address to confirm orders and notify you of delivery status.
            </li>
            <li>
              <strong>Delivery & Location Data:</strong> Street address, neighborhood landmarks, and optional GPS coordinates to ensure dispatch riders find your location efficiently.
            </li>
            <li>
              <strong>Order & Dining History:</strong> Items ordered, customization notes, order timestamps, and table reservation preferences.
            </li>
            <li>
              <strong>Payment Transaction Metadata:</strong> eSewa transaction IDs, payment status, and VAT billing summaries. <em>(Note: We never store your eSewa password, MPIN, or bank login credentials).</em>
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="space-y-1.5">
          <h4 className="font-black text-zinc-950 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-amber-500 font-mono">02.</span>
            <span>How We Use Your Data</span>
          </h4>
          <p>We process your personal information strictly for legitimate operational purposes:</p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>Routing orders to kitchen display systems (KDS) for immediate cooking.</li>
            <li>Providing real-time live order tracking and countdown status.</li>
            <li>Enabling delivery couriers to contact you upon doorstep arrival.</li>
            <li>Issuing official fiscal VAT tax invoices in accordance with the Inland Revenue Department (IRD) of Nepal.</li>
            <li>Customer support inquiries, refunds, and resolution of delivery disputes.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-1.5">
          <h4 className="font-black text-zinc-950 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-amber-500 font-mono">03.</span>
            <span>Third-Party Payment & Infrastructure</span>
          </h4>
          <p>
            We partner with certified, secure service providers to power our platform:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>
              <strong>eSewa Wallet:</strong> Online payments are conducted via eSewa's secure encrypted API. All financial credentials remain under eSewa's PCI-DSS compliant infrastructure.
            </li>
            <li>
              <strong>Carto / Leaflet Mapping:</strong> Map tiles are loaded to visually display outlet locations and dispatch routes without tracking your long-term personal browsing history.
            </li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="space-y-1.5">
          <h4 className="font-black text-zinc-950 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-amber-500 font-mono">04.</span>
            <span>Cookies & Client-Side Storage</span>
          </h4>
          <p>
            We use minimal client-side web storage (LocalStorage and SessionStorage) to store:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>Your active shopping cart items and meal customization selections.</li>
            <li>UI display preferences (Light/Dark mode).</li>
            <li>Saved favorite menu items for rapid re-ordering.</li>
          </ul>
        </div>

        {/* Section 5: Account Deletion */}
        <div className="space-y-2 p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h4 className="font-black text-zinc-950 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-amber-500 font-mono">05.</span>
            <span>Your Rights & Account Deletion</span>
          </h4>
          <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
            You have the absolute right to access your stored data, rectify inaccurate contact details, or request full deletion of your user account and personal records at any time.
          </p>
          {onRequestDeletion && (
            <button
              onClick={() => {
                onClose();
                onRequestDeletion();
              }}
              className="mt-1 text-xs font-bold text-rose-600 dark:text-rose-400 underline hover:text-rose-700 cursor-pointer block"
            >
              Submit an Account & Data Deletion Request &rarr;
            </button>
          )}
        </div>

        {/* Section 6 */}
        <div className="space-y-1.5">
          <h4 className="font-black text-zinc-950 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-amber-500 font-mono">06.</span>
            <span>Contact Information</span>
          </h4>
          <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
            For questions regarding this policy or data privacy inquiries, contact our Privacy Officer:
          </p>
          <div className="font-mono text-[11px] space-y-0.5 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 border border-zinc-200 dark:border-zinc-800">
            <div>Email: privacy@crunchy.com.np</div>
            <div>Hotline: +977 1-4229988</div>
            <div>Address: Kings Way, Durbar Marg, Kathmandu, Nepal</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
