import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all dependencies before importing component
vi.mock('../lib/api', () => ({
  serversApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
  },
  dashboardApi: {
    getStats: vi.fn().mockResolvedValue({
      data: {
        totalServers: 10,
        healthyCount: 7,
        warningCount: 2,
        criticalCount: 1,
        offlineCount: 0,
      },
    }),
  },
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

vi.mock('../stores/useToastStore', () => ({
  toast: vi.fn(),
}));

import DashboardPage from '../pages/DashboardPage';

function renderDashboardPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Dashboard heading', () => {
    renderDashboardPage();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render the overview subtitle', () => {
    renderDashboardPage();

    expect(screen.getByText('Overview of all monitored servers')).toBeInTheDocument();
  });

  it('should render metric card titles', () => {
    renderDashboardPage();

    expect(screen.getByText('Total Servers')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('should render the search input', () => {
    renderDashboardPage();

    expect(screen.getByPlaceholderText('Search by hostname or IP...')).toBeInTheDocument();
  });

  it('should render status filter buttons', () => {
    renderDashboardPage();

    expect(screen.getByText('all')).toBeInTheDocument();
    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('should render view mode toggle buttons (grid/list)', () => {
    renderDashboardPage();

    // There are buttons for grid and list view - we check by counting non-filter buttons
    const allButtons = screen.getAllByRole('button');
    // Filter buttons (5: all, healthy, warning, critical, offline) + 2 view mode buttons = 7+
    expect(allButtons.length).toBeGreaterThanOrEqual(7);
  });

  it('should display initial metric values of 0 before data loads', () => {
    renderDashboardPage();

    // Before data loads, values should default to 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });
});
