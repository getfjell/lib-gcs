import { Item } from "@fjell/types";
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Define a generic item type for testing purposes
interface MockItem extends Item<string, 'l1', 'l2', 'l3', 'l4', 'l5'> {
  id: string;
  name: string;
}

// Mock the @fjell/lib module
const mockLibCreateOptions = vi.fn();
vi.mock('@fjell/lib', () => ({
  createOptions: mockLibCreateOptions,
}));

describe('createOptions', () => {
  beforeEach(() => {
    // Clear mock history before each test
    mockLibCreateOptions.mockClear();
  });

  it('should call Library.createOptions and add GCS-specific options', async () => {
    const { createOptions } = await import('../src/Options');
    const bucketName = 'test-bucket';
    const libOptions = {
      mode: 'full' as const,
    };
    
    mockLibCreateOptions.mockReturnValue({});

    const result = createOptions<MockItem, string>(bucketName, libOptions);

    expect(mockLibCreateOptions).toHaveBeenCalledTimes(1);
    expect(result.bucketName).toBe(bucketName);
    expect(result.mode).toBe('full');
    expect(result.useJsonExtension).toBe(true);
  });

  it('should set default values for GCS-specific options', async () => {
    const { createOptions } = await import('../src/Options');
    const bucketName = 'test-bucket';
    
    mockLibCreateOptions.mockReturnValue({});

    const result = createOptions<MockItem, string>(bucketName);

    expect(result.bucketName).toBe(bucketName);
    expect(result.basePath).toBe('');
    expect(result.useJsonExtension).toBe(true);
    expect(result.mode).toBe('full');
    expect(result.fileMetadataStorage).toBe('none');
    expect(result.keySharding?.enabled).toBe(false);
    expect(result.keySharding?.levels).toBe(2);
    expect(result.keySharding?.charsPerLevel).toBe(1);
    expect(result.querySafety?.maxScanFiles).toBe(1000);
    expect(result.querySafety?.warnThreshold).toBe(100);
    expect(result.querySafety?.disableQueryOperations).toBe(false);
    expect(result.querySafety?.downloadConcurrency).toBe(10);
  });

  it('should preserve custom GCS-specific options', async () => {
    const { createOptions } = await import('../src/Options');
    const bucketName = 'test-bucket';
    const libOptions = {
      basePath: 'production',
      mode: 'files-only' as const,
      useJsonExtension: false,
      keySharding: {
        enabled: true,
        levels: 3,
        charsPerLevel: 2,
      },
      querySafety: {
        maxScanFiles: 500,
        warnThreshold: 50,
        disableQueryOperations: true,
        downloadConcurrency: 5,
      },
    };
    
    mockLibCreateOptions.mockReturnValue({});

    const result = createOptions<MockItem, string>(bucketName, libOptions);

    expect(result.basePath).toBe('production');
    expect(result.mode).toBe('files-only');
    expect(result.useJsonExtension).toBe(false);
    expect(result.keySharding?.enabled).toBe(true);
    expect(result.keySharding?.levels).toBe(3);
    expect(result.keySharding?.charsPerLevel).toBe(2);
    expect(result.querySafety?.maxScanFiles).toBe(500);
    expect(result.querySafety?.warnThreshold).toBe(50);
    expect(result.querySafety?.disableQueryOperations).toBe(true);
    expect(result.querySafety?.downloadConcurrency).toBe(5);
  });
});
