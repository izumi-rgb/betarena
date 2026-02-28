import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';

/**
 * Bets module API tests.
 *
 * These tests validate the HTTP layer (auth checks, input validation,
 * response shapes) without requiring a live database or Redis instance.
 * Database and Redis are mocked via Jest moduleNameMapper.
 */

const API_BASE = '/api/bets';

// Helper: generate a valid JWT for a member user
function memberToken(): string {
  return jwt.sign(
    { id: 10, username: 'member1', role: 'member', display_id: 'MEM010' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

// Helper: generate a valid JWT for an agent user (non-member)
function agentToken(): string {
  return jwt.sign(
    { id: 5, username: 'agent1', role: 'agent', display_id: 'AGT005' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

describe('Bets Routes', () => {
  describe('POST /api/bets (place bet)', () => {
    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app)
        .post(API_BASE)
        .send({ type: 'single', stake: 10, selections: [] });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NO_TOKEN');
    });

    it('should return 403 when authenticated as a non-member role', async () => {
      const res = await request(app)
        .post(API_BASE)
        .set('Authorization', `Bearer ${agentToken()}`)
        .send({ type: 'single', stake: 10, selections: [] });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('should return 400 with validation error when body is empty', async () => {
      const res = await request(app)
        .post(API_BASE)
        .set('Authorization', `Bearer ${memberToken()}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toMatch(/type.*stake.*selections.*required/i);
    });

    it('should return 400 when stake is not a positive number', async () => {
      const res = await request(app)
        .post(API_BASE)
        .set('Authorization', `Bearer ${memberToken()}`)
        .send({ type: 'single', stake: -5, selections: [{}] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toMatch(/stake.*positive/i);
    });

    it('should return 400 when selections is an empty array', async () => {
      const res = await request(app)
        .post(API_BASE)
        .set('Authorization', `Bearer ${memberToken()}`)
        .send({ type: 'single', stake: 10, selections: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toMatch(/selections.*non-empty/i);
    });

    it('should return 400 when selections are missing required fields', async () => {
      const res = await request(app)
        .post(API_BASE)
        .set('Authorization', `Bearer ${memberToken()}`)
        .send({
          type: 'single',
          stake: 10,
          selections: [{ event_id: 1 }], // missing market_type, selection_name, odds
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toMatch(/event_id.*market_type.*selection_name.*odds/i);
    });

    it('should return 400 when single bet has more than 1 selection', async () => {
      const res = await request(app)
        .post(API_BASE)
        .set('Authorization', `Bearer ${memberToken()}`)
        .send({
          type: 'single',
          stake: 10,
          selections: [
            { event_id: 1, market_type: '1x2', selection_name: 'Home', odds: 1.5 },
            { event_id: 2, market_type: '1x2', selection_name: 'Away', odds: 2.0 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toMatch(/single.*exactly 1/i);
    });

    it('should return 400 when accumulator has fewer than 2 selections', async () => {
      const res = await request(app)
        .post(API_BASE)
        .set('Authorization', `Bearer ${memberToken()}`)
        .send({
          type: 'accumulator',
          stake: 10,
          selections: [
            { event_id: 1, market_type: '1x2', selection_name: 'Home', odds: 1.5 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toMatch(/accumulator.*at least 2/i);
    });

    it('should return 400 for unsupported bet type', async () => {
      const res = await request(app)
        .post(API_BASE)
        .set('Authorization', `Bearer ${memberToken()}`)
        .send({
          type: 'fantasy',
          stake: 10,
          selections: [
            { event_id: 1, market_type: '1x2', selection_name: 'Home', odds: 1.5 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.message).toMatch(/unsupported bet type/i);
    });
  });

  describe('GET /api/bets/my-bets', () => {
    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app).get(`${API_BASE}/my-bets`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NO_TOKEN');
    });
  });

  describe('POST /api/bets/:betUid/cashout', () => {
    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app).post(`${API_BASE}/abc-123/cashout`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when authenticated as a non-member role', async () => {
      const res = await request(app)
        .post(`${API_BASE}/abc-123/cashout`)
        .set('Authorization', `Bearer ${agentToken()}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN');
    });
  });

  describe('Response shape', () => {
    it('should always include success, data, message, and error fields', async () => {
      const res = await request(app)
        .post(API_BASE)
        .set('Authorization', `Bearer ${memberToken()}`)
        .send({});

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('error');
    });
  });
});
