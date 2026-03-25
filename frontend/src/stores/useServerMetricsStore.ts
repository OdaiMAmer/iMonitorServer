import { create } from 'zustand';
import type { ServerMetrics, ServerStatus } from '../types';

interface ServerMetricsState {
  metrics: Map<string, ServerMetrics>;
  serverStatuses: Map<string, ServerStatus>;
  updateMetrics: (serverId: string, metrics: ServerMetrics) => void;
  updateStatus: (serverId: string, status: ServerStatus) => void;
  getMetrics: (serverId: string) => ServerMetrics | undefined;
  getStatus: (serverId: string) => ServerStatus | undefined;
  clear: () => void;
}

export const useServerMetricsStore = create<ServerMetricsState>((set, get) => ({
  metrics: new Map(),
  serverStatuses: new Map(),
  updateMetrics: (serverId, metricsData) =>
    set((state) => {
      const newMetrics = new Map(state.metrics);
      newMetrics.set(serverId, metricsData);
      return { metrics: newMetrics };
    }),
  updateStatus: (serverId, status) =>
    set((state) => {
      const newStatuses = new Map(state.serverStatuses);
      newStatuses.set(serverId, status);
      return { serverStatuses: newStatuses };
    }),
  getMetrics: (serverId) => get().metrics.get(serverId),
  getStatus: (serverId) => get().serverStatuses.get(serverId),
  clear: () => set({ metrics: new Map(), serverStatuses: new Map() }),
}));
