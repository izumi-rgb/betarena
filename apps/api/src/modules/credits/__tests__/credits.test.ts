import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';

/**
 * Credits module API tests.
 *
 * These tests validate the HTTP layer (auth checks, input validation,
 * response shapes) without requiring a live database or Redis instance.
 * Database and Redis are mocked via Jest moduleNameMapper.
 */

const API_BASE = '/api/credits';

// Helper: generate a valid JWT for an admin user
function adminToken(): string {
  return jwt.sign(
    { id: 1, username: 'admin', role: 'admin', display_id: 'ADM001' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

// Helper: generate a valid JWT for a member user (non-admin)
function memberToken(): string {
  return jwt.sign(
    { id: 10, username: 'member1', role: 'member', display_id: 'MEM010' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

// Helper: generate a valid JWT for an agent user
function agentToken(): string {
  return jwt.sign(
    { id: 5, username: 'agent1', role: 'agent', display_id: 'AGT005' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

describe('Credits Routes', () => {
  describe('POST /api/credits/admin/create (admin create credits)', () => {
    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app)
        .post(`${API_BASE}/admin/create`)
        .send({ amount: 1000 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NO_TOKEN');
    });

    it('should return 403 when authenticated as a non-admin role', async () => {
      const res = await request(app)
        .post(`${API_BASE}/admin/create`)
        .set('Authorization', `Bearer ${memberToken()}`)
        .send({ amount: 1000 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('should return 400 when amount is missing', async () => {
      const res = await request(app)
        .post(`${API_BASE}/admin/create`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ pin: process.env.ADMIN_MINT_PIN });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_AMOUNT');
      expect(res.body.message).toMatch(/valid amount required/i);
    });

    it('should return 400 when amount is zero', async () => {
      const res = await request(app)
        .post(`${API_BASE}/admin/create`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ amount: 0, pin: process.env.ADMIN_MINT_PIN });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_AMOUNT');
    });

    it('should return 400 when amount is negative', async () => {
      const res = await request(app)
        .post(`${API_BASE}/admin/create`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ amount: -500, pin: process.env.ADMIN_MINT_PIN });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_AMOUNT');
    });

    it('should return 400 when amount is a string', async () => {
      const res = await request(app)
        .post(`${API_BASE}/admin/create`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ amount: 'lots', pin: process.env.ADMIN_MINT_PIN });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_AMOUNT');
    });
  });

  describe('GET /api/credits/admin/overview (admin credits overview)', () => {
    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app).get(`${API_BASE}/admin/overview`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 when authenticated as a non-admin role', async () => {
      const res = await request(app)
        .get(`${API_BASE}/admin/overview`)
        .set('Authorization', `Bearer ${agentToken()}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/credits/transfer', () => {
    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app)
        .post(`${API_BASE}/transfer`)
        .send({ to_user_id: 2, amount: 100 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NO_TOKEN');
    });

    it('should return 400 when to_user_id is missing', async () => {
      const res = await request(app)
        .post(`${API_BASE}/transfer`)
        .set('Authorization', `Bearer ${agentToken()}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_INPUT');
    });

    it('should return 400 when amount is missing', async () => {
      const res = await request(app)
        .post(`${API_BASE}/transfer`)
        .set('Authorization', `Bearer ${agentToken()}`)
        .send({ to_user_id: 2 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_INPUT');
    });

    it('should return 400 when amount is zero or negative', async () => {
      const res = await request(app)
        .post(`${API_BASE}/transfer`)
        .set('Authorization', `Bearer ${agentToken()}`)
        .send({ to_user_id: 2, amount: 0 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_INPUT');
    });
  });

  describe('GET /api/credits/balance', () => {
    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app).get(`${API_BASE}/balance`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/credits/transactions', () => {
    it('should return 401 when no auth token is provided', async () => {
      const res = await request(app).get(`${API_BASE}/transactions`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Response shape', () => {
    it('should always include success, data, message, and error fields', async () => {
      const res = await request(app)
        .post(`${API_BASE}/admin/create`)
        .send({});

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('error');
    });
  });
});
