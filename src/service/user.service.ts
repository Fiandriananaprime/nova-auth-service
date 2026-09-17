import argon2 from "argon2";

import { prisma } from "../database/prisma.js";
import { UserAlreadyExists, UserNotFoundError } from "../errorHandler/UserError.js";

import type { RegisterRequest } from "../dto/UserSchema.js";

import { UserRepository } from "../repository/user.repository.js";
import { UserClient } from "../client/user.client.js";
import { VerificationCodeService } from "./verificationCode.service.js";
import { VerificationChannel, VerificationPurpose } from "../dto/VerificationCodeSchema.js";
import type { User } from "@Fiandriananaprime/nova_api_type";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userClient: UserClient,
    private readonly verificationCodeService: VerificationCodeService,
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

      return await prisma.$transaction(async (tx) => {
        const credentials = await this.userRepository.createUser(tx, {
          id: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: passwordHash,
        });

      await this.verificationCodeService.createVerificationCode(
          {
            userId: user.id,
            channel:VerificationChannel.email,
            destination:user.email,
            purpose:VerificationPurpose.email_verification
          },
          tx,
        );

        return credentials;
      });
    } catch (error) {
      await this.userClient.deleteUser(user.id);
      throw error;
    }
  }

  async findById(id:string): Promise<User>{
    const user = await this.userRepository.findById(id)
    if(!user) throw new UserNotFoundError();
    
    const { address } = await this.userClient.getUserAddresses(id);
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt.toISOString(),
      addresses: address
    }
  }
}