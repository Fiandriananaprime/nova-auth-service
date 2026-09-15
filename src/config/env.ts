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
};