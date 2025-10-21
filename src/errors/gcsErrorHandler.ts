import {
  BusinessLogicError,
  NotFoundError,
  PermissionError,
  ValidationError
} from '@fjell/core';
import GCSLogger from '../logger';

const logger = GCSLogger.get('gcsErrorHandler');

/**
 * Converts GCS errors to Fjell error types
 */
export function handleGCSError(
  error: any,
  operation: string,
  context: Record<string, any>
): Error {
  logger.error(`GCS error in ${operation}`, { error, context });

  // Extract GCS error code
  const code = error.code || error.statusCode;
  const message = error.message || 'Unknown GCS error';

  // Map GCS errors to Fjell error types
  switch (code) {
    case 404:
    case 'NOT_FOUND':
      return new NotFoundError(
        `Resource not found: ${message}`,
        context.itemType || 'resource',
        context.key
      );

    case 403:
    case 'PERMISSION_DENIED':
    case 'FORBIDDEN':
      return new PermissionError(
        `Permission denied: ${message}`,
        operation,
        [operation]
      );

    case 401:
    case 'UNAUTHENTICATED':
      return new PermissionError(
        `Authentication required: ${message}`,
        'authenticate',
        ['authenticate']
      );

    case 409:
    case 'CONFLICT':
      return new BusinessLogicError(
        `Conflict: ${message}`,
        `Retry ${operation}`,
        true // retryable
      );

    case 429:
    case 'RATE_LIMIT_EXCEEDED':
      return new BusinessLogicError(
        `Rate limit exceeded: ${message}`,
        'Wait and retry',
        true // retryable
      );

    case 500:
    case 502:
    case 503:
    case 'INTERNAL_ERROR':
    case 'UNAVAILABLE':
      return new BusinessLogicError(
        `GCS service error: ${message}`,
        `Retry ${operation}`,
        true // retryable
      );

    case 400:
    case 'INVALID_ARGUMENT':
      return new ValidationError(
        `Invalid request: ${message}`,
        [],
        'Check the request parameters and try again'
      );

    default:
      // Check for specific error messages
      if (message.toLowerCase().includes('bucket') && message.toLowerCase().includes('not found')) {
        return new BusinessLogicError(
          `Bucket not found: ${message}`,
          'Check bucket configuration',
          false
        );
      }

      if (message.toLowerCase().includes('network') || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return new BusinessLogicError(
          `Network error: ${message}`,
          'Check network connection and retry',
          true // retryable
        );
      }

      // Default to BusinessLogicError
      return new BusinessLogicError(
        message,
        `Error in ${operation}`,
        false
      );
  }
}

/**
 * Wraps GCS operations with error handling
 */
export async function wrapGCSOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  context: Record<string, any>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw handleGCSError(error, operationName, context);
  }
}

/**
 * Check if error is a "not found" type error
 */
export function isNotFoundError(error: any): boolean {
  const code = error.code || error.statusCode;
  return code === 404 || code === 'NOT_FOUND' || error instanceof NotFoundError;
}

/**
 * Check if error is a permission/auth error
 */
export function isPermissionError(error: any): boolean {
  const code = error.code || error.statusCode;
  return (
    code === 403 ||
    code === 401 ||
    code === 'PERMISSION_DENIED' ||
    code === 'FORBIDDEN' ||
    code === 'UNAUTHENTICATED'
  );
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const isNetworkCode = (
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ECONNRESET'
  );
  
  const hasNetworkMessage = error.message && typeof error.message === 'string' && error.message.toLowerCase().includes('network');
  
  return isNetworkCode || hasNetworkMessage || false;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const code = error.code || error.statusCode;
  const retryable = (
    code === 409 ||
    code === 429 ||
    code === 500 ||
    code === 502 ||
    code === 503 ||
    code === 'CONFLICT' ||
    code === 'RATE_LIMIT_EXCEEDED' ||
    code === 'INTERNAL_ERROR' ||
    code === 'UNAVAILABLE' ||
    isNetworkError(error)
  );
  
  return retryable ? true : false;
}
