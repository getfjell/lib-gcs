import { BusinessLogicError } from '@fjell/core';
import LibLogger from '../logger';

const logger = LibLogger.get('gcsErrorHandler');

/**
 * Handle GCS-specific errors and convert to Fjell errors
 */
export const handleGCSError = (error: any, context: string): never => {
  logger.error(`GCS error in ${context}`, { error });

  // TODO: Implement GCS-specific error handling
  // For now, throw a generic error
  throw new BusinessLogicError(
    error.message || 'Unknown GCS error',
    `Error in ${context}`,
    false
  );
};

