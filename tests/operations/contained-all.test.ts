import { beforeEach, describe, expect, it, vi } from 'vitest';
import { all } from '../../src/ops/all';
import { PathBuilder } from '../../src/PathBuilder';
import { FileProcessor } from '../../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestComment extends Item<'comment', 'post'> {
  text: string;
}

describe('Contained Items - all operation', () => {
  let mockStorage: any;
  let mockBucket: any;
  let pathBuilder: PathBuilder;
  let fileProcessor: FileProcessor;
  const bucketName = 'test-bucket';
  const coordinate = createCoordinate(['comment', 'post']);

  beforeEach(() => {
    mockBucket = {
      getFiles: vi.fn(),
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

  it('should list all comments in a specific post', async () => {
    const locations = [{ kt: 'post' as const, lk: 'post-456' }];
    const comment1: TestComment = {
      kt: 'comment',
      pk: 'comment-1',
      loc: locations,
      text: 'First comment'
    };
    const comment2: TestComment = {
      kt: 'comment',
      pk: 'comment-2',
      loc: locations,
      text: 'Second comment'
    };

    const mockFiles = [
      {
        name: 'post/post-456/comment/comment-1.json',
        download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(comment1))])
      },
      {
        name: 'post/post-456/comment/comment-2.json',
        download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(comment2))])
      }
    ];

    mockBucket.getFiles.mockResolvedValue([mockFiles]);

    const result = await all<TestComment, 'comment', 'post'>(
      mockStorage,
      bucketName,
      undefined,
      locations,
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0].text).toBe('First comment');
    expect(result.items[1].text).toBe('Second comment');
    expect(result.metadata.total).toBe(2);

    // Verify correct prefix was used
    const getFilesCall = mockBucket.getFiles.mock.calls[0][0];
    expect(getFilesCall.prefix).toContain('post/post-456/comment');
  });

  it('should list all comments across all posts when no locations provided', async () => {
    const comment1: TestComment = {
      kt: 'comment',
      pk: 'comment-1',
      loc: [{ kt: 'post', lk: 'post-1' }],
      text: 'Comment in post 1'
    };
    const comment2: TestComment = {
      kt: 'comment',
      pk: 'comment-2',
      loc: [{ kt: 'post', lk: 'post-2' }],
      text: 'Comment in post 2'
    };

    const mockFiles = [
      {
        name: 'post/post-1/comment/comment-1.json',
        download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(comment1))])
      },
      {
        name: 'post/post-2/comment/comment-2.json',
        download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(comment2))])
      }
    ];

    mockBucket.getFiles.mockResolvedValue([mockFiles]);

    const result = await all<TestComment, 'comment', 'post'>(
      mockStorage,
      bucketName,
      undefined,
      undefined, // No locations = list all
      pathBuilder,
      fileProcessor,
      coordinate,
      { bucketName, mode: 'full' } as any
    );

    expect(result.items).toHaveLength(2);
    expect(result.metadata.total).toBe(2);
  });
});

