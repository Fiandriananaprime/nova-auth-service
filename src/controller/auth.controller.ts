import type { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from "../service/user.service.js";
import { AuthService } from "../service/auth.service.js";
import type { RegisterRequest, LoginRequest } from "@Fiandriananaprime/nova_api_type";
import { SessionService } from "../service/session.service.js";
import { parseUserAgent } from "../utils/user-agent.js";
import { CsrfService } from "../service/csrf.service.js";

export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly authService: AuthService,
  ) {}

  async register(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const body = request.body as RegisterRequest;
    const user = await this.userService.createUser(body);

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

  async resendVerificationCode(request: FastifyRequest<{Body:{userId:string,target:string}}>,reply:FastifyReply){
    const { userId, target } = request.body
    await this.authService.resendCode(userId,target);

    return reply.status(204).send();
  }

  async getCsrf(request: FastifyRequest, reply: FastifyReply) {
    const sessionId = request.sessionId ?? request.cookies?.["session_id"];

    if (!sessionId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const csrfService = new CsrfService();
    const csrfToken = await csrfService.create(sessionId);

    return reply.status(200).send({ csrfToken });
  }
}