import type { FastifyInstance } from "fastify";
import type { Authenticate } from "../middleware/authenticate.middleware.js";
import { requireCsrf } from "../middleware/csrf.middleware.js";
import type { AccountController } from "../controller/account.controller.js";
import { changeRequest, codeRequest, phoneChangeRequest,requestChangePassword } from "../schema/account.schema.js";

export const accountRoute = (
  app: FastifyInstance,
  userControler: AccountController,
  auth: Authenticate,
  sudo: Authenticate,
  option: { prefix: string },
) => {
    app.register((route) => {
        route.patch<{Body:{email: string}}>(
            "/account/email",
        {schema: {body: changeRequest}, preHandler: [auth.authenticate.bind(auth),sudo.authenticate.bind(sudo), requireCsrf]},
            userControler.requestEmailChange.bind(userControler) )

      route.post<{Body:{code: string}}>(
        "/account/email/confirm",
        {schema: {body: codeRequest}, preHandler: [auth.authenticate.bind(auth), requireCsrf]},
        userControler.confirmEmailChange.bind(userControler),
      );

      route.patch<{Body:{phone: string}}>(
        "/account/phone",
        {schema: {body: phoneChangeRequest}, preHandler: [auth.authenticate.bind(auth),sudo.authenticate.bind(sudo), requireCsrf]},
        userControler.requestPhoneChange.bind(userControler),
      );

      route.post<{Body:{code: string}}>(
        "/account/phone/confirm",
        {schema: {body: codeRequest}, preHandler: [auth.authenticate.bind(auth), requireCsrf]},
        userControler.confirmPhoneChange.bind(userControler),
      );

      route.patch<{Body:{currentPassword: string, newPassword: string}}>(
        "/account/password",
        {schema: {body: requestChangePassword}, preHandler: [auth.authenticate.bind(auth), requireCsrf]},
        userControler.changePassword.bind(userControler),
      );
    },option)
  }