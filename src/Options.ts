import { ComKey, Item, LocKeyArray, PriKey } from '@fjell/core';
import * as Library from '@fjell/lib';
import LibLogger from './logger';

const logger = LibLogger.get('Options');

/**
 * GCS-specific Options
 */
export interface Options<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> {
  hooks?: {
    preCreate?: (
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
      options?:
        {
          key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
          locations?: never;
        } | {
          key?: never;
          locations: LocKeyArray<L1, L2, L3, L4, L5>,
        }
    ) => Promise<Partial<Item<S, L1, L2, L3, L4, L5>>>;
    postCreate?: (
      item: V,
    ) => Promise<V>;
    preUpdate?: (
      key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
    ) => Promise<Partial<Item<S, L1, L2, L3, L4, L5>>>;
    postUpdate?: (
      item: V,
    ) => Promise<V>;
    preRemove?: (
      key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    ) => Promise<Partial<Item<S, L1, L2, L3, L4, L5>>>;
    postRemove?: (
      item: V,
    ) => Promise<V>;
  },
  validators?: {
    onCreate?: (
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
      options?:
        {
          key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
          locations?: never;
        } | {
          key?: never;
          locations: LocKeyArray<L1, L2, L3, L4, L5>,
        }
    ) => Promise<boolean>;
    onUpdate?: (
      key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
      item: Partial<Item<S, L1, L2, L3, L4, L5>>,
    ) => Promise<boolean>;
    onRemove?: (
      key: PriKey<S> | ComKey<S, L1, L2, L3, L4, L5>,
    ) => Promise<boolean>;
  },
  finders?: Record<string, Library.FinderMethod<V, S, L1, L2, L3, L4, L5>>,
  actions?: Record<string, Library.ActionMethod<V, S, L1, L2, L3, L4, L5>>,
  facets?: Record<string, Library.FacetMethod<V, S, L1, L2, L3, L4, L5>>,
  allActions?: Record<string, Library.AllActionMethod<V, S, L1, L2, L3, L4, L5>>,
  allFacets?: Record<string, Library.AllFacetMethod<L1, L2, L3, L4, L5>>,
  aggregations?: Library.AggregationDefinition[],
  // GCS-specific options
  bucketName?: string;
  mode?: 'full' | 'files-only';
}

export const createOptions = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(libOptions?: Library.Options<V, S, L1, L2, L3, L4, L5>):
  Options<V, S, L1, L2, L3, L4, L5> => {
  logger.default('createOptions', { libOptions });
  
  // Create base options from Library
  const baseOptions = Library.createOptions(libOptions || {} as Library.Options<V, S, L1, L2, L3, L4, L5>);
  
  return {
    ...baseOptions,
  } as Options<V, S, L1, L2, L3, L4, L5>;
}

