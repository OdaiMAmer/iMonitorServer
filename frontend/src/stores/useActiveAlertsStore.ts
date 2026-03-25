import { create } from 'zustand';
import type { Alert } from '../types';

interface ActiveAlertsState {
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (alertId: string) => void;
  acknowledgeAlert: (alertId: string, acknowledgedBy: string) => void;
  getUnreadCount: () => number;
}

export const useActiveAlertsStore = create<ActiveAlertsState>((set, get) => ({
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts] })),
  removeAlert: (alertId) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== alertId) })),
  acknowledgeAlert: (alertId, acknowledgedBy) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? { ...a, acknowledgedAt: new Date().toISOString(), acknowledgedBy }
          : a,
      ),
    })),
  getUnreadCount: () => get().alerts.filter((a) => !a.acknowledgedAt).length,
}));
