export type PhoneVerificationAccepted = {
  accepted: true;
  expiresAt: string;
};

export class MobileMoneyVerificationClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async sendVerification(phoneNumber: string): Promise<PhoneVerificationAccepted> {
    const response = await fetch(`${this.baseUrl}/__mock/verification/sendVerification`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": this.apiKey },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      throw new Error("Phone verification provider rejected the request");
    }
    return (await response.json()) as PhoneVerificationAccepted;
  }

  async verify(phoneNumber: string, code: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/__mock/verification/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": this.apiKey },
      body: JSON.stringify({ phoneNumber, code }),
    });

    if (response.status === 400) return false;
    if (!response.ok) throw new Error("Phone verification provider is unavailable");
    const body = (await response.json()) as { verified?: boolean };
    return body.verified === true;
  }
}
