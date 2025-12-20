import { Storage } from '@google-cloud/storage';
import { ComKey, Coordinate, Item, PriKey } from '@fjell/types';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { Options } from '../Options';
import GCSLogger from '../logger';

const logger = GCSLogger.get('ops', 'get');

/**
 * Get a single item by key from GCS
 */
export async function get<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  storage: Storage,
  bucketName: string,
  key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<V | null> {
  logger.default('get', { key, bucketName });

  // Check if in files-only mode
  if (options.mode === 'files-only') {
    throw new Error(
      `Item operations are disabled in files-only mode. ` +
      `This library is configured to handle only file attachments. ` +
      `Use the primary library (e.g., lib-firestore) for item operations.`
    );
  }

  try {
    // Build the file path
    const path = pathBuilder.buildPath(key);
    logger.default('Built path', { path });

    // Get reference to the file
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(path);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      logger.default('File not found', { path });
      return null;
    }

    // Download file content
    const [content] = await file.download();
    logger.default('Downloaded file', { size: content.length });

    // Deserialize
    const item = fileProcessor.deserializeFromBuffer<V>(content, coordinate as any);
    
    if (!item) {
      logger.error('Failed to deserialize item', { path });
      return null;
    }

    return item;
  } catch (error) {
    logger.error('Error getting item', { key, error });
    throw error;
  }
}

