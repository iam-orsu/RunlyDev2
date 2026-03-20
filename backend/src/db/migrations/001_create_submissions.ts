import db from '../knex';
import { logger } from '../../utils/logger';

export async function runMigrations(): Promise<void> {
  try {
    // Enable uuid generation
    await db.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    const exists = await db.schema.hasTable('submissions');

    if (!exists) {
      await db.schema.createTable('submissions', (table) => {
        table
          .uuid('id')
          .primary()
          .defaultTo(db.raw('gen_random_uuid()'));

        table.string('language', 10).notNullable();
        table.text('source_code').notNullable();
        table.text('stdin').defaultTo('');

        table
          .string('status', 20)
          .notNullable()
          .defaultTo('queued');

        table.text('stdout').defaultTo('');
        table.text('stderr').defaultTo('');
        table.text('compile_output').defaultTo('');

        table.integer('exit_code').nullable();
        table.string('signal', 10).nullable();
        table.integer('execution_time_ms').nullable();
        table.integer('memory_used_kb').nullable();

        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('completed_at').nullable();
      });

      logger.info('Created submissions table');
    } else {
      logger.info('Submissions table already exists, skipping migration');
    }
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    throw error;
  }
}
