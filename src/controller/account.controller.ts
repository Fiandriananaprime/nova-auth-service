import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserService } from "../service/user.service.js";
import { UnauthorizedError } from "../errorHandler/InvalidCredentialError.js";
import type { AuthService } from "../service/auth.service.js";

export class AccountController {
    constructor(
        private readonly userService: UserService,
        private readonly authService: AuthService
    ) {}

    async requestEmailChange(request:FastifyRequest<{Body:{email: string}}>,reply: FastifyReply ){
        const userId = request.userId
        const email = request.body.email

        if(!userId) throw new UnauthorizedError("Unauthorized")
        await this.userService.requestEmailChange(userId,email);

        return reply.status(204).send();
    }

    async confirmEmailChange(request:FastifyRequest<{Body:{code: string}}>,reply: FastifyReply ){
        const userId = request.userId
        const code = request.body.code
        if(!userId) throw new UnauthorizedError("Unauthorized")
        await this.authService.confirmEmailChange(userId,code);

        return reply.status(204).send();
    }

    async requestPhoneChange(request:FastifyRequest<{Body:{phone: string}}>,reply: FastifyReply ){
        const userId = request.userId;
        if(!userId) throw new UnauthorizedError("Unauthorized");
        await this.userService.requestPhoneChange(userId, request.body.phone);
        return reply.status(204).send();
    }

    async confirmPhoneChange(request:FastifyRequest<{Body:{code: string}}>,reply: FastifyReply ){
        const userId = request.userId;
        if(!userId) throw new UnauthorizedError("Unauthorized");
        await this.authService.confirmPhoneChange(userId, request.body.code);
        return reply.status(204).send();
    }

    async changePassword(request: FastifyRequest<{Body:{currentPassword: string, newPassword: string}}>,reply: FastifyReply){
        const userId = request.userId;
        if(!userId) throw new UnauthorizedError("Unauthorized");
        const {currentPassword, newPassword} = request.body;
        await this.authService.changePassword(userId,currentPassword,newPassword);
        return reply.status(204).send();
    }
}