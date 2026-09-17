import argon2 from "argon2";

import { UserRepository } from "../repository/user.repository.js";


import { InvalidCredentialsError } from "../errorHandler/InvalidCredentialError.js";
import {
  EmailNotVerifiedError,
  ExpiredVerificationCode,
  InvalidVerificationCode,
  VerificationNotFound,
} from "../errorHandler/EmailNotVerified.js";

import type { VerificationCodeService } from "./verificationCode.service.js";

import { VerificationChannel, VerificationPurpose } from "../dto/VerificationCodeSchema.js";
import type { VerificationCodeRepository } from "../repository/verificationCode.repository.js";
import { UserNotFoundError } from "../errorHandler/UserError.js";

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

  async resendCode(userId: string, channel: VerificationChannel) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();

    const target = channel === VerificationChannel.email ? user.email : user.phone;
    if (!target) throw new UserNotFoundError();

    await this.verificationCode.createVerificationCode({
      userId,
      channel,
      destination:target,
      purpose: channel === VerificationChannel.email
        ? VerificationPurpose.email_verification
        : VerificationPurpose.phone_verification,
    })    
  }

  async verifyUserCode(
    userId: string,
    code: string,
    channel: VerificationChannel,
  ) {
    const purpose = channel === VerificationChannel.email
      ? VerificationPurpose.email_verification
      : VerificationPurpose.phone_verification;
    const verificationCode = await this.verificationRepository.findLatestActive(
      userId,
      channel,
      purpose,
    );

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
      throw new InvalidVerificationCode();
    }

    const consumed = await this.verificationRepository.consume(verificationCode.id);
    if (!consumed) throw new VerificationNotFound();

    channel === VerificationChannel.email
      ? await this.userRepository.markEmailAsVerified(userId)
      : await this.userRepository.markPhoneAsVerified(userId);
  }
}