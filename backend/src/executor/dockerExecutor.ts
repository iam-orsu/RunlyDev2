import Docker from 'dockerode';
import { PassThrough } from 'stream';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';

import { config } from '../config';
import { LanguageId, LANGUAGES, getFilename } from '../languages';
import { MAX_OUTPUT_BYTES, EXECUTION_TIMEOUT_MS } from '../utils/constants';
import { logger } from '../utils/logger';

// ─── Docker client (connects via mounted socket) ──────────────
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// ─── Return type ──────────────────────────────────────────────
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  timedOut: boolean;
}

// ─── Output truncation ───────────────────────────────────────
function truncateOutput(s: string): string {
  if (Buffer.byteLength(s) <= MAX_OUTPUT_BYTES) return s;
  return Buffer.from(s).slice(0, MAX_OUTPUT_BYTES).toString('utf8');
}

// ─── Build tmpfs map per language ─────────────────────────────
function getTmpfs(languageId: LanguageId): Record<string, string> {
  const base: Record<string, string> = {
    '/tmp': 'size=50m,exec',
    '/home': 'size=10m',
  };

  if (languageId === 'go') {
    base['/.cache'] = 'size=200m';
  }

  return base;
}

// ─── Main executor function ───────────────────────────────────
export async function executeCode(
  submissionId: string,
  languageId: LanguageId,
  sourceCode: string,
  stdin: string
): Promise<ExecutionResult> {
  const langConfig = LANGUAGES[languageId];
  const filename = getFilename(languageId);

  // Create temp dir in the shared volume (mounted at same path on worker + host)
  // This ensures the Docker daemon can find the files when bind-mounting into sandbox
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const hostCodeDir = `/tmp/runly-code/runly-${submissionId}-${randomSuffix}`;
  await fs.mkdir(hostCodeDir, { recursive: true });

  // Write source code file
  await fs.writeFile(path.join(hostCodeDir, filename), sourceCode, 'utf8');

  // Always write stdin.txt (empty if no stdin)
  await fs.writeFile(path.join(hostCodeDir, 'stdin.txt'), stdin || '', 'utf8');

  let container: Docker.Container | undefined;
  let timedOut = false;
  let timeoutHandle: NodeJS.Timeout | undefined;
  const startTime = Date.now();

  try {
    // ─── Step 1: Create container (await separately) ──────────
    container = await docker.createContainer({
      Image: config.sandboxImage,
      Cmd: [languageId],
      HostConfig: {
        NetworkMode: 'none',
        ReadonlyRootfs: true,
        Memory: langConfig.memoryLimit,
        NanoCpus: 500000000, // 0.5 CPU
        PidsLimit: langConfig.pidsLimit,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
        Tmpfs: getTmpfs(languageId),
        Binds: [`${hostCodeDir}:/code:ro`],
      },
    });

    // ─── Step 2: Attach BEFORE start (order is critical) ──────
    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
    });

    // ─── Step 3: Demux stream ─────────────────────────────────
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();

    stdoutStream.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    stderrStream.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    docker.modem.demuxStream(stream, stdoutStream, stderrStream);

    // ─── Step 4: Start container ──────────────────────────────
    await container.start();

    // ─── Step 5: Enforce timeout ──────────────────────────────
    timeoutHandle = setTimeout(async () => {
      timedOut = true;
      logger.warn({ submissionId, languageId }, 'Execution timed out, killing container');
      try {
        await container!.kill();
      } catch {
        // Container may have already exited
      }
    }, EXECUTION_TIMEOUT_MS);

    // ─── Step 6: Wait for exit ────────────────────────────────
    const exitData = await container.wait();
    clearTimeout(timeoutHandle);
    timeoutHandle = undefined;

    // End streams so we can read all collected data
    stdoutStream.end();
    stderrStream.end();

    const executionTimeMs = Date.now() - startTime;
    const exitCode = exitData.StatusCode;

    // Collect output
    const rawStdout = Buffer.concat(stdoutChunks).toString('utf8');
    const rawStderr = Buffer.concat(stderrChunks).toString('utf8');

    const result: ExecutionResult = {
      stdout: truncateOutput(rawStdout),
      stderr: truncateOutput(rawStderr),
      exitCode: timedOut ? null : exitCode,
      executionTimeMs,
      timedOut,
    };

    logger.info(
      {
        submissionId,
        languageId,
        exitCode: result.exitCode,
        executionTimeMs,
        timedOut,
        stdoutLen: result.stdout.length,
        stderrLen: result.stderr.length,
      },
      'Execution completed'
    );

    return result;
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;

    logger.error(
      { submissionId, languageId, error, executionTimeMs },
      'Execution failed with error'
    );

    // If timeout was set but we errored before wait() resolved, clear it
    if (timeoutHandle) clearTimeout(timeoutHandle);

    return {
      stdout: '',
      stderr: error instanceof Error ? error.message : 'Unknown execution error',
      exitCode: null,
      executionTimeMs,
      timedOut,
    };
  } finally {
    // ─── Step 7: Always remove container ──────────────────────
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {
        // Container may have been auto-removed or already gone
      }
    }

    // ─── Step 8: Always cleanup temp dir ──────────────────────
    try {
      await fs.rm(hostCodeDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }
}

export { docker };
