import { cn, getMetricStrokeColor } from '../../lib/utils';

interface CircularGaugeProps {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function CircularGauge({
  value,
  label,
  size = 72,
  strokeWidth = 6,
  color,
  className,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const strokeColor = color || getMetricStrokeColor(value);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-bg-surface-raised"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-600 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-mono text-text-primary">
            {Math.round(value)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
