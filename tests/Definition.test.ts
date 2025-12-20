import { describe, expect, it } from 'vitest';
import { createDefinition } from '../src/Definition';
import { ItemTypeArray } from "@fjell/types";

describe('createDefinition', () => {
  it('should create a definition with all required fields', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read', 'write'];
    const directoryPaths = ['users'];
    const bucketName = 'test-bucket';

    const definition = createDefinition(
      kta,
      scopes,
      directoryPaths,
      bucketName
    );

    expect(definition).toBeDefined();
    expect(definition.bucketName).toBe(bucketName);
    expect(definition.directoryPaths).toEqual(directoryPaths);
    expect(definition.basePath).toBe('');
    expect(definition.coordinate).toBeDefined();
    expect(definition.options).toBeDefined();
  });

  it('should create definition with custom base path', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users'];
    const bucketName = 'test-bucket';
    const basePath = 'production';

    const definition = createDefinition(
      kta,
      scopes,
      directoryPaths,
      bucketName,
      undefined,
      basePath
    );

    expect(definition.basePath).toBe('production');
  });

  it('should create definition with custom options', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users'];
    const bucketName = 'test-bucket';
    const libOptions = {
      mode: 'files-only' as const,
      useJsonExtension: false,
    };

    const definition = createDefinition(
      kta,
      scopes,
      directoryPaths,
      bucketName,
      libOptions
    );

    expect(definition.options.mode).toBe('files-only');
    expect(definition.options.useJsonExtension).toBe(false);
  });

  it('should handle contained items', () => {
    const kta = ['comment', 'post'] as ItemTypeArray<'comment', 'post'>;
    const scopes = ['read'];
    const directoryPaths = ['comments', 'posts'];
    const bucketName = 'comments-bucket';

    const definition = createDefinition(
      kta,
      scopes,
      directoryPaths,
      bucketName
    );

    expect(definition.directoryPaths).toEqual(['comments', 'posts']);
    expect(definition.coordinate).toBeDefined();
  });

  it('should throw error if bucketName is empty', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users'];

    expect(() => {
      createDefinition(kta, scopes, directoryPaths, '');
    }).toThrow('bucketName is required and cannot be empty');
  });

  it('should throw error if bucketName is whitespace', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users'];

    expect(() => {
      createDefinition(kta, scopes, directoryPaths, '   ');
    }).toThrow('bucketName is required and cannot be empty');
  });

  it('should throw error if directoryPaths length does not match kta length', () => {
    const kta = ['user', 'post'] as ItemTypeArray<'user', 'post'>;
    const scopes = ['read'];
    const directoryPaths = ['users']; // Wrong length

    expect(() => {
      createDefinition(kta, scopes, directoryPaths, 'test-bucket');
    }).toThrow('directoryPaths length (1) must match kta length (2)');
  });

  it('should throw error for invalid directory path with ..', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['../users'];

    expect(() => {
      createDefinition(kta, scopes, directoryPaths, 'test-bucket');
    }).toThrow('Invalid directory path');
  });

  it('should throw error for invalid directory path with //', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users//data'];

    expect(() => {
      createDefinition(kta, scopes, directoryPaths, 'test-bucket');
    }).toThrow('Invalid directory path');
  });

  it('should throw error for directory path starting with /', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['/users'];

    expect(() => {
      createDefinition(kta, scopes, directoryPaths, 'test-bucket');
    }).toThrow('Invalid directory path');
  });

  it('should set default options when none provided', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users'];
    const bucketName = 'test-bucket';

    const definition = createDefinition(
      kta,
      scopes,
      directoryPaths,
      bucketName
    );

    expect(definition.options.mode).toBe('full');
    expect(definition.options.useJsonExtension).toBe(true);
    expect(definition.options.keySharding?.enabled).toBe(false);
    expect(definition.options.querySafety?.maxScanFiles).toBe(1000);
  });

  it('should merge base path from options if not provided as parameter', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users'];
    const bucketName = 'test-bucket';
    const libOptions = {
      basePath: 'from-options',
    };

    const definition = createDefinition(
      kta,
      scopes,
      directoryPaths,
      bucketName,
      libOptions
    );

    expect(definition.basePath).toBe('from-options');
  });

  it('should prefer explicit basePath parameter over options', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users'];
    const bucketName = 'test-bucket';
    const libOptions = {
      basePath: 'from-options',
    };

    const definition = createDefinition(
      kta,
      scopes,
      directoryPaths,
      bucketName,
      libOptions,
      'from-parameter'
    );

    expect(definition.basePath).toBe('from-parameter');
  });

  it('should handle sharding options', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users'];
    const bucketName = 'test-bucket';
    const libOptions = {
      keySharding: {
        enabled: true,
        levels: 3,
        charsPerLevel: 2,
      },
    };

    const definition = createDefinition(
      kta,
      scopes,
      directoryPaths,
      bucketName,
      libOptions
    );

    expect(definition.options.keySharding?.enabled).toBe(true);
    expect(definition.options.keySharding?.levels).toBe(3);
    expect(definition.options.keySharding?.charsPerLevel).toBe(2);
  });

  it('should handle querySafety options', () => {
    const kta = ['user'] as ItemTypeArray<'user'>;
    const scopes = ['read'];
    const directoryPaths = ['users'];
    const bucketName = 'test-bucket';
    const libOptions = {
      querySafety: {
        maxScanFiles: 500,
        warnThreshold: 50,
        disableQueryOperations: true,
        downloadConcurrency: 5,
      },
    };

    const definition = createDefinition(
      kta,
      scopes,
      directoryPaths,
      bucketName,
      libOptions
    );

    expect(definition.options.querySafety?.maxScanFiles).toBe(500);
    expect(definition.options.querySafety?.warnThreshold).toBe(50);
    expect(definition.options.querySafety?.disableQueryOperations).toBe(true);
    expect(definition.options.querySafety?.downloadConcurrency).toBe(5);
  });
});
