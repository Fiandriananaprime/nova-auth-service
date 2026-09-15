import type { FastifyRequest, FastifyReply } from "fastify";
import  { UserService } from "../service/user.service.js";
import { AuthService } from "../service/auth.service.js";
import type { RegisterRequest, LoginRequest } from "@Fiandriananaprime/nova_api_type";
import { SessionService } from "../service/session.service.js";
import { parseUserAgent } from "../utils/user-agent.js";

export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly authService: AuthService
  ) {}

  async register(
    request: FastifyRequest<{ Body: RegisterRequest }>,
    reply: FastifyReply
  ) {
    const user = await this.userService.createUser(request.body);

    return reply.status(201).send(user);
  }

  async login(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply
  ) {
    const user = await this.authService.login(request.body);

    const userAgent = request.headers["user-agent"] ?? "";
    const client = parseUserAgent(userAgent);

    const session = await this.sessionService.createSession({
    userId: user.id,
    ipAddress: request.ip,
    device: client.device,
    browser: client.browser,
    operatingSystem: client.operatingSystem,
    location: "",
    remember: request.body.remember ?? false,
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
}