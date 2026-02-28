/**
 * Jest test setup for the API.
 *
 * This file runs before each test suite. It sets the required environment
 * variables so that config/env.ts does not throw when the app is imported.
 *
 * Database and Redis are mocked via moduleNameMapper in jest.config.ts
 * so that no real connections are attempted during tests.
 */

process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'bitarena_test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-unit-tests';
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = '';
process.env.CORS_ORIGIN = 'http://localhost:3000';
