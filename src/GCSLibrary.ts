import * as Library from '@fjell/lib';
import { Coordinate, Item, ItemTypeArray } from '@fjell/core';
import { Registry } from '@fjell/lib';
import { Storage } from '@google-cloud/storage';
import { Options } from './Options';
import { createDefinition } from './Definition';
import { createOperations } from './Operations';
import GCSLogger from './logger';

const logger = GCSLogger.get('GCSLibrary');

/**
 * The GCSLibrary interface extends the Library from @fjell/lib
 * and adds GCS-specific properties and operations.
 */
export interface GCSLibrary<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends Library.Library<V, S, L1, L2, L3, L4, L5> {
  /** GCS Storage instance for cloud storage operations */
  storage: Storage;
  
  /** The bucket name where items are stored */
  bucketName: string;
}

/**
 * Creates a new GCSLibrary with pre-created components
 */
export function createGCSLibraryFromComponents<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  registry: Registry,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
  storage: Storage,
  bucketName: string,
  operations: Library.Operations<V, S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>
): GCSLibrary<V, S, L1, L2, L3, L4, L5> {
  logger.default('createGCSLibraryFromComponents', {
    coordinate,
    bucketName,
    mode: options.mode
  });

  return {
    registry,
    coordinate,
    storage,
    bucketName,
    operations,
    options,
  } as GCSLibrary<V, S, L1, L2, L3, L4, L5>;
}

/**
 * Creates a new GCSLibrary with the provided raw parameters
 */
export function createGCSLibrary<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  kta: ItemTypeArray<S, L1, L2, L3, L4, L5>,
  directoryPaths: string[],
  bucketName: string,
  storage?: Storage | null,
  libOptions?: Partial<Library.Options<V, S, L1, L2, L3, L4, L5>> & Partial<Options<V, S, L1, L2, L3, L4, L5>> | null,
  scopes?: string[] | null,
  registry?: Registry
): GCSLibrary<V, S, L1, L2, L3, L4, L5> {
  logger.default('createGCSLibrary', { kta, directoryPaths, bucketName, scopes });

  // Create Storage client if not provided
  const storageClient = storage || new Storage();

  // Convert nulls to defaults
  const finalScopes = scopes || [];
  const finalOptions = libOptions || {};
  const finalRegistry = registry || ({} as Registry);

  // Create definition
  const definition = createDefinition<V, S, L1, L2, L3, L4, L5>(
    kta,
    finalScopes,
    directoryPaths,
    bucketName,
    finalOptions
  );

  // Create operations
  const operations = createOperations<V, S, L1, L2, L3, L4, L5>(
    storageClient,
    definition
  );

  // Create coordinate
  const coordinate = definition.coordinate;

  // Assemble library
  return createGCSLibraryFromComponents<V, S, L1, L2, L3, L4, L5>(
    finalRegistry,
    coordinate,
    storageClient,
    bucketName,
    operations,
    definition.options
  );
}

/**
 * Type guard to check if an object is a GCSLibrary
 */
export function isGCSLibrary(library: any): library is GCSLibrary<any, any> {
  if (!library || typeof library !== 'object') {
    return false;
  }
  
  return (
    'storage' in library &&
    'bucketName' in library &&
    'operations' in library &&
    'coordinate' in library
  );
}
