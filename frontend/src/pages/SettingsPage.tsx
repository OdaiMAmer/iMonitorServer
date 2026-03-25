import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Mail, Webhook, Settings, Loader2, Plus, Trash2,
  Send, Save,
} from 'lucide-react';
import { usersApi, settingsApi } from '../lib/api';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from '../stores/useToastStore';
import { cn, formatDateTime } from '../lib/utils';
import type { User, SmtpSettings, GeneralSettings } from '../types';

type Tab = 'users' | 'smtp' | 'webhooks' | 'general';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('users');

  const tabItems: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'smtp', label: 'SMTP', icon: Mail },
    { key: 'webhooks', label: 'Webhooks', icon: Webhook },
    { key: 'general', label: 'General', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage application configuration</p>
      </div>

      <div className="flex gap-1 border-b border-border-default">
        {tabItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === key ? 'text-primary border-primary' : 'text-text-secondary hover:text-text-primary border-transparent',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'smtp' && <SmtpTab />}
      {tab === 'webhooks' && <WebhooksTab />}
      {tab === 'general' && <GeneralTab />}
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'viewer' as User['role'] });
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: ({ signal }) => usersApi.list(signal).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newUser) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('success', 'User created');
      setShowAdd(false);
      setNewUser({ name: '', email: '', password: '', role: 'viewer' });
    },
    onError: () => toast('error', 'Failed to create user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('success', 'User deactivated');
      setDeleteTarget(null);
    },
  });

  const roleColors: Record<string, string> = {
    admin: 'bg-status-maintenance/10 text-status-maintenance border-status-maintenance/20',
    operator: 'bg-status-info/10 text-status-info border-status-info/20',
    viewer: 'bg-bg-surface-raised text-text-secondary border-border-default',
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role', header: 'Role', sortable: true,
      render: (u: User) => (
        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border capitalize', roleColors[u.role] ?? '')}>
          {u.role}
        </span>
      ),
    },
    {
      key: 'lastLogin', header: 'Last Login',
      render: (u: User) => <span className="text-text-tertiary">{u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}</span>,
    },
    {
      key: 'isActive', header: 'Status',
      render: (u: User) => <StatusBadge status={u.isActive ? 'healthy' : 'offline'} label={u.isActive ? 'Active' : 'Inactive'} size="sm" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newUser); }}
          className="glass-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            type="text" placeholder="Full Name" value={newUser.name}
            onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
            className="px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="email" placeholder="Email" value={newUser.email}
            onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
            className="px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="password" placeholder="Temporary Password" value={newUser.password}
            onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
            className="px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value as User['role'] }))}
            className="px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="viewer">Viewer</option>
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
          </select>
          <div className="md:col-span-2 flex justify-end gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-text-secondary border border-border-default rounded-lg hover:text-text-primary">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      )}

      <DataTable
        data={users as unknown as Record<string, unknown>[]}
        columns={columns as any}
        searchable
        searchPlaceholder="Search users..."
        actions={(item: any) => (
          <button onClick={() => setDeleteTarget(item as User)} className="p-1.5 text-text-tertiary hover:text-status-critical transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Deactivate User"
        message={`Deactivate "${deleteTarget?.name}"? They will no longer be able to sign in.`}
        confirmLabel="Deactivate"
        destructive
      />
    </div>
  );
}

