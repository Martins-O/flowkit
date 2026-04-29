import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../lib/errors.js';
import { requireAuth, getAuthUserId } from '../lib/auth.js';
import { DEFAULT_SETTINGS } from '@flowkit/types';
import type { UserSettings } from '@flowkit/types';

const settingsSchema = z.object({
  focusDuration: z.number().int().min(60).max(7200).optional(),
  shortBreakDuration: z.number().int().min(60).max(3600).optional(),
  longBreakDuration: z.number().int().min(60).max(7200).optional(),
  sessionsUntilLongBreak: z.number().int().min(1).max(10).optional(),
  autoStartBreaks: z.boolean().optional(),
  autoStartFocus: z.boolean().optional(),
  allowOverflow: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  soundTheme: z.enum(['bell', 'digital', 'soft']).optional(),
});

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request, reply) => {
    const userId = getAuthUserId(request);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');

    const settings = {
      ...DEFAULT_SETTINGS,
      ...(user.settings as Partial<UserSettings>),
    };

    return sendSuccess(reply, settings);
  });

  app.patch('/', async (request, reply) => {
    const userId = getAuthUserId(request);
    const parsed = settingsSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!user) return sendError(reply, 404, 'NOT_FOUND', 'User not found');

    const updatedSettings = {
      ...DEFAULT_SETTINGS,
      ...(user.settings as Partial<UserSettings>),
      ...parsed.data,
    };

    await prisma.user.update({
      where: { id: userId },
      data: { settings: updatedSettings as any },
    });

    return sendSuccess(reply, updatedSettings);
  });
}
