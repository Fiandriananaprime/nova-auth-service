import argon2 from "argon2";

import { UserRepository } from "../repository/user.repository.js";


import { InvalidCredentialsError, InvalidPasswordError } from "../errorHandler/InvalidCredentialError.js";
import {
  EmailNotVerifiedError,
  ExpiredVerificationCode,
  InvalidVerificationCode,
  VerificationNotFound,
  VerificationRateLimitError,
} from "../errorHandler/EmailNotVerified.js";

import type { VerificationCodeService } from "./verificationCode.service.js";

import { VerificationChannel, VerificationPurpose } from "../dto/VerificationCodeSchema.js";
import type { VerificationCodeRepository } from "../repository/verificationCode.repository.js";
import { UserNotFoundError } from "../errorHandler/UserError.js";
import type { MobileMoneyVerificationClient } from "../client/mobileMoneyVerification.client.js";


const RESEND_COOLDOWN_MS = 30_000;
export class AuthService {
  private readonly phoneResendAt = new Map<string, number>();

  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationRepository: VerificationCodeRepository,
    private readonly verificationCode: VerificationCodeService,
    private readonly mobileMoneyVerification: MobileMoneyVerificationClient,
  ) {}

  async login(data: {
    email: string;
    password: string;
  }) {
    const user = await this.userRepository.findByEmail(data.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const validPassword = await argon2.verify( user.password, data.password);

    if (!validPassword) {
      throw new InvalidCredentialsError();
    }

    if (!user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    const { password, ...safeUser } = user;

    return safeUser;
  }

  async sendEmailCode(userId: string, purpose: VerificationPurpose) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();
    if (!user.email) throw new UserNotFoundError();

    const latestCode = await this.verificationRepository.findLatestActive(
      userId,
      VerificationChannel.email,
      purpose,
    );

    if (latestCode && latestCode.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_MS) {
      throw new VerificationRateLimitError();
    }

    await this.verificationRepository.invalidateActive(userId, VerificationChannel.email, purpose);

    await this.verificationCode.createVerificationCode({
      userId,
      channel: VerificationChannel.email,
      destination: user.email,
      purpose,
    });
  }

  async sendPhoneCode(userId: string, purpose: VerificationPurpose) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();

    const target = purpose === VerificationPurpose.phone_change ? user.pendingPhone : user.phone;
    if (!target) throw new UserNotFoundError();

    const cooldownKey = `${userId}:${purpose}`;
    const lastSentAt = this.phoneResendAt.get(cooldownKey) ?? 0;
    if (lastSentAt > Date.now() - RESEND_COOLDOWN_MS) throw new VerificationRateLimitError();

    await this.mobileMoneyVerification.sendVerification(target);
    this.phoneResendAt.set(cooldownKey, Date.now());
  }

  private async verifyEmailCode(userId: string, code: string, purpose: VerificationPurpose) {
    const verificationCode = await this.verificationRepository.findLatestActive(
      userId,
      VerificationChannel.email,
      purpose,
    );
    if(!verificationCode) throw new VerificationNotFound()
    if (verificationCode.expiresAt < new Date()) throw new ExpiredVerificationCode();
    if (!(await argon2.verify(verificationCode.codeHash, code))) throw new InvalidVerificationCode();
    if (!(await this.verificationRepository.consume(verificationCode.id))) throw new VerificationNotFound();
  }

  async verifyPhoneCode(userId: string, code: string, purpose: VerificationPurpose) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();
    const target = purpose === VerificationPurpose.phone_change ? user.pendingPhone : user.phone;
    if (!target) throw new UserNotFoundError();

    if (!(await this.mobileMoneyVerification.verify(target, code))) {
      throw new InvalidVerificationCode();
    }
  }
  
  async verifyUserCode(
    userId: string,
    code: string,
    channel: VerificationChannel,
  ) {
    const purpose = channel === VerificationChannel.email
      ? VerificationPurpose.email_verification
      : VerificationPurpose.phone_verification;
    if (channel === VerificationChannel.email) await this.verifyEmailCode(userId, code, purpose);
    else await this.verifyPhoneCode(userId, code, purpose);

    channel === VerificationChannel.email
      ? await this.userRepository.markEmailAsVerified(userId)
      : await this.userRepository.markPhoneAsVerified(userId);
  }

  async verifySudoCode(
    userId: string,
    code: string,
    channel: VerificationChannel,
  ) {
    if (channel === VerificationChannel.email) await this.verifyEmailCode(userId, code, VerificationPurpose.sudo);
    else await this.verifyPhoneCode(userId, code, VerificationPurpose.sudo);
  }

  async confirmEmailChange(userId: string, code: string) {
    await this.verifyEmailCode(userId, code, VerificationPurpose.email_change);
    const user = await this.userRepository.findById(userId);
    if(!user) throw new UserNotFoundError();
    if(!user.pendingEmail) throw new UserNotFoundError();
    await this.userRepository.changeEmail(userId, user.pendingEmail);
    await this.userRepository.clearPendingEmail(userId);
  }

  async confirmPhoneChange(userId: string, code: string) {
    await this.verifyPhoneCode(userId, code, VerificationPurpose.phone_change);
    const user = await this.userRepository.findById(userId);
    if(!user) throw new UserNotFoundError();
    if(!user.pendingPhone) throw new UserNotFoundError();
    await this.userRepository.changePhone(userId, user.pendingPhone);
    await this.userRepository.clearPendingPhone(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findAccountById(userId);
    if(!user) throw new UserNotFoundError();

    const validPassword = await argon2.verify(user.password, currentPassword);
    if (!validPassword) throw new InvalidPasswordError();

    const newPasswordHash = await argon2.hash(newPassword);
    await this.userRepository.updatePassword(userId, newPasswordHash);
  }
}