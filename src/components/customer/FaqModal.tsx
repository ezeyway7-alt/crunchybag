import { BUSINESS_FAQS } from '../../data/seo/faqs';
import React, { useState } from "react";
import { HelpCircle, ChevronDown, Sparkles, MessageCircle, Phone } from "lucide-react";
import { Modal } from "../common/Modal";

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FAQS_DATA = BUSINESS_FAQS;

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
          Everything you need to know about ordering, delivery, and dining at Crunchy Bag
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
            href="tel:9761503339"
            className="px-2.5 py-1 bg-amber-500 text-black font-bold text-[11px] shrink-0 hover:bg-amber-400 cursor-pointer flex items-center gap-1"
          >
            <Phone className="w-3 h-3" />
            <span>Call Hotline (9761503339)</span>
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
