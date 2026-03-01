import knex from 'knex';
import { env } from './env';

const connection = env.DATABASE_URL
  ? { connectionString: env.DATABASE_URL }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    };

const db = knex({
  client: 'pg',
  connection,
  pool: {
    min: 2,
    max: 10,
  },
});

export default db;
