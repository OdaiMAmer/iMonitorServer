# iMonitorServer Frontend Requirements Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define comprehensive frontend requirements for a real-time Windows server monitoring dashboard built with React 18, TypeScript, Vite, and a dark monitoring theme inspired by Datadog and Grafana.

**Architecture:** Single-Page Application (SPA) using React 18 with TypeScript and Vite bundler. Dark glassmorphism monitoring theme with real-time WebSocket updates via Socket.IO. TanStack Query for server-state management, Zustand for client-state, shadcn/ui for components, and Recharts for data visualization.

**Tech Stack:** React 18, TypeScript 5, Vite 5, TailwindCSS 3, shadcn/ui, Recharts, React Router 6, Socket.IO Client, TanStack Query, Zustand, Lucide React, date-fns, Sonner

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

---

## 1. User Interface Requirements

### 1.1 Design Philosophy

The application follows a **dark monitoring/analytics aesthetic** inspired by Datadog, Grafana, and Uptime Kuma. The UI prioritizes information density without visual clutter, real-time data clarity, and immediate situational awareness.

**Core Design Principles:**
- **Glanceability**: Health status visible within 2 seconds of page load
- **Information Hierarchy**: Critical alerts surface above everything else
- **Visual Consistency**: Unified color language for severity across all views
- **Progressive Disclosure**: Summary first, drill into details on demand

### 1.2 Theme & Color System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0e1a` | Page background, deepest layer |
| `--bg-secondary` | `#111827` | Sidebar, top-level containers |
| `--bg-card` | `#1a2035` | Card backgrounds, panels |
| `--bg-card-hover` | `#1e2740` | Card hover state |
| `--bg-elevated` | `#222c45` | Popovers, dropdowns, modals |
| `--bg-glass` | `rgba(26, 32, 53, 0.7)` | Glassmorphism surfaces |
| `--border-default` | `rgba(255, 255, 255, 0.06)` | Default borders |
| `--border-hover` | `rgba(255, 255, 255, 0.12)` | Hover-state borders |
| `--text-primary` | `#f1f5f9` | Primary text (headings, values) |
| `--text-secondary` | `#94a3b8` | Secondary text (labels, descriptions) |
| `--text-muted` | `#64748b` | Disabled, tertiary text |
| `--accent-cyan` | `#06b6d4` | Primary accent, healthy metrics, links |
| `--accent-teal` | `#14b8a6` | Secondary accent, positive trends |
| `--status-healthy` | `#22c55e` | Server online, service running |
| `--status-warning` | `#f59e0b` | Threshold approaching, degraded |
| `--status-critical` | `#ef4444` | Alert active, server down, error |
| `--status-offline` | `#6b7280` | Server unreachable, unknown |
| `--chart-cpu` | `#06b6d4` | CPU metric line |
| `--chart-memory` | `#8b5cf6` | Memory metric line |
| `--chart-disk` | `#f59e0b` | Disk metric line |
| `--chart-network` | `#22c55e` | Network metric line |

### 1.3 Glassmorphism Card Specification

All primary content cards use the following glassmorphism treatment:

