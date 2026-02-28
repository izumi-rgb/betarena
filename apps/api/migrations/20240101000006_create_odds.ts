import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('odds', (table) => {
    table.increments('id').primary();
    table.integer('event_id').unsigned().notNullable().references('id').inTable('events').onDelete('CASCADE');
    table.string('market_type', 100).notNullable();
    table.jsonb('selections').notNullable();
    table.boolean('is_live').notNullable().defaultTo(false);
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_odds_event ON odds(event_id)');
  await knex.schema.raw('CREATE UNIQUE INDEX idx_odds_event_market ON odds(event_id, market_type)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('odds');
}
