import type { FastifyReply } from 'fastify';

export function sendError(
  reply: FastifyReply,
  status: number,
  code: string,
  message: string,
): FastifyReply {
  return reply.status(status).send({
    success: false,
    error: { code, message },
  });
}

export function sendSuccess<T>(reply: FastifyReply, data: T, status = 200): FastifyReply {
  return reply.status(status).send({ success: true, data });
}
