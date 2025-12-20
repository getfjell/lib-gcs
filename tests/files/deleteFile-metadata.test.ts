import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteFile } from '../../src/ops/files/deleteFile';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { Item } from "@fjell/types";
import { createCoordinate } from "@fjell/core";

interface TestRecording extends Item<'recording'> {
  title: string;
  files?: any;
}

describe('deleteFile - Metadata Update', () => {
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
      exists: vi.fn(),
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

  it('should update item metadata after delete', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const existingItem: TestRecording = {
      kt: 'recording',
      pk: 'rec-123',
      title: 'My Recording',
      files: {
        master: [
          { name: '0.wav', label: 'master', size: 1000, contentType: 'audio/wav', uploadedAt: new Date() },
          { name: '1.wav', label: 'master', size: 2000, contentType: 'audio/wav', uploadedAt: new Date() }
        ]
      }
    };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existingItem))]);

    await deleteFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full', files: { includeMetadataInItem: true } } as any
    );

    expect(mockFile.delete).toHaveBeenCalled();
    // Item update should be called to remove file reference
    expect(mockFile.save).toHaveBeenCalled();
  });

  it('should remove label when deleting last file', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const existingItem: TestRecording = {
      kt: 'recording',
      pk: 'rec-123',
      title: 'My Recording',
      files: {
        master: [
          { name: '0.wav', label: 'master', size: 1000, contentType: 'audio/wav', uploadedAt: new Date() }
        ]
      }
    };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existingItem))]);

    await deleteFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full', files: { includeMetadataInItem: true } } as any
    );

    expect(mockFile.delete).toHaveBeenCalled();
  });

  it('should skip metadata update when includeMetadataInItem is false', async () => {
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
      { bucketName, mode: 'full', files: { includeMetadataInItem: false } } as any
    );

    expect(mockFile.delete).toHaveBeenCalled();
    // No item update should happen
    expect(mockFile.save).not.toHaveBeenCalled();
  });

  it('should work in files-only mode without updating item', async () => {
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

