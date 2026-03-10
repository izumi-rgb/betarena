import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // First deduplicate any existing conflicts
  const dupes = await knex.raw(`
    SELECT display_id, array_agg(id ORDER BY id) as ids
    FROM users
    GROUP BY display_id
    HAVING COUNT(*) > 1
  `);

  for (const row of dupes.rows || []) {
    const ids = row.ids.slice(1); // skip first (keep original)
    for (let i = 0; i < ids.length; i++) {
      await knex('users').where({ id: ids[i] }).update({
        display_id: knex.raw("display_id || '-' || ?", [ids[i]]),
      });
    }
  }

  // Add unique constraint if not already present
  const hasUnique = await knex.raw(`
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_display_id_unique' AND conrelid = 'users'::regclass
  `);
  if ((hasUnique.rows || []).length === 0) {
    await knex.schema.alterTable('users', (table) => {
      table.unique(['display_id']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropUnique(['display_id']);
  });
}
