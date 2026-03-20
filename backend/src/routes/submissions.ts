import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { LANGUAGE_IDS } from '../languages';
import { MAX_SOURCE_CODE_LENGTH, MAX_STDIN_LENGTH } from '../utils/constants';
import { createSubmission } from '../models/submission';
import { getSubmissionById } from '../models/submission';
import { enqueueExecution } from '../queue/producer';
import { logger } from '../utils/logger';

const router = Router();

// ─── Validation schema ───────────────────────────────────────
const submitSchema = z.object({
  language: z.enum(LANGUAGE_IDS),
  source_code: z.string().min(1).max(MAX_SOURCE_CODE_LENGTH),
  stdin: z.string().max(MAX_STDIN_LENGTH).default(''),
});

// ─── POST /api/submissions ────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate input
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    const { language, source_code, stdin } = parsed.data;

    // Create submission in DB
    const submission = await createSubmission({
      language,
      source_code,
      stdin,
    });

    // Enqueue for execution
    await enqueueExecution(submission.id);

    logger.info(
      { submissionId: submission.id, language },
      'Submission created and enqueued'
    );

    res.status(201).json({
      id: submission.id,
      status: submission.status,
      created_at: submission.created_at,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create submission');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/submissions/:id ─────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const submission = await getSubmissionById(id);
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    res.json({
      id: submission.id,
      language: submission.language,
      status: submission.status,
      created_at: submission.created_at,
      completed_at: submission.completed_at,
      stdout: submission.stdout,
      stderr: submission.stderr,
      compile_output: submission.compile_output,
      exit_code: submission.exit_code,
      signal: submission.signal,
      execution_time_ms: submission.execution_time_ms,
      memory_used_kb: submission.memory_used_kb,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get submission');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
