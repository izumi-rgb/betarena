import knex from 'knex';
import { env } from './env';

const db = knex({
  client: 'pg',
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: '../migrations',
    extension: 'ts',
  },
  seeds: {
    directory: '../seeds',
  },
});

export default db;
