import { describe, expect, it } from 'vitest';
import {
  createGCSLibrary,
  createGCSLibraryFromComponents,
  isGCSLibrary
} from '../src/GCSLibrary';
import { createCoordinate, Item } from '@fjell/core';
import { Registry } from '@fjell/lib';

interface TestItem extends Item<'test'> {
  name: string;
}

describe('GCSLibrary', () => {
  describe('createGCSLibraryFromComponents', () => {
    it('should create library with all components', () => {
      const mockRegistry = {} as Registry;
      const coordinate = createCoordinate(['test']);
      const mockStorage = {} as any;
      const bucketName = 'test-bucket';
      const operations = {} as any;
      const options = { bucketName, mode: 'full' } as any;

      const library = createGCSLibraryFromComponents<TestItem, 'test'>(
        mockRegistry,
        coordinate,
        mockStorage,
        bucketName,
        operations,
        options
      );

      expect(library).toBeDefined();
      expect(library.registry).toBe(mockRegistry);
      expect(library.coordinate).toBe(coordinate);
      expect(library.storage).toBe(mockStorage);
      expect(library.bucketName).toBe(bucketName);
      expect(library.operations).toBe(operations);
      expect(library.options).toBe(options);
    });
  });

  describe('createGCSLibrary', () => {
    it('should create library with all parameters', () => {
      const kta = ['test'] as const;
      const directoryPaths = ['tests'];
      const bucketName = 'test-bucket';
      const mockStorage = {} as any;
      const options = { mode: 'full' as const };
      const scopes = ['read', 'write'];
      const mockRegistry = {} as Registry;

      const library = createGCSLibrary<TestItem, 'test'>(
        kta,
        directoryPaths,
        bucketName,
        mockStorage,
        options,
        scopes,
        mockRegistry
      );

      expect(library).toBeDefined();
      expect(library.bucketName).toBe(bucketName);
      expect(library.storage).toBe(mockStorage);
      expect(library.registry).toBe(mockRegistry);
    });

    it('should create Storage client if not provided', () => {
      const kta = ['test'] as const;
      const directoryPaths = ['tests'];
      const bucketName = 'test-bucket';

      const library = createGCSLibrary<TestItem, 'test'>(
        kta,
        directoryPaths,
        bucketName,
        null,
        null,
        null
      );

      expect(library).toBeDefined();
      expect(library.storage).toBeDefined();
      expect(library.bucketName).toBe(bucketName);
    });

    it('should handle default scopes and options', () => {
      const kta = ['test'] as const;
      const directoryPaths = ['tests'];
      const bucketName = 'test-bucket';

      const library = createGCSLibrary<TestItem, 'test'>(
        kta,
        directoryPaths,
        bucketName
      );

      expect(library).toBeDefined();
      expect(library.options).toBeDefined();
      expect(library.operations).toBeDefined();
    });

    it('should create library for contained items', () => {
      const kta = ['comment', 'post'] as const;
      const directoryPaths = ['comments', 'posts'];
      const bucketName = 'test-bucket';

      const library = createGCSLibrary(
        kta,
        directoryPaths,
        bucketName
      );

      expect(library).toBeDefined();
      expect(library.coordinate.kta).toEqual(['comment', 'post']);
    });
  });

  describe('isGCSLibrary', () => {
    it('should return true for valid GCSLibrary', () => {
      const library = {
        storage: {},
        bucketName: 'test',
        operations: {},
        coordinate: createCoordinate(['test']),
        registry: {},
        options: {}
      };

      expect(isGCSLibrary(library)).toBe(true);
    });

    it('should return false for objects missing required properties', () => {
      expect(isGCSLibrary({})).toBe(false);
      expect(isGCSLibrary({ storage: {} })).toBe(false);
      expect(isGCSLibrary({ bucketName: 'test' })).toBe(false);
      expect(isGCSLibrary(null)).toBe(false);
      expect(isGCSLibrary(undefined)).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isGCSLibrary('string')).toBe(false);
      expect(isGCSLibrary(123)).toBe(false);
      expect(isGCSLibrary(true)).toBe(false);
    });
  });
});
