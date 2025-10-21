import { Storage } from '@google-cloud/storage';
import { Coordinate, Item, ItemQuery, LocKeyArray } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { Options } from '../Options';
import { all } from './all';
import GCSLogger from '../logger';

const logger = GCSLogger.get('ops', 'one');

/**
 * Get the first item matching a query from GCS
 * ⚠️ WARNING: Downloads and filters in-memory. Not suitable for large datasets.
 */
export async function one<
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
  query: ItemQuery | undefined,
  locations: LocKeyArray<L1, L2, L3, L4, L5> | [] | undefined,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<V | null> {
  logger.default('one', { query, locations, bucketName });

  // Check if in files-only mode
  if (options.mode === 'files-only') {
    throw new Error(
      `Item operations are disabled in files-only mode. ` +
      `This library is configured to handle only file attachments. ` +
      `Use the primary library (e.g., lib-firestore) for item operations.`
    );
  }

  try {
    // Optimize query by adding limit: 1 if not already present
    const optimizedQuery: ItemQuery = {
      ...query,
      limit: 1
    };

    // Use all() operation with limit of 1
    const items = await all<V, S, L1, L2, L3, L4, L5>(
      storage,
      bucketName,
      optimizedQuery,
      locations,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    return items.length > 0 ? items[0] : null;
  } catch (error) {
    logger.error('Error getting one item', { error });
    throw error;
  }
}

