import { BusinessLogicError } from '@fjell/core';
import { describe, expect, it } from 'vitest';
import { handleGCSError } from '../../src/errors/gcsErrorHandler';

describe('handleGCSError', () => {
  it('should throw a BusinessLogicError', () => {
    const error = new Error('Test error');
    const context = 'test-operation';

    expect(() => handleGCSError(error, context)).toThrow(BusinessLogicError);
  });

  it('should include the error message', () => {
    const error = new Error('Test error message');
    const context = 'test-operation';

    try {
      handleGCSError(error, context);
    } catch (e: any) {
      expect(e).toBeInstanceOf(BusinessLogicError);
      expect(e.message).toBe('Test error message');
    }
  });

  it('should handle errors without a message', () => {
    const error = { code: 404 };
    const context = 'get-operation';

    try {
      handleGCSError(error, context);
    } catch (e: any) {
      expect(e).toBeInstanceOf(BusinessLogicError);
      expect(e.message).toBe('Unknown GCS error');
    }
  });

  it('should throw BusinessLogicError type', () => {
    const error = new Error('Test');
    const context = 'test';

    try {
      handleGCSError(error, context);
      // Should not reach here
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e).toBeInstanceOf(BusinessLogicError);
      expect(e.message).toBe('Test');
    }
  });

  it('should handle different error types', () => {
    const error = new Error('File not found');
    const context = 'upload-file';

    try {
      handleGCSError(error, context);
    } catch (e: any) {
      expect(e).toBeInstanceOf(BusinessLogicError);
      expect(e.message).toBe('File not found');
    }
  });
});

