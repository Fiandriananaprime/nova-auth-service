/**
 * import type { FastifyInstance } from "fastify";
import type { AuthController } from "../controller/auth.controller.js";
import type { Authenticate } from "../middleware/authenticate.middleware.js";
import { requireCsrf } from "../middleware/csrf.middleware.js";

export const accountRoute = (
  app: FastifyInstance,
  userControler: AuthController,
  auth: Authenticate,
  option: { prefix: string },
) => {
    app.register((route) => {
        route.patch<{Body:{newEmail: string, password: string}}>(
            "/account/email",
            {preHandler: [auth.authenticate.bind(auth), requireCsrf]},
            userControler.changeEmail.bind(userControler) )
    },option)
}
 */

  