import { formatDistanceToNow, format } from 'date-fns';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatBytesPerSec(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy HH:mm:ss');
  } catch {
    return 'Unknown';
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    healthy: 'text-status-healthy',
    running: 'text-status-healthy',
    warning: 'text-status-warning',
    paused: 'text-status-warning',
    critical: 'text-status-critical',
    error: 'text-status-critical',
    stopped: 'text-status-critical',
    offline: 'text-text-tertiary',
    unknown: 'text-text-tertiary',
    maintenance: 'text-status-maintenance',
  };
  return colors[status] || 'text-text-secondary';
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    healthy: 'bg-status-healthy/10 text-status-healthy border-status-healthy/20',
    running: 'bg-status-healthy/10 text-status-healthy border-status-healthy/20',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    critical: 'bg-status-critical/10 text-status-critical border-status-critical/20',
    error: 'bg-status-critical/10 text-status-critical border-status-critical/20',
    offline: 'bg-text-tertiary/10 text-text-tertiary border-text-tertiary/20',
    maintenance: 'bg-status-maintenance/10 text-status-maintenance border-status-maintenance/20',
  };
  return colors[status] || 'bg-bg-surface-raised text-text-secondary';
}

export function getMetricColor(value: number): string {
  if (value >= 90) return 'text-status-critical';
  if (value >= 70) return 'text-status-warning';
  return 'text-status-healthy';
}

export function getMetricStrokeColor(value: number): string {
  if (value >= 90) return '#EF4444';
  if (value >= 70) return '#F59E0B';
  return '#22C55E';
}
