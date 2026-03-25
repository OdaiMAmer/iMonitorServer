import { useEffect } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../lib/socket';
import { useSocketStore } from '../stores/useSocketStore';
import { useServerMetricsStore } from '../stores/useServerMetricsStore';
import { useActiveAlertsStore } from '../stores/useActiveAlertsStore';
import { toast } from '../stores/useToastStore';
import type { ServerMetrics, ServerStatus, Alert } from '../types';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const setConnectionStatus = useSocketStore((s) => s.setConnectionStatus);
  const setLastHeartbeat = useSocketStore((s) => s.setLastHeartbeat);
  const updateMetrics = useServerMetricsStore((s) => s.updateMetrics);
  const updateStatus = useServerMetricsStore((s) => s.updateStatus);
  const addAlert = useActiveAlertsStore((s) => s.addAlert);
  const removeAlert = useActiveAlertsStore((s) => s.removeAlert);

  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('reconnecting', () => {
      setConnectionStatus('reconnecting');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('server:metrics', (data: { serverId: string } & ServerMetrics) => {
      updateMetrics(data.serverId, data);
      setLastHeartbeat(new Date().toISOString());
    });

    socket.on('server:status', (data: { serverId: string; status: ServerStatus }) => {
      updateStatus(data.serverId, data.status);
    });

    socket.on('server:registered', (data: { server: { hostname: string } }) => {
      toast('info', 'New Server', `${data.server.hostname} has been registered`);
    });

    socket.on('server:disconnected', (data: { serverId: string }) => {
      updateStatus(data.serverId, 'offline');
    });

    socket.on('alert:triggered', (data: { alert: Alert }) => {
      addAlert(data.alert);
      const severity = data.alert.severity === 'critical' ? 'error' : 'warning';
      toast(severity, 'Alert Triggered', data.alert.message);
    });

    socket.on('alert:resolved', (data: { alertId: string }) => {
      removeAlert(data.alertId);
    });

    return () => {
      disconnectSocket();
    };
  }, [setConnectionStatus, setLastHeartbeat, updateMetrics, updateStatus, addAlert, removeAlert]);

  return <>{children}</>;
}
