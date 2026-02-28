/**
 * Manual mock for src/config/redis.ts
 *
 * Provides a mock Redis client so that tests importing the app
 * do not attempt real Redis connections.
 */
const mockRedis: any = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  setex: jest.fn().mockResolvedValue('OK'),
  on: jest.fn().mockReturnThis(),
  quit: jest.fn().mockResolvedValue('OK'),
  disconnect: jest.fn(),
  status: 'ready',
};

export default mockRedis;
