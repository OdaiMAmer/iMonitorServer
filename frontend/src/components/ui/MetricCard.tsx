import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function MetricCard({ title, value, unit, icon: Icon, iconColor, trend, className }: MetricCardProps) {
  return (
    <div className={cn('glass-card p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-secondary font-medium">{title}</span>
        {Icon && (
          <div className={cn('p-2 rounded-lg bg-bg-surface-raised/50', iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold font-mono text-text-primary animate-count-up">
          {value}
        </span>
        {unit && <span className="text-sm text-text-tertiary">{unit}</span>}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-status-healthy' : 'text-status-critical',
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-text-tertiary">from last hour</span>
        </div>
      )}
    </div>
  );
}
