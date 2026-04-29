# Flowkit

An open-source, cross-platform Pomodoro focus system with a built-in task manager
and smart session suggester — built for developers and power users.

## Apps

- `apps/extension` — Browser extension (Chrome + Firefox)
- `apps/mobile` — iOS + Android app (Expo)
- `apps/api` — Backend API (Fastify + PostgreSQL)

## Packages

- `packages/types` — Shared TypeScript types (`@flowkit/types`)
- `packages/timer-core` — Platform-agnostic timer engine (`@flowkit/timer-core`)
- `packages/api-client` — Typed API client (`@flowkit/api-client`)

## Getting started

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/flowkit.git
cd flowkit

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start local infrastructure (Postgres + Redis)
docker-compose up -d

# Start all apps in dev mode
pnpm dev
```

## Architecture

See [AGENTS.md](./AGENTS.md) for the full architecture reference.

## License

MIT