```css
.glass-card {
  background: rgba(26, 32, 53, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.glass-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### 1.4 Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Page Title | Inter | 700 | 24px / 1.75rem |
| Section Heading | Inter | 600 | 18px / 1.25rem |
| Card Title | Inter | 600 | 16px / 1rem |
| Body Text | Inter | 400 | 14px / 0.875rem |
| Label / Caption | Inter | 500 | 12px / 0.75rem |
| Metric Value (Large) | JetBrains Mono | 700 | 32px / 2rem |
| Metric Value (Small) | JetBrains Mono | 600 | 20px / 1.25rem |
| Code / Log Entry | JetBrains Mono | 400 | 13px / 0.8125rem |

### 1.5 Iconography

- **Icon Library**: Lucide React (consistent with shadcn/ui)
- **Icon Size**: 16px (inline), 20px (buttons), 24px (navigation), 32px (empty states)
- **Stroke Width**: 1.5px (default), 2px (active/selected states)
- **Status Dot**: 8px circle with respective status color + subtle glow (`box-shadow: 0 0 6px <color>`)

### 1.6 Animation & Motion

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Metric value update | Counter roll (number tween) | 300ms | `ease-out` |
| Gauge fill change | Smooth arc transition | 500ms | `ease-in-out` |
| Card entry (page load) | Fade-in + slide-up (staggered 50ms) | 400ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Alert pulse | Glow pulse on critical badge | 2000ms | `ease-in-out` (infinite) |
| Chart data point update | Smooth line transition | 300ms | `ease-out` |
| Sidebar collapse/expand | Width transition | 200ms | `ease-in-out` |
| Modal open | Fade-in overlay + scale card | 200ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Toast notification | Slide-in from top-right | 300ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Skeleton shimmer | Shimmer gradient sweep | 1500ms | `linear` (infinite) |
| Status dot pulse | Subtle scale pulse (healthy only) | 3000ms | `ease-in-out` (infinite) |

---

## 2. Screen/Page Inventory & Navigation Flows

### 2.1 Application Shell Layout

```
+----------------------------------------------------------+
|  Top Bar (56px)                                          |
|  [Logo] [Search] [Active Alerts Badge] [User Avatar]     |
+--------+-------------------------------------------------+
| Sidebar |  Main Content Area                             |
| (240px) |                                                |
| or      |  (scrollable, padded 24px)                     |
| (64px   |                                                |
| when    |                                                |
| collapsed)|                                              |
|         |                                                |
|         |                                                |
|         |                                                |
+--------+-------------------------------------------------+
```

**Top Bar (fixed, `z-index: 50`):**
- Left: App logo/name ("iMonitor"), sidebar toggle button
- Center: Global search bar (search servers by hostname/IP, Cmd+K shortcut)
- Right: Active alerts count badge (pulsing if critical), notification bell, user avatar with dropdown (profile, logout)

**Sidebar (fixed, collapsible):**
- Expanded: 240px width with icon + label
- Collapsed: 64px width with icon only + tooltip on hover
- Collapse state persisted to localStorage
- Navigation items:

| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| `LayoutDashboard` | Dashboard | `/` | - |
| `Server` | Servers | `/servers` | Server count |
| `FolderOpen` | Groups | `/groups` | Group count |
| `Bell` | Alerts | `/alerts` | Active alert count |
| `Activity` | Metrics | `/metrics` | - |
| `Settings` | Settings | `/settings` | - |

- Active item: Left cyan border (3px), slightly lighter background
- Bottom of sidebar: Collapse/expand toggle icon

### 2.2 Page Inventory

#### 2.2.1 Login Page (`/login`)

**Purpose**: Authentication entry point

**Layout**: Centered card on full-dark background, no sidebar/topbar

**Elements:**
- App logo + "iMonitorServer" title
- Email input field (with email icon)
- Password input field (with eye toggle for show/hide)
- "Remember me" checkbox
- "Sign In" primary button (full width)
- "Forgot Password?" link (triggers password reset email flow via API)
- Error message area (for invalid credentials, account locked, etc.)
- Subtle background: animated particle grid or faint server topology lines

**Behavior:**
- Submit on Enter key
- Loading spinner on button during auth request
- Redirect to `/` on success
- Display inline error on failure (shake animation on card)
- If already authenticated, redirect to `/` automatically

---

#### 2.2.2 Dashboard Page (`/`) - Main Landing

**Purpose**: At-a-glance overview of all monitored servers

**Sections (top to bottom):**

**A. Summary Stats Bar:**
```
[ Total Servers: 24 ] [ Healthy: 18 ] [ Warning: 4 ] [ Critical: 2 ] [ Offline: 0 ]
```
- Horizontal row of stat cards with large number + label
- Color-coded numbers matching status colors
- Click any stat to filter the server grid to that status

**B. Active Alerts Banner (conditional):**
- Shown only when active (unacknowledged) alerts exist
- Amber/red gradient bar: "3 active alerts require attention" + "View Alerts" link
- Dismissible per session (reappears on next critical alert)

**C. Filter & View Controls:**
- Search input (filter by hostname, IP)
- Group dropdown filter (multi-select)
- Status dropdown filter (Healthy, Warning, Critical, Offline)
- View toggle: Grid view (default) / List view
- Sort: Name (A-Z), Status (Critical first), CPU (highest), Memory (highest)

**D. Server Grid / List:**

*Grid View (default):*
- Responsive CSS Grid: `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`
- Each server card (glassmorphism):
  ```
  +-----------------------------------------------+
  |  [Status Dot] ServerName-01          [3 dots] |
  |  192.168.1.100  |  Windows Server 2022        |
  |                                               |
  |  [CPU Gauge]  [RAM Gauge]  [Disk Gauge]       |
  |    45%           72%          58%              |
  |                                               |
  |  Uptime: 45d 12h  |  Last HB: 5s ago         |
  |  [Alert Badge: 2 warnings]                    |
  +-----------------------------------------------+
  ```
- Gauges: Circular progress rings (120px diameter) with color based on value:
  - 0-70%: `--status-healthy`
  - 71-85%: `--status-warning`
  - 86-100%: `--status-critical`
- "3 dots" menu: Quick actions (View Details, Remote Desktop, Restart, Remove)
- Click card body: Navigate to `/servers/:id`

*List View:*
- Table with columns: Status, Hostname, IP, OS, CPU, RAM, Disk, Uptime, Last Heartbeat, Alerts
- Sortable columns (click header to sort)
- Row click navigates to server detail

**E. Real-Time Behavior:**
- WebSocket pushes metric updates every 5 seconds
- Gauge animations smoothly transition to new values
- Heartbeat timestamp updates relative time ("5s ago", "30s ago")
- Server card border briefly glows cyan on data update
- Card moves to top if status changes to Critical (with subtle animation)

---

#### 2.2.3 Server Detail Page (`/servers/:id`)

**Purpose**: Deep-dive monitoring for a single server

**Header Section:**
```
+------------------------------------------------------------------+
| [Back Arrow]  ServerName-01                    [Status: Healthy]  |
| 192.168.1.100  |  Windows Server 2022  |  Uptime: 45d 12h       |
| Group: Production Servers                                         |
| [Restart] [Shutdown] [RDP Connect] [More Actions ...]            |
+------------------------------------------------------------------+
```

**Tab Navigation:**
Horizontal tab bar below header. Active tab: underline with cyan accent.

| Tab | Icon | Route Suffix |
|-----|------|-------------|
| Overview | `Activity` | `/overview` (default) |
| Processes | `Cpu` | `/processes` |
| Services | `Settings2` | `/services` |
| Event Logs | `FileText` | `/event-logs` |
| Network | `Network` | `/network` |
| Hardware | `HardDrive` | `/hardware` |
| Remote | `Terminal` | `/remote` |

---

##### Tab: Overview (`/servers/:id/overview`)

**Real-time metric gauges (top row):**
- 4 large circular gauges in a row: CPU, Memory, Disk, Network
- Each gauge: 160px diameter, percentage in center (monospace font), label below
- Below each gauge: small sparkline showing last 60 data points (5 minutes)

**Time-series charts (main area):**
- 2x2 grid of Recharts `AreaChart` components:
  - CPU Usage (%) over time
  - Memory Usage (%) over time
  - Disk I/O (MB/s read + write, dual lines)
  - Network I/O (Mbps in + out, dual lines)
- Time range selector: `[1h] [6h] [24h] [7d] [30d]` (toggle buttons)
- All charts share the same time range
- Tooltip on hover showing exact values at time point
- Y-axis auto-scales; X-axis shows time labels
- Smooth line with gradient fill below
- Chart area has subtle grid lines (`rgba(255,255,255,0.05)`)

**Quick info cards (bottom row):**
- Top 5 CPU-consuming processes (mini table)
- Stopped services count (warning if > 0)
- Recent alerts (last 3, with severity icon)
- Disk partitions usage (horizontal bars per drive letter)

---

##### Tab: Processes (`/servers/:id/processes`)

**Layout**: Full-width data table

**Controls:**
- Search input (filter by process name or PID)
- Refresh button (manual refresh alongside auto-update)
- Column visibility toggle

**Table Columns:**
| Column | Width | Sortable | Details |
|--------|-------|----------|---------|
| PID | 80px | Yes | Numeric process ID |
| Name | flex | Yes | Process name, bold |
| CPU % | 100px | Yes | Bar + number, color-coded |
| Memory | 120px | Yes | MB value + % of total |
| Threads | 80px | Yes | Thread count |
| Start Time | 150px | Yes | Formatted datetime |
| Actions | 80px | No | Kill button (red, with confirmation) |

**Behavior:**
- Default sort: CPU % descending
- Kill process: Click kill icon -> confirmation dialog ("Kill process {name} (PID: {pid})? This action cannot be undone.") -> API call -> toast notification on success/failure
- Auto-updates every 10 seconds via WebSocket
- Row highlight on hover
- Virtualized table (TanStack Virtual) for 500+ processes

---

##### Tab: Services (`/servers/:id/services`)

**Layout**: Card list or table (toggle)

**Controls:**
- Search input (filter by service name)
- Status filter: `[All] [Running] [Stopped] [Starting] [Stopping]`
- View toggle: Cards / Table

**Service Card:**
```
+-----------------------------------------------+
| [Status Dot] Windows Update Service    Running |
| wuauserv                                       |
| Startup: Automatic                             |
| [Stop] [Restart]                               |
+-----------------------------------------------+
```

**Service Table Columns:**
| Column | Sortable | Details |
|--------|----------|---------|
| Status | Yes | Colored dot + text |
| Display Name | Yes | Full service name |
| Service Name | Yes | Internal name (monospace) |
| Startup Type | Yes | Automatic / Manual / Disabled |
| Actions | No | Start / Stop / Restart buttons (contextual) |

**Behavior:**
- Start/Stop/Restart: Confirmation dialog -> API call -> real-time status update via WebSocket
- Disabled state for actions that don't apply (e.g., can't stop an already-stopped service)
- Loading spinner on action button during API call

---

##### Tab: Event Logs (`/servers/:id/event-logs`)

**Layout**: Filterable log viewer

**Filter Bar:**
- Log Source: `[System] [Application] [Security]` (toggle buttons, multi-select)
- Severity: `[Error] [Warning] [Information]` (toggle buttons, multi-select, color-coded)
- Date Range: Start date + End date (date pickers)
- Search: Full-text search across event message

**Log Table:**
| Column | Width | Details |
|--------|-------|---------|
| Severity Icon | 40px | Red circle (Error), Yellow triangle (Warning), Blue info (Info) |
| Timestamp | 180px | `YYYY-MM-DD HH:mm:ss` format |
| Source | 150px | Log source name |
| Event ID | 80px | Numeric event ID |
| Message | flex | Truncated to 2 lines, expandable |

**Behavior:**
- Click row to expand full message in a slide-out panel or inline expansion
- Infinite scroll with windowed rendering (TanStack Virtual)
- Real-time new entries stream in at top (with "New entries" indicator if scrolled down)
- Export to CSV button

---

##### Tab: Network (`/servers/:id/network`)

**Layout**: Split view

**Top Section - Bandwidth Charts:**
- Dual area chart: Inbound (green) / Outbound (cyan) bandwidth (Mbps)
- Time range selector shared with Overview charts
- Per-interface breakdown (dropdown to select NIC)

**Bottom Section - Active Connections Table:**
| Column | Details |
|--------|---------|
| Protocol | TCP / UDP |
| Local Address | IP:Port |
| Remote Address | IP:Port |
| State | ESTABLISHED, LISTENING, TIME_WAIT, etc. |
| PID | Associated process ID |
| Process | Process name |

**Additional:**
- Open Ports summary card (list of listening ports with service name)
- Network interface cards showing: name, IP, MAC, speed, status

---

##### Tab: Hardware (`/servers/:id/hardware`)

**Layout**: Static information cards (2-column grid)

**Cards:**
- **System**: Hostname, OS Version, OS Build, Architecture, Install Date
- **Processor**: Model, Cores (physical/logical), Base Speed, Cache sizes
- **Memory**: Total RAM, Type (DDR4/DDR5), Speed, Slots used/total
- **Storage**: Per-drive: Model, Size, Type (SSD/HDD), Health, Partitions
- **Network Adapters**: Per-adapter: Name, MAC, Speed, IPv4, IPv6, Status
- **BIOS/Firmware**: Vendor, Version, Date

**Behavior:**
- Data fetched once on tab mount (not real-time)
- Cached for 1 hour (staleTime in TanStack Query)
- Refresh button to force re-fetch

---

##### Tab: Remote (`/servers/:id/remote`)

**Layout**: Action cards

**Cards:**
- **Remote Desktop (RDP)**:
  - "Connect via RDP" button -> launches `rdp://` URI scheme or downloads `.rdp` file
  - Shows connection info: IP, Port (3389 default), last RDP session time
  - Optional: stored credentials (shown as masked, with reveal toggle)

- **Power Controls**:
  - "Restart Server" button (amber, with `RotateCw` icon)
  - "Shutdown Server" button (red, with `Power` icon)
  - Both require **double confirmation**:
    1. First click: "Are you sure you want to restart ServerName-01?"
    2. Type server name to confirm: input field requiring exact hostname match
  - Timer shows: "Server restarting... Last heartbeat: 30s ago" with spinner

- **Command Execution** (Admin only):
  - PowerShell command input (monospace textarea)
  - "Execute" button with output display area below
  - Command history (last 10 commands, clickable to re-run)
  - Output displayed in terminal-style monospace block
  - Warning banner: "Commands execute with SYSTEM privileges. Use with caution."

---

#### 2.2.4 Server Groups Page (`/groups`)

**Purpose**: Organize servers into logical groups

**Layout:**

**Group Cards Grid** (similar to dashboard but for groups):
```
+-------------------------------------------+
| [Folder Icon]  Production Servers    [...]|
| 12 servers  |  10 healthy  |  2 warning   |
|                                           |
| [Mini health bar: ||||||||||||  |||   ]   |
|                                           |
| Tags: web, critical                       |
+-------------------------------------------+
```

**Actions:**
- Create Group: Modal with name, description, color, tags
- Edit Group: Same modal, pre-filled
- Delete Group: Confirmation dialog ("This will NOT delete the servers, only the group")
- Assign Servers: Drag-and-drop interface or multi-select modal
  - Left panel: Unassigned servers (or all servers)
  - Right panel: Servers in this group
  - Drag between panels or use arrow buttons
- Bulk Actions menu: Restart all, View combined metrics

**Click group card**: Navigate to `/groups/:id` showing the dashboard view filtered to that group's servers

---

#### 2.2.5 Metrics Page (`/metrics`)

**Purpose**: Cross-server metric comparison and historical analysis

**Layout:**

**A. Time Range & Server Selector (top bar):**
- Time range selector: `[1h] [6h] [24h] [7d] [30d]` (toggle buttons)
- Server multi-select dropdown: Choose 1-5 servers to compare (type-ahead search)
- Group filter: Filter server selection by group
- Metric selector: `[CPU] [Memory] [Disk] [Network]` (toggle, multi-select)

**B. Comparison Charts (main area):**
- Large `AreaChart` per selected metric, with one line per selected server
- Each server line uses a unique color from a distinct palette
- Legend shows server hostnames with color indicators, clickable to toggle visibility
- Tooltip shows all servers' values at the hovered time point
- Charts stack vertically: CPU chart, then Memory, then Disk, then Network

**C. Summary Statistics (right sidebar or bottom cards):**
- Per-server summary cards showing: Average, Min, Max, Current for each selected metric over the time range
- Highlight the "worst" value in red (e.g., highest average CPU)

