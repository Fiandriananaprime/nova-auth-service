import { prisma } from "../database/prisma.js";
import argon2 from "argon2";
import { randomInt } from "node:crypto";

import { UserAlreadyExists } from "../errorHandler/UserError.js";

import type { RegisterRequest } from "../dto/UserSchema.js";
import {
  VerificationChannel,
  VerificationPurpose,
  type CreateVerificationCode,
} from "../dto/VerificationCodeSchema.js";

import { UserRepository } from "../repository/user.repository.js";
import { VerificationCodeRepository } from "../repository/verificationCode.repository.js";
import { UserClient } from "../client/user.client.js";
import { EventService } from "./event.service.js";


export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationCodeRepository: VerificationCodeRepository,
    private readonly eventService: EventService,
    private readonly userClient: UserClient,
  ) {}

  async createUser(data: RegisterRequest) {
    const existingUser = await this.userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new UserAlreadyExists();
    }

    const user = await this.userClient.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    });
    
    try {
      const passwordHash = await argon2.hash(data.password);
    
      const code = randomInt(100000, 1000000).toString();
      const codeHash = await argon2.hash(code);

      const verificationCode: CreateVerificationCode = {
        userId: user.id,
        channel: VerificationChannel.email,
        purpose: VerificationPurpose.email_verification,
        codeHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        destination: data.email,
      };

      return await prisma.$transaction(async (tx) => {
        const credentials = await this.userRepository.createUser(tx, {
          id: user.id,
          firstName:data.firstName,
          lastName:data.lastName,
          email: data.email,
          password:passwordHash
        });


        await this.verificationCodeRepository.create(
          tx,
          verificationCode,
        );

        await this.eventService.emit(tx, {
          type: "auth.email_verification_requested",
          payload: {
            event: "auth.email_verification_requested",
            userId: user.id,
            email: data.email,
            code,
            expiresAt: verificationCode.expiresAt.toISOString(),
          },
        });

        return credentials;
      });
    } catch (error) {
      await this.userClient.deleteUser(user.id);

      throw error;
    }
  }
}