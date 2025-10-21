import { BusinessLogicError, ValidationError } from '@fjell/core';
import { describe, expect, it, vi } from 'vitest';
import { validateBucketAccess, validateFileName, validateGCSConfig } from '../../src/validation/configValidator';

describe('configValidator', () => {
  describe('validateGCSConfig', () => {
    it('should pass for valid configuration', () => {
      expect(() =>
        validateGCSConfig('my-bucket', {} as any, ['users'])
      ).not.toThrow();
    });

    it('should throw if bucket name is empty', () => {
      expect(() =>
        validateGCSConfig('', {} as any, ['users'])
      ).toThrow(ValidationError);
    });

    it('should throw if bucket name is too short', () => {
      expect(() =>
        validateGCSConfig('ab', {} as any, ['users'])
      ).toThrow(ValidationError);
    });

    it('should throw if bucket name is too long', () => {
      const longName = 'a'.repeat(64);
      expect(() =>
        validateGCSConfig(longName, {} as any, ['users'])
      ).toThrow(ValidationError);
    });

    it('should throw for invalid bucket name format', () => {
      expect(() =>
        validateGCSConfig('My-Bucket', {} as any, ['users']) // Uppercase not allowed
      ).toThrow(ValidationError);
    });

    it('should throw if directory paths is empty', () => {
      expect(() =>
        validateGCSConfig('my-bucket', {} as any, [])
      ).toThrow(ValidationError);
    });

    it('should throw for invalid directory paths', () => {
      expect(() =>
        validateGCSConfig('my-bucket', {} as any, ['../users'])
      ).toThrow(ValidationError);
      
      expect(() =>
        validateGCSConfig('my-bucket', {} as any, ['/users'])
      ).toThrow(ValidationError);
      
      expect(() =>
        validateGCSConfig('my-bucket', {} as any, ['users//data'])
      ).toThrow(ValidationError);
    });
  });

  describe('validateBucketAccess', () => {
    it('should pass when bucket exists and is accessible', async () => {
      const mockBucket = {
        exists: vi.fn().mockResolvedValue([true]),
        getFiles: vi.fn().mockResolvedValue([[]]),
      };

      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket),
      };

      await expect(
        validateBucketAccess(mockStorage as any, 'my-bucket')
      ).resolves.not.toThrow();
    });

    it('should throw BusinessLogicError if bucket does not exist', async () => {
      const mockBucket = {
        exists: vi.fn().mockResolvedValue([false]),
      };

      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket),
      };

      await expect(
        validateBucketAccess(mockStorage as any, 'missing-bucket')
      ).rejects.toThrow(BusinessLogicError);
    });

    it('should throw BusinessLogicError for permission denied', async () => {
      const mockBucket = {
        exists: vi.fn().mockResolvedValue([true]),
        getFiles: vi.fn().mockRejectedValue({ code: 403, message: 'Forbidden' }),
      };

      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket),
      };

      await expect(
        validateBucketAccess(mockStorage as any, 'no-access-bucket')
      ).rejects.toThrow(BusinessLogicError);
    });

    it('should throw BusinessLogicError for other errors', async () => {
      const mockBucket = {
        exists: vi.fn().mockResolvedValue([true]),
        getFiles: vi.fn().mockRejectedValue(new Error('Unknown error')),
      };

      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket),
      };

      await expect(
        validateBucketAccess(mockStorage as any, 'error-bucket')
      ).rejects.toThrow(BusinessLogicError);
    });
  });

  describe('validateFileName', () => {
    it('should pass for valid filenames', () => {
      expect(() => validateFileName('file.txt')).not.toThrow();
      expect(() => validateFileName('my-audio-file.wav')).not.toThrow();
      expect(() => validateFileName('subfolder/file.jpg')).not.toThrow();
    });

    it('should throw for empty filename', () => {
      expect(() => validateFileName('')).toThrow(ValidationError);
      expect(() => validateFileName('   ')).toThrow(ValidationError);
    });

    it('should throw for filenames with invalid characters', () => {
      expect(() => validateFileName('file\0.txt')).toThrow(ValidationError);
      expect(() => validateFileName('file\r\n.txt')).toThrow(ValidationError);
    });
  });
});

