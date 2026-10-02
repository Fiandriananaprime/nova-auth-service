import type { FastifyInstance, FastifyRequest } from "fastify";
import type { AuthController } from "../controller/auth.controller.js";
import { Authenticate } from "../middleware/authenticate.middleware.js";
import { createUserSchema, requestLogin, requestVerify } from "../schema/user.schema.js";

import { requireCsrf } from "../middleware/csrf.middleware.js";

export const authRoute = (
  app: FastifyInstance,
  userControler: AuthController,
  authenticate: Authenticate,
  verification: Authenticate,
  option: { prefix: string },
) => {

  
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
      { preHandler: authenticate.authenticate.bind(authenticate) },
      userControler.getCsrf.bind(userControler),
    );

    router.get(
      "/auth/access/csrf",
      { preHandler: authenticate.authenticate.bind(authenticate) },
      userControler.getCsrf.bind(userControler),
    );

    router.post<{Body: {email: string}}>("/auth/email/send-verification",userControler.sendEmailVerification.bind(userControler));
    router.post<{Body: {phone: string}}>("/auth/phone/send-verification",userControler.sendPhoneVerification.bind(userControler));

    
    router.post<{Params: {channel: string}}>(
      "/auth/:channel/resend-verification",
      { preHandler: [verification.authenticate.bind(verification), requireCsrf] },
      async (request:FastifyRequest<{Params: {channel: string}}>, reply) => {
        const channel = request.params.channel;
        if (channel === "email") return userControler.resendEmailVerification(request, reply);
        if (channel === "phone") return userControler.resendPhoneVerification(request, reply);
        return reply.code(400).send({ error: "Unsupported verification channel" });
      },
    );

    router.post<{ Body: { code: string } }>("/auth/email/verify",
      {
        schema: {body:requestVerify},
        preHandler:[verification.authenticate.bind(verification),requireCsrf],
      },
      userControler.verifyEmailCode.bind(userControler),
    );

    router.post<{ Body: { code: string } }>("/auth/phone/verify",
      {
        schema: {body:requestVerify},
        preHandler:[verification.authenticate.bind(verification),requireCsrf],
      },
      userControler.verifyPhoneCode.bind(userControler),
    );

    router.get("/auth/me",{
       preHandler: authenticate.authenticate.bind(authenticate)},
       userControler.getCurrentUser.bind(userControler))

    router.post<{Params: {channel: string}}>("/auth/sudo/:channel", 
      { preHandler: [authenticate.authenticate.bind(authenticate), requireCsrf] },
      userControler.sendSudoVerification.bind(userControler)
    );

    router.post<{Params: {channel: string}; Body: {code: string}}>("/auth/sudo/:channel/verify", 
      {
        schema: { body: requestVerify },
        preHandler: [authenticate.authenticate.bind(authenticate), requireCsrf],
      },
      userControler.verifySudoCode.bind(userControler),
    );
  }, option)};