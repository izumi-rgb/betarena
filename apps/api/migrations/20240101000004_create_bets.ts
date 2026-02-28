import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('bets', (table) => {
    table.increments('id').primary();
    table.string('bet_uid', 50).notNullable().unique();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('type', ['single', 'accumulator', 'system', 'each_way', 'asian_handicap', 'over_under']).notNullable();
    table.enum('status', ['open', 'won', 'lost', 'void', 'cashout']).notNullable().defaultTo('open');
    table.decimal('stake', 18, 2).notNullable();
    table.decimal('potential_win', 18, 2).nullable();
    table.decimal('actual_win', 18, 2).nullable();
    table.jsonb('odds_snapshot').notNullable();
    table.jsonb('selections').notNullable();
    table.timestamp('settled_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_bets_user ON bets(user_id)');
  await knex.schema.raw('CREATE INDEX idx_bets_status ON bets(status)');
  await knex.schema.raw('CREATE INDEX idx_bets_created ON bets(created_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('bets');
}
