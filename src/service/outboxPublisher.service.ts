import type { AuthEventPublisher } from "../events/VerificationCodeCreated.event.js";
import { OutboxRepository } from "../repository/outbox.repository.js";

export class OutboxPublisherService {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly eventPublisher: AuthEventPublisher,
  ) {}

  async publishPending(): Promise<void> {
    if (this.running) return;

    this.running = true;
    try {
      const events = await this.outboxRepository.findUnpublished();

      for (const event of events) {
        const accepted = this.eventPublisher.publish(event.type, event.payload);

        if (!accepted) break;

        await this.outboxRepository.markPublished(event.id);
      }
    } finally {
      this.running = false;
    }
  }

  start(intervalMs = 1_000): void {
    void this.publishPending();
    this.timer = setInterval(() => void this.publishPending(), intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }
}