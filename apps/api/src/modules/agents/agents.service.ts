import bcrypt from 'bcryptjs';
import db from '../../config/database';
import { writeSystemLog } from '../../utils/systemLog';
import { generatePassword, generateRandomId } from '../../utils/generateCredentials';

export async function createMember(
  agentId: number,
  agentRole: string,
  agentDisplayId: string,
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
      displayId = `M-${randomId}`;
      const username = `mb_${randomId}`;

      result = await db.transaction(async (trx) => {
        const [member] = await trx('users').insert({
          display_id: displayId,
          username,
          password_hash: passwordHash,
          role: 'member',
          nickname: nickname || null,
          is_active: true,
          created_by: agentId,
          parent_agent_id: agentId,
          can_create_sub_agent: false,
        }).returning('*');

        await trx('credit_accounts').insert({
          user_id: member.id,
          balance: 0,
          total_received: 0,
          total_sent: 0,
        });

        return member;
      });

      break; // success
    } catch (err: any) {
      const isUniqueViolation =
        err.code === '23505' ||
        (err.message && err.message.includes('duplicate key'));
      if (!isUniqueViolation || attempt === maxRetries - 1) throw err;
    }
  }

  await writeSystemLog({
    user_id: agentId,
    role: agentRole,
    action: 'user.create',
    ip_address: ip,
    user_agent: userAgent,
    payload: { created_user_id: result.id, role: 'member', display_id: displayId },
    result: 'success',
  });

  return {
    id: result.id,
    display_id: displayId,
    username: result.username,
    password,
    nickname: nickname || null,
    role: 'member',
  };
}

export async function listMembers(agentId: number) {
  return db('users')
    .select(
      'users.id',
      'users.display_id',
      'users.username',
      'users.nickname',
      'users.is_active',
      'users.created_at',
      'credit_accounts.balance'
    )
    .leftJoin('credit_accounts', 'users.id', 'credit_accounts.user_id')
    .where({ 'users.parent_agent_id': agentId, 'users.role': 'member' })
    .whereNull('users.deleted_at')
    .orderBy('users.created_at', 'desc');
}

export async function getMemberDetail(agentId: number, memberId: number) {
  const member = await db('users')
    .select(
      'users.id',
      'users.display_id',
      'users.username',
      'users.nickname',
      'users.is_active',
      'users.created_at',
      'credit_accounts.balance',
      'credit_accounts.total_received',
      'credit_accounts.total_sent'
    )
    .leftJoin('credit_accounts', 'users.id', 'credit_accounts.user_id')
    .where({ 'users.id': memberId, 'users.parent_agent_id': agentId, 'users.role': 'member' })
    .whereNull('users.deleted_at')
    .first();

  if (!member) throw new Error('MEMBER_NOT_FOUND');

  const openBets = await db('bets')
    .where({ user_id: memberId, status: 'open' })
    .count('id as count')
    .first();

  const totalBets = await db('bets')
    .where({ user_id: memberId })
    .sum('stake as total_stake')
    .sum('actual_win as total_win')
    .first();

  const pnl = Number(totalBets?.total_win || 0) - Number(totalBets?.total_stake || 0);

  return {
    ...member,
    open_bets: Number(openBets?.count || 0),
    total_stake: totalBets?.total_stake || '0.00',
    total_win: totalBets?.total_win || '0.00',
    pnl: pnl.toFixed(2),
  };
}

