import { Prisma } from "../generated/prisma/index.js";
import { OutboxRepository } from "../repository/outbox.repository.js";

export type AppEvent = {
  type: string;
  payload: Prisma.InputJsonValue;
};

export class EventService {
  constructor(private readonly outboxRepository: OutboxRepository) {}

  async emit(tx: Prisma.TransactionClient, event: AppEvent): Promise<void> {
    await this.outboxRepository.create(tx, event.type, event.payload);
  }
}