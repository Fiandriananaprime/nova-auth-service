
import { prisma } from "../database/prisma.js";
import type { Session } from "../types/session.js";

export class SessionRepository {
  async create(
    data: {
      userId: string;
      refreshTokenHash?: string;
      device?: string;
      browser?: string;
      operatingSystem?: string;
      ipAddress?: string;
      location?: string;
      expiresAt: Date;
      remember?: boolean;
    }
  ) {
    return prisma.userSession.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash ?? null,
        device: data.device ?? null ,
        browser: data.browser ?? null,
        operatingSystem: data.operatingSystem ?? null,
        ipAddress: data.ipAddress ?? null,
        location: data.location ?? null,
        expiresAt: data.expiresAt,
        remember: data.remember?? false
      },
    });
  }

  async findByRefreshTokenHash(refreshTokenHash: string) {
    return prisma.userSession.findUnique({
      where: {
        refreshTokenHash,
      },
    });
  }

  async findActiveById(id: string) {
    return prisma.userSession.findFirst({
      where: {
        id,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async revoke(id: string) {
    return prisma.userSession.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async updateLastActive(id: string) {
    return prisma.userSession.update({
      where: {
        id,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });
  }

  async revokeAllByUserId(userId: string) {
    return prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findByUserId(userId: string): Promise<Session[]> {

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: {
        lastActiveAt: "desc",
      },
    });
    return sessions.map((session) => ({
      id: session.id,
      device: session.device ?? "",
      browser: session.browser ?? "",
      operatingSystem: session.operatingSystem ?? "",
      ipAddress: session.ipAddress ?? "",
      location: session.location ?? null,
      lastActiveAt: session.lastActiveAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      current: false,
    }));
  }

}