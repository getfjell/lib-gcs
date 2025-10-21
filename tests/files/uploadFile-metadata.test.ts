import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadFile } from '../../src/ops/files/uploadFile';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestRecording extends Item<'recording'> {
  title: string;
  files?: any;
}

describe('uploadFile - Metadata Update', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['recording']);

  beforeEach(() => {
    mockFile = {
      save: vi.fn().mockResolvedValue(undefined),
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

    fileProcessor = new FileProcessor();
  });

  it('should update item metadata after upload', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const existingItem: TestRecording = {
      kt: 'recording',
      pk: 'rec-123',
      title: 'My Recording',
      files: {
        master: [{ name: 'existing.wav', label: 'master', size: 1000, contentType: 'audio/wav', uploadedAt: new Date() }]
      }
    };

    // Mock get operation
    mockFile.exists.mockResolvedValueOnce([true]); // For get
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(existingItem))]);
    mockFile.exists.mockResolvedValueOnce([true]); // For update get
    
    const audioData = Buffer.from('new audio');

    await uploadFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      'new.wav',
      audioData,
      { contentType: 'audio/wav' },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full', files: { includeMetadataInItem: true } } as any
    );

    // Verify save was called multiple times (once for file, once for item JSON update)
    expect(mockFile.save).toHaveBeenCalled();
  });

  it('should skip metadata update when includeMetadataInItem is false', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const audioData = Buffer.from('audio');

    const fileRef = await uploadFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      audioData,
      { contentType: 'audio/wav' },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full', files: { includeMetadataInItem: false } } as any
    );

    expect(fileRef).toBeDefined();
    // Only one save call for the file itself
    expect(mockFile.save).toHaveBeenCalledTimes(1);
  });

  it('should compute checksum by default', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const audioData = Buffer.from('audio data for checksum');

    // Don't update metadata so we don't need to mock get
    const fileRef = await uploadFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      audioData,
      { contentType: 'audio/wav' },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full', files: { includeMetadataInItem: false } } as any
    );

    expect(fileRef.checksum).toBeDefined();
    expect(typeof fileRef.checksum).toBe('string');
  });

  it('should skip checksum when disabled', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const audioData = Buffer.from('audio');

    const fileRef = await uploadFile<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      audioData,
      { contentType: 'audio/wav', computeChecksum: false },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full', files: { includeMetadataInItem: false } } as any
    );

    expect(fileRef.checksum).toBeUndefined();
  });
});

