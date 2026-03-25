# iMonitorServer â€” Frontend Requirements Plan

## 1. Project Summary

| Field | Value |
|---|---|
| **Project Name** | iMonitorServer |
| **Description** | Comprehensive server monitoring system with web dashboard and Windows service agent |
| **Frontend Stack** | React 18 Â· TypeScript 5 Â· Vite 5 Â· TailwindCSS 3 Â· shadcn/ui Â· Recharts Â· React Router 6 Â· Socket.IO Client |
| **Target Platform** | Web (SPA) |
| **Design Inspiration** | Datadog, Grafana, Windows Admin Center, Uptime Kuma, Portainer |
| **Theme** | Dark monitoring theme â€” navy/charcoal base, cyan/teal accents, glassmorphism |

---

## 2. Screen / Page Inventory

### 2.1 Page Map

| # | Route | Page | Auth Required | Minimum Role |
|---|---|---|---|---|
| 1 | `/login` | Login | No | â€” |
| 2 | `/` | Dashboard (Server Overview) | Yes | Viewer |
| 3 | `/servers/:id` | Server Detail (tabbed) | Yes | Viewer |
| 4 | `/servers/:id/remote` | Remote Control Panel | Yes | Operator |
| 5 | `/groups` | Server Groups | Yes | Viewer |
| 6 | `/alerts` | Alerts (Active + Rules) | Yes | Viewer |
| 7 | `/alerts/rules/new` | Create / Edit Alert Rule | Yes | Operator |
| 8 | `/settings` | Settings (tabbed) | Yes | Admin |
| 9 | `/settings/users` | User Management | Yes | Admin |
| 10 | `/settings/smtp` | SMTP Configuration | Yes | Admin |
| 11 | `/settings/webhooks` | Webhook Configuration | Yes | Admin |
| 12 | `/settings/general` | General Settings | Yes | Admin |
| 13 | `*` | 404 Not Found | No | â€” |

### 2.2 Server Detail Tabs

| Tab | Path Segment | Minimum Role | Description |
|---|---|---|---|
| Overview | `overview` | Viewer | Real-time CPU/RAM/Disk/Network line charts, uptime gauge |
| Processes | `processes` | Viewer | Searchable/sortable process table (kill = Operator) |
| Services | `services` | Viewer | Windows service list with status badges (controls = Operator) |
| Event Logs | `event-logs` | Viewer | Filterable log viewer with severity, search, date-range |
| Network | `network` | Viewer | Connections table + bandwidth in/out charts |
| Hardware | `hardware` | Viewer | Static hardware info cards |
| Remote | `remote` | Operator | Shutdown/restart buttons, RDP file download/URI launch |

### 2.3 Navigation Flow Diagram

```
Login â”€â”€â–º Dashboard (default landing)
               â”‚
               â”œâ”€â”€ Server Card Click â”€â”€â–º Server Detail (/overview tab)
               â”‚                              â”œâ”€â”€ Tab: Overview
               â”‚                              â”œâ”€â”€ Tab: Processes
               â”‚                              â”œâ”€â”€ Tab: Services
               â”‚                              â”œâ”€â”€ Tab: Event Logs
               â”‚                              â”œâ”€â”€ Tab: Network
               â”‚                              â”œâ”€â”€ Tab: Hardware
               â”‚                              â””â”€â”€ Tab: Remote
               â”‚
          Sidebar Navigation
               â”œâ”€â”€ Dashboard
               â”œâ”€â”€ Server Groups â”€â”€â–º Group Detail (filtered dashboard)
               â”œâ”€â”€ Alerts
               â”‚       â”œâ”€â”€ Active Alerts
               â”‚       â””â”€â”€ Alert Rules â”€â”€â–º Create/Edit Rule
               â””â”€â”€ Settings (Admin only)
                       â”œâ”€â”€ Users
                       â”œâ”€â”€ SMTP
                       â”œâ”€â”€ Webhooks
                       â””â”€â”€ General
```

---

## 3. User Interface Requirements

### 3.1 Layout Structure

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚  Top Bar: Logo Â· Search (âŒ˜K) Â· Notifications Â· Profile  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚        â”‚                                                â”‚
â”‚  Side  â”‚              Main Content Area                 â”‚
â”‚  bar   â”‚                                                â”‚
â”‚        â”‚                                                â”‚
â”‚  Nav   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚  Links â”‚  â”‚  Page Header / Breadcrumbs               â”‚  â”‚
â”‚        â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤  â”‚
â”‚  â”€â”€â”€â”€  â”‚  â”‚                                          â”‚  â”‚
â”‚  Serverâ”‚  â”‚  Content (cards, tables, charts)         â”‚  â”‚
â”‚  Groupsâ”‚  â”‚                                          â”‚  â”‚
â”‚  (tree)â”‚  â”‚                                          â”‚  â”‚
â”‚        â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Status Bar: WebSocket status Â· Last update Â· Version    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- **Sidebar**: Collapsible (icon-only mode on â‰¤1024 px). Fixed left. Contains primary nav + server group tree.
- **Top Bar**: Sticky. Contains global search (command palette), notification bell with unread badge, active alert count, user avatar dropdown.
- **Status Bar**: Thin footer showing WebSocket connection state (connected / reconnecting / disconnected), timestamp of last metric push, app version.

