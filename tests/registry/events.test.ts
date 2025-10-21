import { beforeEach, describe, expect, it } from 'vitest';
import { createPrimaryGCSLibrary } from '../../src/primary/GCSLibrary';
import { Item } from '@fjell/core';
import { Registry } from '@fjell/lib';
import { createMockStorage } from '../mocks/storageMock';

interface TestUser extends Item<'user'> {
  name: string;
  email: string;
}

describe('Event Emission', () => {
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  it('should create library with event support via wrapOperations', () => {
    const registry = {} as Registry;
    
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any,
      {},
      registry
    );

    // Library.wrapOperations handles event emission
    expect(library).toBeDefined();
    expect(library.registry).toEqual(registry);
  });

  it('should support hooks which are part of event system', async () => {
    let preCreateCalled = false;
    let postCreateCalled = false;

    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any,
      {
        hooks: {
          preCreate: async (item) => {
            preCreateCalled = true;
            return item;
          },
          postCreate: async (item) => {
            postCreateCalled = true;
            return item;
          }
        }
      } as any
    );

    await library.operations.create({
      name: 'Alice',
      email: 'alice@test.com'
    });

    expect(preCreateCalled).toBe(true);
    expect(postCreateCalled).toBe(true);
  });

  it('should support validators which are part of event system', async () => {
    let validateCalled = false;

    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any,
      {
        validators: {
          onCreate: async () => {
            validateCalled = true;
            return true; // Valid
          }
        }
      } as any
    );

    await library.operations.create({
      name: 'Bob',
      email: 'bob@test.com'
    });

    expect(validateCalled).toBe(true);
  });

  it('should propagate operations through wrapped system', async () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any
    );

    // All operations should be wrapped
    expect(typeof library.operations.create).toBe('function');
    expect(typeof library.operations.update).toBe('function');
    expect(typeof library.operations.remove).toBe('function');
    expect(typeof library.operations.get).toBe('function');
    expect(typeof library.operations.all).toBe('function');
    expect(typeof library.operations.one).toBe('function');

    // Extended operations from wrapOperations
    expect(typeof library.operations.find).toBe('function');
    expect(typeof library.operations.action).toBe('function');
    expect(typeof library.operations.facet).toBe('function');
  });
});

