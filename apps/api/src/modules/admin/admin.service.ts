import bcrypt from 'bcryptjs';
import db from '../../config/database';
import { writeSystemLog } from '../../utils/systemLog';
import { generatePassword, generateRandomId } from '../../utils/generateCredentials';
import { revokeUserSessions } from '../auth/auth.service';

export async function createAgent(
  adminId: number,
  nickname: string | null,
  ip: string,
  userAgent: string
) {
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const maxRetries = 5;
  let result: any;
  let displayId = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const randomId = generateRandomId(6);
      displayId = `B-${randomId}`;
      const username = `ba_${randomId}`;

      result = await db.transaction(async (trx) => {
        const [agent] = await trx('users').insert({
          display_id: displayId,
          username,
          password_hash: passwordHash,
          role: 'agent',
          nickname: nickname || null,
          is_active: true,
          created_by: adminId,
          parent_agent_id: null,
          can_create_sub_agent: false,
        }).returning('*');

        await trx('credit_accounts').insert({
          user_id: agent.id,
          balance: 0,
          total_received: 0,
          total_sent: 0,
        });

        return agent;
      });

      break; // success
    } catch (err: any) {
      const isUniqueViolation =
        err.code === '23505' ||
        (err.message && err.message.includes('duplicate key'));
      if (!isUniqueViolation || attempt === maxRetries - 1) throw err;
      // retry with a new random ID
    }
  }

  await writeSystemLog({
    user_id: adminId,
    role: 'admin',
    action: 'user.create',
    ip_address: ip,
    user_agent: userAgent,
    payload: { created_user_id: result.id, role: 'agent', display_id: displayId },
    result: 'success',
  });

  return {
    id: result.id,
    display_id: displayId,
    username: result.username,
    password,
    role: 'agent',
  };
}

export async function listAgents() {
  const agents = await db('users')
    .select(
      'users.id',
      'users.display_id',
      'users.username',
      'users.is_active',
      'users.can_create_sub_agent',
      'users.created_at',
      'credit_accounts.balance'
    )
    .leftJoin('credit_accounts', 'users.id', 'credit_accounts.user_id')
    .where('users.role', 'agent')
    .whereNull('users.deleted_at');

  if (agents.length === 0) return [];

  const agentIds = agents.map((a) => a.id);

  // Single batch query to get member + sub_agent counts per agent
  const countsRows = await db('users')
    .select('parent_agent_id', 'role')
    .count('id as count')
    .whereIn('parent_agent_id', agentIds)
    .whereIn('role', ['member', 'sub_agent'])
    .whereNull('deleted_at')
    .groupBy('parent_agent_id', 'role');

  // Build a lookup map: { agentId: { member: N, sub_agent: N } }
  const countsMap: Record<number, { member: number; sub_agent: number }> = {};
  for (const row of countsRows) {
    const pid = Number(row.parent_agent_id);
    if (!countsMap[pid]) countsMap[pid] = { member: 0, sub_agent: 0 };
    if (row.role === 'member') countsMap[pid].member = Number(row.count);
    if (row.role === 'sub_agent') countsMap[pid].sub_agent = Number(row.count);
  }

  return agents.map((agent) => ({
    ...agent,
    member_count: countsMap[agent.id]?.member || 0,
    sub_agent_count: countsMap[agent.id]?.sub_agent || 0,
  }));
}

export async function getAgentById(agentId: number) {
  const agent = await db('users')
    .select(
      'users.id',
      'users.display_id',
      'users.username',
      'users.role',
      'users.is_active',
      'users.can_create_sub_agent',
      'users.created_at',
      'credit_accounts.balance',
      'credit_accounts.total_received',
      'credit_accounts.total_sent'
    )
    .leftJoin('credit_accounts', 'users.id', 'credit_accounts.user_id')
    .where('users.id', agentId)
    .whereIn('users.role', ['agent', 'sub_agent'])
    .whereNull('users.deleted_at')
    .first();

  if (!agent) throw new Error('AGENT_NOT_FOUND');
  return agent;
}

export async function updateAgentStatus(
  agentId: number,
  isActive: boolean,
  adminId: number,
  ip: string,
  userAgent: string
) {
  const agent = await db('users').where({ id: agentId }).whereIn('role', ['agent', 'sub_agent']).whereNull('deleted_at').first();
  if (!agent) throw new Error('AGENT_NOT_FOUND');

  await db('users').where({ id: agentId }).update({ is_active: isActive });

  await writeSystemLog({
    user_id: adminId,
    role: 'admin',
    action: isActive ? 'user.activate' : 'user.suspend',
    ip_address: ip,
    user_agent: userAgent,
    payload: { target_user_id: agentId, display_id: agent.display_id },
    result: 'success',
  });

  return { id: agentId, is_active: isActive };
}

export async function updateAgentPrivilege(
  agentId: number,
  canCreateSubAgent: boolean,
  adminId: number,
  ip: string,
  userAgent: string
) {
  const agent = await db('users').where({ id: agentId }).whereIn('role', ['agent', 'sub_agent']).whereNull('deleted_at').first();
  if (!agent) throw new Error('AGENT_NOT_FOUND');

  await db('users').where({ id: agentId }).update({ can_create_sub_agent: canCreateSubAgent });

  await writeSystemLog({
    user_id: adminId,
    role: 'admin',
    action: canCreateSubAgent ? 'privilege.grant' : 'privilege.revoke',
    ip_address: ip,
    user_agent: userAgent,
    payload: { target_user_id: agentId, privilege: 'can_create_sub_agent', value: canCreateSubAgent },
    result: 'success',
  });

  return { id: agentId, can_create_sub_agent: canCreateSubAgent };
}

export async function deleteAgent(
  agentId: number,
  adminId: number,
  ip: string,
  userAgent: string
) {
  const agent = await db('users')
    .where({ id: agentId })
    .whereNull('deleted_at')
    .whereIn('role', ['agent', 'sub_agent'])
    .first();

  if (!agent) throw new Error('AGENT_NOT_FOUND_OR_DELETED');

  const creditAccount = await db('credit_accounts')
    .where({ user_id: agentId })
    .first();

  if (creditAccount && Number(creditAccount.balance) > 0) {
    throw new Error('CANNOT_DELETE_WITH_CREDITS');
  }

  const now = new Date();

  await db('users')
    .where({ id: agentId })
    .update({ deleted_at: now, is_active: false });

  await db('users')
    .where({ parent_agent_id: agentId })
    .whereNull('deleted_at')
    .update({ deleted_at: now, is_active: false });

  await writeSystemLog({
    user_id: adminId,
    role: 'admin',
    action: 'user.delete',
    ip_address: ip,
    user_agent: userAgent,
    payload: {
      deleted_agent_id: agentId,
      deleted_agent_display_id: agent.display_id,
    },
    result: 'success',
  });

  return { id: agentId, deleted: true };
}

export async function resetUserPassword(
  userId: number,
  adminId: number,
  ip: string,
  userAgent: string
) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) throw new Error('USER_NOT_FOUND');
  if (user.role === 'admin') throw new Error('CANNOT_RESET_ADMIN');

  const newPassword = generatePassword();
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db('users').where({ id: userId }).update({ password_hash: passwordHash });
  await revokeUserSessions(userId);

  await writeSystemLog({
    user_id: adminId,
    role: 'admin',
    action: 'user.reset_password',
    ip_address: ip,
    user_agent: userAgent,
    payload: { target_user_id: userId, target_role: user.role, target_display_id: user.display_id },
    result: 'success',
  });

  return { username: user.username, password: newPassword };
}
