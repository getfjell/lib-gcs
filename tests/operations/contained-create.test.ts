import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from '../../src/ops/create';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestComment extends Item<'comment', 'post'> {
  text: string;
}

describe('Contained Items - create operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['comment', 'post']);

  beforeEach(() => {
    mockFile = {
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
      directoryPaths: ['comments', 'posts'],
      useJsonExtension: true,
    });

    fileProcessor = new FileProcessor();
  });

  it('should create contained item with location', async () => {
    const item: Partial<TestComment> = { text: 'New comment' };
    const locations = [{ kt: 'post' as const, lk: 'post-456' }];
    const key = {
      kt: 'comment' as const,
      pk: 'comment-123',
      loc: locations
    };

    const result = await create<TestComment, 'comment', 'post'>(
      mockStorage,
      bucketName,
      item,
      { key, locations },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.kt).toBe('comment');
    expect(result.pk).toBe('comment-123');
    expect(result.loc).toEqual(locations);
    expect(result.text).toBe('New comment');

    // Verify path includes location
    const calledPath = mockBucket.file.mock.calls[0][0];
    expect(calledPath).toContain('post/post-456');
    expect(calledPath).toContain('comment/comment-123');
  });

  it('should create contained item with generated UUID', async () => {
    const item: Partial<TestComment> = { text: 'Auto ID comment' };
    const locations = [{ kt: 'post' as const, lk: 'post-789' }];

    const result = await create<TestComment, 'comment', 'post'>(
      mockStorage,
      bucketName,
      item,
      { locations },
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.kt).toBe('comment');
    expect(result.pk).toBeDefined();
    expect(typeof result.pk).toBe('string');
    expect(result.loc).toEqual(locations);
  });

  it('should create deeply nested item', async () => {
    const coordinate3 = createCoordinate(['reply', 'comment', 'post']);
    const pathBuilder3 = new PathBuilder({
      bucketName,
      directoryPaths: ['replies', 'comments', 'posts'],
      useJsonExtension: true,
    });

    const locations = [
      { kt: 'post' as const, lk: 'post-123' },
      { kt: 'comment' as const, lk: 'comment-456' }
    ];
    const key = {
      kt: 'reply' as const,
      pk: 'reply-789',
      loc: locations
    };
    const item: any = { content: 'Deep reply' };

    const result = await create(
      mockStorage,
      bucketName,
      item,
      { key, locations },
      pathBuilder3,
      fileProcessor,
      coordinate3,
      { bucketName, mode: 'full' } as any
    );

    expect(result.loc).toEqual(locations);
    
    // Verify full hierarchy in path
    const calledPath = mockBucket.file.mock.calls[0][0];
    expect(calledPath).toContain('post/post-123');
    expect(calledPath).toContain('comment/comment-456');
    expect(calledPath).toContain('reply/reply-789');
  });
});

