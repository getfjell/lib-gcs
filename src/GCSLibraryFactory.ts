import { Coordinate, Item } from "@fjell/core";
import * as Library from "@fjell/lib";
import { Registry } from "@fjell/lib";
import { Options } from "./Options";
import { InstanceFactory as BaseInstanceFactory, RegistryHub } from "@fjell/registry";
import { createGCSLibraryFromComponents, GCSLibrary } from "./GCSLibrary";
import LibLogger from "./logger";

const logger = LibLogger.get("GCSLibraryFactory");

export type GCSLibraryFactory<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> = (
  storage: any,
  operations: Library.Operations<V, S, L1, L2, L3, L4, L5>,
  options: Options<V, S, L1, L2, L3, L4, L5>,
  bucketName: string
) => BaseInstanceFactory<S, L1, L2, L3, L4, L5>;

/**
 * Factory function for creating GCS libraries
 */
export const createGCSLibraryFactory = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    storage: any,
    operations: Library.Operations<V, S, L1, L2, L3, L4, L5>,
    options: Options<V, S, L1, L2, L3, L4, L5>,
    bucketName: string
  ): BaseInstanceFactory<S, L1, L2, L3, L4, L5> => {
  return (coordinate: Coordinate<S, L1, L2, L3, L4, L5>, context: { registry: any, registryHub?: RegistryHub }) => {
    logger.default("Creating GCS library", { coordinate, registry: context.registry, storage, operations, options, bucketName });

    return createGCSLibraryFromComponents(
      context.registry as Registry,
      coordinate,
      storage,
      operations,
      options,
      bucketName
    ) as GCSLibrary<V, S, L1, L2, L3, L4, L5>;
  };
};

