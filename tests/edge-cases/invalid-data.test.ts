import { describe, expect, it } from 'vitest';
import { validateItem, validateKey, validateLocations } from '../../src/validation/itemValidator';
import { validateFileName, validateGCSConfig } from '../../src/validation/configValidator';
import { createCoordinate, ValidationError } from '@fjell/core';

describe('Invalid Data Edge Cases', () => {
  describe('Invalid Characters in Primary Keys', () => {
    it('should reject pk with forward slash', () => {
      const coordinate = createCoordinate(['user']);
      const item = { kt: 'user' as const, pk: 'user/123' };
      
      expect(() => validateItem(item, coordinate)).toThrow(ValidationError);
      expect(() => validateItem(item, coordinate)).toThrow('invalid characters');
    });

    it('should reject pk with backslash', () => {
      const coordinate = createCoordinate(['user']);
      const item = { kt: 'user' as const, pk: 'user\\123' };
      
      expect(() => validateItem(item, coordinate)).toThrow(ValidationError);
    });

    it('should reject pk with null character', () => {
      const coordinate = createCoordinate(['user']);
      const item = { kt: 'user' as const, pk: 'user\x00123' };
      
      expect(() => validateItem(item, coordinate)).toThrow(ValidationError);
    });
  });

  describe('Invalid Filenames', () => {
    it('should reject empty filename', () => {
      expect(() => validateFileName('')).toThrow(ValidationError);
    });

    it('should reject filename with null character', () => {
      expect(() => validateFileName('file\x00.txt')).toThrow(ValidationError);
    });

    it('should reject filename with carriage return', () => {
      expect(() => validateFileName('file\x0D.txt')).toThrow(ValidationError);
    });

    it('should reject filename with newline', () => {
      expect(() => validateFileName('file\x0A.txt')).toThrow(ValidationError);
    });
  });

  describe('Invalid Keys', () => {
    it('should reject key with wrong kt', () => {
      const coordinate = createCoordinate(['user']);
      const key = { kt: 'post' as const, pk: 'post-123' };
      
      expect(() => validateKey(key, coordinate)).toThrow(ValidationError);
    });

    it('should reject key with empty pk', () => {
      const coordinate = createCoordinate(['user']);
      const key = { kt: 'user' as const, pk: '' };
      
      expect(() => validateKey(key, coordinate)).toThrow(ValidationError);
    });

    it('should reject ComKey without locations', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const key = { kt: 'comment' as const, pk: 'c-123', loc: [] };
      
      expect(() => validateKey(key, coordinate)).toThrow(ValidationError);
    });

    it('should reject ComKey with wrong location count', () => {
      const coordinate = createCoordinate(['comment', 'post']); // Expects 1 location
      const key = {
        kt: 'comment' as const,
        pk: 'c-123',
        loc: [
          { kt: 'user' as const, lk: 'u-1' },
          { kt: 'post' as const, lk: 'p-1' }
        ]
      };
      
      expect(() => validateKey(key, coordinate)).toThrow(ValidationError);
    });
  });

  describe('Invalid Configuration', () => {
    it('should reject empty bucket name', () => {
      expect(() =>
        validateGCSConfig('', undefined, ['users'])
      ).toThrow(ValidationError);
    });

    it('should reject bucket name with uppercase', () => {
      expect(() =>
        validateGCSConfig('My-Bucket', undefined, ['users'])
      ).toThrow(ValidationError);
    });

    it('should reject bucket name too short', () => {
      expect(() =>
        validateGCSConfig('ab', undefined, ['users'])
      ).toThrow(ValidationError);
    });

    it('should reject bucket name too long', () => {
      const longName = 'a'.repeat(64);
      expect(() =>
        validateGCSConfig(longName, undefined, ['users'])
      ).toThrow(ValidationError);
    });

    it('should reject directory path with ..', () => {
      expect(() =>
        validateGCSConfig('my-bucket', undefined, ['../users'])
      ).toThrow(ValidationError);
    });

    it('should reject directory path starting with /', () => {
      expect(() =>
        validateGCSConfig('my-bucket', undefined, ['/users'])
      ).toThrow(ValidationError);
    });
  });

  describe('Invalid Locations', () => {
    it('should reject locations with wrong count', () => {
      const coordinate = createCoordinate(['comment', 'post']); // Expects 1 location
      const locations = [
        { kt: 'user' as const, lk: 'u-1' },
        { kt: 'post' as const, lk: 'p-1' }
      ];
      
      expect(() => validateLocations(locations as any, coordinate)).toThrow(ValidationError);
    });

    it('should reject location missing kt', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const locations = [{ lk: 'post-123' }] as any;
      
      expect(() => validateLocations(locations, coordinate)).toThrow(ValidationError);
    });

    it('should reject location missing lk', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const locations = [{ kt: 'post' as const }] as any;
      
      expect(() => validateLocations(locations, coordinate)).toThrow(ValidationError);
    });
  });
});

