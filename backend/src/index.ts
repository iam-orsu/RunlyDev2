import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { runMigrations } from './db/migrations/001_create_submissions';

import submissionsRouter from './routes/submissions';
import languagesRouter from './routes/languages';
import healthRouter from './routes/health';
import { submissionLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

async function main(): Promise<void> {
  logger.info('Starting Runly.dev API server...');

  // ─── Run migrations on startup ──────────────────────────────
  await runMigrations();



  // ─── Express app ────────────────────────────────────────────
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '200kb' }));

  // ─── Routes ─────────────────────────────────────────────────
  app.use('/api/submissions', submissionLimiter, submissionsRouter);
  app.use('/api/languages', languagesRouter);
  app.use('/api/health', healthRouter);

  // ─── Global error handler (must be last) ────────────────────
  app.use(errorHandler);

  // ─── Start server ───────────────────────────────────────────
  app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.nodeEnv },
      `API server listening on port ${config.port}`
    );
  });
}

main().catch((error) => {
  logger.fatal({ error }, 'Fatal error during startup');
  process.exit(1);
});
