import { Storage } from '@google-cloud/storage';
import { ComKey, Coordinate, Item, PriKey } from '@fjell/types';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { Options } from '../Options';
import { get } from './get';
import GCSLogger from '../logger';

const logger = GCSLogger.get('ops', 'remove');

/**
 * Remove an item from GCS
 */
export async function remove<
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
): Promise<V | void> {
  logger.default('remove', { key, bucketName });

  // Check if in files-only mode
  if (options.mode === 'files-only') {
    throw new Error(
      `Item operations are disabled in files-only mode. ` +
      `This library is configured to handle only file attachments. ` +
      `Use the primary library (e.g., lib-firestore) for item operations.`
    );
  }

  try {
    // Get existing item first
    const existing = await get<V, S, L1, L2, L3, L4, L5>(
      storage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    // Build path and delete file
    const path = pathBuilder.buildPath(key);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(path);

    await file.delete();
    logger.default('Deleted item', { path });

    return existing || void 0;
  } catch (error) {
    logger.error('Error removing item', { key, error });
    throw error;
  }
}

