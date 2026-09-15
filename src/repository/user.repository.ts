import { prisma } from "../database/prisma.js";
import { Prisma } from "../generated/prisma/index.js";
import type { createUserDto } from "../dto/UserSchema.js";

export class UserRepository {

    async findByEmail(email:string){
        return prisma.user.findUnique({where:{email}})
    }

    async createUser(tx:Prisma.TransactionClient,data:createUserDto) {

        const {id, firstName,lastName, email,password } = data
        
        return tx.user.create({
            data: {
                id,
                firstName,
                lastName,
                role: "buyer",
                email,
                password,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                email: true,
                status: true,
                createdAt: true,
            },
        });
    }

}