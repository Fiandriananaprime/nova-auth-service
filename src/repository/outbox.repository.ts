import { Prisma } from "../generated/prisma/index.js";
import type { VerificationCodeCreatedEvent } from "../events/VerificationCodeCreated.event.js";

export class OutboxRepository {

    async create(
        tx: Prisma.TransactionClient,
        type: string,
        payload: VerificationCodeCreatedEvent
    ) {
        return tx.outboxEvent.create({
            data: {
                type,
                payload,
            },
        });
    }
}