import db from '../db/knex';
import { LanguageId } from '../languages';
import { SubmissionStatus } from '../utils/constants';

// ─── TypeScript interface matching exact DB columns ────────────
export interface Submission {
  id: string;
  language: LanguageId;
  source_code: string;
  stdin: string;
  status: SubmissionStatus;
  stdout: string;
  stderr: string;
  compile_output: string;
  exit_code: number | null;
  signal: string | null;
  execution_time_ms: number | null;
  memory_used_kb: number | null;
  created_at: Date;
  completed_at: Date | null;
}

// ─── Input types ───────────────────────────────────────────────
export interface CreateSubmissionInput {
  language: LanguageId;
  source_code: string;
  stdin: string;
}

export interface UpdateSubmissionInput {
  status?: SubmissionStatus;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  exit_code?: number | null;
  signal?: string | null;
  execution_time_ms?: number | null;
  memory_used_kb?: number | null;
  completed_at?: Date;
}

// ─── CRUD functions ────────────────────────────────────────────

const TABLE = 'submissions';

/** Create a new submission. Returns the full inserted row. */
export async function createSubmission(
  data: CreateSubmissionInput
): Promise<Submission> {
  const [row] = await db(TABLE)
    .insert({
      language: data.language,
      source_code: data.source_code,
      stdin: data.stdin,
      status: 'queued',
    })
    .returning('*');

  return row as Submission;
}

/** Get a submission by ID. Returns null if not found. */
export async function getSubmissionById(
  id: string
): Promise<Submission | null> {
  const row = await db(TABLE).where({ id }).first();
  return (row as Submission) || null;
}

/** Update a submission by ID. Returns the updated row. */
export async function updateSubmission(
  id: string,
  data: UpdateSubmissionInput
): Promise<Submission> {
  const [row] = await db(TABLE)
    .where({ id })
    .update(data)
    .returning('*');

  return row as Submission;
}
