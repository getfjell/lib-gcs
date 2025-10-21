import { beforeEach, describe, expect, it } from 'vitest';
import { createPrimaryGCSLibrary } from '../../src/primary/GCSLibrary';
import { createContainedGCSLibrary } from '../../src/contained/GCSLibrary';
import { Item } from '@fjell/core';
import { Registry } from '@fjell/lib';
import { createMockStorage } from '../mocks/storageMock';

interface TestUser extends Item<'user'> {
  name: string;
}

interface TestPost extends Item<'post'> {
  title: string;
}

interface TestComment extends Item<'comment', 'post'> {
  text: string;
}

describe('Multi-Library Coordination', () => {
  let mockStorage: any;
  let sharedRegistry: Registry;

  beforeEach(() => {
    mockStorage = createMockStorage();
    sharedRegistry = {} as Registry;
  });

  it('should share registry between multiple libraries', () => {
    const userLib = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any,
      {},
      sharedRegistry
    );

    const postLib = createPrimaryGCSLibrary<TestPost, 'post'>(
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

  it('should coordinate primary and contained libraries', () => {
    const postLib = createPrimaryGCSLibrary<TestPost, 'post'>(
      'post',
      'posts',
      'test-bucket',
      mockStorage as any,
      {},
      sharedRegistry
    );

    const commentLib = createContainedGCSLibrary<TestComment, 'comment', 'post'>(
      'comment',
      'post',
      ['comments', 'posts'],
      'test-bucket',
      mockStorage as any,
      {
        // Options
      } as any,
      sharedRegistry
    );

    expect(postLib.registry).toEqual(sharedRegistry);
    expect(commentLib.registry).toEqual(sharedRegistry);
  });

  it('should support cross-library operations', async () => {
    const userLib = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any,
      {},
      sharedRegistry
    );

    const postLib = createPrimaryGCSLibrary<TestPost, 'post'>(
      'post',
      'posts',
      'test-bucket',
      mockStorage as any,
      {},
      sharedRegistry
    );

    // Create user
    const user = await userLib.operations.create({
      name: 'Alice'
    });

    // Create post (both libraries share registry)
    const post = await postLib.operations.create({
      title: 'Hello World'
    });

    expect(user).toBeDefined();
    expect(post).toBeDefined();
  });

  it('should have independent operations per library', async () => {
    const userLib = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any,
      {},
      sharedRegistry
    );

    const postLib = createPrimaryGCSLibrary<TestPost, 'post'>(
      'post',
      'posts',
      'test-bucket',
      mockStorage as any,
      {},
      sharedRegistry
    );

    // Each library has its own operations
    expect(userLib.operations).not.toBe(postLib.operations);
    
    // But they share the registry
    expect(userLib.registry).toEqual(postLib.registry);
  });

  it('should work without explicit registry (creates default)', () => {
    const userLib = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage as any
    );

    const postLib = createPrimaryGCSLibrary<TestPost, 'post'>(
      'post',
      'posts',
      'test-bucket',
      mockStorage as any
    );

    // Each has its own registry when not shared
    expect(userLib.registry).toBeDefined();
    expect(postLib.registry).toBeDefined();
    // They are different registries
    expect(userLib.registry).not.toBe(postLib.registry);
  });
});

