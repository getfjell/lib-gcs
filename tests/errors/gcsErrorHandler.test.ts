import {
  BusinessLogicError,
  NotFoundError,
  PermissionError,
  ValidationError
} from '@fjell/core';
import { describe, expect, it } from 'vitest';
import {
  handleGCSError,
  isNetworkError,
  isNotFoundError,
  isPermissionError,
  isRetryableError,
  wrapGCSOperation
} from '../../src/errors/gcsErrorHandler';

describe('gcsErrorHandler', () => {
  describe('handleGCSError', () => {
    it('should convert 404 to NotFoundError', () => {
      const error = { code: 404, message: 'Not found' };
      const result = handleGCSError(error, 'get', { key: { kt: 'test', pk: '123' } });
      
      expect(result).toBeInstanceOf(NotFoundError);
      expect(result.message).toContain('Not found');
    });

    it('should convert 403 to PermissionError', () => {
      const error = { code: 403, message: 'Forbidden' };
      const result = handleGCSError(error, 'create', {});
      
      expect(result).toBeInstanceOf(PermissionError);
      expect(result.message).toContain('Permission denied');
    });

    it('should convert 401 to PermissionError', () => {
      const error = { code: 401, message: 'Unauthorized' };
      const result = handleGCSError(error, 'get', {});
      
      expect(result).toBeInstanceOf(PermissionError);
      expect(result.message).toContain('Authentication required');
    });

    it('should convert 409 to BusinessLogicError with retry suggestion', () => {
      const error = { code: 409, message: 'Conflict' };
      const result = handleGCSError(error, 'update', {});
      
      expect(result).toBeInstanceOf(BusinessLogicError);
      expect(result.message).toContain('Conflict');
    });

    it('should convert 429 to BusinessLogicError', () => {
      const error = { code: 429, message: 'Too many requests' };
      const result = handleGCSError(error, 'all', {});
      
      expect(result).toBeInstanceOf(BusinessLogicError);
      expect(result.message).toContain('Rate limit');
    });

    it('should convert 500 to BusinessLogicError with retry suggestion', () => {
      const error = { code: 500, message: 'Internal error' };
      const result = handleGCSError(error, 'create', {});
      
      expect(result).toBeInstanceOf(BusinessLogicError);
      expect(result.message).toContain('GCS service error');
    });

    it('should convert 400 to ValidationError', () => {
      const error = { code: 400, message: 'Bad request' };
      const result = handleGCSError(error, 'create', {});
      
      expect(result).toBeInstanceOf(ValidationError);
      expect(result.message).toContain('Invalid request');
    });

    it('should detect bucket not found errors', () => {
      const error = { message: 'Bucket not found: my-bucket' };
      const result = handleGCSError(error, 'get', { bucketName: 'my-bucket' });
      
      expect(result).toBeInstanceOf(BusinessLogicError);
      expect(result.message).toContain('Bucket not found');
    });

    it('should detect network errors', () => {
      const error = { code: 'ENOTFOUND', message: 'Network error' };
      const result = handleGCSError(error, 'get', {});
      
      expect(result).toBeInstanceOf(BusinessLogicError);
      expect(result.message).toContain('Network error');
    });

    it('should default to BusinessLogicError for unknown errors', () => {
      const error = { message: 'Unknown error' };
      const result = handleGCSError(error, 'unknown', {});
      
      expect(result).toBeInstanceOf(BusinessLogicError);
    });
  });

  describe('wrapGCSOperation', () => {
    it('should return result for successful operation', async () => {
      const operation = async () => 'success';
      const result = await wrapGCSOperation(operation, 'test', {});
      expect(result).toBe('success');
    });

    it('should wrap error for failed operation', async () => {
      const operation = async () => {
        throw { code: 404, message: 'Not found' };
      };

      await expect(
        wrapGCSOperation(operation, 'test', { key: 'test-key' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('isNotFoundError', () => {
    it('should return true for 404 errors', () => {
      expect(isNotFoundError({ code: 404 })).toBe(true);
      expect(isNotFoundError({ code: 'NOT_FOUND' })).toBe(true);
    });

    it('should return true for NotFoundError instances', () => {
      const error = new NotFoundError('Not found', 'test', {});
      expect(isNotFoundError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isNotFoundError({ code: 500 })).toBe(false);
    });
  });

  describe('isPermissionError', () => {
    it('should return true for permission errors', () => {
      expect(isPermissionError({ code: 403 })).toBe(true);
      expect(isPermissionError({ code: 401 })).toBe(true);
      expect(isPermissionError({ code: 'PERMISSION_DENIED' })).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isPermissionError({ code: 404 })).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network error codes', () => {
      expect(isNetworkError({ code: 'ENOTFOUND' })).toBe(true);
      expect(isNetworkError({ code: 'ECONNREFUSED' })).toBe(true);
      expect(isNetworkError({ code: 'ETIMEDOUT' })).toBe(true);
    });

    it('should return true for network error messages', () => {
      expect(isNetworkError({ message: 'Network error occurred' })).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isNetworkError({ code: 404 })).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable codes', () => {
      expect(isRetryableError({ code: 409 })).toBe(true);
      expect(isRetryableError({ code: 429 })).toBe(true);
      expect(isRetryableError({ code: 500 })).toBe(true);
      expect(isRetryableError({ code: 503 })).toBe(true);
    });

    it('should return true for network errors', () => {
      expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError({ code: 404 })).toBe(false);
      expect(isRetryableError({ code: 400 })).toBe(false);
    });
  });
});
