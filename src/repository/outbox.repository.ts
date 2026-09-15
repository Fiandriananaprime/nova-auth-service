import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../database/prisma.js";

export class OutboxRepository {

    async findUnpublished(limit = 50) {
        return prisma.outboxEvent.findMany({
            where: { publishedAt: null },
            orderBy: { createdAt: "asc" },
            take: limit,
        });
    }

    async create(
        tx: Prisma.TransactionClient | undefined,
        type: string,
        payload: Prisma.InputJsonValue,
        ): Promise<void> {
        const db = tx ?? prisma;

    await db.outboxEvent.create({
            data: {
            type,
            payload,
            },
        });
    }

    async markPublished(id: string) {
        return prisma.outboxEvent.update({
            where: { id },
            data: { publishedAt: new Date() },
        });
    }
}