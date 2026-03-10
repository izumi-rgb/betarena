/**
 * Manual mock for src/config/database.ts
 *
 * Provides a mock Knex query builder so that tests importing the app
 * do not attempt real PostgreSQL connections.
 *
 * The mock tracks .where() calls so that .first() can return user records
 * matching the queried ID — required by the auth middleware's DB lookup.
 */

// Known test users — keyed by ID
const TEST_USERS: Record<number, { id: number; username: string; role: string; display_id: string; is_active: boolean }> = {
  1:  { id: 1,  username: 'admin',   role: 'admin',      display_id: 'ADM001', is_active: true },
  5:  { id: 5,  username: 'agent1',  role: 'agent',      display_id: 'AGT005', is_active: true },
  10: { id: 10, username: 'member1', role: 'member',     display_id: 'MEM010', is_active: true },
};

function createQueryBuilder(table?: string): any {
  let whereId: number | null = null;

  const qb: any = {
    select: jest.fn().mockImplementation(function (this: any) { return this; }),
    where: jest.fn().mockImplementation(function (this: any, cond: any) {
      if (cond && typeof cond === 'object' && cond.id != null) {
        whereId = cond.id;
      }
      return this;
    }),
    andWhere: jest.fn().mockImplementation(function (this: any) { return this; }),
    orWhere: jest.fn().mockImplementation(function (this: any) { return this; }),
    whereIn: jest.fn().mockImplementation(function (this: any) { return this; }),
    whereRaw: jest.fn().mockImplementation(function (this: any) { return this; }),
    first: jest.fn().mockImplementation(() => {
      // If querying the users table by ID, return the matching test user
      if (table === 'users' && whereId != null && TEST_USERS[whereId]) {
        return Promise.resolve({ ...TEST_USERS[whereId] });
      }
      // Fallback: return a default admin record (backwards-compatible)
      return Promise.resolve({
        id: 1,
        username: 'mock-user',
        role: 'admin',
        display_id: 'ADM001',
        is_active: true,
      });
    }),
    insert: jest.fn().mockResolvedValue([1]),
    update: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    increment: jest.fn().mockImplementation(function (this: any) { return this; }),
    decrement: jest.fn().mockImplementation(function (this: any) { return this; }),
    forUpdate: jest.fn().mockImplementation(function (this: any) { return this; }),
    orderBy: jest.fn().mockImplementation(function (this: any) { return this; }),
    orderByRaw: jest.fn().mockImplementation(function (this: any) { return this; }),
    limit: jest.fn().mockImplementation(function (this: any) { return this; }),
    offset: jest.fn().mockImplementation(function (this: any) { return this; }),
    count: jest.fn().mockResolvedValue([{ count: 0 }]),
    max: jest.fn().mockResolvedValue([{ maxId: 0 }]),
    join: jest.fn().mockImplementation(function (this: any) { return this; }),
    leftJoin: jest.fn().mockImplementation(function (this: any) { return this; }),
    sum: jest.fn().mockResolvedValue([{ sum: 0 }]),
    groupBy: jest.fn().mockImplementation(function (this: any) { return this; }),
    groupByRaw: jest.fn().mockImplementation(function (this: any) { return this; }),
    returning: jest.fn().mockResolvedValue([]),
    then: jest.fn(),
  };

  return qb;
}

const mockDb: any = jest.fn((table?: string) => createQueryBuilder(table));
mockDb.raw = jest.fn().mockResolvedValue({ rows: [] });
mockDb.fn = { now: jest.fn().mockReturnValue('NOW()') };
mockDb.transaction = jest.fn((cb: any) => cb(mockDb));
mockDb.destroy = jest.fn().mockResolvedValue(undefined);

export default mockDb;
