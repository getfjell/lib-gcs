import { Item } from '@fjell/core';
import * as Library from '@fjell/lib';
import LibLogger from '../logger';

const logger = LibLogger.get('contained/GCSLibrary');

/**
 * Contained GCS Library Interface
 * Placeholder for now
 */
export interface GCSLibrary<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  operations: Library.Contained.Operations<V, S, L1, L2, L3, L4, L5>;
}

logger.default('Contained GCS Library module loaded');

