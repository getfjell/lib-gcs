import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrimaryGCSLibrary } from '../../src/primary/GCSLibrary';
import { Item } from '@fjell/core';

interface TestRecording extends Item<'recording'> {
  title: string;
  files?: any;
}

describe('File Operations Integration', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(() => {
    mockFile = {
      save: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue([false]), // Default: file doesn't exist
      download: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
      getSignedUrl: vi.fn().mockResolvedValue(['https://signed-url']),
      getMetadata: vi.fn().mockResolvedValue([{
        size: '1000',
        contentType: 'audio/wav',
        timeCreated: '2025-01-01T00:00:00Z',
        md5Hash: 'abc123'
      }])
    };

    mockBucket = {
      file: vi.fn().mockReturnValue(mockFile),
      getFiles: vi.fn().mockResolvedValue([[]])
    };

    mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket),
    };
  });

  it('should upload, download, and delete files through library interface', async () => {
    const library = createPrimaryGCSLibrary<TestRecording, 'recording'>(
      'recording',
      'recordings',
      'test-bucket',
      mockStorage
    );

    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const audioData = Buffer.from('audio content');

    // Upload file
    const fileRef = await library.files.uploadFile(
      key,
      'master',
      '0.wav',
      audioData,
      { contentType: 'audio/wav' }
    );

    expect(fileRef).toBeDefined();
    expect(fileRef.name).toBe('0.wav');
    expect(fileRef.label).toBe('master');
    expect(mockFile.save).toHaveBeenCalled();

    // Download file
    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([audioData]);

    const downloaded = await library.files.downloadFile(key, 'master', '0.wav');
    expect(downloaded).toEqual(audioData);

    // Get signed URL
    const url = await library.files.getSignedUrl(key, 'master', '0.wav');
    expect(url).toBe('https://signed-url');

    // Delete file
    await library.files.deleteFile(key, 'master', '0.wav');
    expect(mockFile.delete).toHaveBeenCalled();
  });

  it('should list files by label', async () => {
    const library = createPrimaryGCSLibrary<TestRecording, 'recording'>(
      'recording',
      'recordings',
      'test-bucket',
      mockStorage
    );

    const key = { kt: 'recording' as const, pk: 'rec-123' };

    const mockFiles = [
      {
        name: 'recording/rec-123/_files/master/0.wav',
        getMetadata: mockFile.getMetadata
      }
    ];

    mockBucket.getFiles.mockResolvedValue([mockFiles]);

    const files = await library.files.listFiles(key, 'master');
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('0.wav');
  });

  it('should have files operations in library interface', () => {
    const library = createPrimaryGCSLibrary<TestRecording, 'recording'>(
      'recording',
      'recordings',
      'test-bucket',
      mockStorage
    );

    expect(library.files).toBeDefined();
    expect(typeof library.files.uploadFile).toBe('function');
    expect(typeof library.files.downloadFile).toBe('function');
    expect(typeof library.files.deleteFile).toBe('function');
    expect(typeof library.files.listFiles).toBe('function');
    expect(typeof library.files.getSignedUrl).toBe('function');
  });
});

