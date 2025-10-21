import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteFile } from '../../src/ops/files/deleteFile';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestRecording extends Item<'recording'> {
  title: string;
  files?: any;
}

describe('deleteFile operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['recording']);

  beforeEach(() => {
    mockFile = {
      delete: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue([false]),
      download: vi.fn(),
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
      directoryPaths: ['recordings'],
      useJsonExtension: true,
    });

    fileProcessor = new FileProcessor();
  });

  it('should delete file from GCS', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };

    await deleteFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(mockFile.delete).toHaveBeenCalled();
    
    // Verify correct path was used
    const calledPath = mockBucket.file.mock.calls[0][0];
    expect(calledPath).toContain('_files/master/0.wav');
  });

  it('should work in files-only mode', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };

    await deleteFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'files-only' } as any
    );

    expect(mockFile.delete).toHaveBeenCalled();
  });
});

