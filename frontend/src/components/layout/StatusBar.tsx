import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSocketStore } from '../../stores/useSocketStore';
import { useUIStore } from '../../stores/useUIStore';
import { formatRelativeTime } from '../../lib/utils';

export default function StatusBar() {
  const { connectionStatus, lastHeartbeat } = useSocketStore();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    connected: {
      icon: <Wifi className="w-3.5 h-3.5" />,
      label: 'Connected',
      color: 'text-status-healthy',
    },
    connecting: {
      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
      label: 'Connecting...',
      color: 'text-status-warning',
    },
    reconnecting: {
      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
      label: 'Reconnecting...',
      color: 'text-status-warning',
    },
    disconnected: {
      icon: <WifiOff className="w-3.5 h-3.5" />,
      label: 'Disconnected',
      color: 'text-status-critical',
    },
  };

  const config = statusConfig[connectionStatus] || statusConfig.disconnected;

  return (
    <footer
      className="h-8 flex items-center px-4 text-xs border-t border-border-default bg-bg-root/80 backdrop-blur-sm"
      style={{
        marginLeft: sidebarCollapsed ? '64px' : '260px',
        transition: 'margin-left 0.2s ease-in-out',
      }}
    >
      <div className={`flex items-center gap-1.5 ${config.color}`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
      {lastHeartbeat && (
        <>
          <span className="mx-3 text-border-default">|</span>
          <span className="text-text-tertiary">
            Last update: {formatRelativeTime(lastHeartbeat)}
          </span>
        </>
      )}
      <span className="ml-auto text-text-tertiary">v1.0.0</span>
    </footer>
  );
}
