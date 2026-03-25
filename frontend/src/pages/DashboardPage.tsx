import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Server, Activity, AlertTriangle, XCircle, Search,
  LayoutGrid, List, Wifi,
} from 'lucide-react';
import { serversApi, dashboardApi } from '../lib/api';
import { useServerMetricsStore } from '../stores/useServerMetricsStore';
import { useUIStore } from '../stores/useUIStore';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CircularGauge } from '../components/ui/CircularGauge';
import { EmptyState } from '../components/ui/EmptyState';
import { ServerCardSkeleton } from '../components/ui/Skeleton';
import { cn, formatRelativeTime, formatUptime } from '../lib/utils';
import type { Server as ServerType } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { dashboardViewMode, setDashboardViewMode } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const metricsStore = useServerMetricsStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: ({ signal }) => dashboardApi.getStats(signal).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: servers, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: ({ signal }) => serversApi.list(undefined, signal).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const filteredServers = useMemo(() => {
    if (!servers) return [];
    return servers.filter((s) => {
      const matchesSearch =
        !search ||
        s.hostname.toLowerCase().includes(search.toLowerCase()) ||
        s.ipAddress.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [servers, search, statusFilter]);

  const getServerMetrics = (serverId: string) => {
    const m = metricsStore.getMetrics(serverId);
    return {
      cpu: m?.cpu?.usagePercent ?? 0,
      ram: m?.memory?.usagePercent ?? 0,
      disk: m?.disk?.usagePercent ?? 0,
    };
  };

  const statCards = [
    { title: 'Total Servers', value: stats?.totalServers ?? 0, icon: Server, iconColor: 'text-primary' },
    { title: 'Healthy', value: stats?.healthyCount ?? 0, icon: Activity, iconColor: 'text-status-healthy' },
    { title: 'Warning', value: stats?.warningCount ?? 0, icon: AlertTriangle, iconColor: 'text-status-warning' },
    { title: 'Critical', value: stats?.criticalCount ?? 0, icon: XCircle, iconColor: 'text-status-critical' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Overview of all monitored servers</p>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconColor={card.iconColor}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hostname or IP..."
            className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'healthy', 'warning', 'critical', 'offline'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize',
                statusFilter === status
                  ? 'bg-primary/20 text-primary'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-surface-raised',
              )}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setDashboardViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              dashboardViewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDashboardViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              dashboardViewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Server Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <ServerCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredServers.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No servers found"
          description={search || statusFilter !== 'all' ? 'No servers match your filters. Try adjusting your search.' : 'No servers registered yet. Install the monitoring agent on your servers to get started.'}
        />
      ) : dashboardViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredServers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              metrics={getServerMetrics(server.id)}
              onClick={() => navigate(`/servers/${server.id}`)}
            />
          ))}
        </div>
      ) : (
        <ServerListView
          servers={filteredServers}
          getMetrics={getServerMetrics}
          onRowClick={(s) => navigate(`/servers/${s.id}`)}
        />
      )}
    </div>
  );
}

function ServerCard({
  server,
  metrics,
  onClick,
}: {
  server: ServerType;
  metrics: { cpu: number; ram: number; disk: number };
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="glass-card p-5 cursor-pointer animate-fade-in transition-all hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-text-primary truncate">{server.hostname}</h3>
        <StatusBadge status={server.status} size="sm" pulse={server.status === 'critical'} />
      </div>
      <p className="text-xs text-text-tertiary mb-4">{server.ipAddress}</p>

      <div className="flex justify-around mb-4">
        <CircularGauge value={metrics.cpu} label="CPU" color="#38BDF8" />
        <CircularGauge value={metrics.ram} label="RAM" color="#A78BFA" />
        <CircularGauge value={metrics.disk} label="Disk" color="#34D399" />
      </div>

      <div className="flex items-center justify-between text-xs text-text-tertiary">
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3" />
          <span>{server.lastHeartbeat ? formatRelativeTime(server.lastHeartbeat) : 'Never'}</span>
        </div>
        {server.uptime != null && <span>Up {formatUptime(server.uptime)}</span>}
      </div>
    </div>
  );
}

function ServerListView({
  servers,
  getMetrics,
  onRowClick,
}: {
  servers: ServerType[];
  getMetrics: (id: string) => { cpu: number; ram: number; disk: number };
  onRowClick: (s: ServerType) => void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">Server</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">CPU</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">RAM</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">Disk</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">Last Seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {servers.map((server) => {
            const m = getMetrics(server.id);
            return (
              <tr
                key={server.id}
                onClick={() => onRowClick(server)}
                className="cursor-pointer hover:bg-bg-surface-raised/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <span className="text-sm font-medium text-text-primary">{server.hostname}</span>
                    <span className="text-xs text-text-tertiary ml-2">{server.ipAddress}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={server.status} size="sm" /></td>
                <td className="px-4 py-3 text-sm font-mono text-text-primary">{m.cpu.toFixed(1)}%</td>
                <td className="px-4 py-3 text-sm font-mono text-text-primary">{m.ram.toFixed(1)}%</td>
                <td className="px-4 py-3 text-sm font-mono text-text-primary">{m.disk.toFixed(1)}%</td>
                <td className="px-4 py-3 text-xs text-text-tertiary">
                  {server.lastHeartbeat ? formatRelativeTime(server.lastHeartbeat) : 'Never'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
