import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from '../../src/ops/get';
import { create } from '../../src/ops/create';
import { update } from '../../src/ops/update';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestItem extends Item<'test'> {
  name: string;
}

describe('Operations Error Handling', () => {
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
      save: vi.fn(),
      delete: vi.fn(),
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

  it('should propagate GCS errors on get', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    const gcsError = new Error('GCS API Error');

    mockFile.exists.mockRejectedValue(gcsError);

    await expect(
      get<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'full' } as any
      )
    ).rejects.toThrow('GCS API Error');
  });

  it('should propagate GCS errors on create', async () => {
    const item: Partial<TestItem> = { name: 'Test' };
    const key = { kt: 'test' as const, pk: 'test-123' };
    const gcsError = new Error('Upload failed');

    mockFile.save.mockRejectedValue(gcsError);

    await expect(
      create<TestItem, 'test'>(
        mockStorage,
        bucketName,
        item,
        { key },
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'full' } as any
      )
    ).rejects.toThrow('Upload failed');
  });

  it('should propagate GCS errors on update', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    const existing: TestItem = { kt: 'test', pk: 'test-123', name: 'Original' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existing))]);
    mockFile.save.mockRejectedValue(new Error('Save failed'));

    await expect(
      update<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        { name: 'Updated' },
        undefined,
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'full' } as any
      )
    ).rejects.toThrow('Save failed');
  });

  it('should throw error for invalid merge strategy', async () => {
    const key = { kt: 'test' as const, pk: 'test-123' };
    const existing: TestItem = { kt: 'test', pk: 'test-123', name: 'Original' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existing))]);

    await expect(
      update<TestItem, 'test'>(
        mockStorage,
        bucketName,
        key,
        { name: 'Updated' },
        { mergeStrategy: 'invalid' as any },
        pathBuilder,
        fileProcessor,
        coordinate,
        { bucketName, mode: 'full' } as any
      )
    ).rejects.toThrow('Invalid merge strategy');
  });
});

