import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadFile } from '../../src/ops/files/downloadFile';
import { PathBuilder } from '../../src/PathBuilder';
import { Item, NotFoundError } from '@fjell/core';

interface TestRecording extends Item<'recording'> {
  title: string;
}

describe('downloadFile operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let pathBuilder: PathBuilder;
  const bucketName = 'test-bucket';

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
      directoryPaths: ['recordings'],
      useJsonExtension: true,
    });
  });

  it('should download existing file', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const fileContent = Buffer.from('audio file content');

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([fileContent]);

    const result = await downloadFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      pathBuilder,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toEqual(fileContent);
    expect(mockFile.download).toHaveBeenCalled();
  });

  it('should throw NotFoundError for missing file', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };

    mockFile.exists.mockResolvedValue([false]);

    await expect(
      downloadFile<TestRecording, 'recording'>(
        mockStorage,
        bucketName,
        key,
        'master',
        'missing.wav',
        pathBuilder,
        { bucketName, mode: 'full' } as any
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('should build correct file path', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-456' };
    const fileContent = Buffer.from('data');

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([fileContent]);

    await downloadFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'final',
      'output.wav',
      pathBuilder,
      { bucketName, mode: 'full' } as any
    );

    const calledPath = mockBucket.file.mock.calls[0][0];
    expect(calledPath).toContain('recording/rec-456/_files/final/output.wav');
  });
});

