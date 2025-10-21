import { Coordinate, Item } from '@fjell/core';
import { Options } from './Options';
import LibLogger from './logger';

const logger = LibLogger.get('Definition');

/**
 * GCS Library Definition Builder
 */
export interface GCSLibraryDefinition<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>;
  bucketName: string;
  storage: any; // Will be typed properly later
  options: Options<V, S, L1, L2, L3, L4, L5>;
}

export const createDefinition = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    coordinate: Coordinate<S, L1, L2, L3, L4, L5>,
    bucketName: string,
    storage: any,
    options?: Options<V, S, L1, L2, L3, L4, L5>
  ): GCSLibraryDefinition<V, S, L1, L2, L3, L4, L5> => {
  logger.default('createDefinition', { coordinate, bucketName });

  return {
    coordinate,
    bucketName,
    storage,
    options: options || {},
  } as GCSLibraryDefinition<V, S, L1, L2, L3, L4, L5>;
};