**Behavior:**
- Data fetched via `GET /servers/metrics/compare?serverIds=&range=&metrics=`
- Charts animate on initial load and on time range change
- URL state: Selected servers, time range, and metrics are encoded in URL query params (shareable links)
- Empty state: "Select servers to compare metrics" with illustration

---

#### 2.2.6 Alerts Page (`/alerts`)

**Purpose**: View, configure, and manage alerts

**Sub-navigation tabs:**
- Active Alerts (`/alerts/active`)
- Alert Rules (`/alerts/rules`)
- Alert History (`/alerts/history`)

---

##### Sub-tab: Active Alerts (`/alerts/active`)

**Layout**: Alert list with actions

**Alert Card:**
```
+---------------------------------------------------------------+
| [!] CRITICAL   CPU usage at 95%              2 min ago        |
| Server: WebServer-01 (192.168.1.100)                          |
| Rule: CPU > 90% for 5 minutes                                 |
|                                                               |
| [Acknowledge] [View Server] [Mute 1h]                        |
+---------------------------------------------------------------+
```

**Sorting**: Critical first, then Warning, then by time (newest first)

**Behavior:**
- Acknowledge: Marks alert as seen, moves to history, stops notifications
- Mute: Suppresses re-notification for selected duration (1h, 4h, 24h, custom)
- Real-time: New alerts appear at top with slide-in animation + sound option
- Bulk acknowledge: Checkbox selection + "Acknowledge Selected" button

---

##### Sub-tab: Alert Rules (`/alerts/rules`)

**Layout**: Rules table with CRUD

**Rule Configuration (Create/Edit Modal):**

| Field | Type | Options |
|-------|------|---------|
| Name | Text input | User-defined rule name |
| Server(s) | Multi-select dropdown | Specific servers or "All Servers" |
| Group(s) | Multi-select dropdown | Apply to entire group |
| Metric | Dropdown | CPU %, Memory %, Disk %, Network In/Out, Service Status, Heartbeat |
| Condition | Dropdown + input | `>`, `<`, `>=`, `<=`, `==` + threshold value |
| Duration | Input + unit | Condition must persist for N minutes |
| Severity | Dropdown | Warning, Critical |
| Notify via | Checkboxes | In-App, Email, Webhook |
| Recipients (Email) | Tag input | Email addresses |
| Webhook | Select dropdown | Pre-configured webhooks from Settings > Webhooks (select one or none) |
| Enabled | Toggle | Active/inactive |

**Rules Table Columns:**
| Column | Details |
|--------|---------|
| Enabled | Toggle switch |
| Name | Rule name |
| Metric | What's monitored |
| Condition | Human-readable (e.g., "CPU > 90% for 5m") |
| Targets | Server/Group names (truncated, tooltip for full list) |
| Channels | Icons for In-App / Email / Webhook |
| Last Triggered | Relative time |
| Actions | Edit, Duplicate, Delete |

---

##### Sub-tab: Alert History (`/alerts/history`)

**Layout**: Paginated table

**Columns:**
| Column | Details |
|--------|---------|
| Severity | Icon + color |
| Message | Alert description |
| Server | Server name (link to detail) |
| Rule | Rule name |
| Triggered At | Timestamp |
| Resolved At | Timestamp (or "Active") |
| Duration | How long alert was active |
| Acknowledged By | Username |

**Filters**: Severity, Server, Date range, Resolved/Unresolved

---

#### 2.2.7 Settings Page (`/settings`)

**Purpose**: Application configuration

**Sub-navigation tabs:**
- Users (`/settings/users`)
- SMTP (`/settings/smtp`)
- Webhooks (`/settings/webhooks`)
- General (`/settings/general`)

---

##### Sub-tab: Users (`/settings/users`)

**Layout**: User management table (Admin only)

**Users Table:**
| Column | Details |
|--------|---------|
| Avatar | Initials circle with generated color |
| Name | Full name |
| Email | Email address |
| Role | Badge: Admin (purple), Operator (blue), Viewer (gray) |
| Last Active | Relative time |
| Status | Active / Disabled |
| Actions | Edit, Disable/Enable, Delete |

**Create/Edit User Modal:**
- Name (text input, required)
- Email (email input, required, unique)
- Password (password input, min 8 chars, show strength indicator)
- Role (select: Admin, Operator, Viewer)
- Server Group Access (multi-select, only for Operator/Viewer roles)

**Role Definitions (visible as info tooltip):**
| Role | Permissions |
|------|------------|
| Admin | Full access: all servers, settings, user management |
| Operator | View all servers, execute remote actions, manage alerts |
| Viewer | Read-only access to assigned server groups |

---

##### Sub-tab: SMTP (`/settings/smtp`)

**Layout**: Configuration form

**Fields:**
- SMTP Host (text input)
- SMTP Port (number input, default 587)
- Use TLS (toggle, default on)
- Username (text input)
- Password (password input, masked)
- From Address (email input)
- From Name (text input)
- "Test Connection" button -> sends test email to current user's address
- "Save" button

**Behavior:**
- Test shows inline result: success (green check) or failure (red X with error message)
- Password field shows "unchanged" placeholder when editing existing config

---

##### Sub-tab: Webhooks (`/settings/webhooks`)

**Layout**: Webhook list + add form

**Webhook Card:**
```
+-----------------------------------------------+
| Slack - #alerts                        [Edit] |
| https://hooks.slack.com/services/T.../B.../... |
| Events: Critical, Warning                      |
| Last triggered: 2h ago  |  Status: Active     |
| [Test] [Delete]                               |
+-----------------------------------------------+
```

**Add/Edit Webhook Modal:**
- Name (text input, e.g., "Slack Alerts")
- URL (text input, required, validated)
- Events (checkboxes: Critical Alerts, Warning Alerts, Server Down, Server Recovery)
- Headers (optional key-value pairs for custom headers)
- Active (toggle)
- "Test Webhook" button -> sends sample payload -> shows response status

---

##### Sub-tab: General (`/settings/general`)

**Fields:**
- Application Name (text input, shown in sidebar and login)
- Heartbeat Interval (number, seconds, default 30, min 10, max 300)
- Metric Retention Period (dropdown: 7 days, 30 days, 90 days, 1 year)
- Session Timeout (dropdown: 30 min, 1 hour, 4 hours, 8 hours)
- Alert Sound (toggle: enable/disable browser notification sound)
- Auto-refresh Interval (dropdown: 5s, 10s, 30s, 1m, disabled) — *This controls the polling fallback interval for non-WebSocket data (event logs, hardware info). Real-time metrics always use WebSocket push regardless of this setting.*
- "Save" button

---

#### 2.2.8 Profile Page (`/profile`)

**Purpose**: Current user's personal account settings

**Layout**: Simple form page

**Fields:**
- Display Name (text input, pre-filled)
- Email (read-only, shown as text)
- Role (read-only badge)
- **Change Password** section:
  - Current Password (password input)
  - New Password (password input, with strength indicator)
  - Confirm New Password (password input)
  - "Update Password" button
- "Save Profile" button (for name changes)

**Behavior:**
- Accessible from top-bar user avatar dropdown -> "Profile"
- Password change requires current password verification
- Show success toast on save

---

#### 2.2.9 Not Found Page (`/*` catch-all)

**Purpose**: Graceful handling of invalid routes

**Layout**: Centered content on full-dark background

**Elements:**
- Large "404" in muted text
- "Page Not Found" heading
- "The page you're looking for doesn't exist or has been moved." description
- "Back to Dashboard" primary button (links to `/`)
- Subtle server/monitor illustration (decorative)

---

#### 2.2.10 Error Boundary Pages

**Purpose**: Graceful recovery from unexpected rendering errors

**Global Error Boundary:**
- Catches any uncaught React rendering error
- Shows: "Something went wrong" heading, error details (dev only), "Reload Page" button
- Logs error to console (and optionally to error tracking service)

**Route-Level Error Boundaries:**
- Each major route (`/servers/:id`, `/alerts`, `/settings`) has its own error boundary
- On error: Shows error message within the app shell (sidebar/topbar remain functional)
- "Try Again" button re-mounts the failed component
- Navigation to other pages continues to work

**Chart Error Boundary:**
- Wraps each Recharts chart individually
- On error (e.g., malformed data): Shows "Unable to render chart" placeholder with "Retry" button
- Prevents a single chart failure from crashing the entire page

---

### 2.3 Navigation Flow Diagram

```
Login ──> Dashboard (/)
              │
              ├──> Server Card Click ──> Server Detail (/servers/:id)
              │                              ├── Overview (default)
              │                              ├── Processes
              │                              ├── Services
              │                              ├── Event Logs
              │                              ├── Network
              │                              ├── Hardware
              │                              └── Remote
              │
              ├──> Groups (/groups)
              │       └──> Group Detail (/groups/:id) ──> Filtered Dashboard
              │
              ├──> Alerts (/alerts)
              │       ├── Active Alerts
              │       ├── Alert Rules
              │       └── Alert History
              │
              ├──> Metrics (/metrics)
              │       └── Cross-server metric comparison charts
              │
              ├──> Settings (/settings)  [Admin only]
              │       ├── Users
              │       ├── SMTP
              │       ├── Webhooks
              │       └── General
              │
              ├──> Profile (/profile)
              │       └── Change password, update display name
              │
              └──> Not Found (/*) ──> 404 page with "Back to Dashboard" link
```

**Protected Routes:**
- All routes except `/login` require authentication
- `/settings/users` requires Admin role
- `/settings/smtp`, `/settings/webhooks` require Admin role
- Server Remote tab (command execution) requires Admin role
- Process kill, service control, power actions require Operator or Admin role

---

## 3. Component Library & Design System

### 3.1 Base Component Library

