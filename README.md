# Flowkit

A modern Pomodoro timer ecosystem with browser extension, mobile app, and REST API.

## Architecture

```
flowkit/
├── apps/
│   ├── api/          # Fastify REST API (Node.js + Prisma + PostgreSQL)
│   ├── extension/    # Chrome extension (WXT + React + Zustand)
│   └── mobile/       # Mobile app (Expo + React Native + Expo Router)
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── timer-core/   # Timer engine (framework-agnostic)
│   └── api-client/   # HTTP client (extension + mobile)
├── compose.yml       # Docker: PostgreSQL + Redis
└── turbo.json        # Turborepo build pipeline
```

## Quick Start

### Prerequisites
- Node.js >= 20
- pnpm >= 8
- Docker + Docker Compose

### 1. Install dependencies
```bash
pnpm install
```

### 2. Start databases
```bash
docker compose up -d
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your settings (JWT_SECRET auto-generated)
```

### 4. Push database schema
```bash
pnpm db:push --filter=@flowkit/api
```

### 5. Start development servers

**API (port 3002):**
```bash
pnpm dev --filter=@flowkit/api
```

**Extension (Chrome):**
```bash
pnpm dev --filter=@flowkit/extension
# Load from apps/extension/.output/chrome-mv3 in chrome://extensions/
```

**Mobile (Expo):**
```bash
pnpm dev --filter=@flowkit/mobile
# Scan QR code with Expo Go app
```

## Build

```bash
pnpm build
```

## Typecheck

```bash
pnpm typecheck
```

## Testing

```bash
cd packages/timer-core && pnpm test
```

## API Endpoints

- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `GET /api/v1/tasks` - List tasks
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/sessions` - List sessions
- `GET /api/v1/analytics/stats` - Get analytics
- `GET /health` - Health check

## Tech Stack

- **Monorepo:** pnpm workspaces + Turborepo
- **API:** Fastify + Prisma + PostgreSQL + Redis + Better Auth
- **Extension:** WXT + React + Zustand + Tailwind CSS
- **Mobile:** Expo + React Native + Expo Router + Zustand
- **Shared:** TypeScript + Zod + timer-core
