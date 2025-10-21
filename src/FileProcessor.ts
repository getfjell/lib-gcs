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
  serialize<V extends Item<string>>(item: V): string {
    try {
      return JSON.stringify(item, null, 2);
    } catch (error) {
      logger.error('Failed to serialize item', { item, error });
      throw new Error(`Failed to serialize item: ${(error as Error).message}`);
    }
  }

  /**
   * Deserialize JSON string to an item
   * Returns null if deserialization fails or item is invalid
   */
  deserialize<V extends Item<string>>(
    content: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _coordinate: Coordinate<string>
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
  validateItemStructure(item: any): item is Item<string> {
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
  serializeToBuffer<V extends Item<string>>(item: V): Buffer {
    const json = this.serialize(item);
    return Buffer.from(json, 'utf-8');
  }

  /**
   * Deserialize from a Buffer (from GCS download)
   */
  deserializeFromBuffer<V extends Item<string>>(
    buffer: Buffer,
    coordinate: Coordinate<string>
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

