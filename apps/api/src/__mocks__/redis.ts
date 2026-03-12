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
  sadd: jest.fn().mockResolvedValue(1),
  srem: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
  scan: jest.fn().mockResolvedValue(['0', []]),
  expire: jest.fn().mockResolvedValue(1),
  expireat: jest.fn().mockResolvedValue(1),
  setex: jest.fn().mockResolvedValue('OK'),
  pipeline: jest.fn(() => ({
    del: jest.fn().mockReturnThis(),
    srem: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  })),
  call: jest.fn().mockImplementation((...args: string[]) => {
    const cmd = args[0]?.toUpperCase();
    // rate-limit-redis: SCRIPT LOAD returns SHA1 hash
    if (cmd === 'SCRIPT') return Promise.resolve('mockedsha1hash');
    // rate-limit-redis: EVALSHA returns [totalHits, timeToExpire]
    if (cmd === 'EVALSHA') return Promise.resolve([1, 60000]);
    return Promise.resolve(null);
  }),
  ttl: jest.fn().mockResolvedValue(-1),
  on: jest.fn().mockReturnThis(),
  quit: jest.fn().mockResolvedValue('OK'),
  disconnect: jest.fn(),
  status: 'ready',
};

export default mockRedis;
