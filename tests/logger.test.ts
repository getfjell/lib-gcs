import { describe, expect, it } from 'vitest';
import LibLogger from '../src/logger';

describe('LibLogger', () => {
  it('should create a logger instance', () => {
    expect(LibLogger).toBeDefined();
  });

  it('should have a get method', () => {
    expect(LibLogger.get).toBeDefined();
    expect(typeof LibLogger.get).toBe('function');
  });

  it('should create scoped logger instances', () => {
    const scopedLogger = LibLogger.get('test-scope');
    expect(scopedLogger).toBeDefined();
    expect(scopedLogger.default).toBeDefined();
    expect(scopedLogger.error).toBeDefined();
  });

  it('should create multi-level scoped logger', () => {
    const scopedLogger = LibLogger.get('scope1', 'scope2');
    expect(scopedLogger).toBeDefined();
  });
});

