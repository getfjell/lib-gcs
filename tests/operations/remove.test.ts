import { beforeEach, describe, expect, it, vi } from 'vitest';
import { remove } from '../../src/ops/remove';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { Item } from "@fjell/types";
import { createCoordinate } from "@fjell/core";

interface TestItem extends Item<'test'> {
  name: string;
}

describe('remove operation', () => {
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
      delete: vi.fn().mockResolvedValue(undefined),
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

  it('should remove an existing item and return it', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    const item: TestItem = { kt: 'test', pk: 'test-123', name: 'To Delete' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(item))]);

    const result = await remove<TestItem, 'test'>(
      mockStorage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toEqual(item);
    expect(mockFile.delete).toHaveBeenCalled();
  });

  it('should return void if item does not exist', async () => {
    const key = { kt: 'test' as const, pk: 'missing' };

    mockFile.exists.mockResolvedValue([false]);

    const result = await remove<TestItem, 'test'>(
      mockStorage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toBeUndefined();
    expect(mockFile.delete).toHaveBeenCalled();
  });

  it('should throw error in files-only mode', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };

    await expect(
      remove<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'files-only' } as any
      )
    ).rejects.toThrow('Item operations are disabled in files-only mode');
  });
});

