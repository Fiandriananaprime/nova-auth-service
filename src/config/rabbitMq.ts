import { RabbitMQClient } from "../client/rabbitMq.client.js";
import { AuthEventPublisher } from "../events/VerificationCodeCreated.event.js";
import { OutboxPublisherService } from "../service/outboxPublisher.service.js";
import { OutboxRepository } from "../repository/outbox.repository.js";
import { env } from "./env.js";

export const setupRabbitMQ = async () => {
  const rabbitmq = new RabbitMQClient(env.RABBITMQ_URL);

  await rabbitmq.connect();

  const channel = rabbitmq.getChannel();

  const authEventPublisher = new AuthEventPublisher(channel);

  await authEventPublisher.initialize();

  const outboxPublisher = new OutboxPublisherService(
    new OutboxRepository(),
    authEventPublisher,
  );
  outboxPublisher.start();

  return authEventPublisher;
};

