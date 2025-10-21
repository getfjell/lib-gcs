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

  it('should have finders, actions, and facets from options', () => {
    const mockStorage = {} as any;
    const coordinate = createCoordinate(['test']);
    
    const testFinder = async () => [];
    const testAction = async (item: any) => [item, []];
    const testFacet = async () => ({ test: true });
    
    const definition: Definition<any, any> = {
      coordinate,
      bucketName: 'test-bucket',
      directoryPaths: ['tests'],
      basePath: '',
      options: {
        bucketName: 'test-bucket',
        mode: 'full',
        finders: { testFinder },
        actions: { testAction },
        facets: { testFacet }
      } as any
    };

    const operations = createOperations(mockStorage, definition);

    expect(operations.finders).toBeDefined();
    expect(operations.actions).toBeDefined();
    expect(operations.facets).toBeDefined();
    expect(operations.finders.testFinder).toBe(testFinder);
    expect(operations.actions.testAction).toBe(testAction);
    expect(operations.facets.testFacet).toBe(testFacet);
  });

  it('should have all extended operation methods', () => {
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

    expect(typeof operations.find).toBe('function');
    expect(typeof operations.findOne).toBe('function');
    expect(typeof operations.action).toBe('function');
    expect(typeof operations.allAction).toBe('function');
    expect(typeof operations.facet).toBe('function');
    expect(typeof operations.allFacet).toBe('function');
  });
});
