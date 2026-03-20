import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  isDev: boolean;
  isProd: boolean;

  databaseUrl: string;
  redisUrl: string;

  maxExecutionTimeMs: number;
  maxOutputBytes: number;
  sandboxMemoryMb: number;
  sandboxCpus: number;
  sandboxPidsLimit: number;

  sandboxImage: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function optionalInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) throw new Error(`Invalid integer for ${name}: ${value}`);
  return parsed;
}

function optionalFloat(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) throw new Error(`Invalid float for ${name}: ${value}`);
  return parsed;
}

const nodeEnv = optionalEnv('NODE_ENV', 'development');

export const config: Config = {
  port: optionalInt('PORT', 4000),
  nodeEnv,
  isDev: nodeEnv === 'development',
  isProd: nodeEnv === 'production',

  databaseUrl: requireEnv('DATABASE_URL'),
  redisUrl: optionalEnv('REDIS_URL', 'redis://redis:6379'),

  maxExecutionTimeMs: optionalInt('MAX_EXECUTION_TIME_MS', 10000),
  maxOutputBytes: optionalInt('MAX_OUTPUT_BYTES', 65536),
  sandboxMemoryMb: optionalInt('SANDBOX_MEMORY_MB', 256),
  sandboxCpus: optionalFloat('SANDBOX_CPUS', 0.5),
  sandboxPidsLimit: optionalInt('SANDBOX_PIDS_LIMIT', 64),

  sandboxImage: optionalEnv('SANDBOX_IMAGE', 'runly-sandbox'),
};
