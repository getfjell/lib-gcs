import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from '../../src/ops/create';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestItem extends Item<'test'> {
  name: string;
}

describe('create operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['test']);

  beforeEach(() => {
    mockFile = {
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

  it('should create an item with provided key', async () => {
    const item: Partial<TestItem> = { name: 'New Item' };
    const key = { kt: 'test' as const, pk: 'test-456' };

    const result = await create<TestItem, 'test'>(
      mockStorage,
      bucketName,
      item,
      { key },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.kt).toBe('test');
    expect(result.pk).toBe('test-456');
    expect(result.name).toBe('New Item');
    expect(mockFile.save).toHaveBeenCalled();
  });

  it('should generate UUID if pk not provided', async () => {
    const item: Partial<TestItem> = { name: 'Auto PK' };

    const result = await create<TestItem, 'test'>(
      mockStorage,
      bucketName,
      item,
      undefined,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.kt).toBe('test');
    expect(result.pk).toBeDefined();
    expect(typeof result.pk).toBe('string');
    expect(result.name).toBe('Auto PK');
  });

  it('should create item with existing pk in item', async () => {
    const item: Partial<TestItem> = { pk: 'existing-pk', name: 'Has PK' };

    const result = await create<TestItem, 'test'>(
      mockStorage,
      bucketName,
      item,
      undefined,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.pk).toBe('existing-pk');
    expect(result.name).toBe('Has PK');
  });

  it('should throw error in files-only mode', async () => {
    const item: Partial<TestItem> = { name: 'New Item' };

    await expect(
      create<TestItem, 'test'>(
        mockStorage,
        bucketName,
        item,
        undefined,
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'files-only' } as any
      )
    ).rejects.toThrow('Item operations are disabled in files-only mode');
  });

  it('should save with correct content type', async () => {
    const item: Partial<TestItem> = { name: 'Content Type Test' };
    const key = { kt: 'test' as const, pk: 'test-789' };

    await create<TestItem, 'test'>(
      mockStorage,
      bucketName,
      item,
      { key },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    const saveCall = mockFile.save.mock.calls[0];
    expect(saveCall[1]).toEqual({
      contentType: 'application/json',
      metadata: { contentType: 'application/json' }
    });
  });
});

