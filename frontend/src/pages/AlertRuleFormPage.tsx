import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { alertsApi } from '../lib/api';
import { toast } from '../stores/useToastStore';
import type { AlertRule } from '../types';

export default function AlertRuleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    metric: 'cpu' as AlertRule['metric'],
    condition: 'gt' as AlertRule['condition'],
    threshold: 90,
    duration: 60,
    severity: 'warning' as AlertRule['severity'],
    channels: ['inApp'] as AlertRule['channels'],
    isEnabled: true,
  });

  const { data: existingRule } = useQuery({
    queryKey: ['alerts', 'rules', id],
    queryFn: ({ signal }) => alertsApi.getRules(signal).then((r) => r.data.find((rule) => rule.id === id)),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingRule) {
      setForm({
        name: existingRule.name,
        metric: existingRule.metric,
        condition: existingRule.condition,
        threshold: existingRule.threshold,
        duration: existingRule.duration,
        severity: existingRule.severity,
        channels: existingRule.channels,
        isEnabled: existingRule.isEnabled,
      });
    }
  }, [existingRule]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      isEdit ? alertsApi.updateRule(id!, data) : alertsApi.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rules'] });
      toast('success', isEdit ? 'Rule updated' : 'Rule created');
      navigate('/alerts');
    },
    onError: () => {
      toast('error', 'Failed to save rule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('warning', 'Please enter a rule name');
      return;
    }
    mutation.mutate(form);
  };

  const toggleChannel = (ch: string) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(ch as any)
        ? f.channels.filter((c) => c !== ch)
        : [...f.channels, ch as any],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/alerts')} className="p-2 rounded-lg hover:bg-bg-surface-raised transition-colors text-text-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          {isEdit ? 'Edit Alert Rule' : 'Create Alert Rule'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Rule Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g., High CPU Usage"
            className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Metric + Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Metric</label>
            <select
              value={form.metric}
              onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value as any }))}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="cpu">CPU</option>
              <option value="memory">Memory</option>
              <option value="disk">Disk</option>
              <option value="network">Network</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as any }))}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="gt">Greater than (&gt;)</option>
              <option value="gte">Greater or equal (&ge;)</option>
              <option value="lt">Less than (&lt;)</option>
              <option value="lte">Less or equal (&le;)</option>
              <option value="eq">Equal to (=)</option>
            </select>
          </div>
        </div>

        {/* Threshold + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Threshold (%)</label>
            <input
              type="number"
              value={form.threshold}
              onChange={(e) => setForm((f) => ({ ...f, threshold: Number(e.target.value) }))}
              min={0}
              max={100}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Duration (seconds)</label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
              min={0}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Severity</label>
          <div className="flex gap-2">
            {(['critical', 'warning', 'info'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setForm((f) => ({ ...f, severity: sev }))}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors border ${
                  form.severity === sev
                    ? sev === 'critical' ? 'bg-status-critical/20 text-status-critical border-status-critical/30'
                    : sev === 'warning' ? 'bg-status-warning/20 text-status-warning border-status-warning/30'
                    : 'bg-status-info/20 text-status-info border-status-info/30'
                    : 'bg-bg-surface-raised text-text-secondary border-border-default hover:text-text-primary'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Channels */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Notification Channels</label>
          <div className="flex gap-2">
            {['inApp', 'email', 'webhook'].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors border ${
                  form.channels.includes(ch as any)
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-bg-surface-raised text-text-secondary border-border-default hover:text-text-primary'
                }`}
              >
                {ch === 'inApp' ? 'In-App' : ch}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg bg-bg-surface-raised/50 border border-border-subtle">
          <p className="text-xs text-text-tertiary mb-1">Rule Preview</p>
          <p className="text-sm text-text-primary">
            Alert when <strong>{form.metric.toUpperCase()}</strong> is{' '}
            <strong>{form.condition === 'gt' ? '>' : form.condition === 'lt' ? '<' : form.condition === 'gte' ? '>=' : form.condition === 'lte' ? '<=' : '='}</strong>{' '}
            <strong>{form.threshold}%</strong> for <strong>{form.duration}s</strong>{' '}
            → <span className={form.severity === 'critical' ? 'text-status-critical' : form.severity === 'warning' ? 'text-status-warning' : 'text-status-info'}>{form.severity}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/alerts')}
            className="px-4 py-2.5 text-sm font-medium text-text-secondary bg-bg-surface-raised border border-border-default rounded-lg hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 bg-primary text-bg-root rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </div>
  );
}
