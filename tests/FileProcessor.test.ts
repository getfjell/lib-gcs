import { describe, expect, it } from 'vitest';
import { FileProcessor, fileProcessor } from '../src/FileProcessor';
import { createCoordinate, Item } from '@fjell/core';

interface TestItem extends Item<'test'> {
  name: string;
  value: number;
}

describe('FileProcessor', () => {
  const processor = new FileProcessor();
  const coordinate = createCoordinate(['test']);

  describe('serialize', () => {
    it('should serialize an item to JSON string', () => {
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Test Item',
        value: 42,
      };

      const json = processor.serialize(item);
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
      
      const parsed = JSON.parse(json);
      expect(parsed.kt).toBe('test');
      expect(parsed.pk).toBe('test-123');
      expect(parsed.name).toBe('Test Item');
      expect(parsed.value).toBe(42);
    });

    it('should serialize with pretty formatting', () => {
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Test',
        value: 1,
      };

      const json = processor.serialize(item);
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('should handle items with nested objects', () => {
      const item: any = {
        kt: 'test',
        pk: 'test-123',
        nested: {
          field1: 'value1',
          field2: 'value2',
        },
      };

      const json = processor.serialize(item);
      const parsed = JSON.parse(json);
      expect(parsed.nested.field1).toBe('value1');
      expect(parsed.nested.field2).toBe('value2');
    });

    it('should handle items with arrays', () => {
      const item: any = {
        kt: 'test',
        pk: 'test-123',
        tags: ['tag1', 'tag2', 'tag3'],
      };

      const json = processor.serialize(item);
      const parsed = JSON.parse(json);
      expect(parsed.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('deserialize', () => {
    it('should deserialize valid JSON to item', () => {
      const json = JSON.stringify({
        kt: 'test',
        pk: 'test-456',
        name: 'Deserialized',
        value: 99,
      });

      const item = processor.deserialize<TestItem>(json, coordinate);
      expect(item).toBeDefined();
      expect(item?.kt).toBe('test');
      expect(item?.pk).toBe('test-456');
      expect(item?.name).toBe('Deserialized');
      expect(item?.value).toBe(99);
    });

    it('should return null for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      const item = processor.deserialize<TestItem>(invalidJson, coordinate);
      expect(item).toBeNull();
    });

    it('should return null for objects without kt', () => {
      const json = JSON.stringify({
        pk: 'test-456',
        name: 'Missing kt',
      });

      const item = processor.deserialize<TestItem>(json, coordinate);
      expect(item).toBeNull();
    });

    it('should return null for objects without pk', () => {
      const json = JSON.stringify({
        kt: 'test',
        name: 'Missing pk',
      });

      const item = processor.deserialize<TestItem>(json, coordinate);
      expect(item).toBeNull();
    });

    it('should handle pretty-formatted JSON', () => {
      const json = `{
  "kt": "test",
  "pk": "test-789",
  "name": "Pretty",
  "value": 123
}`;

      const item = processor.deserialize<TestItem>(json, coordinate);
      expect(item).toBeDefined();
      expect(item?.kt).toBe('test');
      expect(item?.pk).toBe('test-789');
    });
  });

  describe('validateItemStructure', () => {
    it('should validate valid item', () => {
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Valid',
        value: 1,
      };

      expect(processor.validateItemStructure(item)).toBe(true);
    });

    it('should reject null', () => {
      expect(processor.validateItemStructure(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(processor.validateItemStructure(undefined)).toBe(false);
    });

    it('should reject non-objects', () => {
      expect(processor.validateItemStructure('string')).toBe(false);
      expect(processor.validateItemStructure(123)).toBe(false);
      expect(processor.validateItemStructure(true)).toBe(false);
    });

    it('should reject objects without kt', () => {
      const item = { pk: 'test-123', name: 'No kt' };
      expect(processor.validateItemStructure(item)).toBe(false);
    });

    it('should reject objects without pk', () => {
      const item = { kt: 'test', name: 'No pk' };
      expect(processor.validateItemStructure(item)).toBe(false);
    });

    it('should reject objects with empty kt', () => {
      const item = { kt: '', pk: 'test-123' };
      expect(processor.validateItemStructure(item)).toBe(false);
    });

    it('should reject objects with empty pk', () => {
      const item = { kt: 'test', pk: '' };
      expect(processor.validateItemStructure(item)).toBe(false);
    });
  });

  describe('serializeToBuffer', () => {
    it('should serialize item to buffer', () => {
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Buffer Test',
        value: 42,
      };

      const buffer = processor.serializeToBuffer(item);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should create buffer that can be converted back to string', () => {
      const item: TestItem = {
        kt: 'test',
        pk: 'test-123',
        name: 'Round trip',
        value: 99,
      };

      const buffer = processor.serializeToBuffer(item);
      const str = buffer.toString('utf-8');
      const parsed = JSON.parse(str);
      
      expect(parsed.kt).toBe('test');
      expect(parsed.pk).toBe('test-123');
      expect(parsed.name).toBe('Round trip');
    });
  });

  describe('deserializeFromBuffer', () => {
    it('should deserialize buffer to item', () => {
      const json = JSON.stringify({
        kt: 'test',
        pk: 'test-456',
        name: 'From Buffer',
        value: 77,
      });
      const buffer = Buffer.from(json, 'utf-8');

      const item = processor.deserializeFromBuffer<TestItem>(buffer, coordinate);
      expect(item).toBeDefined();
      expect(item?.kt).toBe('test');
      expect(item?.pk).toBe('test-456');
      expect(item?.name).toBe('From Buffer');
    });

    it('should return null for invalid buffer', () => {
      const buffer = Buffer.from('invalid json', 'utf-8');
      const item = processor.deserializeFromBuffer<TestItem>(buffer, coordinate);
      expect(item).toBeNull();
    });
  });

  describe('isValidJson', () => {
    it('should return true for valid JSON', () => {
      const json = '{"key": "value"}';
      expect(processor.isValidJson(json)).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(processor.isValidJson('{}')).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(processor.isValidJson('[]')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(processor.isValidJson('{ invalid }')).toBe(false);
    });

    it('should return false for non-JSON strings', () => {
      expect(processor.isValidJson('just text')).toBe(false);
    });
  });

  describe('prettyPrint', () => {
    it('should pretty print an object', () => {
      const obj = { key: 'value', nested: { field: 123 } };
      const result = processor.prettyPrint(obj);
      
      expect(result).toContain('\n');
      expect(result).toContain('  ');
      expect(result).toContain('key');
      expect(result).toContain('value');
    });

    it('should handle non-objects', () => {
      expect(processor.prettyPrint('string')).toBe('"string"');
      expect(processor.prettyPrint(123)).toBe('123');
      expect(processor.prettyPrint(true)).toBe('true');
    });
  });

  describe('singleton instance', () => {
    it('should export singleton instance', () => {
      expect(fileProcessor).toBeInstanceOf(FileProcessor);
    });

    it('should be usable', () => {
      const item: TestItem = {
        kt: 'test',
        pk: 'singleton-test',
        name: 'Singleton',
        value: 1,
      };

      const json = fileProcessor.serialize(item);
      expect(json).toBeDefined();
      
      const deserialized = fileProcessor.deserialize<TestItem>(json, coordinate);
      expect(deserialized?.pk).toBe('singleton-test');
    });
  });
});

