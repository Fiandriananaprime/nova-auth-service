import { prisma } from "../database/prisma.js"
import { Prisma } from "../generated/prisma/index.js"

import type { CreateVerificationCode } from "../dto/VerificationCodeSchema.js"

export class VerificationCodeRepository {
    
    async create(
        data:CreateVerificationCode,
        tx?:Prisma.TransactionClient,
    ){
        const db = tx ?? prisma
        await db.verificationCode.create({data})
    }

    async findById(id:string){
        return prisma.verificationCode.findUnique({
            where: { id }
        });
    }
}