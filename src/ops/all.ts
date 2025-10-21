import { Storage } from '@google-cloud/storage';
import { Coordinate, Item, ItemQuery, LocKeyArray } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { Options } from '../Options';
import GCSLogger from '../logger';

const logger = GCSLogger.get('ops', 'all');

/**
 * Get all items matching a query from GCS
 * ⚠️ WARNING: Downloads and filters in-memory. Not suitable for large datasets.
 */
export async function all<
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
): Promise<V[]> {
  logger.default('all', { query, locations, bucketName });

  // Check if in files-only mode
  if (options.mode === 'files-only') {
    throw new Error(
      `Item operations are disabled in files-only mode. ` +
      `This library is configured to handle only file attachments. ` +
      `Use the primary library (e.g., lib-firestore) for item operations.`
    );
  }

  // Check if query operations are disabled
  if (options.querySafety?.disableQueryOperations) {
    throw new Error(
      `Query operations are disabled via querySafety.disableQueryOperations. ` +
      `This prevents expensive in-memory filtering on large datasets. ` +
      `Use get() with exact keys or enable query operations in Options.`
    );
  }

  try {
    const bucket = storage.bucket(bucketName);
    
    // Determine directory prefix
    const kt = coordinate.kta[0];
    let prefix = pathBuilder.getBasePath();
    if (prefix) {
      prefix += '/';
    }
    prefix += kt;

    logger.default('Listing files', { prefix });

    // List all files in directory
    const [files] = await bucket.getFiles({
      prefix: prefix
    });

    // Filter to only JSON files
    const jsonFiles = files.filter(file =>
      options.useJsonExtension !== false ? file.name.endsWith('.json') : true
    );

    logger.default('Found files', { count: jsonFiles.length });

    // Apply query safety checks
    const maxScanFiles = options.querySafety?.maxScanFiles || 1000;
    const warnThreshold = options.querySafety?.warnThreshold || 100;

    if (jsonFiles.length > maxScanFiles) {
      throw new Error(
        `File count (${jsonFiles.length}) exceeds maxScanFiles limit (${maxScanFiles}). ` +
        `Consider: 1) Increasing the limit, 2) Using get() with exact keys, ` +
        `3) Using @fjell/lib-firestore for queryable data, or 4) Implementing an external index.`
      );
    }

    if (jsonFiles.length > warnThreshold) {
      logger.default('WARNING: File count exceeds warning threshold', {
        count: jsonFiles.length,
        threshold: warnThreshold
      });
    }

    // Download files with concurrency control
    const downloadConcurrency = options.querySafety?.downloadConcurrency || 10;
    const items: V[] = [];

    for (let i = 0; i < jsonFiles.length; i += downloadConcurrency) {
      const batch = jsonFiles.slice(i, i + downloadConcurrency);
      
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            const [content] = await file.download();
            const item = fileProcessor.deserializeFromBuffer<V>(content, coordinate as any);
            return item;
          } catch (error) {
            logger.error('Error downloading/deserializing file', { file: file.name, error });
            return null;
          }
        })
      );

      items.push(...batchResults.filter((item): item is NonNullable<typeof item> => item !== null) as V[]);
    }

    logger.default('Downloaded and deserialized items', { count: items.length });

    // Apply query filters if provided
    let filtered = items;

    if (query && (query as any).filter) {
      filtered = filtered.filter(item => {
        for (const [key, value] of Object.entries((query as any).filter)) {
          if ((item as any)[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply sorting if provided
    if (query && (query as any).sort) {
      filtered.sort((a, b) => {
        for (const { field, direction } of (query as any).sort) {
          const aVal = (a as any)[field];
          const bVal = (b as any)[field];
          
          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply offset if provided
    if (query?.offset) {
      filtered = filtered.slice(query.offset);
    }

    // Apply limit if provided
    if (query?.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    logger.default('Filtered and sorted items', { count: filtered.length });
    return filtered;
  } catch (error) {
    logger.error('Error getting all items', { error });
    throw error;
  }
}

