# iMonitorServer — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade NestJS 10 REST API backend with WebSocket real-time communication, PostgreSQL persistence via Prisma ORM, Redis caching/pub-sub, Bull queues for background processing, and JWT authentication — serving as the central hub between the React frontend dashboard and distributed Windows monitoring agents.

**Architecture:** Modular NestJS 10 monolith with clear domain boundaries (Auth, Servers, Metrics, Processes, Services, EventLogs, Alerts, Users, Groups, Settings). REST API for CRUD operations + Socket.IO gateway for real-time metric push. Agent communication via authenticated REST endpoints (heartbeat, registration) and WebSocket command channels. Prisma ORM with PostgreSQL for relational data + time-series metric storage with periodic aggregation. Redis for hot metric caching, rate limiting, and pub/sub between API instances. Bull queues for alert evaluation, notification dispatch, and metric aggregation jobs.

**Tech Stack:** NestJS 10, TypeScript 5, Prisma 5, PostgreSQL 16, Redis 7, Bull (via @nestjs/bull), Socket.IO (@nestjs/websockets), Passport JWT (@nestjs/passport), class-validator, class-transformer, Nodemailer, Helmet, compression, winston

---

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
11. [Security Requirements](#11-security-requirements)
12. [Deployment & Infrastructure Requirements](#12-deployment--infrastructure-requirements)
13. [File Structure](#13-file-structure)
14. [Implementation Tasks](#14-implementation-tasks)

---

## 1. API Architecture

### 1.1 Protocol Decisions

| Layer | Protocol | Justification |
|-------|----------|---------------|
| **Frontend ↔ Backend** | REST (HTTP/JSON) + Socket.IO (WebSocket) | REST for CRUD operations, data fetching, paginated queries. Socket.IO for real-time metric push, alert notifications, live status updates. Aligns with frontend TanStack Query (REST) + Socket.IO client architecture. |
| **Agent ↔ Backend** | REST (HTTP/JSON) + Socket.IO (WebSocket) | REST for heartbeat POST (every 30s), agent registration, bulk data uploads. Socket.IO for bidirectional command channel (kill process, restart service, shutdown server). |
| **Inter-service** | Redis Pub/Sub | If horizontally scaled, Redis pub/sub distributes WebSocket events across API instances. |

**Why not GraphQL:** The data model is well-defined with predictable query shapes. REST provides simpler caching (HTTP caching headers, CDN-friendly), straightforward agent integration, and lower complexity for the team. The monitoring domain has fixed entity relationships — over-fetching/under-fetching isn't a significant concern.

**Why not gRPC:** Agents are .NET-based and could support gRPC, but REST is simpler to debug, firewall-friendly, and sufficient for 30-second heartbeat intervals. The added complexity of protobuf schemas isn't warranted at this scale.

### 1.2 API Versioning Strategy

| Decision | Choice |
|----------|--------|
| **Versioning scheme** | URI prefix: `/api/v1/...` |
| **Default version** | v1 (only version at launch) |
| **Deprecation policy** | Minimum 6-month sunset period for old versions |
| **Implementation** | NestJS global prefix + versioning module |

### 1.3 REST API Design Conventions

| Convention | Standard |
|------------|----------|
| **Base URL** | `/api/v1` |
| **Resource naming** | Plural nouns, kebab-case: `/servers`, `/alert-rules`, `/event-logs` |
| **HTTP methods** | GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE (remove) |
| **Status codes** | 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Validation Error), 429 (Rate Limited), 500 (Internal Error) |
| **Pagination** | Offset-based: `?page=1&limit=25` for tables. Cursor-based: `?cursor=abc&limit=50` for event logs (append-heavy) |
| **Sorting** | `?sortBy=cpu&order=desc` |
| **Filtering** | Query params: `?status=healthy&groupId=uuid&search=keyword` |
| **Date format** | ISO 8601 throughout: `2026-03-23T14:30:00.000Z` |
| **ID format** | UUIDs (v4) for all entities |

### 1.4 Standard Response Envelope

```typescript
// Success — paginated list
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 25,
    "totalPages": 6
  }
}

// Success — cursor-paginated list (event logs)
{
  "data": [...],
  "meta": {
    "cursor": "eyJ0IjoiMjAyNi0wMy0yM1QxNDozMDowMC4wMDBaIn0=",
    "hasMore": true,
    "limit": 50
  }
}

// Success — single entity
{
  "data": { ... }
}

// Error
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "threshold", "message": "Must be between 0 and 100" }
  ],
  "timestamp": "2026-03-23T14:30:00.000Z",
  "path": "/api/v1/alerts/rules"
}
```

### 1.5 Complete Endpoint Inventory

#### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Roles | Request Body | Response | Description |
|--------|----------|------|-------|-------------|----------|-------------|
| POST | `/auth/login` | Public | — | `{ email, password }` | `{ accessToken, refreshToken, user }` | User login |
| POST | `/auth/refresh` | Public | — | `{ refreshToken }` | `{ accessToken, refreshToken }` | Refresh JWT tokens |
| POST | `/auth/logout` | Bearer | All | `{ refreshToken }` | `204` | Revoke refresh token |
| GET | `/auth/me` | Bearer | All | — | `User` | Get current user profile |

#### Agent Authentication (`/api/v1/agent`)

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| POST | `/agent/register` | Registration Token | `{ hostname, ipAddress, osVersion, hardware, agentVersion }` | `{ serverId, apiKey }` | Agent self-registration |
| POST | `/agent/heartbeat` | API Key | `{ serverId, metrics, processes, services, eventLogs, network }` | `{ commands: Command[] }` | 30s heartbeat with metrics |
| POST | `/agent/command-result` | API Key | `{ commandId, serverId, success, result, error }` | `204` | Report command execution result |

#### Servers (`/api/v1/servers`)

| Method | Endpoint | Auth | Roles | Query Params | Response | Description |
|--------|----------|------|-------|-------------|----------|-------------|
| GET | `/servers` | Bearer | All | `search, groupId, status, page, limit` | `PaginatedResponse<Server>` | List all servers |
| GET | `/servers/:id` | Bearer | All | — | `ServerDetail` | Get server details |
| DELETE | `/servers/:id` | Bearer | Admin | — | `204` | Unregister a server |
| GET | `/servers/:id/metrics` | Bearer | All | `range=1h\|6h\|24h\|7d\|30d` | `TimeSeriesData[]` | Historical metrics |
| GET | `/servers/:id/processes` | Bearer | All | `search, sortBy, order, page, limit` | `PaginatedResponse<Process>` | List processes |
| POST | `/servers/:id/processes/:pid/kill` | Bearer | Admin, Operator | — | `{ success, message }` | Kill a process |
| GET | `/servers/:id/services` | Bearer | All | `status, search` | `WindowsService[]` | List Windows services |
| POST | `/servers/:id/services/:name/action` | Bearer | Admin, Operator | — | `{ success, message }` | Start/stop/restart service |
| GET | `/servers/:id/event-logs` | Bearer | All | `level, search, from, to, cursor, limit` | `CursorPaginatedResponse<EventLog>` | Event logs |
| GET | `/servers/:id/network` | Bearer | All | — | `NetworkInfo` | Network info |
| GET | `/servers/:id/hardware` | Bearer | All | — | `HardwareInfo` | Hardware specs |
| POST | `/servers/:id/remote/restart` | Bearer | Admin, Operator | — | `{ success, message }` | Restart server |
| POST | `/servers/:id/remote/shutdown` | Bearer | Admin | `{ confirmHostname }` | `{ success, message }` | Shutdown server |
| GET | `/servers/:id/remote/rdp` | Bearer | Admin, Operator | — | `Blob (RDP file)` | Download RDP file |

#### Alerts (`/api/v1/alerts`)

| Method | Endpoint | Auth | Roles | Query Params | Response | Description |
|--------|----------|------|-------|-------------|----------|-------------|
| GET | `/alerts/active` | Bearer | All | `severity, serverId` | `Alert[]` | Active alerts |
| POST | `/alerts/:id/acknowledge` | Bearer | Admin, Operator | — | `Alert` | Acknowledge an alert |
| GET | `/alerts/rules` | Bearer | All | — | `AlertRule[]` | List alert rules |
| POST | `/alerts/rules` | Bearer | Admin, Operator | — | `AlertRule` | Create alert rule |
| PUT | `/alerts/rules/:id` | Bearer | Admin, Operator | — | `AlertRule` | Update alert rule |
| DELETE | `/alerts/rules/:id` | Bearer | Admin | — | `204` | Delete alert rule |
| PATCH | `/alerts/rules/:id/toggle` | Bearer | Admin, Operator | — | `AlertRule` | Toggle rule on/off |
| GET | `/alerts/history` | Bearer | All | `from, to, severity, serverId, page, limit` | `PaginatedResponse<AlertHistory>` | Alert history |

#### Server Groups (`/api/v1/groups`)

| Method | Endpoint | Auth | Roles | Response | Description |
|--------|----------|------|-------|----------|-------------|
| GET | `/groups` | Bearer | All | `ServerGroup[]` | List all groups |
| POST | `/groups` | Bearer | Admin | `ServerGroup` | Create group |
| PUT | `/groups/:id` | Bearer | Admin | `ServerGroup` | Update group |
| DELETE | `/groups/:id` | Bearer | Admin | `204` | Delete group |
| POST | `/groups/:id/servers` | Bearer | Admin | `ServerGroup` | Add servers to group |
| DELETE | `/groups/:id/servers/:serverId` | Bearer | Admin | `204` | Remove server from group |

#### Settings (`/api/v1/settings`)

| Method | Endpoint | Auth | Roles | Response | Description |
|--------|----------|------|-------|----------|-------------|
| GET | `/settings/users` | Bearer | Admin | `User[]` | List all users |
| POST | `/settings/users` | Bearer | Admin | `User` | Create user |
| PUT | `/settings/users/:id` | Bearer | Admin | `User` | Update user |
| DELETE | `/settings/users/:id` | Bearer | Admin | `204` | Delete user |
| GET | `/settings/smtp` | Bearer | Admin | `SmtpConfig` | Get SMTP config |
| PUT | `/settings/smtp` | Bearer | Admin | `SmtpConfig` | Update SMTP config |
| POST | `/settings/smtp/test` | Bearer | Admin | `{ success, message }` | Send test email |
| GET | `/settings/webhooks` | Bearer | Admin | `Webhook[]` | List webhooks |
| POST | `/settings/webhooks` | Bearer | Admin | `Webhook` | Create webhook |
| PUT | `/settings/webhooks/:id` | Bearer | Admin | `Webhook` | Update webhook |
| DELETE | `/settings/webhooks/:id` | Bearer | Admin | `204` | Delete webhook |
| POST | `/settings/webhooks/:id/test` | Bearer | Admin | `{ success, message }` | Test webhook |
| GET | `/settings/general` | Bearer | Admin | `GeneralSettings` | Get general settings |
| PUT | `/settings/general` | Bearer | Admin | `GeneralSettings` | Update general settings |
| POST | `/settings/registration-tokens` | Bearer | Admin | `RegistrationToken` | Generate token |
| GET | `/settings/registration-tokens` | Bearer | Admin | `RegistrationToken[]` | List active tokens |
| DELETE | `/settings/registration-tokens/:id` | Bearer | Admin | `204` | Revoke token |

### 1.6 Socket.IO Gateway Events

#### Namespaces

| Namespace | Purpose | Auth |
|-----------|---------|------|
| `/dashboard` | Frontend real-time updates | JWT Bearer |
| `/agent` | Agent bidirectional communication | API Key |

#### Server → Frontend Events (Dashboard Namespace)

| Event | Payload | Trigger |
|-------|---------|---------|
| `server:metrics` | `{ serverId, cpu, memory, disk, network, timestamp }` | Agent heartbeat processed |
| `server:status-changed` | `{ serverId, status, reason }` | Status transition detected |
| `server:registered` | `{ server: ServerSummary }` | New agent registered |
| `server:disconnected` | `{ serverId, lastSeen }` | Heartbeat timeout (90s) |
| `alert:triggered` | `{ alert: Alert }` | Alert rule condition met |
| `alert:resolved` | `{ alertId, resolvedAt }` | Alert condition cleared |
| `process:updated` | `{ serverId, processes: Process[] }` | Process list changed |
| `service:status-changed` | `{ serverId, serviceName, status }` | Service state change |
| `eventlog:new` | `{ serverId, entry: EventLogEntry }` | New event log entry |

#### Frontend → Server Events (Dashboard Namespace)

| Event | Payload | Purpose |
|-------|---------|---------|
| `subscribe:server` | `{ serverId }` | Receive detailed metrics for specific server |
| `unsubscribe:server` | `{ serverId }` | Stop receiving detailed metrics |
| `subscribe:dashboard` | `{}` | Receive summary metrics for all servers |

#### Server → Agent Events (Agent Namespace)

| Event | Payload | Purpose |
|-------|---------|---------|
| `command:kill-process` | `{ commandId, pid }` | Kill a process |
| `command:service-action` | `{ commandId, serviceName, action }` | Start/stop/restart service |
| `command:restart-server` | `{ commandId }` | Restart the server |
| `command:shutdown-server` | `{ commandId }` | Shutdown the server |

---

## 2. Authentication & Authorization Strategy

### 2.1 Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION ARCHITECTURE                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────┐    POST /auth/login     ┌─────────────┐                │
│  │ Frontend │ ──────────────────────→ │ Auth Module  │                │
│  │ (React)  │ ←────────────────────── │  (NestJS)   │                │
│  │          │   { accessToken,        │             │                │
│  │          │     refreshToken,       │ ┌─────────┐ │                │
│  │          │     user }              │ │ Passport│ │                │
│  └────┬─────┘                         │ │ JWT     │ │                │
│       │                               │ └────┬────┘ │                │
│       │  Authorization: Bearer <JWT>  │      │      │                │
│       │ ──────────────────────────→   │      │      │                │
│       │                               └──────┼──────┘                │
│       │                                      │                       │
│       │                               ┌──────▼──────┐                │
│       │                               │ PostgreSQL  │                │
│       │                               │ - users     │                │
│       │                               │ - tokens    │                │
│       │                               └─────────────┘                │
│                                                                       │
│  ┌─────────┐    X-API-Key: <key>     ┌─────────────┐                │
│  │ Windows  │ ──────────────────────→ │ Agent Guard  │                │
│  │ Agent    │ ←────────────────────── │ (API Key)   │                │
│  │ (.NET)   │   { commands }          │             │                │
│  └──────────┘                         └─────────────┘                │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 JWT Token Strategy

| Token | TTL | Storage (Frontend) | Storage (Backend) | Purpose |
|-------|-----|-------------------|-------------------|---------|
| **Access Token** | 15 minutes | Zustand memory store | Stateless (signed) | API request authentication |
| **Refresh Token** | 7 days | httpOnly secure cookie | PostgreSQL `refresh_tokens` table | Silent token renewal |
| **Registration Token** | 24 hours (one-time) | Agent config file | PostgreSQL `registration_tokens` table | Agent self-registration |
| **API Key** | No expiry (revocable) | Agent config file | PostgreSQL `servers.apiKeyHash` | Agent heartbeat auth |

### 2.3 JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string;        // User UUID
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  iat: number;        // Issued at
  exp: number;        // Expiration
}
```

### 2.4 Token Refresh Flow

```
Frontend                         Backend
   │                                │
   ├── GET /servers (401 expired) ──→
   │←── 401 Unauthorized ──────────┤
   │                                │
   ├── POST /auth/refresh ─────────→  Validate refresh token in DB
   │   { refreshToken }             │  Generate new access + refresh
   │←── { accessToken,             │  Revoke old refresh token
   │      refreshToken } ──────────┤  (rotation)
   │                                │
   ├── GET /servers (new token) ───→
   │←── 200 { data: [...] } ───────┤
```

### 2.5 Role-Based Access Control (RBAC)

| Role | Servers (View) | Servers (Control) | Alert Rules | User Mgmt | Settings | Remote Actions |
|------|---------------|-------------------|-------------|-----------|----------|---------------|
| **Admin** | ✅ All | ✅ Kill/Service/Restart/Shutdown | ✅ CRUD | ✅ CRUD | ✅ All | ✅ All |
| **Operator** | ✅ All | ✅ Kill/Service/Restart | ✅ Create/Edit/Toggle | ❌ | ❌ | ✅ Restart only |
| **Viewer** | ✅ All | ❌ | ✅ Read-only | ❌ | ❌ | ❌ |

### 2.6 RBAC Implementation

```typescript
// Custom decorator
@Roles('admin', 'operator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post(':id/processes/:pid/kill')
async killProcess(@Param('id') id: string, @Param('pid') pid: number) { ... }
```

| Guard | Order | Responsibility |
|-------|-------|---------------|
| `JwtAuthGuard` | 1st | Validates JWT, attaches `user` to request |
| `RolesGuard` | 2nd | Checks `user.role` against `@Roles()` decorator |
| `AgentAuthGuard` | 1st (agent routes) | Validates `X-API-Key` header against server record |

### 2.7 Agent Authentication

| Step | Action | Details |
|------|--------|---------|
| 1 | Admin generates registration token | `POST /api/v1/settings/registration-tokens` → returns one-time token |
| 2 | Agent sends registration request | `POST /api/v1/agent/register` with registration token in `Authorization: Bearer <token>` |
| 3 | Backend validates token | Check token exists, not expired, not used. Mark as used |
| 4 | Backend creates server record | Store server info, generate API key, return `{ serverId, apiKey }` |
| 5 | Agent stores API key | Persisted in agent config file (encrypted) |
| 6 | Agent authenticates via API key | All subsequent requests use `X-API-Key: <apiKey>` header |
| 7 | Backend validates API key | Hash API key, compare with `servers.apiKeyHash`, attach server to request context |

### 2.8 Password Security

| Requirement | Implementation |
|-------------|---------------|
| **Hashing** | bcrypt with 12 salt rounds |
| **Minimum length** | 8 characters |
| **Complexity** | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| **Comparison** | Constant-time comparison via bcrypt.compare() |
| **Storage** | Never log, never return in API responses |

---

## 3. Database Schema Design & Relationships

### 3.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────┐
│    users      │     │    servers        │     │ server_groups  │
├──────────────┤     ├──────────────────┤     ├───────────────┤
│ id (PK)       │     │ id (PK)           │     │ id (PK)        │
│ username       │     │ hostname          │     │ name           │
│ email          │     │ ipAddress         │     │ description    │
│ passwordHash   │     │ osVersion         │     │ color          │
│ role           │     │ status            │     │ createdAt      │
│ isActive       │     │ agentVersion      │     │ updatedAt      │
│ lastLogin      │     │ apiKeyHash        │     └───────┬───────┘
│ createdAt      │     │ groupId (FK) ─────┼─────────────┘
│ updatedAt      │     │ lastHeartbeat     │
└──────┬───────┘     │ uptime            │
       │              │ registeredAt      │
       │              │ createdAt         │
       │              │ updatedAt         │
       │              └────────┬─────────┘
       │                       │
       │              ┌────────▼─────────┐
       │              │  server_metrics   │    (Time-series)
       │              ├──────────────────┤
       │              │ id (PK)           │
       │              │ serverId (FK)     │
       │              │ cpu               │
       │              │ memory            │
       │              │ diskUsage         │
       │              │ networkIn         │
       │              │ networkOut        │
       │              │ timestamp         │
       │              └──────────────────┘
       │
       │              ┌──────────────────┐     ┌──────────────────┐
       │              │   alert_rules     │     │     alerts        │
       │              ├──────────────────┤     ├──────────────────┤
       │              │ id (PK)           │     │ id (PK)           │
       │              │ name              │     │ ruleId (FK)       │
       │              │ metric            │     │ serverId (FK)     │
       │              │ operator          │     │ severity          │
       │              │ threshold         │     │ metric            │
       │              │ duration          │     │ message           │
       │              │ serverId (FK)?    │     │ value             │
       │              │ groupId (FK)?     │     │ threshold         │
       │              │ channels          │     │ triggeredAt       │
       │              │ enabled           │     │ resolvedAt        │
       │              │ createdAt         │     │ acknowledgedAt    │
       │              │ updatedAt         │     │ acknowledgedBy(FK)│──→ users
       │              └──────────────────┘     │ createdAt         │
       │                                       └──────────────────┘
       │
       │              ┌──────────────────┐
       ├─────────────→│   audit_logs      │
       │              ├──────────────────┤
       │              │ id (PK)           │
       │              │ userId (FK)       │
       │              │ action            │
       │              │ resource          │
       │              │ resourceId        │
       │              │ details (JSON)    │
       │              │ ipAddress         │
       │              │ timestamp         │
       │              └──────────────────┘
```

### 3.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ──────────────────────────────────────
// Users & Authentication
// ──────────────────────────────────────

enum Role {
  admin
  operator
  viewer
}

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  email        String    @unique
  passwordHash String    @map("password_hash")
  role         Role      @default(viewer)
  isActive     Boolean   @default(true) @map("is_active")
  lastLogin    DateTime? @map("last_login")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  refreshTokens      RefreshToken[]
  auditLogs          AuditLog[]
  acknowledgedAlerts Alert[] @relation("AcknowledgedBy")

  @@map("users")
}

model RefreshToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String    @map("user_id")
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@map("refresh_tokens")
}

model RegistrationToken {
  id        String    @id @default(uuid())
  token     String    @unique
  usedAt    DateTime? @map("used_at")
  usedBy    String?   @map("used_by")
  expiresAt DateTime  @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")

  @@index([token])
  @@map("registration_tokens")
}

// ──────────────────────────────────────
// Servers & Groups
// ──────────────────────────────────────

enum ServerStatus {
  healthy
  warning
  critical
  offline
}

model Server {
  id            String       @id @default(uuid())
  hostname      String
  ipAddress     String       @map("ip_address")
  osVersion     String       @map("os_version")
  status        ServerStatus @default(offline)
  agentVersion  String       @map("agent_version")
  apiKeyHash    String       @unique @map("api_key_hash")
  lastHeartbeat DateTime?    @map("last_heartbeat")
  uptime        Int          @default(0)
  groupId       String?      @map("group_id")
  registeredAt  DateTime     @default(now()) @map("registered_at")
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  group        ServerGroup?     @relation(fields: [groupId], references: [id], onDelete: SetNull)
  metrics      ServerMetric[]
  processes    Process[]
  services     WindowsService[]
  eventLogs    EventLog[]
  alerts       Alert[]
  commands     Command[]
  hardware     ServerHardware?
  networkInfo  NetworkInterface[]

  @@index([status])
  @@index([groupId])
  @@index([hostname])
  @@index([lastHeartbeat])
  @@map("servers")
}

model ServerGroup {
  id          String   @id @default(uuid())
  name        String   @unique
  description String   @default("")
  color       String   @default("#26C6DA")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  servers    Server[]
  alertRules AlertRule[]

  @@map("server_groups")
}

// ──────────────────────────────────────
// Server Hardware (Static Info)
// ──────────────────────────────────────

model ServerHardware {
  id            String   @id @default(uuid())
  serverId      String   @unique @map("server_id")
  cpuModel      String   @map("cpu_model")
  cpuCores      Int      @map("cpu_cores")
  cpuClockSpeed Float    @map("cpu_clock_speed")
  ramTotal      Float    @map("ram_total")
  ramType       String   @map("ram_type")
  ramSpeed      Int      @map("ram_speed")
  osName        String   @map("os_name")
  osVersionFull String   @map("os_version_full")
  osBuild       String   @map("os_build")
  osArch        String   @map("os_arch")
  updatedAt     DateTime @updatedAt @map("updated_at")

  server Server   @relation(fields: [serverId], references: [id], onDelete: Cascade)
  disks  DiskInfo[]

  @@map("server_hardware")
}

model DiskInfo {
  id         String @id @default(uuid())
  hardwareId String @map("hardware_id")
  name       String
  capacity   Float
  used       Float
  type       String

  hardware ServerHardware @relation(fields: [hardwareId], references: [id], onDelete: Cascade)

  @@map("disk_info")
}

model NetworkInterface {
  id       String @id @default(uuid())
  serverId String @map("server_id")
  name     String
  speed    String
  mac      String

  server Server @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@map("network_interfaces")
}

// ──────────────────────────────────────
// Time-Series Metrics
// ──────────────────────────────────────

model ServerMetric {
  id         String   @id @default(uuid())
  serverId   String   @map("server_id")
  cpu        Float
  memory     Float
  diskUsage  Float    @map("disk_usage")
  networkIn  Float    @map("network_in")
  networkOut Float    @map("network_out")
  timestamp  DateTime @default(now())

  server Server @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@index([serverId, timestamp])
  @@index([timestamp])
  @@map("server_metrics")
}

model ServerMetricAggregation {
  id            String   @id @default(uuid())
  serverId      String   @map("server_id")
  period        String
  cpuAvg        Float    @map("cpu_avg")
  cpuMax        Float    @map("cpu_max")
  cpuMin        Float    @map("cpu_min")
  memoryAvg     Float    @map("memory_avg")
  memoryMax     Float    @map("memory_max")
  memoryMin     Float    @map("memory_min")
  diskAvg       Float    @map("disk_avg")
  networkInAvg  Float    @map("network_in_avg")
  networkOutAvg Float    @map("network_out_avg")
  sampleCount   Int      @map("sample_count")
  periodStart   DateTime @map("period_start")
  periodEnd     DateTime @map("period_end")
  createdAt     DateTime @default(now()) @map("created_at")

  @@unique([serverId, period, periodStart])
  @@index([serverId, period, periodStart])
  @@map("server_metric_aggregations")
}

// ──────────────────────────────────────
// Processes (Snapshot per heartbeat)
// ──────────────────────────────────────

model Process {
  id        String   @id @default(uuid())
  serverId  String   @map("server_id")
  pid       Int
  name      String
  cpu       Float
  memory    Float
  startTime DateTime @map("start_time")
  updatedAt DateTime @updatedAt @map("updated_at")

  server Server @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@unique([serverId, pid])
  @@index([serverId])
  @@map("processes")
}

// ──────────────────────────────────────
// Windows Services (Snapshot per heartbeat)
// ──────────────────────────────────────

enum ServiceStatus {
  Running
  Stopped
  Paused
  StartPending
  StopPending
}

enum ServiceStartType {
  Automatic
  Manual
  Disabled
}

model WindowsService {
  id          String           @id @default(uuid())
  serverId    String           @map("server_id")
  name        String
  displayName String           @map("display_name")
  status      ServiceStatus
  startType   ServiceStartType @map("start_type")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  server Server @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@unique([serverId, name])
  @@index([serverId])
  @@map("windows_services")
}

// ──────────────────────────────────────
// Event Logs
// ──────────────────────────────────────

enum EventLogLevel {
  Error
  Warning
  Information
}

model EventLog {
  id        String        @id @default(uuid())
  serverId  String        @map("server_id")
  eventId   Int           @map("event_id")
  source    String
  level     EventLogLevel
  message   String
  timestamp DateTime

  server Server @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@index([serverId, timestamp])
  @@index([serverId, level])
  @@map("event_logs")
}

// ──────────────────────────────────────
// Alerts & Alert Rules
// ──────────────────────────────────────

enum AlertSeverity {
  critical
  warning
  info
}

enum AlertMetric {
  cpu
  memory
  disk
  networkIn
  networkOut
}

enum AlertOperator {
  gt
  lt
  eq
}

model AlertRule {
  id        String        @id @default(uuid())
  name      String
  metric    AlertMetric
  operator  AlertOperator
  threshold Float
  duration  Int
  serverId  String?       @map("server_id")
  groupId   String?       @map("group_id")
  channels  String[]
  enabled   Boolean       @default(true)
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")

  group  ServerGroup? @relation(fields: [groupId], references: [id], onDelete: SetNull)
  alerts Alert[]

  @@map("alert_rules")
}

model Alert {
  id               String        @id @default(uuid())
  ruleId           String        @map("rule_id")
  serverId         String        @map("server_id")
  severity         AlertSeverity
  metric           String
  message          String
  value            Float
  threshold        Float
  triggeredAt      DateTime      @default(now()) @map("triggered_at")
  resolvedAt       DateTime?     @map("resolved_at")
  acknowledgedAt   DateTime?     @map("acknowledged_at")
  acknowledgedById String?       @map("acknowledged_by_id")
  note             String?

  rule           AlertRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  server         Server    @relation(fields: [serverId], references: [id], onDelete: Cascade)
  acknowledgedBy User?     @relation("AcknowledgedBy", fields: [acknowledgedById], references: [id], onDelete: SetNull)

  @@index([serverId, triggeredAt])
  @@index([resolvedAt])
  @@index([severity])
  @@map("alerts")
}

// ──────────────────────────────────────
// Remote Commands
// ──────────────────────────────────────

enum CommandType {
  kill_process
  service_action
  restart_server
  shutdown_server
}

enum CommandStatus {
  pending
  sent
  completed
  failed
  timeout
}

model Command {
  id          String        @id @default(uuid())
  serverId    String        @map("server_id")
  type        CommandType
  payload     Json
  status      CommandStatus @default(pending)
  result      Json?
  issuedBy    String        @map("issued_by")
  issuedAt    DateTime      @default(now()) @map("issued_at")
  completedAt DateTime?     @map("completed_at")

  server Server @relation(fields: [serverId], references: [id], onDelete: Cascade)

  @@index([serverId, issuedAt])
  @@index([status])
  @@map("commands")
}

// ──────────────────────────────────────
// Settings
// ──────────────────────────────────────

model SmtpConfig {
  id        String   @id @default(uuid())
  host      String
  port      Int
  username  String
  password  String
  from      String
  useTls    Boolean  @default(true) @map("use_tls")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("smtp_config")
}

model Webhook {
  id        String   @id @default(uuid())
  name      String
  url       String
  events    String[]
  isActive  Boolean  @default(true) @map("is_active")
  secret    String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("webhooks")
}

model GeneralSettings {
  id                String   @id @default(uuid())
  appName           String   @default("iMonitorServer") @map("app_name")
  dataRetentionDays Int      @default(30) @map("data_retention_days")
  heartbeatInterval Int      @default(30) @map("heartbeat_interval")
  heartbeatTimeout  Int      @default(90) @map("heartbeat_timeout")
  timezone          String   @default("UTC")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("general_settings")
}

// ──────────────────────────────────────
// Audit Logging
// ──────────────────────────────────────

model AuditLog {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  action     String
  resource   String
  resourceId String   @map("resource_id")
  details    Json?
  ipAddress  String   @map("ip_address")
  timestamp  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, timestamp])
  @@index([resource, resourceId])
  @@index([timestamp])
  @@map("audit_logs")
}
```

### 3.3 Data Retention & Cleanup

| Data Type | Retention | Cleanup Strategy |
|-----------|-----------|-----------------|
| Raw metrics (`server_metrics`) | Configurable (default 7 days) | Daily cron job deletes rows older than retention period |
| Hourly aggregations | 90 days | Monthly cron job |
| Daily aggregations | 1 year | Yearly cron job |
| Event logs | Configurable (default 30 days) | Daily cron job |
| Audit logs | 1 year | Monthly cron job |
| Revoked refresh tokens | 7 days past expiry | Daily cron job |
| Used registration tokens | 30 days | Monthly cron job |
| Completed/failed commands | 90 days | Monthly cron job |
| Alert history (resolved) | Configurable (default 90 days) | Monthly cron job |

### 3.4 Historical Metrics Query Strategy

| Time Range | Data Source | Resolution |
|------------|-----------|------------|
| 1h | `server_metrics` (raw) | Every 30s (~120 points) |
| 6h | `server_metrics` (raw) | Every 3 min (~120 points, sampled) |
| 24h | `server_metric_aggregations` (hourly) | Every hour (24 points) + raw for last hour |
| 7d | `server_metric_aggregations` (hourly) | Every hour (168 points) |
| 30d | `server_metric_aggregations` (daily) | Every day (30 points) |

---

## 4. Data Validation & Business Rules

### 4.1 Validation Strategy

| Layer | Tool | Purpose |
|-------|------|---------|
| **DTO validation** | `class-validator` + `class-transformer` | Request body/params/query validation |
| **Global pipe** | `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` | Strip unknown properties, reject extra fields |
| **Business rules** | Service-layer validation | Cross-entity validation, authorization checks |
| **Database constraints** | Prisma schema + PostgreSQL | Unique constraints, foreign keys, non-null |

### 4.2 Key DTO Validation Rules

#### Authentication DTOs

```typescript
class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsEnum(Role)
  role: Role;
}
```

#### Alert Rule DTOs

```typescript
class CreateAlertRuleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(AlertMetric)
  metric: AlertMetric;

  @IsEnum(AlertOperator)
  operator: AlertOperator;

  @IsNumber()
  @Min(0)
  @Max(100)
  threshold: number;

  @IsInt()
  @Min(30)
  @Max(3600)
  duration: number;

  @IsOptional()
  @IsUUID()
  serverId?: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsArray()
  @IsEnum(['inApp', 'email', 'webhook'], { each: true })
  channels: string[];
}
```

#### Agent Heartbeat DTO

```typescript
class HeartbeatDto {
  @IsUUID()
  serverId: string;

