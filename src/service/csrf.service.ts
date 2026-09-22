import { randomBytes, timingSafeEqual } from "node:crypto";
import { redis } from "../config/redis.js";

const CSRF_TTL = 60 * 60; 

export class CsrfService {
  async create(sessionId: string): Promise<string> {
    const token = randomBytes(32).toString("hex");

    await redis.set(
      `csrf:${sessionId}`,
      token,
      {
        EX: CSRF_TTL,
      },
    );

    return token;
  }

  async verify(
    sessionId: string,
    token: string,
  ): Promise<boolean> {
    const storedToken = await redis.get(`csrf:${sessionId}`);

    if (!storedToken) {
      return false;
    }

    const stored = Buffer.from(storedToken);
    const received = Buffer.from(token);

    if (stored.length !== received.length) {
      return false;
    }

    return timingSafeEqual(stored, received);
  }

  async delete(sessionId: string): Promise<void> {
    await redis.del(`csrf:${sessionId}`);
  }
}