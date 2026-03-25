import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Settings, ChevronLeft, ChevronRight,
  Monitor, FolderOpen,
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useActiveAlertsStore } from '../../stores/useActiveAlertsStore';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/groups', icon: FolderOpen, label: 'Server Groups' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Settings', minRole: 'admin' as const },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const alertCount = useActiveAlertsStore((s) => s.alerts.filter((a) => !a.acknowledgedAt).length);
  const location = useLocation();

  const roleLevel: Record<string, number> = { viewer: 0, operator: 1, admin: 2 };
  const userLevel = roleLevel[user?.role ?? 'viewer'] ?? 0;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-bg-sidebar border-r border-border-default z-30 flex flex-col transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-border-default flex-shrink-0">
        <Monitor className="w-7 h-7 text-primary flex-shrink-0" />
        {!sidebarCollapsed && (
          <span className="ml-3 text-lg font-bold text-text-primary tracking-tight">
            iMonitor<span className="text-primary">Server</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.minRole || userLevel >= (roleLevel[item.minRole] ?? 0))
          .map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-raised/50',
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {item.label === 'Alerts' && alertCount > 0 && (
                  <span className={cn(
                    'flex items-center justify-center rounded-full bg-status-critical text-white text-[10px] font-bold',
                    sidebarCollapsed ? 'absolute -top-1 -right-1 w-4 h-4' : 'ml-auto w-5 h-5',
                  )}>
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-bg-surface border border-border-default rounded-md text-xs text-text-primary whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-lg z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-border-default flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full py-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-surface-raised/50 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