Use **shadcn/ui** as the foundation, customized with the dark monitoring theme. All shadcn components will be installed into `src/components/ui/` and themed via `tailwind.config.ts` and CSS variables.

**shadcn/ui components to install:**
- Button, Input, Label, Select, Checkbox, Switch, Toggle
- Card, Badge, Separator
- Dialog, AlertDialog, Sheet, Popover, Tooltip, DropdownMenu
- Table, Tabs, Pagination
- Avatar, Skeleton, Progress
- Command (for Cmd+K search)
- Sonner (toast notifications, shadcn/ui default integration)
- Form (with React Hook Form integration)

### 3.2 Custom Component Inventory

Beyond shadcn/ui, the following custom components are required:

#### 3.2.1 Data Display Components

| Component | Props | Description |
|-----------|-------|-------------|
| `CircularGauge` | `value`, `max`, `size`, `label`, `colorThresholds` | Circular progress ring with center value. Used for CPU/RAM/Disk gauges. |
| `SparklineChart` | `data`, `color`, `width`, `height` | Tiny inline line chart (no axes). Used in server cards and summary. |
| `MetricCard` | `title`, `value`, `unit`, `trend`, `icon` | Stat card with large number, label, optional up/down trend arrow. |
| `StatusDot` | `status: 'healthy'|'warning'|'critical'|'offline'` | Colored circle with glow effect. |
| `StatusBadge` | `status`, `label` | Badge pill with status color and text. |
| `HealthBar` | `healthy`, `warning`, `critical`, `offline` | Horizontal stacked bar showing proportional server health. |
| `TimeAgo` | `timestamp` | Auto-updating relative time display ("5s ago", "2m ago"). |
| `AnimatedNumber` | `value`, `duration`, `format` | Number that smoothly tweens between values. |

#### 3.2.2 Chart Components (Recharts wrappers)

| Component | Chart Type | Usage |
|-----------|-----------|-------|
| `MetricAreaChart` | AreaChart | CPU, Memory time-series with gradient fill |
| `DualLineChart` | LineChart | Network I/O, Disk I/O (two lines) |
| `BandwidthChart` | AreaChart | Network bandwidth in/out |
| `DiskUsageBar` | BarChart (horizontal) | Per-partition disk usage |
| `AlertTimeline` | Custom | Alert occurrences on time axis |

**Shared chart configuration:**
- Dark theme: `#0a0e1a` background, `rgba(255,255,255,0.05)` grid lines
- Tooltip: Dark card with glassmorphism, white text
- Legend: Bottom-aligned, muted text, clickable to toggle series
- Responsive: Use `ResponsiveContainer` from Recharts
- Time range selector: Reusable `TimeRangeSelector` component

#### 3.2.3 Layout Components

| Component | Description |
|-----------|-------------|
| `AppShell` | Top bar + sidebar + main content area wrapper |
| `Sidebar` | Collapsible navigation sidebar with route items |
| `TopBar` | Fixed header with search, alerts, user menu |
| `PageHeader` | Page title + breadcrumb + action buttons |
| `GlassCard` | Glassmorphism card container (wraps any content) |
| `TabNav` | Horizontal tab navigation with URL sync |
| `EmptyState` | Illustrated empty state with message and action button |
| `LoadingState` | Skeleton layout matching the expected content structure |

#### 3.2.4 Data Table Components

| Component | Description |
|-----------|-------------|
| `DataTable` | Full-featured table with sort, filter, pagination, column visibility. Built on TanStack Table. |
| `VirtualTable` | Virtualized version for large datasets (500+ rows). Uses TanStack Virtual. |
| `SearchInput` | Debounced search input with clear button and Cmd+K hint. |
| `ColumnSelector` | Dropdown to toggle column visibility. |

#### 3.2.5 Form Components

| Component | Description |
|-----------|-------------|
| `ConfirmDialog` | Standard confirmation dialog with customizable title/message/buttons. |
| `DangerConfirmDialog` | Double-confirmation dialog requiring text input match. For destructive server actions. |
| `TagInput` | Multi-value input (for email recipients, tags). |
| `DateRangePicker` | Start/end date selector with presets (Today, Last 7d, Last 30d). |
| `KeyValueEditor` | Dynamic key-value pair list (for webhook headers). |

#### 3.2.6 Feedback Components

| Component | Description |
|-----------|-------------|
| `AlertBanner` | Full-width banner for active alerts on dashboard. |
| `ConnectionStatus` | WebSocket connection indicator (green dot = connected, amber = reconnecting, red = disconnected). Bottom-right fixed. See detailed behavior below. |
| `LiveIndicator` | "LIVE" badge with pulsing dot for real-time views. |
| `StaleDataBanner` | Full-width warning banner shown when WebSocket is disconnected for > 30s: "Live updates paused. Data may be stale. Reconnecting..." |
| `NotificationPermission` | One-time prompt card asking user to enable browser notifications. Shown on first login or when user enables Alert Sound toggle. Dismissible, with "Enable" and "Not Now" buttons. |

**WebSocket Reconnection UX Specification:**

| Connection State | Indicator | Dashboard Behavior | Detail Page Behavior |
|-----------------|-----------|-------------------|---------------------|
| Connected | Green dot, "Connected" tooltip | Normal real-time updates | Normal real-time updates |
| Reconnecting (< 30s) | Amber dot, pulsing, "Reconnecting..." tooltip | Metrics freeze at last value, no visual degradation | Metrics freeze, subtle amber border on charts |
| Disconnected (> 30s) | Red dot, "Disconnected" tooltip | `StaleDataBanner` appears above server grid. All `TimeAgo` components show "(stale)" suffix. Metric values dim to 50% opacity. | `StaleDataBanner` appears. Charts show "Last updated: X ago" overlay. Process/service data shows stale warning. |
| Reconnected | Green dot, brief "Reconnected" toast | Full data refresh triggered (invalidate all queries). Banner dismissed. Values animate to new state. | Full tab data refetch. Banner dismissed. |

**Browser Notification Permission Flow:**
1. User logs in for the first time (or enables "Alert Sound" in Settings)
2. `NotificationPermission` card appears as a non-blocking banner below the top bar
3. User clicks "Enable" -> browser permission dialog appears
4. If granted: store permission state in localStorage, dismiss banner, enable push notifications
5. If denied: dismiss banner, fall back to in-app toasts only, do not prompt again
6. If "Not Now": dismiss banner, re-prompt after 7 days (stored in localStorage)

### 3.3 Design Tokens (Tailwind Extension)

```typescript
// tailwind.config.ts theme extension
{
  colors: {
    bg: {
      primary: '#0a0e1a',
      secondary: '#111827',
      card: '#1a2035',
      'card-hover': '#1e2740',
      elevated: '#222c45',
      glass: 'rgba(26, 32, 53, 0.7)',
    },
    accent: {
      cyan: '#06b6d4',
      teal: '#14b8a6',
    },
    status: {
      healthy: '#22c55e',
      warning: '#f59e0b',
      critical: '#ef4444',
      offline: '#6b7280',
    },
    chart: {
      cpu: '#06b6d4',
      memory: '#8b5cf6',
      disk: '#f59e0b',
      network: '#22c55e',
    },
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  borderRadius: {
    glass: '12px',
  },
  boxShadow: {
    glass: '0 4px 24px rgba(0, 0, 0, 0.2)',
    'glass-hover': '0 8px 32px rgba(0, 0, 0, 0.3)',
    glow: '0 0 6px var(--glow-color)',
  },
}
```

---

## 4. Accessibility & Responsiveness

### 4.1 Accessibility Requirements (WCAG 2.1 AA)

#### 4.1.1 Color & Contrast

- All text must meet **4.5:1** contrast ratio against its background (AA standard)
- Large text (18px+ or 14px+ bold): **3:1** minimum
- Status colors must NOT be the sole indicator; always pair with:
  - Icons (checkmark for healthy, triangle for warning, circle-X for critical)
  - Text labels ("Healthy", "Warning", "Critical")
- Focus indicators: 2px solid cyan outline on all interactive elements (visible against dark background)

**Contrast Verification Required:**
| Foreground | Background | Ratio | Pass? |
|-----------|-----------|-------|-------|
| `#f1f5f9` (primary text) | `#1a2035` (card) | 11.2:1 | Yes |
| `#94a3b8` (secondary text) | `#1a2035` (card) | 5.1:1 | Yes |
| `#64748b` (muted text) | `#1a2035` (card) | 3.2:1 | AA Large only |
| `#06b6d4` (cyan accent) | `#1a2035` (card) | 5.8:1 | Yes |
| `#22c55e` (healthy) | `#1a2035` (card) | 6.4:1 | Yes |
| `#f59e0b` (warning) | `#1a2035` (card) | 7.1:1 | Yes |
| `#ef4444` (critical) | `#1a2035` (card) | 4.6:1 | Yes |

#### 4.1.2 Keyboard Navigation

- All interactive elements reachable via Tab key
- Tab order follows visual layout (left-to-right, top-to-bottom)
- Escape key closes all modals, popovers, and dropdown menus
- Enter/Space activates buttons and toggles
- Arrow keys navigate within:
  - Tab bars (left/right)
  - Dropdown menus (up/down)
  - Server grid (arrow navigation between cards)
- Global shortcuts:
  - `Cmd/Ctrl + K`: Open global search
  - `Escape`: Close search, close modal, deselect
  - `?`: Show keyboard shortcuts help dialog

#### 4.1.3 Screen Reader Support

- All pages have unique `<title>` tags (e.g., "Dashboard - iMonitorServer")
- Semantic HTML: `<nav>`, `<main>`, `<aside>`, `<header>`, `<section>`, `<article>`
- ARIA landmarks for sidebar (`role="navigation"`), main content (`role="main"`)
- All images/icons have `aria-label` or `aria-hidden="true"` (decorative)
- Live regions for real-time updates:
  - `aria-live="polite"` for metric value updates
  - `aria-live="assertive"` for new critical alerts
