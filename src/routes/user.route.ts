import type { FastifyInstance } from "fastify";
import type { AuthController } from "../controller/auth.controller.js";
import { createUserSchema } from "../schema/user.schema.js";

export const userRoute = (
    app:FastifyInstance,
    userControler:AuthController,
    option : {prefix: string}
) => {
    app.register((router) => {
        router.post("/auth/register", { schema: { body: createUserSchema } }, userControler.register.bind(userControler));
        router.post(
            "/auth/login",
            {
                schema: {
                    body: {
                        type: "object",
                        required: ["email", "password"],
                        properties: {
                            email: { type: "string", format: "email" },
                            password: { type: "string", minLength: 1 },
                        },
                        additionalProperties: false,
                    },
                },
            },
            userControler.login.bind(userControler),
        );
    }, option);
}