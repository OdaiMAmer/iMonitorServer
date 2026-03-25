import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useToastStore, type Toast } from '../../stores/useToastStore';
import { cn } from '../../lib/utils';

const iconMap: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-status-healthy" />,
  error: <AlertCircle className="w-5 h-5 text-status-critical" />,
  warning: <AlertTriangle className="w-5 h-5 text-status-warning" />,
  info: <Info className="w-5 h-5 text-status-info" />,
};

const borderColors: Record<Toast['type'], string> = {
  success: 'border-l-status-healthy',
  error: 'border-l-status-critical',
  warning: 'border-l-status-warning',
  info: 'border-l-status-info',
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'animate-fade-in bg-bg-surface border border-border-default rounded-lg shadow-lg p-4 flex items-start gap-3 border-l-4',
            borderColors[t.type],
          )}
        >
          <div className="flex-shrink-0 mt-0.5">{iconMap[t.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">{t.title}</p>
            {t.message && (
              <p className="text-xs text-text-secondary mt-1">{t.message}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
