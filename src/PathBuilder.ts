import { ComKey, isComKey, PriKey } from '@fjell/core';
import GCSLogger from './logger';

const logger = GCSLogger.get('PathBuilder');

/**
 * Configuration for PathBuilder
 */
export interface PathBuilderConfig {
  bucketName: string;
  directoryPaths: string[];
  basePath?: string;
  useJsonExtension?: boolean;
  keySharding?: {
    enabled?: boolean;
    levels?: number;
    charsPerLevel?: number;
  };
}

/**
 * Utility class for building GCS paths from Fjell keys
 */
export class PathBuilder {
  private readonly bucketName: string;
  private readonly directoryPaths: string[];
  private readonly basePath: string;
  private readonly useJsonExtension: boolean;
  private readonly shardingEnabled: boolean;
  private readonly shardingLevels: number;
  private readonly charsPerLevel: number;

  constructor(config: PathBuilderConfig) {
    this.bucketName = config.bucketName;
    this.directoryPaths = config.directoryPaths;
    this.basePath = config.basePath || '';
    this.useJsonExtension = config.useJsonExtension ?? true;
    this.shardingEnabled = config.keySharding?.enabled ?? false;
    this.shardingLevels = config.keySharding?.levels || 2;
    this.charsPerLevel = config.keySharding?.charsPerLevel || 1;

    logger.default('PathBuilder created', {
      bucketName: this.bucketName,
      directoryPaths: this.directoryPaths,
      basePath: this.basePath,
      shardingEnabled: this.shardingEnabled,
    });
  }

  /**
   * Build full GCS path from a key
   */
  buildPath(key: PriKey<any> | ComKey<any, any, any, any, any, any>): string {
    if (isComKey(key)) {
      return this.buildComKeyPath(key as ComKey<any, any, any, any, any, any>);
    }
    return this.buildPriKeyPath(key as PriKey<any>);
  }

  /**
   * Build path for a primary key
   */
  private buildPriKeyPath(key: PriKey<any>): string {
    const directory = this.getDirectoryForKeyType(key.kt);
    const filename = this.buildFilename(String(key.pk));
    
    if (this.shardingEnabled) {
      return this.buildShardedPath(directory, filename);
    }
    
    return this.joinPaths(this.basePath, directory, filename);
  }

  /**
   * Build path for a composite key
   */
  private buildComKeyPath(key: ComKey<any, any, any, any, any, any>): string {
    const parts: string[] = [];

    if (this.basePath) {
      parts.push(this.basePath);
    }

    // Add location path segments
    if (key.loc && key.loc.length > 0) {
      for (const location of key.loc as any[]) {
        const locDirectory = this.getDirectoryForKeyType(location.kt);
        parts.push(locDirectory);
        parts.push(String(location.lk));
      }
    }

    // Add the item's own directory
    const directory = this.getDirectoryForKeyType(key.kt);
    parts.push(directory);

    // Add filename (with optional sharding)
    const filename = this.buildFilename(String(key.pk));
    
    if (this.shardingEnabled) {
      const shardParts = this.buildShardParts(String(key.pk));
      parts.push(...shardParts);
    }
    
    parts.push(filename);

    return parts.join('/');
  }

  /**
   * Build sharded path for primary key
   */
  buildShardedPath(directory: string, filename: string): string {
    const pk = this.stripExtension(filename);
    const shardParts = this.buildShardParts(pk);
    
    const parts: string[] = [];
    if (this.basePath) {
      parts.push(this.basePath);
    }
    parts.push(directory);
    parts.push(...shardParts);
    parts.push(filename);
    
    return parts.join('/');
  }

  /**
   * Build shard directory parts from a primary key
   * Example: 'abc123' with levels=2, charsPerLevel=1 → ['a', 'ab']
   */
  private buildShardParts(pk: string): string[] {
    const parts: string[] = [];
    
    for (let level = 1; level <= this.shardingLevels; level++) {
      const charsNeeded = level * this.charsPerLevel;
      if (pk.length >= charsNeeded) {
        parts.push(pk.substring(0, charsNeeded).toLowerCase());
      } else {
        // Not enough characters for this level, stop creating shard levels
        break;
      }
    }
    
    return parts;
  }

  /**
   * Get directory path for a key type
   */
  private getDirectoryForKeyType(kt: string): string {
    // For simplicity, use kt as directory name
    // In a full implementation, this would map kt to directoryPaths
    return kt;
  }

  /**
   * Build directory path (without filename)
   */
  buildDirectory(kt: string, index: number): string {
    const directory = this.directoryPaths[index] || kt;
    return this.joinPaths(this.basePath, directory);
  }

  /**
   * Build filename from primary key
   */
  private buildFilename(pk: string): string {
    if (this.useJsonExtension && !pk.endsWith('.json')) {
      return `${pk}.json`;
    }
    return pk;
  }

  /**
   * Strip .json extension if present
   */
  private stripExtension(filename: string): string {
    if (filename.endsWith('.json')) {
      return filename.substring(0, filename.length - 5);
    }
    return filename;
  }

  /**
   * Join path parts, handling empty strings and duplicate slashes
   */
  private joinPaths(...parts: string[]): string {
    return parts
      .filter(p => p && p.length > 0)
      .join('/')
      .replace(/\/+/g, '/');
  }

  /**
   * Parse a GCS path back to a key (best effort)
   * Returns null if the path doesn't match expected patterns
   */
  parsePathToKey(path: string): PriKey<any> | ComKey<any, any, any, any, any, any> | null {
    try {
      // Remove base path if present
      let workingPath = path;
      if (this.basePath && path.startsWith(this.basePath + '/')) {
        workingPath = path.substring(this.basePath.length + 1);
      }

      // Split into parts
      const parts = workingPath.split('/').filter(p => p.length > 0);
      
      if (parts.length === 0) {
        return null;
      }

      // Extract filename (last part)
      const filename = parts[parts.length - 1];
      const pk = this.stripExtension(filename);

      // If sharding is enabled, we need to account for shard directories
      let ktIndex = parts.length - 2;
      if (this.shardingEnabled) {
        ktIndex = parts.length - 2 - this.shardingLevels;
      }

      // Simple case: just kt and pk
      if (ktIndex === 0) {
        const kt = parts[0];
        return { kt, pk } as PriKey<any>;
      }

      // Complex case: might be a composite key
      // This is a simplified implementation
      // In reality, you'd need more context to properly reconstruct ComKeys
      const kt = parts[ktIndex < 0 ? 0 : ktIndex];
      return { kt, pk } as PriKey<any>;
    } catch (error) {
      logger.error('Failed to parse path to key', { path, error });
      return null;
    }
  }

  /**
   * Get the bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Get the base path
   */
  getBasePath(): string {
    return this.basePath;
  }
}

