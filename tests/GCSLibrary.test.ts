import { createCoordinate } from '@fjell/core';
import { Registry } from '@fjell/lib';
import { describe, expect, it } from 'vitest';
import { createGCSLibraryFromComponents } from '../src/GCSLibrary';

describe('createGCSLibraryFromComponents', () => {
  it('should create a GCS library with all components', () => {
    const mockRegistry = {} as Registry;
    const coordinate = createCoordinate(['item']);
    const storage = { mock: 'storage' };
    const operations = {} as any;
    const options = {};
    const bucketName = 'test-bucket';

    const library = createGCSLibraryFromComponents(
      mockRegistry,
      coordinate,
      storage,
      operations,
      options as any,
      bucketName
    );

    expect(library).toBeDefined();
    expect(library.registry).toBe(mockRegistry);
    expect(library.coordinate).toBe(coordinate);
    expect(library.storage).toBe(storage);
    expect(library.operations).toBe(operations);
    expect(library.options).toBe(options);
    expect(library.bucketName).toBe(bucketName);
  });

  it('should handle different bucket names', () => {
    const mockRegistry = {} as Registry;
    const coordinate = createCoordinate(['user']);
    const storage = { mock: 'storage' };
    const operations = {} as any;
    const options = {};
    const bucketName = 'users-production';

    const library = createGCSLibraryFromComponents(
      mockRegistry,
      coordinate,
      storage,
      operations,
      options as any,
      bucketName
    );

    expect(library.bucketName).toBe('users-production');
  });

  it('should handle contained items', () => {
    const mockRegistry = {} as Registry;
    const coordinate = createCoordinate(['comment', 'post']);
    const storage = { mock: 'storage' };
    const operations = {} as any;
    const options = {};
    const bucketName = 'comments-bucket';

    const library = createGCSLibraryFromComponents(
      mockRegistry,
      coordinate,
      storage,
      operations,
      options as any,
      bucketName
    );

    expect(library.coordinate).toBe(coordinate);
  });
});

