import { randomBytes } from "node:crypto";
import { redis } from "../database/redis.js";

type AuthPurpose = "access" | "verification" | "sudo";

type TokenData = {
  userId: string;
  sessionId: string;
  verificationId?: string;
};

export class AccessTokenService {
  private readonly ttl = {
    access: 15 * 60,
    verification: 10 * 60,
    sudo: 5 * 60,
  };

  async create(data: {
    userId: string;
    sessionId: string;
    verificationId?: string;
    purpose: AuthPurpose;
  }) {
    const accessToken = randomBytes(32).toString("hex");
    const ttl = this.ttl[data.purpose];
    const key = `${data.purpose === "access" ? "access" : data.purpose === "verification" ? "verification" : "sudo"}_token:${accessToken}`;

    await redis.set(
      key,
      JSON.stringify({
        userId: data.userId,
        sessionId: data.sessionId,
        ...(data.verificationId && {
          verificationId: data.verificationId,
        }),
      }),
      { EX: ttl },
    );

    return {
      accessToken,
      expiresIn: ttl,
    };
  }

  async get(token: string, purpose: AuthPurpose) {
    const prefix =
      purpose === "access"
        ? "access"
        : purpose === "verification"
          ? "verification"
          : "sudo";

    const data = await redis.get(`${prefix}_token:${token}`);

    if (!data) return null;

    return JSON.parse(data) as TokenData;
  }

  async revoke(token: string, purpose: AuthPurpose) {
    const prefix =
      purpose === "access"
        ? "access"
        : purpose === "verification"
          ? "verification"
          : "sudo";

    await redis.del(`${prefix}_token:${token}`);
  }
}