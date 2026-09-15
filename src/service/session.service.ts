import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { SessionRepository } from "../repository/session.repository.js";
import { AccessTokenService } from "./accessToken.service.js";

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly accessTokenService: AccessTokenService,
  ) {}

  async createSession(data: {
    userId: string;
    ipAddress: string;
    device: string;
    browser: string;
    operatingSystem: string;
    location: string;
    remember: boolean;
  }) {
    const refreshToken = randomBytes(64).toString("hex");

    const refreshTokenHash = await argon2.hash(refreshToken);

    const expiresAt = new Date(
      Date.now() +
        (data.remember
          ? 30 * 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000),
    );

    const session = await this.sessionRepository.create({
      userId: data.userId,
      refreshTokenHash,
      device: data.device,
      browser: data.browser,
      operatingSystem: data.operatingSystem,
      ipAddress: data.ipAddress,
      location: data.location,
      expiresAt,
      remember: data.remember,
    });

    const { accessToken, expiresIn } =
      await this.accessTokenService.create({
        userId: data.userId,
        sessionId: session.id,
      });

    return {
      session,
      accessToken,
      refreshToken,
      expiresAt,
      accessTokenExpiresIn: expiresIn,
    };
  }
}