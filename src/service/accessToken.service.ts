import { randomBytes } from "node:crypto";
import { redis } from "../database/redis.js";

export class AccessTokenService {
  private readonly ttl = 15 * 60;

  async create(data: {
    userId: string;
    sessionId: string;
  }) {
    const accessToken = randomBytes(32).toString("hex");

    const key = `access_token:${accessToken}`;

    await redis.set(
      key,
      JSON.stringify({
        userId: data.userId,
        sessionId: data.sessionId,
      }),
      {
        EX: this.ttl,
      },
    );

    return {
      accessToken,
      expiresIn: this.ttl,
    };
  }

  async get(accessToken: string) {
    const data = await redis.get(`access_token:${accessToken}`);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as {
      userId: string;
      sessionId: string;
    };
  }

  async revoke(accessToken: string) {
    await redis.del(`access_token:${accessToken}`);
  }
}