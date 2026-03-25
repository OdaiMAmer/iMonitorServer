# iMonitorServer â€” Backend Requirements Plan

## Table of Contents

1. [API Architecture](#1-api-architecture)
2. [Authentication & Authorization Strategy](#2-authentication--authorization-strategy)
3. [Database Schema Design & Relationships](#3-database-schema-design--relationships)
4. [Data Validation & Business Rules](#4-data-validation--business-rules)
5. [External Integrations & Third-Party Services](#5-external-integrations--third-party-services)
6. [Caching Strategy](#6-caching-strategy)
7. [Background Jobs & Queue Processing](#7-background-jobs--queue-processing)
8. [File Storage & Media Handling](#8-file-storage--media-handling)
9. [Logging, Monitoring & Observability](#9-logging-monitoring--observability)
10. [Scalability & Performance Requirements](#10-scalability--performance-requirements)
11. [Security Requirements (OWASP Top 10)](#11-security-requirements-owasp-top-10)
12. [Deployment & Infrastructure Requirements](#12-deployment--infrastructure-requirements)

---

## 1. API Architecture

### 1.1 Protocol Decisions

| Communication Layer | Protocol | Justification |
|---|---|---|
| Client â†” Backend | REST (HTTP/JSON) | Standard CRUD operations, broad tooling support, TanStack Query integration |
| Real-Time Client â†” Backend | Socket.IO (WebSocket) | Push-based metric updates, alert notifications, service status changes |
| Agent â†” Backend (Data Collection) | REST (HTTP/JSON) | Heartbeat POST every 30s, bulk metric uploads, registration |
| Agent â†” Backend (Commands) | Socket.IO (WebSocket) | Real-time bidirectional commands (kill process, restart service, shutdown) |

> **Decision**: No GraphQL or gRPC. REST is sufficient for CRUD-heavy operations. The monitoring domain benefits from WebSocket push rather than GraphQL subscriptions. gRPC adds unnecessary complexity for a single-tenant system.

### 1.2 API Versioning

- **Strategy**: URI prefix versioning â€” `/api/v1/*`
- **Rationale**: Explicit, easy to proxy, clear separation for future breaking changes
- All endpoints live under `/api/v1/` from day one

### 1.3 Module Decomposition

```
src/
â”œâ”€â”€ modules/
â”‚   â”œâ”€â”€ auth/              # JWT login, refresh, registration, guards
â”‚   â”œâ”€â”€ users/             # User CRUD, role assignment, profile
â”‚   â”œâ”€â”€ servers/           # Server CRUD, registration, heartbeat, groups
â”‚   â”œâ”€â”€ metrics/           # Time-series storage, aggregation, historical queries
â”‚   â”œâ”€â”€ processes/         # Process list, kill commands via agent
â”‚   â”œâ”€â”€ services/          # Windows service enumeration, start/stop/restart
â”‚   â”œâ”€â”€ event-logs/        # Windows Event Log streaming and storage
â”‚   â”œâ”€â”€ alerts/            # Alert rules, evaluation engine, notification dispatch
â”‚   â”œâ”€â”€ notifications/     # Email (SMTP), webhook, in-app notification channels
â”‚   â”œâ”€â”€ remote-control/    # Server shutdown/restart, PowerShell exec, RDP file gen
â”‚   â”œâ”€â”€ audit/             # Audit log recording and retrieval
â”‚   â””â”€â”€ dashboard/         # Aggregated dashboard endpoints, group summaries
â”œâ”€â”€ gateway/               # Socket.IO gateway (WebSocket handlers)
â”œâ”€â”€ common/                # Guards, decorators, interceptors, filters, pipes
â”œâ”€â”€ config/                # Configuration module (env-based)
â””â”€â”€ prisma/                # Prisma service, schema, migrations
```

### 1.4 REST Endpoint Map

#### Auth Module
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | User login (email + password) | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Refresh Token |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token | JWT |
| `POST` | `/api/v1/auth/change-password` | Change own password | JWT |

#### Users Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/users` | List all users | Admin |
| `POST` | `/api/v1/users` | Create user with role | Admin |
| `GET` | `/api/v1/users/:id` | Get user details | Admin |
| `PATCH` | `/api/v1/users/:id` | Update user (role, status) | Admin |
| `DELETE` | `/api/v1/users/:id` | Soft-delete user | Admin |
| `GET` | `/api/v1/users/me` | Get current user profile | JWT |

#### Servers Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/servers` | List all servers (filterable by group/status) | Viewer+ |
| `POST` | `/api/v1/servers/register` | Agent self-registration | Agent API Key |
| `GET` | `/api/v1/servers/:id` | Get server details + latest metrics | Viewer+ |
| `PATCH` | `/api/v1/servers/:id` | Update server metadata (name, groups) | Operator+ |
| `DELETE` | `/api/v1/servers/:id` | Deregister server | Admin |
| `POST` | `/api/v1/servers/:id/heartbeat` | Agent heartbeat with metrics payload | Agent API Key |
| `GET` | `/api/v1/servers/:id/health` | Get server health summary | Viewer+ |

#### Server Groups Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/server-groups` | List all groups | Viewer+ |
| `POST` | `/api/v1/server-groups` | Create group | Admin |
| `PATCH` | `/api/v1/server-groups/:id` | Update group | Admin |
| `DELETE` | `/api/v1/server-groups/:id` | Delete group | Admin |
| `POST` | `/api/v1/server-groups/:id/servers` | Assign servers to group (bulk) | Operator+ |
| `DELETE` | `/api/v1/server-groups/:id/servers` | Remove servers from group (bulk) | Operator+ |

#### Metrics Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/servers/:id/metrics` | Historical metrics (query params: type, from, to, interval) | Viewer+ |
| `GET` | `/api/v1/servers/:id/metrics/latest` | Latest metric snapshot | Viewer+ |
| `GET` | `/api/v1/metrics/compare` | Compare metrics across servers | Viewer+ |
| `POST` | `/api/v1/servers/:id/metrics/bulk` | Agent bulk metric upload | Agent API Key |

#### Processes Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/servers/:id/processes` | List running processes | Viewer+ |
| `POST` | `/api/v1/servers/:id/processes/:pid/kill` | Kill process by PID | Operator+ |

#### Windows Services Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/servers/:id/services` | List Windows services | Viewer+ |
| `POST` | `/api/v1/servers/:id/services/:name/start` | Start a service | Operator+ |
| `POST` | `/api/v1/servers/:id/services/:name/stop` | Stop a service | Operator+ |
| `POST` | `/api/v1/servers/:id/services/:name/restart` | Restart a service | Operator+ |

#### Event Logs Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/servers/:id/event-logs` | Query event logs (filters: source, level, dateRange, search) | Viewer+ |
| `GET` | `/api/v1/servers/:id/event-logs/stats` | Event log statistics (counts by severity) | Viewer+ |

#### Alerts Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/alerts/rules` | List all alert rules | Viewer+ |
| `POST` | `/api/v1/alerts/rules` | Create alert rule | Admin |
| `PATCH` | `/api/v1/alerts/rules/:id` | Update alert rule | Admin |
| `DELETE` | `/api/v1/alerts/rules/:id` | Delete alert rule | Admin |
| `GET` | `/api/v1/alerts` | List active alerts | Viewer+ |
| `GET` | `/api/v1/alerts/history` | Alert history (paginated) | Viewer+ |
| `POST` | `/api/v1/alerts/:id/acknowledge` | Acknowledge an alert | Operator+ |
| `POST` | `/api/v1/alerts/:id/resolve` | Manually resolve an alert | Operator+ |

#### Notifications Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | List in-app notifications (paginated) | JWT |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark notification as read | JWT |
| `POST` | `/api/v1/notifications/read-all` | Mark all as read | JWT |
| `GET` | `/api/v1/notifications/settings` | Get notification channel settings | Admin |
| `PATCH` | `/api/v1/notifications/settings` | Update SMTP / webhook settings | Admin |
| `POST` | `/api/v1/notifications/settings/test-email` | Send test email | Admin |
| `POST` | `/api/v1/notifications/settings/test-webhook` | Send test webhook | Admin |

#### Remote Control Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `POST` | `/api/v1/servers/:id/remote/restart` | Restart server | Admin |
| `POST` | `/api/v1/servers/:id/remote/shutdown` | Shutdown server | Admin |
| `POST` | `/api/v1/servers/:id/remote/execute` | Execute PowerShell command | Admin |
| `GET` | `/api/v1/servers/:id/remote/rdp-file` | Download RDP file | Operator+ |

#### Audit Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/audit-logs` | Query audit logs (filters: user, action, target, dateRange) | Admin |

#### Dashboard Module
| Method | Endpoint | Description | Auth / Role |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/overview` | Aggregated stats: total servers, alerts, uptime% | Viewer+ |
| `GET` | `/api/v1/dashboard/groups/:id/summary` | Group-level aggregated summary | Viewer+ |

### 1.5 WebSocket Events (Socket.IO Gateway)

#### Server â†’ Client (Push)
| Event | Payload | Description |
|---|---|---|
| `metrics:realtime` | `{ serverId, cpu, memory, disk, network, timestamp }` | Live metric updates (~30s interval) |
| `server:status-changed` | `{ serverId, status, previousStatus }` | Server online/offline/degraded |
| `alert:triggered` | `{ alertId, rule, server, value, severity }` | New alert fired |
| `alert:resolved` | `{ alertId, resolvedBy, resolvedAt }` | Alert auto/manually resolved |
| `process:updated` | `{ serverId, processes[] }` | Process list refreshed |
| `service:status-changed` | `{ serverId, serviceName, newStatus }` | Windows service state change |
| `event-log:new` | `{ serverId, entry }` | New event log entry streamed |
| `notification:new` | `{ notification }` | In-app notification push |
| `command:result` | `{ commandId, status, output, error }` | Remote command execution result |

#### Client â†’ Server (Commands via Socket.IO)
| Event | Payload | Description |
|---|---|---|
| `subscribe:server` | `{ serverId }` | Subscribe to a server's real-time feed |
| `unsubscribe:server` | `{ serverId }` | Unsubscribe from a server's feed |
| `subscribe:dashboard` | `{}` | Subscribe to dashboard-level updates |

#### Rooms Strategy
- Each server gets a Socket.IO room: `server:{serverId}`
- Dashboard room: `dashboard`
- User-specific room: `user:{userId}` (for personal notifications)
- Clients join/leave rooms on navigation

### 1.6 Standard Response Envelope

```typescript
// Success
{
  "success": true,
  "data": T,
  "meta": {
    "timestamp": "2026-03-23T12:00:00Z",
    "requestId": "uuid"
  }
}

// Paginated
{
  "success": true,
  "data": T[],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 142,
    "totalPages": 6,
    "timestamp": "2026-03-23T12:00:00Z",
    "requestId": "uuid"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [{ "field": "email", "message": "Must be valid email" }]
  },
  "meta": {
    "timestamp": "2026-03-23T12:00:00Z",
    "requestId": "uuid"
  }
}
```

### 1.7 HTTP Status Code Conventions

| Code | Usage |
|---|---|
| `200` | Successful GET, PATCH, bulk operations |
| `201` | Successful POST (resource created) |
| `204` | Successful DELETE |
| `400` | Validation errors, malformed requests |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but insufficient role/permissions |
| `404` | Resource not found |
| `409` | Conflict (duplicate registration, etc.) |
| `422` | Business rule violation |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

---

## 2. Authentication & Authorization Strategy

### 2.1 User Authentication (JWT + Refresh Tokens)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     POST /auth/login       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚  Client   â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶â”‚  Auth Module  â”‚
â”‚ (Browser) â”‚     { email, password }    â”‚              â”‚
â”‚           â”‚â—€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚  - Validate   â”‚
â”‚           â”‚  { accessToken,           â”‚  - bcrypt     â”‚
â”‚           â”‚    refreshToken }         â”‚    compare   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Token | Type | Lifetime | Storage (Client) | Payload |
|---|---|---|---|---|
| Access Token | JWT (HS256) | 15 minutes | Memory (Zustand store) | `{ sub, email, role, iat, exp }` |
| Refresh Token | Opaque UUID | 7 days | HttpOnly Secure cookie | Stored in DB, hashed |

**Token Rotation**: Every refresh request issues a new refresh token and invalidates the old one (prevents replay).

**Password Storage**: bcrypt with cost factor 12.

### 2.2 Agent Authentication (API Keys)

| Aspect | Detail |
|---|---|
| Registration | Admin generates a one-time registration token via the dashboard |
| Agent Enrollment | Agent POSTs to `/servers/register` with the registration token + machine info |
| Ongoing Auth | Backend returns a permanent API key (SHA-256 hashed in DB) |
| Header | `X-Agent-Key: <api-key>` on all agent requests |
| Rotation | Admin can regenerate API key; agent re-authenticates on next heartbeat failure |

### 2.3 Role-Based Access Control (RBAC)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚  Admin   â”‚ â”€â”€â–¶â”‚ Operator â”‚ â”€â”€â–¶â”‚ Viewer â”‚
â”‚          â”‚     â”‚          â”‚     â”‚        â”‚
â”‚ Full     â”‚     â”‚ Control  â”‚     â”‚ Read   â”‚
â”‚ Access   â”‚     â”‚ + View   â”‚     â”‚ Only   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Permission | Admin | Operator | Viewer |
|---|---|---|---|
| View dashboards, metrics, logs | âœ… | âœ… | âœ… |
| Kill processes | âœ… | âœ… | â?Œ |
| Start/stop/restart services | âœ… | âœ… | â?Œ |
| Acknowledge/resolve alerts | âœ… | âœ… | â?Œ |
| Download RDP files | âœ… | âœ… | â?Œ |
| Restart/shutdown servers | âœ… | â?Œ | â?Œ |
| Execute PowerShell commands | âœ… | â?Œ | â?Œ |
| Manage alert rules | âœ… | â?Œ | â?Œ |
| Manage users | âœ… | â?Œ | â?Œ |
| Manage server groups | âœ… | â?Œ | â?Œ |
| Manage notification settings | âœ… | â?Œ | â?Œ |
| View audit logs | âœ… | â?Œ | â?Œ |
| Register/deregister servers | âœ… | â?Œ | â?Œ |

**Implementation**:
- Custom `@Roles('Admin', 'Operator')` decorator
- `RolesGuard` (NestJS guard) checks JWT payload role against required roles
- Optional: Group-level RBAC in v2 (Operator for Group A, Viewer for Group B)

### 2.4 Auth Flow Sequence

```
Login Flow:
  Client â†’ POST /auth/login { email, password }
  Server â†’ Validate credentials â†’ bcrypt.compare()
  Server â†’ Generate access token (JWT, 15min)
  Server â†’ Generate refresh token (UUID, 7d) â†’ hash & store in DB
  Server â†’ Set refresh token as HttpOnly Secure SameSite cookie
  Server â†’ Return { accessToken } in response body

Request Flow:
  Client â†’ GET /api/v1/servers (Authorization: Bearer <accessToken>)
  JwtAuthGuard â†’ Validate token signature & expiry
  RolesGuard â†’ Check role from token payload
  Controller â†’ Process request

Refresh Flow:
  Client â†’ POST /auth/refresh (cookie auto-sent)
  Server â†’ Read refresh token from cookie
  Server â†’ Lookup hashed token in DB, verify not expired/revoked
  Server â†’ Issue new access token + new refresh token (rotation)
  Server â†’ Invalidate old refresh token in DB

Logout Flow:
  Client â†’ POST /auth/logout
  Server â†’ Invalidate refresh token in DB
  Server â†’ Clear cookie
```

---

## 3. Database Schema Design & Relationships

### 3.1 Entity Relationship Diagram (Textual)

```
User â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ AuditLog
  â”‚                      â”‚
  â””â”€â”€ Notification       â”‚
                         â”‚
ServerGroup â—„â”€â”€â”€â”€ ServerGroupAssignment â”€â”€â”€â”€â–º Server
                                              â”‚
                                 â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
                                 â”‚            â”‚                â”‚
                              Metric    EventLog     AgentCommand
                                 â”‚
                            AlertRule â”€â”€â”€â”€ Alert â”€â”€â”€â”€ AlertNotification
                                              â”‚
                                         AlertHistory
```

### 3.2 Prisma Schema

```prisma
// â”€â”€â”€ ENUMS â”€â”€â”€

enum UserRole {
  ADMIN
  OPERATOR
  VIEWER
}

enum ServerStatus {
  ONLINE
  OFFLINE
  DEGRADED
  MAINTENANCE
}

enum AlertSeverity {
  CRITICAL
  WARNING
  INFO
}

enum AlertStatus {
  ACTIVE
  ACKNOWLEDGED
  RESOLVED
}

enum MetricType {
  CPU
  MEMORY
  DISK
  NETWORK_IN
  NETWORK_OUT
}

enum CommandType {
  KILL_PROCESS
  START_SERVICE
  STOP_SERVICE
  RESTART_SERVICE
  RESTART_SERVER
  SHUTDOWN_SERVER
  POWERSHELL_EXEC
}

enum CommandStatus {
  PENDING
  SENT
  SUCCESS
  FAILED
  TIMEOUT
}

enum NotificationChannel {
  IN_APP
  EMAIL
  WEBHOOK
}

enum EventLogLevel {
  ERROR
  WARNING
  INFORMATION
  AUDIT_SUCCESS
  AUDIT_FAILURE
}

// â”€â”€â”€ MODELS â”€â”€â”€

model User {
  id             String         @id @default(uuid())
  email          String         @unique
  passwordHash   String
  displayName    String
  role           UserRole       @default(VIEWER)
  isActive       Boolean        @default(true)
  lastLoginAt    DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  refreshTokens  RefreshToken[]
  notifications  Notification[]
  auditLogs      AuditLog[]     @relation("AuditUser")
  acknowledgedAlerts Alert[]    @relation("AlertAcknowledger")

  @@index([email])
  @@index([role])
  @@map("users")
}

model RefreshToken {
  id          String   @id @default(uuid())
  tokenHash   String   @unique
  userId      String
  expiresAt   DateTime
  isRevoked   Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([userId])
  @@map("refresh_tokens")
}

model ServerGroup {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  color       String?  // hex color for UI badge
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  servers     ServerGroupAssignment[]

  @@map("server_groups")
}

model Server {
  id              String       @id @default(uuid())
  hostname        String       @unique
  displayName     String?
  ipAddress       String
  osVersion       String?
  agentVersion    String?
  apiKeyHash      String       @unique
  status          ServerStatus @default(OFFLINE)
  lastHeartbeatAt DateTime?
  registeredAt    DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Hardware info (populated on registration & periodic refresh)
  cpuModel        String?
  cpuCores        Int?
  totalMemoryMb   Int?
  totalDiskGb     Float?

  groups          ServerGroupAssignment[]
  metrics         Metric[]
  eventLogs       EventLog[]
  processes       ProcessSnapshot[]
  windowsServices WindowsServiceSnapshot[]
  commands        AgentCommand[]
  alertRules      AlertRule[]
  alerts          Alert[]
  networkInfo     NetworkSnapshot[]

  @@index([status])
  @@index([lastHeartbeatAt])
  @@index([hostname])
  @@map("servers")
}

model ServerGroupAssignment {
  serverId      String
  serverGroupId String
  assignedAt    DateTime @default(now())

  server        Server      @relation(fields: [serverId], references: [id], onDelete: Cascade)
  serverGroup   ServerGroup @relation(fields: [serverGroupId], references: [id], onDelete: Cascade)

  @@id([serverId, serverGroupId])
  @@map("server_group_assignments")
}

model Metric {
  id        String     @id @default(uuid())
  serverId  String
  type      MetricType
  value     Float      // percentage (0-100) or bytes
  metadata  Json?      // additional details (per-core CPU, per-disk usage, etc.)
  timestamp DateTime   @default(now())

  server    Server     @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@index([serverId, type, timestamp])
  @@index([timestamp])
  @@map("metrics")
}

// Aggregated metrics for long-term storage
model MetricAggregate {
  id         String     @id @default(uuid())
  serverId   String
  type       MetricType
  interval   String     // '5m', '1h', '1d'
  min        Float
  max        Float
  avg        Float
  p95        Float?
  sampleCount Int
  periodStart DateTime
  periodEnd   DateTime

  @@unique([serverId, type, interval, periodStart])
  @@index([serverId, type, periodStart])
  @@map("metric_aggregates")
}

model ProcessSnapshot {
  id         String   @id @default(uuid())
  serverId   String
  pid        Int
  name       String
  cpuPercent Float
  memoryMb   Float
  startTime  DateTime?
  timestamp  DateTime @default(now())

  server     Server   @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@index([serverId, timestamp])
  @@map("process_snapshots")
}

model WindowsServiceSnapshot {
  id          String   @id @default(uuid())
  serverId    String
  serviceName String
  displayName String
  status      String   // Running, Stopped, Paused, etc.
  startType   String   // Automatic, Manual, Disabled
  timestamp   DateTime @default(now())

  server      Server   @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@index([serverId, timestamp])
  @@index([serverId, serviceName])
  @@map("windows_service_snapshots")
}

model EventLog {
  id         String        @id @default(uuid())
  serverId   String
  source     String        // System, Application, Security
  eventId    Int?
  level      EventLogLevel
  message    String
  provider   String?
  occurredAt DateTime
  receivedAt DateTime      @default(now())

  server     Server        @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@index([serverId, occurredAt])
  @@index([serverId, level])
  @@index([serverId, source, occurredAt])
  @@map("event_logs")
}

model NetworkSnapshot {
  id                String   @id @default(uuid())
  serverId          String
  interfaceName     String
  bandwidthInBps    BigInt
  bandwidthOutBps   BigInt
  activeConnections Int
  openPorts         Json?    // int[]
  timestamp         DateTime @default(now())

  server            Server   @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@index([serverId, timestamp])
  @@map("network_snapshots")
}

model AlertRule {
  id              String        @id @default(uuid())
  name            String
  serverId        String?       // null = applies to all servers
  metricType      MetricType
  condition       String        // 'gt', 'lt', 'eq'
  threshold       Float
  duration        Int           // seconds the condition must persist
  severity        AlertSeverity
  channels        NotificationChannel[] // which channels to notify
  webhookUrl      String?       // specific webhook for this rule
  emailRecipients String[]      // email addresses
  isEnabled       Boolean       @default(true)
  cooldownMinutes Int           @default(15) // prevent alert spam
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  server          Server?       @relation(fields: [serverId], references: [id], onDelete: Cascade)
  alerts          Alert[]

  @@index([serverId, metricType])
  @@index([isEnabled])
  @@map("alert_rules")
}

model Alert {
  id               String       @id @default(uuid())
  alertRuleId      String
  serverId         String
  status           AlertStatus  @default(ACTIVE)
  triggerValue     Float
  message          String
  triggeredAt      DateTime     @default(now())
  acknowledgedAt   DateTime?
  acknowledgedById String?
  resolvedAt       DateTime?

  alertRule        AlertRule    @relation(fields: [alertRuleId], references: [id], onDelete: Cascade)
  server           Server       @relation(fields: [serverId], references: [id], onDelete: Cascade)
  acknowledgedBy   User?        @relation("AlertAcknowledger", fields: [acknowledgedById], references: [id])
  notifications    AlertNotification[]

  @@index([serverId, status])
  @@index([alertRuleId])
  @@index([triggeredAt])
  @@index([status])
  @@map("alerts")
}

model AlertNotification {
  id        String              @id @default(uuid())
  alertId   String
  channel   NotificationChannel
  payload   Json                // channel-specific data (email body, webhook payload)
  sentAt    DateTime?
  success   Boolean             @default(false)
  error     String?
  createdAt DateTime            @default(now())

  alert     Alert               @relation(fields: [alertId], references: [id], onDelete: Cascade)

  @@index([alertId])
  @@map("alert_notifications")
}

model AgentCommand {
  id         String        @id @default(uuid())
  serverId   String
  type       CommandType
  payload    Json?         // { pid, serviceName, script, etc. }
  status     CommandStatus @default(PENDING)
  result     Json?         // { output, exitCode, error }
  issuedById String        // userId who issued the command
  issuedAt   DateTime      @default(now())
  sentAt     DateTime?
  completedAt DateTime?
  timeoutAt  DateTime?     // auto-set: issuedAt + 60s

  server     Server        @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@index([serverId, status])
  @@index([issuedAt])
  @@map("agent_commands")
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  title     String
  body      String
  link      String?  // e.g., "/servers/{id}/alerts"
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, createdAt])
  @@map("notifications")
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String
  action     String   // e.g., "SERVER_RESTART", "PROCESS_KILL", "USER_CREATE"
  targetType String   // e.g., "Server", "Process", "User"
  targetId   String?
  details    Json?    // additional context
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  user       User     @relation("AuditUser", fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([action])
  @@index([targetType, targetId])
  @@index([createdAt])
  @@map("audit_logs")
}

model SystemSettings {
  id        String   @id @default("singleton")
  smtpHost  String?
  smtpPort  Int?     @default(587)
  smtpUser  String?
  smtpPass  String?  // encrypted at rest
  smtpFrom  String?
  smtpTls   Boolean  @default(true)
  webhookDefaults Json? // default webhook URLs
  updatedAt DateTime @updatedAt

  @@map("system_settings")
}
```

### 3.3 Data Retention Strategy

| Data Type | Raw Retention | Aggregation |
|---|---|---|
| Raw metrics | 7 days | 5-min aggregates kept 30 days, 1-hour aggregates kept 1 year |
| Process snapshots | 24 hours | Only latest snapshot retained per server |
| Service snapshots | 24 hours | Only latest snapshot retained per server |
| Event logs | 30 days | Counts aggregated monthly |
| Audit logs | 1 year | No aggregation (compliance) |
| Alerts | 90 days | No aggregation |
| Notifications | 30 days | Cleanup after read + 7 days |

### 3.4 Indexing Strategy

- **Composite indexes** on time-series queries: `(serverId, type, timestamp)` for metrics
- **Partial indexes** where supported: active alerts only `(status = ACTIVE)`
- **GIN index** on JSON fields if PostgreSQL full-text search is needed on event log messages
- All foreign keys indexed by default via Prisma
- Monitor query plans and add indexes for N+1 or slow queries post-launch

---

## 4. Data Validation & Business Rules

### 4.1 Validation Framework

- **Library**: `class-validator` + `class-transformer`
- **Global pipe**: `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- All DTOs validated before reaching service layer

### 4.2 DTO Validation Examples

```typescript
// CreateAlertRuleDto
{
  name:            @IsString() @MinLength(3) @MaxLength(100)
  serverId:        @IsOptional() @IsUUID()
  metricType:      @IsEnum(MetricType)
  condition:       @IsIn(['gt', 'lt', 'eq'])
  threshold:       @IsNumber() @Min(0) @Max(100)
  duration:        @IsInt() @Min(30) @Max(3600)
  severity:        @IsEnum(AlertSeverity)
  channels:        @IsArray() @IsEnum(NotificationChannel, { each: true })
  emailRecipients: @IsOptional() @IsArray() @IsEmail({}, { each: true })
  webhookUrl:      @IsOptional() @IsUrl()
  cooldownMinutes: @IsOptional() @IsInt() @Min(1) @Max(1440)
}

// HeartbeatDto (from agent)
{
  cpu:       @IsNumber() @Min(0) @Max(100)
  memoryUsedMb:  @IsNumber() @Min(0)
  memoryTotalMb: @IsNumber() @Min(0)
  disks:     @IsArray() @ValidateNested({ each: true })
  networkInterfaces: @IsArray() @ValidateNested({ each: true })
  uptime:    @IsNumber() @Min(0)
  timestamp: @IsISO8601()
}
```

### 4.3 Business Rules

| Rule | Description | Enforcement |
|---|---|---|
| **BR-001** | Server status â†’ OFFLINE if no heartbeat for 90 seconds | Background job checks every 30s |
| **BR-002** | Server status â†’ DEGRADED if any CRITICAL alert is active | Alert evaluation job |
| **BR-003** | Alert cooldown: same rule cannot re-fire within `cooldownMinutes` | Alert service checks last trigger time |
| **BR-004** | Alert auto-resolve: if condition no longer met for 2Ã— `duration`, auto-resolve | Alert evaluation job |
| **BR-005** | Refresh token rotation: old token invalidated on use | Auth service, transactional |
| **BR-006** | Cannot delete last Admin user | User service pre-delete check |
| **BR-007** | Cannot delete a server group with active alert rules | Server group service pre-delete check |
| **BR-008** | Remote commands timeout after 60 seconds | Command service marks TIMEOUT |
| **BR-009** | Agent registration token is single-use | Marked as consumed on first use |
| **BR-010** | PowerShell execution requires explicit Admin role + confirmation audit | Guard + audit log |
| **BR-011** | Maximum 50 alert rules per server (prevent resource abuse) | Alert rule service count check |
| **BR-012** | Rate limit: Agent heartbeat max 1 per 10 seconds per server | Throttle guard on heartbeat endpoint |

---

## 5. External Integrations & Third-Party Services

### 5.1 SMTP Email Integration (Nodemailer)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚ Alert Engine â”‚â”€â”€â”€â”€â–¶â”‚ Notification  â”‚â”€â”€â”€â”€â–¶â”‚  Nodemailer  â”‚â”€â”€â”€â”€â–¶ SMTP Server
â”‚             â”‚     â”‚   Service     â”‚     â”‚             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Aspect | Detail |
|---|---|
| Library | `nodemailer` |
| Configuration | Dynamic from `SystemSettings` table (hot-reloadable) |
| Templates | Handlebars HTML templates for alert emails |
| Features | Multiple recipients per rule, HTML + plain text fallback |
| Retry | 3 retries with exponential backoff via Bull queue |
| Rate Limit | Max 100 emails/hour (configurable) |

**Email Template Data**:
```typescript
{
  alertName, severity, serverHostname, serverIp,
  metricType, currentValue, threshold, condition,
  triggeredAt, dashboardLink
}
```

### 5.2 Webhook Integration

| Aspect | Detail |
|---|---|
| Protocol | HTTP POST with JSON body |
| Targets | Slack, Microsoft Teams, Discord, custom endpoints |
| Payload Format | Standardized JSON with optional platform-specific formatting |
| Security | HMAC-SHA256 signature in `X-Signature-256` header (shared secret) |
| Retry | 3 retries, exponential backoff (5s, 15s, 45s) |
| Timeout | 10 second connection timeout |
| Verification | `POST /notifications/settings/test-webhook` for validation |

**Webhook Payload**:
```json
{
  "event": "alert.triggered",
  "timestamp": "2026-03-23T12:00:00Z",
  "alert": {
    "id": "uuid",
    "name": "High CPU Usage",
    "severity": "CRITICAL",
    "status": "ACTIVE"
  },
  "server": {
    "id": "uuid",
    "hostname": "PROD-WEB-01",
    "ipAddress": "10.0.1.50"
  },
  "metric": {
    "type": "CPU",
    "currentValue": 95.2,
    "threshold": 90,
    "condition": "gt"
  },
  "dashboardUrl": "https://monitor.example.com/servers/{id}"
}
```

### 5.3 Integration Summary Table

| Integration | Direction | Protocol | Library | Purpose |
|---|---|---|---|---|
| SMTP Server | Outbound | SMTP/TLS | Nodemailer | Alert email notifications |
| Webhook endpoints | Outbound | HTTPS POST | Built-in `fetch`/`axios` | Alert webhook notifications |
| Windows Agent | Inbound/Bidir | HTTP + WebSocket | Built-in NestJS | Metrics collection + commands |

---

## 6. Caching Strategy

### 6.1 Redis Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚                       Redis 7                            â”‚
â”‚                                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚  â”‚   Cache       â”‚  â”‚   Pub/Sub    â”‚  â”‚   Bull Queue  â”‚  â”‚
â”‚  â”‚  (DB 0)      â”‚  â”‚  (DB 0)      â”‚  â”‚  (DB 1)      â”‚  â”‚
â”‚  â”‚              â”‚  â”‚              â”‚  â”‚              â”‚  â”‚
â”‚  â”‚ â€¢ Latest     â”‚  â”‚ â€¢ metrics:   â”‚  â”‚ â€¢ metric-    â”‚  â”‚
â”‚  â”‚   metrics    â”‚  â”‚   realtime   â”‚  â”‚   processing â”‚  â”‚
â”‚  â”‚ â€¢ Server     â”‚  â”‚ â€¢ alert:     â”‚  â”‚ â€¢ alert-     â”‚  â”‚
â”‚  â”‚   status     â”‚  â”‚   triggered  â”‚  â”‚   evaluation â”‚  â”‚
â”‚  â”‚ â€¢ Dashboard  â”‚  â”‚ â€¢ server:    â”‚  â”‚ â€¢ notificationâ”‚  â”‚
â”‚  â”‚   aggregates â”‚  â”‚   status     â”‚  â”‚   dispatch   â”‚  â”‚
â”‚  â”‚ â€¢ Session    â”‚  â”‚              â”‚  â”‚ â€¢ cleanup    â”‚  â”‚
â”‚  â”‚   data       â”‚  â”‚              â”‚  â”‚              â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 6.2 Cache Keys & TTL

| Cache Key Pattern | TTL | Description |
|---|---|---|
| `server:{id}:latest-metrics` | 60s | Latest metric snapshot per server |
| `server:{id}:status` | 60s | Current server status |
| `server:{id}:processes` | 30s | Latest process list |
| `server:{id}:services` | 30s | Latest Windows service list |
| `dashboard:overview` | 30s | Aggregated dashboard stats |
| `dashboard:group:{id}:summary` | 30s | Group-level summary |
| `alerts:active` | 15s | List of all active alerts |
| `alerts:active:server:{id}` | 15s | Active alerts per server |
| `user:{id}:notification-count` | 60s | Unread notification count |

### 6.3 Cache Invalidation Strategy

| Strategy | When Used |
|---|---|
| **TTL-based expiry** | All metric caches (natural refresh from heartbeats) |
| **Write-through** | Server status changes â†’ update cache + DB simultaneously |
| **Event-driven invalidation** | Alert triggered/resolved â†’ invalidate `alerts:active*` keys |
| **Pub/Sub propagation** | Metric arrives â†’ publish to Redis channel â†’ Socket.IO gateway picks up â†’ pushes to clients |

### 6.4 Caching Layers

```
Request â†’ [Rate Limiter (Redis)] â†’ [Auth Guard] â†’ [Controller]
                                                       â”‚
                                              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”?
                                              â”‚  Service Layer   â”‚
                                              â”‚                  â”‚
                                              â”‚  1. Check Redis  â”‚
                                              â”‚  2. If miss â†’    â”‚
                                              â”‚     query DB     â”‚
                                              â”‚  3. Store in     â”‚
                                              â”‚     Redis        â”‚
                                              â”‚  4. Return       â”‚
                                              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**No CDN needed** â€” single-tenant internal tool, not public-facing. Static assets served by Vite build or Nginx.

---

## 7. Background Jobs & Queue Processing

### 7.1 Bull Queue Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚                    Bull Queues (Redis)               â”‚
â”‚                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚  â”‚ metric-processingâ”‚  â”‚  alert-evaluation         â”‚  â”‚
â”‚  â”‚ Concurrency: 5  â”‚  â”‚  Concurrency: 3           â”‚  â”‚
â”‚  â”‚ Every heartbeat â”‚  â”‚  After each metric batch  â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚  â”‚ notification-    â”‚  â”‚  data-cleanup             â”‚  â”‚
â”‚  â”‚ dispatch         â”‚  â”‚  Cron: every 1 hour      â”‚  â”‚
â”‚  â”‚ Concurrency: 3  â”‚  â”‚  Concurrency: 1           â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚  â”‚ metric-          â”‚  â”‚  server-health-check      â”‚  â”‚
â”‚  â”‚ aggregation      â”‚  â”‚  Cron: every 30 seconds  â”‚  â”‚
â”‚  â”‚ Cron: every 5min â”‚  â”‚  Concurrency: 1           â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?                                â”‚
â”‚  â”‚ command-timeout  â”‚                                â”‚
â”‚  â”‚ Cron: every 15s â”‚                                â”‚
â”‚  â”‚ Concurrency: 1  â”‚                                â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 7.2 Queue Definitions

| Queue | Trigger | Job Description | Retry | Priority |
|---|---|---|---|---|
| `metric-processing` | Agent heartbeat | Parse, validate, store metrics in DB; update Redis cache; publish to Socket.IO | 2 retries | High |
| `alert-evaluation` | After metric-processing | Evaluate all enabled rules against latest metrics; create Alert records | 2 retries | High |
| `notification-dispatch` | After alert created | Send email via SMTP, POST to webhooks, create in-app notifications | 3 retries, exponential backoff | Medium |
| `server-health-check` | Cron: 30s | Check `lastHeartbeatAt` for all servers; mark OFFLINE if > 90s; emit status change events | 1 retry | High |
| `metric-aggregation` | Cron: 5min | Aggregate raw metrics into 5-min buckets; hourly cron for 1-hour buckets; daily for 1-day buckets | 2 retries | Low |
| `data-cleanup` | Cron: 1h | Delete expired raw metrics (>7d), old process/service snapshots (>24h), read notifications (>30d) | 1 retry | Low |
| `command-timeout` | Cron: 15s | Find PENDING/SENT commands past `timeoutAt`; mark as TIMEOUT; notify issuer | 1 retry | Medium |

### 7.3 Job Processing Flow (Heartbeat â†’ Real-time Update)

```
Agent POST /heartbeat
       â”‚
       â–¼
  [Controller validates]
       â”‚
       â–¼
  [Enqueue to metric-processing]
       â”‚
       â–¼
  [Processor: store in DB + update Redis cache]
       â”‚
       â”œâ”€â”€â–¶ [Publish to Redis pub/sub: metrics:realtime:{serverId}]
       â”‚          â”‚
       â”‚          â–¼
       â”‚    [Socket.IO Gateway picks up â†’ emit to room server:{serverId}]
       â”‚
       â””â”€â”€â–¶ [Enqueue to alert-evaluation]
                  â”‚
                  â–¼
            [Processor: evaluate rules]
                  â”‚
                  â”œâ”€â”€ No breach â†’ done
                  â””â”€â”€ Breach detected â†’ Create Alert
                         â”‚
                         â–¼
                   [Enqueue to notification-dispatch]
                         â”‚
                         â”œâ”€â”€â–¶ Email via Nodemailer
                         â”œâ”€â”€â–¶ Webhook POST
                         â””â”€â”€â–¶ In-app notification + Socket.IO push
```

### 7.4 Failed Job Handling

- **Dead letter queue**: Failed jobs after max retries moved to `{queue}:failed`
- **Monitoring**: Bull Dashboard (optional) or custom admin endpoint to view queue health
- **Alerting**: If notification-dispatch fails repeatedly, log error and create system audit entry
- **Manual retry**: Admin can retry failed jobs via dashboard

---

## 8. File Storage & Media Handling

### 8.1 Minimal File Storage Requirements

This system has very limited file storage needs:

| File Type | Storage | Details |
|---|---|---|
| RDP connection files | Generated on-the-fly | `.rdp` files generated in memory, streamed to client â€” never persisted |
| Email templates | Local filesystem | Handlebars `.hbs` templates bundled with deployment |
| Agent installers | Static hosting (optional) | Pre-built `.msi`/`.exe` can be served from Nginx or external download |
| Export reports (future) | Temp directory | CSV/PDF exports generated on demand, auto-cleaned after 1 hour |

### 8.2 RDP File Generation

```typescript
// Generated in-memory, never saved to disk
const rdpContent = `
full address:s:${server.ipAddress}
prompt for credentials:i:1
administrative session:i:1
screen mode id:i:2
desktopwidth:i:1920
desktopheight:i:1080
`;
// Streamed as download: Content-Disposition: attachment; filename="SERVER-01.rdp"
```

### 8.3 No Object Storage Required

- No user uploads, no avatars, no file attachments
- No S3/MinIO/Blob storage needed
- All data is structured and stored in PostgreSQL + Redis

---

## 9. Logging, Monitoring & Observability

### 9.1 Logging Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚  NestJS App      â”‚â”€â”€â”€â”€â–¶â”‚   Pino/      â”‚â”€â”€â”€â”€â–¶â”‚   stdout/      â”‚
â”‚  (All modules)   â”‚     â”‚   Winston    â”‚     â”‚   stderr       â”‚
â”‚                  â”‚     â”‚              â”‚     â”‚   (JSON)       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
                                                       â”‚
                                              Docker/systemd
                                              log collection
                                                       â”‚
                                              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”?
                                              â”‚  Log aggregator â”‚
                                              â”‚  (Loki/ELK/    â”‚
                                              â”‚   CloudWatch)   â”‚
                                              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 9.2 Log Levels & Structure

| Level | Usage |
|---|---|
| `error` | Unhandled exceptions, DB connection failures, critical service errors |
| `warn` | Failed auth attempts, rate limit hits, agent disconnection, queue retry |
| `info` | HTTP requests, server registration, alert triggered/resolved, user actions |
| `debug` | Detailed metric processing, cache hit/miss, WebSocket events |

**Structured Log Format**:
```json
{
  "timestamp": "2026-03-23T12:00:00.000Z",
  "level": "info",
  "context": "AuthService",
  "message": "User login successful",
  "requestId": "uuid",
  "userId": "uuid",
  "ip": "10.0.1.100",
  "duration": 45
}
```

### 9.3 Request Tracing

- **Request ID**: Generated per request via `X-Request-Id` header (or auto-generated UUID)
- **Propagation**: Request ID passed through service calls, queue jobs, and log entries
- **Correlation**: Agent heartbeats include agent-generated correlation ID

### 9.4 Application Metrics (Self-Monitoring)

Expose internal metrics via `/api/v1/health` and `/api/v1/metrics/internal` (Admin only):

| Metric | Type | Description |
|---|---|---|
| `http_request_duration_seconds` | Histogram | API response time by route and status |
| `http_requests_total` | Counter | Total requests by route, method, status |
| `websocket_connections_active` | Gauge | Current WebSocket connections |
| `bull_queue_size` | Gauge | Jobs waiting per queue |
| `bull_queue_completed_total` | Counter | Completed jobs per queue |
| `bull_queue_failed_total` | Counter | Failed jobs per queue |
| `db_query_duration_seconds` | Histogram | Prisma query performance |
| `redis_operations_total` | Counter | Cache hits vs misses |
| `active_servers_total` | Gauge | Servers by status |
| `active_alerts_total` | Gauge | Alerts by severity |

### 9.5 Health Check Endpoints

| Endpoint | Checks | Auth |
|---|---|---|
| `GET /health` | App is running (liveness) | Public |
| `GET /health/ready` | DB + Redis + Bull connected (readiness) | Public |
| `GET /health/detailed` | Per-dependency status with latency | Admin |

### 9.6 Audit Logging

All user-initiated actions are recorded in the `AuditLog` table:

| Action Category | Events Logged |
|---|---|
| Authentication | Login, logout, failed login, password change |
| Server Management | Register, deregister, update, group assignment |
| Remote Control | Restart, shutdown, PowerShell exec, process kill, service control |
| Alert Management | Rule create/update/delete, acknowledge, resolve |
| User Management | Create, update role, deactivate, delete |
| Settings | SMTP config change, webhook config change |

---

## 10. Scalability & Performance Requirements

### 10.1 Target Scale

| Dimension | Target | Design Ceiling |
|---|---|---|
| Monitored servers | 50 | 500 |
| Concurrent dashboard users | 20 | 100 |
| Heartbeats per minute | 100 (50 servers Ã— 2) | 1,000 |
| Metrics data points per day | ~1.4M | ~14M |
| WebSocket connections | 20 | 200 |
| Alert rules | 200 | 2,000 |

### 10.2 Performance Targets

| Operation | Target Latency | Notes |
|---|---|---|
| Dashboard overview load | < 200ms | Served from Redis cache |
| Server detail page load | < 300ms | Latest metrics from cache, history from DB |
| Heartbeat processing (end-to-end) | < 500ms | Receive â†’ store â†’ cache â†’ emit |
| Historical metrics query (7d) | < 1s | Aggregated data, indexed queries |
| Alert evaluation cycle | < 2s | Per batch of heartbeats |
| Process list retrieval | < 500ms | Cached in Redis |
| Remote command round-trip | < 5s | Command â†’ agent â†’ execution â†’ result |
| Login | < 500ms | bcrypt is intentionally slow |

### 10.3 Database Performance

- **Connection pooling**: Prisma connection pool size = 10 (adjustable via `DATABASE_URL?connection_limit=10`)
- **Query optimization**: All time-series queries use covering indexes; EXPLAIN ANALYZE for slow queries
- **Metric aggregation**: Raw metrics never queried for ranges > 24h; use `MetricAggregate` table
- **Batch inserts**: Agent heartbeat metrics inserted as batch via `createMany`
- **Pagination**: Cursor-based pagination for large datasets (event logs, audit logs); offset-based for smaller sets

### 10.4 WebSocket Scalability

- **Single instance**: Socket.IO with Redis adapter for future horizontal scaling
- **Room-based routing**: Clients only receive updates for subscribed servers
- **Backpressure**: If client can't keep up, buffer last N events and drop oldest
- **Connection limits**: Max 200 concurrent WebSocket connections (configurable)

### 10.5 Horizontal Scaling Path (Future)

```
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
                    â”‚   Nginx /   â”‚
                    â”‚ Load Balancerâ”‚
                    â”‚ (sticky WS) â”‚
                    â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
                           â”‚
              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
              â”‚            â”‚            â”‚
        â”Œâ”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”? â”Œâ”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”?
        â”‚  NestJS    â”‚ â”‚  NestJS   â”‚ â”‚  NestJS   â”‚
        â”‚ Instance 1 â”‚ â”‚ Instance 2â”‚ â”‚ Instance 3â”‚
        â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
              â”‚              â”‚            â”‚
              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”?
                    â”‚  Redis (Shared) â”‚
                    â”‚  Pub/Sub + Cacheâ”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”?
                    â”‚  PostgreSQL     â”‚
                    â”‚  (Single/RR     â”‚
                    â”‚   Replica)      â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Socket.IO Redis adapter enables multi-instance WebSocket
- Bull queues naturally distribute across workers
- Stateless JWT auth = no session affinity needed (except WebSocket sticky sessions)

---

## 11. Security Requirements (OWASP Top 10)

### 11.1 OWASP Top 10 Coverage

| # | Vulnerability | Mitigation |
|---|---|---|
| **A01** | Broken Access Control | RBAC guards on all endpoints; role checked from JWT; server-group access scoping; default-deny policy |
| **A02** | Cryptographic Failures | bcrypt (cost 12) for passwords; SHA-256 for API keys; JWT HS256 with strong secret (256-bit); SMTP passwords encrypted in DB; TLS 1.2+ enforced for all external communication |
| **A03** | Injection | Prisma ORM (parameterized queries â€” no raw SQL); `class-validator` on all inputs; PowerShell commands sanitized and allowlisted; no `eval()` or dynamic code execution |
| **A04** | Insecure Design | Confirmation required for destructive actions (shutdown, PowerShell); command execution audit-logged; rate limiting on sensitive endpoints; principle of least privilege for roles |
| **A05** | Security Misconfiguration | Helmet middleware (security headers); CORS restricted to known origins; `.env` for secrets (never committed); disable X-Powered-By; remove default NestJS error details in production |
| **A06** | Vulnerable Components | Dependabot/Renovate for dependency updates; `npm audit` in CI; pin major versions; evaluate packages before adoption |
| **A07** | Auth Failures | JWT access tokens (short-lived, 15min); refresh token rotation; account lockout after 5 failed attempts (15min cooldown); rate limit on `/auth/login` (10/min per IP) |
| **A08** | Software & Data Integrity | Agent API key verification on all agent endpoints; webhook HMAC signatures; CI/CD pipeline integrity checks; signed Docker images |
| **A09** | Logging & Monitoring Failures | Comprehensive audit logging; structured application logs; failed auth logged with IP; alert on anomalous patterns; log retention policy |
| **A10** | SSRF | Webhook URLs validated (no internal IPs, no localhost); DNS rebinding protection; URL allowlist option |

### 11.2 Additional Security Measures

| Measure | Implementation |
|---|---|
| **Rate Limiting** | `@nestjs/throttler` â€” global: 100 req/min; auth: 10 req/min; agent heartbeat: 6/min per key |
| **CORS** | Whitelist frontend origin only; no wildcards in production |
| **Helmet** | All security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| **Input Sanitization** | Strip HTML from all string inputs; max string lengths on all fields |
| **SQL Injection** | Prisma ORM exclusively â€” no raw queries; if raw needed, use `$queryRaw` with tagged template |
| **XSS Prevention** | React escapes by default; CSP headers; no `dangerouslySetInnerHTML` |
| **CSRF** | SameSite=Strict cookies; custom header requirement for state-changing operations |
| **Agent Communication** | HTTPS only; API key in header (not URL); mutual TLS option for high-security deployments |
| **Secret Management** | Environment variables via `.env`; never log secrets; rotate JWT secret quarterly |
| **PowerShell Hardening** | Command allowlist (no arbitrary execution by default); Admin-only; full command + output logged in audit; execution timeout (30s) |

### 11.3 Security Headers (Helmet Configuration)

```typescript
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // for Tailwind
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "wss://*"], // WebSocket
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}
```

---

## 12. Deployment & Infrastructure Requirements

### 12.1 Architecture Diagram

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚                        Production Host                           â”‚
â”‚                                                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”‚
â”‚  â”‚   Nginx     â”‚    â”‚         Docker Compose Stack            â”‚  â”‚
â”‚  â”‚ (Reverse    â”‚    â”‚                                        â”‚  â”‚
â”‚  â”‚  Proxy +    â”‚    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?   â”‚  â”‚
â”‚  â”‚  Static     â”‚â”€â”€â”€â”€â–¶  â”‚  NestJS  â”‚  â”‚   PostgreSQL 16  â”‚   â”‚  â”‚
â”‚  â”‚  Assets +   â”‚    â”‚  â”‚  API     â”‚  â”‚   (persistent    â”‚   â”‚  â”‚
â”‚  â”‚  TLS)       â”‚    â”‚  â”‚  :3000   â”‚  â”‚    volume)       â”‚   â”‚  â”‚
â”‚  â”‚             â”‚    â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚                                        â”‚  â”‚
â”‚                    â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?                           â”‚  â”‚
â”‚                    â”‚  â”‚  Redis 7 â”‚                           â”‚  â”‚
â”‚                    â”‚  â”‚  :6379   â”‚                           â”‚  â”‚
â”‚                    â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                           â”‚  â”‚
â”‚                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                  â”‚
â”‚         â–²              â–²                                         â”‚
â”‚         â”‚              â”‚                                         â”‚
â”‚    HTTPS/WSS      HTTP/WS (Agent Key Auth)                      â”‚
â”‚         â”‚              â”‚                                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
          â”‚              â”‚
   â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”?  â”Œâ”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
   â”‚  Dashboard   â”‚  â”‚  Windows Agent â”‚ (Ã— N servers)
   â”‚  (Browser)   â”‚  â”‚  (.NET 8)     â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 12.2 Docker Compose Services

```yaml
services:
  api:
    build: ./backend
    image: imonitor-api:latest
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: imonitor
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - ./certs:/etc/nginx/certs
    depends_on:
      - api
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

### 12.3 Environment Configuration

```bash
# .env (NEVER committed to version control)

# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://imonitor:${DB_PASSWORD}@postgres:5432/imonitor?schema=public
DB_USER=imonitor
DB_PASSWORD=<generated-strong-password>

# Redis
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=<generated-strong-password>

# JWT
JWT_SECRET=<generated-256-bit-secret>
JWT_REFRESH_SECRET=<generated-256-bit-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=https://monitor.example.com

# Rate Limiting
THROTTLE_GLOBAL_LIMIT=100
THROTTLE_GLOBAL_TTL=60

# Agent
AGENT_HEARTBEAT_INTERVAL=30
AGENT_OFFLINE_THRESHOLD=90
AGENT_COMMAND_TIMEOUT=60

# Logging
LOG_LEVEL=info
```

### 12.4 CI/CD Pipeline

```
â”Œâ”€â”€â”€â”€â”€â”€â”?    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”?    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”?
â”‚ Push â”‚â”€â”€â”€â–¶â”‚  Lint +  â”‚â”€â”€â”€â–¶â”‚  Unit +  â”‚â”€â”€â”€â–¶â”‚  Docker   â”‚â”€â”€â”€â–¶â”‚  Deploy  â”‚
â”‚      â”‚    â”‚  Type    â”‚    â”‚  Int.    â”‚    â”‚  Build +  â”‚    â”‚  (SSH +  â”‚
â”‚      â”‚    â”‚  Check   â”‚    â”‚  Tests   â”‚    â”‚  Push     â”‚    â”‚  Compose)â”‚
â””â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Stage | Tools | Details |
|---|---|---|
| Lint + Type Check | ESLint, `tsc --noEmit` | Fail fast on code quality |
| Unit Tests | Jest | Services, guards, pipes, validators |
| Integration Tests | Jest + Testcontainers | API endpoints with real DB + Redis |
| Docker Build | Docker BuildKit | Multi-stage build, non-root user |
| Push | Container Registry | Docker Hub / GitHub Container Registry |
| Deploy | SSH + docker-compose pull + up | Zero-downtime with health checks |
| DB Migration | `prisma migrate deploy` | Run as init container or pre-deploy step |

### 12.5 Backup Strategy

| Component | Strategy | Frequency | Retention |
|---|---|---|---|
| PostgreSQL | `pg_dump` compressed | Daily (full), hourly (WAL archiving) | 30 daily backups, 12 monthly |
| Redis | RDB snapshots | Every 5 minutes (auto) | Last 24 hours |
| Application Config | Git repository | On every change | Infinite (git history) |
| `.env` secrets | Encrypted backup (age/gpg) | On every change | Secure off-site storage |

### 12.6 System Requirements (Minimum)

| Component | Minimum | Recommended (50 servers) |
|---|---|---|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 100 GB SSD |
| OS | Ubuntu 22.04 LTS / Windows Server 2022 | Ubuntu 22.04 LTS |
| Docker | 24.0+ | Latest stable |
| Docker Compose | 2.20+ | Latest stable |
| Network | 100 Mbps | 1 Gbps |

### 12.7 Monitoring the Monitor

| What | Tool | Alert Threshold |
|---|---|---|
| API uptime | Health check endpoint + UptimeRobot/similar | Down > 1 min |
| API response time | Nginx access logs + metrics endpoint | p95 > 2s |
| PostgreSQL disk usage | Docker volume monitoring | > 80% capacity |
| Redis memory | Redis INFO command | > 80% maxmemory |
| Bull queue backlog | Queue size metric | > 100 waiting jobs |
| SSL certificate | Certbot + monitoring | < 14 days to expiry |
| Docker container health | Docker healthchecks | Unhealthy > 2 checks |

---

## Appendix A: Technology Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Framework | NestJS | 10.x |
| Language | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16.x |
| Cache / Pub/Sub | Redis | 7.x |
| Queue | Bull | 4.x (via `@nestjs/bull`) |
| WebSocket | Socket.IO | 4.x (via `@nestjs/platform-socket.io`) |
| Auth | Passport JWT | Latest (`@nestjs/passport`) |
| Validation | class-validator + class-transformer | Latest |
| Email | Nodemailer | Latest |
| Security | Helmet | Latest |
| Logging | Pino (`nestjs-pino`) | Latest |
| Testing | Jest + Supertest + Testcontainers | Latest |
| Containerization | Docker + Docker Compose | Latest |
| Reverse Proxy | Nginx | Latest Alpine |

## Appendix B: Development Conventions

| Convention | Standard |
|---|---|
| API naming | RESTful, plural nouns (`/servers`, `/alerts`) |
| File naming | kebab-case (`alert-rule.service.ts`) |
| Class naming | PascalCase (`AlertRuleService`) |
| Method naming | camelCase (`findActiveByServerId`) |
| DTO suffix | `CreateAlertRuleDto`, `UpdateServerDto` |
| Entity suffix | None (Prisma model names) |
| Service methods | `create`, `findAll`, `findOne`, `update`, `remove` (NestJS convention) |
| Error codes | UPPER_SNAKE_CASE (`VALIDATION_ERROR`, `SERVER_NOT_FOUND`) |
| Env variables | UPPER_SNAKE_CASE |
| Git branches | `feature/`, `fix/`, `chore/` prefixes |
| Commits | Conventional Commits (`feat:`, `fix:`, `chore:`) |

---

*This document serves as the comprehensive backend requirements plan for iMonitorServer. Each section should be reviewed with the development team before implementation begins. Implementation priority: Auth â†’ Servers â†’ Metrics â†’ Dashboard â†’ Alerts â†’ Notifications â†’ Remote Control.*