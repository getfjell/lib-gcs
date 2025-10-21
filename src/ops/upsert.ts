import { Storage } from '@google-cloud/storage';
import { ComKey, Coordinate, Item, LocKeyArray, PriKey } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { Options } from '../Options';
import { get } from './get';
import { create, CreateOptions } from './create';
import { update, UpdateOptions } from './update';
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

  try {
    // Try to get existing item
    const existing = await get<V, S, L1, L2, L3, L4, L5>(
      storage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

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
  } catch (error) {
    logger.error('Error upserting item', { key, error });
    throw error;
  }
}