### 3.2 Page-by-Page UI Requirements

#### 3.2.1 Login Page

| Element | Specification |
|---|---|
| Layout | Centered card on full-bleed dark background with subtle grid/dot pattern |
| Logo | iMonitorServer logo + tagline |
| Fields | Email (text input, autofocus) Â· Password (password input, show/hide toggle) |
| Actions | "Sign In" primary button Â· "Forgot Password?" link |
| Validation | Client-side: required, email format. Server-side error display inline |
| Extras | "Remember me" checkbox. Loading spinner on submit. Redirect to `/` on success |

#### 3.2.2 Dashboard (Server Overview)

| Element | Specification |
|---|---|
| Summary Strip | 4 stat cards: Total Servers, Healthy (green), Warning (amber), Critical (red). Animated count-up on load |
| Filters | Search by hostname/IP Â· Filter by Group (multi-select dropdown) Â· Filter by Status (healthy/warning/critical/offline) Â· View toggle: Grid / List |
| Server Cards (Grid) | Glassmorphism card per server: hostname (bold), IP, OS badge, 3 circular gauge rings (CPU â€” cyan, RAM â€” purple, Disk â€” teal), uptime badge, last heartbeat relative timestamp, alert count badge (red if > 0) |
| Server Rows (List) | Table row variant with same data as card, sortable columns |
| Real-time | Gauge values animate on WebSocket push. Card border pulses on state change. New server fades in |
| Empty State | Illustration + "No servers registered. Install the agent to get started." with documentation link |

#### 3.2.3 Server Detail

| Element | Specification |
|---|---|
| Header | Server hostname, IP, OS, uptime, current status badge, group tags, quick-actions dropdown (restart, shutdown, RDP â€” role-gated) |
| Tab Bar | Horizontal tabs below header. Active tab indicator with animated underline. Tab content area below |
| Overview Tab | 4 real-time line charts (CPU, RAM, Disk I/O, Network I/O) via Recharts. Time range selector (1h/6h/24h/7d/30d). Auto-scrolling with live data points. Health summary cards above charts |
| Processes Tab | Searchable DataTable: PID, Name, CPU%, Memory (MB), Start Time. Sortable columns. "Kill Process" button per row (Operator+). Confirmation dialog on kill. Pagination (50/page) |
| Services Tab | Service list cards or table: Service Name, Display Name, Status badge (Running=green, Stopped=red, Paused=amber), Startup Type. Action buttons: Start/Stop/Restart (Operator+). Real-time status push |
| Event Logs Tab | Filterable log table: Timestamp, Source, Level (Error=red icon, Warning=amber, Info=blue), Message (expandable). Filters: Level multi-select, Source dropdown, Date range picker, Full-text search. Virtualized scrolling for performance |
| Network Tab | Split view: (Top) Bandwidth in/out area chart. (Bottom) Active connections table: Local Address, Remote Address, Protocol, State, PID. Open ports summary cards |
| Hardware Tab | Static info cards: CPU model/cores/speed, RAM total/slots, Disk drives (model/capacity/type), Network adapters, OS version/build, BIOS info |
| Remote Tab | Action cards: Restart Server, Shutdown Server (destructive=red), RDP Connect (download .rdp / launch URI). Confirmation modals with countdown timer for destructive actions. Audit log of recent remote actions |

#### 3.2.4 Server Groups

| Element | Specification |
|---|---|
| Group Cards | Card per group: name, description, server count, aggregate health pie mini-chart. Click to filter dashboard by group |
| Management | Create Group modal (name, description, color). Edit/Delete group. Drag-and-drop servers between groups or multi-select assign |
| Bulk Actions | Select multiple groups â†’ Bulk actions menu: Delete, Export metrics |

#### 3.2.5 Alerts

| Sub-View | Specification |
|---|---|
| Active Alerts | List/table: Severity icon (critical/warning/info), Server hostname (link), Alert message, Triggered timestamp (relative), Duration active, "Acknowledge" button. Filters: severity, server, group. Sort by time/severity |
| Alert Rules | Card/table per rule: Name, Metric (CPU/RAM/Disk/Service), Condition (> / < / ==), Threshold, Duration, Notification channels (badges: in-app, email, webhook), Enabled toggle. CRUD actions |
| Create/Edit Rule Form | Step-by-step or single form: Select metric â†’ Set condition/threshold â†’ Set duration â†’ Choose notification channels â†’ Select target servers/groups â†’ Enable/disable. Live preview of rule logic |
| Alert History | Paginated table of past alerts: timestamp, server, rule, resolved/acknowledged timestamps. Export to CSV |

#### 3.2.6 Settings

| Tab | Specification |
|---|---|
| Users | DataTable: Name, Email, Role badge (Admin=purple, Operator=blue, Viewer=gray), Created date, Last login, Status. Actions: Add User modal (name, email, role, temp password), Edit, Deactivate, Delete. Inline role change dropdown |
| SMTP | Form: Host, Port (25/465/587), Encryption (None/TLS/STARTTLS), Username, Password (masked), From Address, From Name. "Send Test Email" button with recipient input. Success/failure toast |
| Webhooks | List of webhook endpoints: URL, Label, Events subscribed, Last triggered, Status. Add/Edit modal. "Test Webhook" button with payload preview. Delivery log |
| General | App display name, Data retention period (dropdown: 7d/30d/90d/1y), Heartbeat timeout threshold (seconds), Default dashboard view (grid/list), Timezone selection |

