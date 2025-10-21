import { createCoordinate, ValidationError } from '@fjell/core';
import { describe, expect, it } from 'vitest';
import { validateItem, validateKey, validateLocations } from '../../src/validation/itemValidator';

describe('itemValidator', () => {
  describe('validateItem', () => {
    it('should pass for valid item', () => {
      const coordinate = createCoordinate(['user']);
      const item = { kt: 'user' as const, pk: 'user-123', name: 'Test' };
      
      expect(() => validateItem(item, coordinate)).not.toThrow();
    });

    it('should throw if kt does not match coordinate', () => {
      const coordinate = createCoordinate(['user']);
      const item = { kt: 'post' as const, pk: 'post-123' };
      
      expect(() => validateItem(item, coordinate)).toThrow(ValidationError);
      expect(() => validateItem(item, coordinate)).toThrow("does not match coordinate");
    });

    it('should throw if kt is missing', () => {
      const coordinate = createCoordinate(['user']);
      const item = { pk: 'user-123' } as any;
      
      expect(() => validateItem(item, coordinate)).toThrow(ValidationError);
      expect(() => validateItem(item, coordinate)).toThrow('must have kt and pk');
    });

    it('should throw if pk is missing', () => {
      const coordinate = createCoordinate(['user']);
      const item = { kt: 'user' as const } as any;
      
      expect(() => validateItem(item, coordinate)).toThrow(ValidationError);
    });

    it('should throw if pk contains invalid characters', () => {
      const coordinate = createCoordinate(['user']);
      const item = { kt: 'user' as const, pk: 'user/123' }; // Contains /
      
      expect(() => validateItem(item, coordinate)).toThrow(ValidationError);
      expect(() => validateItem(item, coordinate)).toThrow('invalid characters');
    });

    it('should throw for backslash in pk', () => {
      const coordinate = createCoordinate(['user']);
      const item = { kt: 'user' as const, pk: 'user\\123' };
      
      expect(() => validateItem(item, coordinate)).toThrow(ValidationError);
    });
  });

  describe('validateKey', () => {
    it('should pass for valid PriKey', () => {
      const coordinate = createCoordinate(['user']);
      const key = { kt: 'user' as const, pk: 'user-123' };
      
      expect(() => validateKey(key, coordinate)).not.toThrow();
    });

    it('should pass for valid ComKey', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const key = {
        kt: 'comment' as const,
        pk: 'comment-123',
        loc: [{ kt: 'post' as const, lk: 'post-456' }]
      };
      
      expect(() => validateKey(key, coordinate)).not.toThrow();
    });

    it('should throw if kt does not match coordinate', () => {
      const coordinate = createCoordinate(['user']);
      const key = { kt: 'post' as const, pk: 'post-123' };
      
      expect(() => validateKey(key, coordinate)).toThrow(ValidationError);
    });

    it('should throw if pk is empty', () => {
      const coordinate = createCoordinate(['user']);
      const key = { kt: 'user' as const, pk: '' };
      
      expect(() => validateKey(key, coordinate)).toThrow(ValidationError);
    });

    it('should throw if ComKey is missing locations', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const key = { kt: 'comment' as const, pk: 'c-123', loc: [] };
      
      expect(() => validateKey(key, coordinate)).toThrow(ValidationError);
    });

    it('should throw if location count does not match coordinate', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const key = {
        kt: 'comment' as const,
        pk: 'c-123',
        loc: [
          { kt: 'user' as const, lk: 'u-1' },
          { kt: 'post' as const, lk: 'p-1' }
        ]
      };
      
      // Coordinate expects 1 location, but key has 2
      expect(() => validateKey(key, coordinate)).toThrow(ValidationError);
    });
  });

  describe('validateLocations', () => {
    it('should pass for valid locations', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const locations = [{ kt: 'post' as const, lk: 'post-123' }];
      
      expect(() => validateLocations(locations, coordinate)).not.toThrow();
    });

    it('should pass for undefined locations', () => {
      const coordinate = createCoordinate(['user']);
      
      expect(() => validateLocations(undefined, coordinate)).not.toThrow();
    });

    it('should throw if location count does not match', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const locations = [
        { kt: 'user' as const, lk: 'u-1' },
        { kt: 'post' as const, lk: 'p-1' }
      ];
      
      expect(() => validateLocations(locations as any, coordinate)).toThrow(ValidationError);
    });

    it('should throw if location is missing kt', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const locations = [{ lk: 'post-123' }] as any;
      
      expect(() => validateLocations(locations, coordinate)).toThrow(ValidationError);
    });

    it('should throw if location is missing lk', () => {
      const coordinate = createCoordinate(['comment', 'post']);
      const locations = [{ kt: 'post' as const }] as any;
      
      expect(() => validateLocations(locations, coordinate)).toThrow(ValidationError);
    });
  });
});

