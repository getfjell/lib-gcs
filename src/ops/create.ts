import { Storage } from '@google-cloud/storage';
import { ComKey, Coordinate, Item, LocKeyArray, PriKey } from '@fjell/core';
import { PathBuilder } from '../PathBuilder';
import { FileProcessor } from '../FileProcessor';
import { Options } from '../Options';
import GCSLogger from '../logger';
import { v4 as uuidv4 } from 'uuid';

const logger = GCSLogger.get('ops', 'create');

export interface CreateOptions<
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  key?: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>;
  locations?: LocKeyArray<L1, L2, L3, L4, L5>;
}

/**
 * Create a new item in GCS
 */
export async function create<
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
  item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  createOptions: CreateOptions<S, L1, L2, L3, L4, L5> | undefined,
  pathBuilder: PathBuilder,
  fileProcessor: FileProcessor,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>
): Promise<V> {
  logger.default('create', { item, createOptions, bucketName });

  // Check if in files-only mode
  if (options.mode === 'files-only') {
    throw new Error(
      `Item operations are disabled in files-only mode. ` +
      `This library is configured to handle only file attachments. ` +
      `Use the primary library (e.g., lib-firestore) for item operations.`
    );
  }

  try {
    // Generate key if not provided
    let key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>;
    
    if (createOptions?.key) {
      key = createOptions.key;
    } else {
      // Generate UUID for pk if not provided
      const pk = (item.pk || uuidv4()) as string | number;
      const kt = coordinate.kta[0] as S;
      
      if (createOptions?.locations && createOptions.locations.length > 0) {
        // Create ComKey
        key = {
          kt,
          pk,
          loc: createOptions.locations
        } as ComKey<S, L1, L2, L3, L4, L5>;
      } else {
        // Create PriKey
        key = { kt, pk } as PriKey<S>;
      }
    }

    // Merge item with key data
    const fullItem = {
      ...item,
      kt: key.kt,
      pk: key.pk,
      ...('loc' in key ? { loc: key.loc } : {})
    } as unknown as V;

    // Serialize item
    const buffer = fileProcessor.serializeToBuffer(fullItem);
    logger.default('Serialized item', { size: buffer.length });

    // Build path
    const path = pathBuilder.buildPath(key);
    logger.default('Built path', { path });

    // Upload to GCS
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(path);
    
    await file.save(buffer, {
      contentType: 'application/json',
      metadata: {
        contentType: 'application/json'
      }
    });

    logger.default('Created item', { path });
    return fullItem;
  } catch (error) {
    logger.error('Error creating item', { item, error });
    throw error;
  }
}

