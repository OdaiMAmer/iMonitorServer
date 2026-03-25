import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  countdown?: number;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  countdown = 0,
}: ConfirmDialogProps) {
  const [remaining, setRemaining] = useState(countdown);

  useEffect(() => {
    if (!isOpen) { setRemaining(countdown); return; }
    if (countdown <= 0) return;
    setRemaining(countdown);
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(interval); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-surface border border-border-default rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-4">
          {destructive && (
            <div className="p-2 rounded-lg bg-status-critical/10">
              <AlertTriangle className="w-6 h-6 text-status-critical" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary mt-2">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-surface-raised border border-border-default rounded-lg hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={remaining > 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              destructive
                ? 'bg-status-critical text-white hover:bg-red-600'
                : 'bg-primary text-bg-root hover:bg-primary-hover'
            }`}
          >
            {remaining > 0 ? `${confirmLabel} (${remaining}s)` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
