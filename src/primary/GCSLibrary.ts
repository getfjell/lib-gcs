import { Item, ItemTypeArray } from '@fjell/core';
import * as Library from '@fjell/lib';
import { Storage } from '@google-cloud/storage';
import { createGCSLibrary, GCSLibrary } from '../GCSLibrary';
import GCSLogger from '../logger';

const logger = GCSLogger.get('primary', 'GCSLibrary');

/**
 * Specialized factory for primary items - simpler API
 */
export function createPrimaryGCSLibrary<
  V extends Item<S>,
  S extends string
>(
  keyType: S,
  directory: string,
  bucketName: string,
  storage?: Storage,
  options?: Partial<Library.Options<V, S>>
): GCSLibrary<V, S> {
  logger.default('createPrimaryGCSLibrary', { keyType, directory, bucketName });

  const kta = [keyType] as ItemTypeArray<S>;
  const directoryPaths = [directory];

  return createGCSLibrary<V, S>(
    kta,
    directoryPaths,
    bucketName,
    storage || null,
    options || null,
    null
  );
}
