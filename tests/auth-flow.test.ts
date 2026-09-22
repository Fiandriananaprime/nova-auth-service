import { describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import argon2 from "argon2";

import { userRoute } from "../src/routes/user.route.js";
import { UserService } from "../src/service/user.service.js";

vi.mock("../src/database/prisma.js", () => ({
  prisma: {
    $transaction: async (callback: any) => callback({
      user: {
        create: vi.fn(async (args) => ({
          id: "user-1",
          ...args.data,
          status: "active",
          createdAt: new Date(),
        })),
      },
      verificationCode: {
        create: vi.fn(),
      },
      outboxEvent: {
        create: vi.fn(),
      },
    }),
  },
}));

describe("auth flow", () => {
  it("registers login endpoint", async () => {
    const app = Fastify();
    const controller = {
      register: vi.fn(async (_req, reply) => reply.status(201).send({ ok: true })),
      login: vi.fn(async (_req, reply) => reply.status(200).send({ ok: true })),
    } as any;

    userRoute(app, controller, { prefix: "/api" });
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { email: "test@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBe(200);
    expect(controller.login).toHaveBeenCalledTimes(1);
  });

  it("hashes password before persisting a new user", async () => {
    const userRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      createUser: vi.fn(async (_tx, data) => ({
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "buyer",
        email: data.email,
        status: "active",
        createdAt: new Date(),
      })),
    };

    const verificationCodeRepository = { create: vi.fn() };
    const outboxRepository = { create: vi.fn() };
    const userClient = {
      createUser: vi.fn().mockResolvedValue({
        id: "f8a206da-ffda-4590-8ba9-7148bef4b929",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        role: "buyer",
      }),
      deleteUser: vi.fn(),
    };

    const service = new UserService(
      userRepository as any,
      verificationCodeRepository as any,
      outboxRepository as any,
      userClient as any,
    );

    await service.createUser({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "secret123",
    });

    const savedPassword = userRepository.createUser.mock.calls[0][1].password;
    const savedId = userRepository.createUser.mock.calls[0][1].id;

    expect(savedId).toBe("f8a206da-ffda-4590-8ba9-7148bef4b929");
    expect(savedPassword).not.toBe("secret123");
    expect(await argon2.verify(savedPassword, "secret123")).toBe(true);
  });
});
