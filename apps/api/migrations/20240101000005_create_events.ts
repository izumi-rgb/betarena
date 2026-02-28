import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('external_id', 100).notNullable().unique();
    table.string('sport', 50).notNullable();
    table.string('league', 200).notNullable();
    table.string('home_team', 200).notNullable();
    table.string('away_team', 200).notNullable();
    table.timestamp('starts_at').notNullable();
    table.enum('status', ['scheduled', 'live', 'finished']).notNullable().defaultTo('scheduled');
    table.jsonb('score').nullable();
    table.jsonb('raw_data').nullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_events_sport ON events(sport)');
  await knex.schema.raw('CREATE INDEX idx_events_status ON events(status)');
  await knex.schema.raw('CREATE INDEX idx_events_starts ON events(starts_at)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('events');
}
