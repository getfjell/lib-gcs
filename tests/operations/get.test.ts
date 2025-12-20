import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from '../../src/ops/get';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { Item } from "@fjell/types";
import { createCoordinate } from "@fjell/core";

interface TestItem extends Item<'test'> {
  name: string;
}

describe('get operation', () => {
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

  it('should get an existing item', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    const item: TestItem = { kt: 'test', pk: 'test-123', name: 'Test Item' };
    
    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(item))]);

    const result = await get<TestItem, 'test'>(
      mockStorage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toEqual(item);
    expect(mockStorage.bucket).toHaveBeenCalledWith(bucketName);
    expect(mockFile.exists).toHaveBeenCalled();
    expect(mockFile.download).toHaveBeenCalled();
  });

  it('should return null for non-existent item', async () => {
    const key = { kt: 'test' as const, pk: 'missing' };
    
    mockFile.exists.mockResolvedValue([false]);

    const result = await get<TestItem, 'test'>(
      mockStorage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toBeNull();
    expect(mockFile.download).not.toHaveBeenCalled();
  });

  it('should throw error in files-only mode', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };

    await expect(
      get<TestItem, 'test'>(
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

  it('should return null if deserialization fails', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    
    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from('invalid json')]);

    const result = await get<TestItem, 'test'>(
      mockStorage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toBeNull();
  });
});

