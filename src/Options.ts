import { Item } from "@fjell/types";
import * as Library from '@fjell/lib';
import { Storage } from '@google-cloud/storage';

/**
 * GCS-specific Options that extends base library options
 */
export interface Options<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends Library.Options<V, S, L1, L2, L3, L4, L5> {
  /** The GCS bucket name where items are stored */
  bucketName: string;
  
  /** Optional GCS storage client (if not provided, one will be created) */
  storage?: Storage;
  
  /** Optional base path prefix within the bucket */
  basePath?: string;
  
  /** Whether to use .json extension for files (default: true) */
  useJsonExtension?: boolean;
  
  /**
   * Library mode (default: 'full')
   * - 'full': Both item operations AND file operations (complete storage in GCS)
   * - 'files-only': ONLY file operations (hybrid mode - items stored elsewhere)
   *
   * Use 'files-only' when items are stored in another library (e.g., Firestore)
   * but you want to use GCS for file attachments.
   */
  mode?: 'full' | 'files-only';
  
  /**
   * When in 'files-only' mode, where to store file metadata
   * - 'none': Don't store metadata, list from GCS on demand (slower)
   * - 'external': Metadata stored in external library (caller manages)
   */
  fileMetadataStorage?: 'none' | 'external';
  
  /**
   * Key sharding configuration for massive datasets (billions of objects)
   * Adds prefix directories based on the first N characters of the primary key
   * Example: user/abc123.json → user/a/ab/abc123.json
   * This improves performance by distributing objects across more prefixes
   */
  keySharding?: {
    /** Enable key sharding (default: false) */
    enabled?: boolean;
    
    /** Number of prefix levels (1-3, default: 2) */
    levels?: number;
    
    /** Characters per level (default: 1, so 2 levels = a/ab/) */
    charsPerLevel?: number;
  };
  
  /**
   * Query operation safety limits (to prevent expensive operations on large buckets)
   * GCS does not support server-side querying - all filtering happens in-memory
   */
  querySafety?: {
    /** Maximum number of files to scan in all()/one() operations (default: 1000) */
    maxScanFiles?: number;
    
    /** Log warning when scanning more than this many files (default: 100) */
    warnThreshold?: number;
    
    /** If true, disable all()/one() operations entirely (default: false) */
    disableQueryOperations?: boolean;
    
    /** Maximum concurrent file downloads during query operations (default: 10) */
    downloadConcurrency?: number;
  };

  /**
   * File attachment configuration
   */
  files?: {
    /** Subdirectory name for files (default: "_files") */
    directory?: string;
    
    /** Maximum file size in bytes (default: no limit) */
    maxFileSize?: number;
    
    /** Allowed content types (default: all allowed) */
    allowedContentTypes?: string[];
    
    /** Whether to include file metadata in item JSON (default: true) */
    includeMetadataInItem?: boolean;
    
    /** Whether to compute checksums (default: true) */
    computeChecksums?: boolean;
  };
}

/**
 * Create Options with defaults
 */
export const createOptions = <
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
>(
    bucketName: string,
    libOptions?: Partial<Library.Options<V, S, L1, L2, L3, L4, L5>> & Partial<Options<V, S, L1, L2, L3, L4, L5>>
  ): Options<V, S, L1, L2, L3, L4, L5> => {
  // Create base options from Library
  const baseOptions = Library.createOptions(libOptions || {} as Library.Options<V, S, L1, L2, L3, L4, L5>);
  
  return {
    ...baseOptions,
    bucketName,
    storage: libOptions?.storage,
    basePath: libOptions?.basePath || '',
    useJsonExtension: libOptions?.useJsonExtension ?? true,
    mode: libOptions?.mode || 'full',
    fileMetadataStorage: libOptions?.fileMetadataStorage || 'none',
    keySharding: {
      enabled: libOptions?.keySharding?.enabled ?? false,
      levels: libOptions?.keySharding?.levels || 2,
      charsPerLevel: libOptions?.keySharding?.charsPerLevel || 1,
    },
    querySafety: {
      maxScanFiles: libOptions?.querySafety?.maxScanFiles || 1000,
      warnThreshold: libOptions?.querySafety?.warnThreshold || 100,
      disableQueryOperations: libOptions?.querySafety?.disableQueryOperations ?? false,
      downloadConcurrency: libOptions?.querySafety?.downloadConcurrency || 10,
    },
  } as Options<V, S, L1, L2, L3, L4, L5>;
};
