import type { FastifyReply, FastifyRequest } from "fastify";
import { AccessTokenService } from "../service/accessToken.service.js";
import type { SessionRepository } from "../repository/session.repository.js";


declare module "fastify" {
  interface FastifyRequest {
    sessionId?: string;
    userId?: string;
  }
}
type AuthPurpose = "access" | "verification"

export  const authenticate =  (
  accessTokenService: AccessTokenService,
  sessionRepository: SessionRepository,
  purpose: AuthPurpose
) => { 
  return async (
    request:FastifyRequest,
    reply: FastifyReply
  ) => {

    const cookiesName = purpose === "access" ? "access_token" : "verification_token";

    const Token = request.cookies[cookiesName];

    if(!Token) return reply.code(401).send({error: "Unauthorized"})

    const tokenData = await accessTokenService.get(Token,purpose === "access" ? "access" : "verification");
    
    if(!tokenData) return reply.code(401).send({error:"Unauthorized"})

    const session = await sessionRepository.findActiveById(tokenData.sessionId);
    if(!session) return reply.code(401).send({error: "Unauthorized"})

    request.userId = session.userId
    request.sessionId = session.id
  }

}
