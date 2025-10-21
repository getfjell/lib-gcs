import { ComKey, Item, ItemQuery, LocKeyArray, PriKey } from '@fjell/core';
import { Storage } from '@google-cloud/storage';
import * as Library from '@fjell/lib';
import { Definition } from './Definition';
import { PathBuilder } from './PathBuilder';
import { FileProcessor } from './FileProcessor';
import * as ops from './ops';
import GCSLogger from './logger';
import { Registry } from '@fjell/lib';

const logger = GCSLogger.get('Operations');

/**
 * Create Operations implementation for GCS Library
 */
export const createOperations = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    storage: Storage,
    definition: Definition<V, S, L1, L2, L3, L4, L5>,
   
    _registry?: Registry
  ): Library.Operations<V, S, L1, L2, L3, L4, L5> => {
  logger.default('createOperations', {
    bucketName: definition.bucketName,
    coordinate: definition.coordinate
  });

  // Create PathBuilder and FileProcessor instances
  const pathBuilder = new PathBuilder({
    bucketName: definition.bucketName,
    directoryPaths: definition.directoryPaths,
    basePath: definition.basePath,
    useJsonExtension: definition.options.useJsonExtension,
    keySharding: definition.options.keySharding
  });

  const fileProcessor = new FileProcessor();

  const { bucketName, options, coordinate } = definition;

  // Create implementation operations (core CRUD and query operations)
  const implOps: Library.ImplementationOperations<V, S, L1, L2, L3, L4, L5> = {
    get: async (key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>) => {
      return ops.get<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    create: async (
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
      createOptions?: ops.CreateOptions<S, L1, L2, L3, L4, L5>
    ) => {
      return ops.create<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        item,
        createOptions,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    update: async (
      key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
      updateOptions?: ops.UpdateOptions
    ) => {
      return ops.update<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        item,
        updateOptions,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    upsert: async (
      key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
      locations?: LocKeyArray<L1, L2, L3, L4, L5>,
      updateOptions?: ops.UpdateOptions
    ) => {
      return ops.upsert<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        item,
        locations,
        updateOptions,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    remove: async (key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>) => {
      return ops.remove<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        key,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    all: async (
      query?: ItemQuery,
      locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
    ) => {
      return ops.all<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        query,
        locations,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    one: async (
      query?: ItemQuery,
      locations?: LocKeyArray<L1, L2, L3, L4, L5> | []
    ) => {
      return ops.one<V, S, L1, L2, L3, L4, L5>(
        storage,
        bucketName,
        query,
        locations,
        pathBuilder,
        fileProcessor,
        coordinate,
        options
      );
    },

    // Find operations - execute user-defined finders
    find: async (finder: string, params: any = {}, locations?: any) => {
      if (!options.finders || !options.finders[finder]) {
        throw new Error(`Finder '${finder}' not found`);
      }
      
      // Execute user's finder function which should do the query
      return options.finders[finder](params, locations);
    },

    findOne: async (finder: string, params: any = {}, locations?: any) => {
      if (!options.finders || !options.finders[finder]) {
        throw new Error(`Finder '${finder}' not found`);
      }
      
      const results = await options.finders[finder](params, locations);
      return results.length > 0 ? results[0] : null;
    }
  };

  // Wrap with hooks, validation, and extended operations using @fjell/lib wrapper
  return Library.wrapOperations(implOps as any, options, coordinate, _registry || ({} as Registry));
};
