import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  const seedEventIds = await knex('events').where('external_id', 'like', 'seed-%').pluck('id');
  if (seedEventIds.length > 0) {
    await knex('odds').whereIn('event_id', seedEventIds).delete();
    await knex('events').whereIn('id', seedEventIds).delete();
  }
  console.log(`Removed ${seedEventIds.length} demo event(s). No demo sports events are seeded anymore.`);
}
