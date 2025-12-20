import { describe, expect, it } from 'vitest';
import {
  createContainedGCSLibrary,
  createContainedGCSLibrary2,
  createPrimaryGCSLibrary,
  GCSLibraryFactoryConfig
} from '../src/GCSLibraryFactory';
import { Item } from "@fjell/types";

interface TestUser extends Item<'user'> {
  name: string;
}

interface TestComment extends Item<'comment', 'post'> {
  text: string;
}

interface TestReply extends Item<'reply', 'comment', 'post'> {
  content: string;
}

describe('GCSLibraryFactory', () => {
  describe('createPrimaryGCSLibrary', () => {
    it('should create library for primary items', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'users-bucket',
      };

      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        config
      );

      expect(library).toBeDefined();
      expect(library.bucketName).toBe('users-bucket');
      expect(library.coordinate.kta).toEqual(['user']);
    });

    it('should apply factory config options', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'test-bucket',
        basePath: 'production',
        useJsonExtension: false,
        mode: 'files-only',
        keySharding: {
          enabled: true,
          levels: 3,
        },
      };

      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        config
      );

      expect(library.options.basePath).toBe('production');
      expect(library.options.useJsonExtension).toBe(false);
      expect(library.options.mode).toBe('files-only');
      expect(library.options.keySharding?.enabled).toBe(true);
      expect(library.options.keySharding?.levels).toBe(3);
    });

    it('should merge library options with config', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'test-bucket',
        basePath: 'staging',
      };

      const libOptions = {
        hooks: {
          preCreate: async (item: any) => item,
        },
      };

      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        config,
        libOptions
      );

      expect(library.options.hooks?.preCreate).toBeDefined();
      expect(library.options.basePath).toBe('staging');
    });
  });

  describe('createContainedGCSLibrary', () => {
    it('should create library for contained items (1 level)', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'comments-bucket',
      };

      const library = createContainedGCSLibrary<TestComment, 'comment', 'post'>(
        'comment',
        'post',
        ['comments', 'posts'],
        config
      );

      expect(library).toBeDefined();
      expect(library.bucketName).toBe('comments-bucket');
      expect(library.coordinate.kta).toEqual(['comment', 'post']);
    });

    it('should apply config options', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'test-bucket',
        querySafety: {
          maxScanFiles: 500,
          disableQueryOperations: true,
        },
      };

      const library = createContainedGCSLibrary<TestComment, 'comment', 'post'>(
        'comment',
        'post',
        ['comments', 'posts'],
        config
      );

      expect(library.options.querySafety?.maxScanFiles).toBe(500);
      expect(library.options.querySafety?.disableQueryOperations).toBe(true);
    });
  });

  describe('createContainedGCSLibrary2', () => {
    it('should create library for contained items (2 levels)', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'replies-bucket',
      };

      const library = createContainedGCSLibrary2<TestReply, 'reply', 'comment', 'post'>(
        'reply',
        ['comment', 'post'],
        ['replies', 'comments', 'posts'],
        config
      );

      expect(library).toBeDefined();
      expect(library.bucketName).toBe('replies-bucket');
      expect(library.coordinate.kta).toEqual(['reply', 'comment', 'post']);
    });

    it('should create functional operations', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'test-bucket',
      };

      const library = createContainedGCSLibrary2<TestReply, 'reply', 'comment', 'post'>(
        'reply',
        ['comment', 'post'],
        ['replies', 'comments', 'posts'],
        config
      );

      expect(library.operations).toBeDefined();
      expect(typeof library.operations.get).toBe('function');
      expect(typeof library.operations.create).toBe('function');
      expect(typeof library.operations.update).toBe('function');
    });
  });
});
