import argon2 from "argon2";

import { UserRepository } from "../repository/user.repository.js";


import { InvalidCredentialsError } from "../errorHandler/InvalidCredentialError.js";
import {
  EmailNotVerifiedError,
  ExpiredVerificationCode,
  InvalidVerficationCode,
  VerificationNotFound,
} from "../errorHandler/EmailNotVerified.js";

import type { VerificationCodeService } from "./verificationCode.service.js";

import { VerificationChannel, VerificationPurpose } from "../dto/VerificationCodeSchema.js";
import type { VerificationCodeRepository } from "../repository/verificationCode.repository.js";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationRepository: VerificationCodeRepository,
    private readonly verificationCode: VerificationCodeService,
  ) {}

  async login(data: {
    email: string;
    password: string;
  }) {
    const user = await this.userRepository.findByEmail(data.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const validPassword = await argon2.verify(
      user.password,
      data.password,
    );

    if (!validPassword) {
      throw new InvalidCredentialsError();
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    const { password, ...safeUser } = user;

    return safeUser;
  }

  async resendCode(userId:string,target: string) {
    const isEmail = target.includes("@");

    await this.verificationCode.createVerificationCode({
      userId,
      channel: isEmail ? VerificationChannel.email : VerificationChannel.phone,
      destination:target,
      purpose:isEmail ? VerificationPurpose.email_verification : VerificationPurpose.phone_verification
    })    
  }

  async verifyEmail(id: string, code: string) {
    const verificationCode =
      await this.verificationRepository.findById(id);

    if (!verificationCode) {
      throw new VerificationNotFound();
    }

    if (verificationCode.expiresAt < new Date()) {
      throw new ExpiredVerificationCode();
    }

    const valid = await argon2.verify(
      verificationCode.codeHash,
      code,
    );

    if (!valid) {
      throw new InvalidVerficationCode();
    }
  }
}