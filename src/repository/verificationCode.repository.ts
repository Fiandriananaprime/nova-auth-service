import { prisma } from "../database/prisma.js"
import { Prisma } from "../generated/prisma/index.js"

import type { CreateVerificationCode } from "../dto/VerificationCodeSchema.js"

export class VerificationCodeRepository {
    
    async create(tx:Prisma.TransactionClient,data:CreateVerificationCode){
        await tx.verificationCode.create({data})
    }

    async findById(id:string){
        return prisma.verificationCode.findUnique({
            where: { id }
        });
    }
}