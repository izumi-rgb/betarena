import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../../config/database';
import redis from '../../config/redis';
import { env } from '../../config/env';
import { JWT_EXPIRY, REFRESH_TOKEN_EXPIRY_SECONDS } from '../../config/constants';
import { writeSystemLog } from '../../utils/systemLog';
import logger from '../../config/logger';
import { JwtPayload } from '../../middleware/auth.middleware';

const BRUTE_FORCE_PREFIX = 'bf:';
const BRUTE_FORCE_MAX = 5;
const BRUTE_FORCE_WINDOW_SECONDS = 15 * 60;

async function checkBruteForce(ip: string): Promise<boolean> {
  const key = `${BRUTE_FORCE_PREFIX}${ip}`;
  const attempts = await redis.get(key);
  return attempts !== null && parseInt(attempts, 10) >= BRUTE_FORCE_MAX;
}

async function recordFailedAttempt(ip: string): Promise<number> {
  const key = `${BRUTE_FORCE_PREFIX}${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, BRUTE_FORCE_WINDOW_SECONDS);
  }
  return count;
}

async function clearFailedAttempts(ip: string): Promise<void> {
  await redis.del(`${BRUTE_FORCE_PREFIX}${ip}`);
}

export async function login(
  username: string,
  password: string,
  ip: string,
  userAgent: string
): Promise<{ accessToken: string; refreshToken: string; user: Omit<JwtPayload, 'iat' | 'exp'> }> {
  const isBlocked = await checkBruteForce(ip);
  if (isBlocked) {
    await writeSystemLog({
      user_id: null,
      role: null,
      action: 'auth.brute_force',
      ip_address: ip,
      user_agent: userAgent,
      payload: { username },
      result: 'blocked',
      threat_flag: true,
    });
    throw new Error('BRUTE_FORCE_BLOCKED');
  }

  const user = await db('users').where({ username, is_active: true }).first();

  if (!user) {
    const failCount = await recordFailedAttempt(ip);
    await writeSystemLog({
      user_id: null,
      role: null,
      action: 'auth.login',
      ip_address: ip,
      user_agent: userAgent,
      payload: { username, reason: 'invalid_username' },
      result: 'failure',
    });

    if (failCount >= BRUTE_FORCE_MAX) {
      await writeSystemLog({
        user_id: null,
        role: null,
        action: 'auth.brute_force',
        ip_address: ip,
        user_agent: userAgent,
        payload: { username, attempts: failCount },
        result: 'blocked',
        threat_flag: true,
      });
    }
    throw new Error('INVALID_CREDENTIALS');
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    const failCount = await recordFailedAttempt(ip);
    await writeSystemLog({
      user_id: user.id,
      role: user.role,
      action: 'auth.login',
      ip_address: ip,
      user_agent: userAgent,
      payload: { username, reason: 'invalid_password' },
      result: 'failure',
    });

    if (failCount >= BRUTE_FORCE_MAX) {
      await writeSystemLog({
        user_id: user.id,
        role: user.role,
        action: 'auth.brute_force',
        ip_address: ip,
        user_agent: userAgent,
        payload: { username, attempts: failCount },
        result: 'blocked',
        threat_flag: true,
      });
    }
    throw new Error('INVALID_CREDENTIALS');
  }

  await clearFailedAttempts(ip);

  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    display_id: user.display_id,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: JWT_EXPIRY });

  const refreshToken = uuidv4();
  await redis.setex(`refresh:${refreshToken}`, REFRESH_TOKEN_EXPIRY_SECONDS, JSON.stringify(payload));

  await writeSystemLog({
    user_id: user.id,
    role: user.role,
    action: 'auth.login',
    ip_address: ip,
    user_agent: userAgent,
    result: 'success',
  });

  logger.info('User logged in', { userId: user.id, username: user.username, role: user.role });

  return { accessToken, refreshToken, user: payload };
}

export async function logout(
  refreshToken: string,
  userId: number | undefined,
  role: string | undefined,
  ip: string,
  userAgent: string
): Promise<void> {
  if (refreshToken) {
    await redis.del(`refresh:${refreshToken}`);
  }

  await writeSystemLog({
    user_id: userId || null,
    role: role || null,
    action: 'auth.logout',
    ip_address: ip,
    user_agent: userAgent,
    result: 'success',
  });
}

export async function refreshAccessToken(
  refreshToken: string,
  ip: string,
  userAgent: string
): Promise<{ accessToken: string; newRefreshToken: string }> {
  const data = await redis.get(`refresh:${refreshToken}`);

  if (!data) {
    await writeSystemLog({
      user_id: null,
      role: null,
      action: 'auth.refresh',
      ip_address: ip,
      user_agent: userAgent,
      payload: { reason: 'invalid_refresh_token' },
      result: 'failure',
    });
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const payload: JwtPayload = JSON.parse(data);

  const user = await db('users').where({ id: payload.id, is_active: true }).first();
  if (!user) {
    await redis.del(`refresh:${refreshToken}`);
    throw new Error('USER_NOT_FOUND');
  }

  await redis.del(`refresh:${refreshToken}`);

  const updatedPayload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    display_id: user.display_id,
  };

  const accessToken = jwt.sign(updatedPayload, env.JWT_SECRET, { expiresIn: JWT_EXPIRY });

  const newRefreshToken = uuidv4();
  await redis.setex(`refresh:${newRefreshToken}`, REFRESH_TOKEN_EXPIRY_SECONDS, JSON.stringify(updatedPayload));

  await writeSystemLog({
    user_id: user.id,
    role: user.role,
    action: 'auth.refresh',
    ip_address: ip,
    user_agent: userAgent,
    result: 'success',
  });

  return { accessToken, newRefreshToken };
}

export async function getMe(userId: number) {
  const user = await db('users')
    .select('id', 'display_id', 'username', 'role', 'is_active', 'can_create_sub_agent', 'created_at')
    .where({ id: userId })
    .first();

  if (!user) throw new Error('USER_NOT_FOUND');

  const account = await db('credit_accounts').where({ user_id: userId }).first();

  const rawPrefs = await redis.get(`prefs:${userId}`);
  const preferences = rawPrefs
    ? JSON.parse(rawPrefs)
    : {
      oddsFormat: 'decimal',
      timezone: 'UTC',
      notifyBetSettled: true,
      notifyOddsMovement: true,
      notifyCreditReceived: true,
    };

  return {
    ...user,
    balance: account?.balance || '0.00',
    preferences,
  };
}

export async function updatePreferences(
  userId: number,
  preferences: Record<string, unknown>
) {
  const next = {
    oddsFormat: typeof preferences.oddsFormat === 'string' ? preferences.oddsFormat : 'decimal',
    timezone: typeof preferences.timezone === 'string' ? preferences.timezone : 'UTC',
    notifyBetSettled: Boolean(preferences.notifyBetSettled),
    notifyOddsMovement: Boolean(preferences.notifyOddsMovement),
    notifyCreditReceived: Boolean(preferences.notifyCreditReceived),
  };

  await redis.set(`prefs:${userId}`, JSON.stringify(next));
  return next;
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
) {
  const user = await db('users').where({ id: userId, is_active: true }).first();
  if (!user) throw new Error('USER_NOT_FOUND');

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) throw new Error('INVALID_CURRENT_PASSWORD');

  const nextHash = await bcrypt.hash(newPassword, 12);
  await db('users').where({ id: userId }).update({ password_hash: nextHash });

  return { updated: true };
}
