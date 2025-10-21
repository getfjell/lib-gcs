import { beforeEach, describe, expect, it } from 'vitest';
import { createPrimaryGCSLibrary } from '../../src/primary/GCSLibrary';
import { createContainedGCSLibrary, createContainedGCSLibrary2 } from '../../src/contained/GCSLibrary';
import { Item } from '@fjell/core';
import { createMockStorage } from '../mocks/storageMock';

// Type definitions
interface Post extends Item<'post'> {
  title: string;
  content: string;
  status: 'draft' | 'published';
  views: number;
}

interface Comment extends Item<'comment', 'post'> {
  text: string;
  rating: number;
}

interface Reply extends Item<'reply', 'comment', 'post'> {
  text: string;
}

/**
 * Complete blog scenario with posts, comments, and replies
 */
describe('Blog E2E Scenario', () => {
  let mockStorage: any;
  let postLib: any;
  let commentLib: any;
  let replyLib: any;

  beforeEach(() => {
    mockStorage = createMockStorage();
    
    postLib = createPrimaryGCSLibrary<Post, 'post'>(
      'post',
      'posts',
      'blog-bucket',
      mockStorage as any,
      { mode: 'full' } as any
    );
    
    commentLib = createContainedGCSLibrary<Comment, 'comment', 'post'>(
      'comment',
      'post',
      ['comments', 'posts'],
      'blog-bucket',
      mockStorage as any,
      { mode: 'full' } as any
    );
    
    replyLib = createContainedGCSLibrary2<Reply, 'reply', 'comment', 'post'>(
      'reply',
      ['comment', 'post'],
      ['replies', 'comments', 'posts'],
      'blog-bucket',
      mockStorage as any,
      { mode: 'full' } as any
    );
  });

  it('should handle complete blog workflow', async () => {
    // Step 1: Create a post
    const post = await postLib.operations.create(
      {
        title: 'Hello World',
        content: 'This is my first post about GCS!',
        authorId: 'user-1',
        status: 'published',
        views: 0,
        likes: 0
      },
      {
        key: { kt: 'post', pk: 'post-123' }
      }
    );

    expect(post).toBeDefined();
    expect(post.title).toBe('Hello World');
    expect(post.pk).toBe('post-123');

    // Step 2: Get the post
    const retrievedPost = await postLib.operations.get({
      kt: 'post',
      pk: 'post-123'
    });

    expect(retrievedPost).toEqual(post);

    // Step 3: Create a comment on the post
    const comment = await commentLib.operations.create(
      {
        text: 'Great post!',
        rating: 5
      },
      {
        key: {
          kt: 'comment',
          pk: 'comment-456',
          loc: [
            { kt: 'post', lk: 'post-123' }
          ]
        }
      }
    );

    expect(comment.text).toBe('Great post!');
    expect(comment.pk).toBe('comment-456');

    // Step 4: Create a reply to the comment
    const reply = await replyLib.operations.create(
      {
        text: 'Thanks!'
      },
      {
        key: {
          kt: 'reply',
          pk: 'reply-789',
          loc: [
            { kt: 'comment', lk: 'comment-456' },
            { kt: 'post', lk: 'post-123' }
          ]
        }
      }
    );

    expect(reply.text).toBe('Thanks!');

    // Step 5: List all comments on the post
    const comments = await commentLib.operations.all(
      undefined,
      [
        { kt: 'post', lk: 'post-123' }
      ]
    );

    expect(comments).toHaveLength(1);
    expect(comments[0].text).toBe('Great post!');

    // Step 6: Update the post
    const updatedPost = await postLib.operations.update(
      { kt: 'post', pk: 'post-123' },
      { views: 100 }
    );

    expect(updatedPost.views).toBe(100);
    expect(updatedPost.title).toBe('Hello World'); // Preserved

    // Step 7: Remove the reply
    const removedReply = await replyLib.operations.remove({
      kt: 'reply',
      pk: 'reply-789',
      loc: [
        { kt: 'comment', lk: 'comment-456' },
        { kt: 'post', lk: 'post-123' }
      ]
    });

    expect(removedReply).toEqual(reply);

    // Verify reply is gone
    const replyCheck = await replyLib.operations.get({
      kt: 'reply',
      pk: 'reply-789',
      loc: [
        { kt: 'comment', lk: 'comment-456' },
        { kt: 'post', lk: 'post-123' }
      ]
    });

    expect(replyCheck).toBeNull();
  });

  it('should handle multiple posts and comments', async () => {
    // Create multiple posts
    await postLib.operations.create(
      { title: 'Post 1', content: 'Content 1', authorId: 'user-1', status: 'published', views: 0, likes: 0 },
      { key: { kt: 'post', pk: 'p1' } }
    );

    await postLib.operations.create(
      { title: 'Post 2', content: 'Content 2', authorId: 'user-1', status: 'published', views: 0, likes: 0 },
      { key: { kt: 'post', pk: 'p2' } }
    );

    // Create comments on both posts
    await commentLib.operations.create(
      { text: 'Comment on post 1', rating: 5 },
      { key: { kt: 'comment', pk: 'c1', loc: [{ kt: 'post', lk: 'p1' }] } }
    );

    await commentLib.operations.create(
      { text: 'Another comment on post 1', rating: 4 },
      { key: { kt: 'comment', pk: 'c2', loc: [{ kt: 'post', lk: 'p1' }] } }
    );

    await commentLib.operations.create(
      { text: 'Comment on post 2', rating: 5 },
      { key: { kt: 'comment', pk: 'c3', loc: [{ kt: 'post', lk: 'p2' }] } }
    );

    // List comments on post 1
    const post1Comments = await commentLib.operations.all(
      undefined,
      [{ kt: 'post', lk: 'p1' }]
    );

    expect(post1Comments).toHaveLength(2);

    // List comments on post 2
    const post2Comments = await commentLib.operations.all(
      undefined,
      [{ kt: 'post', lk: 'p2' }]
    );

    expect(post2Comments).toHaveLength(1);
  });

  it('should support custom finders and actions', async () => {
    // Create library with custom finder
    const postLibWithFinder = createPrimaryGCSLibrary<Post, 'post'>(
      'post',
      'posts',
      'blog-bucket',
      mockStorage as any,
      {
        mode: 'full',
        finders: {
          byStatus: async (params: any) => {
            const all = await postLibWithFinder.operations.all();
            return all.filter(p => p.status === params.status);
          }
        },
        actions: {
          publish: async (item: Post) => {
            const updated = { ...item, status: 'published' as const, publishedAt: new Date() };
            return [updated, []];
          }
        }
      } as any
    );

    // Create draft posts
    await postLibWithFinder.operations.create(
      { title: 'Draft 1', content: 'Content', authorId: 'user-1', status: 'draft', views: 0, likes: 0 },
      { key: { kt: 'post', pk: 'draft-1' } }
    );

    await postLibWithFinder.operations.create(
      { title: 'Published 1', content: 'Content', authorId: 'user-1', status: 'published', views: 10, likes: 2 },
      { key: { kt: 'post', pk: 'pub-1' } }
    );

    // Find draft posts
    const drafts = await postLibWithFinder.operations.find('byStatus', { status: 'draft' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toBe('Draft 1');

    // Publish a draft post using action
    const [publishedPost] = await postLibWithFinder.operations.action(
      { kt: 'post', pk: 'draft-1' },
      'publish',
      {}
    );

    expect(publishedPost.status).toBe('published');
    expect(publishedPost.publishedAt).toBeDefined();
  });
});

