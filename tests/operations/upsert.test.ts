import { beforeEach, describe, expect, it, vi } from 'vitest';
import { upsert } from '../../src/ops/upsert';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestItem extends Item<'test'> {
  name: string;
  value?: number;
}

describe('upsert operation', () => {
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

  it('should update existing item', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    const existing: TestItem = {
      kt: 'test',
      pk: 'test-123',
      name: 'Original',
      value: 10
    };
    const updates: Partial<TestItem> = { name: 'Updated' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existing))]);

    const result = await upsert<TestItem, 'test'>(
      mockStorage,
      bucketName,
      key,
      updates,
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.name).toBe('Updated');
    expect(result.value).toBe(10); // Preserved from existing
  });

  it('should create new item if it does not exist', async () => {
    const key = { kt: 'test' as const, pk: 'test-new' };
    const item: Partial<TestItem> = { name: 'New Item' };

    mockFile.exists.mockResolvedValue([false]);

    const result = await upsert<TestItem, 'test'>(
      mockStorage,
      bucketName,
      key,
      item,
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.kt).toBe('test');
    expect(result.pk).toBe('test-new');
    expect(result.name).toBe('New Item');
  });

  it('should use merge strategy for updates', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    const existing: TestItem = {
      kt: 'test',
      pk: 'test-123',
      name: 'Original',
      value: 10
    };
    const updates: Partial<TestItem> = { name: 'Replaced' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existing))]);

    const result = await upsert<TestItem, 'test'>(
      mockStorage,
      bucketName,
      key,
      updates,
      undefined,
      { mergeStrategy: 'replace' },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.name).toBe('Replaced');
    expect(result.value).toBeUndefined(); // Replace strategy
  });

  it('should ignore merge strategy when creating', async () => {
    const key = { kt: 'test' as const, pk: 'test-new' };
    const item: Partial<TestItem> = { name: 'New', value: 99 };

    mockFile.exists.mockResolvedValue([false]);

    const result = await upsert<TestItem, 'test'>(
      mockStorage,
      bucketName,
      key,
      item,
      undefined,
      { mergeStrategy: 'replace' }, // Ignored for creates
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.name).toBe('New');
    expect(result.value).toBe(99);
  });

  it('should throw error in files-only mode', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    const item: Partial<TestItem> = { name: 'Update' };

    await expect(
      upsert<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        item,
        undefined,
        undefined,
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'files-only' } as any
      )
    ).rejects.toThrow('Item operations are disabled in files-only mode');
  });
});