- Table headers use `<th scope="col">` and `<th scope="row">`
- Form inputs have associated `<label>` elements (via `htmlFor` or wrapping)
- Error messages linked to inputs via `aria-describedby`
- Loading states announced: `aria-busy="true"` on containers

#### 4.1.4 Motion & Reduced Motion

- All animations respect `prefers-reduced-motion: reduce`:
  - Disable counter roll animations (show final value immediately)
  - Disable card entry animations (show immediately)
  - Reduce gauge transitions to 0ms
  - Keep essential state changes (e.g., color changes for status)
- Pulsing animations (alert badge, status dot) stop under reduced motion
- No content depends solely on animation to be understood

### 4.2 Responsiveness

#### 4.2.1 Breakpoint System

| Breakpoint | Width | Layout Changes |
|-----------|-------|---------------|
| `2xl` | >= 1536px | 4-column server grid, full sidebar |
| `xl` | >= 1280px | 3-column server grid, full sidebar |
| `lg` | >= 1024px | 2-column server grid, collapsible sidebar |
| `md` | >= 768px | 2-column server grid, sidebar auto-collapsed |
| `sm` | >= 640px | 1-column server grid, sidebar hidden (hamburger) |

#### 4.2.2 Responsive Behavior by Component

**Sidebar:**
- `>= 1024px`: Fixed sidebar, user can toggle expanded/collapsed
- `768px - 1023px`: Auto-collapsed (icon-only), expand on hover or toggle
- `< 768px`: Hidden, accessible via hamburger menu (slide-over sheet)

**Server Grid:**
- Uses CSS Grid with `auto-fill` and `minmax(320px, 1fr)`
- Cards maintain minimum 320px width
- Below 640px: Single column, cards stretch full width

**Charts:**
- Always use `ResponsiveContainer` (100% width, fixed height)
- Below 768px: 2x2 chart grid becomes single-column stack
- Touch-friendly tooltips (tap instead of hover on mobile)

**Data Tables:**
- Below 1024px: Hide less-important columns (configurable per table)
- Below 768px: Switch to card-based list layout for critical tables (processes, services)
- Horizontal scroll wrapper for tables that must show all columns

**Top Bar:**
- Below 768px: Search bar collapses to icon (expands on tap)
- User menu becomes simplified (icon only, dropdown stays)

**Server Detail Tabs:**
- Below 768px: Tab bar becomes scrollable horizontal list
- Below 640px: Tab bar becomes a dropdown select

#### 4.2.3 Target Resolution

- **Primary**: 1920x1080 (Full HD) - optimized for this resolution
- **Supported**: 1366x768 to 3840x2160 (4K)
- **Minimum**: 1024x768 (tablet landscape) for full functionality
- **Mobile (< 768px)**: Functional but reduced feature set (view-only, no remote actions)

---

## 5. Performance Requirements

### 5.1 Loading Performance

> **Note:** All loading performance targets assume deployment on a local network or low-latency corporate intranet. For higher-latency environments (VPN, remote sites), add ~500ms to FCP/LCP targets.

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse (Simulated Throttling) |
| Largest Contentful Paint (LCP) | < 2.0s | Lighthouse (Simulated Throttling) |
| Time to Interactive (TTI) | < 2.5s | Lighthouse (Simulated Throttling) |
| Total Blocking Time (TBT) | < 150ms | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.05 | Lighthouse |
| Initial JS Bundle (app code only) | < 120KB gzipped | Vite build output |
| Total Initial Transfer (app + vendor) | < 300KB gzipped | Vite build output (shell + react-core + ui-base) |

### 5.2 Bundle Optimization

**Code Splitting Strategy:**
```
Entry: main.tsx (shell + router)
├── Chunk: login.lazy.tsx (~15KB)
├── Chunk: dashboard.lazy.tsx (~40KB)
├── Chunk: server-detail.lazy.tsx (~60KB)
│   ├── Chunk: processes-tab.lazy.tsx (~20KB)
│   ├── Chunk: services-tab.lazy.tsx (~15KB)
│   ├── Chunk: event-logs-tab.lazy.tsx (~15KB)
│   ├── Chunk: network-tab.lazy.tsx (~20KB)
│   ├── Chunk: hardware-tab.lazy.tsx (~10KB)
│   └── Chunk: remote-tab.lazy.tsx (~15KB)
├── Chunk: alerts.lazy.tsx (~30KB)
├── Chunk: groups.lazy.tsx (~20KB)
├── Chunk: settings.lazy.tsx (~25KB)
└── Vendor chunks:
    ├── recharts (~80KB gzipped, loaded on dashboard/detail)
    ├── react-core (~45KB gzipped)
    └── ui-components (~30KB gzipped)
```

**Implementation:**
- React.lazy + Suspense for all route-level components
- Vite `manualChunks` configuration for vendor splitting
- Recharts loaded only when chart views are accessed
- Prefetch adjacent routes on hover (e.g., hovering server card prefetches detail page)

### 5.3 Runtime Performance

| Scenario | Target | Approach |
|----------|--------|----------|
| Dashboard with 100 servers | < 16ms frame time (60fps) | Virtual grid if > 50 cards, staggered render. **Note:** `backdrop-filter: blur()` is disabled on virtualized cards at scale (> 50); use solid `bg-glass` fallback instead to preserve GPU performance. |
| Process table (1000+ rows) | Smooth scroll | TanStack Virtual with 30-row overscan |
| Event log (10,000+ entries) | Smooth scroll, < 100ms filter | Virtual list, debounced search (300ms) |
| Chart with 30d data (43,200 points) | < 100ms render | Data downsampling (max 500 points per chart) |
| WebSocket update (100 servers) | < 50ms to reflect | Batched state updates, selective re-renders |
| Global search | < 100ms results | Client-side fuzzy search (fuse.js) on cached server list |

### 5.4 Caching Strategy

| Data | Cache Duration | Invalidation |
|------|---------------|-------------|
| Server list | 30s (staleTime) | WebSocket heartbeat updates |
| Server metrics (real-time) | 5s | WebSocket push |
| Historical metrics | 5m (staleTime) | Manual refresh or time range change |
| Process list | 10s | WebSocket push or manual refresh |
| Service list | 30s | WebSocket push on status change |
| Event logs | 1m | Polling or manual refresh |
| Hardware info | 1h | Manual refresh |
| User list | 5m | Mutation invalidation |
| App settings | 10m | Mutation invalidation |
| Alert rules | 5m | Mutation invalidation |

### 5.5 Skeleton Loading

Every page and tab must display a skeleton loading state that matches the final layout:
- Dashboard: Grid of skeleton server cards with placeholder gauges
- Server Detail tabs: Skeleton table rows, skeleton chart areas
- Settings: Skeleton form fields
- Skeletons use shimmer animation (`1500ms linear infinite`)
- Transition from skeleton to content: Fade-in (200ms)

---

## 6. Browser/Device Compatibility Matrix

### 6.1 Browser Support

| Browser | Minimum Version | Support Level |
|---------|----------------|--------------|
| Chrome | 100+ | Full (primary) |
| Edge | 100+ | Full |
| Firefox | 100+ | Full |
| Safari | 15.4+ | Full |
| Safari iOS | 15.4+ | View-only |
| Chrome Android | 100+ | View-only |

**"Full"**: All features including real-time updates, remote actions, charts
**"View-only"**: Dashboard viewing, alerts, no remote actions (mobile constraint)

### 6.2 Required Browser APIs

| API | Used For | Fallback |
|-----|---------|----------|
| WebSocket | Real-time updates | Long-polling (Socket.IO automatic) |
| CSS `backdrop-filter` | Glassmorphism | Solid background color |
| CSS Grid | Page layouts | Not required (all targets support) |
| Intersection Observer | Virtual scroll, lazy load | Eager load |
| ResizeObserver | Responsive charts | Window resize listener |
| Notification API | Browser alert notifications | In-app only |
| Clipboard API | Copy server IP, copy commands | Manual selection |

### 6.3 Device Support

| Device | Screen Size | Touch | Support |
|--------|------------|-------|---------|
| Desktop (primary) | 1920x1080+ | No | Full |
| Laptop | 1366x768+ | No/Yes | Full |
| Tablet Landscape | 1024x768+ | Yes | Full (adapted) |
| Tablet Portrait | 768x1024+ | Yes | Reduced (view + alerts) |
| Phone | < 768px | Yes | View-only (dashboard + alerts) |

---

## 7. Internationalization Requirements

### 7.1 Current Scope

**Phase 1: English only** (en-US)

The application will be built in English only for the initial release. However, the architecture must be **i18n-ready** to support future localization without refactoring.

### 7.2 i18n-Ready Architecture

**Requirements for future-proofing:**

1. **No hardcoded user-facing strings in components**
   - All UI text (labels, messages, tooltips, errors) must be extracted to a central location
   - Use a constants file or translation key pattern: `t('dashboard.serverCount')` style approach
   - Acceptable: Keep strings in a `src/constants/` or `src/locales/en.ts` file

2. **Date/Time Formatting**
   - Use `date-fns` with locale support for all date/time display
   - Always use `formatDistanceToNow()` for relative times (auto-locale ready)
   - Never hardcode date format strings in components; centralize in a `formatDate()` utility

3. **Number Formatting**
   - Use `Intl.NumberFormat` for metric values (handles decimal separators, grouping)
   - Centralize in `formatNumber()`, `formatBytes()`, `formatPercent()` utilities

4. **Layout Direction**
   - Use logical CSS properties where practical (`margin-inline-start` vs `margin-left`)
   - This is low-priority but avoids future RTL refactoring

5. **Text Content**
   - Avoid string concatenation for messages (e.g., NOT `"Found " + count + " servers"`)
   - Use template patterns: `"Found {count} servers"` (i18n library compatible)

### 7.3 Locale-Sensitive Elements

