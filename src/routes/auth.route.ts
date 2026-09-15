import type { FastifyInstance } from "fastify";
import type { AuthController } from "../controller/auth.controller.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { createUserSchema, requestLogin } from "../schema/user.schema.js";

export const authRoute = (
  app: FastifyInstance,
  userControler: AuthController,
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
      { preHandler: authenticate },
      userControler.getCsrf.bind(userControler),
    );
  }, option);
};