---

## 4. Component Library & Design System

### 4.1 Foundation: shadcn/ui + Custom Theme

All base components sourced from **shadcn/ui** with a custom dark monitoring theme applied via TailwindCSS CSS variables.

### 4.2 Color System

| Token | Value | Usage |
|---|---|---|
| `--background` | `hsl(222, 47%, 8%)` | Page background (deep navy) |
| `--card` | `hsl(222, 40%, 12%)` | Card/surface background |
| `--card-elevated` | `hsl(222, 35%, 16%)` | Elevated cards, modals |
| `--border` | `hsl(222, 30%, 20%)` | Borders, dividers |
| `--foreground` | `hsl(210, 40%, 96%)` | Primary text |
| `--muted-foreground` | `hsl(215, 20%, 55%)` | Secondary/muted text |
| `--primary` | `hsl(185, 80%, 55%)` | Cyan/teal accent â€” healthy, primary actions |
| `--primary-foreground` | `hsl(222, 47%, 8%)` | Text on primary |
| `--success` | `hsl(142, 71%, 45%)` | Green â€” healthy status |
| `--warning` | `hsl(38, 92%, 50%)` | Amber â€” warning status |
| `--destructive` | `hsl(0, 84%, 60%)` | Red â€” critical/error/destructive |
| `--info` | `hsl(210, 80%, 60%)` | Blue â€” informational |
| `--chart-cpu` | `hsl(185, 80%, 55%)` | CPU chart line (cyan) |
| `--chart-ram` | `hsl(270, 70%, 65%)` | RAM chart line (purple) |
| `--chart-disk` | `hsl(160, 60%, 50%)` | Disk chart line (teal-green) |
| `--chart-network` | `hsl(38, 85%, 55%)` | Network chart line (amber) |

### 4.3 Typography

| Level | Font | Size | Weight |
|---|---|---|---|
| Display | Inter | 2.25rem (36px) | 700 |
| H1 | Inter | 1.875rem (30px) | 600 |
| H2 | Inter | 1.5rem (24px) | 600 |
| H3 | Inter | 1.25rem (20px) | 600 |
| Body | Inter | 0.875rem (14px) | 400 |
| Small / Caption | Inter | 0.75rem (12px) | 400 |
| Mono (metrics) | JetBrains Mono | 0.875rem (14px) | 500 |

### 4.4 Glassmorphism Card Specification

```css
.glass-card {
  background: linear-gradient(
    135deg,
    hsl(222 40% 12% / 0.8),
    hsl(222 40% 16% / 0.4)
  );
  backdrop-filter: blur(12px);
  border: 1px solid hsl(222 30% 24% / 0.6);
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px hsl(0 0% 0% / 0.3),
    inset 0 1px 0 hsl(222 30% 30% / 0.2);
}
```

### 4.5 Custom Component Inventory

Beyond shadcn/ui base, the following custom components are required:

| Component | Description | Used In |
|---|---|---|
| `CircularGauge` | Animated SVG ring gauge (0â€“100%) with color thresholds | Dashboard cards, Server overview |
| `MetricLineChart` | Recharts line chart wrapper with time-range selector, zoom, multi-server overlay | Server Detail: Overview, Network |
| `StatusBadge` | Colored dot + label (Healthy/Warning/Critical/Offline) | Everywhere |
| `ServerCard` | Glassmorphism card with hostname, IP, gauges, alert badge | Dashboard |
| `DataTable` | Virtualized, sortable, searchable, paginated table | Processes, Services, Event Logs, Users |
| `ConfirmDialog` | Modal with countdown timer for destructive actions | Remote tab, Process kill |
| `CommandPalette` | âŒ˜K search overlay â€” search servers, jump to pages | Global |
| `NotificationBell` | Bell icon with unread count dropdown, links to alert details | Top bar |
| `LiveIndicator` | Pulsing green dot for live/connected status | Status bar, Server cards |
| `TimeRangeSelector` | Button group: 1h / 6h / 24h / 7d / 30d | Charts |
| `AlertSeverityIcon` | Icon + color for Critical / Warning / Info | Alerts, Event Logs |
| `ServiceControlButtons` | Start / Stop / Restart button group with loading states | Services tab |
| `EmptyState` | Illustration + message + CTA button | All list/table views |
| `GroupTreeNav` | Collapsible tree in sidebar for server groups | Sidebar |
| `BandwidthChart` | Dual-area chart (in/out) with Recharts | Network tab |
| `AuditLogEntry` | Compact row: timestamp, user, action, target | Remote tab, Settings |

### 4.6 Animation Specifications

