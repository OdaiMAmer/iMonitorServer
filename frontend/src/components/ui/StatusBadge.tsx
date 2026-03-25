import { cn, getStatusBgColor } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, pulse = false, size = 'md' }: StatusBadgeProps) {
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border rounded-full font-medium',
        getStatusBgColor(status),
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              status === 'healthy' || status === 'running' ? 'bg-status-healthy' :
              status === 'warning' ? 'bg-status-warning' :
              status === 'critical' ? 'bg-status-critical' : 'bg-text-tertiary',
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            status === 'healthy' || status === 'running' ? 'bg-status-healthy' :
            status === 'warning' || status === 'paused' ? 'bg-status-warning' :
            status === 'critical' || status === 'error' || status === 'stopped' ? 'bg-status-critical' :
            status === 'maintenance' ? 'bg-status-maintenance' : 'bg-text-tertiary',
          )}
        />
      </span>
      {displayLabel}
    </span>
  );
}
