# iMonitorServer — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive, real-time Windows server monitoring dashboard as a React 18 SPA with dark monitoring theme, live WebSocket metrics, and remote server control capabilities.

**Architecture:** Vite 5 + React 18 + TypeScript 5 SPA with client-side routing (React Router 6). TanStack Query handles server state with Socket.IO providing real-time metric push. Zustand manages client-side UI state. shadcn/ui component library extended with a custom dark monitoring theme (glassmorphism cards, cyan/teal accents). All API communication flows through a typed Axios client with JWT auth and automatic token refresh.

**Tech Stack:** React 18, TypeScript 5, Vite 5, TailwindCSS 3, shadcn/ui (Radix UI), Recharts 2, React Router 6, Socket.IO Client, TanStack Query 5, Zustand, Zod, Lucide React, date-fns, react-hot-toast, Framer Motion

---

## Table of Contents

1. [User Interface Requirements](#1-user-interface-requirements)
2. [Screen/Page Inventory & Navigation Flows](#2-screenpage-inventory--navigation-flows)
3. [Component Library & Design System](#3-component-library--design-system)
4. [Accessibility & Responsiveness](#4-accessibility--responsiveness)
5. [Performance Requirements](#5-performance-requirements)
6. [Browser/Device Compatibility Matrix](#6-browserdevice-compatibility-matrix)
7. [Internationalization Requirements](#7-internationalization-requirements)
8. [State Management Architecture](#8-state-management-architecture)
9. [API Integration Requirements](#9-api-integration-requirements)
10. [Security Requirements](#10-security-requirements)
11. [File Structure](#11-file-structure)
12. [Implementation Tasks](#12-implementation-tasks)

---

## 1. User Interface Requirements

### 1.1 General UI Principles

| Principle | Requirement |
|-----------|-------------|
| **Theme** | Dark-first monitoring aesthetic (deep navy/charcoal base) |
| **Visual Language** | Glassmorphism cards with `backdrop-blur`, subtle gradients, semi-transparent surfaces |
| **Color Semantics** | Cyan/teal = healthy, Amber/yellow = warning, Red = critical, Slate/gray = neutral/inactive |
| **Typography** | Inter (UI) + JetBrains Mono (metrics/code/logs). Font sizes: 12px body min, 14px default, 16px headings |
| **Spacing** | 4px grid system (4, 8, 12, 16, 24, 32, 48, 64) |
| **Animations** | Smooth 200-300ms transitions on metric updates. Framer Motion for page transitions and card hover effects |
| **Density** | Information-dense layout. Monitoring dashboards prioritize data visibility over whitespace |
| **Icons** | Lucide React icon set exclusively. 16px inline, 20px buttons, 24px navigation |

### 1.2 Color Palette (CSS Variables)

```
--background:          222 47% 6%      /* #0B1120 - Deep navy */
--background-secondary: 222 40% 10%    /* #131B2E - Slightly lighter */
--foreground:          210 40% 95%     /* #EDF2F7 - Near white */
--foreground-muted:    215 20% 60%     /* #8B9BB4 - Muted text */

--card:                222 35% 12%     /* #162032 - Card background */
--card-hover:          222 35% 15%     /* #1C2A42 - Card hover */
--card-border:         222 20% 20%     /* #2A3548 - Subtle border */

--primary:             185 70% 50%     /* #26C6DA - Cyan/teal */
--primary-foreground:  222 47% 6%      /* Dark text on primary */
--primary-glow:        185 70% 50% / 0.15  /* Glow effect */

--success:             160 60% 45%     /* #2ECC71 - Healthy green */
--warning:             38 92% 55%      /* #F0A500 - Amber warning */
--destructive:         0 72% 55%       /* #E74C3C - Red critical */

--accent:              220 50% 25%     /* #1E3A5F - Accent backgrounds */
--ring:                185 70% 50%     /* Focus ring matches primary */
--radius:              0.5rem          /* Border radius default */

--glass-bg:            222 35% 12% / 0.7  /* Glassmorphism */
--glass-border:        222 20% 30% / 0.3  /* Glass border */
--glass-blur:          12px                /* Backdrop blur */
```

### 1.3 Page-Specific UI Requirements

#### Login Page
- Centered card on full-screen dark gradient background
- Logo (iMonitorServer) at top with subtle glow animation
- Email + password fields with floating labels
- "Sign In" primary button (full width)
- Error display as inline toast below form
- Optional "Remember me" checkbox
- No sidebar, no navigation — standalone layout

#### Dashboard (Server Overview)
- **Top Stats Bar:** 4 summary cards — Total Servers, Healthy (green), Warning (amber), Critical (red). Each card shows count + percentage
- **Filter Bar:** Search input (hostname/IP), group dropdown filter, status filter (All/Healthy/Warning/Critical), view toggle (Grid/List)
- **Server Grid:** Responsive card grid (auto-fill, min 320px). Each server card contains:
  - Hostname (bold) + IP address (muted)
  - OS version badge
  - 3 circular gauge components: CPU%, RAM%, Disk%
  - Uptime badge (days:hours:minutes)
  - Last heartbeat timestamp (relative: "2s ago")
  - Alert count badge (red if > 0)
  - Status indicator dot (green/amber/red pulse animation)
  - Click navigates to Server Detail
- **Real-time Updates:** Cards animate smoothly when metrics change (number tween, gauge arc animation)

#### Server Detail
- **Header:** Hostname, IP, OS, uptime, status badge, back button
- **Tab Navigation:** Horizontal tabs below header
  - **Overview:** 4 real-time line charts (CPU, RAM, Disk, Network) with time range selector (1h/6h/24h/7d/30d). Mini stat cards for current values
  - **Processes:** Searchable, sortable table — columns: PID, Name, CPU%, Memory (MB), Start Time, Actions (Kill button with confirmation). Pagination (50 per page). Refresh button
  - **Services:** List with status badges (Running=green, Stopped=red, Paused=amber). Start/Stop/Restart action buttons per service. Filter by status dropdown
  - **Event Logs:** Filterable table — columns: Timestamp, Source, Level (Error/Warning/Info icons), Message. Date range picker. Severity filter checkboxes. Search input. Infinite scroll
  - **Network:** Bandwidth in/out area chart. Active connections table (Local Address, Remote Address, State, PID). Open ports list
  - **Hardware:** Static info cards — CPU model, cores, clock speed; RAM total/type; Disk drives list with capacity; Network adapters; OS details
  - **Remote:** Action buttons — Restart Server, Shutdown Server (destructive, requires confirmation dialog with typed hostname), RDP download/launch button. Action history log below

#### Alerts
- **Sub-navigation:** Active Alerts | Alert Rules | Alert History
- **Active Alerts:** List with severity icon (Error/Warning/Info), server name (linked), alert message, triggered timestamp, duration, Acknowledge button. Sortable by severity/time
- **Alert Rules:** Table with: Rule name, Metric (CPU/RAM/Disk/etc), Operator (>, <, ==), Threshold value, Duration (sustained period), Server/Group scope, Notification channels (badges), Enabled toggle. Add/Edit rule modal with form
- **Alert History:** Paginated table with severity, server, message, triggered at, resolved at, acknowledged by. Date range filter

#### Settings
- **Tabbed Layout:**
  - **Users:** Table with username, email, role badge (Admin/Operator/Viewer), created date, last login, status. Add/Edit user modal. Delete with confirmation
  - **SMTP:** Form — Host, Port, Username, Password (masked), From Address, TLS toggle, "Send Test Email" button with inline result
  - **Webhooks:** List of webhook URLs with name, URL, events (multi-select), "Test" button. Add/Edit modal
  - **General:** App name, data retention period (dropdown: 7d/30d/90d/1y), heartbeat interval (seconds input), timezone selector

#### Server Groups
- **Group Cards:** Each card shows group name, server count, aggregate health bar (stacked green/amber/red), description
- **Group Detail:** Click into group shows member servers (same card format as Dashboard) with "Add Server" and "Remove Server" actions
- **Create/Edit Group:** Modal with name, description, color picker, server multi-select
- **Bulk Actions:** Dropdown on group card — Restart All, Check Status, Export Report

---

## 2. Screen/Page Inventory & Navigation Flows

### 2.1 Complete Route Map

| Route | Component | Layout | Auth | Roles |
|-------|-----------|--------|------|-------|
| `/login` | `LoginPage` | Auth (no sidebar) | Public | All |
| `/` | `DashboardPage` | Main (sidebar) | Protected | All |
| `/servers/:serverId` | `ServerDetailPage` | Main | Protected | All |
| `/servers/:serverId/:tab` | `ServerDetailPage` | Main | Protected | All (Remote tab: Admin/Operator) |
| `/alerts` | `AlertsPage` | Main | Protected | All |
| `/alerts/rules` | `AlertRulesPage` | Main | Protected | Admin/Operator |
| `/alerts/history` | `AlertHistoryPage` | Main | Protected | All |
| `/groups` | `ServerGroupsPage` | Main | Protected | All |
| `/groups/:groupId` | `GroupDetailPage` | Main | Protected | All |
| `/settings` | `SettingsPage` | Main | Protected | Admin |
| `/settings/users` | `UsersSettingsPage` | Main | Protected | Admin |
| `/settings/smtp` | `SmtpSettingsPage` | Main | Protected | Admin |
| `/settings/webhooks` | `WebhooksSettingsPage` | Main | Protected | Admin |
| `/settings/general` | `GeneralSettingsPage` | Main | Protected | Admin |
| `*` | `NotFoundPage` | Minimal | Public | All |

### 2.2 Sidebar Navigation Structure

```
┌─────────────────────────┐
│  🖥️ iMonitorServer      │  ← Logo + app name
│                         │
│  📊 Dashboard           │  ← /
│  🔔 Alerts        [3]   │  ← /alerts (badge = active count)
│  📁 Server Groups       │  ← /groups
│                         │
│  ─── MANAGEMENT ───     │
│  ⚙️ Settings            │  ← /settings (Admin only)
│                         │
│  ─── ACCOUNT ───        │
│  👤 Odai (Admin)        │  ← User info
│  🚪 Sign Out            │  ← Logout action
└─────────────────────────┘
```

### 2.3 Navigation Flows

```
Login ──→ Dashboard ──→ Server Detail ──→ [Tab: Overview|Processes|Services|Logs|Network|Hardware|Remote]
  │            │
  │            ├──→ Alerts ──→ Alert Rules (create/edit)
  │            │         └──→ Alert History
  │            │
  │            ├──→ Server Groups ──→ Group Detail
  │            │
  │            └──→ Settings ──→ Users | SMTP | Webhooks | General
  │
  └── (401/token expired) ──→ Login
```

### 2.4 Modal/Dialog Inventory

| Modal | Trigger | Content |
|-------|---------|---------|
| `ConfirmKillProcessDialog` | Kill button on process row | "Kill process {name} (PID: {pid})?" + Confirm/Cancel |
| `ConfirmServerActionDialog` | Restart/Shutdown on Remote tab | Typed hostname confirmation for destructive actions |
| `CreateEditAlertRuleDialog` | Add/Edit on Alert Rules | Full alert rule form |
| `CreateEditUserDialog` | Add/Edit on Users settings | User form with role select |
| `CreateEditGroupDialog` | Add/Edit on Server Groups | Group form with server multi-select |
| `CreateEditWebhookDialog` | Add/Edit on Webhooks settings | Webhook URL + events form |
| `DeleteConfirmDialog` | Any delete action | Generic "Are you sure?" with entity name |
| `AcknowledgeAlertDialog` | Acknowledge on Active Alerts | Optional note + confirm |

---

## 3. Component Library & Design System

### 3.1 shadcn/ui Base Components (to install)

These are installed via `npx shadcn-ui@latest add <component>`:

```
accordion, alert, alert-dialog, avatar, badge, breadcrumb,
button, card, checkbox, command, dialog, dropdown-menu,
form, input, label, pagination, popover, progress,
scroll-area, select, separator, sheet, skeleton, slider,
switch, table, tabs, textarea, toast, toggle, tooltip
```

### 3.2 Custom Components (to build)

#### Data Display
| Component | File | Description |
|-----------|------|-------------|
| `CircularGauge` | `components/gauges/circular-gauge.tsx` | SVG circular progress with animated arc, percentage label, configurable color thresholds (green < 70, amber < 90, red >= 90) |
| `LinearGauge` | `components/gauges/linear-gauge.tsx` | Horizontal bar gauge with gradient fill, used in compact views |
| `MetricCard` | `components/metrics/metric-card.tsx` | Glassmorphism card showing single metric: icon, label, value, trend arrow (up/down), sparkline |
| `StatsBar` | `components/metrics/stats-bar.tsx` | Horizontal row of 4 MetricCards for dashboard summary |
| `HealthBadge` | `components/status/health-badge.tsx` | Colored dot + label (Healthy/Warning/Critical) with pulse animation on Critical |
| `UptimeBadge` | `components/status/uptime-badge.tsx` | Formatted uptime duration (Xd Xh Xm) |
| `RelativeTime` | `components/status/relative-time.tsx` | Auto-updating "X seconds ago" timestamp |
| `SeverityIcon` | `components/status/severity-icon.tsx` | Error (red circle-x) / Warning (amber triangle) / Info (blue info-circle) |

#### Charts (Recharts wrappers)
| Component | File | Description |
|-----------|------|-------------|
| `TimeSeriesChart` | `components/charts/time-series-chart.tsx` | Line/area chart with time X-axis, configurable series, zoom, time range selector. Dark theme styled |
| `BandwidthChart` | `components/charts/bandwidth-chart.tsx` | Dual area chart (in/out) with different colors |
| `HealthDistributionBar` | `components/charts/health-distribution-bar.tsx` | Stacked horizontal bar showing healthy/warning/critical proportions |
| `SparklineChart` | `components/charts/sparkline-chart.tsx` | Tiny inline line chart for MetricCards (no axes, no labels) |

#### Server Components
| Component | File | Description |
|-----------|------|-------------|
| `ServerCard` | `components/servers/server-card.tsx` | Dashboard grid card with hostname, gauges, status, badges |
| `ServerList` | `components/servers/server-list.tsx` | Alternative list/table view of servers |
| `ServerHeader` | `components/servers/server-header.tsx` | Detail page header with server info and actions |
| `ProcessTable` | `components/servers/process-table.tsx` | Searchable/sortable process list with kill action |
| `ServiceList` | `components/servers/service-list.tsx` | Windows service list with start/stop/restart controls |
| `EventLogViewer` | `components/servers/event-log-viewer.tsx` | Filterable event log table with infinite scroll |
| `NetworkPanel` | `components/servers/network-panel.tsx` | Connections table + bandwidth charts combined view |
| `HardwarePanel` | `components/servers/hardware-panel.tsx` | Static hardware specification cards |
| `RemoteControlPanel` | `components/servers/remote-control-panel.tsx` | Action buttons + action history log |

#### Layout Components
| Component | File | Description |
|-----------|------|-------------|
| `AppSidebar` | `components/layout/app-sidebar.tsx` | Collapsible sidebar with nav links, user info, logo |
| `AppHeader` | `components/layout/app-header.tsx` | Top bar with breadcrumbs, search, notification bell, user menu |
| `MainLayout` | `components/layout/main-layout.tsx` | Sidebar + header + content area wrapper |
| `AuthLayout` | `components/layout/auth-layout.tsx` | Centered card layout for login |
| `PageHeader` | `components/layout/page-header.tsx` | Page title + description + action buttons |

#### Alert Components
| Component | File | Description |
|-----------|------|-------------|
| `AlertCard` | `components/alerts/alert-card.tsx` | Single active alert row with severity, details, acknowledge |
| `AlertRuleForm` | `components/alerts/alert-rule-form.tsx` | Form for create/edit alert rule (metric, threshold, channels) |
| `AlertBadge` | `components/alerts/alert-badge.tsx` | Notification count badge for sidebar and server cards |

#### Form Components
| Component | File | Description |
|-----------|------|-------------|
| `SearchInput` | `components/forms/search-input.tsx` | Input with search icon, debounced onChange, clear button |
| `DateRangePicker` | `components/forms/date-range-picker.tsx` | Calendar-based range selector for logs and history |
| `TimeRangeSelector` | `components/forms/time-range-selector.tsx` | Button group: 1h, 6h, 24h, 7d, 30d for chart time ranges |
| `FilterBar` | `components/forms/filter-bar.tsx` | Composable filter row with search, dropdowns, toggles |

### 3.3 Design Tokens (Tailwind Extension)

```typescript
// tailwind.config.ts extensions
{
  extend: {
    colors: {
      // Mapped from CSS variables above
    },
    backdropBlur: {
      glass: '12px',
    },
    boxShadow: {
      glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      glow: '0 0 20px rgba(38, 198, 218, 0.15)',
      'glow-warning': '0 0 20px rgba(240, 165, 0, 0.15)',
      'glow-critical': '0 0 20px rgba(231, 76, 60, 0.15)',
    },
    animation: {
      'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'fade-in': 'fadeIn 0.2s ease-in-out',
      'slide-in': 'slideIn 0.3s ease-out',
      'number-tick': 'numberTick 0.3s ease-out',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
  }
}
```

### 3.4 Glassmorphism Card Utility Classes

```css
.glass-card {
  @apply bg-card/70 backdrop-blur-glass border border-card-border rounded-lg shadow-glass;
}

.glass-card-hover {
  @apply glass-card hover:bg-card-hover hover:shadow-glow transition-all duration-200;
}

.glass-card-status-healthy {
  @apply glass-card border-l-4 border-l-success;
}

.glass-card-status-warning {
  @apply glass-card border-l-4 border-l-warning shadow-glow-warning;
}

.glass-card-status-critical {
  @apply glass-card border-l-4 border-l-destructive shadow-glow-critical;
}
```

---

## 4. Accessibility & Responsiveness

### 4.1 Accessibility Requirements (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| **Color contrast** | All text meets 4.5:1 ratio against dark backgrounds. Use `foreground` (#EDF2F7) on `background` (#0B1120) = 13.2:1 ✓ |
| **Focus indicators** | Visible focus ring (`ring-2 ring-primary ring-offset-2 ring-offset-background`) on all interactive elements |
| **Keyboard navigation** | Full keyboard operability: Tab through all controls, Enter/Space to activate, Escape to close modals |
| **Screen reader** | ARIA labels on gauges (`role="meter"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`), status badges (`aria-live="polite"`), real-time updates (`aria-live="assertive"` for critical alerts) |
| **Reduced motion** | Respect `prefers-reduced-motion`: disable pulse animations, chart transitions, page transitions |
| **Error identification** | Form validation errors linked to inputs via `aria-describedby`, error messages use `role="alert"` |
| **Status announcements** | Server status changes announced via `aria-live` regions |
| **Skip navigation** | "Skip to main content" link at top of layout |
| **Heading hierarchy** | Proper `h1` → `h2` → `h3` nesting per page |

### 4.2 Responsive Breakpoints

| Breakpoint | Width | Layout Adaptation |
|------------|-------|-------------------|
| `sm` | ≥640px | Mobile — Sidebar hidden (hamburger toggle). Single column cards. Tabs become dropdown |
| `md` | ≥768px | Tablet — Sidebar collapsed (icons only). 2-column card grid. Horizontal tabs |
| `lg` | ≥1024px | Desktop — Sidebar expanded. 3-column card grid. Full table widths |
| `xl` | ≥1280px | Wide desktop — 4-column card grid. Side-by-side charts in Server Detail |
| `2xl` | ≥1536px | Ultra-wide — 5+ column card grid. Dashboard metrics sidebar + grid |

### 4.3 Responsive Component Behavior

| Component | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|-----------|-----------------|---------------------|--------------------|
| Sidebar | Hidden, hamburger menu | Collapsed (icons) | Expanded (icons + labels) |
| Server Grid | 1 column | 2 columns | 3-5 columns |
| Server Card | Full width, stacked gauges | Standard layout | Standard layout |
| Detail Tabs | Dropdown select | Scrollable horizontal tabs | Full horizontal tabs |
| Process Table | Card list view | Horizontal scroll table | Full table |
| Charts | Full width, stacked | Full width | Side-by-side (2 per row) |
| Modals/Dialogs | Full screen sheet | Centered dialog (80% width) | Centered dialog (max 600px) |
| Filter Bar | Stacked vertically | Inline, wrapping | Single row |

---

## 5. Performance Requirements

### 5.1 Loading Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **First Contentful Paint (FCP)** | < 1.5s | Lighthouse on 4G throttle |
| **Largest Contentful Paint (LCP)** | < 2.5s | Lighthouse on 4G throttle |
| **Time to Interactive (TTI)** | < 3.5s | Lighthouse on 4G throttle |
| **Total Blocking Time (TBT)** | < 200ms | Lighthouse |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Lighthouse |
| **Initial JS Bundle** | < 200KB gzipped | Vite build analysis |
| **Per-route chunk** | < 50KB gzipped | Code-split per route |

### 5.2 Code Splitting Strategy

```
Entry bundle:     React, React DOM, Router (framework essentials)
Layout chunk:     Sidebar, Header, Layout components
Dashboard chunk:  Dashboard page + ServerCard + gauges
Detail chunk:     ServerDetail + tabs + charts (lazy-loaded per tab)
Alerts chunk:     Alerts pages + AlertRuleForm
Settings chunk:   Settings pages + forms
Groups chunk:     Server Groups pages
Auth chunk:       Login page (separate layout, no sidebar)
```

Implementation: React.lazy() + Suspense with skeleton loading fallbacks per route.

### 5.3 Runtime Performance

| Metric | Target | Strategy |
|--------|--------|----------|
| **WebSocket metric update** | < 16ms render (60fps) | Batch socket events, RAF-throttle state updates |
| **Dashboard with 100 servers** | Smooth scroll | Virtualized grid (react-window) if > 50 servers |
| **Process table with 500 rows** | < 100ms sort/filter | TanStack Table with virtual scrolling |
| **Event log with 10,000 entries** | Smooth infinite scroll | Virtualized list + pagination from API |
| **Chart re-render** | < 50ms | Memoized Recharts components, data windowing |
| **Search/filter debounce** | 300ms | Debounced input with immediate UI feedback (spinner) |

### 5.4 Caching Strategy

| Data Type | Cache Time | Stale Time | Strategy |
|-----------|-----------|------------|----------|
| Server list | 30s | 10s | TanStack Query + WebSocket invalidation |
| Server metrics (current) | No cache | 0s | WebSocket real-time push |
| Server metrics (historical) | 5min | 1min | TanStack Query with time-range key |
| Process list | 10s | 5s | TanStack Query with manual refetch |
| Service list | 30s | 15s | TanStack Query + WebSocket events |
| Event logs | 2min | 30s | TanStack Query infinite query |
| Alert rules | 5min | 1min | TanStack Query |
| User list | 10min | 5min | TanStack Query |
| Settings (SMTP, etc.) | 10min | 5min | TanStack Query |

---

## 6. Browser/Device Compatibility Matrix

### 6.1 Supported Browsers

| Browser | Minimum Version | Support Level |
|---------|----------------|---------------|
| Chrome | 90+ | Full |
| Firefox | 90+ | Full |
| Edge | 90+ | Full |
| Safari | 15+ | Full |
| Safari iOS | 15+ | Functional (responsive) |
| Chrome Android | 90+ | Functional (responsive) |

### 6.2 Required Browser Features

| Feature | Usage | Fallback |
|---------|-------|----------|
| CSS `backdrop-filter` | Glassmorphism cards | Solid background color |
| CSS Container Queries | Responsive components | Media queries |
| WebSocket | Real-time updates | HTTP polling every 5s |
| ResizeObserver | Chart responsiveness | Window resize event |
| IntersectionObserver | Infinite scroll, lazy images | Load all |
| Web Crypto API | Token storage hashing | Plaintext (with warning) |
| Clipboard API | Copy server IP/hostname | Manual selection |

### 6.3 Target Devices

| Device | Screen Size | Priority |
|--------|------------|----------|
| Desktop (primary) | 1920×1080+ | High — primary use case |
| Laptop | 1366×768 | High — common DevOps setup |
| Tablet (landscape) | 1024×768 | Medium — on-call monitoring |
| Tablet (portrait) | 768×1024 | Medium |
| Mobile | 375×812 | Low — emergency access only, read-only focus |

---

## 7. Internationalization Requirements

### 7.1 Scope

| Requirement | Decision |
|-------------|----------|
| **Multi-language support** | Not required at launch (English only) |
| **RTL support** | Not required at launch |
| **Future-proof** | Yes — extract all user-facing strings to constants files for future i18n |

### 7.2 Implementation Strategy

- All user-facing strings organized in `constants/` files grouped by feature
- Date/time formatting via `date-fns` with locale parameter (defaults to `en-US`)
- Number formatting via `Intl.NumberFormat` for metric values (1,234.56 vs 1.234,56)
- All timestamps displayed in the user's configured timezone (from Settings) with UTC option
- Relative time strings ("2 minutes ago") via `date-fns/formatDistanceToNow`

### 7.3 String Organization

```
src/constants/
├── common.ts          // Shared strings: "Cancel", "Save", "Delete", "Confirm"
├── dashboard.ts       // "Total Servers", "Healthy", "Warning", "Critical"
├── server-detail.ts   // Tab labels, metric labels, action labels
├── alerts.ts          // Alert severity labels, rule form labels
├── settings.ts        // Settings form labels, section titles
└── errors.ts          // Error messages, validation messages
```

---

## 8. State Management Architecture

### 8.1 State Layer Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
├─────────────┬─────────────────┬─────────────────────────┤
│  Zustand    │  TanStack Query │   Socket.IO Client      │
│  (UI State) │  (Server State) │   (Real-time Events)    │
├─────────────┴─────────────────┴─────────────────────────┤
│              Axios HTTP Client (API Layer)               │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Zustand Stores

#### `auth-store.ts` — Authentication State
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string>;
  setUser: (user: User) => void;
}
```

#### `ui-store.ts` — UI Preferences
```typescript
interface UIState {
  sidebarCollapsed: boolean;
  dashboardView: 'grid' | 'list';
  dashboardFilters: {
    search: string;
    groupId: string | null;
    status: 'all' | 'healthy' | 'warning' | 'critical';
  };
  serverDetailTab: string;

  toggleSidebar: () => void;
  setDashboardView: (view: 'grid' | 'list') => void;
  setDashboardFilters: (filters: Partial<DashboardFilters>) => void;
  setServerDetailTab: (tab: string) => void;
}
```

#### `socket-store.ts` — WebSocket Connection State
```typescript
interface SocketState {
  connected: boolean;
  reconnecting: boolean;
  lastHeartbeat: Date | null;

  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
}
```

#### `notification-store.ts` — In-App Notifications
```typescript
interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;

  addNotification: (notification: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
}
```

### 8.3 TanStack Query Keys Convention

```typescript
export const queryKeys = {
  servers: {
    all: ['servers'] as const,
    list: (filters: ServerFilters) => ['servers', 'list', filters] as const,
    detail: (id: string) => ['servers', 'detail', id] as const,
    metrics: (id: string, range: TimeRange) => ['servers', 'metrics', id, range] as const,
    processes: (id: string) => ['servers', 'processes', id] as const,
    services: (id: string) => ['servers', 'services', id] as const,
    eventLogs: (id: string, filters: LogFilters) => ['servers', 'eventLogs', id, filters] as const,
    network: (id: string) => ['servers', 'network', id] as const,
    hardware: (id: string) => ['servers', 'hardware', id] as const,
  },
  alerts: {
    active: ['alerts', 'active'] as const,
    rules: ['alerts', 'rules'] as const,
    history: (filters: AlertHistoryFilters) => ['alerts', 'history', filters] as const,
  },
  groups: {
    all: ['groups'] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
  },
  settings: {
    users: ['settings', 'users'] as const,
    smtp: ['settings', 'smtp'] as const,
    webhooks: ['settings', 'webhooks'] as const,
    general: ['settings', 'general'] as const,
  },
} as const;
```

### 8.4 WebSocket Event → Query Invalidation Map

| Socket Event | Action |
|-------------|--------|
| `server:metrics` | Update server in query cache (optimistic) |
| `server:status-changed` | Invalidate `servers.all`, `servers.detail(id)` |
| `server:registered` | Invalidate `servers.all` |
| `server:disconnected` | Invalidate `servers.all`, update status in cache |
| `alert:triggered` | Invalidate `alerts.active`, add notification |
| `alert:resolved` | Invalidate `alerts.active` |
| `process:updated` | Invalidate `servers.processes(id)` |
| `service:status-changed` | Invalidate `servers.services(id)` |
| `eventlog:new` | Prepend to `servers.eventLogs(id)` infinite query |

---

## 9. API Integration Requirements

### 9.1 Axios Client Configuration

```typescript
// lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Attach JWT
// Response interceptor: Auto-refresh on 401, redirect to login on refresh failure
// AbortController integration for all requests via CancellationToken pattern
```

### 9.2 API Endpoints (Frontend Perspective)

#### Authentication
| Method | Endpoint | Request | Response | Used By |
|--------|----------|---------|----------|---------|
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, refreshToken, user }` | LoginPage |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` | Axios interceptor |
| POST | `/auth/logout` | `{ refreshToken }` | `204` | Sidebar logout |
| GET | `/auth/me` | — | `User` | App init |

#### Servers
| Method | Endpoint | Request | Response | Used By |
|--------|----------|---------|----------|---------|
| GET | `/servers` | `?search&groupId&status&page&limit` | `PaginatedResponse<Server>` | DashboardPage |
| GET | `/servers/:id` | — | `ServerDetail` | ServerDetailPage |
| GET | `/servers/:id/metrics` | `?range=1h\|6h\|24h\|7d\|30d` | `TimeSeriesData[]` | Overview tab |
| GET | `/servers/:id/processes` | `?search&sortBy&order&page&limit` | `PaginatedResponse<Process>` | Processes tab |
| POST | `/servers/:id/processes/:pid/kill` | — | `{ success, message }` | ProcessTable |
| GET | `/servers/:id/services` | `?status&search` | `WindowsService[]` | Services tab |
| POST | `/servers/:id/services/:name/action` | `{ action: start\|stop\|restart }` | `{ success, message }` | ServiceList |
| GET | `/servers/:id/event-logs` | `?level&search&from&to&cursor&limit` | `CursorPaginatedResponse<EventLog>` | EventLogs tab |
| GET | `/servers/:id/network` | — | `NetworkInfo` | Network tab |
| GET | `/servers/:id/hardware` | — | `HardwareInfo` | Hardware tab |
| POST | `/servers/:id/remote/restart` | — | `{ success, message }` | RemotePanel |
| POST | `/servers/:id/remote/shutdown` | `{ confirmHostname }` | `{ success, message }` | RemotePanel |
| GET | `/servers/:id/remote/rdp` | — | `Blob (RDP file)` | RemotePanel |

#### Alerts
| Method | Endpoint | Request | Response | Used By |
|--------|----------|---------|----------|---------|
| GET | `/alerts/active` | `?severity&serverId` | `Alert[]` | AlertsPage |
| POST | `/alerts/:id/acknowledge` | `{ note? }` | `Alert` | AlertCard |
| GET | `/alerts/rules` | — | `AlertRule[]` | AlertRulesPage |
| POST | `/alerts/rules` | `AlertRuleInput` | `AlertRule` | AlertRuleForm |
| PUT | `/alerts/rules/:id` | `AlertRuleInput` | `AlertRule` | AlertRuleForm |
| DELETE | `/alerts/rules/:id` | — | `204` | AlertRulesPage |
| PATCH | `/alerts/rules/:id/toggle` | `{ enabled: boolean }` | `AlertRule` | AlertRulesPage |
| GET | `/alerts/history` | `?from&to&severity&serverId&page&limit` | `PaginatedResponse<AlertHistory>` | AlertHistoryPage |

#### Server Groups
| Method | Endpoint | Request | Response | Used By |
|--------|----------|---------|----------|---------|
| GET | `/groups` | — | `ServerGroup[]` | GroupsPage, Dashboard filter |
| POST | `/groups` | `GroupInput` | `ServerGroup` | CreateGroupDialog |
| PUT | `/groups/:id` | `GroupInput` | `ServerGroup` | EditGroupDialog |
| DELETE | `/groups/:id` | — | `204` | GroupsPage |
| POST | `/groups/:id/servers` | `{ serverIds: string[] }` | `ServerGroup` | GroupDetailPage |
| DELETE | `/groups/:id/servers/:serverId` | — | `204` | GroupDetailPage |

#### Settings
| Method | Endpoint | Request | Response | Used By |
|--------|----------|---------|----------|---------|
| GET | `/settings/users` | — | `User[]` | UsersSettings |
| POST | `/settings/users` | `UserInput` | `User` | CreateUserDialog |
| PUT | `/settings/users/:id` | `UserInput` | `User` | EditUserDialog |
| DELETE | `/settings/users/:id` | — | `204` | UsersSettings |
| GET | `/settings/smtp` | — | `SmtpConfig` | SmtpSettings |
| PUT | `/settings/smtp` | `SmtpConfig` | `SmtpConfig` | SmtpSettings |
| POST | `/settings/smtp/test` | `{ recipientEmail }` | `{ success, message }` | SmtpSettings |
| GET | `/settings/webhooks` | — | `Webhook[]` | WebhooksSettings |
| POST | `/settings/webhooks` | `WebhookInput` | `Webhook` | CreateWebhookDialog |
| PUT | `/settings/webhooks/:id` | `WebhookInput` | `Webhook` | EditWebhookDialog |
| DELETE | `/settings/webhooks/:id` | — | `204` | WebhooksSettings |
| POST | `/settings/webhooks/:id/test` | — | `{ success, message }` | WebhooksSettings |
| GET | `/settings/general` | — | `GeneralSettings` | GeneralSettings |
| PUT | `/settings/general` | `GeneralSettings` | `GeneralSettings` | GeneralSettings |

### 9.3 Socket.IO Events (Client-Side)

#### Connection Setup
```typescript
// lib/socket.ts
const socket = io(import.meta.env.VITE_WS_URL || '/', {
  auth: { token: authStore.getState().accessToken },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
});
```

#### Incoming Events (Server → Client)

| Event | Payload | Handler |
|-------|---------|---------|
| `server:metrics` | `{ serverId, cpu, memory, disk, network, timestamp }` | Update dashboard gauges + detail charts |
| `server:status-changed` | `{ serverId, status: 'healthy'\|'warning'\|'critical'\|'offline', reason }` | Update status badge, show toast if critical |
| `server:registered` | `{ server: ServerSummary }` | Add to server list, show toast |
| `server:disconnected` | `{ serverId, lastSeen }` | Mark offline, show toast |
| `alert:triggered` | `{ alert: Alert }` | Add to active alerts, show toast, increment badge |
| `alert:resolved` | `{ alertId, resolvedAt }` | Remove from active, show toast |
| `process:updated` | `{ serverId, processes: Process[] }` | Refresh process table if viewing |
| `service:status-changed` | `{ serverId, serviceName, status }` | Update service list if viewing |
| `eventlog:new` | `{ serverId, entry: EventLogEntry }` | Prepend to event log if viewing |

#### Outgoing Events (Client → Server)

| Event | Payload | Purpose |
|-------|---------|---------|
| `subscribe:server` | `{ serverId }` | Start receiving detailed metrics for a specific server |
| `unsubscribe:server` | `{ serverId }` | Stop receiving detailed metrics when leaving server detail |
| `subscribe:dashboard` | `{}` | Subscribe to summary metrics for all servers |

### 9.4 TypeScript API Types

```typescript
// types/api.ts

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

interface Server {
  id: string;
  hostname: string;
  ipAddress: string;
  osVersion: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  cpu: number;         // percentage 0-100
  memory: number;      // percentage 0-100
  disk: number;        // percentage 0-100
  networkIn: number;   // bytes/sec
  networkOut: number;  // bytes/sec
  uptime: number;      // seconds
  lastHeartbeat: string; // ISO 8601
  alertCount: number;
  groupId: string | null;
  groupName: string | null;
  registeredAt: string;
}

interface ServerDetail extends Server {
  hardware: HardwareInfo;
  agentVersion: string;
}

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;      // MB
  startTime: string;
}

interface WindowsService {
  name: string;
  displayName: string;
  status: 'Running' | 'Stopped' | 'Paused' | 'StartPending' | 'StopPending';
  startType: 'Automatic' | 'Manual' | 'Disabled';
}

interface EventLogEntry {
  id: string;
  timestamp: string;
  source: string;
  level: 'Error' | 'Warning' | 'Information';
  message: string;
  eventId: number;
}

interface NetworkInfo {
  connections: NetworkConnection[];
  interfaces: NetworkInterface[];
  bandwidth: { in: number; out: number; timestamp: string }[];
  openPorts: number[];
}

interface HardwareInfo {
  cpu: { model: string; cores: number; clockSpeed: number };
  ram: { total: number; type: string; speed: number };
  disks: { name: string; capacity: number; used: number; type: string }[];
  networkAdapters: { name: string; speed: string; mac: string }[];
  os: { name: string; version: string; build: string; arch: string };
}

interface Alert {
  id: string;
  serverId: string;
  serverHostname: string;
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

interface AlertRule {
  id: string;
  name: string;
  metric: 'cpu' | 'memory' | 'disk' | 'networkIn' | 'networkOut';
  operator: 'gt' | 'lt' | 'eq';
  threshold: number;
  duration: number;     // seconds sustained
  serverId: string | null;
  groupId: string | null;
  channels: ('inApp' | 'email' | 'webhook')[];
  enabled: boolean;
}

interface ServerGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  serverCount: number;
  healthySummary: { healthy: number; warning: number; critical: number; offline: number };
  servers?: Server[];
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
```

### 9.5 Error Handling Strategy

| HTTP Status | Frontend Behavior |
|-------------|-------------------|
| 400 | Show validation errors inline on form fields (via Zod parse of error response) |
| 401 | Attempt token refresh → retry. If refresh fails → redirect to `/login` |
| 403 | Show "Access Denied" toast. Disable action buttons for unauthorized roles |
| 404 | Show "Not Found" inline message or redirect to 404 page |
| 409 | Show conflict message (e.g., "Server already registered") |
| 422 | Show validation errors from server response |
| 429 | Show "Too many requests" toast with retry countdown |
| 500 | Show "Server error" toast with "Retry" button. Log to console |
| Network Error | Show "Connection lost" banner at top. Auto-retry with exponential backoff |

---

## 10. Security Requirements

### 10.1 Authentication & Authorization

| Requirement | Implementation |
|-------------|----------------|
| **JWT Storage** | `accessToken` in Zustand memory store (NOT localStorage). `refreshToken` in httpOnly cookie (set by backend) or secure memory with short TTL |
| **Token Refresh** | Automatic refresh via Axios interceptor when 401 received. Mutex pattern to prevent concurrent refresh requests |
| **Auth Guard** | `RequireAuth` HOC wraps all protected routes. Checks `isAuthenticated` from auth store. Redirects to `/login` if false |
| **Role Guard** | `RequireRole` HOC checks `user.role` against allowed roles. Shows 403 component if unauthorized |
| **Session Timeout** | Frontend detects 30 minutes of inactivity → show warning dialog → logout after 5 more minutes |
| **Logout Cleanup** | Clear all stores, disconnect Socket.IO, clear TanStack Query cache, redirect to `/login` |

### 10.2 XSS Prevention

| Vector | Prevention |
|--------|------------|
| **User-generated content** | React's default JSX escaping. Never use `dangerouslySetInnerHTML` |
| **Event log messages** | Render as text content only, never as HTML |
| **Server hostnames/IPs** | Validate format before display, escape in URLs |
| **URL parameters** | Validate `serverId`, `groupId` with Zod schemas before API calls |
| **Search inputs** | Sanitize before sending to API. No raw interpolation into queries |

### 10.3 CSRF Prevention

| Requirement | Implementation |
|-------------|----------------|
| **SameSite cookies** | Backend sets `SameSite=Strict` on refresh token cookie |
| **CSRF token** | If using cookie-based auth: include `X-CSRF-Token` header from meta tag |
| **Custom headers** | All API requests include `X-Requested-With: XMLHttpRequest` to prevent simple CORS attacks |

### 10.4 Additional Security

| Requirement | Implementation |
|-------------|----------------|
| **Content Security Policy** | Configure CSP headers via Vite HTML plugin or backend reverse proxy |
| **Subresource Integrity** | Enable SRI for CDN-loaded resources (if any) |
| **Dependency audit** | `npm audit` in CI pipeline, automated Dependabot alerts |
| **Sensitive data** | Never log tokens, passwords, or API keys to console. Strip in production builds |
| **Confirmation dialogs** | All destructive actions (kill process, shutdown server, delete user) require explicit confirmation. Server shutdown requires typing hostname |
| **Rate limit awareness** | Frontend respects 429 responses, shows user-friendly cooldown message |
| **Audit trail display** | Remote actions log shows who did what and when (read-only for non-admins) |

---

## 11. File Structure

```
src/
├── main.tsx                          # App entry point
├── App.tsx                           # Router setup, providers, layouts
├── vite-env.d.ts                     # Vite type declarations
│
├── components/
│   ├── ui/                           # shadcn/ui base components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── ... (all shadcn components)
│   │
│   ├── layout/
│   │   ├── main-layout.tsx           # Sidebar + header + outlet
│   │   ├── auth-layout.tsx           # Centered card for login
│   │   ├── app-sidebar.tsx           # Navigation sidebar
│   │   ├── app-header.tsx            # Top bar with breadcrumbs, notifications
│   │   └── page-header.tsx           # Reusable page title + actions
│   │
│   ├── gauges/
│   │   ├── circular-gauge.tsx        # SVG circular progress
│   │   └── linear-gauge.tsx          # Horizontal bar gauge
│   │
│   ├── metrics/
│   │   ├── metric-card.tsx           # Single metric display card
│   │   └── stats-bar.tsx             # Row of summary stat cards
│   │
│   ├── charts/
│   │   ├── time-series-chart.tsx     # Main line/area chart wrapper
│   │   ├── bandwidth-chart.tsx       # Network in/out dual chart
│   │   ├── health-distribution-bar.tsx
│   │   └── sparkline-chart.tsx       # Tiny inline chart
│   │
│   ├── status/
│   │   ├── health-badge.tsx          # Colored status indicator
│   │   ├── uptime-badge.tsx          # Formatted uptime display
│   │   ├── relative-time.tsx         # Auto-updating "X ago"
│   │   └── severity-icon.tsx         # Error/Warning/Info icon
│   │
│   ├── servers/
│   │   ├── server-card.tsx           # Dashboard grid card
│   │   ├── server-list.tsx           # Table/list view
│   │   ├── server-header.tsx         # Detail page header
│   │   ├── process-table.tsx         # Process list with kill
│   │   ├── service-list.tsx          # Service controls
│   │   ├── event-log-viewer.tsx      # Log table with filters
│   │   ├── network-panel.tsx         # Network info view
│   │   ├── hardware-panel.tsx        # Hardware specs
│   │   └── remote-control-panel.tsx  # Remote actions
│   │
│   ├── alerts/
│   │   ├── alert-card.tsx            # Active alert row
│   │   ├── alert-rule-form.tsx       # Create/edit rule form
│   │   └── alert-badge.tsx           # Notification count
│   │
│   ├── groups/
│   │   ├── group-card.tsx            # Group summary card
│   │   └── group-server-picker.tsx   # Multi-select server assignment
│   │
│   ├── forms/
│   │   ├── search-input.tsx          # Debounced search
│   │   ├── date-range-picker.tsx     # Calendar range selector
│   │   ├── time-range-selector.tsx   # 1h/6h/24h/7d/30d buttons
│   │   └── filter-bar.tsx            # Composable filter row
│   │
│   └── dialogs/
│       ├── confirm-kill-process-dialog.tsx
│       ├── confirm-server-action-dialog.tsx
│       ├── create-edit-alert-rule-dialog.tsx
│       ├── create-edit-user-dialog.tsx
│       ├── create-edit-group-dialog.tsx
│       ├── create-edit-webhook-dialog.tsx
│       ├── delete-confirm-dialog.tsx
│       └── acknowledge-alert-dialog.tsx
│
├── pages/
│   ├── login-page.tsx
│   ├── dashboard-page.tsx
│   ├── server-detail-page.tsx
│   ├── alerts-page.tsx
│   ├── alert-rules-page.tsx
│   ├── alert-history-page.tsx
│   ├── server-groups-page.tsx
│   ├── group-detail-page.tsx
│   ├── settings-page.tsx             # Settings layout with tabs
│   ├── users-settings-page.tsx
│   ├── smtp-settings-page.tsx
│   ├── webhooks-settings-page.tsx
│   ├── general-settings-page.tsx
│   └── not-found-page.tsx
│
├── hooks/
│   ├── use-servers.ts                # TanStack Query hooks for servers
│   ├── use-server-detail.ts          # Single server queries
│   ├── use-server-metrics.ts         # Historical metrics queries
│   ├── use-server-processes.ts       # Process list queries + kill mutation
│   ├── use-server-services.ts        # Service queries + action mutations
│   ├── use-server-event-logs.ts      # Infinite query for event logs
│   ├── use-alerts.ts                 # Alert queries + mutations
│   ├── use-alert-rules.ts            # Alert rule CRUD hooks
│   ├── use-groups.ts                 # Group queries + mutations
│   ├── use-settings.ts               # Settings queries + mutations
│   ├── use-auth.ts                   # Login/logout/refresh hooks
│   ├── use-socket.ts                 # Socket.IO connection + event hooks
│   ├── use-debounce.ts               # Generic debounce hook
│   ├── use-media-query.ts            # Responsive breakpoint hook
│   └── use-confirmation.ts           # Confirmation dialog state hook
│
├── stores/
│   ├── auth-store.ts                 # JWT tokens, user, login/logout
│   ├── ui-store.ts                   # Sidebar, filters, view preferences
│   ├── socket-store.ts               # WebSocket connection state
│   └── notification-store.ts         # In-app notification queue
│
├── lib/
│   ├── api.ts                        # Axios instance + interceptors
│   ├── socket.ts                     # Socket.IO client setup
│   ├── query-client.ts               # TanStack Query client config
│   ├── utils.ts                      # cn(), formatBytes(), formatUptime()
│   └── validators.ts                 # Zod schemas for forms
│
├── types/
│   ├── api.ts                        # All API response/request types
│   ├── server.ts                     # Server, Process, Service, etc.
│   ├── alert.ts                      # Alert, AlertRule types
│   ├── user.ts                       # User, Role types
│   └── socket-events.ts             # Socket.IO event payload types
│
├── constants/
│   ├── common.ts                     # Shared UI strings
│   ├── dashboard.ts                  # Dashboard-specific strings
│   ├── server-detail.ts              # Server detail strings
│   ├── alerts.ts                     # Alert strings
│   ├── settings.ts                   # Settings strings
│   ├── errors.ts                     # Error messages
│   ├── routes.ts                     # Route path constants
│   └── query-keys.ts                # TanStack Query key factory
│
├── guards/
│   ├── require-auth.tsx              # Auth route guard HOC
│   └── require-role.tsx              # Role-based route guard HOC
│
└── styles/
    ├── globals.css                    # Tailwind directives + CSS variables + glass utilities
    └── fonts.css                      # @font-face for Inter + JetBrains Mono
```

### Config Files (project root)

```
├── index.html                        # Vite entry HTML
├── package.json
├── vite.config.ts                    # Vite config with proxy, plugins
├── tsconfig.json                     # TypeScript config
├── tsconfig.node.json                # Node TS config for Vite
├── tailwind.config.ts                # Tailwind with custom theme
├── postcss.config.js                 # PostCSS for Tailwind
├── components.json                   # shadcn/ui config
├── .env.example                      # VITE_API_URL, VITE_WS_URL
├── .eslintrc.cjs                     # ESLint config
├── .prettierrc                       # Prettier config
└── vitest.config.ts                  # Test config
```

---

## 12. Implementation Tasks

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `components.json`, `index.html`, `.env.example`, `.eslintrc.cjs`, `.prettierrc`, `vitest.config.ts`
- Create: `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`
- Create: `src/styles/globals.css`, `src/styles/fonts.css`

- [ ] **Step 1: Initialize Vite project**

```bash
npm create vite@latest imonitor-frontend -- --template react-ts
cd imonitor-frontend
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install react-router-dom@6 @tanstack/react-query@5 @tanstack/react-table zustand socket.io-client axios recharts date-fns zod react-hook-form @hookform/resolvers lucide-react react-hot-toast framer-motion react-window @types/react-window
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D tailwindcss@3 postcss autoprefixer @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
npx tailwindcss init -p --ts
```

- [ ] **Step 4: Configure Tailwind with custom dark monitoring theme**

Write `tailwind.config.ts` with the full color palette, glassmorphism utilities, custom animations, and font families defined in Section 3.3.

- [ ] **Step 5: Write globals.css with CSS variables and glass utility classes**

Write `src/styles/globals.css` with all CSS variables from Section 1.2, Tailwind directives, and glass-card utility classes from Section 3.4.

- [ ] **Step 6: Configure Vite with API proxy and path aliases**

Write `vite.config.ts` with:
- `@/` path alias to `./src`
- Proxy `/api` → `http://localhost:3000`
- Proxy `/socket.io` → `ws://localhost:3000`

- [ ] **Step 7: Initialize shadcn/ui**

```bash
npx shadcn-ui@latest init
```

Configure with: TypeScript, Tailwind, `src/components/ui`, `@/components/ui` alias, slate base color, CSS variables enabled.

- [ ] **Step 8: Install essential shadcn/ui components**

```bash
npx shadcn-ui@latest add button card dialog dropdown-menu form input label select separator tabs table toast badge avatar scroll-area skeleton switch popover command checkbox textarea alert alert-dialog progress pagination toggle tooltip sheet breadcrumb
```

- [ ] **Step 9: Write .env.example**

```
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

- [ ] **Step 10: Create basic App.tsx with router skeleton and main.tsx entry**

Minimal `App.tsx` with `BrowserRouter`, `QueryClientProvider`, `Toaster`, and a single `"/"` route rendering "Hello iMonitorServer".

- [ ] **Step 11: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server on http://localhost:5173, renders "Hello iMonitorServer" on dark background.

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "feat: scaffold iMonitorServer frontend with Vite, React 18, Tailwind, shadcn/ui"
```

---

### Task 2: Type Definitions & Constants

**Files:**
- Create: `src/types/api.ts`, `src/types/server.ts`, `src/types/alert.ts`, `src/types/user.ts`, `src/types/socket-events.ts`
- Create: `src/constants/routes.ts`, `src/constants/query-keys.ts`, `src/constants/common.ts`, `src/constants/errors.ts`

- [ ] **Step 1: Write server domain types**

Create `src/types/server.ts` with all types from Section 9.4: `Server`, `ServerDetail`, `Process`, `WindowsService`, `EventLogEntry`, `NetworkInfo`, `NetworkConnection`, `NetworkInterface`, `HardwareInfo`, `TimeRange`.

- [ ] **Step 2: Write alert domain types**

Create `src/types/alert.ts` with `Alert`, `AlertRule`, `AlertRuleInput`, `AlertHistoryEntry`.

- [ ] **Step 3: Write user and settings types**

Create `src/types/user.ts` with `User`, `UserInput`, `Role`, `SmtpConfig`, `Webhook`, `WebhookInput`, `GeneralSettings`.

- [ ] **Step 4: Write API response wrapper types**

Create `src/types/api.ts` with `PaginatedResponse<T>`, `CursorPaginatedResponse<T>`, `ApiError`, `LoginRequest`, `LoginResponse`, `RefreshRequest`, `RefreshResponse`.

- [ ] **Step 5: Write Socket.IO event types**

Create `src/types/socket-events.ts` with typed event maps for all incoming and outgoing events from Section 9.3.

- [ ] **Step 6: Write route constants**

Create `src/constants/routes.ts` with all route paths as typed constants and path builder functions: `routes.serverDetail(id)`, `routes.groupDetail(id)`, etc.

- [ ] **Step 7: Write query key factory**

Create `src/constants/query-keys.ts` with the full `queryKeys` object from Section 8.3.

- [ ] **Step 8: Write common and error string constants**

Create `src/constants/common.ts` and `src/constants/errors.ts` with all shared UI strings.

- [ ] **Step 9: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 10: Commit**

```bash
git add src/types/ src/constants/
git commit -m "feat: add TypeScript type definitions and constants for all domains"
```

---

### Task 3: Core Library Layer (API, Socket, Query Client, Utils)

**Files:**
- Create: `src/lib/api.ts`, `src/lib/socket.ts`, `src/lib/query-client.ts`, `src/lib/utils.ts`, `src/lib/validators.ts`

- [ ] **Step 1: Write test for utility functions**

Create `src/lib/__tests__/utils.test.ts` with tests for `cn()`, `formatBytes()`, `formatUptime()`, `getStatusColor()`, `getHealthThreshold()`.

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/utils.test.ts
```

Expected: FAIL — functions not defined.

- [ ] **Step 3: Implement utility functions**

Create `src/lib/utils.ts` with:
- `cn()` — clsx + tailwind-merge
- `formatBytes(bytes: number)` — "1.5 GB", "256 MB"
- `formatUptime(seconds: number)` — "5d 12h 30m"
- `getStatusColor(status)` — returns Tailwind color class
- `getHealthThreshold(value)` — returns 'healthy' | 'warning' | 'critical'

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/utils.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Write Axios API client**

Create `src/lib/api.ts` with the Axios instance from Section 9.1: base URL from env, request interceptor for JWT, response interceptor for token refresh with mutex, AbortController support via `createCancelableRequest()`.

- [ ] **Step 6: Write Socket.IO client**

Create `src/lib/socket.ts` with connection setup from Section 9.3: auth token injection, reconnection config, typed event emitters/listeners, `connectSocket()`, `disconnectSocket()`, `subscribeToServer(id)`, `unsubscribeFromServer(id)`.

- [ ] **Step 7: Write TanStack Query client config**

Create `src/lib/query-client.ts` with default options: retry 2, staleTime 30s, refetchOnWindowFocus true, error handler that shows toast on network errors.

- [ ] **Step 8: Write Zod validation schemas**

Create `src/lib/validators.ts` with Zod schemas for: `loginSchema`, `alertRuleSchema`, `userSchema`, `smtpConfigSchema`, `webhookSchema`, `generalSettingsSchema`, `groupSchema`.

- [ ] **Step 9: Commit**

```bash
git add src/lib/
git commit -m "feat: add API client, Socket.IO client, query config, utils, validators"
```

---

### Task 4: Zustand Stores

**Files:**
- Create: `src/stores/auth-store.ts`, `src/stores/ui-store.ts`, `src/stores/socket-store.ts`, `src/stores/notification-store.ts`
- Test: `src/stores/__tests__/auth-store.test.ts`, `src/stores/__tests__/ui-store.test.ts`, `src/stores/__tests__/notification-store.test.ts`

- [ ] **Step 1: Write test for auth store**

Test `login` (sets tokens + user), `logout` (clears all), `isAuthenticated` computed, `refreshAccessToken`.

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement auth store**

Create `src/stores/auth-store.ts` per Section 8.2 spec. Use `persist` middleware for refreshToken only (if not using httpOnly cookies).

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Write test for UI store**

Test `toggleSidebar`, `setDashboardView`, `setDashboardFilters`.

- [ ] **Step 6: Implement UI store with persist middleware**

Create `src/stores/ui-store.ts` per Section 8.2. Persist `sidebarCollapsed` and `dashboardView` to localStorage.

- [ ] **Step 7: Implement socket store and notification store**

Create `src/stores/socket-store.ts` and `src/stores/notification-store.ts` per Section 8.2.

- [ ] **Step 8: Run all store tests**

```bash
npx vitest run src/stores/
```

Expected: All PASS.

- [ ] **Step 9: Commit**

```bash
git add src/stores/
git commit -m "feat: add Zustand stores for auth, UI, socket, and notifications"
```

---

### Task 5: Auth Guards & Layout Components

**Files:**
- Create: `src/guards/require-auth.tsx`, `src/guards/require-role.tsx`
- Create: `src/components/layout/main-layout.tsx`, `src/components/layout/auth-layout.tsx`, `src/components/layout/app-sidebar.tsx`, `src/components/layout/app-header.tsx`, `src/components/layout/page-header.tsx`

- [ ] **Step 1: Implement RequireAuth guard**

Checks `isAuthenticated` from auth store. If false, redirects to `/login` with `returnUrl` in state.

- [ ] **Step 2: Implement RequireRole guard**

Accepts `allowedRoles: Role[]`. Checks `user.role`. If unauthorized, renders inline 403 message.

- [ ] **Step 3: Implement AuthLayout**

Dark centered layout with glassmorphism card for login page. No sidebar.

- [ ] **Step 4: Implement AppSidebar**

Collapsible sidebar per Section 2.2: logo, nav items with icons, active state, alert badge, user info, logout button. Responsive: hidden on mobile (hamburger), collapsed on tablet, expanded on desktop.

- [ ] **Step 5: Implement AppHeader**

Top bar with: sidebar toggle button, breadcrumbs, notification bell (with badge from notification store), user dropdown menu.

- [ ] **Step 6: Implement MainLayout**

Combines AppSidebar + AppHeader + `<Outlet />`. Uses CSS Grid: sidebar (fixed width / collapsed) + main content area.

- [ ] **Step 7: Implement PageHeader**

Reusable: title (h1), description, optional action buttons slot (right-aligned).

- [ ] **Step 8: Wire layouts into App.tsx router**

Update `App.tsx` with layout routes: `/login` → AuthLayout, `/*` → RequireAuth → MainLayout → child routes.

- [ ] **Step 9: Verify layouts render correctly**

Start dev server, verify sidebar + header render on `/`, login layout on `/login`.

- [ ] **Step 10: Commit**

```bash
git add src/guards/ src/components/layout/ src/App.tsx
git commit -m "feat: add auth guards, main layout with sidebar, and auth layout"
```

---

### Task 6: Reusable Gauge, Status, and Chart Components

**Files:**
- Create: All files in `src/components/gauges/`, `src/components/status/`, `src/components/charts/`, `src/components/metrics/`

- [ ] **Step 1: Write test for CircularGauge**

Test renders SVG, displays percentage, applies correct color based on threshold (green < 70, amber < 90, red ≥ 90), handles 0 and 100 edge cases.

- [ ] **Step 2: Implement CircularGauge**

SVG-based circular progress with animated arc (`stroke-dasharray` transition), center percentage text, configurable size/thresholds. Uses `framer-motion` for value animation.

- [ ] **Step 3: Implement LinearGauge**

Horizontal bar with gradient fill matching threshold colors. Simpler than circular.

- [ ] **Step 4: Implement HealthBadge**

Dot + label. Green pulse on healthy, amber steady on warning, red pulse on critical. Uses `cn()` for conditional classes.

- [ ] **Step 5: Implement UptimeBadge**

Takes `seconds: number`, renders formatted string via `formatUptime()`. Monospace font.

- [ ] **Step 6: Implement RelativeTime**

Takes ISO timestamp, auto-updates every second using `useEffect` + `setInterval`. Renders `date-fns/formatDistanceToNow`.

- [ ] **Step 7: Implement SeverityIcon**

Maps severity to Lucide icon: `XCircle` (red), `AlertTriangle` (amber), `Info` (blue).

- [ ] **Step 8: Implement MetricCard**

Glassmorphism card: icon (left), label + value (center), optional sparkline (right), optional trend arrow.

- [ ] **Step 9: Implement StatsBar**

Row of 4 MetricCards for dashboard summary. Responsive: 2×2 on mobile, 4×1 on desktop.

- [ ] **Step 10: Implement TimeSeriesChart**

Recharts `ResponsiveContainer` + `AreaChart` with dark theme: transparent background, grid with `stroke="#2A3548"`, cyan area fill with gradient, tooltip with glass styling, time X-axis with `date-fns` formatting.

- [ ] **Step 11: Implement BandwidthChart**

Dual area chart with different colors (cyan for in, teal for out).

- [ ] **Step 12: Implement SparklineChart**

Tiny Recharts `LineChart` with no axes, no grid, no tooltip. Just the line.

- [ ] **Step 13: Implement HealthDistributionBar**

Stacked horizontal bar: green + amber + red segments proportional to counts.

- [ ] **Step 14: Run all component tests**

```bash
npx vitest run src/components/
```

- [ ] **Step 15: Commit**

```bash
git add src/components/gauges/ src/components/status/ src/components/charts/ src/components/metrics/
git commit -m "feat: add gauge, status badge, metric card, and chart components"
```

---

### Task 7: Form Components

**Files:**
- Create: `src/components/forms/search-input.tsx`, `src/components/forms/date-range-picker.tsx`, `src/components/forms/time-range-selector.tsx`, `src/components/forms/filter-bar.tsx`

- [ ] **Step 1: Implement SearchInput**

Input with `Search` icon prefix, `X` clear button, 300ms debounced `onChange` via `useDebounce` hook. Placeholder prop.

- [ ] **Step 2: Implement DateRangePicker**

Uses shadcn Popover + Calendar. Returns `{ from: Date, to: Date }`. Presets: Today, Last 7 days, Last 30 days, Custom range.

- [ ] **Step 3: Implement TimeRangeSelector**

Button group: `1h`, `6h`, `24h`, `7d`, `30d`. Controlled component with `value` and `onChange`. Active button highlighted with primary color.

- [ ] **Step 4: Implement FilterBar**

Composable: accepts children (SearchInput, Select filters, TimeRangeSelector). Horizontal flex with gap, wraps on mobile.

- [ ] **Step 5: Implement useDebounce hook**

Generic debounce hook used by SearchInput.

- [ ] **Step 6: Commit**

```bash
git add src/components/forms/ src/hooks/use-debounce.ts
git commit -m "feat: add search input, date range picker, time range selector, filter bar"
```

---

### Task 8: TanStack Query Hooks

**Files:**
- Create: All files in `src/hooks/`: `use-servers.ts`, `use-server-detail.ts`, `use-server-metrics.ts`, `use-server-processes.ts`, `use-server-services.ts`, `use-server-event-logs.ts`, `use-alerts.ts`, `use-alert-rules.ts`, `use-groups.ts`, `use-settings.ts`, `use-auth.ts`

- [ ] **Step 1: Implement useAuth hook**

`useLogin` mutation → calls `/auth/login`, stores tokens in auth store, navigates to dashboard.
`useLogout` mutation → calls `/auth/logout`, clears stores, disconnects socket, redirects to login.
`useCurrentUser` query → calls `/auth/me` on app init.

- [ ] **Step 2: Implement useServers hook**

`useServers(filters)` → GET `/servers` with filters. Returns paginated server list.

- [ ] **Step 3: Implement useServerDetail hook**

`useServerDetail(id)` → GET `/servers/:id`. Enabled when `id` is truthy.

- [ ] **Step 4: Implement useServerMetrics hook**

`useServerMetrics(id, range)` → GET `/servers/:id/metrics?range=`. Stale time varies by range.

- [ ] **Step 5: Implement useServerProcesses hook**

`useServerProcesses(id, filters)` → GET `/servers/:id/processes`.
`useKillProcess` mutation → POST `/servers/:id/processes/:pid/kill`. Invalidates process query. Shows success/error toast.

- [ ] **Step 6: Implement useServerServices hook**

`useServerServices(id)` → GET `/servers/:id/services`.
`useServiceAction` mutation → POST `/servers/:id/services/:name/action`. Shows toast.

- [ ] **Step 7: Implement useServerEventLogs hook**

`useServerEventLogs(id, filters)` → infinite query with cursor-based pagination. GET `/servers/:id/event-logs?cursor=&limit=50`.

- [ ] **Step 8: Implement useAlerts and useAlertRules hooks**

`useActiveAlerts()`, `useAcknowledgeAlert()` mutation, `useAlertRules()`, `useCreateAlertRule()`, `useUpdateAlertRule()`, `useDeleteAlertRule()`, `useToggleAlertRule()`, `useAlertHistory(filters)`.

- [ ] **Step 9: Implement useGroups hook**

`useGroups()`, `useGroupDetail(id)`, `useCreateGroup()`, `useUpdateGroup()`, `useDeleteGroup()`, `useAddServersToGroup()`, `useRemoveServerFromGroup()`.

- [ ] **Step 10: Implement useSettings hook**

`useUsers()`, `useCreateUser()`, `useUpdateUser()`, `useDeleteUser()`, `useSmtpConfig()`, `useUpdateSmtpConfig()`, `useTestSmtp()`, `useWebhooks()`, CRUD + test for webhooks, `useGeneralSettings()`, `useUpdateGeneralSettings()`.

- [ ] **Step 11: Commit**

```bash
git add src/hooks/
git commit -m "feat: add TanStack Query hooks for all API domains"
```

---

### Task 9: Socket.IO Integration Hook

**Files:**
- Create: `src/hooks/use-socket.ts`
- Modify: `src/App.tsx` (add socket provider)

- [ ] **Step 1: Implement useSocket hook**

Initializes Socket.IO connection on mount (when authenticated). Disconnects on unmount/logout. Registers all event handlers from Section 8.4 that invalidate TanStack Query caches and update notification store.

- [ ] **Step 2: Implement useServerSubscription hook**

Called in `ServerDetailPage`. Emits `subscribe:server` on mount, `unsubscribe:server` on unmount. Returns real-time metric stream for the specific server.

- [ ] **Step 3: Wire socket into App.tsx**

Add `useSocket()` call inside authenticated layout wrapper so connection is established after login.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-socket.ts src/App.tsx
git commit -m "feat: add Socket.IO hooks with query invalidation and server subscriptions"
```

---

### Task 10: Login Page

**Files:**
- Create: `src/pages/login-page.tsx`

- [ ] **Step 1: Implement LoginPage**

AuthLayout wrapper. Glassmorphism card with: logo/title, email input, password input, "Remember me" checkbox, "Sign In" button. Uses `react-hook-form` + `zod` for validation. Calls `useLogin` mutation. Shows inline error on failure. Redirects to `returnUrl` or `/` on success. Loading state on button.

- [ ] **Step 2: Add route to App.tsx**

- [ ] **Step 3: Verify login page renders**

- [ ] **Step 4: Commit**

```bash
git add src/pages/login-page.tsx src/App.tsx
git commit -m "feat: add login page with form validation and auth flow"
```

---

### Task 11: Dashboard Page (Server Overview)

**Files:**
- Create: `src/pages/dashboard-page.tsx`, `src/components/servers/server-card.tsx`, `src/components/servers/server-list.tsx`

- [ ] **Step 1: Implement ServerCard**

Glassmorphism card with status-colored left border. Contains: hostname, IP, OS badge, 3 CircularGauges (CPU/RAM/Disk), UptimeBadge, RelativeTime (last heartbeat), AlertBadge. Click navigates to `/servers/:id`. Hover: subtle glow effect.

- [ ] **Step 2: Implement ServerList**

Table view alternative: columns for hostname, IP, OS, CPU, RAM, Disk (LinearGauge), uptime, last heartbeat, alerts, status. Sortable columns.

- [ ] **Step 3: Implement DashboardPage**

- PageHeader: "Dashboard"
- StatsBar: Total, Healthy, Warning, Critical counts from `useServers` data
- FilterBar: SearchInput, group Select (from `useGroups`), status Select, Grid/List toggle
- Server grid (responsive CSS Grid, auto-fill min 320px) or ServerList depending on view toggle
- Empty state: "No servers found" with illustration when filtered list is empty

- [ ] **Step 4: Add route and verify**

- [ ] **Step 5: Commit**

```bash
git add src/pages/dashboard-page.tsx src/components/servers/server-card.tsx src/components/servers/server-list.tsx
git commit -m "feat: add dashboard page with server grid, filters, and stats bar"
```

---

### Task 12: Server Detail Page — Overview Tab

**Files:**
- Create: `src/pages/server-detail-page.tsx`, `src/components/servers/server-header.tsx`

- [ ] **Step 1: Implement ServerHeader**

Hostname (h1), IP, OS, status badge, uptime, back button (← Dashboard). Uses `useServerDetail(id)`.

- [ ] **Step 2: Implement ServerDetailPage with tab router**

Uses `useParams` for `serverId` and `tab`. ServerHeader at top. Horizontal Tabs component with: Overview, Processes, Services, Event Logs, Network, Hardware, Remote. Tab change updates URL (`/servers/:id/:tab`). Each tab is lazy-loaded.

- [ ] **Step 3: Implement Overview tab content**

4 TimeSeriesCharts (CPU, RAM, Disk, Network) from `useServerMetrics(id, range)`. TimeRangeSelector at top. 4 MetricCards showing current values above charts. Uses `useServerSubscription(id)` for real-time updates.

- [ ] **Step 4: Add route `/servers/:serverId/:tab?`**

- [ ] **Step 5: Verify navigation from dashboard to detail**

- [ ] **Step 6: Commit**

```bash
git add src/pages/server-detail-page.tsx src/components/servers/server-header.tsx
git commit -m "feat: add server detail page with overview tab and real-time charts"
```

---

### Task 13: Server Detail — Processes Tab

**Files:**
- Create: `src/components/servers/process-table.tsx`, `src/components/dialogs/confirm-kill-process-dialog.tsx`

- [ ] **Step 1: Implement ProcessTable**

Searchable, sortable table: PID, Name, CPU%, Memory (MB), Start Time, Actions. Uses `useServerProcesses(id)`. Sort by clicking column headers. Search input filters by name. Kill button (red, with `Trash2` icon) opens confirmation dialog. Pagination (50 per page). Manual "Refresh" button.

- [ ] **Step 2: Implement ConfirmKillProcessDialog**

Alert dialog: "Kill process {name} (PID: {pid})?" with warning text. Confirm (red) + Cancel buttons. Calls `useKillProcess` mutation on confirm. Shows toast on success/failure.

- [ ] **Step 3: Wire into ServerDetailPage Processes tab**

- [ ] **Step 4: Commit**

```bash
git add src/components/servers/process-table.tsx src/components/dialogs/confirm-kill-process-dialog.tsx
git commit -m "feat: add process table with search, sort, and kill functionality"
```

---

### Task 14: Server Detail — Services Tab

**Files:**
- Create: `src/components/servers/service-list.tsx`

- [ ] **Step 1: Implement ServiceList**

List of Windows services from `useServerServices(id)`. Each row: service display name, name (muted), status badge (Running=green, Stopped=red, Paused=amber), action buttons (Start/Stop/Restart — enabled based on current status). Status filter dropdown. Search by name.

- [ ] **Step 2: Wire into ServerDetailPage Services tab**

- [ ] **Step 3: Commit**

```bash
git add src/components/servers/service-list.tsx
git commit -m "feat: add Windows service list with start/stop/restart controls"
```

---

### Task 15: Server Detail — Event Logs Tab

**Files:**
- Create: `src/components/servers/event-log-viewer.tsx`

- [ ] **Step 1: Implement EventLogViewer**

Table with infinite scroll: Timestamp (formatted), Source, Level (SeverityIcon + label), Message (truncated, expandable). Filters: severity checkboxes (Error/Warning/Info), search input, date range picker. Uses `useServerEventLogs(id, filters)` infinite query. "Load more" triggers `fetchNextPage()`. New entries from WebSocket prepended with highlight animation.

- [ ] **Step 2: Wire into ServerDetailPage Event Logs tab**

- [ ] **Step 3: Commit**

```bash
git add src/components/servers/event-log-viewer.tsx
git commit -m "feat: add event log viewer with filters and infinite scroll"
```

---

### Task 16: Server Detail — Network, Hardware, Remote Tabs

**Files:**
- Create: `src/components/servers/network-panel.tsx`, `src/components/servers/hardware-panel.tsx`, `src/components/servers/remote-control-panel.tsx`, `src/components/dialogs/confirm-server-action-dialog.tsx`

- [ ] **Step 1: Implement NetworkPanel**

BandwidthChart (in/out over time). Active connections table: Local Address, Remote Address, State, PID. Open ports list as badges.

- [ ] **Step 2: Implement HardwarePanel**

Grid of info cards: CPU (model, cores, clock), RAM (total, type, speed), Disks (list with capacity bars), Network Adapters (name, speed, MAC), OS (name, version, build, arch). Static data from `useServerDetail`.

- [ ] **Step 3: Implement ConfirmServerActionDialog**

For Restart: simple confirm dialog. For Shutdown: requires typing the server hostname to confirm (input must match exactly). Red "Shutdown" button disabled until match.

- [ ] **Step 4: Implement RemoteControlPanel**

Action buttons: "Restart Server" (amber), "Shutdown Server" (red), "Download RDP File" (primary). Each action calls respective API endpoint. Action history log below: table of past remote actions with timestamp, action, initiated by, result.

- [ ] **Step 5: Wire all three tabs into ServerDetailPage**

- [ ] **Step 6: Commit**

```bash
git add src/components/servers/network-panel.tsx src/components/servers/hardware-panel.tsx src/components/servers/remote-control-panel.tsx src/components/dialogs/confirm-server-action-dialog.tsx
git commit -m "feat: add network, hardware, and remote control tabs for server detail"
```

---

### Task 17: Alerts Pages

**Files:**
- Create: `src/pages/alerts-page.tsx`, `src/pages/alert-rules-page.tsx`, `src/pages/alert-history-page.tsx`
- Create: `src/components/alerts/alert-card.tsx`, `src/components/alerts/alert-rule-form.tsx`, `src/components/alerts/alert-badge.tsx`
- Create: `src/components/dialogs/create-edit-alert-rule-dialog.tsx`, `src/components/dialogs/acknowledge-alert-dialog.tsx`

- [ ] **Step 1: Implement AlertCard**

Row component: SeverityIcon, server name (link to detail), alert message, metric value vs threshold, triggered timestamp (relative), duration badge, "Acknowledge" button.

- [ ] **Step 2: Implement AlertBadge**

Red circle with count. Used in sidebar nav and server cards. Animated entrance.

- [ ] **Step 3: Implement AlertsPage (Active Alerts)**

PageHeader + sub-nav tabs (Active | Rules | History). List of AlertCards from `useActiveAlerts()`. Filters: severity, server. Sort by severity/time. Empty state when no active alerts.

- [ ] **Step 4: Implement AcknowledgeAlertDialog**

Dialog with alert details summary. Optional note textarea. Confirm + Cancel. Calls `useAcknowledgeAlert`.

- [ ] **Step 5: Implement AlertRuleForm**

React Hook Form + Zod validation. Fields: name, metric (select), operator (select), threshold (number), duration (number + "seconds"), scope (server select or group select), notification channels (checkboxes: In-App, Email, Webhook), enabled toggle.

- [ ] **Step 6: Implement CreateEditAlertRuleDialog**

Dialog wrapping AlertRuleForm. "Create" or "Edit" mode based on whether rule is passed. Calls `useCreateAlertRule` or `useUpdateAlertRule`.

- [ ] **Step 7: Implement AlertRulesPage**

Table of rules: name, metric, condition ("{metric} {operator} {threshold}"), scope, channels (badges), enabled toggle (inline), edit/delete actions.

- [ ] **Step 8: Implement AlertHistoryPage**

Paginated table: severity, server, message, triggered at, resolved at, acknowledged by, duration. Date range filter. Severity filter.

- [ ] **Step 9: Add routes for all three alert pages**

- [ ] **Step 10: Commit**

```bash
git add src/pages/alerts-page.tsx src/pages/alert-rules-page.tsx src/pages/alert-history-page.tsx src/components/alerts/ src/components/dialogs/create-edit-alert-rule-dialog.tsx src/components/dialogs/acknowledge-alert-dialog.tsx
git commit -m "feat: add alerts pages with active alerts, rules management, and history"
```

---

### Task 18: Server Groups Pages

**Files:**
- Create: `src/pages/server-groups-page.tsx`, `src/pages/group-detail-page.tsx`
- Create: `src/components/groups/group-card.tsx`, `src/components/groups/group-server-picker.tsx`
- Create: `src/components/dialogs/create-edit-group-dialog.tsx`

- [ ] **Step 1: Implement GroupCard**

Glassmorphism card: group name (with color dot), description, server count, HealthDistributionBar. Click navigates to group detail. Dropdown menu: Edit, Delete, Bulk Actions (Restart All, Check Status).

- [ ] **Step 2: Implement GroupServerPicker**

Multi-select component: searchable list of all servers with checkboxes. Shows selected count. Used in create/edit group dialog.

- [ ] **Step 3: Implement CreateEditGroupDialog**

Form: name, description, color picker (preset swatches), GroupServerPicker. Calls `useCreateGroup` or `useUpdateGroup`.

- [ ] **Step 4: Implement ServerGroupsPage**

PageHeader with "Create Group" button. Grid of GroupCards. Empty state.

- [ ] **Step 5: Implement GroupDetailPage**

PageHeader with group name, edit/delete actions. Server grid (same ServerCard as dashboard) filtered to group members. "Add Server" button opens picker. "Remove" action on each card.

- [ ] **Step 6: Add routes and verify**

- [ ] **Step 7: Commit**

```bash
git add src/pages/server-groups-page.tsx src/pages/group-detail-page.tsx src/components/groups/ src/components/dialogs/create-edit-group-dialog.tsx
git commit -m "feat: add server groups pages with CRUD and server assignment"
```

---

### Task 19: Settings Pages

**Files:**
- Create: `src/pages/settings-page.tsx`, `src/pages/users-settings-page.tsx`, `src/pages/smtp-settings-page.tsx`, `src/pages/webhooks-settings-page.tsx`, `src/pages/general-settings-page.tsx`
- Create: `src/components/dialogs/create-edit-user-dialog.tsx`, `src/components/dialogs/create-edit-webhook-dialog.tsx`, `src/components/dialogs/delete-confirm-dialog.tsx`

- [ ] **Step 1: Implement SettingsPage layout**

PageHeader "Settings". Horizontal tabs: Users, SMTP, Webhooks, General. Tab content rendered via nested routes.

- [ ] **Step 2: Implement DeleteConfirmDialog**

Generic: "Are you sure you want to delete {entityType} '{entityName}'?" with red Confirm + Cancel.

- [ ] **Step 3: Implement CreateEditUserDialog**

Form: username, email, role (Admin/Operator/Viewer select), active toggle. Password field only on create. Zod validation.

- [ ] **Step 4: Implement UsersSettingsPage**

Table: username, email, role (colored badge), created date, last login, status (active/inactive), edit/delete actions. "Add User" button.

- [ ] **Step 5: Implement SmtpSettingsPage**

Form: SMTP host, port, username, password (masked with show/hide toggle), from address, TLS toggle. Save button. "Send Test Email" button with recipient input and inline result (success ✓ / error ✗).

- [ ] **Step 6: Implement CreateEditWebhookDialog**

Form: name, URL, events multi-select (alert.triggered, alert.resolved, server.offline, server.registered). Zod URL validation.

- [ ] **Step 7: Implement WebhooksSettingsPage**

Table: name, URL (truncated), events (badges), "Test" button (shows result), edit/delete actions. "Add Webhook" button.

- [ ] **Step 8: Implement GeneralSettingsPage**

Form: app display name, data retention period (select: 7d/30d/90d/1y), heartbeat interval (number input, seconds), timezone (select). Save button.

- [ ] **Step 9: Add all settings routes (nested under `/settings`)**

- [ ] **Step 10: Commit**

```bash
git add src/pages/settings-page.tsx src/pages/users-settings-page.tsx src/pages/smtp-settings-page.tsx src/pages/webhooks-settings-page.tsx src/pages/general-settings-page.tsx src/components/dialogs/create-edit-user-dialog.tsx src/components/dialogs/create-edit-webhook-dialog.tsx src/components/dialogs/delete-confirm-dialog.tsx
git commit -m "feat: add settings pages for users, SMTP, webhooks, and general config"
```

---

### Task 20: Not Found Page & Final Router Wiring

**Files:**
- Create: `src/pages/not-found-page.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement NotFoundPage**

Centered 404 illustration, "Page Not Found" heading, "Back to Dashboard" button.

- [ ] **Step 2: Wire all routes into App.tsx with lazy loading**

Apply `React.lazy()` + `Suspense` with skeleton fallback to all page imports. Route structure per Section 2.1. Apply `RequireAuth` and `RequireRole` guards per the route table.

- [ ] **Step 3: Verify all routes navigate correctly**

- [ ] **Step 4: Commit**

```bash
git add src/pages/not-found-page.tsx src/App.tsx
git commit -m "feat: add 404 page and wire all routes with lazy loading and auth guards"
```

---

### Task 21: Accessibility & Performance Audit

**Files:**
- Modify: Various component files for a11y fixes

- [ ] **Step 1: Add ARIA attributes to all gauges**

Add `role="meter"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label` to CircularGauge and LinearGauge.

- [ ] **Step 2: Add aria-live regions**

`aria-live="polite"` on StatsBar, RelativeTime. `aria-live="assertive"` on critical alert notifications.

- [ ] **Step 3: Add skip navigation link**

"Skip to main content" link at top of MainLayout, hidden until focused.

- [ ] **Step 4: Add reduced-motion media query support**

Wrap all Framer Motion animations in `useReducedMotion()` check. Disable chart transitions.

- [ ] **Step 5: Verify keyboard navigation**

Tab through sidebar → main content → tables → buttons → modals. Escape closes modals. Enter activates buttons.

- [ ] **Step 6: Run Lighthouse accessibility audit**

```bash
npx lighthouse http://localhost:5173 --only-categories=accessibility --output=json
```

Target: Score ≥ 90.

- [ ] **Step 7: Analyze bundle size**

```bash
npx vite-bundle-visualizer
```

Verify initial bundle < 200KB gzipped, per-route chunks < 50KB.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add accessibility attributes, reduced motion support, and performance optimizations"
```

---

### Task 22: E2E Smoke Tests

**Files:**
- Create: `e2e/login.spec.ts`, `e2e/dashboard.spec.ts`, `e2e/server-detail.spec.ts`

- [ ] **Step 1: Install and configure Playwright + MSW for API mocking**

```bash
npm install -D @playwright/test msw
npx playwright install chromium firefox
```

Create `playwright.config.ts` with: chromium + firefox, base URL `http://localhost:5173`, screenshot on failure. Set up MSW (Mock Service Worker) handlers in `e2e/mocks/handlers.ts` to mock all API endpoints during E2E tests, avoiding backend dependency.

- [ ] **Step 2: Write login E2E test**

Navigate to `/login`, fill email + password, click Sign In, assert redirect to Dashboard, assert sidebar visible.

- [ ] **Step 3: Write dashboard E2E test**

Navigate to `/` (authenticated), assert stats bar visible, assert server cards rendered, test search filter, test grid/list toggle.

- [ ] **Step 4: Write server detail E2E test**

Click server card, assert detail page loads, assert tabs visible, click through each tab, assert content renders.

- [ ] **Step 5: Run E2E tests**

```bash
npx playwright test
```

- [ ] **Step 6: Commit**

```bash
git add e2e/ playwright.config.ts
git commit -m "test: add E2E smoke tests for login, dashboard, and server detail"
```