| Animation | Trigger | Duration | Easing |
|---|---|---|---|
| Gauge fill | Value update via WebSocket | 600ms | `ease-out` |
| Card fade-in | Page load / new server registered | 300ms | `ease-in-out` |
| Status border pulse | Server state change | 1500ms | `ease-in-out` (infinite, 3 cycles) |
| Chart data point append | New data from WebSocket | 200ms | `linear` |
| Tab content transition | Tab switch | 200ms | `ease-in-out` |
| Modal enter/exit | Open/close | 200ms / 150ms | `ease-out` / `ease-in` |
| Toast slide-in | Notification | 300ms | `spring` (via framer-motion or CSS) |
| Metric count-up | Dashboard load | 800ms | `ease-out` |
| Skeleton shimmer | Data loading | Continuous | `linear` (1.5s loop) |

---

## 5. State Management Architecture

### 5.1 Technology Choices

| Concern | Technology | Rationale |
|---|---|---|
| Server state (API) | **TanStack Query v5** | Caching, background refetch, optimistic updates, stale-while-revalidate |
| Client state (global) | **Zustand** | Lightweight, TypeScript-friendly, no boilerplate |
| Real-time state | **Socket.IO Client** + Zustand | Socket events update Zustand stores, which trigger React re-renders |
| Form state | **React Hook Form** + **Zod** | Performant forms with schema-based validation |
| URL state | **React Router 6** | Tabs, filters, pagination reflected in URL params |

### 5.2 Zustand Store Architecture

```
stores/
â”œâ”€â”€ useAuthStore.ts          # user, tokens, isAuthenticated, role
â”œâ”€â”€ useSocketStore.ts        # connectionStatus, lastHeartbeat
â”œâ”€â”€ useServerMetricsStore.ts # Map<serverId, MetricsSnapshot> â€” updated by WebSocket
â”œâ”€â”€ useActiveAlertsStore.ts  # active alerts array â€” updated by WebSocket
â”œâ”€â”€ useNotificationStore.ts  # unread count, notification list
â”œâ”€â”€ useUIStore.ts            # sidebarCollapsed, theme, dashboardViewMode
â””â”€â”€ useCommandPaletteStore.ts # isOpen, recentSearches
```

### 5.3 TanStack Query Key Structure

```typescript
const queryKeys = {
  servers: {
    all:      ['servers'] as const,
    list:     (filters: ServerFilters) => ['servers', 'list', filters] as const,
    detail:   (id: string) => ['servers', id] as const,
    metrics:  (id: string, range: TimeRange) => ['servers', id, 'metrics', range] as const,
    processes:(id: string) => ['servers', id, 'processes'] as const,
    services: (id: string) => ['servers', id, 'services'] as const,
    eventLogs:(id: string, filters: LogFilters) => ['servers', id, 'event-logs', filters] as const,
    network:  (id: string) => ['servers', id, 'network'] as const,
    hardware: (id: string) => ['servers', id, 'hardware'] as const,
  },
  groups:     { all: ['groups'], detail: (id: string) => ['groups', id] },
  alerts:     { active: ['alerts', 'active'], rules: ['alerts', 'rules'], history: (filters) => ['alerts', 'history', filters] },
  users:      { all: ['users'] },
  settings:   { smtp: ['settings', 'smtp'], webhooks: ['settings', 'webhooks'], general: ['settings', 'general'] },
} as const;
```

### 5.4 Real-Time Data Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?    WebSocket     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?    Zustand     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚  Backend  â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º â”‚SocketService â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º â”‚ Zustand Storeâ”‚
â”‚ Socket.IO â”‚                  â”‚ (singleton)  â”‚                â”‚  (reactive)  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
                                                                      â”‚
                                    Invalidation                      â”‚ React re-render
                                         â”‚                            â–¼
                              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
                              â”‚ TanStack Query Cache â”‚ â—„â”€â”€â”€â”€â”€â”€ â”‚  Components  â”‚
                              â”‚ (background refetch) â”‚         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Socket Events Consumed by Frontend:**

| Event | Payload | Action |
|---|---|---|
| `server:metrics` | `{ serverId, cpu, ram, disk, network, timestamp }` | Update `useServerMetricsStore` |
| `server:status` | `{ serverId, status }` | Update server status, animate card border |
| `server:registered` | `{ server }` | Invalidate servers query, toast notification |
| `server:disconnected` | `{ serverId }` | Update status to offline |
| `alert:triggered` | `{ alert }` | Add to `useActiveAlertsStore`, show toast |
| `alert:resolved` | `{ alertId }` | Remove from active alerts |
| `process:killed` | `{ serverId, pid, success }` | Invalidate processes query, toast |
| `service:statusChanged` | `{ serverId, serviceName, status }` | Invalidate services query |
| `eventLog:new` | `{ serverId, entry }` | Prepend to event log query if on that tab |

---

## 6. API Integration Requirements

### 6.1 HTTP Client Setup

