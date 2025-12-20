import { ComKey, Coordinate, Item, LocKeyArray, PriKey } from '@fjell/types';
import { isComKey, isPriKey, ValidationError } from '@fjell/core';
import GCSLogger from '../logger';

const logger = GCSLogger.get('validation', 'itemValidator');

/**
 * Validates item structure matches coordinate
 */
export function validateItem<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
  item: Partial<Item<S, L1, L2, L3, L4, L5>>,
  coordinate: Coordinate<S, L1, L2, L3, L4, L5>
): void {
  logger.default('validateItem', { item, coordinate });

  // Validate kt matches coordinate
  if (item.kt && item.kt !== coordinate.kta[0]) {
    throw new ValidationError(
      `Item key type '${item.kt}' does not match coordinate '${coordinate.kta[0]}'`,
      [coordinate.kta[0]],
      'Ensure item.kt matches the library coordinate'
    );
  }

  // Validate required fields
  if (!item.kt || !item.pk) {
    throw new ValidationError(
      'Item must have kt and pk properties',
      ['kt', 'pk'],
      'Provide both kt (key type) and pk (primary key)'
    );
  }

  // Validate pk doesn't contain invalid characters for GCS file names
  const pkStr = String(item.pk);
  if (pkStr.includes('/') || pkStr.includes('\\') || pkStr.includes('\0')) {
    throw new ValidationError(
      `Primary key contains invalid characters: ${item.pk}`,
      ['/', '\\', '\0'],
      'Primary keys cannot contain /, \\, or null characters'
    );
  }

  logger.default('Item validation passed');
}

/**
 * Validates key matches coordinate
 */
export function validateKey(
  key: PriKey<any> | ComKey<any, any, any, any, any, any>,
  coordinate: Coordinate<any, any, any, any, any, any>
): void {
  logger.default('validateKey', { key, coordinate });

  // Validate kt matches coordinate
  if (key.kt !== coordinate.kta[0]) {
    throw new ValidationError(
      `Key type '${key.kt}' does not match coordinate '${coordinate.kta[0]}'`,
      [coordinate.kta[0]],
      'Ensure key.kt matches the library coordinate'
    );
  }

  // Validate pk
  if (!key.pk || key.pk === '') {
    throw new ValidationError(
      'Key pk cannot be empty',
      ['pk'],
      'Provide a valid primary key'
    );
  }

  // Validate key type matches coordinate hierarchy
  const expectedLocations = coordinate.kta.length - 1;
  if (expectedLocations > 0) {
    if (!isComKey(key)) {
      throw new ValidationError(
        'ComKey must have locations',
        ['loc'],
        'Provide loc array for contained items'
      );
    }
    const comKey = key as ComKey<any, any, any, any, any, any>;
    // Validate location count matches coordinate
    if ((comKey.loc as any[]).length !== expectedLocations) {
      throw new ValidationError(
        `ComKey has ${(comKey.loc as any[]).length} locations but coordinate expects ${expectedLocations}`,
        [String(expectedLocations)],
        `Provide exactly ${expectedLocations} location(s)`
      );
    }
  } else {
    if (!isPriKey(key)) {
      throw new ValidationError(
        'Primary library requires a PriKey',
        ['key'],
        'Provide a primary key without locations'
      );
    }
  }

  logger.default('Key validation passed');
}

/**
 * Validates locations match coordinate
 */
export function validateLocations(
  locations: LocKeyArray<any, any, any, any, any> | undefined,
  coordinate: Coordinate<any, any, any, any, any, any>
): void {
  logger.default('validateLocations', { locations, coordinate });

  if (!locations || (locations as any[]).length === 0) {
    logger.default('No locations to validate');
    return;
  }

  // For contained items, validate location count
  const expectedLocations = coordinate.kta.length - 1;
  const locArray = locations as any[];
  
  if (locArray.length !== expectedLocations) {
    throw new ValidationError(
      `Locations array has ${locArray.length} items but coordinate expects ${expectedLocations}`,
      [String(expectedLocations)],
      `Provide exactly ${expectedLocations} location(s)`
    );
  }

  // Validate each location has kt and lk
  for (let i = 0; i < locArray.length; i++) {
    const location = locArray[i];
    if (!location.kt || !location.lk) {
      throw new ValidationError(
        `Location at index ${i} is missing kt or lk`,
        ['kt', 'lk'],
        'Each location must have both kt and lk properties'
      );
    }
  }

  logger.default('Locations validation passed');
}

