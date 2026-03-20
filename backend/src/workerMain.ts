import { logger } from './utils/logger';
import { startWorker } from './queue/worker';
import { pullAllImages } from './executor/imagePuller';

async function main(): Promise<void> {
  logger.info('Starting Runly.dev Worker process...');

  // Verify sandbox image exists before accepting jobs
  await pullAllImages();

  const worker = startWorker();

  // ─── Graceful shutdown ──────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal, closing worker...');
    await worker.close();
    logger.info('Worker shut down cleanly');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Worker is running. Waiting for jobs...');
}

main().catch((error) => {
  logger.fatal({ error }, 'Fatal error in worker');
  process.exit(1);
});
