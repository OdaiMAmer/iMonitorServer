import { create } from 'zustand';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

interface SocketState {
  connectionStatus: ConnectionStatus;
  lastHeartbeat: string | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastHeartbeat: (timestamp: string) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  connectionStatus: 'disconnected',
  lastHeartbeat: null,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setLastHeartbeat: (lastHeartbeat) => set({ lastHeartbeat }),
}));
