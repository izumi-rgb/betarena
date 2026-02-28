import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('credit_accounts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('balance', 18, 2).notNullable().defaultTo(0);
    table.decimal('total_received', 18, 2).notNullable().defaultTo(0);
    table.decimal('total_sent', 18, 2).notNullable().defaultTo(0);
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('credit_accounts');
}
