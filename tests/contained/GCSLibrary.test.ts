import { describe, expect, it } from 'vitest';
import {
  createContainedGCSLibrary,
  createContainedGCSLibrary2
} from '../../src/contained/GCSLibrary';
import { Item } from "@fjell/types";

interface TestPost extends Item<'post', 'user'> {
  title: string;
}

interface TestComment extends Item<'comment', 'post', 'user'> {
  text: string;
}

describe('Contained GCSLibrary Helpers', () => {
  describe('createContainedGCSLibrary', () => {
    it('should create library for 1-level contained items', () => {
      const library = createContainedGCSLibrary<TestPost, 'post', 'user'>(
        'post',
        'user',
        ['posts', 'users'],
        'posts-bucket'
      );

      expect(library).toBeDefined();
      expect(library.bucketName).toBe('posts-bucket');
      expect(library.coordinate.kta).toEqual(['post', 'user']);
    });

    it('should accept custom storage', () => {
      const mockStorage = {} as any;
      
      const library = createContainedGCSLibrary<TestPost, 'post', 'user'>(
        'post',
        'user',
        ['posts', 'users'],
        'posts-bucket',
        mockStorage
      );

      expect(library.storage).toBe(mockStorage);
    });

    it('should accept custom options', () => {
      const options = {
        mode: 'files-only' as const,
        basePath: 'staging',
      };

      const library = createContainedGCSLibrary<TestPost, 'post', 'user'>(
        'post',
        'user',
        ['posts', 'users'],
        'posts-bucket',
        null as any,
        options as any
      );

      expect(library.options.mode).toBe('files-only');
      expect(library.options.basePath).toBe('staging');
    });
  });

  describe('createContainedGCSLibrary2', () => {
    it('should create library for 2-level contained items', () => {
      const library = createContainedGCSLibrary2<TestComment, 'comment', 'post', 'user'>(
        'comment',
        ['post', 'user'],
        ['comments', 'posts', 'users'],
        'comments-bucket'
      );

      expect(library).toBeDefined();
      expect(library.bucketName).toBe('comments-bucket');
      expect(library.coordinate.kta).toEqual(['comment', 'post', 'user']);
    });

    it('should accept custom storage', () => {
      const mockStorage = {} as any;
      
      const library = createContainedGCSLibrary2<TestComment, 'comment', 'post', 'user'>(
        'comment',
        ['post', 'user'],
        ['comments', 'posts', 'users'],
        'comments-bucket',
        mockStorage
      );

      expect(library.storage).toBe(mockStorage);
    });

    it('should accept custom options', () => {
      const options = {
        keySharding: {
          enabled: true,
          levels: 2,
        },
      };

      const library = createContainedGCSLibrary2<TestComment, 'comment', 'post', 'user'>(
        'comment',
        ['post', 'user'],
        ['comments', 'posts', 'users'],
        'comments-bucket',
        null as any,
        options as any
      );

      expect(library.options.keySharding?.enabled).toBe(true);
      expect(library.options.keySharding?.levels).toBe(2);
    });

    it('should have all operations available', () => {
      const library = createContainedGCSLibrary2<TestComment, 'comment', 'post', 'user'>(
        'comment',
        ['post', 'user'],
        ['comments', 'posts', 'users'],
        'comments-bucket'
      );

      expect(library.operations).toBeDefined();
      expect(typeof library.operations.get).toBe('function');
      expect(typeof library.operations.create).toBe('function');
      expect(typeof library.operations.update).toBe('function');
      expect(typeof library.operations.upsert).toBe('function');
      expect(typeof library.operations.remove).toBe('function');
      expect(typeof library.operations.all).toBe('function');
      expect(typeof library.operations.one).toBe('function');
    });
  });
});