  @ValidateNested()
  @Type(() => MetricsDto)
  metrics: MetricsDto;

  @ValidateNested({ each: true })
  @Type(() => ProcessDto)
  @IsArray()
  processes: ProcessDto[];

  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  @IsArray()
  services: ServiceDto[];

  @ValidateNested({ each: true })
  @Type(() => EventLogDto)
  @IsArray()
  @IsOptional()
  eventLogs?: EventLogDto[];

  @ValidateNested()
  @Type(() => NetworkDto)
  @IsOptional()
  network?: NetworkDto;
}

class MetricsDto {
  @IsNumber() @Min(0) @Max(100)
  cpu: number;

  @IsNumber() @Min(0) @Max(100)
  memory: number;

  @IsNumber() @Min(0) @Max(100)
  diskUsage: number;

  @IsNumber() @Min(0)
  networkIn: number;

  @IsNumber() @Min(0)
  networkOut: number;
}
```

### 4.3 Business Rules

#### Server Status Determination

```
Status     = f(cpu, memory, disk, heartbeat)

healthy    = cpu < 70% AND memory < 70% AND disk < 85% AND heartbeat < timeout
warning    = cpu >= 70% OR memory >= 70% OR disk >= 85% (any one breached)
critical   = cpu >= 90% OR memory >= 90% OR disk >= 95%
offline    = heartbeat > timeout (default 90s)
```

#### Alert Evaluation Rules

| Rule | Detail |
|------|--------|
| **Sustained threshold** | Alert triggers only after metric exceeds threshold for `duration` seconds continuously |
| **Deduplication** | No duplicate active alerts for same rule + server combination |
| **Auto-resolve** | Alert auto-resolves when metric drops below threshold for 60 seconds |
| **Cooldown** | After an alert resolves, same rule+server won't re-trigger for 5 minutes |
| **Scope resolution** | If rule has `serverId`: apply to that server only. If `groupId`: apply to all servers in group. If neither: apply to all servers |

#### Remote Command Rules

| Rule | Detail |
|------|--------|
| **Shutdown requires hostname confirmation** | `confirmHostname` must match server's hostname exactly |
| **Command timeout** | Commands expire after 60 seconds if agent doesn't respond |
| **One pending per type** | Can't send duplicate pending commands of same type to same server |
| **Audit everything** | All remote commands create an audit log entry |
| **Offline server** | Cannot send commands to offline servers (return 409 Conflict) |

#### User Management Rules

| Rule | Detail |
|------|--------|
| **No self-delete** | Admin cannot delete their own account |
| **No self-demote** | Admin cannot change their own role to non-admin |
| **Last admin protection** | System must always have at least one active admin |
| **Email uniqueness** | Emails are globally unique (case-insensitive) |
| **Username uniqueness** | Usernames are globally unique (case-insensitive) |

---

## 5. External Integrations & Third-Party Services

### 5.1 SMTP Email Integration

| Aspect | Detail |
|--------|--------|
| **Library** | Nodemailer |
| **Configuration** | Dynamic from `smtp_config` DB table (admin-configurable) |
| **Templates** | HTML email templates with Handlebars |
| **Queue** | Email sending dispatched via Bull queue (non-blocking) |
| **Retry** | 3 retries with exponential backoff (1s, 5s, 15s) |
| **Test endpoint** | `POST /settings/smtp/test` sends a test email |

#### Alert Email Template Content

```
Subject: [iMonitorServer] {severity} Alert - {serverHostname}: {metric} at {value}%

