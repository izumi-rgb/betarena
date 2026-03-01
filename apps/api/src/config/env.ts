import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const env = {
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: parseInt(optionalEnv('PORT', '4000'), 10),

  // Database — prefer DATABASE_URL (Railway), fall back to individual vars
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DATABASE_URL ? '' : requireEnv('DB_HOST'),
  DB_PORT: parseInt(optionalEnv('DB_PORT', '5432'), 10),
  DB_NAME: process.env.DATABASE_URL ? '' : requireEnv('DB_NAME'),
  DB_USER: process.env.DATABASE_URL ? '' : requireEnv('DB_USER'),
  DB_PASSWORD: process.env.DATABASE_URL ? '' : requireEnv('DB_PASSWORD'),

  // Redis — prefer REDIS_URL (Railway), fall back to individual vars
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_HOST: optionalEnv('REDIS_HOST', '127.0.0.1'),
  REDIS_PORT: parseInt(optionalEnv('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: optionalEnv('REDIS_PASSWORD', ''),

  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),

  CORS_ORIGIN: optionalEnv('CORS_ORIGIN', 'http://localhost:3000'),

  SPORTS_API_KEY: optionalEnv('SPORTS_API_KEY', ''),
  SPORTS_API_BASE_URL: optionalEnv('SPORTS_API_BASE_URL', ''),
} as const;
