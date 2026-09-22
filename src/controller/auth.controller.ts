import type { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../service/user.service.js";
import { AuthService } from "../service/auth.service.js";
import type { RegisterRequest, LoginRequest } from "@Fiandriananaprime/nova_api_type";
import { SessionService } from "../service/session.service.js";
import { parseUserAgent } from "../utils/user-agent.js";
import { CsrfService } from "../service/csrf.service.js";
import { UnauthorizedError } from "../errorHandler/InvalidCredentialError.js";
import { VerificationChannel, VerificationPurpose } from "../dto/VerificationCodeSchema.js";
import { redis } from "../database/redis.js";
import { AccessTokenService } from "../service/accessToken.service.js";

export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly authService: AuthService,
    private readonly accessTokenService: AccessTokenService,
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

  async sendVerification(request: FastifyRequest<{Params:{channel: string}}>, reply: FastifyReply) {
    const channel = request.params.channel;
    if (!this.isVerificationChannel(channel)) {
      return reply.code(400).send({ error: "Unsupported verification channel" });
    }
    const purpose = channel === "email" ? VerificationPurpose.email_verification : VerificationPurpose.phone_verification;
    return this.sendVerificationCode(request, reply,purpose);
  }

  async sendSudoVerification(request:FastifyRequest<{Params: {channel: string}}>, reply: FastifyReply){
    if (!this.isVerificationChannel(request.params.channel)) {
      return reply.code(400).send({ error: "Unsupported verification channel" });
    }
    const purpose = VerificationPurpose.sudo;

    return this.sendVerificationCode(request,reply,purpose)
  }

  private async sendVerificationCode( request: FastifyRequest<{Params:{channel:string}}>, reply: FastifyReply,purpose:VerificationPurpose) {
    const userId = request.userId;
    const channel = request.params.channel
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    await this.authService.sendCode(
      userId, 
      channel === "email" ? VerificationChannel.email : VerificationChannel.phone,
      purpose
    );
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

  async verifySudoCode(
    request: FastifyRequest<{ Params: { channel: string }; Body: { code: string } }>,
    reply: FastifyReply,
  ) {
    const channel = request.params.channel;
    if (!this.isVerificationChannel(channel)) {
      return reply.code(400).send({ error: "Unsupported verification channel" });
    }

    if (!request.userId) throw new UnauthorizedError("Access token missing");

    await this.authService.verifySudoCode(
      request.userId,
      request.body.code,
      channel === "email" ? VerificationChannel.email : VerificationChannel.phone,
    );

    if (!request.sessionId) throw new UnauthorizedError("Session missing");
    const sudoToken = await this.accessTokenService.create({
      userId: request.userId,
      sessionId: request.sessionId,
      purpose: "sudo",
    });
    reply.setCookie("sudo_mode", sudoToken.accessToken, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/api/account",
      maxAge: sudoToken.expiresIn,
    });

    return reply.status(204).send();
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

  private isVerificationChannel(channel: string): channel is "email" | "phone" {
    return channel === "email" || channel === "phone";
  }

  async validateAccessToken(request:FastifyRequest<{Body:{access_token:string}}>) {

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
    const sessionId = request.sessionId;
    if(!sessionId) throw new UnauthorizedError("Unauthorized");
    if(!userId) throw new UnauthorizedError("Unauthorized");
    const user = await this.userService.findById(userId)

    return reply.status(200).send(user)
  }
}