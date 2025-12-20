import { Storage } from '@google-cloud/storage';
import { ComKey, Coordinate, Item, LocKeyArray, PriKey, UpdateOptions } from '@fjell/types';
import { NotFoundError } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { Options } from '../Options';
import { get } from './get';
import { create, CreateOptions } from './create';
import { update } from './update';
import GCSLogger from '../logger';

const logger = GCSLogger.get('ops', 'upsert');

/**
 * Update or create an item in GCS
 */
export async function upsert<
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
  item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  locations: LocKeyArray<L1, L2, L3, L4, L5> | undefined,
  updateOptions: UpdateOptions | undefined,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<V> {
  logger.default('upsert', { key, item, locations, updateOptions, bucketName });

  // Check if in files-only mode
  if (options.mode === 'files-only') {
    throw new Error(
      `Item operations are disabled in files-only mode. ` +
      `This library is configured to handle only file attachments. ` +
      `Use the primary library (e.g., lib-firestore) for item operations.`
    );
  }

  let existing: V | null = null;

  try {
    // Try to get existing item
    logger.default('Retrieving item by key', { key });
    existing = await get<V, S, L1, L2, L3, L4, L5>(
      storage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );
  } catch (error: any) {
    // Check if this is a NotFoundError (preserved by core wrapper)
    // Check both instanceof and error code to handle cases where
    // module duplication might break instanceof checks
    const isNotFound = error instanceof NotFoundError ||
      error?.name === 'NotFoundError' ||
      error?.errorInfo?.code === 'NOT_FOUND';

    if (isNotFound) {
      // If it's a "not found" error, existing stays null and we create below
      logger.default('Item not found, will create', { key, errorType: error?.name, errorCode: error?.errorInfo?.code });
    } else {
      // Re-throw other errors (connection issues, permissions, etc.)
      logger.error('Error getting item during upsert', { key, error: error?.message, name: error?.name, code: error?.errorInfo?.code });
      throw error;
    }
  }

  if (existing) {
    // Item exists, update with merge strategy
    logger.default('Item exists, updating');
    return update<V, S, L1, L2, L3, L4, L5>(
      storage,
      bucketName,
      key,
      item,
      updateOptions,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );
  } else {
    // Item doesn't exist, create it
    logger.default('Item does not exist, creating');

    const createOptions: CreateOptions<S, L1, L2, L3, L4, L5> = {
      key,
      locations
    };

    return create<V, S, L1, L2, L3, L4, L5>(
      storage,
      bucketName,
      item,
      createOptions,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );
  }
}

