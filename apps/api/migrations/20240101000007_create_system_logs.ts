import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('system_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.enum('role', ['admin', 'agent', 'sub_agent', 'member']).nullable();
    table.string('action', 100).notNullable();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.jsonb('payload').nullable();
    table.enum('result', ['success', 'failure', 'blocked']).notNullable();
    table.boolean('threat_flag').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_logs_user ON system_logs(user_id)');
  await knex.schema.raw('CREATE INDEX idx_logs_action ON system_logs(action)');
  await knex.schema.raw('CREATE INDEX idx_logs_created ON system_logs(created_at)');
  await knex.schema.raw('CREATE INDEX idx_logs_threat ON system_logs(threat_flag) WHERE threat_flag = true');

  // Restrict the API role to INSERT-only on system_logs
  // Create a restricted role for the app if it doesn't exist, then revoke UPDATE/DELETE
  await knex.raw(`
    DO $$
    BEGIN
      -- Revoke UPDATE and DELETE on system_logs for the current DB user
      REVOKE UPDATE, DELETE ON system_logs FROM betarena;

      -- Create a rule to prevent updates
      CREATE OR REPLACE RULE prevent_update_system_logs AS
        ON UPDATE TO system_logs
        DO INSTEAD NOTHING;

      -- Create a rule to prevent deletes
      CREATE OR REPLACE RULE prevent_delete_system_logs AS
        ON DELETE TO system_logs
        DO INSTEAD NOTHING;
    END
    $$;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DO $$
    BEGIN
      DROP RULE IF EXISTS prevent_update_system_logs ON system_logs;
      DROP RULE IF EXISTS prevent_delete_system_logs ON system_logs;
      GRANT UPDATE, DELETE ON system_logs TO betarena;
    END
    $$;
  `);
  await knex.schema.dropTableIfExists('system_logs');
}
