import { Queue } from 'bullmq';
import { config } from '../config';
import { QUEUE_NAME } from '../utils/constants';
import { logger } from '../utils/logger';

// ─── Queue instance ───────────────────────────────────────────
export const executionQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: new URL(config.redisUrl).hostname,
    port: parseInt(new URL(config.redisUrl).port || '6379', 10),
    maxRetriesPerRequest: null,
  },
});

// ─── Job interface ────────────────────────────────────────────
export interface FileEntry {
  name: string;
  content: string;
}

export interface ExecutionJobData {
  submissionId: string;
  files?: FileEntry[];
  entryFile?: string;
}

// ─── Enqueue function ─────────────────────────────────────────
export async function enqueueExecution(
  submissionId: string,
  files?: FileEntry[],
  entryFile?: string
): Promise<void> {
  const jobData: ExecutionJobData = { submissionId, files, entryFile };

  await executionQueue.add('execute', jobData, {
    attempts: 1,
    removeOnComplete: { age: 60 },
    removeOnFail: { age: 300 },
  });

  logger.info({ submissionId, queue: QUEUE_NAME, fileCount: files?.length || 0 }, 'Job enqueued');
}
