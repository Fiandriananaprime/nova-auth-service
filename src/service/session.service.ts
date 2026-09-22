import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { SessionRepository } from "../repository/session.repository.js";
import { AccessTokenService } from "./accessToken.service.js";
import type { UserRepository } from "../repository/user.repository.js";
import type { Session } from "../types/session.js";

export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly accessTokenService: AccessTokenService,
    private readonly userRepository: UserRepository
  ) {}
  
  async createVerificationSession(userId: string){

    const expiresAt = new Date( Date.now() + 15 * 60 * 1000);
    const session = await this.sessionRepository.create({userId,expiresAt})

    const {accessToken, expiresIn} = await this.accessTokenService.create({
      userId:userId,
      sessionId:session.id,
      purpose:"verification"
    })

    return {
      session,
      accessToken,
      expiresIn
    }
  }
  
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
        purpose:"access"
      });

    await this.userRepository.updateLastLoginAt(data.userId);
    return {
      session,
      accessToken,
      refreshToken,
      expiresAt,
      accessTokenExpiresIn: expiresIn,
    };
  }

  async getSessions(userId: string, sessionId?: string): Promise<Session[]> {
    const sessions = await this.sessionRepository.findByUserId(userId);

    if (sessionId) {
      return sessions.map((session) => ({
        ...session,
        current: session.id === sessionId,
      }));
    }
    return sessions;
  }
}