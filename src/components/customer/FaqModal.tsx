import React, { useState } from "react";
import { HelpCircle, ChevronDown, Sparkles, MessageCircle, Phone } from "lucide-react";
import { Modal } from "../common/Modal";

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FAQS_DATA = [
  {
    q: "How do I order food online from Crunchy in Kathmandu?",
    a: "Select your favorite dishes from our online menu, choose delivery or takeaway, and complete instant payment using your eSewa digital wallet. Your order is sent directly to our kitchen display system for immediate cooking.",
  },
  {
    q: "What payment methods are supported on Crunchy?",
    a: "Crunchy supports 100% secure digital payments via eSewa with real-time transaction verification.",
  },
  {
    q: "Where is Crunchy located in Kathmandu?",
    a: "Our flagship restaurant is located on Kings Way, opposite Narayanhiti Palace in Durbar Marg, Kathmandu. We offer dine-in, table reservations, counter takeaway, and delivery across Kathmandu Valley.",
  },
  {
    q: "How long does delivery take?",
    a: "Average delivery time is 30 to 45 minutes across Kathmandu, Patan, and Lalitpur, with live GPS countdown tracking.",
  },
  {
    q: "Can I customize the spice level or request boneless chicken?",
    a: "Yes! When clicking on any fried chicken or burger product card, an item customizer opens where you can choose spice levels (Mild, Medium, Himalayan Extra Hot), add dips, and select extra toppings.",
  },
  {
    q: "Do you cater for bulk orders or private events?",
    a: "Yes, we accept party buckets and bulk catering for corporate events and celebrations in Kathmandu. Please contact our Durbar Marg hotline at +977 1-4229988 at least 3 hours in advance.",
  },
];

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white">
            Frequently Asked Questions
          </span>
        </div>
      }
      description={
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Everything you need to know about ordering, delivery, and dining at Crunchy
        </span>
      }
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Intro banner */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-zinc-700 dark:text-zinc-300">
              Need immediate help with an ongoing order?
            </span>
          </div>
          <a
            href="tel:+97714229988"
            className="px-2.5 py-1 bg-amber-500 text-black font-bold text-[11px] shrink-0 hover:bg-amber-400 cursor-pointer flex items-center gap-1"
          >
            <Phone className="w-3 h-3" />
            <span>Call Hotline</span>
          </a>
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-2">
          {FAQS_DATA.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-zinc-900 dark:text-white hover:text-amber-500 transition-colors cursor-pointer gap-3"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-amber-500" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-0 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
