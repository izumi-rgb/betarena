import db from '../../config/database';
import { writeSystemLog } from '../../utils/systemLog';

export async function adminCreateCredits(
  adminId: number,
  amount: number,
  ip: string,
  userAgent: string
) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');

  await db.transaction(async (trx) => {
    await trx('credit_accounts')
      .where({ user_id: adminId })
      .increment('balance', amount)
      .increment('total_received', amount);

    await trx('credit_transactions').insert({
      from_user_id: null,
      to_user_id: adminId,
      amount,
      type: 'create',
      note: `Admin created ${amount} credits`,
    });
  });

  await writeSystemLog({
    user_id: adminId,
    role: 'admin',
    action: 'credit.create',
    ip_address: ip,
    user_agent: userAgent,
    payload: { amount },
    result: 'success',
  });

  const account = await db('credit_accounts').where({ user_id: adminId }).first();
  return { balance: account.balance, created: amount };
}

export async function transferCredits(
  senderId: number,
  senderRole: string,
  receiverId: number,
  amount: number,
  ip: string,
  userAgent: string
) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');

  const receiver = await db('users').where({ id: receiverId, is_active: true }).first();
  if (!receiver) throw new Error('RECEIVER_NOT_FOUND');

  // Enforce: sender can only send to direct children
  if (receiver.parent_agent_id !== senderId && receiver.created_by !== senderId) {
    // Allow admin to send to agents they created
    if (senderRole !== 'admin' || receiver.role !== 'agent') {
      throw new Error('NOT_DIRECT_SUBORDINATE');
    }
  }

  await db.transaction(async (trx) => {
    const senderAccount = await trx('credit_accounts')
      .where({ user_id: senderId })
      .forUpdate()
      .first();

    if (!senderAccount || Number(senderAccount.balance) < amount) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    await trx('credit_accounts')
      .where({ user_id: senderId })
      .decrement('balance', amount)
      .increment('total_sent', amount);

    await trx('credit_accounts')
      .where({ user_id: receiverId })
      .increment('balance', amount)
      .increment('total_received', amount);

    await trx('credit_transactions').insert({
      from_user_id: senderId,
      to_user_id: receiverId,
      amount,
      type: 'transfer',
      note: `Transfer from ${senderId} to ${receiverId}`,
    });
  });

  await writeSystemLog({
    user_id: senderId,
    role: senderRole,
    action: 'credit.transfer',
    ip_address: ip,
    user_agent: userAgent,
    payload: { to_user_id: receiverId, amount },
    result: 'success',
  });

  return { amount, to_user_id: receiverId };
}

export async function getBalance(userId: number) {
  const account = await db('credit_accounts').where({ user_id: userId }).first();
  if (!account) throw new Error('ACCOUNT_NOT_FOUND');
  return { balance: account.balance };
}

export async function getTransactions(userId: number, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit;
  const transactions = await db('credit_transactions')
    .where(function () {
      this.where({ from_user_id: userId }).orWhere({ to_user_id: userId });
    })
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const total = await db('credit_transactions')
    .where(function () {
      this.where({ from_user_id: userId }).orWhere({ to_user_id: userId });
    })
    .count('id as count')
    .first();

  return {
    transactions,
    total: Number(total?.count || 0),
    page,
    limit,
  };
}

export async function adminCreditsOverview() {
  const totalCreated = await db('credit_transactions')
    .where({ type: 'create' })
    .sum('amount as total')
    .first();

  const allAccounts = await db('credit_accounts').sum('balance as total').first();

  const agentBalances = await db('credit_accounts')
    .select('users.id', 'users.display_id', 'users.username', 'credit_accounts.balance')
    .join('users', 'credit_accounts.user_id', 'users.id')
    .whereIn('users.role', ['agent', 'sub_agent'])
    .orderBy('credit_accounts.balance', 'desc');

  return {
    total_created: totalCreated?.total || '0.00',
    total_in_circulation: allAccounts?.total || '0.00',
    agent_balances: agentBalances,
  };
}
