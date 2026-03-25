# iMonitorServer

Real-time server monitoring and management platform built with Express/TypeScript backend and React/Vite frontend.

## Features

- **Dashboard** - Real-time server health overview with CPU, memory, disk metrics
- **Server Management** - Add, edit, monitor individual servers with live heartbeat tracking
- **Server Groups** - Organize servers into logical groups
- **Remote Control** - Execute remote commands (processes, services, hardware info, network, restart/shutdown)
- **Alert Rules** - Configure threshold-based alerts for CPU, memory, disk usage
- **User Management** - Role-based access control (admin, operator, viewer)
- **Webhooks** - Outgoing event notifications to external services
- **SMTP Configuration** - Email alerts for server events
- **Audit Logging** - Track all system actions and changes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Zustand |
| Backend | Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens) |
| Real-time | WebSocket gateway |
| Containerization | Docker, Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### Running with Docker Compose

```bash
# Clone the repository
git clone https://github.com/OdaiMAmer/iMonitorServer.git
cd iMonitorServer

# Copy environment template
cp .env.staging.example .env

# Edit .env with your real values (replace all CHANGE_ME placeholders)
# At minimum set: DB_PASSWORD, REDIS_PASSWORD, JWT_SECRET, ENCRYPTION_KEY

# Start all services
docker compose up -d --build
```

Services will be available at:
- **Frontend**: http://localhost:8099
- **Backend API**: http://localhost:3099
- **PostgreSQL**: localhost:5440
- **Redis**: localhost:6390

### Local Development

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   │   ├── alerts/       # Alert rules & notifications
│   │   │   ├── audit/        # Audit logging
│   │   │   ├── auth/         # JWT authentication
│   │   │   ├── dashboard/    # Dashboard aggregation
│   │   │   ├── event-logs/   # Event log storage
│   │   │   ├── metrics/      # Server metrics collection
│   │   │   ├── notifications/# Notification dispatch
│   │   │   ├── processes/    # Remote process listing
│   │   │   ├── remote-control/# Remote command execution
│   │   │   ├── server-groups/# Server group management
│   │   │   ├── servers/      # Server CRUD & heartbeat
│   │   │   ├── services/     # Remote service listing
│   │   │   └── users/        # User management & RBAC
│   │   ├── prisma/           # Prisma schema & migrations
│   │   ├── gateway/          # WebSocket gateway
│   │   ├── config/           # App configuration
│   │   └── common/           # Shared utilities
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/            # Route pages
│   │   ├── components/       # Reusable UI components
│   │   ├── stores/           # Zustand state stores
│   │   ├── lib/              # API client & utilities
│   │   └── types/            # TypeScript interfaces
│   └── Dockerfile
├── docker-compose.yml        # Development/default compose
├── docker-compose.production.yml
└── .env.staging.example      # Environment template
```

## API Overview

All API routes are prefixed with `/api`.

| Endpoint | Description |
|----------|------------|
| `POST /api/auth/login` | Authenticate and receive JWT tokens |
| `POST /api/auth/refresh` | Refresh access token |
| `GET /api/servers` | List all servers |
| `GET /api/servers/:id` | Server details |
| `POST /api/servers/:id/heartbeat` | Agent heartbeat |
| `GET /api/server-groups` | List server groups |
| `GET /api/dashboard/stats` | Dashboard summary |
| `GET /api/alerts` | List alert rules |
| `GET /api/users` | List users (admin only) |
| `GET /api/settings/general` | General settings |
| `GET /api/settings/smtp` | SMTP configuration |
| `GET /api/settings/webhooks` | Webhook configuration |

## Environment Variables

See [.env.staging.example](.env.staging.example) for all available configuration options. Key variables:

| Variable | Description |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data |
| `SMTP_HOST` | SMTP server for email alerts |
| `AGENT_SECRET` | Shared secret for monitoring agents |

## License

Private - All rights reserved.
