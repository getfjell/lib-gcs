import { Item, ItemTypeArray } from '@fjell/core';
import * as Library from '@fjell/lib';
import { Storage } from '@google-cloud/storage';
import { createGCSLibrary, GCSLibrary } from '../GCSLibrary';
import GCSLogger from '../logger';

const logger = GCSLogger.get('contained', 'GCSLibrary');

/**
 * Specialized factory for contained items with 1 level
 */
export function createContainedGCSLibrary<
  V extends Item<S, L1>,
  S extends string,
  L1 extends string
>(
  keyType: S,
  parentKeyType: L1,
  directoryPaths: [string, string],
  bucketName: string,
  storage?: Storage,
  options?: Partial<Library.Options<V, S, L1>>
): GCSLibrary<V, S, L1> {
  logger.default('createContainedGCSLibrary', {
    keyType,
    parentKeyType,
    directoryPaths,
    bucketName
  });

  const kta = [keyType, parentKeyType] as ItemTypeArray<S, L1>;

  return createGCSLibrary<V, S, L1>(
    kta,
    [...directoryPaths],
    bucketName,
    storage || null,
    options || null,
    null
  );
}

/**
 * Specialized factory for contained items with 2 levels
 */
export function createContainedGCSLibrary2<
  V extends Item<S, L1, L2>,
  S extends string,
  L1 extends string,
  L2 extends string
>(
  keyType: S,
  parentKeyTypes: [L1, L2],
  directoryPaths: [string, string, string],
  bucketName: string,
  storage?: Storage,
  options?: Partial<Library.Options<V, S, L1, L2>>
): GCSLibrary<V, S, L1, L2> {
  logger.default('createContainedGCSLibrary2', {
    keyType,
    parentKeyTypes,
    directoryPaths,
    bucketName
  });

  const kta = [keyType, ...parentKeyTypes] as ItemTypeArray<S, L1, L2>;

  return createGCSLibrary<V, S, L1, L2>(
    kta,
    [...directoryPaths],
    bucketName,
    storage || null,
    options || null,
    null
  );
}
