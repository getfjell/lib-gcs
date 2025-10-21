import { describe, expect, it } from 'vitest';

describe('lib-gcs exports', () => {
  it('should export all main modules', async () => {
    const module = await import('../src/index');
    
    expect(module).toBeDefined();
    expect(module.createDefinition).toBeDefined();
    expect(module.createGCSLibraryFromComponents).toBeDefined();
    expect(module.createGCSLibraryFactory).toBeDefined();
    expect(module.createOptions).toBeDefined();
    expect(module.createOperations).toBeDefined();
  });

  it('should export Primary namespace', async () => {
    const module = await import('../src/index');
    expect(module.Primary).toBeDefined();
  });

  it('should export Contained namespace', async () => {
    const module = await import('../src/index');
    expect(module.Contained).toBeDefined();
  });
});

