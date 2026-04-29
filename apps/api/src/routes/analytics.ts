import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { sendSuccess } from '../lib/errors.js';
import { requireAuth, getAuthUserId } from '../lib/auth.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/daily', async (request, reply) => {
    const userId = getAuthUserId(request);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        type: 'focus',
        startedAt: { gte: thirtyDaysAgo },
      },
      select: { startedAt: true },
    });

    const countByDate = new Map<string, number>();
    for (const s of sessions) {
      const date = s.startedAt.toISOString().slice(0, 10);
      countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
    }

    const result = Array.from(countByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return sendSuccess(reply, result);
  });

  app.get('/tasks', async (request, reply) => {
    const userId = getAuthUserId(request);

    const sessions = await prisma.session.findMany({
      where: { userId, type: 'focus', taskId: { not: null } },
      select: { taskId: true, actualDuration: true },
    });

    const durationByTask = new Map<string, number>();
    for (const s of sessions) {
      if (!s.taskId) continue;
      durationByTask.set(
        s.taskId,
        (durationByTask.get(s.taskId) ?? 0) + s.actualDuration,
      );
    }

    const taskIds = Array.from(durationByTask.keys());
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true, title: true },
    });

    const result = tasks.map((t) => ({
      taskId: t.id,
      title: t.title,
      totalSeconds: durationByTask.get(t.id) ?? 0,
    }));

    return sendSuccess(reply, result);
  });

  app.get('/streak', async (request, reply) => {
    const userId = getAuthUserId(request);

    const sessions = await prisma.session.findMany({
      where: { userId, type: 'focus' },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' },
    });

    const uniqueDays = [
      ...new Set(sessions.map((s) => s.startedAt.toISOString().slice(0, 10))),
    ].sort((a, b) => b.localeCompare(a));

    let current = 0;
    let longest = 0;
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < uniqueDays.length; i++) {
      const day = uniqueDays[i]!;
      const prev = i === 0 ? today : uniqueDays[i - 1]!;
      const diff =
        (new Date(prev).getTime() - new Date(day).getTime()) /
        (1000 * 60 * 60 * 24);

      if (diff <= 1) {
        streak++;
        if (i === 0) current = streak;
      } else {
        if (i === 0) current = 0;
        streak = 1;
      }

      if (streak > longest) longest = streak;
    }

    return sendSuccess(reply, { current, longest });
  });
}
