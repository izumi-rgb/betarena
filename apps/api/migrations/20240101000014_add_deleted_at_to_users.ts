import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.timestamp('deleted_at', { useTz: true }).nullable().defaultTo(null);
  });

  await knex.schema.raw(
    'CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_deleted_at');
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('deleted_at');
  });
}