- **Base**: Axios instance with interceptors
- **Auth**: JWT access token in `Authorization: Bearer <token>` header
- **Refresh**: Automatic token refresh on 401 via Axios interceptor. Queue failed requests and retry after refresh
- **Abort**: Every API call passes `AbortController.signal` (via TanStack Query's built-in cancellation)
- **Base URL**: Configurable via `VITE_API_BASE_URL` environment variable

### 6.2 API Endpoints (Frontend Perspective)

| Domain | Method | Endpoint | Purpose |
|---|---|---|---|
| **Auth** | POST | `/api/auth/login` | Login, returns access + refresh tokens |
| | POST | `/api/auth/refresh` | Refresh access token |
| | POST | `/api/auth/logout` | Invalidate refresh token |
| | GET | `/api/auth/me` | Get current user profile |
| **Servers** | GET | `/api/servers` | List all servers (with filters) |
| | GET | `/api/servers/:id` | Server detail |
| | DELETE | `/api/servers/:id` | Unregister server |
| | GET | `/api/servers/:id/metrics?range=` | Historical metrics |
| | GET | `/api/servers/:id/processes` | Running processes |
| | POST | `/api/servers/:id/processes/:pid/kill` | Kill process |
| | GET | `/api/servers/:id/services` | Windows services list |
| | POST | `/api/servers/:id/services/:name/action` | Start/Stop/Restart service |
| | GET | `/api/servers/:id/event-logs` | Event logs (paginated, filtered) |
| | GET | `/api/servers/:id/network` | Network connections + stats |
| | GET | `/api/servers/:id/hardware` | Hardware info |
| | POST | `/api/servers/:id/remote/restart` | Restart server |
| | POST | `/api/servers/:id/remote/shutdown` | Shutdown server |
| | GET | `/api/servers/:id/remote/rdp` | Download RDP file |
| **Groups** | GET | `/api/groups` | List groups |
| | POST | `/api/groups` | Create group |
| | PUT | `/api/groups/:id` | Update group |
| | DELETE | `/api/groups/:id` | Delete group |
| | POST | `/api/groups/:id/servers` | Assign servers to group |
| **Alerts** | GET | `/api/alerts/active` | Active alerts |
| | POST | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| | GET | `/api/alerts/history` | Alert history (paginated) |
| | GET | `/api/alerts/rules` | Alert rules |
| | POST | `/api/alerts/rules` | Create rule |
| | PUT | `/api/alerts/rules/:id` | Update rule |
| | DELETE | `/api/alerts/rules/:id` | Delete rule |
| **Users** | GET | `/api/users` | List users (Admin) |
| | POST | `/api/users` | Create user (Admin) |
| | PUT | `/api/users/:id` | Update user (Admin) |
| | DELETE | `/api/users/:id` | Deactivate user (Admin) |
| **Settings** | GET/PUT | `/api/settings/smtp` | SMTP configuration |
| | POST | `/api/settings/smtp/test` | Test SMTP |
| | GET/POST/PUT/DELETE | `/api/settings/webhooks` | Webhook CRUD |
| | POST | `/api/settings/webhooks/:id/test` | Test webhook |
| | GET/PUT | `/api/settings/general` | General settings |

### 6.3 Error Handling Strategy

| HTTP Status | Frontend Behavior |
|---|---|
| 400 | Show inline field validation errors from response body |
| 401 | Attempt token refresh â†’ if fails, redirect to `/login` |
| 403 | Toast: "You don't have permission to perform this action" |
| 404 | Redirect to 404 page or show empty state |
| 409 | Toast: conflict message from server |
| 422 | Show validation errors inline |
| 429 | Toast: "Too many requests. Please wait." + auto-retry with backoff |
| 500+ | Toast: "Something went wrong. Please try again." + log to console |
| Network Error | Toast: "Connection lost. Retryingâ€¦" + TanStack Query retry (3 attempts, exponential backoff) |

---

## 7. Security Requirements

### 7.1 Authentication & Authorization

| Requirement | Implementation |
|---|---|
| Token Storage | Access token in memory (Zustand store). Refresh token in `httpOnly` secure cookie (set by backend) |
| Token Refresh | Silent refresh via `/api/auth/refresh` before access token expiry. Axios interceptor handles 401 retry |
| Route Guards | React Router `loader` or wrapper component checks `isAuthenticated` + role. Redirect to `/login` if unauthenticated |
| Role-Based UI | Components check user role from `useAuthStore`. Hide/disable controls below required role. Never rely solely on UI hiding â€” backend enforces |
| Session Timeout | Auto-logout after 30 minutes of inactivity. Warning toast at 25 minutes |

### 7.2 XSS Prevention

| Vector | Mitigation |
|---|---|
| Rendered data | React's default JSX escaping. **Never use `dangerouslySetInnerHTML`** |
| User input in URLs | Sanitize all URL parameters. Use `encodeURIComponent` |
| Event log messages | Render as plain text only. No HTML interpretation |
| Search inputs | Debounced + sanitized before sending to API |

### 7.3 CSRF Prevention

| Measure | Detail |
|---|---|
| SameSite cookies | Refresh token cookie set with `SameSite=Strict` |
| Bearer token | All API mutations use `Authorization: Bearer` header (not cookies), inherently CSRF-safe |

### 7.4 Additional Security

| Requirement | Implementation |
|---|---|
| Content Security Policy | Strict CSP headers via Vite HTML plugin / server config |
| Subresource Integrity | SRI hashes on CDN-loaded scripts (if any) |
| Sensitive data in state | Never store passwords/API keys in Zustand. Clear auth state on logout |
| Destructive action confirmation | Double-confirm modals with typed confirmation for shutdown/restart (e.g., type server hostname) |
| Audit trail display | Show who did what and when in remote actions tab (read-only for Viewers) |
| Rate limiting awareness | Frontend respects `429` and `Retry-After` header |

---

## 8. Accessibility Requirements

### 8.1 Standards Compliance

- **Target**: WCAG 2.1 Level AA
- **Testing**: axe-core integration in dev (via `@axe-core/react`), Lighthouse CI in pipeline

### 8.2 Specific Requirements

| Category | Requirement |
|---|---|
| **Keyboard Navigation** | All interactive elements focusable via Tab. Logical tab order. `Escape` closes modals/dropdowns. Arrow keys navigate tabs, menus, table rows. `Enter`/`Space` activates buttons |
| **Screen Reader** | Semantic HTML (`<nav>`, `<main>`, `<header>`, `<table>`). ARIA labels on icon-only buttons. Live regions (`aria-live="polite"`) for real-time metric updates and toast notifications. `role="alert"` for error messages |
| **Color** | Never convey information by color alone. Status badges include text labels + icons alongside color. Minimum contrast ratio 4.5:1 for text, 3:1 for large text/UI components |
| **Focus Indicators** | Visible focus ring (2px cyan outline) on all interactive elements. Never `outline: none` without alternative |
| **Motion** | Respect `prefers-reduced-motion`. Disable chart animations, pulse effects, and count-up animations when enabled |
| **Forms** | All inputs have associated `<label>`. Error messages linked via `aria-describedby`. Required fields marked with `aria-required` |
| **Data Tables** | Proper `<th scope>` attributes. Caption/summary for screen readers. Sortable columns announce sort state |
| **Modals** | Focus trap inside open modals. Restore focus to trigger element on close. `aria-modal="true"` |

---

## 9. Responsiveness Requirements

### 9.1 Breakpoint System

| Breakpoint | Min Width | Target |
|---|---|---|
| `sm` | 640px | Small tablets (portrait) |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops (primary target) |
| `2xl` | 1536px | Large/ultra-wide monitors |

### 9.2 Layout Adaptations

| Viewport | Sidebar | Dashboard Grid | Server Detail Tabs | Data Tables |
|---|---|---|---|---|
| â‰¥ 1280px | Expanded (240px) | 4 columns | Horizontal tabs | Full columns |
| 1024â€“1279px | Collapsed (64px, icons) | 3 columns | Horizontal tabs | Scrollable |
| 768â€“1023px | Hidden (hamburger toggle) | 2 columns | Dropdown tab selector | Horizontal scroll |
| < 768px | Hidden (hamburger) | 1 column (stacked) | Vertical accordion | Card view per row |

### 9.3 Primary Target

- **Optimized for**: 1920Ã—1080 desktop monitors (primary use case for server monitoring)
- **Must work on**: 1024px+ tablets for on-the-go monitoring
- **Graceful on**: Mobile viewports (limited functionality acceptable â€” monitoring is a desktop activity)

---

## 10. Performance Requirements

### 10.1 Loading Performance

| Metric | Target | Measurement |
|---|---|---|
| First Contentful Paint (FCP) | < 1.0s | Lighthouse |
| Largest Contentful Paint (LCP) | < 1.5s | Lighthouse |
| Time to Interactive (TTI) | < 2.0s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.05 | Lighthouse |
| First Input Delay (FID) | < 50ms | Web Vitals |
| Initial JS Bundle Size | < 250 KB gzipped | Vite build analysis |

### 10.2 Code Splitting Strategy

```typescript
// Route-level lazy loading
const Dashboard     = lazy(() => import('@/pages/Dashboard'));
const ServerDetail  = lazy(() => import('@/pages/ServerDetail'));
const Alerts        = lazy(() => import('@/pages/Alerts'));
const Settings      = lazy(() => import('@/pages/Settings'));
const ServerGroups  = lazy(() => import('@/pages/ServerGroups'));

// Heavy component lazy loading
const RechartsWrapper = lazy(() => import('@/components/charts/RechartsWrapper'));
const EventLogViewer  = lazy(() => import('@/components/server/EventLogViewer'));
const CommandPalette  = lazy(() => import('@/components/global/CommandPalette'));
```

### 10.3 Runtime Performance

| Scenario | Target | Strategy |
|---|---|---|
| Dashboard with 100 servers | 60 FPS scroll | Virtualized grid (react-window), throttle WebSocket updates to 1/sec per card |
| Process table (1000+ rows) | 60 FPS scroll | Virtual table (TanStack Virtual), pagination |
| Event log (10,000+ entries) | 60 FPS scroll | Virtual list, paginated API, lazy expand |
| Chart with 7d of data (10K+ points) | Smooth zoom/pan | Data downsampling on backend, canvas rendering for large datasets |
| 50 concurrent WebSocket updates/sec | No frame drops | Batch state updates, `requestAnimationFrame` throttle, React 18 automatic batching |

### 10.4 Caching Strategy

| Data | Cache Time | Stale Time | Refetch |
|---|---|---|---|
| Server list | 5 min | 30 sec | On window focus + WebSocket invalidation |
| Server metrics (historical) | 10 min | 2 min | On time range change |
| Server hardware info | 1 hour | 30 min | Manual refresh only |
| Processes / Services | 30 sec | 10 sec | WebSocket invalidation |
| Event logs | 5 min | 1 min | On filter change |
| Alert rules | 10 min | 5 min | On mutation |
| User list | 10 min | 5 min | On mutation |
| Settings | 30 min | 10 min | On mutation |

---

## 11. Browser & Device Compatibility

### 11.1 Browser Support Matrix

| Browser | Minimum Version | Support Level |
|---|---|---|
| Google Chrome | 100+ | Full (primary) |
| Microsoft Edge | 100+ | Full |
| Mozilla Firefox | 100+ | Full |
| Safari | 16+ | Full |
| Safari iOS | 16+ | Responsive view (read-only acceptable) |
| Chrome Android | 100+ | Responsive view (read-only acceptable) |
| Internet Explorer | â€” | â?Œ Not supported |

### 11.2 Required Web APIs

| API | Purpose | Fallback |
|---|---|---|
| WebSocket | Real-time updates | HTTP polling (30s interval) |
| ResizeObserver | Responsive charts | Debounced window.resize |
| IntersectionObserver | Lazy loading, virtual lists | Eager load |
| Clipboard API | Copy server IP/hostname | Input selection fallback |
| Notification API (optional) | Browser push for critical alerts | In-app only |

### 11.3 Target Browserslist

```
> 0.5%, last 2 versions, not dead, not ie 11
```

---

## 12. Internationalization (i18n)

### 12.1 Phase 1 (MVP) â€” English Only

- All UI strings hardcoded in English
- **But**: Architecture must be i18n-ready

### 12.2 i18n-Ready Architecture

| Requirement | Implementation |
|---|---|
| String extraction | All user-facing strings as constants (not inline). Organize in `src/locales/en.json` structure |
| No string concatenation | Use template/interpolation patterns for dynamic strings |
| Date/Time formatting | Use `date-fns` with locale parameter (already in stack) |
| Number formatting | Use `Intl.NumberFormat` for metric values (1,234.56 vs 1.234,56) |
| RTL consideration | Use logical CSS properties (`margin-inline-start` vs `margin-left`) where feasible |
| Pluralization | Structure strings to support plural forms |

### 12.3 Phase 2 (Future) â€” Full i18n

- Integrate `react-i18next`
- Extract all strings to translation files
- Add language selector to Settings > General

---

## 13. Project Structure

```
src/
â”œâ”€â”€ api/                          # API client & endpoint definitions
â”‚   â”œâ”€â”€ client.ts                 # Axios instance with interceptors
â”‚   â”œâ”€â”€ endpoints/
â”‚   â”‚   â”œâ”€â”€ auth.api.ts
â”‚   â”‚   â”œâ”€â”€ servers.api.ts
â”‚   â”‚   â”œâ”€â”€ groups.api.ts
â”‚   â”‚   â”œâ”€â”€ alerts.api.ts
â”‚   â”‚   â”œâ”€â”€ users.api.ts
â”‚   â”‚   â””â”€â”€ settings.api.ts
â”‚   â””â”€â”€ queryKeys.ts              # TanStack Query key factory
â”‚
â”œâ”€â”€ assets/                       # Static assets (logo, illustrations)
â”‚
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/                       # shadcn/ui base components (generated)
â”‚   â”œâ”€â”€ charts/
â”‚   â”‚   â”œâ”€â”€ CircularGauge.tsx
â”‚   â”‚   â”œâ”€â”€ MetricLineChart.tsx
â”‚   â”‚   â”œâ”€â”€ BandwidthChart.tsx
â”‚   â”‚   â””â”€â”€ MiniPieChart.tsx
â”‚   â”œâ”€â”€ common/
â”‚   â”‚   â”œâ”€â”€ StatusBadge.tsx
â”‚   â”‚   â”œâ”€â”€ ConfirmDialog.tsx
â”‚   â”‚   â”œâ”€â”€ EmptyState.tsx
â”‚   â”‚   â”œâ”€â”€ LiveIndicator.tsx
â”‚   â”‚   â”œâ”€â”€ DataTable.tsx
â”‚   â”‚   â”œâ”€â”€ TimeRangeSelector.tsx
â”‚   â”‚   â””â”€â”€ AlertSeverityIcon.tsx
â”‚   â”œâ”€â”€ layout/
â”‚   â”‚   â”œâ”€â”€ AppLayout.tsx
â”‚   â”‚   â”œâ”€â”€ Sidebar.tsx
â”‚   â”‚   â”œâ”€â”€ TopBar.tsx
â”‚   â”‚   â”œâ”€â”€ StatusBar.tsx
â”‚   â”‚   â””â”€â”€ GroupTreeNav.tsx
â”‚   â”œâ”€â”€ server/
â”‚   â”‚   â”œâ”€â”€ ServerCard.tsx
â”‚   â”‚   â”œâ”€â”€ ServerGrid.tsx
â”‚   â”‚   â”œâ”€â”€ ProcessTable.tsx
â”‚   â”‚   â”œâ”€â”€ ServiceList.tsx
â”‚   â”‚   â”œâ”€â”€ EventLogViewer.tsx
â”‚   â”‚   â”œâ”€â”€ NetworkPanel.tsx
â”‚   â”‚   â”œâ”€â”€ HardwarePanel.tsx
â”‚   â”‚   â””â”€â”€ RemotePanel.tsx
â”‚   â”œâ”€â”€ alerts/
â”‚   â”‚   â”œâ”€â”€ ActiveAlertList.tsx
â”‚   â”‚   â”œâ”€â”€ AlertRuleCard.tsx
â”‚   â”‚   â””â”€â”€ AlertRuleForm.tsx
â”‚   â””â”€â”€ global/
â”‚       â”œâ”€â”€ CommandPalette.tsx
â”‚       â””â”€â”€ NotificationBell.tsx
â”‚
â”œâ”€â”€ hooks/                        # Custom hooks
â”‚   â”œâ”€â”€ useAuth.ts
â”‚   â”œâ”€â”€ useSocket.ts
â”‚   â”œâ”€â”€ useServerMetrics.ts
â”‚   â”œâ”€â”€ useConfirmAction.ts
â”‚   â”œâ”€â”€ useDebounce.ts
â”‚   â””â”€â”€ useMediaQuery.ts
â”‚
â”œâ”€â”€ lib/                          # Utilities
â”‚   â”œâ”€â”€ utils.ts                  # cn() helper, formatters
â”‚   â”œâ”€â”€ constants.ts              # Status thresholds, chart colors
â”‚   â””â”€â”€ validators.ts             # Zod schemas
â”‚
â”œâ”€â”€ pages/
â”‚   â”œâ”€â”€ LoginPage.tsx
â”‚   â”œâ”€â”€ DashboardPage.tsx
â”‚   â”œâ”€â”€ ServerDetailPage.tsx
â”‚   â”œâ”€â”€ ServerGroupsPage.tsx
â”‚   â”œâ”€â”€ AlertsPage.tsx
â”‚   â”œâ”€â”€ SettingsPage.tsx
â”‚   â””â”€â”€ NotFoundPage.tsx
â”‚
â”œâ”€â”€ services/
â”‚   â””â”€â”€ socket.service.ts         # Socket.IO client singleton
â”‚
â”œâ”€â”€ stores/                       # Zustand stores
â”‚   â”œâ”€â”€ useAuthStore.ts
â”‚   â”œâ”€â”€ useSocketStore.ts
â”‚   â”œâ”€â”€ useServerMetricsStore.ts
â”‚   â”œâ”€â”€ useActiveAlertsStore.ts
â”‚   â”œâ”€â”€ useNotificationStore.ts
â”‚   â”œâ”€â”€ useUIStore.ts
â”‚   â””â”€â”€ useCommandPaletteStore.ts
â”‚
â”œâ”€â”€ types/                        # TypeScript type definitions
â”‚   â”œâ”€â”€ server.types.ts
â”‚   â”œâ”€â”€ alert.types.ts
â”‚   â”œâ”€â”€ user.types.ts
â”‚   â”œâ”€â”€ auth.types.ts
â”‚   â”œâ”€â”€ settings.types.ts
â”‚   â””â”€â”€ socket.types.ts
â”‚
â”œâ”€â”€ App.tsx                       # Root component with providers
â”œâ”€â”€ main.tsx                      # Entry point
â”œâ”€â”€ router.tsx                    # React Router configuration
â””â”€â”€ index.css                     # TailwindCSS + CSS variables
```

---

## 14. Environment Configuration

```env
# .env.example
VITE_API_BASE_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=iMonitorServer
VITE_TOKEN_REFRESH_INTERVAL_MS=240000    # 4 minutes (if 5min token expiry)
VITE_HEARTBEAT_TIMEOUT_MS=90000          # 90s before showing offline
VITE_ENABLE_BROWSER_NOTIFICATIONS=true
```

---

## 15. Testing Strategy (Frontend)

| Layer | Tool | Coverage Target |
|---|---|---|
| Unit (utilities, hooks, stores) | Vitest | 90%+ |
| Component (isolated rendering) | Vitest + Testing Library | 80%+ |
| Integration (page flows) | Vitest + Testing Library + MSW | Key flows |
| E2E (critical paths) | Playwright | Login â†’ Dashboard â†’ Server Detail â†’ Kill Process â†’ Alerts |
| Visual Regression | Playwright screenshots | Key pages at each breakpoint |
| Accessibility | axe-core (automated) + manual | All pages |
| Performance | Lighthouse CI | Every build |

---

## 16. Definition of Done (Frontend)

A frontend feature is considered complete when:

- [ ] Component renders correctly across all supported breakpoints
- [ ] All interactive elements are keyboard accessible
- [ ] Screen reader announces state changes correctly
- [ ] Loading, empty, and error states are handled
- [ ] Real-time updates work via WebSocket and fall back gracefully
- [ ] Role-based visibility/disabling is implemented
- [ ] Destructive actions have confirmation dialogs
- [ ] Unit/component tests pass
- [ ] No axe-core accessibility violations
- [ ] Lighthouse performance score â‰¥ 90
- [ ] No TypeScript `any` types (strict mode)
- [ ] No console errors or warnings in production build

---

This document serves as the comprehensive frontend requirements contract for **iMonitorServer**. Each section should be referenced during sprint planning, component development, and QA validation.