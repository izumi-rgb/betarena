import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('display_id', 50).notNullable().unique();
    table.string('username', 100).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['admin', 'agent', 'sub_agent', 'member']).notNullable();
    table.string('nickname', 100).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('created_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.integer('parent_agent_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.boolean('can_create_sub_agent').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.schema.raw('CREATE INDEX idx_users_role ON users(role)');
  await knex.schema.raw('CREATE INDEX idx_users_parent_agent ON users(parent_agent_id)');
  await knex.schema.raw('CREATE INDEX idx_users_created_by ON users(created_by)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
