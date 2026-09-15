export type CreateVerificationCode = {
  userId?: string;
  channel: VerificationChannel;
  purpose: VerificationPurpose;
  destination: string;
  codeHash: string;
  expiresAt: Date;
  consumedAt?: Date;
};


export enum VerificationChannel {
  email = "email",
  phone = "phone",
}

export enum VerificationPurpose {
  email_verification = "email_verification",
  phone_verification = "phone_verification",
  two_factor = "two_factor",
  email_change = "email_change",
}