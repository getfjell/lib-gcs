import { describe, expect, it } from 'vitest';
import { createPrimaryGCSLibrary } from '../../src/primary/GCSLibrary';
import { Item } from "@fjell/types";

interface TestUser extends Item<'user'> {
  name: string;
}

describe('Primary GCSLibrary Helper', () => {
  it('should create library for primary items', () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'users-bucket'
    );

    expect(library).toBeDefined();
    expect(library.bucketName).toBe('users-bucket');
    expect(library.coordinate.kta).toEqual(['user']);
  });

  it('should accept custom storage', () => {
    const mockStorage = {} as any;
    
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'users-bucket',
      mockStorage
    );

    expect(library.storage).toBe(mockStorage);
  });

  it('should accept custom options', () => {
    const options = {
      mode: 'files-only' as const,
      basePath: 'production',
    };

    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'users-bucket',
      null as any,
      options as any
    );

    expect(library.options.mode).toBe('files-only');
    expect(library.options.basePath).toBe('production');
  });

  it('should have all operations available', () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'users-bucket'
    );

    expect(library.operations).toBeDefined();
    expect(typeof library.operations.get).toBe('function');
    expect(typeof library.operations.create).toBe('function');
    expect(typeof library.operations.update).toBe('function');
    expect(typeof library.operations.upsert).toBe('function');
    expect(typeof library.operations.remove).toBe('function');
    expect(typeof library.operations.all).toBe('function');
    expect(typeof library.operations.one).toBe('function');
  });
});
