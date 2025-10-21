import { Storage } from '@google-cloud/storage';
import { BusinessLogicError, ValidationError } from '@fjell/core';
import GCSLogger from '../logger';

const logger = GCSLogger.get('validation', 'configValidator');

/**
 * Validates library configuration
 */
export function validateGCSConfig(
  bucketName: string,
  storage: Storage | undefined,
  directoryPaths: string[]
): void {
  logger.default('validateGCSConfig', { bucketName, directoryPaths });

  // Validate bucket name
  if (!bucketName || bucketName.trim() === '') {
    throw new ValidationError(
      'Bucket name is required',
      [],
      'Provide a valid bucket name'
    );
  }

  // Validate bucket name format (GCS requirements)
  if (bucketName.length < 3 || bucketName.length > 63) {
    throw new ValidationError(
      'Bucket name must be between 3 and 63 characters',
      [],
      'Use a bucket name between 3-63 characters'
    );
  }

  const bucketNameRegex = /^[a-z0-9][a-z0-9-_.]*[a-z0-9]$/;
  if (!bucketNameRegex.test(bucketName)) {
    throw new ValidationError(
      'Invalid bucket name format. Must contain only lowercase letters, numbers, hyphens, underscores, and dots',
      [],
      'Fix bucket name format'
    );
  }

  // Validate directory paths
  if (!directoryPaths || directoryPaths.length === 0) {
    throw new ValidationError(
      'Directory paths are required',
      [],
      'Provide directory paths array'
    );
  }

  for (const path of directoryPaths) {
    if (!path || path.trim() === '') {
      throw new ValidationError(
        'Directory paths cannot be empty',
        [],
        'Ensure all paths are non-empty strings'
      );
    }

    if (path.includes('..') || path.includes('//') || path.startsWith('/')) {
      throw new ValidationError(
        `Invalid directory path: ${path}`,
        [],
        'Remove invalid characters from path'
      );
    }
  }

  logger.default('Configuration validation passed');
}

/**
 * Validates bucket exists and is accessible
 */
export async function validateBucketAccess(
  storage: Storage,
  bucketName: string
): Promise<void> {
  logger.default('validateBucketAccess', { bucketName });

  try {
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();

    if (!exists) {
      throw new BusinessLogicError(
        `Bucket '${bucketName}' does not exist`,
        'Create bucket or check bucket name',
        false
      );
    }

    // Try to list files to verify we have read access
    await bucket.getFiles({ maxResults: 1 });

    logger.default('Bucket access validated');
  } catch (error: any) {
    if (error instanceof BusinessLogicError || error instanceof ValidationError) {
      throw error;
    }

    if (error.code === 403 || error.code === 'PERMISSION_DENIED') {
      throw new BusinessLogicError(
        `No access to bucket '${bucketName}'. Check permissions.`,
        'Verify GCS permissions',
        false
      );
    }

    throw new BusinessLogicError(
      `Failed to validate bucket access: ${error.message}`,
      'Check GCS configuration',
      false
    );
  }
}

/**
 * Validate file name doesn't contain invalid characters
 */
export function validateFileName(filename: string): void {
  if (!filename || filename.trim() === '') {
    throw new ValidationError(
      'Filename cannot be empty',
      [],
      'Provide a valid filename'
    );
  }

  // GCS doesn't allow certain characters in object names
  const invalidChars = ['\0', '\r', '\n'];
  for (const char of invalidChars) {
    if (filename.includes(char)) {
      throw new ValidationError(
        'Filename contains invalid characters',
        invalidChars,
        'Remove invalid characters from filename'
      );
    }
  }
}

