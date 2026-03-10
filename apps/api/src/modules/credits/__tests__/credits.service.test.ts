import { transferCredits, adminCreateCredits } from '../credits.service';

/**
 * Credits service unit tests.
 *
 * These tests validate the business-logic validation guards in the credits
 * service (amount checks, hierarchy enforcement, insufficient balance).
 *
 * Database is mocked via the manual mock in src/__mocks__/database.ts
 * (mapped by jest.config.ts moduleNameMapper).
 */

// Mock utilities that the service calls after DB operations
jest.mock('../../../utils/systemLog', () => ({ writeSystemLog: jest.fn() }));
jest.mock('../../../utils/socketEvents', () => ({ emitToUser: jest.fn() }));

// Get the mock DB so we can configure per-test behavior
import db from '../../../config/database';
const mockDb = db as unknown as jest.Mock & {
  transaction: jest.Mock;
};

describe('credits.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── adminCreateCredits ──────────────────────────────────────────────

  describe('adminCreateCredits', () => {
    it('rejects zero amount with INVALID_AMOUNT', async () => {
      await expect(
        adminCreateCredits(1, 0, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('INVALID_AMOUNT');
    });

    it('rejects negative amount with INVALID_AMOUNT', async () => {
      await expect(
        adminCreateCredits(1, -50, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('INVALID_AMOUNT');
    });

    it('does not call db.transaction for invalid amounts', async () => {
      try { await adminCreateCredits(1, 0, '127.0.0.1', 'test-agent'); } catch {}
      try { await adminCreateCredits(1, -1, '127.0.0.1', 'test-agent'); } catch {}
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  // ─── transferCredits ─────────────────────────────────────────────────

  describe('transferCredits', () => {
    it('rejects zero amount with INVALID_AMOUNT', async () => {
      await expect(
        transferCredits(1, 'admin', 2, 0, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('INVALID_AMOUNT');
    });

    it('rejects negative amount with INVALID_AMOUNT', async () => {
      await expect(
        transferCredits(1, 'admin', 2, -10, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('INVALID_AMOUNT');
    });

    it('rejects when receiver is not found', async () => {
      // Make the DB return null for the users query (receiver lookup)
      const mockWhere = jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      });
      (mockDb as jest.Mock).mockReturnValueOnce({ where: mockWhere });

      await expect(
        transferCredits(1, 'admin', 999, 100, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('RECEIVER_NOT_FOUND');
    });

    it('rejects NOT_DIRECT_SUBORDINATE when sender is not parent of receiver', async () => {
      // Receiver exists but parent_agent_id and created_by do not match sender
      const mockWhere = jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 10,
          username: 'member1',
          role: 'member',
          is_active: true,
          parent_agent_id: 99,  // not the sender (1)
          created_by: 99,       // not the sender (1)
        }),
      });
      (mockDb as jest.Mock).mockReturnValueOnce({ where: mockWhere });

      await expect(
        transferCredits(1, 'agent', 10, 100, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('NOT_DIRECT_SUBORDINATE');
    });

    it('does not throw NOT_DIRECT_SUBORDINATE when admin sends to an agent', async () => {
      // Admin exception: receiver is an agent and sender is admin
      // We only check the hierarchy validation does NOT reject — the test
      // will fail on a later DB call (INSUFFICIENT_BALANCE), which is fine.
      const mockReceiverWhere = jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 5,
          username: 'agent1',
          role: 'agent',
          is_active: true,
          parent_agent_id: 99,
          created_by: 99,
        }),
      });
      (mockDb as jest.Mock).mockReturnValueOnce({ where: mockReceiverWhere });

      // Inside transaction, sender has sufficient balance
      const mockTrxBuilder = {
        where: jest.fn().mockReturnThis(),
        forUpdate: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ user_id: 1, balance: 1000 }),
        increment: jest.fn().mockReturnThis(),
        decrement: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue(undefined),
      };
      mockDb.transaction.mockImplementationOnce(async (cb: any) => cb(jest.fn(() => mockTrxBuilder)));

      // Post-transaction balance lookups + emitToUser
      const mockPostWhere = jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue({ user_id: 1, balance: 900 }),
      });
      (mockDb as jest.Mock)
        .mockReturnValueOnce({ where: mockPostWhere })   // sender balance
        .mockReturnValueOnce({ where: mockPostWhere });   // receiver balance

      const result = await transferCredits(1, 'admin', 5, 100, '127.0.0.1', 'test-agent');
      expect(result).toHaveProperty('amount', 100);
      expect(result).toHaveProperty('to_user_id', 5);
    });

    it('rejects INSUFFICIENT_BALANCE when sender has no account', async () => {
      // Receiver is valid and a direct subordinate
      const mockReceiverWhere = jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 10,
          role: 'member',
          is_active: true,
          parent_agent_id: 1,
          created_by: 1,
        }),
      });
      (mockDb as jest.Mock).mockReturnValueOnce({ where: mockReceiverWhere });

      // Inside the transaction, the sender account lookup returns null
      const mockTrxBuilder = {
        where: jest.fn().mockReturnThis(),
        forUpdate: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null), // no account
        increment: jest.fn().mockReturnThis(),
        decrement: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue(undefined),
      };
      mockDb.transaction.mockImplementationOnce(async (cb: any) => cb(jest.fn(() => mockTrxBuilder)));

      await expect(
        transferCredits(1, 'agent', 10, 100, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('INSUFFICIENT_BALANCE');
    });

    it('rejects INSUFFICIENT_BALANCE when sender balance is too low', async () => {
      // Receiver is valid
      const mockReceiverWhere = jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 10,
          role: 'member',
          is_active: true,
          parent_agent_id: 1,
          created_by: 1,
        }),
      });
      (mockDb as jest.Mock).mockReturnValueOnce({ where: mockReceiverWhere });

      // Sender account has balance of 50 but transfer is 100
      const mockTrxBuilder = {
        where: jest.fn().mockReturnThis(),
        forUpdate: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ user_id: 1, balance: 50 }),
        increment: jest.fn().mockReturnThis(),
        decrement: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue(undefined),
      };
      mockDb.transaction.mockImplementationOnce(async (cb: any) => cb(jest.fn(() => mockTrxBuilder)));

      await expect(
        transferCredits(1, 'agent', 10, 100, '127.0.0.1', 'test-agent')
      ).rejects.toThrow('INSUFFICIENT_BALANCE');
    });
  });
});
