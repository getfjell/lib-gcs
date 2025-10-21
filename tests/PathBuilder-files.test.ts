import { describe, expect, it } from 'vitest';
import { PathBuilder, PathBuilderConfig } from '../src/PathBuilder';

describe('PathBuilder - File Path Methods', () => {
  let pathBuilder: PathBuilder;

  beforeEach(() => {
    const config: PathBuilderConfig = {
      bucketName: 'test-bucket',
      directoryPaths: ['recordings', 'users'],
      useJsonExtension: true,
    };
    pathBuilder = new PathBuilder(config);
  });

  describe('buildFilesDirectory', () => {
    it('should build files directory for primary key', () => {
      const key = { kt: 'recording', pk: 'rec-123' };
      const path = pathBuilder.buildFilesDirectory(key);
      expect(path).toBe('recording/rec-123/_files');
    });

    it('should build files directory for composite key', () => {
      const key = {
        kt: 'recording',
        pk: 'rec-123',
        loc: [{ kt: 'user', lk: 'user-456' }]
      };
      const path = pathBuilder.buildFilesDirectory(key);
      expect(path).toBe('user/user-456/recording/rec-123/_files');
    });

    it('should use custom files directory name', () => {
      const key = { kt: 'recording', pk: 'rec-123' };
      const path = pathBuilder.buildFilesDirectory(key, 'attachments');
      expect(path).toBe('recording/rec-123/attachments');
    });
  });

  describe('buildFilePath', () => {
    it('should build file path with label and filename', () => {
      const key = { kt: 'recording', pk: 'rec-123' };
      const path = pathBuilder.buildFilePath(key, 'master', '0.wav');
      expect(path).toBe('recording/rec-123/_files/master/0.wav');
    });

    it('should build file path for nested item', () => {
      const key = {
        kt: 'recording',
        pk: 'rec-123',
        loc: [{ kt: 'user', lk: 'user-456' }]
      };
      const path = pathBuilder.buildFilePath(key, 'final', 'output.mp3');
      expect(path).toBe('user/user-456/recording/rec-123/_files/final/output.mp3');
    });
  });

  describe('buildLabelDirectory', () => {
    it('should build label directory path', () => {
      const key = { kt: 'recording', pk: 'rec-123' };
      const path = pathBuilder.buildLabelDirectory(key, 'master');
      expect(path).toBe('recording/rec-123/_files/master');
    });
  });

  describe('parseFilePath', () => {
    it('should parse file path to extract components', () => {
      const path = 'recording/rec-123/_files/master/0.wav';
      const parsed = pathBuilder.parseFilePath(path);

      expect(parsed).toBeDefined();
      expect(parsed?.label).toBe('master');
      expect(parsed?.filename).toBe('0.wav');
      expect(parsed?.key.kt).toBe('recording');
      expect(parsed?.key.pk).toBe('rec-123');
    });

    it('should handle nested filenames', () => {
      const path = 'recording/rec-123/_files/master/subdir/file.wav';
      const parsed = pathBuilder.parseFilePath(path);

      expect(parsed).toBeDefined();
      expect(parsed?.filename).toBe('subdir/file.wav');
    });

    it('should return null for invalid paths', () => {
      const parsed = pathBuilder.parseFilePath('invalid/path');
      expect(parsed).toBeNull();
    });
  });

  describe('buildDirectoryFromLocations', () => {
    it('should build directory from single location', () => {
      const locations = [{ kt: 'user', lk: 'user-456' }];
      const path = pathBuilder.buildDirectoryFromLocations(locations);
      expect(path).toBe('user/user-456');
    });

    it('should build directory from multiple locations', () => {
      const locations = [
        { kt: 'user', lk: 'user-123' },
        { kt: 'post', lk: 'post-456' }
      ];
      const path = pathBuilder.buildDirectoryFromLocations(locations);
      expect(path).toBe('user/user-123/post/post-456');
    });

    it('should handle empty locations array', () => {
      const path = pathBuilder.buildDirectoryFromLocations([]);
      expect(path).toBe('');
    });

    it('should include base path', () => {
      const config: PathBuilderConfig = {
        bucketName: 'test-bucket',
        directoryPaths: ['recordings'],
        basePath: 'production',
      };
      const builder = new PathBuilder(config);
      
      const locations = [{ kt: 'user', lk: 'user-456' }];
      const path = builder.buildDirectoryFromLocations(locations);
      expect(path).toBe('production/user/user-456');
    });
  });
});

