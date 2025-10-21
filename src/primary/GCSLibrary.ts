import { Item } from '@fjell/core';
import * as Library from '@fjell/lib';
import LibLogger from '../logger';

const logger = LibLogger.get('primary/GCSLibrary');

/**
 * Primary GCS Library Interface
 * Placeholder for now
 */
export interface GCSLibrary<
  V extends Item<S>,
  S extends string
> {
  operations: Library.Primary.Operations<V, S>;
}

logger.default('Primary GCS Library module loaded');