Body:
- Server: {hostname} ({ipAddress})
- Alert: {ruleName}
- Metric: {metric} = {value}% (threshold: {threshold}%)
- Triggered: {triggeredAt}
- Duration: {duration}
- Dashboard Link: {dashboardUrl}/servers/{serverId}
```

### 5.2 Webhook Integration

| Aspect | Detail |
|--------|--------|
| **Protocol** | HTTP POST to configured URLs |
| **Payload format** | JSON with standardized structure |
| **Authentication** | HMAC-SHA256 signature in `X-Webhook-Signature` header (using per-webhook secret) |
| **Timeout** | 10 second request timeout |
| **Retry** | 3 retries with exponential backoff (5s, 30s, 120s) |
| **Queue** | Webhook delivery dispatched via Bull queue |
| **Events** | `alert.triggered`, `alert.resolved`, `server.registered`, `server.disconnected` |

#### Webhook Payload Structure

```json
{
  "event": "alert.triggered",
  "timestamp": "2026-03-23T14:30:00.000Z",
  "data": {
    "alert": {
      "id": "uuid",
      "severity": "critical",
      "metric": "cpu",
      "value": 95.2,
      "threshold": 90,
      "message": "CPU usage at 95.2% (threshold: 90%)"
    },
    "server": {
      "id": "uuid",
      "hostname": "SRV-PROD-01",
      "ipAddress": "192.168.1.100"
    }
  }
}
```

### 5.3 Slack/Teams/Discord Compatibility

Webhook payloads are generic JSON. For Slack/Teams/Discord-specific formatting:
- Users configure the raw webhook URL from those platforms
- The backend sends the generic JSON payload
- Users can use platform-specific workflow builders to transform the payload
- **Future enhancement:** Add optional "formatter" per webhook (Slack, Teams, Discord, Custom) that wraps the payload in platform-specific format

---

## 6. Caching Strategy

### 6.1 Redis Cache Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Redis Instance                      │
├────────────────┬─────────────────┬───────────────────┤
│  Cache Store   │   Pub/Sub       │   Bull Queues     │
│  (Key-Value)   │   (Real-time)   │   (Background)    │
├────────────────┼─────────────────┼───────────────────┤
│ server:latest  │ metrics:updated │ alert-evaluation  │
│ server:{id}    │ command:issued  │ notification      │
│ alerts:active  │ alert:triggered │ metric-aggregation│
│ rate-limit:*   │ server:status   │ data-cleanup      │
│ settings:*     │                 │ email-delivery    │
│ breaker:*      │                 │ webhook-delivery  │
└────────────────┴─────────────────┴───────────────────┘
```

