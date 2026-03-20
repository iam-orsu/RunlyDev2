import { Worker, Job } from 'bullmq';
import { config } from '../config';
import { QUEUE_NAME, STATUS } from '../utils/constants';
import { logger } from '../utils/logger';
import { executeCode, ExecutionResult } from '../executor/dockerExecutor';
import {
  getSubmissionById,
  updateSubmission,
} from '../models/submission';
import { LanguageId } from '../languages';
import { ExecutionJobData } from './producer';

// ─── Redis connection config (inline, no separate ioredis import) ──
const redisConnection = {
  host: new URL(config.redisUrl).hostname,
  port: parseInt(new URL(config.redisUrl).port || '6379', 10),
  maxRetriesPerRequest: null,
};

// ─── Determine final status from execution result ─────────────
function determineStatus(result: ExecutionResult, hadCompileOutput: boolean): string {
  if (result.timedOut) return STATUS.TIMEOUT;

  // Check compile error — stderr has content and exitCode != 0 for compiled langs
  if (hadCompileOutput && result.exitCode !== 0) return STATUS.COMPILE_ERROR;

  // OOM is signaled by exit code 137 (SIGKILL from cgroup)
  if (result.exitCode === 137) return STATUS.OOM;

  // Exit code 0 = success, anything else = error
  if (result.exitCode === 0) return STATUS.SUCCESS;

  return STATUS.ERROR;
}

// ─── Detect if stderr is a compile error ──────────────────────
function isCompileError(stderr: string): boolean {
  const compilePatterns = [
    'error:',
    'Error:',
    'undefined reference',
    'cannot find symbol',
    'syntax error',
    'fatal error',
  ];
  return compilePatterns.some((p) => stderr.includes(p));
}

// ─── Job processor ────────────────────────────────────────────
async function processJob(job: Job<ExecutionJobData>): Promise<void> {
  const { submissionId } = job.data;
  logger.info({ submissionId, jobId: job.id }, 'Processing execution job');

  // Fetch submission from DB
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    logger.error({ submissionId }, 'Submission not found, skipping');
    return;
  }

  // Mark as running
  await updateSubmission(submissionId, { status: STATUS.RUNNING });

  // Extract multi-file data from job
  const { files, entryFile } = job.data;

  // Execute code in sandbox container
  const result: ExecutionResult = await executeCode(
    submissionId,
    submission.language as LanguageId,
    submission.source_code,
    submission.stdin,
    files,
    entryFile
  );

  // Determine status
  const hadCompileOutput = isCompileError(result.stderr);
  const status = determineStatus(result, hadCompileOutput);

  // Determine signal from exit code
  let signal: string | null = null;
  if (result.exitCode === 137) signal = 'SIGKILL';
  else if (result.exitCode === 139) signal = 'SIGSEGV';
  else if (result.exitCode === 143) signal = 'SIGTERM';

  // Store results
  await updateSubmission(submissionId, {
    status: status as typeof STATUS[keyof typeof STATUS],
    stdout: result.stdout,
    stderr: result.stderr,
    compile_output: hadCompileOutput ? result.stderr : '',
    exit_code: result.exitCode,
    signal,
    execution_time_ms: result.executionTimeMs,
    completed_at: new Date(),
  });

  logger.info(
    {
      submissionId,
      status,
      exitCode: result.exitCode,
      executionTimeMs: result.executionTimeMs,
      timedOut: result.timedOut,
    },
    'Job completed'
  );
}

// ─── Create and start worker ──────────────────────────────────
export function startWorker(): Worker {
  const worker = new Worker(QUEUE_NAME, processJob, {
    connection: redisConnection,
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job?.id }, 'Job completed event');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Job failed event');
  });

  worker.on('error', (err) => {
    logger.error({ error: err.message }, 'Worker error');
  });

  logger.info({ queue: QUEUE_NAME, concurrency: 2 }, 'BullMQ worker started');

  return worker;
}
