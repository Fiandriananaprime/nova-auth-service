import type { FastifyReply, FastifyRequest } from "fastify";
import { CsrfService } from "../service/csrf.service.js";

const csrfService = new CsrfService();

export async function requireCsrf(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.headers["x-csrf-token"];
  const sessionId = request.sessionId ?? request.cookies?.["session_id"];

  if (typeof token !== "string") {
    return reply.code(403).send({
      error: "CSRF token required",
    });
  }

  if (!sessionId) {
    return reply.code(401).send({
      error: "Unauthorized",
    });
  }

  const valid = await csrfService.verify(sessionId, token);

  if (!valid) {
    return reply.code(403).send({
      error: "Invalid CSRF token",
    });
  }
}