### 6.2 Cache Keys & TTLs

| Key Pattern | Data | TTL | Invalidation Trigger |
|-------------|------|-----|---------------------|
| `server:latest:{serverId}` | Latest metrics snapshot | 60s | Overwritten on each heartbeat |
| `server:status:{serverId}` | Current status enum | 120s | Status transition |
| `servers:list` | Cached server list for dashboard | 30s | Any server status change |
| `alerts:active` | List of active alerts | 60s | Alert triggered/resolved/acknowledged |
| `alerts:active:count` | Count of active alerts | 30s | Alert triggered/resolved |
| `settings:general` | General settings object | 300s | Settings updated |
| `settings:smtp` | SMTP config (without password) | 300s | SMTP settings updated |
| `rate-limit:{ip}:{endpoint}` | Request count | Sliding window (60s) | Auto-expire |
| `breaker:{serverId}:{ruleId}` | Alert cooldown breaker | 300s | Auto-expire |
| `apikey:sha256:{hash}` | API key to serverId mapping | 300s | Cache miss triggers bcrypt verify |

### 6.3 Cache Strategy Per Data Type

| Data Type | Strategy | Reasoning |
|-----------|----------|-----------|
| **Current metrics** | Write-through to Redis on heartbeat | Hot path - dashboard reads every few seconds |
| **Server list** | Cache-aside with invalidation | Moderate read frequency, low write frequency |
| **Active alerts** | Cache-aside with event invalidation | High read (sidebar badge), moderate write |
| **Settings** | Cache-aside with long TTL | Rarely changes |
| **Historical metrics** | No Redis cache - PostgreSQL query | Large dataset, varied query parameters |
| **Processes/Services** | No cache - always fresh from DB | Updated every heartbeat, per-server |
| **Event logs** | No cache - cursor-paginated | Append-only, varied queries |

### 6.4 Redis Pub/Sub Channels

| Channel | Publisher | Subscriber | Payload |
|---------|-----------|-----------|---------|
| `metrics:{serverId}` | Heartbeat processor | Socket.IO gateway | Metrics snapshot |
| `server:status:{serverId}` | Status evaluator | Socket.IO gateway | Status change event |
| `alert:event` | Alert evaluator | Socket.IO gateway, notification queue | Alert triggered/resolved |
| `command:{serverId}` | API controller | Socket.IO gateway (agent namespace) | Command to execute |

---

## 7. Background Jobs & Queue Processing

### 7.1 Bull Queue Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Bull Queues (Redis-backed)                │
├──────────────────┬──────────────────┬───────────────────────────┤
│  alert-evaluation │  notifications   │  maintenance              │
│  ──────────────── │  ──────────────  │  ────────────             │
│  On: heartbeat    │  On: alert event │  Cron-based               │
│  Rate: 2/server/m │                  │                           │
│  Concurrency: 5   │  email-delivery  │  metric-aggregation       │
│                   │  Retry: 3x       │  Every hour               │
│                   │  Concurrency: 3  │                           │
│                   │                  │  data-cleanup              │
│                   │  webhook-delivery│  Daily at 03:00 UTC       │
│                   │  Retry: 3x       │                           │
│                   │  Concurrency: 5  │  heartbeat-checker         │
│                   │                  │  Every 30s                 │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### 7.2 Queue Definitions

