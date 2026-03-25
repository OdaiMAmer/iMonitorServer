import { useState } from 'react';
import { useParams, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, Cpu, HardDrive, Network, Monitor, Settings2,
  Power, RotateCw, Loader2, Play, Square, RefreshCw,
} from 'lucide-react';
import { serversApi } from '../lib/api';
import { useServerMetricsStore } from '../stores/useServerMetricsStore';
import { MetricChart } from '../components/ui/MetricChart';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { DataTable } from '../components/ui/DataTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ChartSkeleton } from '../components/ui/Skeleton';
import { toast } from '../stores/useToastStore';
import { cn, formatBytesPerSec, formatUptime, formatDateTime } from '../lib/utils';
import type { TimeRange, ProcessInfo, ServiceInfo, EventLog } from '../types';

const tabs = [
  { to: 'overview', label: 'Overview', icon: Activity },
  { to: 'processes', label: 'Processes', icon: Cpu },
  { to: 'services', label: 'Services', icon: Settings2 },
  { to: 'event-logs', label: 'Event Logs', icon: Monitor },
  { to: 'network', label: 'Network', icon: Network },
  { to: 'hardware', label: 'Hardware', icon: HardDrive },
  { to: 'remote', label: 'Remote', icon: Power },
];

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: server, isLoading } = useQuery({
    queryKey: ['servers', id],
    queryFn: ({ signal }) => serversApi.getById(id!, signal).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="h-4 w-32 skeleton rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <ChartSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-secondary">Server not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{server.hostname}</h1>
            <StatusBadge status={server.status} pulse={server.status === 'critical'} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
            <span>{server.ipAddress}</span>
            <span>{server.os}</span>
            {server.uptime != null && <span>Up {formatUptime(server.uptime)}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-default overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2',
                isActive
                  ? 'text-primary border-primary bg-primary/5'
                  : 'text-text-secondary hover:text-text-primary border-transparent',
              )
            }
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* Tab Content */}
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewTab serverId={id!} />} />
        <Route path="processes" element={<ProcessesTab serverId={id!} />} />
        <Route path="services" element={<ServicesTab serverId={id!} />} />
        <Route path="event-logs" element={<EventLogsTab serverId={id!} />} />
        <Route path="network" element={<NetworkTab serverId={id!} />} />
        <Route path="hardware" element={<HardwareTab serverId={id!} />} />
        <Route path="remote" element={<RemoteTab serverId={id!} serverName={server.hostname} />} />
      </Routes>
    </div>
  );
}