| Element | Approach |
|---------|----------|
| Dates | `date-fns/format` with `en-US` locale constant |
| Relative time | `date-fns/formatDistanceToNow` |
| Numbers | `Intl.NumberFormat('en-US')` wrapper utility |
| File sizes | Custom `formatBytes()` using `Intl.NumberFormat` |
| Percentages | Custom `formatPercent()` using `Intl.NumberFormat` |
| Durations | Custom `formatUptime()` (e.g., "45d 12h 30m") |

---

## 8. State Management Architecture

### 8.1 Overview

State is divided into two categories:

1. **Server State** (remote data): Managed by **TanStack Query** (React Query)
2. **Client State** (UI state): Managed by **Zustand** stores

This separation ensures server data is properly cached, refetched, and synchronized while UI state remains lightweight and instant.

### 8.2 TanStack Query Configuration

```typescript
// src/lib/query-client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30 seconds
      gcTime: 5 * 60_000,       // 5 minutes garbage collection
      retry: 2,                  // Retry failed requests twice
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 8.3 Query Key Structure

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  servers: {
    all: ['servers'] as const,
    list: (filters: ServerFilters) => ['servers', 'list', filters] as const,
    detail: (id: string) => ['servers', 'detail', id] as const,
    metrics: (id: string, range: TimeRange) => ['servers', 'metrics', id, range] as const,
    processes: (id: string) => ['servers', 'processes', id] as const,
    services: (id: string) => ['servers', 'services', id] as const,
    eventLogs: (id: string, filters: LogFilters) => ['servers', 'event-logs', id, filters] as const,
    network: (id: string) => ['servers', 'network', id] as const,
    hardware: (id: string) => ['servers', 'hardware', id] as const,
    compare: (serverIds: string[], range: TimeRange, metrics: string[]) =>
      ['servers', 'compare', serverIds, range, metrics] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: () => ['groups', 'list'] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    active: () => ['alerts', 'active'] as const,
    rules: () => ['alerts', 'rules'] as const,
    history: (filters: AlertHistoryFilters) => ['alerts', 'history', filters] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => ['users', 'list'] as const,
    current: () => ['users', 'current'] as const,
  },
  settings: {
    smtp: () => ['settings', 'smtp'] as const,
    webhooks: () => ['settings', 'webhooks'] as const,
    general: () => ['settings', 'general'] as const,
  },
} as const;
```

### 8.4 Zustand Stores

#### 8.4.1 Auth Store

```typescript
// src/stores/auth-store.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  setUser: (user: User) => void;
}
```

**Persistence**: `accessToken` and `refreshToken` stored in `localStorage` (encrypted). User object cached but re-fetched on app load.

#### 8.4.2 UI Store

```typescript
// src/stores/ui-store.ts
interface UIState {
  sidebarExpanded: boolean;
  dashboardView: 'grid' | 'list';
  dashboardSort: SortOption;
  dashboardFilters: DashboardFilters;
  globalSearchOpen: boolean;
  theme: 'dark'; // Future: 'light' | 'system'

  toggleSidebar: () => void;
  setDashboardView: (view: 'grid' | 'list') => void;
  setDashboardSort: (sort: SortOption) => void;
  setDashboardFilters: (filters: DashboardFilters) => void;
  toggleGlobalSearch: () => void;
}
```

**Persistence**: `sidebarExpanded`, `dashboardView`, `dashboardSort` persisted to `localStorage`.

#### 8.4.3 WebSocket Store

```typescript
// src/stores/socket-store.ts
interface SocketState {
  connected: boolean;
  reconnecting: boolean;
  lastHeartbeat: Record<string, number>; // serverId -> timestamp

  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  updateHeartbeat: (serverId: string, timestamp: number) => void;
}
```

#### 8.4.4 Alert Store (transient)

```typescript
// src/stores/alert-store.ts
interface AlertState {
  soundEnabled: boolean;
  mutedAlerts: Set<string>; // alert IDs muted by user
  dismissedBanner: boolean; // dashboard alert banner dismissed

  toggleSound: () => void;
  muteAlert: (alertId: string, duration: number) => void;
  dismissBanner: () => void;
}
```

### 8.5 Real-Time Data Flow

```
Socket.IO Server
       │
       ▼
  Socket.IO Client (src/lib/socket.ts)
       │
       ├── Event: "server:metrics"  ──> queryClient.setQueryData(['servers', 'detail', id])
       ├── Event: "server:status"   ──> queryClient.setQueryData(['servers', 'list'])
       ├── Event: "server:heartbeat"──> socketStore.updateHeartbeat(id, ts)
       ├── Event: "process:update"  ──> queryClient.invalidateQueries(['servers', 'processes', id])
       ├── Event: "service:update"  ──> queryClient.setQueryData(['servers', 'services', id])
       ├── Event: "alert:new"       ──> queryClient.invalidateQueries(['alerts', 'active'])
       │                                 + toast notification
       │                                 + optional browser notification + sound
       ├── Event: "alert:resolved"  ──> queryClient.invalidateQueries(['alerts', 'active'])
       └── Event: "server:offline"  ──> queryClient.setQueryData(['servers', 'list']) update status
```

**Key Principle**: WebSocket events update TanStack Query cache directly (for known data shapes) or invalidate queries (for complex updates). Components subscribe to TanStack Query and re-render automatically. No duplicate state.

### 8.6 Optimistic Updates

The following mutations use optimistic updates for instant UI feedback:

| Action | Optimistic Behavior | Rollback |
|--------|-------------------|----------|
| Acknowledge alert | Remove from active list immediately | Re-add on error |
| Toggle alert rule | Toggle switch immediately | Revert on error |
| Kill process | Gray out row immediately | Restore on error |
| Start/Stop service | Update status badge immediately | Revert on error |

---

## 9. API Integration Requirements

### 9.1 HTTP Client Configuration

```typescript
// src/lib/api-client.ts
// Axios instance with:
// - Base URL from environment variable (VITE_API_BASE_URL)
// - Request interceptor: Attach JWT access token to Authorization header
// - Response interceptor: On 401, attempt token refresh; on refresh failure, redirect to /login
// - Request/response logging in development
// - Request timeout: 30 seconds
// - AbortController / CancellationToken support on all requests
```

### 9.2 API Endpoint Map

All endpoints are prefixed with `/api/v1`.

#### 9.2.1 Authentication

| Method | Endpoint | Body/Params | Response | Used By |
|--------|----------|------------|----------|---------|
| `POST` | `/auth/login` | `{ email, password }` | `{ accessToken, refreshToken, user }` | Login page |
| `POST` | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` | Interceptor |
| `POST` | `/auth/logout` | - | `204` | User menu |
| `GET` | `/auth/me` | - | `User` | App init |
| `POST` | `/auth/forgot-password` | `{ email }` | `204` | Login page |
| `POST` | `/auth/reset-password` | `{ token, newPassword }` | `204` | Password reset page |
| `POST` | `/auth/change-password` | `{ currentPassword, newPassword }` | `204` | Profile page |

#### 9.2.2 Servers

> **Note on Server Registration:** Servers are registered automatically when the Windows agent is installed and connects using a registration token. There is no "Add Server" UI in the frontend. The agent self-registers via `POST /agents/register` (agent-side only). The frontend only displays servers that have already registered. Pending/unregistered agents may appear with an "Awaiting first heartbeat" status.

| Method | Endpoint | Params | Response | Used By |
|--------|----------|--------|----------|---------|
| `GET` | `/servers` | `?group=&status=&search=` | `Server[]` | Dashboard |
| `GET` | `/servers/:id` | - | `ServerDetail` | Server Detail |
| `GET` | `/servers/:id/metrics` | `?range=1h|6h|24h|7d|30d` | `MetricTimeSeries` | Overview tab |
| `GET` | `/servers/:id/processes` | `?search=&sort=&order=` | `Process[]` | Processes tab |
| `POST` | `/servers/:id/processes/:pid/kill` | - | `{ success: boolean }` | Processes tab |
| `GET` | `/servers/:id/services` | `?status=&search=` | `Service[]` | Services tab |
| `POST` | `/servers/:id/services/:name/start` | - | `{ success: boolean }` | Services tab |
| `POST` | `/servers/:id/services/:name/stop` | - | `{ success: boolean }` | Services tab |
| `POST` | `/servers/:id/services/:name/restart` | - | `{ success: boolean }` | Services tab |
| `GET` | `/servers/:id/event-logs` | `?source=&severity=&from=&to=&search=&page=&limit=` | `Paginated<EventLog>` | Event Logs tab |
| `GET` | `/servers/:id/network` | - | `NetworkInfo` | Network tab |
| `GET` | `/servers/:id/network/connections` | `?page=&limit=` | `Paginated<Connection>` | Network tab |
| `GET` | `/servers/:id/hardware` | - | `HardwareInfo` | Hardware tab |
| `POST` | `/servers/:id/restart` | `{ confirm: hostname }` | `{ success: boolean }` | Remote tab |
| `POST` | `/servers/:id/shutdown` | `{ confirm: hostname }` | `{ success: boolean }` | Remote tab |
| `POST` | `/servers/:id/execute` | `{ command: string }` | `{ output: string, exitCode: number }` | Remote tab |
| `GET` | `/servers/:id/rdp` | - | RDP file download | Remote tab |
| `DELETE` | `/servers/:id` | - | `204` | Server menu |
| `GET` | `/servers/metrics/compare` | `?serverIds=&range=&metrics=` | `Record<string, MetricTimeSeries>` | Metrics page |

#### 9.2.3 Groups

| Method | Endpoint | Body | Response | Used By |
|--------|----------|------|----------|---------|
| `GET` | `/groups` | - | `Group[]` | Groups page, filters |
| `POST` | `/groups` | `{ name, description, color, tags }` | `Group` | Groups page |
| `GET` | `/groups/:id` | - | `GroupDetail` | Group detail |
| `PUT` | `/groups/:id` | `{ name, description, color, tags }` | `Group` | Groups page |
| `DELETE` | `/groups/:id` | - | `204` | Groups page |
| `POST` | `/groups/:id/servers` | `{ serverIds: string[] }` | `Group` | Group assignment |
| `DELETE` | `/groups/:id/servers/:serverId` | - | `204` | Group assignment |

#### 9.2.4 Alerts

| Method | Endpoint | Body/Params | Response | Used By |
|--------|----------|------------|----------|---------|
| `GET` | `/alerts/active` | - | `Alert[]` | Alerts page, dashboard |
| `POST` | `/alerts/:id/acknowledge` | - | `Alert` | Active alerts |
| `POST` | `/alerts/:id/mute` | `{ duration: number }` | `Alert` | Active alerts |
| `GET` | `/alerts/history` | `?severity=&server=&from=&to=&page=&limit=` | `Paginated<Alert>` | Alert history |
| `GET` | `/alerts/rules` | - | `AlertRule[]` | Alert rules |
| `POST` | `/alerts/rules` | `AlertRuleInput` | `AlertRule` | Alert rules |
| `PUT` | `/alerts/rules/:id` | `AlertRuleInput` | `AlertRule` | Alert rules |
| `DELETE` | `/alerts/rules/:id` | - | `204` | Alert rules |
| `PATCH` | `/alerts/rules/:id/toggle` | `{ enabled: boolean }` | `AlertRule` | Alert rules |

#### 9.2.5 Users

| Method | Endpoint | Body | Response | Used By |
|--------|----------|------|----------|---------|
| `GET` | `/users` | - | `User[]` | User management |
| `POST` | `/users` | `CreateUserInput` | `User` | User management |
| `PUT` | `/users/:id` | `UpdateUserInput` | `User` | User management |
| `PATCH` | `/users/:id/status` | `{ active: boolean }` | `User` | User management |
| `DELETE` | `/users/:id` | - | `204` | User management |

#### 9.2.6 Settings

| Method | Endpoint | Body | Response | Used By |
|--------|----------|------|----------|---------|
| `GET` | `/settings/smtp` | - | `SmtpConfig` | SMTP settings |
| `PUT` | `/settings/smtp` | `SmtpConfig` | `SmtpConfig` | SMTP settings |
| `POST` | `/settings/smtp/test` | - | `{ success: boolean, error?: string }` | SMTP settings |
| `GET` | `/settings/webhooks` | - | `Webhook[]` | Webhook settings |
| `POST` | `/settings/webhooks` | `WebhookInput` | `Webhook` | Webhook settings |
| `PUT` | `/settings/webhooks/:id` | `WebhookInput` | `Webhook` | Webhook settings |
| `DELETE` | `/settings/webhooks/:id` | - | `204` | Webhook settings |
| `POST` | `/settings/webhooks/:id/test` | - | `{ success: boolean, statusCode: number }` | Webhook settings |
| `GET` | `/settings/general` | - | `GeneralSettings` | General settings |
| `PUT` | `/settings/general` | `GeneralSettings` | `GeneralSettings` | General settings |

### 9.3 WebSocket Events

**Connection**: `Socket.IO` client connects to `VITE_WS_URL` with `auth: { token: accessToken }`.

#### 9.3.1 Client -> Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe:server` | `{ serverId: string }` | Start receiving detailed updates for a server |
| `unsubscribe:server` | `{ serverId: string }` | Stop detailed updates (when leaving detail page) |