#### Alert Evaluation Queue

| Property | Value |
|----------|-------|
| **Name** | `alert-evaluation` |
| **Trigger** | Each heartbeat that stores new metrics |
| **Input** | `{ serverId, metrics: { cpu, memory, disk, networkIn, networkOut }, timestamp }` |
| **Process** | Load all enabled rules applicable to server, check threshold, check sustained duration, trigger/resolve alerts |
| **Output** | Publish alert events to Redis pub/sub, enqueue notifications |
| **Concurrency** | 5 |
| **Rate limit** | Max 2 jobs per server per minute |
| **Timeout** | 10 seconds |

#### Email Delivery Queue

| Property | Value |
|----------|-------|
| **Name** | `email-delivery` |
| **Trigger** | Alert triggered/resolved with email channel |
| **Input** | `{ to: string[], subject, htmlBody, alert, server }` |
| **Process** | Load SMTP config, render template, send via Nodemailer |
| **Retry** | 3 attempts, exponential backoff (1s, 5s, 15s) |
| **Concurrency** | 3 |
| **Dead letter** | Move to `email-delivery-failed` after 3 failures |

#### Webhook Delivery Queue

| Property | Value |
|----------|-------|
| **Name** | `webhook-delivery` |
| **Trigger** | Alert event matching webhook's subscribed events |
| **Input** | `{ webhookId, url, secret, event, payload }` |
| **Process** | Sign payload with HMAC, POST to URL, log result |
| **Retry** | 3 attempts, exponential backoff (5s, 30s, 120s) |
| **Concurrency** | 5 |
| **Timeout** | 10 seconds per request |

#### Metric Aggregation Queue

| Property | Value |
|----------|-------|
| **Name** | `metric-aggregation` |
| **Trigger** | Cron: every hour at :05 |
| **Process** | For each server: aggregate raw metrics from last hour into hourly aggregations. Daily aggregation runs at 00:05. |
| **Concurrency** | 1 |
| **Timeout** | 5 minutes |

#### Data Cleanup Queue

| Property | Value |
|----------|-------|
| **Name** | `data-cleanup` |
| **Trigger** | Cron: daily at 03:00 UTC |
| **Process** | Delete raw metrics older than retention period. Delete old event logs. Purge expired tokens. Prune old audit logs. |
| **Concurrency** | 1 |
| **Timeout** | 10 minutes |

#### Heartbeat Checker Queue

| Property | Value |
|----------|-------|
| **Name** | `heartbeat-checker` |
| **Trigger** | Cron: every 30 seconds |
| **Process** | Find servers where `lastHeartbeat < now() - heartbeatTimeout`. Mark as `offline`. Emit `server:disconnected` event. |
| **Concurrency** | 1 |
| **Timeout** | 15 seconds |

---

## 8. File Storage & Media Handling

### 8.1 Scope

This application has **minimal file storage needs**. No user-uploaded media, no images, no documents.

| File Type | Storage | Details |
|-----------|---------|---------|
| **RDP files** | Generated on-the-fly (not stored) | `GET /servers/:id/remote/rdp` generates `.rdp` file content dynamically and returns as `application/x-rdp` download |
| **Email templates** | Embedded in codebase | Handlebars templates compiled at startup, stored in `src/notifications/templates/` |
| **Logs** | Filesystem + stdout | Winston log files for application logs (structured JSON) |

### 8.2 RDP File Generation

```typescript
function generateRdpFile(server: Server): string {
  return [
    'full address:s:' + server.ipAddress,
    'prompt for credentials:i:1',
    'administrative session:i:1',
    'screen mode id:i:2',
    'desktopwidth:i:1920',
    'desktopheight:i:1080',
    'session bpp:i:32',
    'compression:i:1',
    'displayconnectionbar:i:1',
    'disable wallpaper:i:1',
    'allow font smoothing:i:1',
    'allow desktop composition:i:0',
    'redirectclipboard:i:1',
  ].join('\r\n');
}
```

---

## 9. Logging, Monitoring & Observability

### 9.1 Logging Architecture

| Layer | Tool | Purpose |
|-------|------|---------|
| **Application logs** | Winston | Structured JSON logging with correlation IDs |
| **HTTP request logs** | NestJS middleware + Winston | Request/response logging with timing |
| **Audit trail** | PostgreSQL `audit_logs` table | User action tracking (business requirement) |
| **Error tracking** | Winston (extensible to Sentry) | Unhandled exceptions, promise rejections |

### 9.2 Winston Configuration

```typescript
// Log levels: error, warn, info, http, debug
// Production: info and above
// Development: debug and above

// Transports:
// 1. Console (always) - JSON format in production, pretty in dev
// 2. File: logs/error.log - errors only
// 3. File: logs/combined.log - all levels
// 4. File: logs/audit.log - audit events specifically

// Log rotation: daily, max 14 days, max 50MB per file
```

### 9.3 Structured Log Format

```json
{
  "level": "info",
  "message": "Heartbeat received",
  "timestamp": "2026-03-23T14:30:00.000Z",
  "correlationId": "req-abc-123",
  "context": "AgentController",
  "serverId": "uuid",
  "hostname": "SRV-PROD-01",
  "metrics": { "cpu": 45.2, "memory": 67.8 },
  "duration": 12
}
```

### 9.4 Correlation ID Middleware

Every incoming request receives a unique `X-Correlation-ID` header (generated if not present). This ID propagates through:
- All log entries for that request
- Queue jobs spawned by that request
- WebSocket events emitted as a result
- Responses back to the client

### 9.5 Health Check Endpoint

```
GET /api/v1/health

Response:
{
  "status": "ok",
  "timestamp": "2026-03-23T14:30:00.000Z",
  "uptime": 86400,
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "bull": "ok"
  }
}
```

### 9.6 Audit Log Actions

| Action | Resource | Details Captured |
|--------|----------|-----------------|
| `auth.login` | user | `{ email, success, ip }` |
| `auth.logout` | user | `{ email }` |
| `auth.failed` | user | `{ email, reason, ip }` |
| `server.register` | server | `{ hostname, ipAddress }` |
| `server.delete` | server | `{ hostname }` |
| `server.restart` | server | `{ hostname }` |
| `server.shutdown` | server | `{ hostname, confirmedBy }` |
| `process.kill` | process | `{ hostname, pid, processName }` |
| `service.action` | service | `{ hostname, serviceName, action }` |
| `alert-rule.create` | alert-rule | `{ name, metric, threshold }` |
| `alert-rule.update` | alert-rule | `{ name, changes }` |
| `alert-rule.delete` | alert-rule | `{ name }` |
| `alert.acknowledge` | alert | `{ alertId, note }` |
| `user.create` | user | `{ username, email, role }` |
| `user.update` | user | `{ username, changes }` |
| `user.delete` | user | `{ username }` |
| `group.create` | group | `{ name }` |
| `group.update` | group | `{ name, changes }` |
| `group.delete` | group | `{ name }` |
| `settings.update` | settings | `{ section, changes }` |

---

## 10. Scalability & Performance Requirements

### 10.1 Capacity Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Concurrent servers** | 500 servers | Single instance |
| **Heartbeats per second** | ~17/sec (500 servers x 1/30s) | Burst tolerance: 50/sec |
| **Concurrent dashboard users** | 50 | WebSocket connections |
| **API response time (p95)** | < 200ms | For CRUD endpoints |
| **Heartbeat processing time** | < 50ms | From receive to DB write + cache update + event emit |
| **WebSocket latency** | < 100ms | From heartbeat to frontend metric update |
| **Historical query time** | < 500ms | For 30-day aggregated data |

### 10.2 Database Performance

| Optimization | Implementation |
|-------------|---------------|
| **Connection pooling** | Prisma connection pool: min 5, max 20 |
| **Indexing** | Composite indexes on (serverId, timestamp) for metrics queries |
| **Partitioning** | Consider range partitioning on `server_metrics` by month if data exceeds 100M rows |
| **Batch inserts** | Heartbeat process/service data uses `createMany` for bulk upserts |
| **Read replicas** | Not needed initially; plan for read replica at 1000+ servers |

### 10.3 Heartbeat Processing Pipeline (Critical Path)

```
Agent POST /agent/heartbeat (30s interval)
  |
  +--> 1. Validate payload (class-validator)         ~2ms
  +--> 2. Authenticate API key (SHA-256 + Redis)     ~1ms (cached)
  +--> 3. Write metrics to PostgreSQL                ~10ms
  +--> 4. Upsert processes (batch)                   ~15ms
  +--> 5. Upsert services (batch)                    ~10ms
  +--> 6. Insert event logs (batch, if any)          ~5ms
  +--> 7. Update server.lastHeartbeat                ~3ms
  +--> 8. Write latest metrics to Redis              ~1ms
  +--> 9. Publish to Redis pub/sub                   ~1ms
  +--> 10. Enqueue alert evaluation                  ~1ms
  |
  +--> Return { commands } to agent                  ~1ms
                                              Total: ~50ms
```

**Steps 3-7 run in a database transaction. Steps 8-10 run in parallel after transaction commits.**

### 10.4 API Key Authentication Optimization

- On agent registration, hash API key with bcrypt and store hash
- On heartbeat, don't bcrypt-compare every time (~100ms expensive)
- Instead: use SHA-256 hash of API key as Redis cache key mapping to serverId
- Cache entry: `apikey:sha256:{hash}` with value `{ serverId, status }` and 5-minute TTL
- On cache miss: bcrypt-compare against DB, then cache result

### 10.5 Horizontal Scaling Considerations

| Component | Scaling Strategy |
|-----------|-----------------|
| **API instances** | Stateless - run N instances behind load balancer |
| **WebSocket** | Redis adapter for Socket.IO (broadcasts across instances) |
| **Bull queues** | Shared Redis - any instance can process jobs |
| **PostgreSQL** | Single primary initially. Read replicas for dashboards at scale |
| **Redis** | Single instance. Redis Cluster if memory exceeds 8GB |

---

## 11. Security Requirements

### 11.1 OWASP Top 10 Mitigations

