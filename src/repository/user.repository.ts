import { prisma } from "../database/prisma.js";
import { Prisma } from "../generated/prisma/index.js";
import type { createUserDto } from "../dto/UserSchema.js";

export class UserRepository {

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                adminRole: true,
                emailVerified: true,
                phoneVerified: true,
            },
        });
    }
    async findByEmail(email:string){
        return prisma.user.findUnique({where:{email}})
    }

    async findByPhone(phone: string){
        return prisma.user.findUnique({where:{phone}})
    }
    

    async createUser(tx:Prisma.TransactionClient,data:createUserDto) {

        const {id, email,password,role } = data
        
        return tx.user.create({
            data: {
                id,
                role,
                email,
                password,
            },
            select: {
                id: true,
                role: true,
                email: true,
                status: true,
                createdAt: true,
            },
        });
    }

    async markPhoneAsVerified(id: string) {
        await prisma.user.update({
            where: { id },
            data: {
            phoneVerified: true,
            },
        });
    }

    async markEmailAsVerified(id:string){
        await prisma.user.update({where:{id},data:{emailVerified: true}})
    }

    async updateLastLoginAt(id: string){
        await prisma.user.update({where:{id}, data:{lastLoginAt:new Date()}})
    }
}