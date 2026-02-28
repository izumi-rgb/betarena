import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bets', (table) => {
    table.jsonb('metadata').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bets', (table) => {
    table.dropColumn('metadata');
  });
}