| # | Threat | Mitigation |
|---|--------|------------|
| A01 | **Broken Access Control** | RBAC guards on every endpoint. `@Roles()` decorator. Default deny. No direct object reference without ownership check. Admin-only for destructive operations. |
| A02 | **Cryptographic Failures** | bcrypt for passwords (12 rounds). JWT signed with HS256 and strong secret (256-bit min). SMTP passwords encrypted in DB (AES-256). All agent communication over HTTPS. |
| A03 | **Injection** | Prisma ORM parameterized queries. class-validator input sanitization. No raw SQL. No `eval()`. |
| A04 | **Insecure Design** | Hostname confirmation for shutdown. Command deduplication. Rate limiting. Alert cooldown periods. Last-admin protection. |
| A05 | **Security Misconfiguration** | Helmet middleware (security headers). CORS restricted to frontend origin only. No stack traces in production errors. `.env` never committed. |
| A06 | **Vulnerable Components** | `npm audit` in CI. Dependabot for automated updates. Lock file pinning. |
| A07 | **Auth Failures** | Rate limiting on login (5/min per IP). Account lockout after 10 failures (30 min). Refresh token rotation. JWT short expiry (15 min). |
| A08 | **Data Integrity Failures** | Webhook HMAC signatures. JWT signature verification. Agent API key validation. |
| A09 | **Logging Failures** | Winston structured logging. Audit trail for all security events. No sensitive data in logs (passwords, tokens masked). |
| A10 | **SSRF** | Webhook URLs validated (no private IP ranges: 10.x, 172.16-31.x, 192.168.x, 127.x, ::1). DNS rebinding protection. |

### 11.2 Rate Limiting Configuration

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `POST /auth/login` | 5 requests | 60s | IP address |
| `POST /auth/refresh` | 10 requests | 60s | IP address |
| `POST /agent/heartbeat` | 4 requests | 60s | API key |
| `POST /*/kill`, `POST /*/action`, `POST /*/restart`, `POST /*/shutdown` | 10 requests | 60s | User ID |
| All other endpoints | 100 requests | 60s | User ID |

### 11.3 Security Headers (via Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "wss:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### 11.4 CORS Configuration

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Correlation-ID', 'X-Requested-With'],
  credentials: true,
  maxAge: 3600,
});
```

### 11.5 Input Sanitization

| Layer | Action |
|-------|--------|
| **Request body** | `whitelist: true` strips unknown properties. `forbidNonWhitelisted: true` rejects extra fields. |
| **Query params** | Validated via DTO with `@Query()` pipe. |
| **URL params** | UUID format validation for all IDs. |
| **String inputs** | Max length enforced. Trim whitespace. No HTML allowed. |
| **Agent data** | Hostname, process names: alphanumeric + limited special chars. Event log messages: max 10KB. |

---

## 12. Deployment & Infrastructure Requirements

### 12.1 Infrastructure Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Production Environment                      │
│                                                                    │
│  ┌──────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │   Frontend    │    │  Backend (NestJS) │    │  PostgreSQL   │  │
│  │   (Nginx)     │--->│   Port 3000       │--->│  Port 5432    │  │
│  │  Port 80/443  │    │   N instances     │    │  16 GB RAM    │  │
│  └──────────────┘    └────────┬──────────┘    └───────────────┘  │
│                               │                                    │
│                        ┌──────▼───────┐                           │
│                        │    Redis      │                           │
│                        │  Port 6379    │                           │
│                        │   2 GB RAM    │                           │
│                        └──────────────┘                           │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │               Windows Servers (Monitored)                     │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │ │
│  │  │ Agent 1  │  │ Agent 2  │  │ Agent 3  │  │ Agent N  │        │ │
│  │  │ (.NET 8) │  │ (.NET 8) │  │ (.NET 8) │  │ (.NET 8) │        │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 12.2 Docker Compose (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: imonitor
      POSTGRES_USER: imonitor
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U imonitor"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://imonitor:${DB_PASSWORD}@postgres:5432/imonitor
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: http://localhost:5173
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src

volumes:
  postgres_data:
  redis_data:
```

### 12.3 Backend Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

### 12.4 Environment Variables

```bash
# .env.example
NODE_ENV=development

# Database
DATABASE_URL=postgresql://imonitor:password@localhost:5432/imonitor

# Redis
REDIS_URL=redis://:password@localhost:6379

# JWT
JWT_SECRET=your-256-bit-secret-minimum-32-characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### 12.5 Database Migration Strategy

| Aspect | Approach |
|--------|---------|
| **Tool** | Prisma Migrate |
| **Development** | `npx prisma migrate dev` for auto-generating migration files |
| **Production** | `npx prisma migrate deploy` runs pending migrations on startup |
| **Seeding** | `npx prisma db seed` creates default admin user + general settings |
| **Rollback** | Manual SQL rollback scripts stored alongside migrations |

### 12.6 Seed Data

```typescript
// prisma/seed.ts - Creates:
// 1. Default admin user (admin@imonitor.local / ChangeMe123!)
// 2. Default general settings (30-day retention, 30s heartbeat)
// 3. Default alert rules (CPU > 90%, Memory > 90%, Disk > 95%)
```

### 12.7 CI/CD Pipeline (GitHub Actions)

```yaml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: imonitor_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci
      - run: cd backend && npx prisma generate
      - run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/imonitor_test
      - run: cd backend && npm run lint
      - run: cd backend && npm run test
      - run: cd backend && npm run test:e2e
      - run: cd backend && npm run build
```

---

## 13. File Structure

```
backend/
├── prisma/
│   ├── schema.prisma                      # Complete database schema
│   ├── seed.ts                            # Seed data (admin user, default settings)
│   └── migrations/                        # Auto-generated migration files
│
├── src/
│   ├── main.ts                            # App bootstrap, global pipes, CORS, Helmet
│   ├── app.module.ts                      # Root module imports
│   │
│   ├── common/                            # Shared utilities and infrastructure
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts         # @Roles('admin', 'operator')
│   │   │   ├── current-user.decorator.ts  # @CurrentUser() parameter decorator
│   │   │   └── api-key.decorator.ts       # @ApiKeyAuth() for agent routes
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts          # JWT validation guard
│   │   │   ├── roles.guard.ts             # RBAC enforcement guard
│   │   │   └── agent-auth.guard.ts        # API key validation guard
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts     # Request/response logging
│   │   │   ├── transform.interceptor.ts   # Wrap responses in standard envelope
│   │   │   └── timeout.interceptor.ts     # Request timeout (30s default)
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts   # Global exception handler
│   │   ├── middleware/
│   │   │   └── correlation-id.middleware.ts
│   │   ├── pipes/
│   │   │   └── parse-uuid.pipe.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   ├── interfaces/
│   │   │   ├── paginated-response.interface.ts
│   │   │   └── cursor-paginated-response.interface.ts
│   │   └── utils/
│   │       ├── hash.util.ts               # bcrypt + SHA-256 helpers
│   │       ├── crypto.util.ts             # AES encryption for SMTP passwords
│   │       └── pagination.util.ts
│   │
│   ├── config/
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   └── bull.config.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── redis/
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── refresh-token.dto.ts
│   │       └── auth-response.dto.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── servers/
│   │   ├── servers.module.ts
│   │   ├── servers.controller.ts
│   │   ├── servers.service.ts
│   │   └── dto/
│   │       ├── server-query.dto.ts
│   │       └── shutdown-confirm.dto.ts
│   │
│   ├── agent/
│   │   ├── agent.module.ts
│   │   ├── agent.controller.ts
│   │   ├── agent.service.ts
│   │   └── dto/
│   │       ├── register-agent.dto.ts
│   │       ├── heartbeat.dto.ts
│   │       └── command-result.dto.ts
│   │
│   ├── metrics/
│   │   ├── metrics.module.ts
│   │   ├── metrics.controller.ts
│   │   ├── metrics.service.ts
│   │   └── dto/
│   │       └── metrics-query.dto.ts
│   │
│   ├── processes/
│   │   ├── processes.module.ts
│   │   ├── processes.controller.ts
│   │   ├── processes.service.ts
│   │   └── dto/
│   │       └── process-query.dto.ts
│   │
│   ├── services/
│   │   ├── services.module.ts
│   │   ├── services.controller.ts
│   │   ├── services.service.ts
│   │   └── dto/
│   │       ├── service-query.dto.ts
│   │       └── service-action.dto.ts
│   │
│   ├── event-logs/
│   │   ├── event-logs.module.ts
│   │   ├── event-logs.controller.ts
│   │   ├── event-logs.service.ts
│   │   └── dto/
│   │       └── event-log-query.dto.ts
│   │
│   ├── alerts/
│   │   ├── alerts.module.ts
│   │   ├── alerts.controller.ts
│   │   ├── alerts.service.ts
│   │   ├── alert-evaluator.service.ts
│   │   └── dto/
│   │       ├── create-alert-rule.dto.ts
│   │       ├── update-alert-rule.dto.ts
│   │       ├── toggle-alert-rule.dto.ts
│   │       ├── acknowledge-alert.dto.ts
│   │       └── alert-history-query.dto.ts
│   │
│   ├── groups/
│   │   ├── groups.module.ts
│   │   ├── groups.controller.ts
│   │   ├── groups.service.ts
│   │   └── dto/
│   │       ├── create-group.dto.ts
│   │       ├── update-group.dto.ts
│   │       └── add-servers.dto.ts
│   │
│   ├── settings/
│   │   ├── settings.module.ts
│   │   ├── settings.controller.ts
│   │   ├── settings.service.ts
│   │   └── dto/
│   │       ├── smtp-config.dto.ts
│   │       ├── create-webhook.dto.ts
│   │       ├── update-webhook.dto.ts
│   │       └── general-settings.dto.ts
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── email.service.ts
│   │   ├── webhook.service.ts
│   │   └── templates/
│   │       ├── alert-triggered.hbs
│   │       └── alert-resolved.hbs
│   │
│   ├── commands/
│   │   ├── commands.module.ts
│   │   ├── commands.service.ts
│   │   └── dto/
│   │       └── command-result.dto.ts
│   │
│   ├── audit/
│   │   ├── audit.module.ts
│   │   ├── audit.service.ts
│   │   └── audit.interceptor.ts
│   │
│   ├── gateway/
│   │   ├── gateway.module.ts
│   │   ├── dashboard.gateway.ts
│   │   ├── agent.gateway.ts
│   │   └── gateway.auth.ts
│   │
│   ├── queues/
│   │   ├── queues.module.ts
│   │   ├── alert-evaluation.processor.ts
│   │   ├── email-delivery.processor.ts
│   │   ├── webhook-delivery.processor.ts
│   │   ├── metric-aggregation.processor.ts
│   │   ├── data-cleanup.processor.ts
│   │   └── heartbeat-checker.processor.ts
│   │
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts
│
├── test/
│   ├── jest-e2e.json
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   ├── servers.e2e-spec.ts
│   ├── agent.e2e-spec.ts
│   ├── alerts.e2e-spec.ts
│   └── helpers/
│       ├── test-app.ts
│       ├── test-db.ts
│       └── test-fixtures.ts
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── Dockerfile
├── docker-compose.yml
├── nest-cli.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

