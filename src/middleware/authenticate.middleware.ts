import type { FastifyReply, FastifyRequest } from "fastify";
import { AccessTokenService } from "../service/accessToken.service.js";
import type { SessionRepository } from "../repository/session.repository.js";

declare module "fastify" {
  interface FastifyRequest {
    sessionId?: string;
    userId?: string;
  }
}

type AuthPurpose = "access" | "verification" | "sudo";

export class Authenticate {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly sessionRepository: SessionRepository,
    private readonly purpose: AuthPurpose
  ) {}

  async authenticate(request: FastifyRequest, reply: FastifyReply) {
    const cookieName = this.purpose === "access"
      ? "access_token"
      : this.purpose === "verification"
        ? "verification_token"
        : "sudo_mode";

    const token = request.cookies[cookieName];

    if (!token)
      return reply.code(401).send({ error: "Unauthorized, no token provided" });

    const tokenData = await this.accessTokenService.get(token, this.purpose);

    if (!tokenData)
      return reply.code(401).send({ error: "Unauthorized, invalid token" });

    const session = await this.sessionRepository.findActiveById(
      tokenData.sessionId
    );

    if (!session)
      return reply.code(401).send({ error: "Unauthorized, session don't match" });

    request.userId = session.userId;
    request.sessionId = session.id;
  }

  async verifySudoMode(request: FastifyRequest, reply: FastifyReply) {
    const sudoModeToken = request.cookies["sudo_mode"];
    if (!sudoModeToken) {
      return reply.code(401).send({ error: "Unauthorized, sudo mode not enabled" });
    }

    const tokenData = await this.accessTokenService.get(sudoModeToken, "sudo");

    if (!tokenData) {
      return reply.code(401).send({ error: "Unauthorized, invalid sudo mode token" });
    }

    const session = await this.sessionRepository.findActiveById(tokenData.sessionId);
    if (!session) {
      return reply.code(401).send({ error: "Unauthorized, session don't match" });
    }
  }
}