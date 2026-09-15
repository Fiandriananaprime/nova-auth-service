import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    sessionId?: string;
  }
}

export {};
