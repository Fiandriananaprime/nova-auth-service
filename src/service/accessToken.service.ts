import { randomBytes } from "node:crypto";
import { redis } from "../database/redis.js";
type AuthPurpose = "access" | "verification";

export class AccessTokenService {
  private readonly ttl = 15 * 60;

  async create(data: {
    userId: string;
    sessionId: string;
    purpose: "access" | "verification"
  }) {
    const accessToken = randomBytes(32).toString("hex");

    const key = data.purpose ==="access" ? `access_token:${accessToken}` : `verification_token:${accessToken}`;

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

  async get(token: string, purpose: AuthPurpose) {
    
    const data = purpose === "access" ? await redis.get(`access_token:${token}`) : 
                await redis.get(`verification_token:${token}`);

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