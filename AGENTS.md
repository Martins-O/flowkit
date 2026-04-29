# AGENTS.md — Flowkit Master Instruction Document

> Read this file at the start of every session before writing any code.
> This is the single source of truth for architecture, conventions, and scope.

---

## Project overview

**Flowkit** is an open-source, cross-platform Pomodoro focus system with a built-in task manager and smart session suggester. It consists of a browser extension, a mobile app, and a shared backend API — all in a single Turborepo monorepo.

**Tagline:** Focus intelligence for developers and power users.
**License:** MIT (open source)
**Repo name:** `flowkit`

---

## Monorepo structure

```
flowkit/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .env.example
├── docker-compose.yml
├── AGENTS.md                  ← this file
├── apps/
│   ├── extension/             ← browser extension (WXT + React)
│   ├── mobile/                ← mobile app (Expo + React Native)
│   └── api/                   ← backend API (Fastify + Prisma)
└── packages/
    ├── types/                 ← @flowkit/types
    ├── timer-core/            ← @flowkit/timer-core
    └── api-client/            ← @flowkit/api-client
```

**Package manager:** pnpm with workspaces
**Build system:** Turborepo
**Language:** TypeScript strict mode everywhere

---

## Tech stack

### Browser extension — `apps/extension`
| Concern | Choice |
|---|---|
| Framework | WXT (Manifest V3, cross-browser) |
| UI | React 18 |
| Bundler | Vite (via WXT) |
| State | Zustand (persisted to chrome.storage) |
| Styling | Tailwind CSS |
| Timer engine | `@flowkit/timer-core` |
| API calls | `@flowkit/api-client` |

### Mobile app — `apps/mobile`
| Concern | Choice |
|---|---|
| Framework | Expo SDK (latest) |
| Navigation | Expo Router (file-based, like Next.js App Router) |
| State | Zustand (persisted to AsyncStorage) |
| Notifications | Expo Notifications (local + push) |
| Background | Expo TaskManager |
| Timer engine | `@flowkit/timer-core` |
| API calls | `@flowkit/api-client` |

### Backend API — `apps/api`
| Concern | Choice |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Fastify 5 |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Cache / pub-sub | Redis 7 |
| Auth | Better Auth |
| Token strategy | JWT (short-lived) + refresh tokens (long-lived, stored securely) |
| Validation | Zod |

### Shared packages
| Package | Purpose |
|---|---|
| `@flowkit/types` | Shared TypeScript types only — no runtime code |
| `@flowkit/timer-core` | Pure TS timer engine — no platform dependencies |
| `@flowkit/api-client` | Typed fetch wrapper for all API endpoints |

---

## Shared types — `@flowkit/types`

These are the canonical data shapes. Never redefine them in app code.

```typescript
// session.ts
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'overflow';
export type SessionType = 'focus' | 'short_break' | 'long_break';

export interface Session {
  id: string;
  userId: string;
  taskId: string | null;
  type: SessionType;
  status: SessionStatus;
  plannedDuration: number;   // seconds
  actualDuration: number;    // seconds
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

// task.ts
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  estimatedPomodoros: number;
  completedPomodoros: number;
  priority: Priority;
  completed: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  color: string;
  archivedAt: Date | null;
  createdAt: Date;
}

// user.ts
export interface UserSettings {
  focusDuration: number;       // seconds, default 1500 (25min)
  shortBreakDuration: number;  // seconds, default 300 (5min)
  longBreakDuration: number;   // seconds, default 900 (15min)
  sessionsUntilLongBreak: number; // default 4
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  allowOverflow: boolean;
  soundEnabled: boolean;
  soundTheme: 'bell' | 'digital' | 'soft';
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  settings: UserSettings;
  createdAt: Date;
}
```

---

## Timer engine — `@flowkit/timer-core`

Pure TypeScript. No `window`, no `chrome`, no React, no RN. Platform-agnostic.

```typescript
// TimerEngine.ts — public API surface
export class TimerEngine {
  constructor(settings: UserSettings) {}
  start(taskId?: string): void
  pause(): void
  resume(): void
  stop(): void
  overflow(): void         // user chose to continue past timer end
  skipBreak(): void
  getState(): TimerState
  onTick(cb: (state: TimerState) => void): () => void      // returns unsubscribe
  onSessionEnd(cb: (session: Session) => void): () => void
}

export interface TimerState {
  status: SessionStatus;
  type: SessionType;
  elapsed: number;         // seconds
  remaining: number;       // seconds (negative during overflow)
  sessionCount: number;    // focus sessions completed today
  currentTaskId: string | null;
}
```

The extension background worker and mobile TaskManager both instantiate `TimerEngine` and bridge it to their platform's tick mechanism (chrome.alarms vs setInterval).

---

## Database schema (Prisma)

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  passwordHash String?
  settings     Json      @default("{}")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  sessions     Session[]
  tasks        Task[]
  projects     Project[]
  accounts     Account[]
}

model Project {
  id         String    @id @default(cuid())
  userId     String
  name       String
  color      String    @default("#7F77DD")
  archivedAt DateTime?
  createdAt  DateTime  @default(now())
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks      Task[]
}

model Task {
  id                  String    @id @default(cuid())
  userId              String
  projectId           String?
  title               String
  description         String?
  estimatedPomodoros  Int       @default(1)
  completedPomodoros  Int       @default(0)
  priority            String    @default("medium")
  completed           Boolean   @default(false)
  archivedAt          DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  project             Project?  @relation(fields: [projectId], references: [id])
  sessions            Session[]
}

