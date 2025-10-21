import { Coordinate, createCoordinate, Item, ItemTypeArray } from '@fjell/core';
import * as Library from '@fjell/lib';
import { createOptions, Options } from './Options';
import GCSLogger from './logger';

const logger = GCSLogger.get('Definition');

/**
 * GCS Library Definition
 */
export interface Definition<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>;
  options: Options<V, S, L1, L2, L3, L4, L5>;
  bucketName: string;
  directoryPaths: string[];
  basePath: string;
}

/**
 * Create a GCS library definition
 */
export function createDefinition<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  kta: ItemTypeArray<S, L1, L2, L3, L4, L5>,
  scopes: string[],
  directoryPaths: string[],
  bucketName: string,
  libOptions?: Partial<Library.Options<V, S, L1, L2, L3, L4, L5>> & Partial<Options<V, S, L1, L2, L3, L4, L5>>,
  basePath?: string
): Definition<V, S, L1, L2, L3, L4, L5> {
  logger.default('createDefinition', { kta, scopes, directoryPaths, bucketName, basePath });

  // Validate inputs
  if (!bucketName || bucketName.trim() === '') {
    throw new Error('bucketName is required and cannot be empty');
  }

  if (directoryPaths.length !== kta.length) {
    throw new Error(
      `directoryPaths length (${directoryPaths.length}) must match kta length (${kta.length})`
    );
  }

  // Validate directory paths don't contain invalid characters
  for (const path of directoryPaths) {
    if (path.includes('..') || path.includes('//') || path.startsWith('/')) {
      throw new Error(`Invalid directory path: ${path}. Paths cannot contain '..' or '//' or start with '/'`);
    }
  }

  // Create coordinate
  const coordinate = createCoordinate(kta, scopes);

  // Create options with defaults
  const options = createOptions<V, S, L1, L2, L3, L4, L5>(
    bucketName,
    libOptions
  );

  // Set base path
  const finalBasePath = basePath || libOptions?.basePath || '';

  return {
    coordinate,
    options,
    bucketName,
    directoryPaths,
    basePath: finalBasePath,
  };
}