function SmtpTab() {
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState('');

  const { data: smtp } = useQuery({
    queryKey: ['settings', 'smtp'],
    queryFn: ({ signal }) => settingsApi.getSmtp(signal).then((r) => r.data),
  });

  const [form, setForm] = useState<SmtpSettings>({
    host: '', port: 587, encryption: 'tls', username: '', password: '', fromAddress: '', fromName: '',
  });

  useState(() => {
    if (smtp) setForm(smtp);
  });

  const saveMutation = useMutation({
    mutationFn: (data: SmtpSettings) => settingsApi.updateSmtp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'smtp'] });
      toast('success', 'SMTP settings saved');
    },
    onError: () => toast('error', 'Failed to save SMTP settings'),
  });

  const testMutation = useMutation({
    mutationFn: (recipient: string) => settingsApi.testSmtp(recipient),
    onSuccess: () => toast('success', 'Test email sent'),
    onError: () => toast('error', 'Failed to send test email'),
  });

  const handleField = (key: keyof SmtpSettings, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="max-w-2xl space-y-6">
      <form
        onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
        className="glass-card p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">SMTP Host</label>
            <input type="text" value={form.host} onChange={(e) => handleField('host', e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Port</label>
            <input type="number" value={form.port} onChange={(e) => handleField('port', Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Encryption</label>
          <select value={form.encryption} onChange={(e) => handleField('encryption', e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50">
            <option value="none">None</option>
            <option value="tls">TLS</option>
            <option value="starttls">STARTTLS</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
            <input type="text" value={form.username} onChange={(e) => handleField('username', e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={(e) => handleField('password', e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">From Address</label>
            <input type="email" value={form.fromAddress} onChange={(e) => handleField('fromAddress', e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">From Name</label>
            <input type="text" value={form.fromName} onChange={(e) => handleField('fromName', e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saveMutation.isPending}
            className="px-5 py-2.5 bg-primary text-bg-root rounded-lg text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>

      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Send Test Email</h3>
        <div className="flex gap-3">
          <input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="recipient@example.com"
            className="flex-1 px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <button onClick={() => testMutation.mutate(testEmail)} disabled={!testEmail || testMutation.isPending}
            className="px-4 py-2.5 bg-bg-surface-raised border border-border-default text-text-primary rounded-lg text-sm font-medium hover:bg-bg-surface-raised/80 disabled:opacity-50 flex items-center gap-2">
            {testMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Test
          </button>
        </div>
      </div>
    </div>
  );
}

function WebhooksTab() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: '', label: '', events: ['alert:triggered'] });

  const { data: webhooks = [] } = useQuery({
    queryKey: ['settings', 'webhooks'],
    queryFn: ({ signal }) => settingsApi.getWebhooks(signal).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => settingsApi.createWebhook(newWebhook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'webhooks'] });
      toast('success', 'Webhook created');
      setShowAdd(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsApi.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'webhooks'] });
      toast('success', 'Webhook deleted');
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => settingsApi.testWebhook(id),
    onSuccess: () => toast('success', 'Webhook test sent'),
    onError: () => toast('error', 'Webhook test failed'),
  });

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover">
          <Plus className="w-4 h-4" /> Add Webhook
        </button>
      </div>

      {showAdd && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="glass-card p-5 space-y-4">
          <input type="url" placeholder="https://hooks.example.com/..." value={newWebhook.url}
            onChange={(e) => setNewWebhook((w) => ({ ...w, url: e.target.value }))}
            className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <input type="text" placeholder="Label (e.g., Slack Alerts)" value={newWebhook.label}
            onChange={(e) => setNewWebhook((w) => ({ ...w, label: e.target.value }))}
            className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-text-secondary border border-border-default rounded-lg">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1 inline" />} Create
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {(webhooks as any[]).map((wh: any) => (
          <div key={wh.id} className="glass-card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-text-primary">{wh.label || 'Unnamed'}</h4>
              <p className="text-xs text-text-tertiary truncate mt-0.5">{wh.url}</p>
            </div>
            <button onClick={() => testMutation.mutate(wh.id)}
              className="px-2.5 py-1 text-xs font-medium text-text-secondary border border-border-default rounded-md hover:text-text-primary">
              Test
            </button>
            <button onClick={() => deleteMutation.mutate(wh.id)}
              className="p-1.5 text-text-tertiary hover:text-status-critical">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneralTab() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: ({ signal }) => settingsApi.getGeneral(signal).then((r) => r.data),
  });

  const [form, setForm] = useState<GeneralSettings>({
    siteName: 'iMonitorServer', heartbeatInterval: 30, retentionDays: 90,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, dashboardRefreshRate: 5, language: 'en',
  });

  useState(() => { if (settings) setForm(settings); });

  const saveMutation = useMutation({
    mutationFn: (data: GeneralSettings) => settingsApi.updateGeneral(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'general'] });
      toast('success', 'Settings saved');
    },
  });

  return (
    <div className="max-w-2xl">
      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="glass-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Site Name</label>
          <input type="text" value={form.siteName} onChange={(e) => setForm((f) => ({ ...f, siteName: e.target.value }))}
            className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Data Retention (days)</label>
            <input type="number" value={form.retentionDays} min={7} max={365} onChange={(e) => setForm((f) => ({ ...f, retentionDays: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Heartbeat Interval (sec)</label>
            <input type="number" value={form.heartbeatInterval} min={5} max={300} onChange={(e) => setForm((f) => ({ ...f, heartbeatInterval: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Dashboard Refresh Rate (sec)</label>
          <input type="number" value={form.dashboardRefreshRate} min={1} max={60} onChange={(e) => setForm((f) => ({ ...f, dashboardRefreshRate: Number(e.target.value) }))}
            className="w-full max-w-xs px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saveMutation.isPending}
            className="px-5 py-2.5 bg-primary text-bg-root rounded-lg text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
