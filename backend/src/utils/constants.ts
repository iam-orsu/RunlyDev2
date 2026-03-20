// ─────────────────────────────────────────────────────────────────
// Shared constants used across API, worker, and executor
// ─────────────────────────────────────────────────────────────────

/** Maximum output size in bytes (stdout + stderr each). 64KB. */
export const MAX_OUTPUT_BYTES = 65536;

/** Maximum execution time for user code in milliseconds. 30 seconds (compiled langs need time). */
export const EXECUTION_TIMEOUT_MS = 30000;

/** Total job timeout including compile + run + overhead. 45 seconds. */
export const JOB_TIMEOUT_MS = 45000;

/** BullMQ queue name — used by producer and worker. */
export const QUEUE_NAME = 'code-execution';

/** Maximum source code length in characters. ~100KB. */
export const MAX_SOURCE_CODE_LENGTH = 100000;

/** Maximum stdin length in characters. ~10KB. */
export const MAX_STDIN_LENGTH = 10000;

/** Submission status values */
export const STATUS = {
  QUEUED: 'queued',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  TIMEOUT: 'timeout',
  OOM: 'oom',
  COMPILE_ERROR: 'compile_error',
} as const;

export type SubmissionStatus = typeof STATUS[keyof typeof STATUS];
