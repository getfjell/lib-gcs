import { beforeEach, describe, expect, it } from 'vitest';
import { createPrimaryGCSLibrary } from '../../src/primary/GCSLibrary';
import { createGCSLibrary } from '../../src/GCSLibrary';
import { Item } from "@fjell/types";
import { Registry } from '@fjell/lib';
import { createMockStorage } from '../mocks/storageMock';

interface TestUser extends Item<'user'> {
  name: string;
}

describe('Registry Integration', () => {
  let mockStorage: any;
  let registry: Registry;

  beforeEach(() => {
    mockStorage = createMockStorage();
    registry = {} as Registry;
  });

  it('should accept registry parameter', () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any,
      {},
      registry
    );

    expect(library).toBeDefined();
    expect(library.registry).toEqual(registry);
  });

  it('should create default registry if not provided', () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any
    );

    expect(library).toBeDefined();
    expect(library.registry).toBeDefined();
  });

  it('should pass registry to operations', () => {
    const library = createGCSLibrary<TestUser, 'user'>(
      ['user'],
      ['users'],
      'test-bucket',
      mockStorage as any,
      null,
      null,
      registry
    );

    expect(library.registry).toEqual(registry);
    expect(library.operations).toBeDefined();
  });

  it('should share registry between multiple libraries', () => {
    const sharedRegistry = {} as Registry;

    const userLib = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any,
      {},
      sharedRegistry
    );

    const postLib = createPrimaryGCSLibrary(
      'post',
      'posts',
      'test-bucket',
      mockStorage as any,
      {},
      sharedRegistry
    );

    expect(userLib.registry).toEqual(sharedRegistry);
    expect(postLib.registry).toEqual(sharedRegistry);
    expect(userLib.registry).toEqual(postLib.registry);
  });

  it('should have coordinate information', () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any
    );

    expect(library.coordinate).toBeDefined();
    expect(library.coordinate.kta).toEqual(['user']);
  });

  it('should work with wrapOperations from @fjell/lib', () => {
    // wrapOperations is called internally by createOperations
    // This test verifies it doesn't throw
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any,
      {
        hooks: {
          preCreate: async (item) => item,
          postCreate: async (item) => item
        }
      } as any,
      registry
    );

    expect(library.operations).toBeDefined();
    expect(typeof library.operations.create).toBe('function');
    expect(typeof library.operations.update).toBe('function');
  });
});