---

## 14. Implementation Tasks

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`, `backend/tsconfig.build.json`
- Create: `backend/nest-cli.json`, `backend/.eslintrc.js`, `backend/.prettierrc`
- Create: `backend/.env.example`, `backend/Dockerfile`, `backend/docker-compose.yml`
- Create: `backend/src/main.ts`, `backend/src/app.module.ts`

- [ ] **Step 1: Scaffold NestJS project**
```bash
npx @nestjs/cli new backend --package-manager npm --skip-git
cd backend
```

- [ ] **Step 2: Install core dependencies**
```bash
npm install @nestjs/config @nestjs/passport @nestjs/jwt passport passport-jwt \
  @nestjs/websockets @nestjs/platform-socket.io socket.io \
  @nestjs/bull bull \
  @prisma/client class-validator class-transformer \
  ioredis @nestjs-modules/ioredis \
  bcrypt uuid helmet compression \
  nodemailer handlebars \
  winston nest-winston winston-daily-rotate-file \
  @nestjs/throttler joi
npm install -D prisma @types/passport-jwt @types/bcrypt @types/uuid \
  @types/nodemailer @types/bull
```

- [ ] **Step 3: Configure `main.ts` with global pipes, CORS, Helmet, compression** (see Section 12)
- [ ] **Step 4: Create `.env.example` and `docker-compose.yml`** (see Sections 12.2, 12.4)
- [ ] **Step 5: Create Dockerfile** (see Section 12.3)
- [ ] **Step 6: Run and verify** — `docker compose up -d postgres redis && npm run start:dev`
- [ ] **Step 7: Commit** — `git commit -m "feat: scaffold NestJS backend with core dependencies"`

---

### Task 2: Prisma Schema & Database Setup

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/seed.ts`
- Create: `backend/src/prisma/prisma.module.ts`
- Create: `backend/src/prisma/prisma.service.ts`

- [ ] **Step 1: Initialize Prisma** — `npx prisma init --datasource-provider postgresql`
- [ ] **Step 2: Write the complete Prisma schema** (copy from Section 3.2)
- [ ] **Step 3: Create PrismaService with OnModuleInit/OnModuleDestroy lifecycle**
- [ ] **Step 4: Create PrismaModule as @Global()**
- [ ] **Step 5: Write seed script** (default admin + general settings + default alert rules)
- [ ] **Step 6: Run migration and seed** — `npx prisma migrate dev --name init && npx prisma db seed`
- [ ] **Step 7: Verify in Prisma Studio** — `npx prisma studio`
- [ ] **Step 8: Commit** — `git commit -m "feat: add Prisma schema with all entities and seed data"`

---

### Task 3: Common Infrastructure (Guards, Interceptors, Middleware, Utils)

**Files:**
- Create: `backend/src/common/decorators/{roles,current-user,api-key}.decorator.ts`
- Create: `backend/src/common/guards/{jwt-auth,roles,agent-auth}.guard.ts`
- Create: `backend/src/common/interceptors/{logging,transform,timeout}.interceptor.ts`
- Create: `backend/src/common/filters/all-exceptions.filter.ts`
- Create: `backend/src/common/middleware/correlation-id.middleware.ts`
- Create: `backend/src/common/dto/pagination.dto.ts`
- Create: `backend/src/common/interfaces/{paginated-response,cursor-paginated-response}.interface.ts`
- Create: `backend/src/common/utils/{hash,crypto,pagination}.util.ts`
- Test: `backend/src/common/**/*.spec.ts`

- [ ] **Step 1: Write failing tests for hash utility** (bcrypt hash/verify, SHA-256)
- [ ] **Step 2: Implement hash utility**
- [ ] **Step 3: Write `@Roles()` decorator and `RolesGuard`**
- [ ] **Step 4: Write `@CurrentUser()` parameter decorator**
- [ ] **Step 5: Write `AgentAuthGuard` (validates X-API-Key header)**
- [ ] **Step 6: Write `AllExceptionsFilter` (standard error envelope)**
- [ ] **Step 7: Write `TransformInterceptor` (standard success envelope)**
- [ ] **Step 8: Write `CorrelationIdMiddleware`**
- [ ] **Step 9: Write `LoggingInterceptor` and `TimeoutInterceptor`**
- [ ] **Step 10: Write `PaginationDto` and pagination utility**
- [ ] **Step 11: Run all tests** — `npm run test -- --testPathPattern=common`
- [ ] **Step 12: Commit** — `git commit -m "feat: add common infrastructure (guards, interceptors, middleware, utils)"`

---

### Task 4: Redis & Configuration Modules

**Files:**
- Create: `backend/src/config/{config.module,database.config,redis.config,jwt.config,bull.config}.ts`
- Create: `backend/src/redis/{redis.module,redis.service}.ts`
- Test: `backend/src/redis/redis.service.spec.ts`

- [ ] **Step 1: Create configuration module with Joi validation**
- [ ] **Step 2: Implement RedisService with cache get/set/del and pub/sub**
- [ ] **Step 3: Write tests for RedisService**
- [ ] **Step 4: Configure Bull module with Redis connection**
- [ ] **Step 5: Wire all config into AppModule**
- [ ] **Step 6: Verify app starts** — `npm run start:dev`
- [ ] **Step 7: Commit** — `git commit -m "feat: add Redis cache service and configuration modules"`

---

### Task 5: Authentication Module (JWT + Refresh Tokens)

**Files:**
- Create: `backend/src/auth/{auth.module,auth.controller,auth.service}.ts`
- Create: `backend/src/auth/strategies/jwt.strategy.ts`
- Create: `backend/src/auth/dto/{login,refresh-token,auth-response}.dto.ts`
- Test: `backend/src/auth/auth.service.spec.ts`
- Test: `backend/test/auth.e2e-spec.ts`

- [ ] **Step 1: Write failing unit tests** (valid login, invalid password, inactive user, refresh, revoke, rate-limit)
- [ ] **Step 2: Implement DTOs with class-validator**
- [ ] **Step 3: Implement JWT Passport strategy**
- [ ] **Step 4: Implement AuthService** (login, refresh with rotation, logout, me)
- [ ] **Step 5: Implement AuthController**
- [ ] **Step 6: Run unit tests**
- [ ] **Step 7: Write and run E2E tests**
- [ ] **Step 8: Commit** — `git commit -m "feat: add JWT authentication with refresh token rotation"`

---

### Task 6: User Management Module

**Files:**
- Create: `backend/src/users/{users.module,users.controller,users.service}.ts`
- Create: `backend/src/users/dto/{create-user,update-user}.dto.ts`
- Test: `backend/src/users/users.service.spec.ts`

- [ ] **Step 1: Write failing tests** (create, unique email, unique username, no self-delete, no self-demote, last admin)
- [ ] **Step 2: Implement DTOs**
- [ ] **Step 3: Implement UsersService with business rules**
- [ ] **Step 4: Implement UsersController (Admin-only)**
- [ ] **Step 5: Run tests**
- [ ] **Step 6: Commit** — `git commit -m "feat: add user management with RBAC business rules"`

---

### Task 7: Server Groups Module

**Files:**
- Create: `backend/src/groups/{groups.module,groups.controller,groups.service}.ts`
- Create: `backend/src/groups/dto/{create-group,update-group,add-servers}.dto.ts`
- Test: `backend/src/groups/groups.service.spec.ts`

- [ ] **Step 1: Write failing tests**
- [ ] **Step 2: Implement DTOs**
- [ ] **Step 3: Implement GroupsService** (CRUD + server assignment + health summary)
- [ ] **Step 4: Implement GroupsController**
- [ ] **Step 5: Run tests**
- [ ] **Step 6: Commit** — `git commit -m "feat: add server group management with health summary"`

---

### Task 8: Agent Registration & Heartbeat Module

**Files:**
- Create: `backend/src/agent/{agent.module,agent.controller,agent.service}.ts`
- Create: `backend/src/agent/dto/{register-agent,heartbeat,command-result}.dto.ts`
- Test: `backend/src/agent/agent.service.spec.ts`
- Test: `backend/test/agent.e2e-spec.ts`

- [ ] **Step 1: Write failing tests for registration** (valid token, expired, used, API key generation)
- [ ] **Step 2: Write failing tests for heartbeat** (auth, metrics store, process upsert, service upsert, event logs, cache update, pub/sub, alert enqueue, return commands)
- [ ] **Step 3: Implement registration DTOs with full validation**
- [ ] **Step 4: Implement heartbeat DTOs** (MetricsDto, ProcessDto, ServiceDto, EventLogDto, NetworkDto)
- [ ] **Step 5: Implement AgentService.register()**
- [ ] **Step 6: Run registration tests**
- [ ] **Step 7: Implement AgentService.processHeartbeat()** — critical path pipeline (Section 10.3)
- [ ] **Step 8: Run heartbeat tests**
- [ ] **Step 9: Implement AgentService.reportCommandResult()**
- [ ] **Step 10: Implement AgentController**
- [ ] **Step 11: Write and run E2E tests**
- [ ] **Step 12: Commit** — `git commit -m "feat: add agent registration and heartbeat processing pipeline"`

---

### Task 9: Servers Module (CRUD + Queries)

**Files:**
- Create: `backend/src/servers/{servers.module,servers.controller,servers.service}.ts`
- Create: `backend/src/servers/dto/{server-query,shutdown-confirm}.dto.ts`
- Test: `backend/src/servers/servers.service.spec.ts`

- [ ] **Step 1: Write failing tests** (list with pagination/filters, search, detail with hardware, alert count, delete cascade)
- [ ] **Step 2: Implement ServersService**
- [ ] **Step 3: Implement ServersController with role guards**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit** — `git commit -m "feat: add server CRUD with filtering, search, and pagination"`

---

### Task 10: Metrics Module (Historical Time-Series Queries)

**Files:**
- Create: `backend/src/metrics/{metrics.module,metrics.controller,metrics.service}.ts`
- Create: `backend/src/metrics/dto/metrics-query.dto.ts`
- Test: `backend/src/metrics/metrics.service.spec.ts`

- [ ] **Step 1: Write failing tests** (raw for 1h, sampled for 6h, hourly agg for 24h/7d, daily agg for 30d)
- [ ] **Step 2: Implement MetricsService** with range-based query strategy (Section 3.4)
- [ ] **Step 3: Implement MetricsController**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit** — `git commit -m "feat: add historical metrics queries with aggregation strategy"`

