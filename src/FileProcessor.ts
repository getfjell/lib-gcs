import { Coordinate, Item } from '@fjell/core';
import GCSLogger from './logger';

const logger = GCSLogger.get('FileProcessor');

/**
 * Utility class for serializing and deserializing items to/from JSON
 */
export class FileProcessor {
  /**
   * Serialize an item to JSON string
   */
  serialize<V extends Item<any, any, any, any, any, any>>(item: V): string {
    try {
      return JSON.stringify(item, null, 2);
    } catch (error: any) {
      logger.error('Failed to serialize item for GCS storage', {
        component: 'lib-gcs',
        subcomponent: 'FileProcessor',
        operation: 'serialize',
        item: item ? `${item.kt}/${item.pk}` : 'undefined',
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        suggestion: 'Check for circular references, non-serializable values (functions, symbols), or BigInt values in item data'
      });
      throw new Error(
        `Failed to serialize item for GCS storage: ${error?.message}. ` +
        `Item: ${item ? `${item.kt}/${item.pk}` : 'undefined'}. ` +
        `Suggestion: Remove non-serializable values from item data.`
      );
    }
  }

  /**
   * Deserialize JSON string to an item
   * Returns null if deserialization fails or item is invalid
   */
  deserialize<V extends Item<any, any, any, any, any, any>>(
    content: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _coordinate: Coordinate<any, any, any, any, any, any>
  ): V | null {
    try {
      const item = JSON.parse(content) as V;
      
      if (!this.validateItemStructure(item)) {
        logger.error('Deserialized content is not a valid item', { content });
        return null;
      }

      return item;
    } catch (error) {
      logger.error('Failed to deserialize content', { content, error });
      return null;
    }
  }

  /**
   * Validate that an object has the basic structure of an Item
   */
  validateItemStructure(item: any): item is Item<any, any, any, any, any, any> {
    if (!item || typeof item !== 'object') {
      return false;
    }

    // Check for required Item fields
    if (typeof item.kt !== 'string' || !item.kt) {
      return false;
    }

    if (typeof item.pk !== 'string' || !item.pk) {
      return false;
    }

    return true;
  }

  /**
   * Serialize item to a Buffer (for uploading to GCS)
   */
  serializeToBuffer<V extends Item<any, any, any, any, any, any>>(item: V): Buffer {
    const json = this.serialize(item);
    return Buffer.from(json, 'utf-8');
  }

  /**
   * Deserialize from a Buffer (from GCS download)
   */
  deserializeFromBuffer<V extends Item<any, any, any, any, any, any>>(
    buffer: Buffer,
    coordinate: Coordinate<any, any, any, any, any, any>
  ): V | null {
    try {
      const content = buffer.toString('utf-8');
      return this.deserialize<V>(content, coordinate);
    } catch (error) {
      logger.error('Failed to deserialize buffer', { error });
      return null;
    }
  }

  /**
   * Check if content is valid JSON
   */
  isValidJson(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Pretty print JSON (for debugging)
   */
  prettyPrint(item: any): string {
    try {
      return JSON.stringify(item, null, 2);
    } catch {
      return String(item);
    }
  }
}

/**
 * Singleton instance
 */
export const fileProcessor = new FileProcessor();

