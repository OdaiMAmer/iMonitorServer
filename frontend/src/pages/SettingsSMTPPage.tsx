import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertTriangle, Loader2, Save } from 'lucide-react';
import { toast } from '../stores/useToastStore';

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  encryption: 'none' | 'tls' | 'starttls';
}

export default function SettingsSMTPPage() {
  const [config, setConfig] = useState<SMTPConfig>({
    host: 'smtp.idealsolutions.com',
    port: 587,
    username: 'alerts@idealsolutions.com',
    password: '',
    fromAddress: 'alerts@idealsolutions.com',
    fromName: 'iMonitorServer Alerts',
    encryption: 'tls',
  });
  const [testEmail, setTestEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast('success', 'SMTP settings saved');
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast('warning', 'Enter a recipient email');
      return;
    }
    setTestStatus('sending');
    await new Promise(r => setTimeout(r, 1500));
    setTestStatus('success');
    toast('success', 'Test email sent');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  const handleField = (key: keyof SMTPConfig, value: string | number) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">SMTP Configuration</h1>
        <p className="text-sm text-text-secondary mt-1">Configure email delivery for alert notifications</p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Mail Server Settings</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">SMTP Host</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => handleField('host', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Port</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => handleField('port', Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Encryption</label>
            <select
              value={config.encryption}
              onChange={(e) => handleField('encryption', e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="none">None</option>
              <option value="tls">TLS</option>
              <option value="starttls">STARTTLS</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => handleField('username', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => handleField('password', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">From Address</label>
              <input
                type="email"
                value={config.fromAddress}
                onChange={(e) => handleField('fromAddress', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">From Name</label>
              <input
                type="text"
                value={config.fromName}
                onChange={(e) => handleField('fromName', e.target.value)}
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-bg-root rounded-lg text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Send Test Email</h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={handleTest}
              disabled={!testEmail || testStatus === 'sending'}
              className="px-4 py-2.5 bg-bg-surface-raised border border-border-default text-text-primary rounded-lg text-sm font-medium hover:bg-bg-surface-raised/80 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {testStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Test
            </button>
          </div>
          {testStatus === 'success' && (
            <div className="flex items-center gap-2 mt-3 text-sm text-status-healthy">
              <CheckCircle className="w-4 h-4" />
              Test email sent successfully
            </div>
          )}
          {testStatus === 'error' && (
            <div className="flex items-center gap-2 mt-3 text-sm text-status-critical">
              <AlertTriangle className="w-4 h-4" />
              Failed to send test email
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
