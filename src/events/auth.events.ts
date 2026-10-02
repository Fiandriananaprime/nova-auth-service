export const AUTH_EXCHANGE = "nova.events";

export type EmailVerificationRequested = {
  event: "auth.email_verification_requested";
  userId: string;
  email: string;
  code: string;
  expiresAt: string;
};

export type OutboxEventPayload = EmailVerificationRequested;