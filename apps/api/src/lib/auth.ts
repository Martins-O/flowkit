import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { sendError } from './errors.js';

export interface AuthUser {
  id: string;
  email: string;
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    sendError(reply, 401, 'UNAUTHORIZED', 'Missing or invalid token');
  }
}

export function getAuthUserId(request: FastifyRequest): string {
  const payload = request.user as { id: string };
  return payload.id;
}
