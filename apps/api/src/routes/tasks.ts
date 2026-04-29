import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../lib/errors.js';
import { requireAuth, getAuthUserId } from '../lib/auth.js';

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.string().optional(),
  estimatedPomodoros: z.number().int().min(1).default(1),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const updateSchema = createSchema.partial();

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request, reply) => {
    const userId = getAuthUserId(request);
    const query = request.query as {
      projectId?: string;
      completed?: string;
    };

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        archivedAt: null,
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.completed !== undefined
          ? { completed: query.completed === 'true' }
          : {}),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return sendSuccess(reply, tasks);
  });

  app.post('/', async (request, reply) => {
    const userId = getAuthUserId(request);
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    const task = await prisma.task.create({
      data: { ...parsed.data, userId, projectId: parsed.data.projectId ?? undefined } as any,
    });

    return sendSuccess(reply, task, 201);
  });

  app.get('/:id', async (request, reply) => {
    const userId = getAuthUserId(request);
    const { id } = request.params as { id: string };
    const task = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!task) return sendError(reply, 404, 'NOT_FOUND', 'Task not found');
    return sendSuccess(reply, task);
  });

  app.patch('/:id', async (request, reply) => {
    const userId = getAuthUserId(request);
    const { id } = request.params as { id: string };
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    const existing = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!existing) return sendError(reply, 404, 'NOT_FOUND', 'Task not found');

    const task = await prisma.task.update({
      where: { id },
      data: parsed.data as any,
    });

    return sendSuccess(reply, task);
  });

  app.post('/:id/complete', async (request, reply) => {
    const userId = getAuthUserId(request);
    const { id } = request.params as { id: string };

    const existing = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!existing) return sendError(reply, 404, 'NOT_FOUND', 'Task not found');

    const task = await prisma.task.update({
      where: { id },
      data: { completed: true },
    });

    return sendSuccess(reply, task);
  });

  app.delete('/:id', async (request, reply) => {
    const userId = getAuthUserId(request);
    const { id } = request.params as { id: string };

    const existing = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!existing) return sendError(reply, 404, 'NOT_FOUND', 'Task not found');

    await prisma.task.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    return sendSuccess(reply, null);
  });
}
