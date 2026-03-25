import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Server, Pencil, Trash2, FolderOpen, Search,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../stores/useToastStore';

interface ServerGroup {
  id: string;
  name: string;
  description: string;
  serverCount: number;
  color: string;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
}

const mockGroups: ServerGroup[] = [
  { id: '1', name: 'Production', description: 'Production environment servers', serverCount: 12, color: '#EF4444', healthyCount: 9, warningCount: 2, criticalCount: 1 },
  { id: '2', name: 'Staging', description: 'Staging and QA environment', serverCount: 6, color: '#F59E0B', healthyCount: 5, warningCount: 1, criticalCount: 0 },
  { id: '3', name: 'Development', description: 'Development servers', serverCount: 4, color: '#22C55E', healthyCount: 4, warningCount: 0, criticalCount: 0 },
  { id: '4', name: 'Database Cluster', description: 'PostgreSQL and Redis nodes', serverCount: 3, color: '#3B82F6', healthyCount: 3, warningCount: 0, criticalCount: 0 },
  { id: '5', name: 'CDN Edge Nodes', description: 'Content delivery edge servers', serverCount: 8, color: '#8B5CF6', healthyCount: 7, warningCount: 1, criticalCount: 0 },
];

export default function ServerGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ServerGroup[]>(mockGroups);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServerGroup | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', color: '#38BDF8' });

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newGroup.name.trim()) {
      toast('warning', 'Please enter a group name');
      return;
    }
    const created: ServerGroup = {
      id: String(Date.now()),
      name: newGroup.name,
      description: newGroup.description,
      color: newGroup.color,
      serverCount: 0,
      healthyCount: 0,
      warningCount: 0,
      criticalCount: 0,
    };
    setGroups(prev => [...prev, created]);
    setNewGroup({ name: '', description: '', color: '#38BDF8' });
    setShowAdd(false);
    toast('success', 'Group created');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setGroups(prev => prev.filter(g => g.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast('success', 'Group deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Server Groups</h1>
          <p className="text-sm text-text-secondary mt-1">Organize servers into logical groups</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-bg-root rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Group
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          className="glass-card p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Group Name</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup(g => ({ ...g, name: e.target.value }))}
                placeholder="e.g., Production"
                className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newGroup.color}
                  onChange={(e) => setNewGroup(g => ({ ...g, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-border-default cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-text-tertiary">{newGroup.color}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
            <input
              type="text"
              value={newGroup.description}
              onChange={(e) => setNewGroup(g => ({ ...g, description: e.target.value }))}
              placeholder="Brief description of this group..."
              className="w-full px-4 py-2.5 bg-bg-surface-raised border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
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
              Create Group
            </button>
          </div>
        </form>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No groups found"
          description={search ? 'No groups match your search.' : 'Create a group to organize your servers.'}
          action={!search ? { label: 'Create Group', onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(group => (
            <div key={group.id} className="glass-card p-5 transition-all hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                  <h3 className="text-sm font-semibold text-text-primary">{group.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(group)}
                    className="p-1.5 text-text-tertiary hover:text-status-critical transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-text-tertiary mb-4">{group.description}</p>

              <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                <Server className="w-4 h-4 text-primary" />
                <span>{group.serverCount} servers</span>
              </div>

              <div className="flex gap-2 text-[10px] font-medium">
                {group.healthyCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-status-healthy/10 text-status-healthy">
                    {group.healthyCount} healthy
                  </span>
                )}
                {group.warningCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-status-warning/10 text-status-warning">
                    {group.warningCount} warning
                  </span>
                )}
                {group.criticalCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-status-critical/10 text-status-critical">
                    {group.criticalCount} critical
                  </span>
                )}
              </div>

              <button
                onClick={() => navigate(`/?group=${group.id}`)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-text-secondary border border-border-default rounded-lg hover:text-text-primary hover:bg-bg-surface-raised transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                View Servers
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Group"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Servers in this group will be ungrouped.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
