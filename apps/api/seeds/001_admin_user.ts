import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  const existingAdmin = await knex('users').where({ role: 'admin' }).first();
  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_SEED_PASSWORD environment variable is required to run seeds');
  }
  const passwordHash = await bcrypt.hash(password, 12);

  await knex.transaction(async (trx) => {
    const [admin] = await trx('users').insert({
      display_id: '1',
      username: 'admin',
      password_hash: passwordHash,
      role: 'admin',
      nickname: null,
      is_active: true,
      created_by: null,
      parent_agent_id: null,
      can_create_sub_agent: false,
      must_change_password: true,
    }).returning('*');

    await trx('credit_accounts').insert({
      user_id: admin.id,
      balance: 0,
      total_received: 0,
      total_sent: 0,
    });

    console.log(`Admin user created: username=admin, display_id=1, id=${admin.id}`);
  });
}
