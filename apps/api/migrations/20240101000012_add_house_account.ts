import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Insert house float account (user_id = 0) if it doesn't exist
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
