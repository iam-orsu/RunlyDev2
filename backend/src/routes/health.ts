import { Router, Request, Response } from 'express';
import db from '../db/knex';
import { executionQueue } from '../queue/producer';
import { logger } from '../utils/logger';

const router = Router();

// ─── GET /api/health ──────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const health: Record<string, string | number> = {
    status: 'ok',
    redis: 'disconnected',
    postgres: 'disconnected',
    queue_depth: 0,
  };

  try {
    // Check PostgreSQL
    await db.raw('SELECT 1');
    health.postgres = 'connected';
  } catch (error) {
    health.status = 'degraded';
    logger.warn({ error }, 'PostgreSQL health check failed');
  }

  try {
    // Check Redis (via BullMQ queue)
    const counts = await executionQueue.getJobCounts();
    health.redis = 'connected';
    health.queue_depth = counts.waiting + counts.active;
  } catch (error) {
    health.status = 'degraded';
    logger.warn({ error }, 'Redis health check failed');
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
