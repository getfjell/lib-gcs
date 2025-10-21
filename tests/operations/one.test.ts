import { beforeEach, describe, expect, it, vi } from 'vitest';
import { one } from '../../src/ops/one';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestItem extends Item<'test'> {
  name: string;
  value: number;
}

describe('one operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['test']);

  beforeEach(() => {
    mockBucket = {
      getFiles: vi.fn(),
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

  it('should get first item', async () => {
    const item1: TestItem = { kt: 'test', pk: 'test-1', name: 'First', value: 1 };
    const item2: TestItem = { kt: 'test', pk: 'test-2', name: 'Second', value: 2 };

    const mockFiles = [
      {
        name: 'test/test-1.json',
        download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(item1))])
      },
      {
        name: 'test/test-2.json',
        download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(item2))])
      }
    ];

    mockBucket.getFiles.mockResolvedValue([mockFiles]);

    const result = await one<TestItem, 'test'>(
      mockStorage,
      bucketName,
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toBeDefined();
    expect(result?.name).toBe('First');
  });

  it('should return null if no items found', async () => {
    mockBucket.getFiles.mockResolvedValue([[]]);

    const result = await one<TestItem, 'test'>(
      mockStorage,
      bucketName,
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toBeNull();
  });

  it('should optimize query with limit: 1', async () => {
    const item: TestItem = { kt: 'test', pk: 'test-1', name: 'Only One', value: 1 };

    const mockFiles = [
      {
        name: 'test/test-1.json',
        download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(item))])
      }
    ];

    mockBucket.getFiles.mockResolvedValue([mockFiles]);

    const result = await one<TestItem, 'test'>(
      mockStorage,
      bucketName,
      { offset: 0 }, // Query without limit
      undefined,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toBeDefined();
    expect(result?.name).toBe('Only One');
  });

  it('should throw error in files-only mode', async () => {
    await expect(
      one<TestItem, 'test'>(
        mockStorage,
        bucketName,
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