function OverviewTab({ serverId }: { serverId: string }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const liveMetrics = useServerMetricsStore((s) => s.getMetrics(serverId));

  const { data: metricsHistory, isLoading } = useQuery({
    queryKey: ['servers', serverId, 'metrics', timeRange],
    queryFn: ({ signal }) => serversApi.getMetrics(serverId, timeRange, signal).then((r) => r.data),
  });

  const cpuData = metricsHistory?.map((m) => ({ timestamp: m.timestamp, value: m.cpu.usagePercent })) ?? [];
  const ramData = metricsHistory?.map((m) => ({ timestamp: m.timestamp, value: m.memory.usagePercent })) ?? [];
  const diskData = metricsHistory?.map((m) => ({ timestamp: m.timestamp, value: m.disk.usagePercent })) ?? [];
  const netData = metricsHistory?.map((m) => ({
    timestamp: m.timestamp,
    value: m.network.bytesInPerSec / 1024,
    value2: m.network.bytesOutPerSec / 1024,
  })) ?? [];

  const summaryCards = [
    { title: 'CPU Usage', value: `${(liveMetrics?.cpu?.usagePercent ?? 0).toFixed(1)}`, unit: '%', icon: Cpu, iconColor: 'text-chart-cpu' },
    { title: 'Memory', value: `${(liveMetrics?.memory?.usagePercent ?? 0).toFixed(1)}`, unit: '%', icon: Activity, iconColor: 'text-chart-ram' },
    { title: 'Disk', value: `${(liveMetrics?.disk?.usagePercent ?? 0).toFixed(1)}`, unit: '%', icon: HardDrive, iconColor: 'text-chart-disk' },
    { title: 'Network In', value: formatBytesPerSec(liveMetrics?.network?.bytesInPerSec ?? 0), icon: Network, iconColor: 'text-chart-network' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass-card p-5 h-24 skeleton" />)}
        </div>
        {[...Array(2)].map((_, i) => <ChartSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <MetricCard key={card.title} {...card} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricChart data={cpuData} title="CPU Usage" color="#38BDF8" label="CPU" timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        <MetricChart data={ramData} title="Memory Usage" color="#A78BFA" label="Memory" timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        <MetricChart data={diskData} title="Disk Usage" color="#34D399" label="Disk" timeRange={timeRange} onTimeRangeChange={setTimeRange} />
        <MetricChart
          data={netData} title="Network I/O" color="#FBBF24" color2="#38BDF8" type="area"
          unit=" KB/s" label="In" label2="Out" timeRange={timeRange} onTimeRangeChange={setTimeRange}
        />
      </div>
    </div>
  );
}

function ProcessesTab({ serverId }: { serverId: string }) {
  const [killing, setKilling] = useState<number | null>(null);
  const [confirmKill, setConfirmKill] = useState<ProcessInfo | null>(null);

  const { data: processes = [], refetch } = useQuery({
    queryKey: ['servers', serverId, 'processes'],
    queryFn: ({ signal }) => serversApi.getProcesses(serverId, signal).then((r) => r.data),
    refetchInterval: 10_000,
  });

  const handleKill = async () => {
    if (!confirmKill) return;
    setKilling(confirmKill.pid);
    try {
      await serversApi.killProcess(serverId, confirmKill.pid);
      toast('success', 'Process Killed', `PID ${confirmKill.pid} (${confirmKill.name}) was terminated`);
      refetch();
    } catch {
      toast('error', 'Failed to Kill Process');
    } finally {
      setKilling(null);
      setConfirmKill(null);
    }
  };

  const columns = [
    { key: 'pid', header: 'PID', sortable: true, width: '80px' },
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'cpuPercent', header: 'CPU %', sortable: true, width: '100px',
      render: (p: ProcessInfo) => <span className="font-mono">{p.cpuPercent.toFixed(1)}%</span>,
    },
    {
      key: 'memoryMB', header: 'Memory', sortable: true, width: '100px',
      render: (p: ProcessInfo) => <span className="font-mono">{p.memoryMB.toFixed(1)} MB</span>,
    },
    { key: 'status', header: 'Status', render: (p: ProcessInfo) => <StatusBadge status={p.status} size="sm" /> },
  ];

  return (
    <div className="animate-fade-in">
      <DataTable
        data={processes as unknown as Record<string, unknown>[]}
        columns={columns as any}
        searchable
        searchPlaceholder="Search processes..."
        pageSize={50}
        actions={(item: any) => (
          <button
            onClick={() => setConfirmKill(item as ProcessInfo)}
            disabled={killing === (item as any).pid}
            className="px-2.5 py-1 text-xs font-medium text-status-critical border border-status-critical/30 rounded-md hover:bg-status-critical/10 transition-colors disabled:opacity-50"
          >
            {killing === (item as any).pid ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Kill'}
          </button>
        )}
      />
      <ConfirmDialog
        isOpen={!!confirmKill}
        onClose={() => setConfirmKill(null)}
        onConfirm={handleKill}
        title="Kill Process"
        message={`Are you sure you want to kill "${confirmKill?.name}" (PID: ${confirmKill?.pid})?`}
        confirmLabel="Kill Process"
        destructive
      />
    </div>
  );
}

function ServicesTab({ serverId }: { serverId: string }) {
  const [acting, setActing] = useState<string | null>(null);

  const { data: services = [], refetch } = useQuery({
    queryKey: ['servers', serverId, 'services'],
    queryFn: ({ signal }) => serversApi.getServices(serverId, signal).then((r) => r.data),
    refetchInterval: 15_000,
  });

  const handleAction = async (serviceName: string, action: string) => {
    setActing(serviceName);
    try {
      await serversApi.serviceAction(serverId, serviceName, action);
      toast('success', 'Service Action', `${action} command sent to ${serviceName}`);
      refetch();
    } catch {
      toast('error', 'Service Action Failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="animate-fade-in space-y-3">
      {services.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">No services data available</div>
      ) : (
        services.map((svc: ServiceInfo) => (
          <div key={svc.name} className="glass-card p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-medium text-text-primary truncate">{svc.displayName}</h4>
                <StatusBadge status={svc.status} size="sm" />
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">{svc.name} &middot; {svc.startupType}</p>
            </div>
            <div className="flex items-center gap-1.5 ml-4">
              {svc.status !== 'running' && (
                <button
                  onClick={() => handleAction(svc.name, 'start')}
                  disabled={acting === svc.name}
                  className="p-1.5 rounded-md text-status-healthy hover:bg-status-healthy/10 transition-colors disabled:opacity-50"
                  title="Start"
                >
                  {acting === svc.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                </button>
              )}
              {svc.status === 'running' && (
                <button
                  onClick={() => handleAction(svc.name, 'stop')}
                  disabled={acting === svc.name}
                  className="p-1.5 rounded-md text-status-critical hover:bg-status-critical/10 transition-colors disabled:opacity-50"
                  title="Stop"
                >
                  {acting === svc.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => handleAction(svc.name, 'restart')}
                disabled={acting === svc.name}
                className="p-1.5 rounded-md text-status-warning hover:bg-status-warning/10 transition-colors disabled:opacity-50"
                title="Restart"
              >
                {acting === svc.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function EventLogsTab({ serverId }: { serverId: string }) {
  const [level, setLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data } = useQuery({
    queryKey: ['servers', serverId, 'event-logs', { level, search: searchQuery }],
    queryFn: ({ signal }) =>
      serversApi.getEventLogs(serverId, {
        ...(level !== 'all' && { level }),
        ...(searchQuery && { search: searchQuery }),
      }, signal).then((r) => r.data),
  });

  const logs = data?.data ?? [];
  const levelColors: Record<string, string> = {
    error: 'text-status-critical bg-status-critical/10',
    warning: 'text-status-warning bg-status-warning/10',
    info: 'text-status-info bg-status-info/10',
    debug: 'text-text-tertiary bg-bg-surface-raised',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-4 pr-4 py-2 bg-bg-surface border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'error', 'warning', 'info', 'debug'].map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors',
                level === l ? 'bg-primary/20 text-primary' : 'text-text-tertiary hover:bg-bg-surface-raised',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="glass-card divide-y divide-border-subtle">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-text-tertiary text-sm">No event logs found</div>
        ) : (
          logs.map((log: EventLog) => (
            <div key={log.id} className="px-4 py-3 flex items-start gap-3">
              <span className={cn('px-1.5 py-0.5 text-[10px] font-bold uppercase rounded', levelColors[log.level] ?? '')}>
                {log.level}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{log.message}</p>
                <div className="flex gap-3 mt-1 text-xs text-text-tertiary">
                  <span>{formatDateTime(log.timestamp)}</span>
                  <span>{log.source}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NetworkTab({ serverId }: { serverId: string }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');

  const { data: metricsHistory } = useQuery({
    queryKey: ['servers', serverId, 'metrics', timeRange],
    queryFn: ({ signal }) => serversApi.getMetrics(serverId, timeRange, signal).then((r) => r.data),
  });

  const { data: networkData } = useQuery({
    queryKey: ['servers', serverId, 'network'],
    queryFn: ({ signal }) => serversApi.getNetwork(serverId, signal).then((r) => r.data),
  });

  const bandwidthData = metricsHistory?.map((m) => ({
    timestamp: m.timestamp,
    value: m.network.bytesInPerSec / 1024,
    value2: m.network.bytesOutPerSec / 1024,
  })) ?? [];

  const connectionColumns = [
    { key: 'localAddress', header: 'Local Address', sortable: true },
    { key: 'localPort', header: 'Local Port', sortable: true },
    { key: 'remoteAddress', header: 'Remote Address', sortable: true },
    { key: 'protocol', header: 'Protocol', sortable: true },
    { key: 'state', header: 'State', render: (c: any) => <StatusBadge status={c.state === 'ESTABLISHED' ? 'healthy' : 'unknown'} label={c.state} size="sm" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <MetricChart
        data={bandwidthData}
        title="Bandwidth"
        color="#FBBF24"
        color2="#38BDF8"
        type="area"
        unit=" KB/s"
        label="Download"
        label2="Upload"
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
      {networkData?.connections && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Active Connections</h3>
          <DataTable
            data={(networkData.connections ?? []) as unknown as Record<string, unknown>[]}
            columns={connectionColumns as any}
            searchable
            searchPlaceholder="Search connections..."
            pageSize={25}
          />
        </div>
      )}
    </div>
  );
}

function HardwareTab({ serverId }: { serverId: string }) {
  const { data: hardware, isLoading } = useQuery({
    queryKey: ['servers', serverId, 'hardware'],
    queryFn: ({ signal }) => serversApi.getHardware(serverId, signal).then((r) => r.data),
  });

  if (isLoading || !hardware) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="glass-card p-5 h-40 skeleton" />)}</div>;
  }

  const sections = [
    { title: 'Processor', items: [
      { label: 'Model', value: hardware.cpu.model },
      { label: 'Cores', value: String(hardware.cpu.cores) },
      { label: 'Speed', value: hardware.cpu.speed },
      { label: 'Architecture', value: hardware.cpu.architecture },
    ]},
    { title: 'Memory', items: [
      { label: 'Total', value: hardware.memory.total },
      { label: 'Slots', value: String(hardware.memory.slots) },
      { label: 'Type', value: hardware.memory.type },
    ]},
    { title: 'Operating System', items: [
      { label: 'Name', value: hardware.os.name },
      { label: 'Version', value: hardware.os.version },
      { label: 'Build', value: hardware.os.build },
      { label: 'Architecture', value: hardware.os.architecture },
    ]},
    { title: 'BIOS', items: [
      { label: 'Manufacturer', value: hardware.bios.manufacturer },
      { label: 'Version', value: hardware.bios.version },
      { label: 'Release Date', value: hardware.bios.releaseDate },
    ]},
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      {sections.map((section) => (
        <div key={section.title} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">{section.title}</h3>
          <div className="space-y-2">
            {section.items.map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-text-primary font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {hardware.disks.length > 0 && (
        <div className="glass-card p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Storage Drives</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hardware.disks.map((d, i) => (
              <div key={i} className="p-3 rounded-lg bg-bg-surface-raised/50 border border-border-subtle">
                <p className="text-sm font-medium text-text-primary">{d.model}</p>
                <div className="flex justify-between text-xs text-text-tertiary mt-1">
                  <span>{d.capacity}</span>
                  <span>{d.type} &middot; {d.interface}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RemoteTab({ serverId, serverName }: { serverId: string; serverName: string }) {
  const [showRestart, setShowRestart] = useState(false);
  const [showShutdown, setShowShutdown] = useState(false);

  const handleRestart = async () => {
    try {
      await serversApi.restart(serverId);
      toast('success', 'Restart Initiated', `${serverName} is restarting...`);
    } catch {
      toast('error', 'Restart Failed');
    } finally {
      setShowRestart(false);
    }
  };

  const handleShutdown = async () => {
    try {
      await serversApi.shutdown(serverId);
      toast('success', 'Shutdown Initiated', `${serverName} is shutting down...`);
    } catch {
      toast('error', 'Shutdown Failed');
    } finally {
      setShowShutdown(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-status-warning/10 mb-3">
            <RotateCw className="w-8 h-8 text-status-warning" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">Restart Server</h3>
          <p className="text-sm text-text-secondary mb-4">Gracefully restart the server</p>
          <button
            onClick={() => setShowRestart(true)}
            className="px-4 py-2 bg-status-warning/20 text-status-warning border border-status-warning/30 rounded-lg text-sm font-medium hover:bg-status-warning/30 transition-colors"
          >
            Restart
          </button>
        </div>

        <div className="glass-card p-6 flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-status-critical/10 mb-3">
            <Power className="w-8 h-8 text-status-critical" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">Shutdown Server</h3>
          <p className="text-sm text-text-secondary mb-4">Power off the server completely</p>
          <button
            onClick={() => setShowShutdown(true)}
            className="px-4 py-2 bg-status-critical/20 text-status-critical border border-status-critical/30 rounded-lg text-sm font-medium hover:bg-status-critical/30 transition-colors"
          >
            Shutdown
          </button>
        </div>

        <div className="glass-card p-6 flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-primary/10 mb-3">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">RDP Connect</h3>
          <p className="text-sm text-text-secondary mb-4">Remote desktop connection</p>
          <a
            href={`/api/servers/${serverId}/remote/rdp`}
            className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors"
          >
            Download .rdp
          </a>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showRestart}
        onClose={() => setShowRestart(false)}
        onConfirm={handleRestart}
        title="Restart Server"
        message={`Are you sure you want to restart "${serverName}"? All active connections will be interrupted.`}
        confirmLabel="Restart"
        countdown={5}
      />

      <ConfirmDialog
        isOpen={showShutdown}
        onClose={() => setShowShutdown(false)}
        onConfirm={handleShutdown}
        title="Shutdown Server"
        message={`Are you sure you want to shutdown "${serverName}"? The server will be powered off and must be manually started again.`}
        confirmLabel="Shutdown"
        destructive
        countdown={10}
      />
    </div>
  );
}
