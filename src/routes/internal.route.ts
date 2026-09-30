import type { FastifyInstance } from "fastify";
import { AuthController } from "../controller/auth.controller.js";

export const InternalRoute = (
    app: FastifyInstance,
    authController: AuthController,
    option: { prefix: string}
) => {
    app.register((router) => {
        router.post<{Body:{access_token:string}}>(
            "/validate",authController.validateAccessToken.bind(authController)
        )

        router.post<{Body:{access_token:string; csrf_token:string}}>(
            "/validate-csrf",authController.validateCsrf.bind(authController)
        )
    },option)
}