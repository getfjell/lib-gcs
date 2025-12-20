import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listFiles } from '../../src/ops/files/listFiles';
import { PathBuilder } from '../../src/PathBuilder';
import { Item } from "@fjell/types";

interface TestRecording extends Item<'recording'> {
  title: string;
}

describe('listFiles operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let pathBuilder: PathBuilder;
  const bucketName = 'test-bucket';

  beforeEach(() => {
    mockBucket = {
      getFiles: vi.fn(),
    };

    mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket),
    };

    pathBuilder = new PathBuilder({
      bucketName,
      directoryPaths: ['recordings'],
      useJsonExtension: true,
    });
  });

  it('should list all files for a label', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    
    const mockFiles = [
      {
        name: 'recording/rec-123/_files/master/0.wav',
        getMetadata: vi.fn().mockResolvedValue([{
          size: '1000',
          contentType: 'audio/wav',
          timeCreated: '2025-01-01T00:00:00Z',
          md5Hash: 'abc123'
        }])
      },
      {
        name: 'recording/rec-123/_files/master/1.wav',
        getMetadata: vi.fn().mockResolvedValue([{
          size: '2000',
          contentType: 'audio/wav',
          timeCreated: '2025-01-01T00:01:00Z',
          md5Hash: 'def456'
        }])
      }
    ];

    mockBucket.getFiles.mockResolvedValue([mockFiles]);

    const result = await listFiles<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      pathBuilder,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('0.wav');
    expect(result[0].label).toBe('master');
    expect(result[0].size).toBe(1000);
    expect(result[1].name).toBe('1.wav');
  });

  it('should list all files for all labels when no label specified', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    
    const mockFiles = [
      {
        name: 'recording/rec-123/_files/master/0.wav',
        getMetadata: vi.fn().mockResolvedValue([{
          size: '1000',
          contentType: 'audio/wav',
          timeCreated: '2025-01-01T00:00:00Z'
        }])
      },
      {
        name: 'recording/rec-123/_files/final/0.wav',
        getMetadata: vi.fn().mockResolvedValue([{
          size: '500',
          contentType: 'audio/wav',
          timeCreated: '2025-01-01T00:00:00Z'
        }])
      }
    ];

    mockBucket.getFiles.mockResolvedValue([mockFiles]);

    const result = await listFiles<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      undefined, // No label = list all
      pathBuilder,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('0.wav');
    expect(result[1].name).toBe('0.wav');
  });
});

