import { describe, expect, it } from 'vitest';
import { createDefinition } from '../src/Definition';
import { createCoordinate } from '@fjell/core';

describe('createDefinition', () => {
  it('should create a definition with all required fields', () => {
    const coordinate = createCoordinate(['item']);
    const bucketName = 'test-bucket';
    const storage = { mock: 'storage' };

    const definition = createDefinition(
      coordinate,
      bucketName,
      storage
    );

    expect(definition).toBeDefined();
    expect(definition.coordinate).toBe(coordinate);
    expect(definition.bucketName).toBe(bucketName);
    expect(definition.storage).toBe(storage);
    expect(definition.options).toBeDefined();
  });

  it('should create a definition with custom options', () => {
    const coordinate = createCoordinate(['item']);
    const bucketName = 'test-bucket';
    const storage = { mock: 'storage' };
    const options = {
      hooks: {
        preCreate: async (item: any) => item,
      },
    };

    const definition = createDefinition(
      coordinate,
      bucketName,
      storage,
      options as any
    );

    expect(definition.options).toBeDefined();
  });

  it('should handle contained item coordinates', () => {
    const coordinate = createCoordinate(['comment', 'post']);
    const bucketName = 'comments-bucket';
    const storage = { mock: 'storage' };

    const definition = createDefinition(
      coordinate,
      bucketName,
      storage
    );

    expect(definition.coordinate).toBe(coordinate);
    expect(definition.bucketName).toBe(bucketName);
  });

  it('should default options to empty object when not provided', () => {
    const coordinate = createCoordinate(['item']);
    const bucketName = 'test-bucket';
    const storage = { mock: 'storage' };

    const definition = createDefinition(
      coordinate,
      bucketName,
      storage
    );

    expect(definition.options).toEqual({});
  });
});

