import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../lib/errors.js';
import { requireAuth, getAuthUserId } from '../lib/auth.js';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#7F77DD'),
});

const updateSchema = createSchema.partial();

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/', async (request, reply) => {
    const userId = getAuthUserId(request);
    const projects = await prisma.project.findMany({
      where: { userId, archivedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return sendSuccess(reply, projects);
  });

  app.post('/', async (request, reply) => {
    const userId = getAuthUserId(request);
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    const project = await prisma.project.create({
      data: { ...parsed.data, userId },
    });

    return sendSuccess(reply, project, 201);
  });

  app.patch('/:id', async (request, reply) => {
    const userId = getAuthUserId(request);
    const { id } = request.params as { id: string };
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, 'VALIDATION_ERROR', parsed.error.message);
    }

    const existing = await prisma.project.findFirst({
      where: { id, userId },
    });
    if (!existing) return sendError(reply, 404, 'NOT_FOUND', 'Project not found');

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data as any,
    });

    return sendSuccess(reply, project);
  });

  app.delete('/:id', async (request, reply) => {
    const userId = getAuthUserId(request);
    const { id } = request.params as { id: string };

    const existing = await prisma.project.findFirst({
      where: { id, userId },
    });
    if (!existing) return sendError(reply, 404, 'NOT_FOUND', 'Project not found');

    await prisma.project.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    return sendSuccess(reply, null);
  });
}
