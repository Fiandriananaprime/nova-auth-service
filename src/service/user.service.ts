import argon2 from "argon2";

import { prisma } from "../database/prisma.js";
import { UserAlreadyExists, UserNotFoundError } from "../errorHandler/UserError.js";

import type { RegisterRequest } from "../dto/UserSchema.js";

import { UserRepository } from "../repository/user.repository.js";
import { UserClient } from "../client/user.client.js";
import { VerificationCodeService } from "./verificationCode.service.js";
import { VerificationChannel, VerificationPurpose } from "../dto/VerificationCodeSchema.js";
import type { AuthMe } from "../types/user.js";

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
          email: data.email,
          password: passwordHash,
          role: "buyer"
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

  async findById(userId:string): Promise<AuthMe>{
    const user = await this.userRepository.findById(userId)
    if(!user) throw new UserNotFoundError();
    
    return {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      adminRole: user.adminRole,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    };
  }

  async requestEmailChange(id: string, email: string){
    const user = await this.userRepository.findById(id);
    const existingUser = await this.userRepository.findByEmail(email);

    if(!user) throw new UserNotFoundError()
    if(existingUser) throw new UserAlreadyExists()

    try {
      await prisma.$transaction(async (tx) => {
      await this.userRepository.changePendingEmail(id, email);
      await this.verificationCodeService.createVerificationCode(
          {
            userId: user.id,
            channel:VerificationChannel.email,
            destination:email,
            purpose:VerificationPurpose.email_change
          },
          tx,
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async requestPhoneChange(id: string, phone: string){
    const user = await this.userRepository.findById(id);
    const existingUser = await this.userRepository.findByPhone(phone);

    if(!user) throw new UserNotFoundError();
    if(existingUser) throw new UserAlreadyExists();

    await prisma.$transaction(async (tx) => {
      await this.userRepository.changePendingPhone(id, phone);
      await this.verificationCodeService.createVerificationCode(
        {
          userId: user.id,
          channel: VerificationChannel.phone,
          destination: phone,
          purpose: VerificationPurpose.phone_change,
        },
        tx,
      );
    });
  }
}