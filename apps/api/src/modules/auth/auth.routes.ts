import { Router, Request, Response } from 'express';
import {
  login,
  logout,
  refreshAccessToken,
  getMe,
  updatePreferences,
  changePassword,
  listSessions,
  revokeSession,
  updateProfile,
  revokeOwnedSession,
  revokeOtherUserSessions,
} from './auth.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { loginRateLimiter } from '../../middleware/rateLimiter.middleware';
import { REFRESH_TOKEN_EXPIRY_SECONDS } from '../../config/constants';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax' as const,
  path: '/',
};

router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password, remember_me } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Username and password are required',
        error: 'MISSING_FIELDS',
      });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    const result = await login(username, password, ip, userAgent, !!remember_me);

    // Remember me: 30-day session; otherwise: 2-hour access + 7-day refresh
    const accessMaxAge = remember_me ? 30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
    const refreshMaxAge = remember_me ? 30 * 24 * 60 * 60 * 1000 : REFRESH_TOKEN_EXPIRY_SECONDS * 1000;

    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: accessMaxAge,
    });

    res.cookie('refresh_token', result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
      message: 'Login successful',
      error: null,
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'BRUTE_FORCE_BLOCKED') {
      res.status(429).json({
        success: false,
        data: null,
        message: 'Too many failed attempts. Please try again later.',
        error: 'BRUTE_FORCE_BLOCKED',
      });
      return;
    }
    if (message === 'INVALID_CREDENTIALS') {
      res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid username or password',
        error: 'INVALID_CREDENTIALS',
      });
      return;
    }
    res.status(500).json({
      success: false,
      data: null,
      message: 'Login failed',
      error: 'INTERNAL_ERROR',
    });
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token || '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    await logout(refreshToken, req.user?.id, req.user?.role, ip, userAgent);

    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);

    res.json({
      success: true,
      data: null,
      message: 'Logged out successfully',
      error: null,
    });
  } catch {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Logout failed',
      error: 'INTERNAL_ERROR',
    });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'No refresh token provided',
        error: 'NO_REFRESH_TOKEN',
      });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    const result = await refreshAccessToken(refreshToken, ip, userAgent);

    const accessMaxAge = result.isRememberMe ? 30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
    const refreshMaxAge = result.isRememberMe ? 30 * 24 * 60 * 60 * 1000 : REFRESH_TOKEN_EXPIRY_SECONDS * 1000;

    res.cookie('access_token', result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: accessMaxAge,
    });

    res.cookie('refresh_token', result.newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge,
    });

    res.json({
      success: true,
      data: { accessToken: result.accessToken },
      message: 'Token refreshed',
      error: null,
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'INVALID_REFRESH_TOKEN' || message === 'USER_NOT_FOUND') {
      res.clearCookie('access_token', COOKIE_OPTIONS);
      res.clearCookie('refresh_token', COOKIE_OPTIONS);
      res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid refresh token',
        error: 'INVALID_REFRESH_TOKEN',
      });
      return;
    }
    res.status(500).json({
      success: false,
      data: null,
      message: 'Token refresh failed',
      error: 'INTERNAL_ERROR',
    });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getMe(req.user!.id);
    res.json({
      success: true,
      data: user,
      message: 'User info retrieved',
      error: null,
    });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'USER_NOT_FOUND') {
      res.status(404).json({
        success: false,
        data: null,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
      });
    } else {
      res.status(500).json({
        success: false,
        data: null,
        message: 'Internal error',
        error: 'INTERNAL_ERROR',
      });
    }
  }
});

router.patch('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const preferences = await updatePreferences(req.user!.id, req.body || {});
    res.json({
      success: true,
      data: preferences,
      message: 'Preferences updated',
      error: null,
    });
  } catch {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update preferences',
      error: 'INTERNAL_ERROR',
    });
  }
});

router.patch('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const profile = await updateProfile(req.user!.id, req.body || {});
    res.json({
      success: true,
      data: profile,
      message: 'Profile updated',
      error: null,
    });
  } catch (err) {
    if ((err as Error).message === 'INVALID_PROFILE_PAYLOAD') {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid profile payload',
        error: 'INVALID_PROFILE_PAYLOAD',
      });
      return;
    }

    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to update profile',
      error: 'INTERNAL_ERROR',
    });
  }
});

router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid password payload',
        error: 'INVALID_PASSWORD_PAYLOAD',
      });
      return;
    }

    const result = await changePassword(req.user!.id, currentPassword, newPassword);
    res.json({
      success: true,
      data: result,
      message: 'Password changed',
      error: null,
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'INVALID_CURRENT_PASSWORD') {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Current password is incorrect',
        error: 'INVALID_CURRENT_PASSWORD',
      });
      return;
    }
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to change password',
      error: 'INTERNAL_ERROR',
    });
  }
});

router.get('/my-sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const currentRefreshToken = req.cookies?.refresh_token;
    const sessions = await listSessions(currentRefreshToken, req.user!.id);
    res.json({ success: true, data: sessions, message: 'Sessions retrieved', error: null });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to list sessions', error: 'INTERNAL_ERROR' });
  }
});

router.delete('/my-sessions/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await revokeOwnedSession(req.user!.id, sessionId);
    if (!deleted) {
      res.status(404).json({ success: false, data: null, message: 'Session not found', error: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: null, message: 'Session revoked', error: null });
  } catch (err) {
    if ((err as Error).message === 'NOT_AUTHORIZED') {
      res.status(403).json({ success: false, data: null, message: 'Forbidden', error: 'FORBIDDEN' });
      return;
    }
    res.status(500).json({ success: false, data: null, message: 'Failed to revoke session', error: 'INTERNAL_ERROR' });
  }
});

router.post('/my-sessions/revoke-others', authMiddleware, async (req: Request, res: Response) => {
  const currentRefreshToken = req.cookies?.refresh_token;
  if (!currentRefreshToken) {
    res.status(400).json({
      success: false,
      data: null,
      message: 'Current refresh session required',
      error: 'NO_REFRESH_TOKEN',
    });
    return;
  }

  try {
    const revokedCount = await revokeOtherUserSessions(req.user!.id, currentRefreshToken);
    res.json({
      success: true,
      data: { revokedCount },
      message: 'Other sessions revoked',
      error: null,
    });
  } catch {
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to revoke other sessions',
      error: 'INTERNAL_ERROR',
    });
  }
});

// Admin-only: list all active sessions
router.get('/sessions', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const sessions = await listSessions(req.cookies?.refresh_token);
    res.json({ success: true, data: sessions, message: 'Sessions retrieved', error: null });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to list sessions', error: 'INTERNAL_ERROR' });
  }
});

// Admin-only: revoke a session
router.delete('/sessions/:id', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await revokeSession(sessionId);
    if (!deleted) {
      res.status(404).json({ success: false, data: null, message: 'Session not found', error: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: null, message: 'Session revoked', error: null });
  } catch {
    res.status(500).json({ success: false, data: null, message: 'Failed to revoke session', error: 'INTERNAL_ERROR' });
  }
});

export default router;
