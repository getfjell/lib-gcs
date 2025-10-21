import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadFile } from '../../src/ops/files/uploadFile';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestRecording extends Item<'recording', 'user'> {
  title: string;
  files?: any;
}

describe('uploadFile operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['recording', 'user']);

  beforeEach(() => {
    mockFile = {
      save: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue([false]),
      download: vi.fn()
    };

    mockBucket = {
      file: vi.fn().mockReturnValue(mockFile),
      getFiles: vi.fn().mockResolvedValue([[]])
    };

    mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket),
    };

    pathBuilder = new PathBuilder({
      bucketName,
      directoryPaths: ['recordings', 'users'],
      useJsonExtension: true,
    });

    fileProcessor = new FileProcessor();
  });

  it('should upload file with metadata', async () => {
    const key = {
      kt: 'recording' as const,
      pk: 'rec-123',
      loc: [{ kt: 'user' as const, lk: 'user-456' }]
    };
    const label = 'master';
    const filename = '0.wav';
    const content = Buffer.from('audio data');

    const fileRef = await uploadFile<TestRecording, 'recording', 'user'>(
      mockStorage,
      bucketName,
      key,
      label,
      filename,
      content,
      { contentType: 'audio/wav' },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(fileRef).toBeDefined();
    expect(fileRef.name).toBe(filename);
    expect(fileRef.label).toBe(label);
    expect(fileRef.size).toBe(content.length);
    expect(fileRef.contentType).toBe('audio/wav');
    expect(fileRef.uploadedAt).toBeInstanceOf(Date);
    expect(fileRef.checksum).toBeDefined();
    expect(mockFile.save).toHaveBeenCalled();

    // Verify file path includes _files directory
    const calledPath = mockBucket.file.mock.calls[0][0];
    expect(calledPath).toContain('_files');
    expect(calledPath).toContain(label);
    expect(calledPath).toContain(filename);
  });

  it('should reject files exceeding maxFileSize', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const content = Buffer.alloc(1000000); // 1MB

    await expect(
      uploadFile<TestRecording, 'recording', 'user'>(
        mockStorage,
        bucketName,
        key,
        'master',
        'large.wav',
        content,
        undefined,
        pathBuilder,
        fileProcessor,
        coordinate,
        {
          bucketName,
          mode: 'full',
          files: { maxFileSize: 500000 } // 500KB limit
        } as any
      )
    ).rejects.toThrow('File size');
  });

  it('should reject disallowed content types', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const content = Buffer.from('data');

    await expect(
      uploadFile<TestRecording, 'recording', 'user'>(
        mockStorage,
        bucketName,
        key,
        'master',
        'file.exe',
        content,
        { contentType: 'application/x-msdownload' },
        pathBuilder,
        fileProcessor,
        coordinate,
        {
          bucketName,
          mode: 'full',
          files: { allowedContentTypes: ['audio/*', 'image/*'] }
        } as any
      )
    ).rejects.toThrow('Content type');
  });

  it('should work in files-only mode', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const content = Buffer.from('audio data');

    const fileRef = await uploadFile<TestRecording, 'recording', 'user'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      content,
      { contentType: 'audio/wav' },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'files-only' } as any
    );

    expect(fileRef).toBeDefined();
    // In files-only mode, item JSON is not updated
    expect(mockFile.exists).not.toHaveBeenCalled();
  });
});

