import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Server, Pencil, Trash2, FolderOpen, Search, Loader2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../stores/useToastStore';
import { groupsApi } from '../lib/api';
import type { ServerGroup } from '../types';

export default function ServerGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServerGroup | null>(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', color: '#38BDF8' });

  useEffect(() => {
    const controller = new AbortController();
    groupsApi.list(controller.signal)
      .then(res => setGroups(res.data))
      .catch(() => { if (!controller.signal.aborted) toast('error', 'Failed to load groups'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newGroup.name.trim()) {
      toast('warning', 'Please enter a group name');
      return;
    }
    try {
      const res = await groupsApi.create(newGroup);
      setGroups(prev => [...prev, res.data]);
      setNewGroup({ name: '', description: '', color: '#38BDF8' });
      setShowAdd(false);
      toast('success', 'Group created');
    } catch {
      toast('error', 'Failed to create group');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await groupsApi.delete(deleteTarget.id);
      setGroups(prev => prev.filter(g => g.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('success', 'Group deleted');
    } catch {
      toast('error', 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
        <span className="ml-2 text-sm text-text-secondary">Loading groups...</span>
      </div>
    );
  }

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
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group.color || '#38BDF8' }} />
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
                <span>{group.serverIds?.length || 0} servers</span>
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
