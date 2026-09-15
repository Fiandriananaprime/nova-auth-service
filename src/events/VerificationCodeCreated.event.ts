export type VerificationCodeCreatedEvent = {
    userId: string;
    channel: "email" | "phone";
    purpose:
        | "email_verification"
        | "phone_verification"
        | "two_factor"
        | "email_change";
    destination: string;
    code: string;
    expiresAt: Date;
};