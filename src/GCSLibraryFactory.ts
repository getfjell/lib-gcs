import { Item, ItemTypeArray } from "@fjell/types";
import { Storage } from '@google-cloud/storage';
import { Registry } from '@fjell/lib';
import * as Library from '@fjell/lib';
import { createGCSLibrary, GCSLibrary } from './GCSLibrary';
import GCSLogger from './logger';

const logger = GCSLogger.get('GCSLibraryFactory');

/**
 * Configuration for GCS Library Factory
 */
export interface GCSLibraryFactoryConfig {
  bucketName: string;
  storage?: Storage;
  basePath?: string;
  registry?: Registry;
  useJsonExtension?: boolean;
  mode?: 'full' | 'files-only';
  keySharding?: {
    enabled?: boolean;
    levels?: number;
    charsPerLevel?: number;
  };
  querySafety?: {
    maxScanFiles?: number;
    warnThreshold?: number;
    disableQueryOperations?: boolean;
    downloadConcurrency?: number;
  };
}

/**
 * Factory for creating GCS libraries for primary items
 */
export function createPrimaryGCSLibrary<
  V extends Item<S>,
  S extends string
>(
  keyType: S,
  directoryPath: string,
  config: GCSLibraryFactoryConfig,
  libOptions?: Partial<Library.Options<V, S>>
): GCSLibrary<V, S> {
  logger.default('createPrimaryGCSLibrary', { keyType, directoryPath, config });

  const kta = [keyType] as ItemTypeArray<S>;
  const directoryPaths = [directoryPath];

  const mergedOptions = {
    ...libOptions,
    bucketName: config.bucketName,
    storage: config.storage,
    basePath: config.basePath,
    useJsonExtension: config.useJsonExtension,
    mode: config.mode,
    keySharding: config.keySharding,
    querySafety: config.querySafety,
  };

  return createGCSLibrary<V, S>(
    kta,
    directoryPaths,
    config.bucketName,
    config.storage || null,
    mergedOptions,
    null,
    config.registry
  );
}

/**
 * Factory for creating GCS libraries for contained items (1 level)
 */
export function createContainedGCSLibrary<
  V extends Item<S, L1>,
  S extends string,
  L1 extends string
>(
  keyType: S,
  parentKeyType: L1,
  directoryPaths: [string, string],
  config: GCSLibraryFactoryConfig,
  libOptions?: Partial<Library.Options<V, S, L1>>
): GCSLibrary<V, S, L1> {
  logger.default('createContainedGCSLibrary', {
    keyType,
    parentKeyType,
    directoryPaths,
    config
  });

  const kta = [keyType, parentKeyType] as ItemTypeArray<S, L1>;

  const mergedOptions = {
    ...libOptions,
    bucketName: config.bucketName,
    storage: config.storage,
    basePath: config.basePath,
    useJsonExtension: config.useJsonExtension,
    mode: config.mode,
    keySharding: config.keySharding,
    querySafety: config.querySafety,
  };

  return createGCSLibrary<V, S, L1>(
    kta,
    [...directoryPaths],
    config.bucketName,
    config.storage || null,
    mergedOptions,
    null,
    config.registry
  );
}

/**
 * Factory for creating GCS libraries for contained items (2 levels)
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
  config: GCSLibraryFactoryConfig,
  libOptions?: Partial<Library.Options<V, S, L1, L2>>
): GCSLibrary<V, S, L1, L2> {
  logger.default('createContainedGCSLibrary2', {
    keyType,
    parentKeyTypes,
    directoryPaths,
    config
  });

  const kta = [keyType, ...parentKeyTypes] as ItemTypeArray<S, L1, L2>;

  const mergedOptions = {
    ...libOptions,
    bucketName: config.bucketName,
    storage: config.storage,
    basePath: config.basePath,
    useJsonExtension: config.useJsonExtension,
    mode: config.mode,
    keySharding: config.keySharding,
    querySafety: config.querySafety,
  };

  return createGCSLibrary<V, S, L1, L2>(
    kta,
    [...directoryPaths],
    config.bucketName,
    config.storage || null,
    mergedOptions,
    null,
    config.registry
  );
}