model Session {
  id              String    @id @default(cuid())
  userId          String
  taskId          String?
  type            String    // 'focus' | 'short_break' | 'long_break'
  status          String    // 'completed' | 'abandoned'
  plannedDuration Int       // seconds
  actualDuration  Int       // seconds
  startedAt       DateTime
  completedAt     DateTime?
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  task            Task?     @relation(fields: [taskId], references: [id])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  provider          String
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}
```

---

## API routes

Base URL: `/api/v1`

### Auth
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
```

### Tasks
```
GET    /tasks              — list tasks (filter: projectId, completed, date)
POST   /tasks              — create task
GET    /tasks/:id
PATCH  /tasks/:id
DELETE /tasks/:id
POST   /tasks/:id/complete
```

### Projects
```
GET    /projects
POST   /projects
PATCH  /projects/:id
DELETE /projects/:id
```

### Sessions
```
POST   /sessions           — log a completed session
GET    /sessions           — list sessions (filter: date range, taskId)
```

### Analytics
```
GET    /analytics/daily    — daily Pomodoro counts (last 30 days)
GET    /analytics/tasks    — time per task/project
GET    /analytics/streak   — current and longest streak
```

### Settings
```
GET    /settings
PATCH  /settings
```

---

## API response format

All responses follow this envelope:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
```

HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error.

---

## Environment variables

```bash
# apps/api
DATABASE_URL=postgresql://postgres:password@localhost:5432/flowkit
REDIS_URL=redis://localhost:6379
JWT_SECRET=changeme
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d
PORT=3000
NODE_ENV=development

# apps/extension + apps/mobile
VITE_API_URL=http://localhost:3000/api/v1   # extension
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1  # mobile
```

---

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `timer-engine.ts` |
| Components | PascalCase | `TimerRing.tsx` |
| Functions | camelCase | `getSessionStats()` |
| Types/interfaces | PascalCase | `TimerState` |
| Env vars | SCREAMING_SNAKE | `JWT_SECRET` |
| DB columns | snake_case | `planned_duration` |
| API routes | kebab-case | `/api/v1/timer-sessions` |
| Package names | `@flowkit/` prefix | `@flowkit/types` |

---

## MVP scope — build only these

### Phase 1 — Foundation (build first)
- [ ] Monorepo scaffold (Turborepo + pnpm + tsconfig)
- [ ] `@flowkit/types` — all shared types
- [ ] `@flowkit/timer-core` — TimerEngine + SessionManager
- [ ] `@flowkit/api-client` — typed API wrapper
- [ ] `apps/api` — Prisma schema + all routes
- [ ] `docker-compose.yml` — postgres + redis

### Phase 2 — Extension
- [ ] WXT setup + manifest
- [ ] Background service worker (timer + sync)
- [ ] Popup UI (timer display + task selector)
- [ ] Content script (tab activity detection)

### Phase 3 — Mobile
- [ ] Expo + Expo Router setup
- [ ] Timer screen
- [ ] Tasks screen
- [ ] Analytics screen
- [ ] Background timer + notifications

### NOT in MVP — do not build
- Site blocker / distraction enforcement
- Smart AI suggester (V2)
- Productivity time-of-day curve (V2)
- Ambient sounds (V2)
- Home screen widget (V2)
- REST API for external integrations (V3)
- Webhook support (V3)
- Self-hosted deployment guide (V3)
- Apple Watch / Wear OS (V3)

---

## Build commands

```bash
# Install all dependencies
pnpm install

# Start everything (API + extension dev + mobile bundler)
pnpm dev

# Start only the API
pnpm dev --filter=api

# Start only the extension
pnpm dev --filter=extension

# Start only mobile
pnpm dev --filter=mobile

# Build all
pnpm build

# Run all tests
pnpm test

# Type-check all packages
pnpm typecheck

# Lint everything
pnpm lint

# Local dev infrastructure (postgres + redis)
docker-compose up -d
```

---

## Agent rules — always follow these

1. **Read this file first.** Before writing any code in a new session, re-read this document.

2. **Stay in scope.** Only modify files relevant to the current task. Do not refactor unrelated code.

3. **Shared types are canonical.** Never redefine `Session`, `Task`, `Project`, or `User` types in app code. Always import from `@flowkit/types`.

4. **Timer logic lives in `@flowkit/timer-core` only.** Do not duplicate timer state logic in the extension or mobile app. Both platforms import and wrap `TimerEngine`.

5. **Add workspace deps explicitly.** When a package imports from `@flowkit/*`, always add it to that package's `package.json` dependencies as `"@flowkit/types": "workspace:*"`.

6. **No `any`.** TypeScript strict mode is on. Never use `any` — use `unknown` and narrow it.

7. **Zod for all external input.** Every API route handler must validate its request body and query params with a Zod schema before touching the database.

8. **Prisma transactions for multi-step writes.** Any route that writes to more than one table must use `prisma.$transaction`.

9. **Never commit secrets.** All secrets go in `.env` which is gitignored. Reference `.env.example` for the full list.

10. **Error handling.** Every async route handler must be wrapped in try/catch. Throw typed Fastify errors using `fastify.httpErrors`.

11. **One concern per commit.** When scaffolding, commit each package or app separately so the diff is readable.

12. **Test shared packages.** `@flowkit/timer-core` must have unit tests (Vitest). Timer logic is pure functions — easy to test.

---

## Starting a new session — checklist

Before writing any code, confirm:

- [ ] I have read this entire AGENTS.md
- [ ] I know which package/app I am working on
- [ ] I know which Phase (1, 2, or 3) this task belongs to
- [ ] I will not touch files outside the scope of this task
- [ ] If I need a type, I will import it from `@flowkit/types`
- [ ] If I need timer logic, I will use `@flowkit/timer-core`
- [ ] If I need to call the API, I will use `@flowkit/api-client`
