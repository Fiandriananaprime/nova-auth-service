import type { CreateVerificationCode } from "../dto/VerificationCodeSchema.js"
import { Prisma } from "../generated/prisma/index.js"

export class VerificationCodeRepository {
    
    async create(tx:Prisma.TransactionClient,data:CreateVerificationCode){
        await tx.verificationCode.create({data})
    }
}