#### 9.3.2 Server -> Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `servers:summary` | `ServerSummary[]` | Periodic summary of all servers (for dashboard) |
| `server:metrics` | `{ serverId, cpu, memory, disk, network, timestamp }` | Real-time metrics for subscribed server |
| `server:status` | `{ serverId, status, lastHeartbeat }` | Server status change |
| `server:offline` | `{ serverId }` | Server stopped responding |
| `server:online` | `{ serverId }` | Server came back online |
| `process:list` | `{ serverId, processes: Process[] }` | Updated process list |
| `service:status` | `{ serverId, serviceName, status }` | Service status change |
| `eventlog:new` | `{ serverId, entries: EventLog[] }` | New event log entries |
| `alert:new` | `Alert` | New alert triggered |
| `alert:resolved` | `{ alertId }` | Alert auto-resolved |

### 9.4 Error Handling

**Standard API Error Response:**
```typescript
interface ApiError {
  statusCode: number;
  message: string;
  error: string;         // Error type (e.g., "Unauthorized", "Validation Error")
  details?: Record<string, string[]>; // Field-level validation errors
}
```

**Error Handling by Status Code:**
| Status | UI Behavior |
|--------|------------|
| 400 | Show field-level validation errors on form, or toast with message |
| 401 | Attempt token refresh. If refresh fails, redirect to `/login` |
| 403 | Toast: "You don't have permission to perform this action" |
| 404 | Show "Not Found" empty state or redirect to dashboard |
| 409 | Toast with conflict message (e.g., "Server name already exists") |
| 422 | Show validation errors on form fields |
| 429 | Toast: "Too many requests. Please wait." + disable button temporarily |
| 500 | Toast: "Something went wrong. Please try again." + log to console |
| Network Error | Show connection banner: "Unable to reach server. Retrying..." |

### 9.5 Request Cancellation

All API requests initiated by TanStack Query use the built-in `AbortSignal` support:
- Navigating away from a page cancels in-flight requests for that page
- Unmounting a component cancels its pending queries
- Search/filter changes cancel the previous request before sending a new one

---

## 10. Security Requirements

### 10.1 Authentication & Authorization

#### 10.1.1 Token Management

- **Access Token**: JWT, stored in memory (Zustand store) + `localStorage`
  - Attached to every API request via `Authorization: Bearer <token>` header
  - Short-lived: 15 minutes TTL
  - Auto-refresh: When token is within 2 minutes of expiry, proactively refresh
- **Refresh Token**: Opaque token, stored in `localStorage`
  - Used only to obtain new access/refresh token pair
  - Long-lived: 7 days TTL
  - Rotated on every refresh (old refresh token invalidated)
- **On logout**: Clear both tokens from memory and `localStorage`, call `/auth/logout` API

#### 10.1.2 Route Protection

```typescript
// src/components/guards/AuthGuard.tsx
// - Wraps all authenticated routes
// - Checks for valid access token on mount and navigation
// - Redirects to /login if no token or refresh fails
// - Shows loading spinner during token validation

// src/components/guards/RoleGuard.tsx
// - Wraps role-restricted routes/components
// - Checks user role against required role(s)
// - Shows "Access Denied" or hides component for insufficient role
// - Roles: 'admin', 'operator', 'viewer'
```

#### 10.1.3 Permission Matrix (Frontend Enforcement)

| Action | Admin | Operator | Viewer |
|--------|-------|----------|--------|
| View Dashboard | Yes | Yes | Yes (assigned groups only) |
| View Server Detail | Yes | Yes | Yes (assigned groups only) |
| Kill Process | Yes | Yes | No |
| Control Services | Yes | Yes | No |
| Restart/Shutdown Server | Yes | Yes | No |
| Execute Commands | Yes | No | No |
| Manage Alert Rules | Yes | Yes | No |
| Acknowledge Alerts | Yes | Yes | No |
| Manage Users | Yes | No | No |
| Configure Settings | Yes | No | No |
| Manage Groups | Yes | Yes | No |

> **Note**: Frontend enforcement is for UX only (hide/disable unavailable actions). The backend MUST enforce all permissions. Never trust the client.

### 10.2 XSS Prevention

- **React's built-in escaping**: All JSX expressions are auto-escaped by React
- **No `dangerouslySetInnerHTML`**: Never use unless absolutely required and content is sanitized with DOMPurify
- **Command output display**: PowerShell command output (Remote tab) must be rendered as plain text in a `<pre>` tag, never as HTML
- **Event log messages**: Render as text only, never interpret HTML within log messages
- **User-generated content**: All server names, group names, alert rule names are rendered as text
- **Content Security Policy**: Configure CSP headers on the backend to restrict script sources

### 10.3 CSRF Prevention

- **Not applicable for JWT-based auth**: Since tokens are sent via `Authorization` header (not cookies), traditional CSRF attacks don't apply
- **SameSite cookies**: If any cookies are used (e.g., for CSRF double-submit), set `SameSite=Strict`

### 10.4 Sensitive Data Handling

| Data | Storage | Display |
|------|---------|---------|
| Access Token | Memory + localStorage | Never displayed |
| Refresh Token | localStorage | Never displayed |
| SMTP Password | Never stored client-side | Masked (`*`) in form, "unchanged" placeholder |
| RDP Credentials | Never stored client-side | Masked in UI, reveal on toggle |
| User Passwords | Never stored | Password field only (create/edit) |
| API Keys (agent) | Display once on creation | Masked after initial display |
| Webhook URLs | Backend only | Partially masked in list view |

### 10.5 Input Validation (Client-Side)

All forms use client-side validation for UX (immediate feedback). Backend re-validates everything.

| Field Type | Validation |
|-----------|-----------|
| Email | RFC 5322 format, required |
| Password | Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number |
| Server hostname | Alphanumeric + hyphens, max 255 chars |
| URL (webhook) | Valid URL format, HTTPS required |
| Port numbers | Integer, 1-65535 |
| Threshold values | Numeric, within metric range (0-100 for %, positive for bytes) |
| PowerShell commands | Max 4096 chars, warn on dangerous patterns (`rm -rf`, `Format-`, `Remove-`) |
| Search inputs | Max 256 chars, debounced, sanitized |

### 10.6 Audit Trail (Frontend Role)

The frontend does NOT maintain its own audit log. However:
- All destructive actions (kill process, restart server, stop service, execute command) include the action details in the API request body
- The backend logs: `{ userId, action, targetServerId, targetResource, timestamp, ipAddress }`
- The frontend displays audit history in Settings (read-only, fetched from backend)

