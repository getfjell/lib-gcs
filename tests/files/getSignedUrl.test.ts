import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSignedUrl } from '../../src/ops/files/getSignedUrl';
import { PathBuilder } from '../../src/PathBuilder';
import { Item, NotFoundError } from '@fjell/core';

interface TestRecording extends Item<'recording'> {
  title: string;
}

describe('getSignedUrl operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let pathBuilder: PathBuilder;
  const bucketName = 'test-bucket';

  beforeEach(() => {
    mockFile = {
      exists: vi.fn(),
      getSignedUrl: vi.fn(),
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

  it('should generate signed URL for existing file', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };
    const signedUrl = 'https://storage.googleapis.com/signed-url-here';

    mockFile.exists.mockResolvedValue([true]);
    mockFile.getSignedUrl.mockResolvedValue([signedUrl]);

    const result = await getSignedUrl<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      { expirationSeconds: 7200 },
      pathBuilder,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toBe(signedUrl);
    expect(mockFile.getSignedUrl).toHaveBeenCalled();
    
    // Verify expiration was set
    const callArgs = mockFile.getSignedUrl.mock.calls[0][0];
    expect(callArgs.action).toBe('read');
    expect(callArgs.expires).toBeDefined();
  });

  it('should throw NotFoundError for missing file', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };

    mockFile.exists.mockResolvedValue([false]);

    await expect(
      getSignedUrl<TestRecording, 'recording'>(
        mockStorage,
        bucketName,
        key,
        'master',
        'missing.wav',
        undefined,
        pathBuilder,
        { bucketName, mode: 'full' } as any
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('should support different actions', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.getSignedUrl.mockResolvedValue(['https://signed-url']);

    await getSignedUrl<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      { action: 'write' },
      pathBuilder,
      { bucketName, mode: 'full' } as any
    );

    const callArgs = mockFile.getSignedUrl.mock.calls[0][0];
    expect(callArgs.action).toBe('write');
  });

  it('should use default expiration if not specified', async () => {
    const key = { kt: 'recording' as const, pk: 'rec-123' };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.getSignedUrl.mockResolvedValue(['https://signed-url']);

    await getSignedUrl<TestRecording, 'recording'>(
      mockStorage,
      bucketName,
      key,
      'master',
      '0.wav',
      undefined,
      pathBuilder,
      { bucketName, mode: 'full' } as any
    );

    const callArgs = mockFile.getSignedUrl.mock.calls[0][0];
    expect(callArgs.expires).toBeDefined();
  });
});

