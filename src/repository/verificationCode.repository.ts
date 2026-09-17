import { prisma } from "../database/prisma.js"
import { Prisma } from "../generated/prisma/index.js"

import type { CreateVerificationCode } from "../dto/VerificationCodeSchema.js"

export class VerificationCodeRepository {
    
    async create(
        data:CreateVerificationCode,
        tx?:Prisma.TransactionClient,
    ){
        const db = tx ?? prisma
        const verification = await db.verificationCode.create({data})

        return verification
    }

    async findLatestActive(
        userId: string,
        channel: "email" | "phone",
        purpose: "email_verification" | "phone_verification",
    ) {
        return prisma.verificationCode.findFirst({
            where: {
                userId,
                channel,
                purpose,
                consumedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async consume(id: string) {
        const result = await prisma.verificationCode.updateMany({
            where: { id, consumedAt: null },
            data: { consumedAt: new Date() },
        });
        return result.count === 1;
    }
}