export async function createSubAgent(
  agentId: number,
  agentRole: string,
  agentDisplayId: string,
  canCreateSubAgent: boolean,
  ip: string,
  userAgent: string
) {
  if (!canCreateSubAgent) {
    throw new Error('NO_SUB_AGENT_PRIVILEGE');
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const maxRetries = 5;
  let result: any;
  let displayId = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const randomId = generateRandomId(6);
      displayId = `S-${randomId}`;
      const username = `sa_${randomId}`;

      result = await db.transaction(async (trx) => {
        const [subAgent] = await trx('users').insert({
          display_id: displayId,
          username,
          password_hash: passwordHash,
          role: 'sub_agent',
          is_active: true,
          created_by: agentId,
          parent_agent_id: agentId,
          can_create_sub_agent: false,
        }).returning('*');

        await trx('credit_accounts').insert({
          user_id: subAgent.id,
          balance: 0,
          total_received: 0,
          total_sent: 0,
        });

        return subAgent;
      });

      break; // success
    } catch (err: any) {
      const isUniqueViolation =
        err.code === '23505' ||
        (err.message && err.message.includes('duplicate key'));
      if (!isUniqueViolation || attempt === maxRetries - 1) throw err;
    }
  }

  await writeSystemLog({
    user_id: agentId,
    role: agentRole,
    action: 'user.create',
    ip_address: ip,
    user_agent: userAgent,
    payload: { created_user_id: result.id, role: 'sub_agent', display_id: displayId },
    result: 'success',
  });

  return {
    id: result.id,
    display_id: displayId,
    username: result.username,
    password,
    role: 'sub_agent',
  };
}

export async function deleteMember(
  memberId: number,
  agentId: number,
  agentRole: string,
  ip: string,
  userAgent: string
) {
  const member = await db('users')
    .where({
      id: memberId,
      parent_agent_id: agentId,
      role: 'member',
    })
    .whereNull('deleted_at')
    .first();

  if (!member) throw new Error('MEMBER_NOT_FOUND');

  const openBets = await db('bets')
    .where({ user_id: memberId, status: 'open' })
    .count('id as count')
    .first();

  if (Number(openBets?.count) > 0) {
    throw new Error('CANNOT_DELETE_WITH_OPEN_BETS');
  }

  await db('users')
    .where({ id: memberId })
    .update({ deleted_at: new Date(), is_active: false });

  await writeSystemLog({
    user_id: agentId,
    role: agentRole,
    action: 'user.delete',
    ip_address: ip,
    user_agent: userAgent,
    payload: {
      deleted_member_id: memberId,
      deleted_member_display_id: member.display_id,
    },
    result: 'success',
  });

  return { id: memberId, deleted: true };
}

export async function listSubAgents(agentId: number) {
  return db('users')
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
    .where({ 'users.parent_agent_id': agentId, 'users.role': 'sub_agent' })
    .whereNull('users.deleted_at')
    .orderBy('users.created_at', 'desc');
}

export async function updateSubAgentPrivilege(
  agentId: number,
  subAgentId: number,
  canCreate: boolean,
  agentRole: string,
  ip: string,
  userAgent: string
) {
  const subAgent = await db('users')
    .where({ id: subAgentId, parent_agent_id: agentId, role: 'sub_agent' })
    .first();

  if (!subAgent) throw new Error('SUB_AGENT_NOT_FOUND');

  const agent = await db('users').where({ id: agentId }).first();
  if (!agent?.can_create_sub_agent) {
    throw new Error('NO_SUB_AGENT_PRIVILEGE');
  }

  await db('users').where({ id: subAgentId }).update({ can_create_sub_agent: canCreate });

  await writeSystemLog({
    user_id: agentId,
    role: agentRole,
    action: canCreate ? 'privilege.grant' : 'privilege.revoke',
    ip_address: ip,
    user_agent: userAgent,
    payload: { target_user_id: subAgentId, privilege: 'can_create_sub_agent', value: canCreate },
    result: 'success',
  });

  return { id: subAgentId, can_create_sub_agent: canCreate };
}

export async function resetChildPassword(
  agentId: number,
  agentRole: string,
  targetId: number,
  ip: string,
  userAgent: string
) {
  const target = await db('users').where({ id: targetId }).first();
  if (!target) throw new Error('USER_NOT_FOUND');

  // Agents can only reset passwords for their own members and sub-agents
  if (target.parent_agent_id !== agentId) {
    throw new Error('NOT_AUTHORIZED');
  }

  const newPassword = generatePassword();
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db('users').where({ id: targetId }).update({ password_hash: passwordHash });

  await writeSystemLog({
    user_id: agentId,
    role: agentRole,
    action: 'user.reset_password',
    ip_address: ip,
    user_agent: userAgent,
    payload: { target_user_id: targetId, target_role: target.role, target_display_id: target.display_id },
    result: 'success',
  });

  return { username: target.username, password: newPassword };
}
