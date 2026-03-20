import { Queue } from 'bullmq';
import { config } from '../config';
import { QUEUE_NAME } from '../utils/constants';
import { logger } from '../utils/logger';

// ─── Queue instance ───────────────────────────────────────────
// Pass Redis URL as connection string — BullMQ creates its own ioredis internally
export const executionQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: new URL(config.redisUrl).hostname,
    port: parseInt(new URL(config.redisUrl).port || '6379', 10),
    maxRetriesPerRequest: null,
  },
});

// ─── Job interface ────────────────────────────────────────────
export interface ExecutionJobData {
  submissionId: string;
}

// ─── Enqueue function ─────────────────────────────────────────
export async function enqueueExecution(submissionId: string): Promise<void> {
  const jobData: ExecutionJobData = { submissionId };

  await executionQueue.add('execute', jobData, {
    attempts: 1,
    removeOnComplete: { age: 60 },
    removeOnFail: { age: 300 },
  });

  logger.info({ submissionId, queue: QUEUE_NAME }, 'Job enqueued');
}
