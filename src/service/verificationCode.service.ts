import { randomInt } from "node:crypto";

import {
  VerificationChannel,
  VerificationPurpose,
  type CreateVerificationCode,
} from "../dto/VerificationCodeSchema.js";

import { VerificationCodeRepository } from "../repository/verificationCode.repository.js";
import { EventService } from "./event.service.js";
import type { Prisma } from "../generated/prisma/index.js";

export class VerificationCodeService {
  constructor(
    private readonly verificationCodeRepository: VerificationCodeRepository,
    private readonly eventService: EventService,
  ) {}

  async createVerificationCode(
      data: {
          userId: string;
          destination: string;
      channel: VerificationChannel;
      purpose:VerificationPurpose;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const code = randomInt(100000, 1000000).toString();
    const codeHash = await import("argon2").then((argon2) =>
      argon2.hash(code),
    );

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000,
    );

    const verificationCode: CreateVerificationCode = {
      userId: data.userId,
      channel: data.channel,
      purpose: VerificationPurpose.email_verification,
      codeHash,
      expiresAt,
      destination: data.destination,
    };

    await this.verificationCodeRepository.create(
        verificationCode,
        tx,
    );

    await this.eventService.emit(
      {
        type: "auth.code.requested",
        payload: {
          event: "auth.code.requested",
          userId: data.userId,
          target: data.destination,
          code,
          expiresAt: expiresAt.toISOString(),
        },
      },
      tx,
    );

    return {
      expiresAt,
    };
  }
}