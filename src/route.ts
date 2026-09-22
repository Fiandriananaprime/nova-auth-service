import type { FastifyInstance } from "fastify";
import { authRoute } from "./routes/auth.route.js";

import { UserService } from "./service/user.service.js";

import { AuthController } from "./controller/auth.controller.js";
import { OutboxRepository } from "./repository/outbox.repository.js";
import { EventService } from "./service/event.service.js";
import { SessionRepository } from "./repository/session.repository.js";
import { UserRepository } from "./repository/user.repository.js";
import { AuthService } from "./service/auth.service.js";
import { SessionService } from "./service/session.service.js";
import { AccessTokenService } from "./service/accessToken.service.js";
import { InitiateClient } from "./client/index.js";
import { VerificationCodeRepository } from "./repository/verificationCode.repository.js";
import { VerificationCodeService } from "./service/verificationCode.service.js";
import { InternalRoute } from "./routes/internal.route.js";
import { Authenticate } from "./middleware/authenticate.middleware.js";
import { accountRoute } from "./routes/account.route.js";
import { AccountController } from "./controller/account.controller.js";
 

export const routes = (app: FastifyInstance) => {

  //Dependencies
  const outboxRepository = new OutboxRepository();
  const sessionRepository = new SessionRepository();
  const userRepository = new UserRepository();
  const verificationCodeRepository = new VerificationCodeRepository();
  const eventService = new EventService(outboxRepository);

  // Service
  const accessTokenService = new AccessTokenService();
  const sessionService = new SessionService(sessionRepository, accessTokenService,userRepository);
  const verificationCodeService = new VerificationCodeService(verificationCodeRepository,eventService)
  const authService = new AuthService(userRepository, verificationCodeRepository,verificationCodeService);
  const userService = new UserService(userRepository,InitiateClient(),verificationCodeService);

  // Controller
  const authController = new AuthController(userService, sessionService, authService, accessTokenService);
  const accountController = new AccountController(userService,authService);

  //Middleware
  const authenticateMiddleware = new Authenticate(accessTokenService,sessionRepository,"access")
  const verificationMiddleware = new Authenticate(accessTokenService,sessionRepository,"verification")
  const sudoMiddleware = new Authenticate(accessTokenService,sessionRepository,"sudo")

  //Routes
  authRoute(app, authController,authenticateMiddleware,verificationMiddleware, { prefix: "/api" });
  accountRoute(app,accountController,authenticateMiddleware,sudoMiddleware,{prefix:"/api"});
  InternalRoute(app,authController,{prefix:"/internal"})
};