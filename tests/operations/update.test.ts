import { beforeEach, describe, expect, it, vi } from 'vitest';
import { update } from '../../src/ops/update';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item, NotFoundError } from '@fjell/core';

interface TestItem extends Item<'test'> {
  name: string;
  nested?: {
    x?: number;
    y?: number;
    z?: number;
  };
  value?: number;
}

describe('update operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['test']);

  beforeEach(() => {
    mockFile = {
      exists: vi.fn(),
      download: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockBucket = {
      file: vi.fn().mockReturnValue(mockFile),
    };

    mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket),
    };

    pathBuilder = new PathBuilder({
      bucketName,
      directoryPaths: ['tests'],
      useJsonExtension: true,
    });

    fileProcessor = new FileProcessor();
  });

  describe('merge strategies', () => {
    it('should deep merge by default', async () => {
      const key = { kt: 'test' as const, pk: 'test-123' };
      const existing: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Original',
        nested: { x: 1, y: 2 },
        value: 10
      };
      const updates: Partial<TestItem> = {
        name: 'Updated',
        nested: { y: 3, z: 4 }
      };

      mockFile.exists.mockResolvedValue([true]);
      mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existing))]);

      const result = await update<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        updates,
        undefined, // No merge strategy = deep by default
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'full' } as any
      );

      expect(result.name).toBe('Updated');
      expect(result.nested).toEqual({ x: 1, y: 3, z: 4 }); // Deep merge
      expect(result.value).toBe(10);
    });

    it('should deep merge with explicit strategy', async () => {
      const key = { kt: 'test' as const, pk: 'test-123' };
      const existing: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Original',
        nested: { x: 1, y: 2 }
      };
      const updates: Partial<TestItem> = {
        nested: { y: 3, z: 4 }
      };

      mockFile.exists.mockResolvedValue([true]);
      mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existing))]);

      const result = await update<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        updates,
        { mergeStrategy: 'deep' },
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'full' } as any
      );

      expect(result.nested).toEqual({ x: 1, y: 3, z: 4 }); // x preserved, y updated, z added
    });

    it('should shallow merge when specified', async () => {
      const key = { kt: 'test' as const, pk: 'test-123' };
      const existing: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Original',
        nested: { x: 1, y: 2 }
      };
      const updates: Partial<TestItem> = {
        name: 'Updated',
        nested: { y: 3, z: 4 }
      };

      mockFile.exists.mockResolvedValue([true]);
      mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existing))]);

      const result = await update<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        updates,
        { mergeStrategy: 'shallow' },
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'full' } as any
      );

      expect(result.name).toBe('Updated');
      expect(result.nested).toEqual({ y: 3, z: 4 }); // Shallow: nested object replaced
    });

    it('should replace when specified', async () => {
      const key = { kt: 'test' as const, pk: 'test-123' };
      const existing: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Original',
        nested: { x: 1, y: 2 },
        value: 10
      };
      const updates: Partial<TestItem> = {
        name: 'Replaced',
        nested: { z: 4 }
      };

      mockFile.exists.mockResolvedValue([true]);
      mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existing))]);

      const result = await update<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        updates,
        { mergeStrategy: 'replace' },
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'full' } as any
      );

      expect(result.name).toBe('Replaced');
      expect(result.nested).toEqual({ z: 4 });
      expect(result.value).toBeUndefined(); // value was not in updates
      expect(result.kt).toBe('test'); // key preserved
      expect(result.pk).toBe('test-123'); // key preserved
    });
  });

  it('should throw NotFoundError if item does not exist', async () => {
    const key = { kt: 'test' as const, pk: 'missing' };
    const updates: Partial<TestItem> = { name: 'Update' };

    mockFile.exists.mockResolvedValue([false]);

    await expect(
      update<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        updates,
        undefined,
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'full' } as any
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw error in files-only mode', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    const updates: Partial<TestItem> = { name: 'Update' };

    await expect(
      update<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        updates,
        undefined,
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'files-only' } as any
      )
    ).rejects.toThrow('Item operations are disabled in files-only mode');
  });
});

