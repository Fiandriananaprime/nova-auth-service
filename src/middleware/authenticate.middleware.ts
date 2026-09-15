import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    sessionId?: string;
  }
}

export  const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const sessionId = request.sessionId ?? request.cookies?.["session_id"];

  if (!sessionId) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  request.sessionId = sessionId;
}
