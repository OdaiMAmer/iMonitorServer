import { useState } from 'react';
import { Save, Loader2, Globe, Database, Clock, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from '../stores/useToastStore';

interface GeneralSettings {
  appName: string;
  dataRetention: '7d' | '30d' | '90d' | '1y';
  heartbeatTimeout: number;
  defaultView: 'grid' | 'list';
  timezone: string;
}

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

export default function SettingsGeneralPage() {
  const [form, setForm] = useState<GeneralSettings>({
    appName: 'iMonitorServer',
    dataRetention: '30d',
    heartbeatTimeout: 120,
    defaultView: 'grid',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast('success', 'Settings saved');
  };

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
              value={form.appName}
              onChange={(e) => setForm(f => ({ ...f, appName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-text-tertiary mt-1">Displayed in the sidebar and browser title</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1.5">
                <Database className="w-4 h-4" />
                Data Retention
              </label>
              <select
                value={form.dataRetention}
                onChange={(e) => setForm(f => ({ ...f, dataRetention: e.target.value as GeneralSettings['dataRetention'] }))}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="1y">1 Year</option>
              </select>
              <p className="text-xs text-text-tertiary mt-1">How long to keep metrics history</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1.5">
                <Clock className="w-4 h-4" />
                Heartbeat Timeout (sec)
              </label>
              <input
                type="number"
                value={form.heartbeatTimeout}
                onChange={(e) => setForm(f => ({ ...f, heartbeatTimeout: Number(e.target.value) }))}
                min={30}
                max={600}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-text-tertiary mt-1">Mark server offline after this many seconds without heartbeat</p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1.5">
              <LayoutGrid className="w-4 h-4" />
              Default Dashboard View
            </label>
            <div className="flex gap-2">
              {(['grid', 'list'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, defaultView: v }))}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors border',
                    form.defaultView === v
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'bg-bg-surface-raised text-text-secondary border-border-default hover:text-text-primary',
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
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
