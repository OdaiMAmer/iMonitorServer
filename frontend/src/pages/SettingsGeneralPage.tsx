import { useState, useEffect } from 'react';
import { Save, Loader2, Globe, Database, Clock, LayoutGrid } from 'lucide-react';

import { toast } from '../stores/useToastStore';
import { settingsApi } from '../lib/api';
import type { GeneralSettings } from '../types';

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Amman',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const defaultSettings: GeneralSettings = {
  siteName: 'iMonitorServer',
  heartbeatInterval: 30,
  retentionDays: 90,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dashboardRefreshRate: 5,
  language: 'en',
};

export default function SettingsGeneralPage() {
  const [form, setForm] = useState<GeneralSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    settingsApi.getGeneral(controller.signal)
      .then(res => setForm(prev => ({ ...prev, ...res.data })))
      .catch(() => { if (!controller.signal.aborted) toast('error', 'Failed to load settings'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.updateGeneral(form);
      toast('success', 'Settings saved');
    } catch {
      toast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
        <span className="ml-2 text-sm text-text-secondary">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">General Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure application-wide preferences</p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Application Name</label>
            <input
              type="text"
              value={form.siteName}
              onChange={(e) => setForm(f => ({ ...f, siteName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-text-tertiary mt-1">Displayed in the sidebar and browser title</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1.5">
                <Database className="w-4 h-4" />
                Data Retention (days)
              </label>
              <input
                type="number"
                value={form.retentionDays}
                onChange={(e) => setForm(f => ({ ...f, retentionDays: Number(e.target.value) }))}
                min={7}
                max={365}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-text-tertiary mt-1">How long to keep metrics history</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1.5">
                <Clock className="w-4 h-4" />
                Heartbeat Interval (sec)
              </label>
              <input
                type="number"
                value={form.heartbeatInterval}
                onChange={(e) => setForm(f => ({ ...f, heartbeatInterval: Number(e.target.value) }))}
                min={5}
                max={300}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-text-tertiary mt-1">How often agents report back</p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1.5">
              <LayoutGrid className="w-4 h-4" />
              Dashboard Refresh Rate (sec)
            </label>
            <input
              type="number"
              value={form.dashboardRefreshRate}
              onChange={(e) => setForm(f => ({ ...f, dashboardRefreshRate: Number(e.target.value) }))}
              min={1}
              max={60}
              className="w-full max-w-xs px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1.5">
              <Globe className="w-4 h-4" />
              Timezone
            </label>
            <select
              value={form.timezone}
              onChange={(e) => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-primary text-bg-root rounded-lg text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
