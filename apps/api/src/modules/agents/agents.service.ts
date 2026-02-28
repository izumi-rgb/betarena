import bcrypt from 'bcrypt';
import db from '../../config/database';
import { writeSystemLog } from '../../utils/systemLog';
import { generatePassword } from '../../utils/generateCredentials';

export async function createMember(
  agentId: number,
  agentRole: string,
  agentDisplayId: string,
  nickname: string | null,
  ip: string,
  userAgent: string
) {
  const memberCount = await db('users')
    .where({ parent_agent_id: agentId, role: 'member' })
    .count('id as count')
    .first();

  const sequence = Number(memberCount?.count || 0) + 1;
  const displayId = `${agentDisplayId}_M${sequence}`;
  const username = `member_${displayId.toLowerCase()}`;
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await db.transaction(async (trx) => {
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
    username,
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

  const subAgentCount = await db('users')
    .where({ parent_agent_id: agentId, role: 'sub_agent' })
    .count('id as count')
    .first();

  const sequence = Number(subAgentCount?.count || 0) + 1;
  const displayId = `${agentDisplayId}_SA${sequence}`;
  const username = `subagent_${displayId.toLowerCase()}`;
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await db.transaction(async (trx) => {
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
    username,
    password,
    role: 'sub_agent',
  };
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
