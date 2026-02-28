import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';

/**
 * Auth module API tests.
 *
 * These tests validate the HTTP layer (status codes, response shapes,
 * input validation) without requiring a live database or Redis instance.
 * Database and Redis are mocked via Jest moduleNameMapper.
 */

const API_BASE = '/api/auth';

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should return 400 when username and password are missing', async () => {
      const res = await request(app)
        .post(`${API_BASE}/login`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('MISSING_FIELDS');
      expect(res.body.message).toMatch(/username.*password.*required/i);
    });

    it('should return 400 when only username is provided', async () => {
      const res = await request(app)
        .post(`${API_BASE}/login`)
        .send({ username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('MISSING_FIELDS');
    });

    it('should return 400 when only password is provided', async () => {
      const res = await request(app)
        .post(`${API_BASE}/login`)
        .send({ password: 'testpass' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('MISSING_FIELDS');
    });

    it('should return 400 when body is empty JSON', async () => {
      const res = await request(app)
        .post(`${API_BASE}/login`)
        .set('Content-Type', 'application/json')
        .send('{}');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get(`${API_BASE}/me`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NO_TOKEN');
      expect(res.body.message).toMatch(/authentication required/i);
    });

    it('should return 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get(`${API_BASE}/me`)
        .set('Authorization', 'Bearer invalid-token-value');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_TOKEN');
    });

    it('should return 401 when token is signed with wrong secret', async () => {
      const badToken = jwt.sign(
        { id: 1, username: 'admin', role: 'admin', display_id: 'ADM001' },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get(`${API_BASE}/me`)
        .set('Authorization', `Bearer ${badToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).post(`${API_BASE}/logout`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NO_TOKEN');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 401 when no refresh token cookie is present', async () => {
      const res = await request(app).post(`${API_BASE}/refresh`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NO_REFRESH_TOKEN');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .post(`${API_BASE}/change-password`)
        .send({
          currentPassword: 'old',
          newPassword: 'newpass',
          confirmPassword: 'newpass',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Response shape', () => {
    it('should always return success, data, message, and error fields', async () => {
      const res = await request(app)
        .post(`${API_BASE}/login`)
        .send({});

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('error');
    });
  });
});
