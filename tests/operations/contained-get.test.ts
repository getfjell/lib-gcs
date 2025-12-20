import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from '../../src/ops/get';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { Item } from "@fjell/types";
import { createCoordinate } from "@fjell/core";

interface TestComment extends Item<'comment', 'post'> {
  text: string;
}

describe('Contained Items - get operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['comment', 'post']);

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
      directoryPaths: ['comments', 'posts'],
      useJsonExtension: true,
    });

    fileProcessor = new FileProcessor();
  });

  it('should get contained item with location', async () => {
    const key = {
      kt: 'comment' as const,
      pk: 'comment-123',
      loc: [{ kt: 'post' as const, lk: 'post-456' }]
    };
    const item: TestComment = {
      kt: 'comment',
      pk: 'comment-123',
      loc: [{ kt: 'post', lk: 'post-456' }],
      text: 'Test comment'
    };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(item))]);

    const result = await get<TestComment, 'comment', 'post'>(
      mockStorage,
      bucketName,
      key,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toEqual(item);
    expect(mockBucket.file).toHaveBeenCalled();
    
    // Verify path includes location hierarchy
    const calledPath = mockBucket.file.mock.calls[0][0];
    expect(calledPath).toContain('post/post-456');
    expect(calledPath).toContain('comment/comment-123');
  });

  it('should get contained item with 2-level nesting', async () => {
    const coordinate2 = createCoordinate(['reply', 'comment', 'post']);
    const pathBuilder2 = new PathBuilder({
      bucketName,
      directoryPaths: ['replies', 'comments', 'posts'],
      useJsonExtension: true,
    });

    const key = {
      kt: 'reply' as const,
      pk: 'reply-789',
      loc: [
        { kt: 'post' as const, lk: 'post-123' },
        { kt: 'comment' as const, lk: 'comment-456' }
      ]
    };
    const item: any = {
      kt: 'reply',
      pk: 'reply-789',
      loc: key.loc,
      content: 'Test reply'
    };

    mockFile.exists.mockResolvedValue([true]);
    mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(item))]);

    const result = await get(
      mockStorage,
      bucketName,
      key,
      pathBuilder2,
      fileProcessor,
      coordinate2,
      { bucketName, mode: 'full' } as any
    );

    expect(result).toEqual(item);
    
    // Verify path includes full location hierarchy
    const calledPath = mockBucket.file.mock.calls[0][0];
    expect(calledPath).toContain('post/post-123');
    expect(calledPath).toContain('comment/comment-456');
    expect(calledPath).toContain('reply/reply-789');
  });
});

