import { describe, expect, it } from 'vitest';
import { createOperations } from '../src/Operations';
import { createCoordinate } from '@fjell/core';
import { Definition } from '../src/Definition';

describe('createOperations', () => {
  it('should create operations object with all methods', () => {
    const mockStorage = {} as any;
    const coordinate = createCoordinate(['test']);
    
    const definition: Definition<any, any> = {
      coordinate,
      bucketName: 'test-bucket',
      directoryPaths: ['tests'],
      basePath: '',
      options: {
        bucketName: 'test-bucket',
        mode: 'full',
        useJsonExtension: true,
        keySharding: { enabled: false },
        querySafety: {}
      } as any
    };

    const operations = createOperations(mockStorage, definition);

    expect(operations).toBeDefined();
    expect(typeof operations).toBe('object');
    expect(typeof operations.get).toBe('function');
    expect(typeof operations.create).toBe('function');
    expect(typeof operations.update).toBe('function');
    expect(typeof operations.upsert).toBe('function');
    expect(typeof operations.remove).toBe('function');
    expect(typeof operations.all).toBe('function');
    expect(typeof operations.one).toBe('function');
  });

  it('should have placeholder implementations for advanced features', () => {
    const mockStorage = {} as any;
    const coordinate = createCoordinate(['test']);
    
    const definition: Definition<any, any> = {
      coordinate,
      bucketName: 'test-bucket',
      directoryPaths: ['tests'],
      basePath: '',
      options: {
        bucketName: 'test-bucket',
        mode: 'full'
      } as any
    };

    const operations = createOperations(mockStorage, definition);

    expect(operations.finders).toBeDefined();
    expect(operations.actions).toBeDefined();
    expect(operations.facets).toBeDefined();
  });

  it('should throw error for not implemented methods', () => {
    const mockStorage = {} as any;
    const coordinate = createCoordinate(['test']);
    
    const definition: Definition<any, any> = {
      coordinate,
      bucketName: 'test-bucket',
      directoryPaths: ['tests'],
      basePath: '',
      options: {
        bucketName: 'test-bucket',
        mode: 'full'
      } as any
    };

    const operations = createOperations(mockStorage, definition);

    expect(() => operations.find()).toThrow('Not implemented yet');
    expect(() => operations.findOne()).toThrow('Not implemented yet');
    expect(() => operations.action()).toThrow('Not implemented yet');
  });
});
