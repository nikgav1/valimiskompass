import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

type EnvVar = "PORT" | "MONGODB_URI" | "AUDIENCE" | "BASE_URL" | "FRONTEND_URL";

type EnvConfig = {
  port: number;
  mongodbUri: string;
  audience: string;
  baseUrl: string;
  frontendUrl: string;
};

function getRequiredString(name: EnvVar): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function getRequiredNumber(name: EnvVar): number {
  const value = Number(getRequiredString(name));

  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(`Environment variable ${name} must be an integer between 1 and 65535`);
  }

  return value;
}

function getRequiredUrl(name: EnvVar): string {
  const value = getRequiredString(name);

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL`);
  }
}

function getRequiredOrigin(name: EnvVar): string {
  const value = getRequiredString(name);

  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL`);
  }
}

export const env: Readonly<EnvConfig> = Object.freeze({
  port: getRequiredNumber("PORT"),
  mongodbUri: getRequiredString("MONGODB_URI"),
  audience: getRequiredString("AUDIENCE"),
  baseUrl: getRequiredUrl("BASE_URL"),
  frontendUrl: getRequiredOrigin("FRONTEND_URL"),
});
