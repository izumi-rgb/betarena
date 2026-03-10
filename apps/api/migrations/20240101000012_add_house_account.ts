import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Insert system/house user (id = 0) if it doesn't exist
  const userExists = await knex('users').where({ id: 0 }).first();
  if (!userExists) {
    await knex.raw(
      `INSERT INTO users (id, username, password_hash, role, display_id, status)
       VALUES (0, '__house__', '__no_login__', 'admin', 'HOUSE', 'active')
       ON CONFLICT (id) DO NOTHING`
    );
  }

  // Insert house float credit account (user_id = 0) if it doesn't exist
  const exists = await knex('credit_accounts').where({ user_id: 0 }).first();
  if (!exists) {
    await knex('credit_accounts').insert({
      user_id: 0,
      balance: 0,
      total_received: 0,
      total_sent: 0,
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex('credit_accounts').where({ user_id: 0 }).del();
}
