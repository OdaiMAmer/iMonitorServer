import { useState } from 'react';
import { UserPlus, Search, Trash2, Shield, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/utils';
import { toast } from '../stores/useToastStore';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  lastActive: string;
  isActive: boolean;
}

const mockUsers: User[] = [
  { id: '1', name: 'Odai Amer', email: 'odai@idealsolutions.com', role: 'admin', lastActive: '2 min ago', isActive: true },
  { id: '2', name: 'Ahmed Hassan', email: 'ahmed@idealsolutions.com', role: 'operator', lastActive: '1 hour ago', isActive: true },
  { id: '3', name: 'Sara Ali', email: 'sara@idealsolutions.com', role: 'viewer', lastActive: '3 days ago', isActive: false },
  { id: '4', name: 'Mohammed Khalil', email: 'mohammed@idealsolutions.com', role: 'operator', lastActive: '15 min ago', isActive: true },
];

const roleColors: Record<string, string> = {
  admin: 'bg-status-maintenance/10 text-status-maintenance border-status-maintenance/20',
  operator: 'bg-status-info/10 text-status-info border-status-info/20',
  viewer: 'bg-bg-surface-raised text-text-secondary border-border-default',
};

export default function SettingsUsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'viewer' as User['role'] });
  const [saving, setSaving] = useState(false);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast('warning', 'Please fill in all required fields');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    const created: User = {
      id: String(Date.now()),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      lastActive: 'Never',
      isActive: true,
    };
    setUsers(prev => [...prev, created]);
    setNewUser({ name: '', email: '', password: '', role: 'viewer' });
    setShowAdd(false);
    setSaving(false);
    toast('success', 'User created');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast('success', 'User deactivated');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-sm text-text-secondary mt-1">Manage users and their access roles</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          className="glass-card p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            type="text"
            placeholder="Full Name"
            value={newUser.name}
            onChange={(e) => setNewUser(u => ({ ...u, name: e.target.value }))}
            className="px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser(u => ({ ...u, email: e.target.value }))}
            className="px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="password"
            placeholder="Temporary Password"
            value={newUser.password}
            onChange={(e) => setNewUser(u => ({ ...u, password: e.target.value }))}
            className="px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser(u => ({ ...u, role: e.target.value as User['role'] }))}
            className="px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="viewer">Viewer</option>
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
          </select>
          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-text-secondary border border-border-default rounded-lg hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title="No users found" description="No users match your search criteria." />
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">Last Active</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">Status</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-bg-surface-raised/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border capitalize', roleColors[user.role])}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-tertiary">{user.lastActive}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        user.isActive ? 'bg-status-healthy' : 'bg-text-tertiary',
                      )} />
                      <span className="text-sm text-text-secondary">{user.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="p-1.5 text-text-tertiary hover:text-status-critical transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate User"
        message={`Deactivate "${deleteTarget?.name}"? They will no longer be able to sign in.`}
        confirmLabel="Deactivate"
        destructive
      />
    </div>
  );
}
