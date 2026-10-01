import { createClient } from "redis";
import { env } from "../config/env.js";

export const redis = createClient({
  url: env.REDIS_URL,
});

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

export async function ensureRedisConnection() {
  if (redis.isReady) return;

  if (!redis.isOpen) {
    await redis.connect();
    return;
  }

  try {
    await redis.ping();
  } catch {
    redis.destroy();
    await redis.connect();
  }
}