import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Capture the mock state so we can change it per test
let mockIsAuthenticated = false;
let mockUser: { role: string } | null = null;

vi.mock('../stores/useAuthStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      isAuthenticated: mockIsAuthenticated,
      user: mockUser,
      accessToken: mockIsAuthenticated ? 'mock-token' : null,
      setAuth: vi.fn(),
      setAccessToken: vi.fn(),
      setUser: vi.fn(),
      logout: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../stores/useUIStore', () => ({
  useUIStore: vi.fn((selector) => {
    const state = {
      dashboardViewMode: 'grid' as const,
      setDashboardViewMode: vi.fn(),
      sidebarCollapsed: false,
      toggleSidebar: vi.fn(),
      setSidebarCollapsed: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../stores/useServerMetricsStore', () => ({
  useServerMetricsStore: vi.fn((selector) => {
    const state = {
      metrics: new Map(),
      serverStatuses: new Map(),
      updateMetrics: vi.fn(),
      updateStatus: vi.fn(),
      getMetrics: vi.fn().mockReturnValue(null),
      getStatus: vi.fn(),
      clear: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../stores/useSocketStore', () => ({
  useSocketStore: vi.fn((selector) => {
    const state = {
      connectionStatus: 'connected',
      lastHeartbeat: null,
      setConnectionStatus: vi.fn(),
      setLastHeartbeat: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../stores/useActiveAlertsStore', () => ({
  useActiveAlertsStore: vi.fn((selector) => {
    const state = {
      alerts: [] as any[],
      addAlert: vi.fn(),
      removeAlert: vi.fn(),
      getAlerts: vi.fn().mockReturnValue([]),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../stores/useToastStore', () => ({
  toast: vi.fn(),
  useToastStore: vi.fn((selector) => {
    const state = {
      toasts: [],
      toast: vi.fn(),
      removeToast: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('../lib/api', () => ({
  authApi: { login: vi.fn(), logout: vi.fn(), me: vi.fn(), refresh: vi.fn() },
  serversApi: { list: vi.fn().mockResolvedValue({ data: [] }) },
  dashboardApi: {
    getStats: vi.fn().mockResolvedValue({
      data: { totalServers: 0, healthyCount: 0, warningCount: 0, criticalCount: 0, offlineCount: 0 },
    }),
  },
  alertsApi: { getActive: vi.fn().mockResolvedValue({ data: [] }), getRules: vi.fn().mockResolvedValue({ data: [] }) },
  groupsApi: { list: vi.fn().mockResolvedValue({ data: [] }) },
  usersApi: { list: vi.fn().mockResolvedValue({ data: [] }) },
  settingsApi: { getGeneral: vi.fn().mockResolvedValue({ data: {} }) },
}));

vi.mock('../lib/socket', () => ({
  getSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  }),
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

import App from '../App';

function renderApp(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    mockUser = null;
  });

  it('should render LoginPage when not authenticated and visiting /login', () => {
    renderApp('/login');

    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('should redirect to /login when not authenticated and visiting /', () => {
    renderApp('/');

    // Should redirect to login page
    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
  });

  it('should redirect to /login when not authenticated and visiting /alerts', () => {
    renderApp('/alerts');

    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
  });

  it('should render Dashboard when authenticated and visiting /', () => {
    mockIsAuthenticated = true;
    mockUser = { role: 'admin' };

    renderApp('/');

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('should redirect from /login to / when already authenticated', () => {
    mockIsAuthenticated = true;
    mockUser = { role: 'admin' };

    renderApp('/login');

    // Should redirect to dashboard
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });
});
