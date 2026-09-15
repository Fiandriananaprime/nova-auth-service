import type { FastifyInstance } from "fastify";
import { authRoute } from "./routes/auth.route.js";

import { UserService } from "./service/user.service.js";

import { AuthController } from "./controller/auth.controller.js";
import { OutboxRepository } from "./repository/outbox.repository.js";
import { SessionRepository } from "./repository/session.repository.js";
import { UserRepository } from "./repository/user.repository.js";
import { VerificationCodeRepository } from "./repository/verificationCode.repository.js";
import { AuthService } from "./service/auth.service.js";
import { SessionService } from "./service/session.service.js";
import { AccessTokenService } from "./service/accessToken.service.js";
import { InitiateClient } from "./client/index.js";

export const routes = (app: FastifyInstance) => {
  const outboxRepository = new OutboxRepository();
  const sessionRepository = new SessionRepository();
  const userRepository = new UserRepository();
  const verificationCodeRepository = new VerificationCodeRepository();

  const authService = new AuthService(userRepository);
  const accessTokenService = new AccessTokenService();
  const sessionService = new SessionService(sessionRepository, accessTokenService);
  const userService = new UserService(userRepository,verificationCodeRepository,outboxRepository,InitiateClient(),);

  const authController = new AuthController(userService, sessionService, authService);

  authRoute(app, authController, { prefix: "/api" });
};