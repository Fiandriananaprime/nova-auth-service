export const AUTH_EXCHANGE = "nova.auth";

export type EmailVerificationRequested = {
  event: "auth.email_verification_requested";
  userId: string;
  email: string;
  code: string;
  expiresAt: string;
};

export type OutboxEventPayload = EmailVerificationRequested;