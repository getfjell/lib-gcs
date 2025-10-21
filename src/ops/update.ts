import { Storage } from '@google-cloud/storage';
import { ComKey, Coordinate, Item, NotFoundError, PriKey } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { Options } from '../Options';
import { get } from './get';
import GCSLogger from '../logger';
import deepmerge from 'deepmerge';

const logger = GCSLogger.get('ops', 'update');

export interface UpdateOptions {
  mergeStrategy?: 'deep' | 'shallow' | 'replace';
}

/**
 * Update an existing item in GCS
 */
export async function update<
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
  updateOptions: UpdateOptions | undefined,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<V> {
  logger.default('update', { key, item, updateOptions, bucketName });

  // Check if in files-only mode
  if (options.mode === 'files-only') {
    throw new Error(
      `Item operations are disabled in files-only mode. ` +
      `This library is configured to handle only file attachments. ` +
      `Use the primary library (e.g., lib-firestore) for item operations.`
    );
  }

  try {
    // Get existing item
    const existing = await get<V, S, L1, L2, L3, L4, L5>(
      storage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      options
    );

    if (!existing) {
      throw new NotFoundError(
        `Item not found for update`,
        coordinate.kta[0],
        key
      );
    }

    // Apply merge strategy (default: deep)
    const mergeStrategy = updateOptions?.mergeStrategy || 'deep';
    let updated: V;

    switch (mergeStrategy) {
      case 'deep':
        // Deep merge: recursively merge nested objects
        updated = deepmerge(existing, item, {
          arrayMerge: (_, sourceArray) => sourceArray // Replace arrays instead of merging
        }) as V;
        break;

      case 'shallow':
        // Shallow merge: only merge top-level properties
        updated = { ...existing, ...item } as V;
        break;

      case 'replace':
        // Replace: use new item data but preserve key fields
        updated = {
          ...item,
          kt: key.kt,
          pk: key.pk,
          ...('loc' in key ? { loc: key.loc } : {})
        } as unknown as V;
        break;

      default:
        throw new Error(`Invalid merge strategy: ${mergeStrategy}`);
    }

    logger.default('Merged item', { mergeStrategy });

    // Serialize and save
    const buffer = fileProcessor.serializeToBuffer(updated);
    const path = pathBuilder.buildPath(key);
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(path);
    
    await file.save(buffer, {
      contentType: 'application/json',
      metadata: {
        contentType: 'application/json'
      }
    });

    logger.default('Updated item', { path });
    return updated;
  } catch (error) {
    logger.error('Error updating item', { key, error });
    throw error;
  }
}

