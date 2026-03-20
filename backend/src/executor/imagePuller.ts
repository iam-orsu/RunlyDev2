import { docker } from './dockerExecutor';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Checks that the runly-sandbox Docker image exists locally.
 * This image is built locally — never pulled from a registry.
 * Must be called before the API accepts any submissions.
 */
export async function pullAllImages(): Promise<void> {
  const imageName = config.sandboxImage;

  logger.info({ imageName }, 'Checking for sandbox image...');

  try {
    const image = docker.getImage(imageName);
    const info = await image.inspect();

    const sizeMb = Math.round((info.Size || 0) / 1024 / 1024);
    logger.info(
      {
        imageName,
        imageId: info.Id.slice(0, 12),
        sizeMb,
        created: info.Created,
      },
      `runly-sandbox image ready (${sizeMb}MB)`
    );
  } catch (error: unknown) {
    const err = error as { statusCode?: number };

    if (err.statusCode === 404) {
      const msg =
        `Sandbox image "${imageName}" not found locally. ` +
        `Build it first with:\n\n` +
        `  docker build -f sandbox/Dockerfile.sandbox -t ${imageName} ./sandbox\n`;

      logger.fatal(msg);
      throw new Error(msg);
    }

    logger.error({ error, imageName }, 'Failed to inspect sandbox image');
    throw error;
  }
}
