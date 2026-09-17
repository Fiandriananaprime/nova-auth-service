import type { FastifyInstance } from "fastify";
import type { AuthController } from "../controller/auth.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { createUserSchema, requestLogin, requestVerify } from "../schema/user.schema.js";
import type { AccessTokenService } from "../service/accessToken.service.js";
import type { SessionRepository } from "../repository/session.repository.js";
import { requireCsrf } from "../middleware/csrf.middleware.js";

export const authRoute = (
  app: FastifyInstance,
  userControler: AuthController,
  accessTokenService: AccessTokenService,
  sessionRepository: SessionRepository,
  option: { prefix: string },
) => {

  //const authenticateMiddleware = authenticate(accessTokenService,sessionRepository,"access")
  const verificationMiddleware = authenticate(accessTokenService,sessionRepository,"verification");
  
  app.register((router) => {
    router.post(
      "/auth/register",
      { schema: { body: createUserSchema } },
      userControler.register.bind(userControler),
    );

    router.post(
      "/auth/login",
      { schema: { body: requestLogin } },
      userControler.login.bind(userControler),
    );

    router.get(
      "/auth/csrf",
      { preHandler: verificationMiddleware },
      userControler.getCsrf.bind(userControler),
    );

    router.post(
      "/auth/email/send-verification",
      { preHandler: [verificationMiddleware, requireCsrf] },
      userControler.sendEmailVerification.bind(userControler),
    );

    router.post(
      "/auth/email/resend-verification",
      { preHandler: [verificationMiddleware, requireCsrf] },
      userControler.sendEmailVerification.bind(userControler),
    );

    router.post(
      "/auth/phone/send-verification",
      { preHandler: [verificationMiddleware, requireCsrf] },
      userControler.sendPhoneVerification.bind(userControler),
    );

    router.post(
      "/auth/phone/resend-verification",
      { preHandler: [verificationMiddleware, requireCsrf] },
      userControler.sendPhoneVerification.bind(userControler),
    );

    router.post<{ Body: { code: string } }>("/auth/email/verify",
      {
        schema: {body:requestVerify},
        preHandler:[verificationMiddleware,requireCsrf],
      },
      userControler.verifyEmailCode.bind(userControler),
    );

    router.post<{ Body: { code: string } }>("/auth/phone/verify",
      {
        schema: {body:requestVerify},
        preHandler:[verificationMiddleware,requireCsrf],
      },
      userControler.verifyPhoneCode.bind(userControler),
    );

    router.post
  }, option);
};