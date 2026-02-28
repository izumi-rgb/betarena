/**
 * Manual mock for src/config/database.ts
 *
 * Provides a mock Knex query builder so that tests importing the app
 * do not attempt real PostgreSQL connections.
 */
const mockQueryBuilder: any = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  first: jest.fn().mockResolvedValue(null),
  insert: jest.fn().mockResolvedValue([1]),
  update: jest.fn().mockResolvedValue(1),
  del: jest.fn().mockResolvedValue(1),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  count: jest.fn().mockResolvedValue([{ count: 0 }]),
  join: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  sum: jest.fn().mockResolvedValue([{ sum: 0 }]),
  groupBy: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
  then: jest.fn(),
};

const mockDb: any = jest.fn(() => ({ ...mockQueryBuilder }));
mockDb.raw = jest.fn().mockResolvedValue({ rows: [] });
mockDb.transaction = jest.fn((cb: any) => cb(mockDb));
mockDb.destroy = jest.fn().mockResolvedValue(undefined);

export default mockDb;