### 10.7 Rate Limiting (Frontend Cooperation)

- **Login**: Disable submit button for 3 seconds after each attempt; show remaining attempts from API response
- **Remote commands**: 5-second cooldown between consecutive command executions
- **Service control**: Disable control buttons for 10 seconds after action (prevents rapid start/stop)
- **Server restart/shutdown**: 60-second cooldown after execution
- **Alert rule save**: Debounce save button (prevent double-submit)
- **API calls**: Show "Rate limited" toast on 429 response, auto-retry after `Retry-After` header value

---

## Appendix A: File Structure

```
src/
├── main.tsx                          # App entry point
├── App.tsx                           # Router + providers setup
├── index.css                         # Tailwind imports + CSS variables
├── vite-env.d.ts                     # Vite type declarations
│
├── components/
│   ├── ui/                           # shadcn/ui components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── ...
│   │
│   ├── layout/
│   │   ├── app-shell.tsx             # Main layout wrapper
│   │   ├── sidebar.tsx               # Navigation sidebar
│   │   ├── top-bar.tsx               # Header with search + user menu
│   │   ├── page-header.tsx           # Page title + breadcrumb
│   │   └── glass-card.tsx            # Glassmorphism card wrapper
│   │
│   ├── charts/
│   │   ├── metric-area-chart.tsx     # Time-series area chart
│   │   ├── dual-line-chart.tsx       # Dual-metric line chart
│   │   ├── bandwidth-chart.tsx       # Network bandwidth chart
│   │   ├── disk-usage-bar.tsx        # Horizontal bar chart
│   │   ├── alert-timeline.tsx       # Alert occurrences on time axis
│   │   └── time-range-selector.tsx   # Shared time range toggle
│   │
│   ├── gauges/
│   │   ├── circular-gauge.tsx        # Circular progress ring
│   │   ├── sparkline-chart.tsx       # Mini inline chart
│   │   └── health-bar.tsx            # Stacked health proportion bar
│   │
│   ├── data-display/
│   │   ├── metric-card.tsx           # Stat card with value + trend
│   │   ├── status-dot.tsx            # Colored status indicator
│   │   ├── status-badge.tsx          # Status pill badge
│   │   ├── time-ago.tsx              # Auto-updating relative time
│   │   ├── animated-number.tsx       # Tweening number display
│   │   └── live-indicator.tsx        # "LIVE" badge with pulse
│   │
│   ├── tables/
│   │   ├── data-table.tsx            # Full-featured data table
│   │   ├── virtual-table.tsx         # Virtualized table
│   │   ├── search-input.tsx          # Debounced search
│   │   └── column-selector.tsx       # Column visibility toggle
│   │
│   ├── forms/
│   │   ├── confirm-dialog.tsx        # Standard confirmation
│   │   ├── danger-confirm-dialog.tsx # Double-confirmation (type to confirm)
│   │   ├── tag-input.tsx             # Multi-value tag input
│   │   ├── date-range-picker.tsx     # Date range selector
│   │   └── key-value-editor.tsx      # Dynamic key-value pairs
│   │
│   ├── feedback/
│   │   ├── alert-banner.tsx          # Dashboard alert banner
│   │   ├── connection-status.tsx     # WebSocket status indicator
│   │   ├── empty-state.tsx           # Empty state placeholder
│   │   └── loading-state.tsx         # Skeleton loading wrapper
│   │
│   └── guards/
│       ├── auth-guard.tsx            # Authentication route guard
│       └── role-guard.tsx            # Role-based access guard
│
├── pages/
│   ├── login.tsx                     # Login page
│   ├── dashboard.tsx                 # Main dashboard
│   ├── server-detail/
│   │   ├── server-detail.tsx         # Server detail layout + tabs
│   │   ├── overview-tab.tsx          # Overview tab content
│   │   ├── processes-tab.tsx         # Processes tab
│   │   ├── services-tab.tsx          # Services tab
│   │   ├── event-logs-tab.tsx        # Event logs tab
│   │   ├── network-tab.tsx           # Network tab
│   │   ├── hardware-tab.tsx          # Hardware tab
│   │   └── remote-tab.tsx            # Remote control tab
│   ├── groups/
│   │   ├── groups.tsx                # Groups list page
│   │   └── group-detail.tsx          # Group detail (filtered dashboard)
│   ├── alerts/
│   │   ├── alerts.tsx                # Alerts layout with sub-tabs
│   │   ├── active-alerts.tsx         # Active alerts list
│   │   ├── alert-rules.tsx           # Alert rules management
│   │   └── alert-history.tsx         # Alert history table
│   ├── settings/
│   │   ├── settings.tsx              # Settings layout with sub-tabs
│   │   ├── users-settings.tsx        # User management
│   │   ├── smtp-settings.tsx         # SMTP configuration
│   │   ├── webhooks-settings.tsx     # Webhook management
│   │   └── general-settings.tsx      # General app settings
│   ├── metrics.tsx                   # Cross-server metric comparison
│   ├── profile.tsx                   # User profile & password change
│   └── not-found.tsx                 # 404 catch-all page
│
├── components/
│   └── error-boundaries/
│       ├── global-error-boundary.tsx # App-level error boundary
│       ├── route-error-boundary.tsx  # Per-route error boundary
│       └── chart-error-boundary.tsx  # Individual chart error boundary
│
├── hooks/
│   ├── use-servers.ts                # Server-related TanStack Query hooks
│   ├── use-server-detail.ts          # Server detail query hooks
│   ├── use-groups.ts                 # Group query hooks
│   ├── use-alerts.ts                 # Alert query hooks
│   ├── use-users.ts                  # User management hooks
│   ├── use-settings.ts              # Settings query hooks
│   ├── use-socket.ts                 # WebSocket connection hook
│   ├── use-debounce.ts              # Debounce utility hook
│   ├── use-keyboard-shortcut.ts     # Keyboard shortcut hook
│   └── use-media-query.ts           # Responsive breakpoint hook
│
├── stores/
│   ├── auth-store.ts                 # Authentication state
│   ├── ui-store.ts                   # UI preferences state
│   ├── socket-store.ts              # WebSocket connection state
│   └── alert-store.ts               # Alert notification state
│
├── lib/
│   ├── api-client.ts                 # Axios instance + interceptors
│   ├── query-client.ts              # TanStack Query client config
│   ├── query-keys.ts                # Query key factory
│   ├── socket.ts                     # Socket.IO client setup
│   └── utils.ts                      # cn() + general utilities
│
├── utils/
│   ├── format-date.ts               # Date formatting utilities
│   ├── format-number.ts             # Number, bytes, percent formatting
│   ├── format-uptime.ts             # Uptime duration formatting
│   └── validators.ts                # Client-side validation schemas (Zod)
│
├── types/
│   ├── server.ts                     # Server, Process, Service types
│   ├── alert.ts                      # Alert, AlertRule types
│   ├── group.ts                      # Group types
│   ├── user.ts                       # User, Role types
│   ├── settings.ts                   # Settings types
│   ├── metrics.ts                    # Metric, TimeSeries types
│   └── api.ts                        # API response wrapper types
│
└── constants/
    ├── routes.ts                     # Route path constants
    ├── strings.ts                    # UI string constants (i18n-ready)
    └── config.ts                     # App configuration constants
```

---

## Appendix B: TypeScript Type Definitions

```typescript
// Core entity types referenced throughout this document

interface Server {
  id: string;
  hostname: string;
  ipAddress: string;
  osVersion: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  cpu: number;          // 0-100
  memory: number;       // 0-100
  disk: number;         // 0-100
  networkIn: number;    // Mbps
  networkOut: number;   // Mbps
  uptime: number;       // seconds
  lastHeartbeat: string; // ISO timestamp
  alertCount: number;
  groupIds: string[];
  registeredAt: string;
}

interface Process {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMB: number;
  memoryPercent: number;
  threads: number;
  startTime: string;
}

interface Service {
  name: string;
  displayName: string;
  status: 'Running' | 'Stopped' | 'Starting' | 'Stopping' | 'Paused';
  startupType: 'Automatic' | 'Manual' | 'Disabled';
}

interface EventLog {
  id: string;
  source: 'System' | 'Application' | 'Security';
  severity: 'Error' | 'Warning' | 'Information';
  eventId: number;
  message: string;
  timestamp: string;
}

interface Alert {
  id: string;
  serverId: string;
  serverHostname: string;
  ruleId: string;
  ruleName: string;
  severity: 'warning' | 'critical';
  message: string;
  metricValue: number;
  threshold: number;
  triggeredAt: string;
  resolvedAt: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
}

interface AlertRule {
  id: string;
  name: string;
  serverIds: string[];
  groupIds: string[];
  metric: 'cpu' | 'memory' | 'disk' | 'networkIn' | 'networkOut' | 'heartbeat' | 'serviceStatus';
  condition: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
  durationMinutes: number;
  severity: 'warning' | 'critical';
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifyWebhook: boolean;
  emailRecipients: string[];
  webhookId: string | null;
  enabled: boolean;
  lastTriggeredAt: string | null;
}

interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  tags: string[];
  serverIds: string[];
  serverCount: number;
  healthySummary: { healthy: number; warning: number; critical: number; offline: number };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  groupAccess: string[]; // group IDs (empty = all for admin)
  lastActiveAt: string;
  active: boolean;
  createdAt: string;
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

interface MetricDataPoint {
  timestamp: string;
  value: number;
}

interface MetricTimeSeries {
  cpu: MetricDataPoint[];
  memory: MetricDataPoint[];
  diskRead: MetricDataPoint[];
  diskWrite: MetricDataPoint[];
  networkIn: MetricDataPoint[];
  networkOut: MetricDataPoint[];
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

*Plan generated: 2026-03-23*
*Project: iMonitorServer Frontend*
*Version: 1.0*
