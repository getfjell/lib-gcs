import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOperations } from '../src/Operations';
import { createCoordinate, Item } from '@fjell/core';
import { Definition } from '../src/Definition';

interface TestItem extends Item<'test'> {
  name: string;
}

describe('Operations Integration', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let definition: Definition<TestItem, 'test'>;

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

    const coordinate = createCoordinate(['test']);
    
    definition = {
      coordinate,
      bucketName: 'test-bucket',
      directoryPaths: ['tests'],
      basePath: '',
      options: {
        bucketName: 'test-bucket',
        mode: 'full',
        useJsonExtension: true,
        keySharding: { enabled: false },
        querySafety: { maxScanFiles: 1000 }
      } as any
    };
  });

  it('should execute get operation through operations interface', async () => {
    const operations = createOperations(mockStorage, definition);
    const key = { kt: 'test' as const, pk: 'test-123' };
    const item: TestItem = { kt: 'test', pk: 'test-123', name: 'Test' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(item))]);

    const result = await operations.get(key);

    expect(result).toEqual(item);
  });

  it('should execute create operation through operations interface', async () => {
    const operations = createOperations(mockStorage, definition);
    const item: Partial<TestItem> = { name: 'New Item' };
    const key = { kt: 'test' as const, pk: 'new-123' };

    const result = await operations.create(item, { key });

    expect(result.name).toBe('New Item');
    expect(mockFile.save).toHaveBeenCalled();
  });

  it('should execute update operation through operations interface', async () => {
    const operations = createOperations(mockStorage, definition);
    const key = { kt: 'test' as const, pk: 'test-123' };
    const existing: TestItem = { kt: 'test', pk: 'test-123', name: 'Original' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existing))]);

    const result = await operations.update(key, { name: 'Updated' });

    expect(result.name).toBe('Updated');
  });

  it('should have upsert operation available', () => {
    const operations = createOperations(mockStorage, definition);
    expect(typeof operations.upsert).toBe('function');
  });

  it('should execute remove operation through operations interface', async () => {
    const operations = createOperations(mockStorage, definition);
    const key = { kt: 'test' as const, pk: 'test-123' };
    const item: TestItem = { kt: 'test', pk: 'test-123', name: 'To Remove' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(item))]);

    const result = await operations.remove(key);

    expect(result).toEqual(item);
    expect(mockFile.delete).toHaveBeenCalled();
  });

  it('should execute all operation through operations interface', async () => {
    const operations = createOperations(mockStorage, definition);

    const result = await operations.all();

    expect(result.items).toEqual([]);
    expect(result.metadata.total).toBe(0);
  });

  it('should execute one operation through operations interface', async () => {
    const operations = createOperations(mockStorage, definition);

    const result = await operations.one();

    expect(result).toBeNull();
  });
});

