import "dotenv/config";

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
}

export const env = {
  REDIS_URL: getEnv("REDIS_URL"),
  USER_SERVICE: getEnv("USER_SERVICE"),
  RABBITMQ_URL: getEnv("RABBITMQ_URL"),
  MOBILE_MONEY_PROVIDER_URL: process.env["MOBILE_MONEY_PROVIDER_URL"]?.replace(/\/$/, "") || "http://localhost:4010",
  MOBILE_MONEY_PROVIDER_API_KEY: getEnv("MOBILE_MONEY_PROVIDER_API_KEY"),
};