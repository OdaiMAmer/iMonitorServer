import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Shield, CheckCircle, AlertTriangle, AlertCircle, Info, Clock, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { alertsApi } from '../lib/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from '../stores/useToastStore';
import { cn, formatRelativeTime, formatDateTime } from '../lib/utils';
import type { Alert, AlertRule } from '../types';

type Tab = 'active' | 'rules' | 'history';

export default function AlertsPage() {
  const [tab, setTab] = useState<Tab>('active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Alerts</h1>
          <p className="text-sm text-text-secondary mt-1">Monitor and manage alert rules</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border-default">
        {([
          { key: 'active', label: 'Active Alerts', icon: Bell },
          { key: 'rules', label: 'Alert Rules', icon: Shield },
          { key: 'history', label: 'History', icon: Clock },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === key
                ? 'text-primary border-primary'
                : 'text-text-secondary hover:text-text-primary border-transparent',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'active' && <ActiveAlerts />}
      {tab === 'rules' && <AlertRules />}
      {tab === 'history' && <AlertHistory />}
    </div>
  );
}

function ActiveAlerts() {
  const queryClient = useQueryClient();
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', 'active'],
    queryFn: ({ signal }) => alertsApi.getActive(signal).then((r) => r.data),
    refetchInterval: 15_000,
  });

  const ackMutation = useMutation({
    mutationFn: (id: string) => alertsApi.acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'active'] });
      toast('success', 'Alert acknowledged');
    },
  });

  const severityIcon: Record<string, React.ReactNode> = {
    critical: <AlertCircle className="w-5 h-5 text-status-critical" />,
    warning: <AlertTriangle className="w-5 h-5 text-status-warning" />,
    info: <Info className="w-5 h-5 text-status-info" />,
  };

  if (isLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass-card p-4 h-20 skeleton" />)}</div>;
  }

  if (alerts.length === 0) {
    return <EmptyState icon={CheckCircle} title="All Clear" description="No active alerts. All servers are operating normally." />;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert: Alert) => (
        <div
          key={alert.id}
          className={cn(
            'glass-card p-4 flex items-center gap-4 border-l-4',
            alert.severity === 'critical' ? 'border-l-status-critical' :
            alert.severity === 'warning' ? 'border-l-status-warning' : 'border-l-status-info',
          )}
        >
          {severityIcon[alert.severity]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">{alert.message}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
              {alert.server && <span>{alert.server.hostname}</span>}
              <span>{formatRelativeTime(alert.triggeredAt)}</span>
              {alert.acknowledgedAt && <span className="text-status-healthy">Acknowledged</span>}
            </div>
          </div>
          {!alert.acknowledgedAt && (
            <button
              onClick={() => ackMutation.mutate(alert.id)}
              disabled={ackMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors whitespace-nowrap"
            >
              Acknowledge
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function AlertRules() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<AlertRule | null>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['alerts', 'rules'],
    queryFn: ({ signal }) => alertsApi.getRules(signal).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      toast('success', 'Rule deleted');
      setDeleteTarget(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      alertsApi.updateRule(id, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="glass-card p-4 h-20 skeleton" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/alerts/rules/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No Alert Rules"
          description="Create alert rules to get notified when server metrics exceed thresholds."
          action={{ label: 'Create Rule', onClick: () => navigate('/alerts/rules/new') }}
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule: AlertRule) => (
            <div key={rule.id} className="glass-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-text-primary">{rule.name}</h4>
                  <StatusBadge status={rule.severity} size="sm" />
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  {rule.metric.toUpperCase()} {rule.condition} {rule.threshold}% for {rule.duration}s
                </p>
                <div className="flex gap-2 mt-1.5">
                  {rule.channels.map((ch) => (
                    <span key={ch} className="px-1.5 py-0.5 text-[10px] font-medium bg-bg-surface-raised rounded text-text-tertiary uppercase">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMutation.mutate({ id: rule.id, isEnabled: !rule.isEnabled })}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                  title={rule.isEnabled ? 'Disable' : 'Enable'}
                >
                  {rule.isEnabled ? (
                    <ToggleRight className="w-6 h-6 text-primary" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={() => navigate(`/alerts/rules/${rule.id}/edit`)}
                  className="px-2.5 py-1 text-xs font-medium text-text-secondary border border-border-default rounded-md hover:text-text-primary hover:bg-bg-surface-raised transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(rule)}
                  className="p-1.5 text-text-tertiary hover:text-status-critical transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Alert Rule"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}

function AlertHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['alerts', 'history'],
    queryFn: ({ signal }) => alertsApi.getHistory(undefined, signal).then((r) => r.data),
  });

  const alerts = data?.data ?? [];

  if (isLoading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="glass-card p-4 h-16 skeleton" />)}</div>;
  }

  if (alerts.length === 0) {
    return <EmptyState icon={Clock} title="No Alert History" description="Past alerts will appear here once resolved." />;
  }

  return (
    <div className="glass-card divide-y divide-border-subtle">
      {alerts.map((alert: Alert) => (
        <div key={alert.id} className="px-4 py-3 flex items-center gap-3">
          <StatusBadge status={alert.severity} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{alert.message}</p>
            <div className="flex gap-3 text-xs text-text-tertiary mt-0.5">
              <span>Triggered: {formatDateTime(alert.triggeredAt)}</span>
              {alert.resolvedAt && <span>Resolved: {formatDateTime(alert.resolvedAt)}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
