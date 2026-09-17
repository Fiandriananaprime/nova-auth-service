import type { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../service/user.service.js";
import { AuthService } from "../service/auth.service.js";
import type { RegisterRequest, LoginRequest } from "@Fiandriananaprime/nova_api_type";
import { SessionService } from "../service/session.service.js";
import { parseUserAgent } from "../utils/user-agent.js";
import { CsrfService } from "../service/csrf.service.js";
import { UnauthorizedError } from "../errorHandler/InvalidCredentialError.js";
import { VerificationChannel } from "../dto/VerificationCodeSchema.js";
import { redis } from "../database/redis.js";

export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly authService: AuthService
  ) {}

  async register(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const body = request.body as RegisterRequest;
    const user = await this.userService.createUser(body);

    const verificationSession = await this.sessionService.createVerificationSession(user.id)

    reply.setCookie("verification_token",verificationSession.accessToken,{
      httpOnly:true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite:"lax",
      path: "/"
    })
    
    return reply.status(201).send(user);
  }

  async login(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const body = request.body as LoginRequest;
    const user = await this.authService.login(body);

    const userAgent = request.headers["user-agent"] ?? "";
    const client = parseUserAgent(userAgent);

    const session = await this.sessionService.createSession({
      userId: user.id,
      ipAddress: request.ip,
      device: client.device,
      browser: client.browser,
      operatingSystem: client.operatingSystem,
      location: "",
      remember: body.remember ?? false,
    });

    reply
      .setCookie("access_token", session.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      })
      .setCookie("refresh_token", session.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/auth",
      });

    return reply.status(200).send(user);
  }

  async sendEmailVerification(request: FastifyRequest, reply: FastifyReply) {
    return this.sendVerificationCode(request, reply, "email");
  }

  async sendPhoneVerification(request: FastifyRequest, reply: FastifyReply) {
    return this.sendVerificationCode(request, reply, "phone");
  }

  private async sendVerificationCode(
    request: FastifyRequest,
    reply: FastifyReply,
    channel: "email" | "phone",
  ) {
    const userId = request.userId;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    await this.authService.resendCode(userId, channel === "email" ? VerificationChannel.email : VerificationChannel.phone);
    return reply.status(204).send();
  }

  async getCsrf(request: FastifyRequest, reply: FastifyReply) {
    const sessionId = request.sessionId ;

    if (!sessionId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const csrfService = new CsrfService();
    const csrfToken = await csrfService.create(sessionId);

    return reply.status(200).send({ csrfToken });
  }

  async verifyEmailCode(
    request: FastifyRequest<{ Body: { code: string } }>,
    reply: FastifyReply,
  ) {
    return this.verifyCode(request, reply, "email");
  }

  async verifyPhoneCode(
    request: FastifyRequest<{ Body: { code: string } }>,
    reply: FastifyReply,
  ) {
    return this.verifyCode(request, reply, "phone");
  }

  private async verifyCode(
    request: FastifyRequest<{ Body: { code: string } }>,
    reply: FastifyReply,
    channel: "email" | "phone",
  ) {
    const {code} = request.body;
    const userId = request.userId;
    if (!userId) throw new UnauthorizedError("Verification token missing");

    await this.authService.verifyUserCode(
      userId,
      code,
      channel === "email" ? VerificationChannel.email : VerificationChannel.phone,
    );
    return reply.status(204).send();
  }

  async validateAccessToken(request:FastifyRequest<{Body:{access_token:string}}>,reply:FastifyReply) {

    const data = await redis.get(`access_token:${request.body.access_token}`);

    if (!data) {
      throw new UnauthorizedError("Invalid access token");
    }

    const session = JSON.parse(data) as {
      userId: string;
      sessionId: string;
    };

    return {
      valid: true,
      userId: session.userId,
      sessionId: session.sessionId,
    };
  }

  async getCurrentUser(request:FastifyRequest,reply:FastifyReply){
    const userId = request.userId;

    if(!userId) throw new UnauthorizedError("Unauthorized");
    const user = await this.userService.findById(userId)

    return reply.status(200).send(user)
  }
  
}