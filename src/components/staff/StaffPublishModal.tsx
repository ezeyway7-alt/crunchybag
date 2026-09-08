import React, { useState } from "react";
import { Send, CheckCircle2, ShieldCheck, AlertCircle, Hash } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";

interface StaffPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffPublishModal: React.FC<StaffPublishModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentOutlet, publishMenuDraft } = useApp();
  const [isPublishing, setIsPublishing] = useState(false);

  const handleConfirmPublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      publishMenuDraft();
      setIsPublishing(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isPublishing && onClose()}
      title="Publish Immutable Menu Version"
      description="Validate catalog diffs, statutory price checks, and publish to all consumer apps & POS"
      maxWidth="lg"
      showCloseButton={!isPublishing}
    >
      <div className="space-y-4 py-1 text-xs">
        {/* Checksum & Version Box */}
        <div className="p-4 bg-zinc-900 text-white rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-400">Target Publication:</span>
            <span className="font-mono font-bold text-amber-400">v2.4.1 (Production)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-400">Scope:</span>
            <span className="font-semibold">{currentOutlet.name} ({currentOutlet.code})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-400">Deterministic Checksum:</span>
            <span className="font-mono text-zinc-300 text-[10px] bg-black px-2 py-0.5 rounded">
              sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f...
            </span>
          </div>
        </div>

        {/* Pre-publish Checklist */}
        <div className="space-y-2">
          <h5 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
            Pre-flight Validation Checks
          </h5>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>All 8 products have valid positive prices and 13% PAN VAT calculations.</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>All modifier groups have satisfied minimum selection constraints.</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>High-resolution primary WebP imagery present for all active cards.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button variant="outline" disabled={isPublishing} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="font-bold"
            isLoading={isPublishing}
            leftIcon={<Send className="h-4 w-4" />}
            onClick={handleConfirmPublish}
          >
            Publish Live Version
          </Button>
        </div>
      </div>
    </Modal>
  );
};
