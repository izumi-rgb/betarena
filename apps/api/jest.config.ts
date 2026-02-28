import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Redirect database and redis imports to manual mocks
    '(.*)config/database$': '<rootDir>/src/__mocks__/database.ts',
    '(.*)config/redis$': '<rootDir>/src/__mocks__/redis.ts',
  },
};

export default config;
