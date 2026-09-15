import type { Channel } from "amqplib";
import { AUTH_EXCHANGE } from "./auth.events.js";

export type VerificationCodeCreatedEvent = {
  type: string;
  payload: unknown;
};

export class AuthEventPublisher {
  constructor(
    private readonly channel: Channel,
  ) {}

  async initialize(): Promise<void> {
    await this.channel.assertExchange(
      AUTH_EXCHANGE,
      "topic",
      {
        durable: true,
      },
    );
  }

  publish(type: string, payload: unknown): boolean {
    return this.channel.publish(
      AUTH_EXCHANGE,
      type,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: "application/json",
      },
    );
  }
}