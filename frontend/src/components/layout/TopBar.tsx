import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useActiveAlertsStore } from '../../stores/useActiveAlertsStore';
import { useUIStore } from '../../stores/useUIStore';

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const alertCount = useActiveAlertsStore((s) => s.alerts.filter((a) => !a.acknowledgedAt).length);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center h-14 px-4 md:px-6 bg-bg-root/80 backdrop-blur-md border-b border-border-default"
      style={{
        marginLeft: sidebarCollapsed ? '64px' : '260px',
        transition: 'margin-left 0.2s ease-in-out',
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search servers... (Ctrl+K)"
            className="w-full pl-10 pr-4 py-1.5 bg-bg-surface border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        {/* Alerts Bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-raised/50 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-status-critical text-white text-[10px] font-bold min-w-[18px] px-1">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-surface-raised/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-text-primary">{user?.name || 'User'}</p>
              <p className="text-xs text-text-tertiary capitalize">{user?.role || 'viewer'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-text-tertiary hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg-surface border border-border-default rounded-lg shadow-xl py-1 animate-fade-in">
              <div className="px-3 py-2 border-b border-border-default">
                <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-tertiary">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-status-critical hover:bg-bg-surface-raised/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
