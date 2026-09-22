import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";

export const registerCookie = async (app: FastifyInstance) => {
  await app.register(cookie);
}