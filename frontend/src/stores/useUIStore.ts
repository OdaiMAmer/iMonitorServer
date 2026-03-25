import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  dashboardViewMode: 'grid' | 'list';
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDashboardViewMode: (mode: 'grid' | 'list') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      dashboardViewMode: 'grid',
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) =>
        set({ sidebarCollapsed }),
      setDashboardViewMode: (dashboardViewMode) =>
        set({ dashboardViewMode }),
    }),
    {
      name: 'imonitor-ui',
    },
  ),
);
