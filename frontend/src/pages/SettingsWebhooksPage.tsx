import { useState, useEffect } from 'react';
import {
  Plus, Webhook, Trash2, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/utils';
import { toast } from '../stores/useToastStore';
import { settingsApi } from '../lib/api';
import type { WebhookConfig } from '../types';

const availableEvents = [
  'server.down', 'server.up', 'cpu.critical', 'cpu.warning',
  'memory.critical', 'memory.warning', 'disk.critical', 'disk.warning',
];

export default function SettingsWebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebhookConfig | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: ['server.down'] as string[] });

  useEffect(() => {
    const controller = new AbortController();
    settingsApi.getWebhooks(controller.signal)
      .then(res => setWebhooks(res.data))
      .catch(() => { if (!controller.signal.aborted) toast('error', 'Failed to load webhooks'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handleCreate = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) {
      toast('warning', 'Please fill in all fields');
      return;
    }
    try {
      const res = await settingsApi.createWebhook(newWebhook);
      setWebhooks(prev => [...prev, res.data]);
      setNewWebhook({ name: '', url: '', events: ['server.down'] });
      setShowAdd(false);
      toast('success', 'Webhook created');
    } catch {
      toast('error', 'Failed to create webhook');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await settingsApi.deleteWebhook(deleteTarget.id);
      setWebhooks(prev => prev.filter(w => w.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('success', 'Webhook deleted');
    } catch {
      toast('error', 'Failed to delete webhook');
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await settingsApi.testWebhook(id);
      toast('success', 'Webhook test sent');
    } catch {
      toast('error', 'Webhook test failed');
    } finally {
      setTesting(null);
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhook(w => ({
      ...w,
      events: w.events.includes(event)
        ? w.events.filter(e => e !== event)
        : [...w.events, event],
    }));
  };

  const toggleEnabled = async (id: string) => {
    const wh = webhooks.find(w => w.id === id);
    if (!wh) return;
    try {
      await settingsApi.updateWebhook(id, { enabled: !wh.enabled } as any);
      setWebhooks(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
    } catch {
      toast('error', 'Failed to update webhook');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
        <span className="ml-2 text-sm text-text-secondary">Loading webhooks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Webhooks</h1>
          <p className="text-sm text-text-secondary mt-1">Configure outgoing webhooks for event notifications</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          className="glass-card p-5 space-y-4 max-w-2xl"
        >
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Name</label>
            <input
              type="text"
              value={newWebhook.name}
              onChange={(e) => setNewWebhook(w => ({ ...w, name: e.target.value }))}
              placeholder="e.g., Slack Alerts"
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">URL</label>
            <input
              type="url"
              value={newWebhook.url}
              onChange={(e) => setNewWebhook(w => ({ ...w, url: e.target.value }))}
              placeholder="https://hooks.example.com/..."
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Events</label>
            <div className="flex flex-wrap gap-2">
              {availableEvents.map(event => (
                <button
                  key={event}
                  type="button"
                  onClick={() => toggleEvent(event)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                    newWebhook.events.includes(event)
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'bg-bg-surface-raised text-text-tertiary border-border-default hover:text-text-secondary',
                  )}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-text-secondary border border-border-default rounded-lg hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Create Webhook
            </button>
          </div>
        </form>
      )}

      {webhooks.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="No webhooks configured"
          description="Add a webhook to receive event notifications in external services."
          action={{ label: 'Add Webhook', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <div className="space-y-3 max-w-2xl">
          {webhooks.map(wh => (
            <div key={wh.id} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Webhook className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-medium text-text-primary">{wh.name}</h4>
                      {wh.enabled ? (
                        <CheckCircle className="w-3.5 h-3.5 text-status-healthy" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-status-critical" />
                      )}
                      {!wh.enabled && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-bg-surface-raised text-text-tertiary rounded">
                          DISABLED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary font-mono truncate">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(wh.events || []).map(ev => (
                        <span key={ev} className="px-1.5 py-0.5 bg-bg-surface-raised rounded text-[10px] text-text-tertiary">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => toggleEnabled(wh.id)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium border rounded-md transition-colors',
                      wh.enabled
                        ? 'text-status-healthy border-status-healthy/30 hover:bg-status-healthy/10'
                        : 'text-text-tertiary border-border-default hover:bg-bg-surface-raised',
                    )}
                  >
                    {wh.enabled ? 'On' : 'Off'}
                  </button>
                  <button
                    onClick={() => handleTest(wh.id)}
                    disabled={testing === wh.id}
                    className="px-2.5 py-1 text-xs font-medium text-text-secondary border border-border-default rounded-md hover:text-text-primary hover:bg-bg-surface-raised disabled:opacity-50 transition-colors"
                  >
                    {testing === wh.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(wh)}
                    className="p-1.5 text-text-tertiary hover:text-status-critical transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Webhook"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
