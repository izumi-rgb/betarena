import bcrypt from 'bcryptjs';
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
const REFRESH_TOKEN_PREFIX = 'refresh:';
const USER_REFRESH_SESSIONS_PREFIX = 'user_refresh_sessions:';
const BRUTE_FORCE_MAX = 5;
const BRUTE_FORCE_WINDOW_SECONDS = 15 * 60;

function refreshTokenKey(refreshToken: string): string {
  return `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
}

function refreshSessionSetKey(userId: number): string {
  return `${USER_REFRESH_SESSIONS_PREFIX}${userId}`;
}

async function registerRefreshSession(userId: number, refreshToken: string, payload: JwtPayload): Promise<void> {
  const key = refreshTokenKey(refreshToken);
  const sessionSetKey = refreshSessionSetKey(userId);

  await Promise.all([
    redis.setex(key, REFRESH_TOKEN_EXPIRY_SECONDS, JSON.stringify(payload)),
    redis.sadd(sessionSetKey, refreshToken),
    redis.expire(sessionSetKey, REFRESH_TOKEN_EXPIRY_SECONDS),
  ]);
}

async function revokeRefreshSession(refreshToken: string, userId?: number): Promise<void> {
  await redis.del(refreshTokenKey(refreshToken));
  if (userId) {
    await redis.srem(refreshSessionSetKey(userId), refreshToken);
  }
}

async function revokeUserSessions(userId: number): Promise<void> {
  const sessionSetKey = refreshSessionSetKey(userId);
  const refreshTokens = await redis.smembers(sessionSetKey);

  if (refreshTokens.length > 0) {
    const pipeline = redis.pipeline();
    for (const token of refreshTokens) {
      pipeline.del(refreshTokenKey(token));
      pipeline.srem(sessionSetKey, token);
    }
    pipeline.del(sessionSetKey);
    await pipeline.exec();
    return;
  }

  await redis.del(sessionSetKey);
}

async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== '0');

  return keys;
}

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
): Promise<{ accessToken: string; refreshToken: string; user: Omit<JwtPayload, 'iat' | 'exp'> & { must_change_password?: boolean } }> {
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
  await registerRefreshSession(user.id, refreshToken, payload);

  await writeSystemLog({
    user_id: user.id,
    role: user.role,
    action: 'auth.login',
    ip_address: ip,
    user_agent: userAgent,
    result: 'success',
  });

  logger.info('User logged in', { userId: user.id, username: user.username, role: user.role });

  const mustChangePassword = Boolean(user.must_change_password);
  return {
    accessToken,
    refreshToken,
    user: { ...payload, must_change_password: mustChangePassword },
  };
}

export async function logout(
  refreshToken: string,
  userId: number | undefined,
  role: string | undefined,
  ip: string,
  userAgent: string
): Promise<void> {
  if (refreshToken) {
    await revokeRefreshSession(refreshToken, userId);
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
  const data = await redis.get(refreshTokenKey(refreshToken));

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
    await revokeRefreshSession(refreshToken, payload.id);
    throw new Error('USER_NOT_FOUND');
  }

  await revokeRefreshSession(refreshToken, payload.id);

  const updatedPayload: JwtPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    display_id: user.display_id,
  };

  const accessToken = jwt.sign(updatedPayload, env.JWT_SECRET, { expiresIn: JWT_EXPIRY });

  const newRefreshToken = uuidv4();
  await registerRefreshSession(user.id, newRefreshToken, updatedPayload);

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
    .select('id', 'display_id', 'username', 'role', 'is_active', 'can_create_sub_agent', 'parent_agent_id', 'created_at', 'must_change_password')
    .where({ id: userId })
    .first();

  if (!user) throw new Error('USER_NOT_FOUND');

  const account = await db('credit_accounts').where({ user_id: userId }).first();

  let agentName: string | null = null;
  if (user.parent_agent_id) {
    const agent = await db('users').select('username').where({ id: user.parent_agent_id }).first();
    agentName = agent?.username || null;
  }

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
    agentName,
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

export async function listSessions(): Promise<Array<{ id: string; userId: number; username: string; role: string }>> {
  const keys = await scanKeys(`${REFRESH_TOKEN_PREFIX}*`);
  const sessions: Array<{ id: string; userId: number; username: string; role: string }> = [];

  for (const key of keys) {
    const data = await redis.get(key);
    if (!data) continue;
    try {
      const payload = JSON.parse(data);
      const sessionId = key.replace(REFRESH_TOKEN_PREFIX, '');
      sessions.push({
        id: sessionId,
        userId: payload.id,
        username: payload.username,
        role: payload.role,
      });
    } catch {
      // skip malformed entries
    }
  }

  return sessions;
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const key = refreshTokenKey(sessionId);
  const payloadRaw = await redis.get(key);
  let userId: number | undefined;
  if (payloadRaw) {
    try {
      userId = JSON.parse(payloadRaw).id;
    } catch {
      userId = undefined;
    }
  }
  await revokeRefreshSession(sessionId, userId);
  const deleted = payloadRaw ? 1 : 0;
  return deleted > 0;
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
  await db('users')
    .where({ id: userId })
    .update({ password_hash: nextHash, must_change_password: false });
  await revokeUserSessions(userId);

  await writeSystemLog({
    user_id: userId, role: user.role, action: 'auth.change_password',
    ip_address: 'server', user_agent: 'server',
    payload: {}, result: 'success',
  });

  return { updated: true };
}

export { revokeUserSessions };
