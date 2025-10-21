import { createCoordinate } from '@fjell/core';
import { Registry } from '@fjell/lib';
import { describe, expect, it } from 'vitest';
import { createGCSLibraryFactory } from '../src/GCSLibraryFactory';

describe('createGCSLibraryFactory', () => {
  it('should create a factory function', () => {
    const storage = { mock: 'storage' };
    const operations = {} as any;
    const options = {} as any;
    const bucketName = 'test-bucket';

    const factory = createGCSLibraryFactory(
      storage,
      operations,
      options,
      bucketName
    );

    expect(factory).toBeDefined();
    expect(typeof factory).toBe('function');
  });

  it('should return a library instance when factory is called', () => {
    const storage = { mock: 'storage' };
    const operations = {} as any;
    const options = {} as any;
    const bucketName = 'test-bucket';

    const factory = createGCSLibraryFactory(
      storage,
      operations,
      options,
      bucketName
    );

    const coordinate = createCoordinate(['item']);
    const mockRegistry = {} as Registry;
    const context = { registry: mockRegistry };

    const library = factory(coordinate, context);

    expect(library).toBeDefined();
    expect(library.bucketName).toBe(bucketName);
    expect(library.coordinate).toBe(coordinate);
  });

  it('should pass all components to the library', () => {
    const storage = { mock: 'storage', client: true };
    const operations = { get: vi.fn() } as any;
    const options = { mode: 'full' } as any;
    const bucketName = 'production-bucket';

    const factory = createGCSLibraryFactory(
      storage,
      operations,
      options,
      bucketName
    );

    const coordinate = createCoordinate(['user']);
    const mockRegistry = {} as Registry;
    const context = { registry: mockRegistry };

    const library = factory(coordinate, context);

    expect(library.storage).toBe(storage);
    expect(library.operations).toBe(operations);
    expect(library.options).toBe(options);
  });

  it('should handle contained item coordinates', () => {
    const storage = { mock: 'storage' };
    const operations = {} as any;
    const options = {} as any;
    const bucketName = 'test-bucket';

    const factory = createGCSLibraryFactory(
      storage,
      operations,
      options,
      bucketName
    );

    const coordinate = createCoordinate(['comment', 'post', 'user']);
    const mockRegistry = {} as Registry;
    const context = { registry: mockRegistry };

    const library = factory(coordinate, context);

    expect(library.coordinate).toBe(coordinate);
  });
});

