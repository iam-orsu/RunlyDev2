import knex, { Knex } from 'knex';
import { config } from '../config';

const db: Knex = knex({
  client: 'pg',
  connection: config.databaseUrl,
  pool: {
    min: 1,
    max: 5,
  },
});

export default db;
