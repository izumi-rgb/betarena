import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('credit_transactions', (table) => {
    table.increments('id').primary();
    table.integer('from_user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.integer('to_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('amount', 18, 2).notNullable();
    table.enum('type', ['create', 'transfer', 'deduct']).notNullable();
    table.string('note', 500).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_credit_tx_from ON credit_transactions(from_user_id)');
  await knex.schema.raw('CREATE INDEX idx_credit_tx_to ON credit_transactions(to_user_id)');
  await knex.schema.raw('CREATE INDEX idx_credit_tx_created ON credit_transactions(created_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('credit_transactions');
}
