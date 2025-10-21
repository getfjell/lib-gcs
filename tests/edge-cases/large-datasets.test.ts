import { beforeEach, describe, expect, it } from 'vitest';
import { all } from '../../src/ops/all';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';
import { createMockStorage } from '../mocks/storageMock';

interface TestItem extends Item<'item'> {
  value: number;
}

describe('Large Datasets Edge Cases', () => {
  let mockStorage: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['item']);

  beforeEach(() => {
    mockStorage = createMockStorage();
    
    pathBuilder = new PathBuilder({
      bucketName,
      directoryPaths: ['items'],
      useJsonExtension: true,
    });

    fileProcessor = new FileProcessor();
  });

  it('should throw error when exceeding maxScanFiles', async () => {
    // Simulate 1500 files in bucket
    const mockFiles = Array.from({ length: 1500 }, (_, i) => ({
      name: `item/item-${i}.json`,
      download: vi.fn().mockResolvedValue([
        Buffer.from(JSON.stringify({ kt: 'item', pk: `item-${i}`, value: i }))
      ])
    }));

    const mockBucket = mockStorage.bucket(bucketName);
    mockBucket.getFiles = vi.fn().mockResolvedValue([mockFiles]);

    await expect(
      all<TestItem, 'item'>(
        mockStorage,
        bucketName,
        undefined,
        undefined,
        pathBuilder,
        fileProcessor,
        coordinate,
        {
          bucketName,
          mode: 'full',
          querySafety: { maxScanFiles: 1000 }
        } as any
      )
    ).rejects.toThrow('File count (1500) exceeds maxScanFiles limit (1000)');
  });

  it('should respect downloadConcurrency setting', async () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      kt: 'item',
      pk: `item-${i}`,
      value: i
    }));

    const mockFiles = items.map((item) => ({
      name: `item/${item.pk}.json`,
      download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(item))])
    }));

    const mockBucket = mockStorage.bucket(bucketName);
    mockBucket.getFiles = vi.fn().mockResolvedValue([mockFiles]);

    const results = await all<TestItem, 'item'>(
      mockStorage,
      bucketName,
      undefined,
      undefined,
      pathBuilder,
      fileProcessor,
      coordinate,
      {
        bucketName,
        mode: 'full',
        querySafety: {
          maxScanFiles: 100,
          downloadConcurrency: 5 // Download 5 at a time
        }
      } as any
    );

    expect(results).toHaveLength(25);
  });

  it('should throw error when query operations are disabled', async () => {
    await expect(
      all<TestItem, 'item'>(
        mockStorage,
        bucketName,
        undefined,
        undefined,
        pathBuilder,
        fileProcessor,
        coordinate,
        {
          bucketName,
          mode: 'full',
          querySafety: {
            disableQueryOperations: true
          }
        } as any
      )
    ).rejects.toThrow('Query operations are disabled');
  });
});

