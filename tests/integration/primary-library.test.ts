import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrimaryGCSLibrary } from '../../src/primary/GCSLibrary';
import { Item } from "@fjell/types";

interface TestUser extends Item<'user'> {
  name: string;
  email: string;
}

describe('Primary Library Integration', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(() => {
    mockFile = {
      exists: vi.fn(),
      download: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    mockBucket = {
      file: vi.fn().mockReturnValue(mockFile),
      getFiles: vi.fn().mockResolvedValue([[]]),
    };

    mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket),
    };
  });

  it('should create a functional primary library', () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage
    );

    expect(library).toBeDefined();
    expect(library.bucketName).toBe('test-bucket');
    expect(library.coordinate.kta).toEqual(['user']);
    expect(library.operations).toBeDefined();
  });

  it('should perform CRUD operations', async () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage
    );

    // Create
    const user: Partial<TestUser> = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const created = await library.operations.create(user, {
      key: { kt: 'user', pk: 'user-123' }
    });

    expect(created.name).toBe('John Doe');
    expect(created.pk).toBe('user-123');
    expect(mockFile.save).toHaveBeenCalled();

    // Get
    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([
      Buffer.from(JSON.stringify(created))
    ]);

    const retrieved = await library.operations.get({ kt: 'user', pk: 'user-123' });
    expect(retrieved?.name).toBe('John Doe');

    // Update
    const updated = await library.operations.update(
      { kt: 'user', pk: 'user-123' },
      { email: 'newemail@example.com' }
    );
    expect(updated.email).toBe('newemail@example.com');
    expect(updated.name).toBe('John Doe'); // Preserved

    // Remove
    const removed = await library.operations.remove({ kt: 'user', pk: 'user-123' });
    expect(removed).toBeDefined();
    expect(mockFile.delete).toHaveBeenCalled();
  });

  it('should support files-only mode', () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage,
      { mode: 'files-only' } as any
    );

    expect(library.options.mode).toBe('files-only');
  });

  it('should support custom options', () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage,
      {
        basePath: 'production',
        keySharding: {
          enabled: true,
          levels: 2
        },
        querySafety: {
          maxScanFiles: 500
        }
      } as any
    );

    expect(library.options.basePath).toBe('production');
    expect(library.options.keySharding?.enabled).toBe(true);
    expect(library.options.querySafety?.maxScanFiles).toBe(500);
  });

  it('should have all standard operations', () => {
    const library = createPrimaryGCSLibrary<TestUser, 'user'>(
      'user',
      'users',
      'test-bucket',
      mockStorage
    );

    expect(typeof library.operations.get).toBe('function');
    expect(typeof library.operations.create).toBe('function');
    expect(typeof library.operations.update).toBe('function');
    expect(typeof library.operations.upsert).toBe('function');
    expect(typeof library.operations.remove).toBe('function');
    expect(typeof library.operations.all).toBe('function');
    expect(typeof library.operations.one).toBe('function');
  });
});

