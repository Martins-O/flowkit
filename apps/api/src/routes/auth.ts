import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../lib/errors.js';
import { requireAuth, getAuthUserId } from '../lib/auth.js';
import type { UserSettings } from '@flowkit/types';
import { DEFAULT_SETTINGS } from '@flowkit/types';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function formatUser(user: {
  id: string;
  email: string;
  name: string | null;
  settings: unknown;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    settings: (user.settings as UserSettings) ?? DEFAULT_SETTINGS,
    createdAt: user.createdAt,
  };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(reply, 400, 'EMAIL_TAKEN', 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
        settings: DEFAULT_SETTINGS as any,
      },
    });

    const accessToken = app.jwt.sign(
      { id: user.id, email: user.email },
      { expiresIn: process.env['JWT_EXPIRY'] ?? '15m' },
    );

    return sendSuccess(reply, { user: formatUser(user), accessToken }, 201);
  });

  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      return sendError(reply, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return sendError(reply, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const accessToken = app.jwt.sign(
      { id: user.id, email: user.email },
      { expiresIn: process.env['JWT_EXPIRY'] ?? '15m' },
    );

    return sendSuccess(reply, { user: formatUser(user), accessToken });
  });

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('refreshToken');
    return sendSuccess(reply, null);
  });

  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');
    return sendSuccess(reply, formatUser(user));
  });
}
