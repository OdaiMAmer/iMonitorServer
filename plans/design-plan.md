# iMonitorServer â€” Comprehensive Design Plan

## Table of Contents

1. [Design System Specification](#1-design-system-specification)
2. [Component Library Inventory](#2-component-library-inventory)
3. [Screen/Page Wireframe Descriptions](#3-screenpage-wireframe-descriptions)
4. [Navigation & Routing Architecture](#4-navigation--routing-architecture)
5. [Responsive Breakpoints & Adaptive Layouts](#5-responsive-breakpoints--adaptive-layouts)
6. [Animation & Transition Specifications](#6-animation--transition-specifications)
7. [Form Design Patterns & Validation UX](#7-form-design-patterns--validation-ux)
8. [Error & Empty State Designs](#8-error--empty-state-designs)
9. [Loading & Skeleton Screen Patterns](#9-loading--skeleton-screen-patterns)
10. [Accessibility Guidelines (WCAG 2.1 AA)](#10-accessibility-guidelines-wcag-21-aa)
11. [Dark/Light Mode Considerations](#11-darklight-mode-considerations)
12. [Icon & Illustration Guidelines](#12-icon--illustration-guidelines)

---

## 1. Design System Specification

### 1.1 Color Palette

#### Primary Colors

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--primary-50` | `#EFF6FF` | `#1E3A5F` | Subtle backgrounds |
| `--primary-100` | `#DBEAFE` | `#1E40AF` | Hover backgrounds |
| `--primary-200` | `#BFDBFE` | `#1D4ED8` | Borders, dividers |
| `--primary-500` | `#3B82F6` | `#60A5FA` | Buttons, links, active states |
| `--primary-600` | `#2563EB` | `#93BBFD` | Button hover |
| `--primary-700` | `#1D4ED8` | `#BFDBFE` | Pressed state |
| `--primary-900` | `#1E3A5F` | `#EFF6FF` | Headings on light surfaces |

#### Semantic / Status Colors

| Token | Value | Usage |
|---|---|---|
| `--status-healthy` | `#22C55E` (green-500) | Server online, metrics within thresholds |
| `--status-warning` | `#F59E0B` (amber-500) | Elevated resource usage (70-89%) |
| `--status-critical` | `#EF4444` (red-500) | Server down, threshold exceeded (â‰¥90%) |
| `--status-unknown` | `#6B7280` (gray-500) | No data / agent disconnected |
| `--status-maintenance` | `#8B5CF6` (violet-500) | Planned maintenance window |
| `--status-info` | `#3B82F6` (blue-500) | Informational alerts, logs |

#### Neutral / Surface Colors

| Token | Light Mode | Dark Mode |
|---|---|---|
| `--bg-root` | `#F8FAFC` (slate-50) | `#0F172A` (slate-900) |
| `--bg-surface` | `#FFFFFF` | `#1E293B` (slate-800) |
| `--bg-surface-raised` | `#FFFFFF` | `#334155` (slate-700) |
| `--bg-sidebar` | `#F1F5F9` (slate-100) | `#0F172A` (slate-900) |
| `--border-default` | `#E2E8F0` (slate-200) | `#334155` (slate-700) |
| `--border-subtle` | `#F1F5F9` (slate-100) | `#1E293B` (slate-800) |
| `--text-primary` | `#0F172A` (slate-900) | `#F1F5F9` (slate-100) |
| `--text-secondary` | `#475569` (slate-600) | `#94A3B8` (slate-400) |
| `--text-tertiary` | `#94A3B8` (slate-400) | `#64748B` (slate-500) |
| `--text-inverse` | `#FFFFFF` | `#0F172A` |

#### Chart / Data Visualization Palette

```
CPU:      #3B82F6 (blue)
Memory:   #8B5CF6 (violet)
Disk:     #F59E0B (amber)
Network:  #06B6D4 (cyan)
GPU:      #EC4899 (pink)
Process:  #10B981 (emerald)
```

### 1.2 Typography

**Font Stack:**
```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
```

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display-lg` | 36px / 2.25rem | 700 | 1.2 | -0.025em | Page hero titles |
| `display-sm` | 30px / 1.875rem | 700 | 1.25 | -0.025em | Section titles |
| `heading-lg` | 24px / 1.5rem | 600 | 1.33 | -0.02em | Card group headings |
| `heading-md` | 20px / 1.25rem | 600 | 1.4 | -0.01em | Card titles |
| `heading-sm` | 16px / 1rem | 600 | 1.5 | 0 | Sub-section headings |
| `body-lg` | 16px / 1rem | 400 | 1.625 | 0 | Primary body text |
| `body-md` | 14px / 0.875rem | 400 | 1.57 | 0 | Secondary text, table cells |
| `body-sm` | 12px / 0.75rem | 400 | 1.5 | 0.01em | Captions, timestamps |
| `label` | 14px / 0.875rem | 500 | 1.43 | 0.01em | Form labels, tab labels |
| `metric-value` | 32px / 2rem | 700 | 1.0 | -0.02em | Dashboard KPI numbers |
| `metric-unit` | 14px / 0.875rem | 400 | 1.0 | 0.05em | Units (%, GB, Mbps) |
| `code` | 13px / 0.8125rem | 400 | 1.6 | 0 | Code blocks, log output |

### 1.3 Spacing Scale

Based on a 4px base unit:

| Token | Value | Usage |
|---|---|---|
| `space-0` | 0px | Reset |
| `space-1` | 4px | Tight inline gaps, icon-to-text |
| `space-2` | 8px | Related element gap |
| `space-3` | 12px | Inner card padding (compact) |
| `space-4` | 16px | Default card padding, form gaps |
| `space-5` | 20px | Section sub-gaps |
| `space-6` | 24px | Card padding standard |
| `space-8` | 32px | Section gaps |
| `space-10` | 40px | Page section margins |
| `space-12` | 48px | Major section dividers |
| `space-16` | 64px | Page-level padding |

**Layout-specific spacing:**

| Context | Value |
|---|---|
| Sidebar width (expanded) | 260px |
| Sidebar width (collapsed) | 64px |
| Top navbar height | 56px |
| Dashboard grid gap | 16px (md) / 24px (lg) |
| Card inner padding | 20px (sm) / 24px (lg) |
| Page horizontal padding | 16px (sm) / 24px (md) / 32px (lg) |

### 1.4 Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 4px | Badges, small chips |
| `radius-md` | 6px | Inputs, buttons |
| `radius-lg` | 8px | Cards, dropdowns |
| `radius-xl` | 12px | Modals, dialogs |
| `radius-2xl` | 16px | Feature panels |
| `radius-full` | 9999px | Avatars, status dots, pills |

### 1.5 Shadows (Elevation)

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle lift |
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | `0 1px 3px rgba(0,0,0,0.4)` | Cards at rest |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` | `0 4px 6px rgba(0,0,0,0.5)` | Dropdown menus |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)` | `0 10px 15px rgba(0,0,0,0.6)` | Modals, popovers |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1), 0 8px 10px rgba(0,0,0,0.04)` | `0 20px 25px rgba(0,0,0,0.7)` | Command palette |

### 1.6 Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `z-base` | 0 | Default stacking |
| `z-dropdown` | 10 | Dropdown menus |
| `z-sticky` | 20 | Sticky headers/columns |
| `z-sidebar` | 30 | Sidebar overlay on mobile |
| `z-overlay` | 40 | Backdrop overlays |
| `z-modal` | 50 | Modal dialogs |
| `z-popover` | 60 | Popovers, tooltips |
| `z-toast` | 70 | Toast notifications |
| `z-command` | 80 | Command palette |

---

## 2. Component Library Inventory

### 2.1 Foundation Components (shadcn/ui Based)

#### Button

| Variant | Description | Use Case |
|---|---|---|
| `default` (primary) | Filled blue background | Primary actions: Save, Create Group |
| `secondary` | Subtle gray background | Secondary actions: Cancel, Filter |
| `destructive` | Red filled | Dangerous actions: Delete, Shutdown |
| `outline` | Border only, no fill | Tertiary actions: Export, Duplicate |
| `ghost` | No border, no fill | Toolbar icons, navigation items |
| `link` | Text-only underline on hover | Inline navigation links |

**Sizes:** `sm` (32px h), `default` (36px h), `lg` (40px h), `icon` (36Ã—36px)

**States:** default, hover, active/pressed, focused (ring), disabled (50% opacity), loading (spinner replaces icon)

#### Input / TextField

| Variant | Description |
|---|---|
| `default` | Standard text input |
| `with-icon` | Left icon (e.g., search magnifying glass) |
| `with-addon` | Prefix/suffix text (e.g., "https://", "%") |
| `textarea` | Multi-line text area |

**States:** default, focused (blue ring), error (red border + message), disabled, read-only

#### Badge / Status Indicator

| Variant | Color | Usage |
|---|---|---|
| `healthy` | Green | Server online |
| `warning` | Amber | High resource usage |
| `critical` | Red | Server down / alert firing |
| `unknown` | Gray | No data |
| `maintenance` | Violet | Planned downtime |
| `info` | Blue | Informational |

**Formats:** Dot-only (8px circle), Dot + label, Pill badge, Pulsing dot (for active critical alerts)

#### Card

| Variant | Description |
|---|---|
| `default` | Standard surface card |
| `metric` | KPI card with large number, label, trend indicator |
| `server` | Server card with status dot, hostname, mini sparklines |
| `alert` | Alert card with severity stripe on left border |
| `interactive` | Clickable card with hover lift effect |

#### Table (Data Table)

| Feature | Description |
|---|---|
| Sortable columns | Click header to sort, icon indicator |
| Filterable | Per-column filter inputs |
| Selectable rows | Checkbox column for bulk actions |
| Expandable rows | Chevron to reveal nested details |
| Pagination | Bottom bar: page size selector + page navigation |
| Sticky header | Header stays visible on scroll |
| Column resize | Drag handles on column borders |
| Empty state | Illustrated empty state when no data |

#### Dialog / Modal

| Variant | Description |
|---|---|
| `default` | Standard centered modal |
| `confirm` | Confirmation dialog with warning icon |
| `destructive` | Red-accented confirmation for dangerous actions |
| `form` | Modal containing a form (e.g., Add Server) |
| `fullscreen` | Full viewport on mobile, large dialog on desktop |

#### Toast / Notification

| Variant | Description |
|---|---|
| `success` | Green left accent â€” operation completed |
| `error` | Red left accent â€” operation failed |
| `warning` | Amber left accent â€” attention needed |
| `info` | Blue left accent â€” informational |

**Behavior:** Stack bottom-right, auto-dismiss after 5s (errors persist), max 3 visible, swipe to dismiss.

### 2.2 Domain-Specific Components

#### ServerStatusCard

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚ â—? server-prod-01       [â‹® Menu] â”‚
â”‚   Ubuntu 22.04 Â· 192.168.1.10   â”‚
â”‚                                  â”‚
â”‚  CPU â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘  78%   â–² 12%    â”‚
â”‚  MEM â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘  62%   â–¼  3%    â”‚
â”‚  DSK â–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘  41%   â”€  0%    â”‚
â”‚                                  â”‚
â”‚  Uptime: 45d 12h   Agent: v2.1  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**States:** Online (green dot), Warning (amber pulsing), Critical (red pulsing), Offline (gray), Maintenance (violet)

#### MetricGauge

Circular or semi-circular gauge for CPU/Memory/Disk. Color transitions:
- 0-69%: `--status-healthy` (green)
- 70-89%: `--status-warning` (amber)
- 90-100%: `--status-critical` (red)

#### RealtimeChart (Recharts)

| Variant | Chart Type | Usage |
|---|---|---|
| `timeline` | Area chart | CPU/Memory over time |
| `sparkline` | Mini line chart | Inline in tables/cards |
| `multi-series` | Multi-line chart | Compare servers |
| `histogram` | Bar chart | Process resource distribution |
| `pie/donut` | Donut chart | Disk usage breakdown |

**Common features:** Tooltip on hover, legend toggleable, zoom via brush, real-time streaming via Socket.IO

#### AlertRuleBuilder

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚  When  [CPU Usage â–¼]  is  [above â–¼]  [90]%  â”‚
â”‚  for   [5 â–¼]  minutes                       â”‚
â”‚  then  [Send Email â–¼] to [ops@company.com]  â”‚
â”‚                                              â”‚
â”‚  [+ Add Condition]       [Test] [Save Rule]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### ServerGroupTree

Hierarchical tree view with:
- Expandable/collapsible group nodes
- Drag-and-drop reordering
- Server count badge per group
- Aggregate status indicator (worst status bubbles up)
- Context menu (right-click): Rename, Delete, Add Server

#### CommandPalette (Cmd+K)

Full-width centered overlay with:
- Search input at top
- Categorized results: Servers, Groups, Actions, Settings
- Keyboard navigation (â†‘â†“ to navigate, Enter to select, Esc to close)
- Recent searches section
- Fuzzy matching

#### LogViewer

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚ [Level â–¼] [Server â–¼] [Search...      ] [â?¸ â–¶]  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ 14:32:01 ERR  server-01  CPU exceeded 95%      â”‚
â”‚ 14:31:45 WRN  server-03  Memory at 82%         â”‚
â”‚ 14:31:30 INF  server-02  Agent connected       â”‚
â”‚ 14:31:12 INF  server-01  Service restarted     â”‚
â”‚ ... (virtual scroll, auto-scroll toggle)        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Monospace font, color-coded by level, virtual scrolling for performance, pause/resume auto-scroll, export capability.

---

## 3. Screen/Page Wireframe Descriptions

### 3.1 Login Page

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚                                                        â”‚
â”‚              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?                  â”‚
â”‚              â”‚     ðŸ–¥ iMonitor      â”‚                  â”‚
â”‚              â”‚                      â”‚                  â”‚
â”‚              â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚                  â”‚
â”‚              â”‚  â”‚ Email          â”‚  â”‚                  â”‚
â”‚              â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚                  â”‚
â”‚              â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚                  â”‚
â”‚              â”‚  â”‚ Password    ðŸ‘? â”‚  â”‚                  â”‚
â”‚              â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚                  â”‚
â”‚              â”‚  â–¡ Remember me       â”‚                  â”‚
â”‚              â”‚                      â”‚                  â”‚
â”‚              â”‚  [    Sign In     ]  â”‚                  â”‚
â”‚              â”‚                      â”‚                  â”‚
â”‚              â”‚  Forgot password?    â”‚                  â”‚
â”‚              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                  â”‚
â”‚                                                        â”‚
â”‚         Background: subtle server grid pattern         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Centered card layout on gradient/illustrated background
- JWT authentication flow
- Form validation inline

### 3.2 Dashboard (Home)

```
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚   â”‚ â˜° iMonitor         [ðŸ”? Cmd+K]  [ðŸ”” 3] [ðŸ‘¤ Admin]â”‚
â”‚ S â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ I â”‚                                                    â”‚
â”‚ D â”‚  Welcome back, Admin               Last 24 Hours  â”‚
â”‚ E â”‚                                                    â”‚
â”‚ B â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”?             â”‚
â”‚ A â”‚  â”‚  24  â”‚ â”‚  21  â”‚ â”‚   2  â”‚ â”‚   1  â”‚             â”‚
â”‚ R â”‚  â”‚Total â”‚ â”‚Onlineâ”‚ â”‚ Warn â”‚ â”‚ Down â”‚             â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”˜             â”‚
â”‚ N â”‚                                                    â”‚
â”‚ A â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”‚
â”‚ V â”‚  â”‚  CPU Usage (Avg)    â”‚ â”‚  Memory Usage (Avg)  â”‚ â”‚
â”‚   â”‚  â”‚  ~~~area chart~~~   â”‚ â”‚  ~~~area chart~~~    â”‚ â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”‚
â”‚   â”‚  â”‚  Recent Alerts      â”‚ â”‚  Server Health Map   â”‚ â”‚
â”‚   â”‚  â”‚  â€¢ CRIT server-05.. â”‚ â”‚  â—? â—? â—? â—? â—? â—?       â”‚ â”‚
â”‚   â”‚  â”‚  â€¢ WARN server-03.. â”‚ â”‚  â—? â—? â—? â—? â—? â—?       â”‚ â”‚
â”‚   â”‚  â”‚  â€¢ INFO server-01.. â”‚ â”‚  â—? â—? â—? â—? â—? â—?       â”‚ â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚   â”‚                                                    â”‚
â””â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**KPI Strip:** 4 metric cards in a row â€” Total Servers, Online, Warning, Critical/Down. Each shows count + trend arrow.

**Charts Section:** 2-column grid â€” CPU aggregate timeline, Memory aggregate timeline. Time range selector (1h, 6h, 24h, 7d, 30d).

**Recent Alerts Panel:** Last 10 alerts, severity-colored left border, click to navigate to alert detail.

**Server Health Map:** Grid of colored dots representing each server, hover for tooltip, click for detail. Color = status.

### 3.3 Server List Page

```
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚   â”‚  Servers                         [+ Add Server]   â”‚
â”‚ S â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ I â”‚                                                    â”‚
â”‚ D â”‚  [All â–¼] [Group â–¼] [Status â–¼] [ðŸ”? Search...]    â”‚
â”‚ E â”‚                                                    â”‚
â”‚ B â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”‚
â”‚ A â”‚  â”‚ â–¡ â”‚ â—? â”‚ Hostname     â”‚ IP        â”‚ CPUâ”‚ MEM â”‚ â”‚
â”‚ R â”‚  â”œâ”€â”€â”€â”¼â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”¤ â”‚
â”‚   â”‚  â”‚ â–¡ â”‚ ðŸŸ¢â”‚ prod-web-01  â”‚ 10.0.1.10 â”‚ 45%â”‚ 62% â”‚ â”‚
â”‚   â”‚  â”‚ â–¡ â”‚ ðŸŸ¢â”‚ prod-web-02  â”‚ 10.0.1.11 â”‚ 32%â”‚ 58% â”‚ â”‚
â”‚   â”‚  â”‚ â–¡ â”‚ ðŸŸ¡â”‚ prod-db-01   â”‚ 10.0.1.20 â”‚ 78%â”‚ 85% â”‚ â”‚
â”‚   â”‚  â”‚ â–¡ â”‚ ðŸ”´â”‚ staging-01   â”‚ 10.0.2.10 â”‚  â€” â”‚  â€”  â”‚ â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  Showing 1-20 of 24    [< 1 2 >]   [20 per page] â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  Selected (2): [Restart Agent] [Remove] [Move To] â”‚
â””â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Toggle between **Table View** and **Card Grid View**
- Bulk actions bar appears when rows selected
- Sparkline columns for CPU/Memory (optional toggle)
- Sortable by any column
- Export to CSV

### 3.4 Server Detail Page

```
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚   â”‚  â†? Back    prod-web-01   ðŸŸ¢ Online   [â‹® Actions] â”‚
â”‚ S â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ I â”‚                                                    â”‚
â”‚ D â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”?     â”‚
â”‚ E â”‚  â”‚ CPU    â”‚ â”‚ Memory â”‚ â”‚ Disk   â”‚ â”‚ Uptime â”‚     â”‚
â”‚ B â”‚  â”‚  45%   â”‚ â”‚  62%   â”‚ â”‚  41%   â”‚ â”‚ 45d 12hâ”‚     â”‚
â”‚ A â”‚  â”‚  â—”     â”‚ â”‚  â—‘     â”‚ â”‚  â—”     â”‚ â”‚        â”‚     â”‚
â”‚ R â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  [Overview] [Processes] [Logs] [Alerts] [Config]  â”‚
â”‚   â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€    â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚   â”‚  â”‚  CPU & Memory Timeline        [1hâ–¼] [âŸ³]   â”‚  â”‚
â”‚   â”‚  â”‚  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~              â”‚  â”‚
â”‚   â”‚  â”‚  ~~~~~area chart~~~~~~~~~~~~~~~             â”‚  â”‚
â”‚   â”‚  â”‚  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~              â”‚  â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚   â”‚  â”‚ Network I/O       â”‚ â”‚ Disk I/O              â”‚  â”‚
â”‚   â”‚  â”‚ ~~~line chart~~~  â”‚ â”‚ ~~~line chart~~~      â”‚  â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  System Information                               â”‚
â”‚   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚   â”‚  â”‚ OS: Windows Server 2022  â”‚ CPU: Xeon E5... â”‚  â”‚
â”‚   â”‚  â”‚ Cores: 8                 â”‚ RAM: 32 GB      â”‚  â”‚
â”‚   â”‚  â”‚ Agent: v2.1.0            â”‚ .NET: 8.0.1     â”‚  â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Tabs:**
- **Overview:** Gauges, charts, system info (default)
- **Processes:** Sortable process table (Name, PID, CPU%, MEM%, Status) with kill/restart actions
- **Logs:** Real-time log viewer with filtering
- **Alerts:** Alert history for this server
- **Config:** Agent configuration, thresholds, group membership

**Actions Menu (â‹®):** Restart Server, Restart Agent, Run Command, Start Maintenance, Remove Server

### 3.5 Server Groups Page

```
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚   â”‚  Server Groups                   [+ Create Group] â”‚
â”‚ S â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ I â”‚                                                    â”‚
â”‚ D â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?        â”‚
â”‚ E â”‚  â”‚ ðŸ“? Production    â”‚ â”‚ ðŸ“? Staging       â”‚        â”‚
â”‚ B â”‚  â”‚ 12 servers       â”‚ â”‚ 4 servers        â”‚        â”‚
â”‚ A â”‚  â”‚ ðŸŸ¢ 11  ðŸŸ¡ 1      â”‚ â”‚ ðŸŸ¢ 3  ðŸ”´ 1       â”‚        â”‚
â”‚ R â”‚  â”‚ CPU avg: 52%     â”‚ â”‚ CPU avg: 34%     â”‚        â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?        â”‚
â”‚   â”‚  â”‚ ðŸ“? Database      â”‚ â”‚ ðŸ“? Development   â”‚        â”‚
â”‚   â”‚  â”‚ 5 servers        â”‚ â”‚ 3 servers        â”‚        â”‚
â”‚   â”‚  â”‚ ðŸŸ¢ 4  ðŸŸ¡ 1       â”‚ â”‚ ðŸŸ¢ 3             â”‚        â”‚
â”‚   â”‚  â”‚ CPU avg: 67%     â”‚ â”‚ CPU avg: 18%     â”‚        â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â”‚
â”‚   â”‚                                                    â”‚
â””â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Card grid of groups; click to expand/drill-down
- Group detail view shows member servers in table
- Drag-and-drop servers between groups
- Nested group support (tree sidebar alternative view)

### 3.6 Alerts Page

```
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚   â”‚  Alerts              [Alert Rules] [+ New Rule]   â”‚
â”‚ S â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ I â”‚                                                    â”‚
â”‚ D â”‚  [Active: 5] [Resolved] [All]   [ðŸ”? Search]      â”‚
â”‚ E â”‚                                                    â”‚
â”‚ B â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”‚
â”‚ A â”‚  â”‚ðŸ”´â”‚ CPU > 95% on prod-db-01                   â”‚ â”‚
â”‚ R â”‚  â”‚  â”‚ Triggered 5 min ago Â· Critical            â”‚ â”‚
â”‚   â”‚  â”‚  â”‚ [Acknowledge] [Silence 1h]                â”‚ â”‚
â”‚   â”‚  â”œâ”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚
â”‚   â”‚  â”‚ðŸŸ¡â”‚ Memory > 80% on prod-web-03              â”‚ â”‚
â”‚   â”‚  â”‚  â”‚ Triggered 23 min ago Â· Warning            â”‚ â”‚
â”‚   â”‚  â”‚  â”‚ [Acknowledge] [Silence 1h]                â”‚ â”‚
â”‚   â”‚  â”œâ”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚
â”‚   â”‚  â”‚ðŸ”´â”‚ Server staging-01 unreachable             â”‚ â”‚
â”‚   â”‚  â”‚  â”‚ Triggered 1 hour ago Â· Critical           â”‚ â”‚
â”‚   â”‚  â”‚  â”‚ Acknowledged by admin@co.com              â”‚ â”‚
â”‚   â”‚  â””â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  Alert Rules                                      â”‚
â”‚   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”‚
â”‚   â”‚  â”‚ Rule Name        â”‚ Metric â”‚ Threshold â”‚ âš¡  â”‚ â”‚
â”‚   â”‚  â”‚ High CPU         â”‚ CPU    â”‚ > 90%     â”‚ On  â”‚ â”‚
â”‚   â”‚  â”‚ Memory Warning   â”‚ Memory â”‚ > 80%     â”‚ On  â”‚ â”‚
â”‚   â”‚  â”‚ Disk Critical    â”‚ Disk   â”‚ > 95%     â”‚ Off â”‚ â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Tabs: Active / Resolved / All
- Each alert card: severity stripe, message, server, timestamp, actions
- Alert Rules sub-page: CRUD for alert rules via AlertRuleBuilder component
- Notification channel configuration (SMTP settings)

### 3.7 Remote Control Page

```
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚   â”‚  Remote Control                                    â”‚
â”‚ S â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ I â”‚                                                    â”‚
â”‚ D â”‚  Target: [prod-web-01 â–¼]         ðŸŸ¢ Connected     â”‚
â”‚ E â”‚                                                    â”‚
â”‚ B â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚ A â”‚  â”‚ Quick Actions                               â”‚  â”‚
â”‚ R â”‚  â”‚                                             â”‚  â”‚
â”‚   â”‚  â”‚ [ðŸ”„ Restart Service â–¼] [â?¹ Stop] [â–¶ Start] â”‚  â”‚
â”‚   â”‚  â”‚ [ðŸ”Œ Restart Server]    [ðŸ“‹ Get Diagnostics] â”‚  â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚   â”‚  â”‚ Remote Command                              â”‚  â”‚
â”‚   â”‚  â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”‚  â”‚
â”‚   â”‚  â”‚ â”‚ $ systemctl status nginx              â–¶ â”‚ â”‚  â”‚
â”‚   â”‚  â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚  â”‚
â”‚   â”‚  â”‚                                             â”‚  â”‚
â”‚   â”‚  â”‚ Output:                                     â”‚  â”‚
â”‚   â”‚  â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”‚  â”‚
â”‚   â”‚  â”‚ â”‚ â—? nginx.service - A high performance... â”‚ â”‚  â”‚
â”‚   â”‚  â”‚ â”‚   Active: active (running) since...     â”‚ â”‚  â”‚
â”‚   â”‚  â”‚ â”‚   Main PID: 1234 (nginx)                â”‚ â”‚  â”‚
â”‚   â”‚  â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚  â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  Command History                                  â”‚
â”‚   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚   â”‚  â”‚ 14:30 â”‚ systemctl status nginx â”‚ Success   â”‚  â”‚
â”‚   â”‚  â”‚ 14:25 â”‚ df -h                  â”‚ Success   â”‚  â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Server selector dropdown with status indicators
- Pre-built quick actions (buttons) with confirmation dialogs for destructive actions
- Custom command input with output terminal (monospace, dark themed)
- Command history with status and re-run capability
- Real-time command execution feedback via Socket.IO

### 3.8 Settings Page

```
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚   â”‚  Settings                                          â”‚
â”‚ S â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ I â”‚                                                    â”‚
â”‚ D â”‚  [General] [Notifications] [Users] [Agent] [About]â”‚
â”‚ E â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€     â”‚
â”‚ B â”‚                                                    â”‚
â”‚ A â”‚  General Settings                                  â”‚
â”‚ R â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚   â”‚  â”‚ Application Name    [iMonitor          ]   â”‚  â”‚
â”‚   â”‚  â”‚ Dashboard Refresh   [30s â–¼]                â”‚  â”‚
â”‚   â”‚  â”‚ Data Retention      [90 days â–¼]            â”‚  â”‚
â”‚   â”‚  â”‚ Default Time Range  [24 hours â–¼]           â”‚  â”‚
â”‚   â”‚  â”‚ Theme               [System â–¼]             â”‚  â”‚
â”‚   â”‚  â”‚ Date Format         [YYYY-MM-DD â–¼]         â”‚  â”‚
â”‚   â”‚  â”‚                                             â”‚  â”‚
â”‚   â”‚  â”‚                           [Save Changes]   â”‚  â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚   â”‚                                                    â”‚
â”‚   â”‚  Notifications (SMTP)                             â”‚
â”‚   â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚   â”‚  â”‚ SMTP Host     [smtp.company.com      ]     â”‚  â”‚
â”‚   â”‚  â”‚ SMTP Port     [587                   ]     â”‚  â”‚
â”‚   â”‚  â”‚ Username      [alerts@company.com    ]     â”‚  â”‚
â”‚   â”‚  â”‚ Password      [â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢         ðŸ‘? ]     â”‚  â”‚
â”‚   â”‚  â”‚ From Address  [noreply@company.com   ]     â”‚  â”‚
â”‚   â”‚  â”‚ TLS           [â—? Enabled â—‹ Disabled]       â”‚  â”‚
â”‚   â”‚  â”‚                                             â”‚  â”‚
â”‚   â”‚  â”‚               [Test Email] [Save Changes]  â”‚  â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Tabs:**
- **General:** App-wide settings, theme, data retention
- **Notifications:** SMTP configuration with test email button
- **Users:** User management table (add/edit/delete users, role assignment)
- **Agent:** Default agent config, download agent installer
- **About:** Version info, license, system health

---

## 4. Navigation & Routing Architecture

### 4.1 Route Map

```
/                           â†’ Redirect to /dashboard
/login                      â†’ LoginPage (public)
/forgot-password            â†’ ForgotPasswordPage (public)
/reset-password/:token      â†’ ResetPasswordPage (public)

/dashboard                  â†’ DashboardPage (protected)

/servers                    â†’ ServerListPage (protected)
/servers/:id                â†’ ServerDetailPage (protected)
/servers/:id/processes      â†’ ServerDetailPage [Processes tab]
/servers/:id/logs           â†’ ServerDetailPage [Logs tab]
/servers/:id/alerts         â†’ ServerDetailPage [Alerts tab]
/servers/:id/config         â†’ ServerDetailPage [Config tab]

/groups                     â†’ ServerGroupsPage (protected)
/groups/:id                 â†’ GroupDetailPage (protected)

/alerts                     â†’ AlertsPage (protected)
/alerts/rules               â†’ AlertRulesPage (protected)
/alerts/rules/new           â†’ AlertRuleFormPage (protected)
/alerts/rules/:id/edit      â†’ AlertRuleFormPage (protected)

/remote                     â†’ RemoteControlPage (protected)

/settings                   â†’ SettingsPage (protected, admin only)
/settings/notifications     â†’ SettingsPage [Notifications tab]
/settings/users             â†’ SettingsPage [Users tab]
/settings/agent             â†’ SettingsPage [Agent tab]

/404                        â†’ NotFoundPage
```

### 4.2 Navigation Structure

#### Sidebar Navigation (Primary)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚  ðŸ–¥ iMonitor         â”‚
â”‚                      â”‚
â”‚  ðŸ“Š Dashboard        â”‚
â”‚  ðŸ–¥ Servers          â”‚
â”‚  ðŸ“? Server Groups    â”‚
â”‚  ðŸ”” Alerts           â”‚  â†? Badge with active alert count
â”‚  ðŸŽ® Remote Control   â”‚
â”‚                      â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€   â”‚
â”‚                      â”‚
â”‚  âš™ Settings          â”‚  â†? Admin only
â”‚                      â”‚
â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€   â”‚
â”‚  [â—€ Collapse]        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Collapsible: text labels hide, only icons remain (64px width)
- Active route highlighted with primary color left border + background tint
- Collapsed state persisted in localStorage
- On mobile: sidebar becomes overlay drawer with backdrop

#### Top Bar (Secondary)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚ â˜°  Page Title         [ðŸ”? Cmd+K]  [ðŸ”” 3]  [ðŸ‘¤ â–¼]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Hamburger (â˜°) toggles sidebar on mobile
- Page title with breadcrumb on sub-pages: `Servers > prod-web-01`
- Command palette trigger (Cmd+K / Ctrl+K)
- Notification bell with unread count badge
- User avatar dropdown: Profile, Theme toggle, Sign Out

### 4.3 Auth Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚  Login   â”‚â”€â”€â”€â”€â–¶â”‚ JWT Token â”‚â”€â”€â”€â”€â–¶â”‚  Protected   â”‚
â”‚  Page    â”‚     â”‚  Stored   â”‚     â”‚  Routes      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚                    â”‚
                       â–¼                    â–¼
                 â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
                 â”‚  Refresh  â”‚â—€â”€â”€â”€â”€â”‚ 401 Response  â”‚
                 â”‚  Token    â”‚     â”‚  Interceptor  â”‚
                 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- JWT stored in httpOnly cookie (preferred) or secure localStorage
- Axios interceptor handles 401 â†’ attempt refresh â†’ redirect to login if refresh fails
- Route guard (`ProtectedRoute` wrapper) checks auth state before rendering
- Role-based route guard for admin-only pages (`/settings`)

---

## 5. Responsive Breakpoints & Adaptive Layouts

### 5.1 Breakpoint Definitions

| Token | Min Width | Tailwind | Target Devices |
|---|---|---|---|
| `xs` | 0px | default | Small phones (portrait) |
| `sm` | 640px | `sm:` | Large phones (landscape) |
| `md` | 768px | `md:` | Tablets (portrait) |
| `lg` | 1024px | `lg:` | Tablets (landscape), small laptops |
| `xl` | 1280px | `xl:` | Desktops |
| `2xl` | 1536px | `2xl:` | Large desktops, ultra-wide |

### 5.2 Layout Adaptations

| Element | xs-sm (< 768) | md-lg (768-1279) | xl+ (1280+) |
|---|---|---|---|
| **Sidebar** | Hidden â†’ hamburger drawer | Collapsed (icons only, 64px) | Expanded (260px) |
| **Top bar** | Hamburger + avatar only | Full with search | Full with search |
| **KPI cards** | 2Ã—2 grid | 4Ã—1 row | 4Ã—1 row |
| **Dashboard charts** | 1 column, stacked | 2 columns | 2 columns |
| **Server list** | Card list (no table) | Compact table | Full table with sparklines |
| **Server detail gauges** | 2Ã—2 grid | 4Ã—1 row | 4Ã—1 row |
| **Server detail charts** | 1 column | 2 columns | 2 columns |
| **Alert cards** | Full width, stacked | Full width, stacked | Full width, stacked |
| **Settings form** | Full width | 2/3 width centered | 1/2 width centered |
| **Modals** | Full screen (bottom sheet) | Centered, max 600px | Centered, max 600px |
| **Data tables** | Horizontal scroll or card view | Responsive columns | All columns visible |
| **Command palette** | Full width, 90% height | 640px centered | 640px centered |

### 5.3 Touch Adaptations (< md)

- Increase tap targets to minimum 44Ã—44px
- Swipe-to-dismiss on toast notifications
- Pull-to-refresh on server list
- Bottom sheet for action menus instead of dropdowns
- Larger chart touch targets for tooltips

---

## 6. Animation & Transition Specifications

### 6.1 Timing Tokens

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `duration-instant` | 100ms | `ease-out` | Hover color changes, opacity |
| `duration-fast` | 150ms | `ease-out` | Button press, toggle switches |
| `duration-normal` | 200ms | `ease-in-out` | Dropdown open, card expand |
| `duration-slow` | 300ms | `ease-in-out` | Modal enter, sidebar collapse |
| `duration-slower` | 500ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Page transitions, chart animations |

### 6.2 Animation Catalog

| Animation | Trigger | Specification |
|---|---|---|
| **Page enter** | Route change | Fade in (opacity 0â†’1) + slide up 8px, `duration-slower` |
| **Card hover lift** | Mouse enter on interactive card | `translateY(-2px)` + `shadow-md`, `duration-fast` |
| **Sidebar collapse** | Toggle button click | Width 260pxâ†’64px, labels fade out, `duration-slow` |
| **Modal enter** | Open modal | Backdrop fade in + modal scale 0.95â†’1 + fade in, `duration-slow` |
| **Modal exit** | Close modal | Reverse of enter, `duration-normal` |
| **Dropdown open** | Click trigger | Scale Y 0.95â†’1 + opacity 0â†’1 from origin, `duration-normal` |
| **Toast enter** | New notification | Slide in from right 100%â†’0, `duration-slow` |
| **Toast exit** | Dismiss/timeout | Slide out to right + fade, `duration-normal` |
| **Status dot pulse** | Critical/warning status | Infinite pulse (scale 1â†’1.5, opacity 1â†’0), 2s period |
| **Skeleton shimmer** | Loading state | Linear gradient sweep leftâ†’right, 1.5s infinite |
| **Chart data update** | New real-time data | Point slides in from right, line extends, `duration-slower` |
| **Gauge fill** | Initial load / data change | Arc fill from 0 to target, `duration-slower`, overshoot easing |
| **Row expand** | Click expand button | Height auto with `max-height` transition, `duration-normal` |
| **Command palette** | Cmd+K | Backdrop fade + modal slides down from top, `duration-slow` |
| **Counter increment** | KPI value change | Number roll/count animation, `duration-slower` |

### 6.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

All animations respect `prefers-reduced-motion`. Functional transitions (sidebar collapse, modal) use instant transitions instead.

---

## 7. Form Design Patterns & Validation UX

### 7.1 Form Layout Principles

```
Label (above)
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚ Input value                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
Helper text or error message below

Spacing: 
  - Label to input: 6px (space-1.5)
  - Input to helper/error: 4px (space-1)
  - Between field groups: 16px (space-4)
  - Form section gap: 24px (space-6)
```

### 7.2 Validation Strategy

| Strategy | When Applied | Example |
|---|---|---|
| **On blur** | First interaction | Email format check when user tabs away |
| **On change** (after blur error) | After first error shown | Real-time correction feedback |
| **On submit** | Form submission | Server-side uniqueness checks |
| **Debounced (300ms)** | Live search, username check | Server name availability |

### 7.3 Validation States

```
Default:
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
  â”‚ placeholder text         â”‚   border: --border-default
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Focused:
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
  â”‚ user input               â”‚   border: --primary-500, ring: 2px primary/20%
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Error:
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
  â”‚ invalid input            â”‚   border: --status-critical
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
  âš  Error message in red          text: --status-critical

Success (optional, for async validation):
  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
  â”‚ valid input            âœ“ â”‚   border: --status-healthy
  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 7.4 Form Patterns by Page

| Form | Fields | Validation Rules |
|---|---|---|
| **Login** | Email*, Password* | Email format, password required, server-side credential check |
| **Add Server** | Hostname*, IP/FQDN*, Group, Description, Port | Hostname unique, valid IP/FQDN, port 1-65535 |
| **Create Group** | Name*, Description, Parent Group, Color | Name unique, max 100 chars |
| **Alert Rule** | Name*, Metric*, Operator*, Threshold*, Duration*, Notification Channel* | Threshold numeric, duration > 0 |
| **SMTP Settings** | Host*, Port*, Username, Password, From*, TLS | Valid host, port 1-65535, valid email for From |
| **User Management** | Name*, Email*, Role*, Password* | Email unique & valid, password min 8 chars |

### 7.5 Confirmation Patterns

**Destructive actions** require a confirmation dialog:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚  âš   Delete Server                       â”‚
â”‚                                         â”‚
â”‚  Are you sure you want to remove        â”‚
â”‚  "prod-web-01"? This will disconnect    â”‚
â”‚  the agent and delete all metrics.      â”‚
â”‚                                         â”‚
â”‚  Type "prod-web-01" to confirm:         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚  â”‚                                   â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                         â”‚
â”‚              [Cancel]  [Delete Server]  â”‚
â”‚                          (red button)   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

High-severity actions (delete server, restart server) require typing the resource name.

---

## 8. Error & Empty State Designs

### 8.1 Error States

#### Inline Field Error
- Red border on input
- Error icon (âš ) + message below field in `--status-critical` color
- Message is specific: "Email must be a valid address" not "Invalid input"

#### API Error Toast
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚ ðŸ”´  Failed to load server metrics        â”‚
â”‚     Connection timed out. Retrying in 5s â”‚
â”‚                            [Retry Now]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### Full Page Error (500)
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚                                                â”‚
â”‚           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?                 â”‚
â”‚           â”‚   âš¡ (illo)      â”‚                 â”‚
â”‚           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                 â”‚
â”‚                                                â”‚
â”‚        Something went wrong                    â”‚
â”‚                                                â”‚
â”‚   We're having trouble loading this page.      â”‚
â”‚   Our team has been notified.                  â”‚
â”‚                                                â”‚
â”‚       [Try Again]    [Go to Dashboard]         â”‚
â”‚                                                â”‚
â”‚   Error ID: ERR-20260324-XK92F                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### Connection Lost Banner
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚ âš   Real-time connection lost. Reconnecting...  âœ•  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```
Persistent banner at top of content area (below navbar), amber background, auto-dismisses when reconnected.

#### 404 Not Found
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚                                                â”‚
â”‚           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?                 â”‚
â”‚           â”‚   ðŸ”? (illo)      â”‚                 â”‚
â”‚           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                 â”‚
â”‚                                                â”‚
â”‚           Page not found                       â”‚
â”‚                                                â”‚
â”‚   The page you're looking for doesn't exist    â”‚
â”‚   or has been moved.                           â”‚
â”‚                                                â”‚
â”‚            [Go to Dashboard]                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 8.2 Empty States

#### No Servers Yet
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚                                                â”‚
â”‚           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?                 â”‚
â”‚           â”‚   ðŸ–¥ (illo)      â”‚                 â”‚
â”‚           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                 â”‚
â”‚                                                â”‚
â”‚        No servers monitored yet                â”‚
â”‚                                                â”‚
â”‚   Add your first server to start monitoring    â”‚
â”‚   CPU, memory, disk, and network metrics.      â”‚
â”‚                                                â”‚
â”‚           [+ Add First Server]                 â”‚
â”‚                                                â”‚
â”‚   ðŸ“– Read the setup guide                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### No Alerts
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?                 â”‚
â”‚           â”‚   âœ… (illo)      â”‚                 â”‚
â”‚           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                 â”‚
â”‚                                                â”‚
â”‚        All quiet â€” no active alerts            â”‚
â”‚                                                â”‚
â”‚   All your servers are operating within        â”‚
â”‚   defined thresholds.                          â”‚
â”‚                                                â”‚
â”‚          [View Alert Rules]                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### No Search Results
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚           No results for "xyz-server"          â”‚
â”‚                                                â”‚
â”‚   Try adjusting your search or filters.        â”‚
â”‚   [Clear Filters]                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### No Groups
```
Illustration + "Organize your servers"
"Create groups to organize servers by environment, 
 location, or team."
[+ Create First Group]
```

---

## 9. Loading & Skeleton Screen Patterns

### 9.1 Page-Level Loading

On initial page load or route transition, show skeleton screens that mirror the page structure:

#### Dashboard Skeleton
```
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚   â”‚                                            â”‚
â”‚ S â”‚  â”Œâ”€â”€â–‘â–‘â–‘â–‘â”? â”Œâ”€â”€â–‘â–‘â–‘â–‘â”? â”Œâ”€â”€â–‘â–‘â–‘â–‘â”? â”Œâ”€â”€â–‘â–‘â–‘â–‘â”?    â”‚
â”‚ I â”‚  â”‚ â–‘â–‘â–‘â–‘ â”‚ â”‚ â–‘â–‘â–‘â–‘ â”‚ â”‚ â–‘â–‘â–‘â–‘ â”‚ â”‚ â–‘â–‘â–‘â–‘ â”‚    â”‚
â”‚ D â”‚  â”‚ â–‘â–‘   â”‚ â”‚ â–‘â–‘   â”‚ â”‚ â–‘â–‘   â”‚ â”‚ â–‘â–‘   â”‚    â”‚
â”‚ E â”‚  â””â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚ B â”‚                                            â”‚
â”‚ A â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”? â”‚
â”‚ R â”‚  â”‚ â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘ â”‚ â”‚ â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘ â”‚ â”‚
â”‚   â”‚  â”‚ â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘ â”‚ â”‚ â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘ â”‚ â”‚
â”‚   â”‚  â”‚ â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘ â”‚ â”‚ â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘ â”‚ â”‚
â”‚   â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â–‘ = Animated shimmer blocks (light gray â†’ lighter gray sweep)
```

### 9.2 Component-Level Skeletons

| Component | Skeleton Shape |
|---|---|
| **MetricCard** | Rectangle for number, smaller rectangle for label |
| **Chart** | Rectangle matching chart area dimensions |
| **Table row** | Row of rectangles matching column widths |
| **ServerCard** | Circle (status dot) + rectangles for text + bars for metrics |
| **AlertCard** | Colored left stripe (gray) + text rectangles |
| **Avatar** | Circle |
| **Badge** | Small rounded rectangle |

### 9.3 Loading States

| Scenario | Treatment |
|---|---|
| **Initial page load** | Full skeleton screen |
| **Data refresh** (already have data) | Subtle top progress bar (thin blue line) |
| **Button action** (Save, Delete) | Button shows spinner, text changes to "Saving...", disabled |
| **Infinite scroll** | Skeleton rows appended at bottom |
| **Real-time reconnecting** | Amber banner + stale data shown with "Last updated: X ago" |
| **Chart loading** | Skeleton rectangle with shimmer |
| **Command palette search** | Typing indicator â†’ results fade in |

### 9.4 Shimmer Animation

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-surface) 25%,
    var(--bg-surface-raised) 50%,
    var(--bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 9.5 Progressive Loading

Dashboard loads in priority order:
1. **Instant:** Sidebar, top bar, page structure (skeleton)
2. **P0 (< 500ms):** KPI cards (lightweight API call)
3. **P1 (< 1s):** Alert summary, server health map
4. **P2 (< 2s):** Charts (heavier data)
5. **P3 (background):** WebSocket connection for real-time updates

---

## 10. Accessibility Guidelines (WCAG 2.1 AA)

### 10.1 Color & Contrast

| Requirement | Standard | Implementation |
|---|---|---|
| Text contrast (normal) | â‰¥ 4.5:1 | All `--text-primary` on `--bg-surface` = 15.4:1 âœ“ |
| Text contrast (large) | â‰¥ 3:1 | All heading colors verified |
| Non-text contrast | â‰¥ 3:1 | Borders, icons, chart elements |
| Status colors | Never rely on color alone | Always pair with icon + text label |

**Status indicators must combine:**
- Color (green/amber/red/gray)
- Icon (âœ“ / âš  / âœ• / ?)
- Text label ("Online" / "Warning" / "Critical" / "Unknown")

### 10.2 Keyboard Navigation

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move focus forward/backward through interactive elements |
| `Enter` / `Space` | Activate buttons, links, toggles |
| `Escape` | Close modal, dropdown, command palette |
| `Arrow keys` | Navigate within menus, tables, tree views |
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `Home` / `End` | First/last item in lists |

**Focus management:**
- Visible focus ring: 2px solid `--primary-500` with 2px offset
- Focus trap in modals and dialogs
- Focus returns to trigger element on modal close
- Skip-to-content link as first focusable element

### 10.3 Screen Reader Support

| Element | ARIA Implementation |
|---|---|
| **Sidebar navigation** | `<nav aria-label="Main navigation">`, `aria-current="page"` on active link |
| **Status badges** | `role="status"`, `aria-label="Server prod-web-01 status: online"` |
| **Metric cards** | `aria-label="CPU usage: 45 percent, up 3 percent from last hour"` |
| **Charts** | `role="img"`, `aria-label` with summary, data table alternative |
| **Data tables** | Proper `<th scope>`, `aria-sort`, `aria-label` for action buttons |
| **Modals** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title |
| **Toasts** | `role="alert"`, `aria-live="assertive"` for errors, `aria-live="polite"` for info |
| **Loading states** | `aria-busy="true"`, `aria-label="Loading server data"` |
| **Expandable rows** | `aria-expanded`, `aria-controls` |
| **Alert count badge** | `aria-label="3 active alerts"` on notification bell |

### 10.4 Charts Accessibility

Every chart must provide:
1. A text summary via `aria-label`: "CPU usage over last 24 hours, currently at 45%, peak at 92% at 3:00 AM"
2. A toggleable data table view (`<table>` alternative)
3. Keyboard-accessible tooltips (arrow keys to navigate data points)
4. Sufficient color contrast between data series + pattern fills as alternative

### 10.5 Motion & Sensory

- Respect `prefers-reduced-motion` (see Â§6.3)
- Respect `prefers-color-scheme` for auto dark/light mode
- No content that flashes more than 3 times per second
- No audio auto-play for alert sounds (user must opt-in)

### 10.6 Form Accessibility

- All inputs have visible `<label>` elements (not just placeholder)
- Error messages linked via `aria-describedby`
- Required fields marked with `aria-required="true"` and visible asterisk
- Form errors announced via `aria-live` region
- Autocomplete attributes on login form (`username`, `current-password`)

---

## 11. Dark/Light Mode Considerations

### 11.1 Mode Selection

Three modes available via Settings and top-bar user dropdown:

| Mode | Behavior |
|---|---|
| **Light** | Always use light theme |
| **Dark** | Always use dark theme |
| **System** (default) | Follow OS `prefers-color-scheme` |

Persisted in `localStorage` key: `imonitor-theme`.

### 11.2 Implementation Strategy

Using Tailwind's `class` strategy with a `.dark` class on `<html>`:

```tsx
// ThemeProvider wraps app
// Reads from localStorage â†’ falls back to system preference
// Applies "dark" class to document.documentElement
```

All color tokens defined as CSS custom properties with light/dark variants (see Â§1.1).

### 11.3 Dark Mode Specific Adjustments

| Element | Light | Dark | Rationale |
|---|---|---|---|
| **Shadows** | Standard shadow values | Increased opacity (see Â§1.5) | Dark surfaces absorb shadows |
| **Borders** | `slate-200` | `slate-700` | Subtle separation without brightness |
| **Charts** | Standard palette | Slightly brighter variants (+10% lightness) | Visibility on dark backgrounds |
| **Status colors** | Standard | No change (already vibrant enough) | Semantic colors remain consistent |
| **Images/illustrations** | Standard | Slightly reduced brightness (90%) | Prevent eye strain |
| **Code blocks** | Light background | Dark background (already dark-native) | Familiar code editor feel |
| **Skeleton shimmer** | Light gray sweep | Dark gray sweep | Match surface colors |
| **Scrollbars** | OS default | Styled dark | Visual consistency |

### 11.4 Transition Between Modes

```css
html.theme-transitioning,
html.theme-transitioning *,
html.theme-transitioning *::before,
html.theme-transitioning *::after {
  transition: background-color 200ms ease-in-out,
              border-color 200ms ease-in-out,
              color 200ms ease-in-out !important;
}
```

Class added/removed programmatically to prevent flash on page load.

### 11.5 Component-Specific Dark Mode Notes

- **Metric gauges:** Use slightly thicker strokes (2px â†’ 3px) for visibility
- **Server health map dots:** Add subtle white outline (1px) for definition
- **Toast notifications:** Use `--bg-surface-raised` instead of white background
- **Command palette:** Dark backdrop opacity increased from 50% to 70%
- **Login page:** Background pattern/gradient adjusted for dark variant

---

## 12. Icon & Illustration Guidelines

### 12.1 Icon System

**Library:** [Lucide React](https://lucide.dev/) (consistent, MIT-licensed, tree-shakeable)

**Sizing:**

| Context | Size | Stroke Width |
|---|---|---|
| Inline with body text | 16px | 2px |
| Buttons, inputs | 18px | 2px |
| Navigation items | 20px | 1.75px |
| Card headers | 20px | 1.75px |
| Empty state accents | 24px | 1.5px |
| Feature illustration accent | 48px | 1.5px |

**Color rules:**
- Navigation icons: `--text-secondary`, active: `--primary-500`
- Status icons: Inherit semantic color of parent badge/indicator
- Action icons (buttons): Inherit button text color
- Decorative icons: `--text-tertiary`

### 12.2 Icon Inventory

| Category | Icons |
|---|---|
| **Navigation** | `LayoutDashboard`, `Server`, `FolderTree`, `Bell`, `Gamepad2`, `Settings` |
| **Server status** | `CheckCircle2` (online), `AlertTriangle` (warning), `XCircle` (critical), `HelpCircle` (unknown), `Wrench` (maintenance) |
| **Actions** | `Plus`, `Pencil`, `Trash2`, `RotateCcw` (restart), `Play`, `Square` (stop), `Terminal`, `Download`, `Upload`, `Copy`, `ExternalLink` |
| **Metrics** | `Cpu`, `MemoryStick`, `HardDrive`, `Network`, `Activity`, `Gauge`, `TrendingUp`, `TrendingDown` |
| **Alerts** | `Bell`, `BellRing`, `BellOff`, `Volume2`, `VolumeX`, `Mail` |
| **UI** | `Search`, `ChevronDown`, `ChevronRight`, `X`, `Menu`, `Moon`, `Sun`, `Monitor` (system theme), `Eye`, `EyeOff`, `Filter`, `SortAsc`, `SortDesc`, `MoreVertical`, `ArrowLeft` |
| **Auth** | `LogIn`, `LogOut`, `User`, `Shield`, `Key` |

### 12.3 Illustration Style

For empty states and error pages, use **simple line illustrations** with:

- Stroke-based style matching Lucide icon aesthetic
- Maximum 2-3 colors: primary blue + neutral gray + one accent
- Consistent 2px stroke weight
- Rounded corners/caps
- Max size: 200Ã—200px
- Dark mode: Invert light fills, maintain stroke colors

**Illustration inventory:**

| Scene | Usage | Description |
|---|---|---|
| `empty-servers` | No servers page | Monitor with plus icon |
| `empty-alerts` | No alerts | Shield with checkmark |
| `empty-groups` | No groups | Folders with connection lines |
| `empty-search` | No search results | Magnifying glass with question mark |
| `error-500` | Server error | Lightning bolt hitting server |
| `error-404` | Not found | Telescope looking at empty space |
| `error-connection` | Connection lost | Broken chain link |
| `welcome` | First-time setup | Rocket ship |

### 12.4 Favicon & App Icon

- **Favicon:** 32Ã—32px, simplified server monitor icon in primary blue
- **Apple touch icon:** 180Ã—180px
- **PWA icons:** 192Ã—192, 512Ã—512 (if PWA support added later)
- **Logo mark:** Stylized server/monitor icon
- **Logo wordmark:** "iMonitor" in Inter Bold, primary-700

---

## Appendix A: Design Token Export Format

All tokens should be exported as:

1. **Tailwind config** (`tailwind.config.ts`) â€” extend theme with custom tokens
2. **CSS custom properties** (`:root` and `.dark` selectors) â€” for non-Tailwind usage
3. **TypeScript constants** (`tokens.ts`) â€” for programmatic access in components

## Appendix B: Component File Structure

```
src/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/                    # shadcn/ui base components
â”‚   â”‚   â”œâ”€â”€ button.tsx
â”‚   â”‚   â”œâ”€â”€ input.tsx
â”‚   â”‚   â”œâ”€â”€ badge.tsx
â”‚   â”‚   â”œâ”€â”€ card.tsx
â”‚   â”‚   â”œâ”€â”€ dialog.tsx
â”‚   â”‚   â”œâ”€â”€ table.tsx
â”‚   â”‚   â”œâ”€â”€ toast.tsx
â”‚   â”‚   â”œâ”€â”€ dropdown-menu.tsx
â”‚   â”‚   â”œâ”€â”€ tabs.tsx
â”‚   â”‚   â”œâ”€â”€ skeleton.tsx
â”‚   â”‚   â””â”€â”€ ...
â”‚   â”œâ”€â”€ domain/                # Domain-specific components
â”‚   â”‚   â”œâ”€â”€ ServerStatusCard.tsx
â”‚   â”‚   â”œâ”€â”€ MetricGauge.tsx
â”‚   â”‚   â”œâ”€â”€ RealtimeChart.tsx
â”‚   â”‚   â”œâ”€â”€ AlertRuleBuilder.tsx
â”‚   â”‚   â”œâ”€â”€ ServerGroupTree.tsx
â”‚   â”‚   â”œâ”€â”€ CommandPalette.tsx
â”‚   â”‚   â”œâ”€â”€ LogViewer.tsx
â”‚   â”‚   â””â”€â”€ StatusBadge.tsx
â”‚   â”œâ”€â”€ layout/                # Layout components
â”‚   â”‚   â”œâ”€â”€ AppShell.tsx
â”‚   â”‚   â”œâ”€â”€ Sidebar.tsx
â”‚   â”‚   â”œâ”€â”€ TopBar.tsx
â”‚   â”‚   â”œâ”€â”€ PageHeader.tsx
â”‚   â”‚   â””â”€â”€ ProtectedRoute.tsx
â”‚   â””â”€â”€ shared/                # Shared/utility components
â”‚       â”œâ”€â”€ EmptyState.tsx
â”‚       â”œâ”€â”€ ErrorBoundary.tsx
â”‚       â”œâ”€â”€ SkeletonPage.tsx
â”‚       â”œâ”€â”€ ConfirmDialog.tsx
â”‚       â””â”€â”€ ThemeProvider.tsx
â”œâ”€â”€ pages/
â”‚   â”œâ”€â”€ LoginPage.tsx
â”‚   â”œâ”€â”€ DashboardPage.tsx
â”‚   â”œâ”€â”€ ServerListPage.tsx
â”‚   â”œâ”€â”€ ServerDetailPage.tsx
â”‚   â”œâ”€â”€ ServerGroupsPage.tsx
â”‚   â”œâ”€â”€ AlertsPage.tsx
â”‚   â”œâ”€â”€ AlertRulesPage.tsx
â”‚   â”œâ”€â”€ RemoteControlPage.tsx
â”‚   â”œâ”€â”€ SettingsPage.tsx
â”‚   â””â”€â”€ NotFoundPage.tsx
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ useSocket.ts
â”‚   â”œâ”€â”€ useAuth.ts
â”‚   â”œâ”€â”€ useTheme.ts
â”‚   â””â”€â”€ useServerMetrics.ts
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ tokens.ts
â”‚   â””â”€â”€ api.ts
â””â”€â”€ styles/
    â””â”€â”€ globals.css
```

---

*This design plan serves as the single source of truth for all UI/UX decisions in the iMonitorServer project. All implementation should reference this document to ensure visual and behavioral consistency across the application.*