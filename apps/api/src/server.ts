import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { prisma } from './lib/prisma.js';
import { connectRedis } from './lib/redis.js';
import { authRoutes } from './routes/auth.js';
import { taskRoutes } from './routes/tasks.js';
import { projectRoutes } from './routes/projects.js';
import { sessionRoutes } from './routes/sessions.js';
import { analyticsRoutes } from './routes/analytics.js';
import { settingsRoutes } from './routes/settings.js';

const app = Fastify({
  logger: {
    level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
  },
});

await app.register(fastifyCors, {
  origin: process.env['CORS_ORIGIN'] ?? true,
  credentials: true,
});

await app.register(fastifyCookie);

await app.register(fastifyJwt, {
  secret: process.env['JWT_SECRET'] ?? 'dev-secret-change-me',
  cookie: { cookieName: 'refreshToken', signed: false },
});

app.get('/health', async () => ({ ok: true }));

await app.register(authRoutes, { prefix: '/api/v1/auth' });
await app.register(taskRoutes, { prefix: '/api/v1/tasks' });
await app.register(projectRoutes, { prefix: '/api/v1/projects' });
await app.register(sessionRoutes, { prefix: '/api/v1/sessions' });
await app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
await app.register(settingsRoutes, { prefix: '/api/v1/settings' });

async function start(): Promise<void> {
  try {
    await connectRedis();
    await prisma.$connect();
    const port = Number(process.env['PORT'] ?? 3000);
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Flowkit API running on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

await start();