---

### Task 11: Process & Service Management + Commands Module

**Files:**
- Create: `backend/src/processes/{processes.module,processes.controller,processes.service}.ts`
- Create: `backend/src/services/{services.module,services.controller,services.service}.ts`
- Create: `backend/src/commands/{commands.module,commands.service}.ts`
- Test: `backend/src/{processes,services,commands}/*.spec.ts`

- [ ] **Step 1: Write failing tests for command lifecycle** (create, reject offline, reject duplicate, complete, fail, timeout, audit)
- [ ] **Step 2: Implement CommandsService**
- [ ] **Step 3: Implement ProcessesService** (list + kill via command)
- [ ] **Step 4: Implement ServicesService** (list + action via command)
- [ ] **Step 5: Implement controllers with role guards**
- [ ] **Step 6: Run tests**
- [ ] **Step 7: Commit** — `git commit -m "feat: add process and service management with remote command pipeline"`

---

### Task 12: Event Logs Module

**Files:**
- Create: `backend/src/event-logs/{event-logs.module,event-logs.controller,event-logs.service}.ts`
- Create: `backend/src/event-logs/dto/event-log-query.dto.ts`
- Test: `backend/src/event-logs/event-logs.service.spec.ts`

- [ ] **Step 1: Write failing tests** (first page, cursor pagination, filter by level, date range, search, hasMore)
- [ ] **Step 2: Implement EventLogsService** with cursor-based pagination
- [ ] **Step 3: Implement EventLogsController**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit** — `git commit -m "feat: add event log viewer with cursor pagination and filtering"`

---

### Task 13: Alert Rules & Alert Evaluation Engine

**Files:**
- Create: `backend/src/alerts/{alerts.module,alerts.controller,alerts.service,alert-evaluator.service}.ts`
- Create: `backend/src/alerts/dto/{create-alert-rule,update-alert-rule,toggle-alert-rule,acknowledge-alert,alert-history-query}.dto.ts`
- Test: `backend/src/alerts/{alerts,alert-evaluator}.service.spec.ts`

- [ ] **Step 1: Write failing tests for alert rule CRUD**
- [ ] **Step 2: Write failing tests for evaluation engine** (sustained threshold, transient spike, auto-resolve, cooldown, dedup, scope resolution, notifications)
- [ ] **Step 3: Implement AlertRule DTOs**
- [ ] **Step 4: Implement AlertsService** (CRUD + acknowledge + history)
- [ ] **Step 5: Implement AlertEvaluatorService** (rule engine with sustained duration via Redis)
- [ ] **Step 6: Implement AlertsController**
- [ ] **Step 7: Run all tests**
- [ ] **Step 8: Commit** — `git commit -m "feat: add alert rule engine with sustained threshold evaluation"`

---

### Task 14: Notification Dispatch (Email + Webhook)

**Files:**
- Create: `backend/src/notifications/{notifications.module,email.service,webhook.service}.ts`
- Create: `backend/src/notifications/templates/{alert-triggered,alert-resolved}.hbs`
- Test: `backend/src/notifications/{email,webhook}.service.spec.ts`

- [ ] **Step 1: Write failing tests for email service** (load SMTP config, render template, send)
- [ ] **Step 2: Write failing tests for webhook service** (POST payload, HMAC signature, timeout, event filtering)
- [ ] **Step 3: Create Handlebars email templates**
- [ ] **Step 4: Implement EmailService**
- [ ] **Step 5: Implement WebhookService** with HMAC signing
- [ ] **Step 6: Run tests**
- [ ] **Step 7: Commit** — `git commit -m "feat: add email and webhook notification services"`

---

### Task 15: Settings Module (SMTP, Webhooks, General, Registration Tokens)

**Files:**
- Create: `backend/src/settings/{settings.module,settings.controller,settings.service}.ts`
- Create: `backend/src/settings/dto/{smtp-config,create-webhook,update-webhook,general-settings}.dto.ts`
- Test: `backend/src/settings/settings.service.spec.ts`

- [ ] **Step 1: Write failing tests** (SMTP without plaintext password, encrypt password, test email, test webhook, cache invalidation, registration token CRUD)
- [ ] **Step 2: Implement DTOs**
- [ ] **Step 3: Implement SettingsService** (SMTP + Webhook + General + Registration Tokens)
- [ ] **Step 4: Implement SettingsController** (Admin-only)
- [ ] **Step 5: Run tests**
- [ ] **Step 6: Commit** — `git commit -m "feat: add settings management (SMTP, webhooks, general, registration tokens)"`

---

### Task 16: WebSocket Gateway (Dashboard + Agent Namespaces)

**Files:**
- Create: `backend/src/gateway/{gateway.module,dashboard.gateway,agent.gateway,gateway.auth}.ts`
- Test: `backend/src/gateway/dashboard.gateway.spec.ts`

- [ ] **Step 1: Write failing tests** (reject without JWT, accept with JWT, subscribe/unsubscribe, broadcast metrics)
- [ ] **Step 2: Implement WebSocket auth middleware** (JWT for dashboard, API key for agent)
- [ ] **Step 3: Implement DashboardGateway** (subscribe:server, unsubscribe:server, subscribe:dashboard)
- [ ] **Step 4: Implement AgentGateway** (forward commands to agents)
- [ ] **Step 5: Wire Redis pub/sub to gateway broadcasting**
- [ ] **Step 6: Run tests**
- [ ] **Step 7: Commit** — `git commit -m "feat: add Socket.IO gateways for dashboard and agent communication"`

---

### Task 17: Bull Queue Processors

**Files:**
- Create: `backend/src/queues/queues.module.ts`
- Create: `backend/src/queues/{alert-evaluation,email-delivery,webhook-delivery,metric-aggregation,data-cleanup,heartbeat-checker}.processor.ts`
- Test: `backend/src/queues/{alert-evaluation,metric-aggregation,heartbeat-checker}.processor.spec.ts`

- [ ] **Step 1: Write failing tests for alert evaluation processor**
- [ ] **Step 2: Implement alert evaluation processor**
- [ ] **Step 3: Write failing tests for heartbeat checker**
- [ ] **Step 4: Implement heartbeat checker** (detect offline servers)
- [ ] **Step 5: Implement metric aggregation processor** (hourly + daily rollups)
- [ ] **Step 6: Implement data cleanup processor** (retention policies)
- [ ] **Step 7: Implement email + webhook delivery processors**
- [ ] **Step 8: Register all queues in QueuesModule with cron schedules**
- [ ] **Step 9: Run tests**
- [ ] **Step 10: Commit** — `git commit -m "feat: add Bull queue processors for alerts, aggregation, cleanup, notifications"`

---

### Task 18: Audit Logging Module

**Files:**
- Create: `backend/src/audit/{audit.module,audit.service,audit.interceptor}.ts`
- Test: `backend/src/audit/audit.service.spec.ts`

- [ ] **Step 1: Write failing tests** (create entry, capture IP, serialize JSON details)
- [ ] **Step 2: Implement AuditService**
- [ ] **Step 3: Implement AuditInterceptor** (auto-logs annotated actions)
- [ ] **Step 4: Add @Audit() decorator to all destructive actions** across all controllers
- [ ] **Step 5: Run tests**
- [ ] **Step 6: Commit** — `git commit -m "feat: add audit logging for all user actions"`

---

### Task 19: Health Check & Winston Logging

**Files:**
- Create: `backend/src/health/{health.module,health.controller}.ts`
- Modify: `backend/src/main.ts`
- Test: `backend/test/health.e2e-spec.ts`

- [ ] **Step 1: Configure Winston** with console + file transports + rotation
- [ ] **Step 2: Implement HealthController** (checks DB, Redis, Bull)
- [ ] **Step 3: Write E2E test for health endpoint**
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit** — `git commit -m "feat: add health check endpoint and structured Winston logging"`

---

### Task 20: Rate Limiting & Security Hardening

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `backend/src/agent/agent.controller.ts`
- Test: `backend/test/rate-limit.e2e-spec.ts`

- [ ] **Step 1: Configure @nestjs/throttler** with defaults (Section 11.2)
- [ ] **Step 2: Apply custom rate limits** to login (5/min), heartbeat (4/min), destructive actions (10/min)
- [ ] **Step 3: Add webhook URL validation** (block private IPs for SSRF prevention)
- [ ] **Step 4: Write E2E tests for rate limiting**
- [ ] **Step 5: Run tests**
- [ ] **Step 6: Commit** — `git commit -m "feat: add rate limiting and SSRF protection"`

---

### Task 21: Remote Server Control (Restart, Shutdown, RDP)

**Files:**
- Modify: `backend/src/servers/{servers.controller,servers.service}.ts`
- Test: `backend/src/servers/remote.spec.ts`

- [ ] **Step 1: Write failing tests** (restart online, reject offline, hostname confirm for shutdown, wrong hostname, RDP generation, audit logging)
- [ ] **Step 2: Implement restart/shutdown endpoints** using CommandsService
- [ ] **Step 3: Implement RDP file generation** (Section 8.2)
- [ ] **Step 4: Run tests**
- [ ] **Step 5: Commit** — `git commit -m "feat: add remote server control (restart, shutdown, RDP)"`

---

### Task 22: End-to-End Integration Testing

**Files:**
- Create: `backend/test/helpers/{test-app,test-db,test-fixtures}.ts`
- Create: `backend/test/integration/full-flow.e2e-spec.ts`

- [ ] **Step 1: Set up test helpers** (NestJS test app, test DB, fixtures factory)
- [ ] **Step 2: Write full-flow E2E tests** (login, register agent, heartbeat, trigger alert, acknowledge, resolve; login, create group, assign server, dashboard; login, kill process, command lifecycle, audit log; WebSocket metric push)
- [ ] **Step 3: Run E2E tests**
- [ ] **Step 4: Fix any integration issues**
- [ ] **Step 5: Commit** — `git commit -m "feat: add comprehensive E2E integration tests"`

---

### Task 23: Final Wiring & Smoke Test

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: Wire all modules into AppModule** (see Section 13)
- [ ] **Step 2: Add npm scripts** (start, build, test, lint, db:migrate, db:seed, db:studio)
- [ ] **Step 3: Full smoke test** — docker compose up, build, migrate, seed, start:prod, test health/auth/servers/WebSocket
- [ ] **Step 4: Run full test suite** — `npm run lint && npm run test && npm run test:e2e`
- [ ] **Step 5: Commit** — `git commit -m "feat: complete backend wiring and smoke test verification"`
