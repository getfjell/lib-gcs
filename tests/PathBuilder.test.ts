import { beforeEach, describe, expect, it } from 'vitest';
import { PathBuilder, PathBuilderConfig } from '../src/PathBuilder';
import { ComKey, PriKey } from "@fjell/types";

describe('PathBuilder', () => {
  describe('Primary Keys - No Sharding', () => {
    let pathBuilder: PathBuilder;

    beforeEach(() => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        useJsonExtension: true,
        keySharding: { enabled: false },
      };
      pathBuilder = new PathBuilder(config);
    });

    it('should build path for primary key', () => {
      const key: PriKey<'user'> = { kt: 'user', pk: 'user-123' };
      const path = pathBuilder.buildPath(key);
      expect(path).toBe('user/user-123.json');
    });

    it('should build path without json extension when disabled', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        useJsonExtension: false,
      };
      const builder = new PathBuilder(config);
      const key: PriKey<'user'> = { kt: 'user', pk: 'user-123' };
      const path = builder.buildPath(key);
      expect(path).toBe('user/user-123');
    });

    it('should build path with base path', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        basePath: 'production',
        useJsonExtension: true,
      };
      const builder = new PathBuilder(config);
      const key: PriKey<'user'> = { kt: 'user', pk: 'user-123' };
      const path = builder.buildPath(key);
      expect(path).toBe('production/user/user-123.json');
    });

    it('should handle UUID primary keys', () => {
      const key: PriKey<'user'> = {
        kt: 'user',
        pk: '550e8400-e29b-41d4-a716-446655440000'
      };
      const path = pathBuilder.buildPath(key);
      expect(path).toBe('user/550e8400-e29b-41d4-a716-446655440000.json');
    });
  });

  describe('Primary Keys - With Sharding', () => {
    it('should build sharded path with default settings (2 levels, 1 char)', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        useJsonExtension: true,
        keySharding: {
          enabled: true,
          levels: 2,
          charsPerLevel: 1,
        },
      };
      const builder = new PathBuilder(config);
      const key: PriKey<'user'> = { kt: 'user', pk: 'abc123' };
      const path = builder.buildPath(key);
      expect(path).toBe('user/a/ab/abc123.json');
    });

    it('should build sharded path with UUID', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        useJsonExtension: true,
        keySharding: {
          enabled: true,
          levels: 2,
          charsPerLevel: 1,
        },
      };
      const builder = new PathBuilder(config);
      const key: PriKey<'user'> = {
        kt: 'user',
        pk: '550e8400-e29b-41d4-a716-446655440000'
      };
      const path = builder.buildPath(key);
      expect(path).toBe('user/5/55/550e8400-e29b-41d4-a716-446655440000.json');
    });

    it('should build sharded path with 3 levels', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        useJsonExtension: true,
        keySharding: {
          enabled: true,
          levels: 3,
          charsPerLevel: 1,
        },
      };
      const builder = new PathBuilder(config);
      const key: PriKey<'user'> = { kt: 'user', pk: 'abc123' };
      const path = builder.buildPath(key);
      expect(path).toBe('user/a/ab/abc/abc123.json');
    });

    it('should build sharded path with 2 chars per level', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        useJsonExtension: true,
        keySharding: {
          enabled: true,
          levels: 2,
          charsPerLevel: 2,
        },
      };
      const builder = new PathBuilder(config);
      const key: PriKey<'user'> = { kt: 'user', pk: 'abc123' };
      const path = builder.buildPath(key);
      // First 2 chars: 'ab', First 4 chars: 'abc1'
      expect(path).toBe('user/ab/abc1/abc123.json');
    });

    it('should handle short keys gracefully', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        useJsonExtension: true,
        keySharding: {
          enabled: true,
          levels: 3,
          charsPerLevel: 2,
        },
      };
      const builder = new PathBuilder(config);
      const key: PriKey<'user'> = { kt: 'user', pk: 'ab' };
      const path = builder.buildPath(key);
      // Should only create shard levels for available characters
      expect(path).toBe('user/ab/ab.json');
    });

    it('should build sharded path with base path', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        basePath: 'production',
        useJsonExtension: true,
        keySharding: {
          enabled: true,
          levels: 2,
          charsPerLevel: 1,
        },
      };
      const builder = new PathBuilder(config);
      const key: PriKey<'user'> = { kt: 'user', pk: 'abc123' };
      const path = builder.buildPath(key);
      expect(path).toBe('production/user/a/ab/abc123.json');
    });
  });

  describe('Composite Keys - No Sharding', () => {
    let pathBuilder: PathBuilder;

    beforeEach(() => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['comments', 'posts'],
        useJsonExtension: true,
        keySharding: { enabled: false },
      };
      pathBuilder = new PathBuilder(config);
    });

    it('should build path for composite key with one location', () => {
      const key: ComKey<'comment', 'post'> = {
        kt: 'comment',
        pk: 'comment-456',
        loc: [{ kt: 'post', lk: 'post-123' }],
      };
      const path = pathBuilder.buildPath(key);
      expect(path).toBe('post/post-123/comment/comment-456.json');
    });

    it('should build path for composite key with two locations', () => {
      const key: ComKey<'comment', 'post', 'user'> = {
        kt: 'comment',
        pk: 'comment-789',
        loc: [
          { kt: 'user', lk: 'user-001' },
          { kt: 'post', lk: 'post-123' },
        ],
      };
      const path = pathBuilder.buildPath(key);
      expect(path).toBe('user/user-001/post/post-123/comment/comment-789.json');
    });

    it('should build path for composite key with base path', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['comments'],
        basePath: 'production',
        useJsonExtension: true,
      };
      const builder = new PathBuilder(config);
      const key: ComKey<'comment', 'post'> = {
        kt: 'comment',
        pk: 'comment-456',
        loc: [{ kt: 'post', lk: 'post-123' }],
      };
      const path = builder.buildPath(key);
      expect(path).toBe('production/post/post-123/comment/comment-456.json');
    });
  });

  describe('Composite Keys - With Sharding', () => {
    it('should build sharded path for composite key', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['comments'],
        useJsonExtension: true,
        keySharding: {
          enabled: true,
          levels: 2,
          charsPerLevel: 1,
        },
      };
      const builder = new PathBuilder(config);
      const key: ComKey<'comment', 'post'> = {
        kt: 'comment',
        pk: 'abc456',
        loc: [{ kt: 'post', lk: 'post-123' }],
      };
      const path = builder.buildPath(key);
      // Sharding applies to the final pk segment
      expect(path).toBe('post/post-123/comment/a/ab/abc456.json');
    });

    it('should build sharded path for nested composite key', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['replies'],
        basePath: 'production',
        useJsonExtension: true,
        keySharding: {
          enabled: true,
          levels: 2,
          charsPerLevel: 1,
        },
      };
      const builder = new PathBuilder(config);
      const key: ComKey<'reply', 'comment', 'post'> = {
        kt: 'reply',
        pk: 'xyz789',
        loc: [
          { kt: 'post', lk: 'post-123' },
          { kt: 'comment', lk: 'comment-456' },
        ],
      };
      const path = builder.buildPath(key);
      expect(path).toBe('production/post/post-123/comment/comment-456/reply/x/xy/xyz789.json');
    });
  });

  describe('Path Parsing', () => {
    it('should parse simple primary key path', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        useJsonExtension: true,
      };
      const builder = new PathBuilder(config);
      const path = 'user/user-123.json';
      const key = builder.parsePathToKey(path);
      
      expect(key).toBeDefined();
      expect(key?.kt).toBe('user');
      expect(key?.pk).toBe('user-123');
    });

    it('should parse path with base path', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        basePath: 'production',
        useJsonExtension: true,
      };
      const builder = new PathBuilder(config);
      const path = 'production/user/user-123.json';
      const key = builder.parsePathToKey(path);
      
      expect(key).toBeDefined();
      expect(key?.kt).toBe('user');
      expect(key?.pk).toBe('user-123');
    });

    it('should return null for invalid paths', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
      };
      const builder = new PathBuilder(config);
      const key = builder.parsePathToKey('');
      expect(key).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    it('should return bucket name', () => {
      const config: PathBuilderConfig = {
        bucketName: 'my-bucket',
        directoryPaths: ['users'],
      };
      const builder = new PathBuilder(config);
      expect(builder.getBucketName()).toBe('my-bucket');
    });

    it('should return base path', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
        basePath: 'staging',
      };
      const builder = new PathBuilder(config);
      expect(builder.getBasePath()).toBe('staging');
    });

    it('should return empty string for missing base path', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users'],
      };
      const builder = new PathBuilder(config);
      expect(builder.getBasePath()).toBe('');
    });

    it('should build directory path', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['users', 'posts'],
      };
      const builder = new PathBuilder(config);
      const dir = builder.buildDirectory('user', 0);
      expect(dir).toBe('users');
    });
  });
});

