import { randomBytes } from 'crypto';
import { Knex } from 'knex';

function buildAgentCode(displayId: string): string {
  const digits = displayId.match(/\d+/g)?.join('') || displayId.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || '000';
  const suffix = randomBytes(3).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
  return `AGT-${digits.slice(0, 6)}-${suffix}`;
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('agent_code', 32).nullable().unique();
  });

  const existing = await knex('users')
    .select('id', 'display_id')
    .whereIn('role', ['agent', 'sub_agent']);

  const usedCodes = new Set<string>();
  for (const row of existing) {
    let code = buildAgentCode(row.display_id);
    while (usedCodes.has(code)) {
      code = buildAgentCode(row.display_id);
    }
    usedCodes.add(code);
    await knex('users').where({ id: row.id }).update({ agent_code: code });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('agent_code');
  });
}

