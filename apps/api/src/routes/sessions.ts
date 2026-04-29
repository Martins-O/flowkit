import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../lib/errors.js';
import { requireAuth, getAuthUserId } from '../lib/auth.js';

const logSchema = z.object({
  taskId: z.string().optional(),
  type: z.enum(['focus', 'short_break', 'long_break']),
  plannedDuration: z.number().int().min(1),
  actualDuration: z.number().int().min(0),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/', async (request, reply) => {
    const userId = getAuthUserId(request);
    const parsed = logSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    const { taskId, ...rest } = parsed.data;

    const session = await prisma.$transaction(async (tx) => {
      const s = await tx.session.create({
        data: {
          type: rest.type,
          plannedDuration: rest.plannedDuration,
          actualDuration: rest.actualDuration,
          startedAt: new Date(rest.startedAt),
          completedAt: rest.completedAt ? new Date(rest.completedAt) : undefined,
          userId,
          ...(taskId ? { taskId } : {}),
        } as any,
      });

      if (taskId && rest.type === 'focus') {
        await tx.task.update({
          where: { id: taskId },
          data: { completedPomodoros: { increment: 1 } },
        });
      }

      return s;
    });

    return sendSuccess(reply, session, 201);
  });

  app.get('/', async (request, reply) => {
    const userId = getAuthUserId(request);
    const query = request.query as {
      from?: string;
      to?: string;
      taskId?: string;
    };

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        ...(query.taskId ? { taskId: query.taskId } : {}),
        ...(query.from || query.to
          ? {
              startedAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { startedAt: 'desc' },
      take: 200,
    });

    return sendSuccess(reply, sessions);
  });
}
