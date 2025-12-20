import { describe, expect, it } from 'vitest';
import {
  createContainedGCSLibrary,
  createContainedGCSLibrary2,
  createPrimaryGCSLibrary,
  GCSLibraryFactoryConfig
} from '../../src/GCSLibraryFactory';
import { Item } from "@fjell/types";

interface TestUser extends Item<'user'> {
  name: string;
}

interface TestPost extends Item<'post', 'user'> {
  title: string;
}

interface TestComment extends Item<'comment', 'post', 'user'> {
  text: string;
}

describe('Factory Patterns', () => {
  const mockStorage = {} as any;

  describe('Primary Item Factory', () => {
    it('should create library with minimal config', () => {
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
    });

    it('should create library with full config', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'users-bucket',
        storage: mockStorage,
        basePath: 'production',
        useJsonExtension: true,
        mode: 'full',
        keySharding: {
          enabled: true,
          levels: 2,
          charsPerLevel: 1,
        },
        querySafety: {
          maxScanFiles: 1000,
          warnThreshold: 100,
        },
      };

      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        config
      );

      expect(library.bucketName).toBe('users-bucket');
      expect(library.storage).toBe(mockStorage);
      expect(library.options.basePath).toBe('production');
      expect(library.options.useJsonExtension).toBe(true);
      expect(library.options.mode).toBe('full');
      expect(library.options.keySharding?.enabled).toBe(true);
    });
  });

  describe('Contained Item Factory (1 level)', () => {
    it('should create library for 1-level contained items', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'posts-bucket',
      };

      const library = createContainedGCSLibrary<TestPost, 'post', 'user'>(
        'post',
        'user',
        ['posts', 'users'],
        config
      );

      expect(library).toBeDefined();
      expect(library.bucketName).toBe('posts-bucket');
      expect(library.coordinate.kta).toEqual(['post', 'user']);
    });

    it('should apply options correctly', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'posts-bucket',
        mode: 'files-only',
      };

      const library = createContainedGCSLibrary<TestPost, 'post', 'user'>(
        'post',
        'user',
        ['posts', 'users'],
        config
      );

      expect(library.options.mode).toBe('files-only');
    });
  });

  describe('Contained Item Factory (2 levels)', () => {
    it('should create library for 2-level contained items', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'comments-bucket',
      };

      const library = createContainedGCSLibrary2<TestComment, 'comment', 'post', 'user'>(
        'comment',
        ['post', 'user'],
        ['comments', 'posts', 'users'],
        config
      );

      expect(library).toBeDefined();
      expect(library.bucketName).toBe('comments-bucket');
      expect(library.coordinate.kta).toEqual(['comment', 'post', 'user']);
    });

    it('should have functional operations', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'comments-bucket',
      };

      const library = createContainedGCSLibrary2<TestComment, 'comment', 'post', 'user'>(
        'comment',
        ['post', 'user'],
        ['comments', 'posts', 'users'],
        config
      );

      expect(library.operations).toBeDefined();
      expect(typeof library.operations.create).toBe('function');
      expect(typeof library.operations.all).toBe('function');
    });
  });

  describe('Cross-Factory Consistency', () => {
    it('should create compatible libraries for different factories', () => {
      const config: GCSLibraryFactoryConfig = {
        bucketName: 'test-bucket',
        basePath: 'production',
      };

      const userLib = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        config
      );

      const postLib = createContainedGCSLibrary<TestPost, 'post', 'user'>(
        'post',
        'user',
        ['posts', 'users'],
        config
      );

      expect(userLib.bucketName).toBe(postLib.bucketName);
      expect(userLib.options.basePath).toBe(postLib.options.basePath);
    });
  });
});

