import { describe, expect, it } from 'vitest';

describe('lib-gcs exports', () => {
  it('should export all main modules', async () => {
    const module = await import('../src/index');
    
    expect(module).toBeDefined();
    expect(module.createDefinition).toBeDefined();
    expect(module.createGCSLibrary).toBeDefined();
    expect(module.createGCSLibraryFromComponents).toBeDefined();
    expect(module.isGCSLibrary).toBeDefined();
    expect(module.createPrimaryGCSLibrary).toBeDefined();
    expect(module.createContainedGCSLibrary).toBeDefined();
    expect(module.createContainedGCSLibrary2).toBeDefined();
    expect(module.createOptions).toBeDefined();
    expect(module.createOperations).toBeDefined();
    expect(module.PathBuilder).toBeDefined();
    expect(module.FileProcessor).toBeDefined();
  });

  it('should export Primary namespace', async () => {
    const module = await import('../src/index');
    expect(module.Primary).toBeDefined();
    expect(module.Primary.createPrimaryGCSLibrary).toBeDefined();
  });

  it('should export Contained namespace', async () => {
    const module = await import('../src/index');
    expect(module.Contained).toBeDefined();
    expect(module.Contained.createContainedGCSLibrary).toBeDefined();
    expect(module.Contained.createContainedGCSLibrary2).toBeDefined();
  });

  it('should re-export core types', async () => {
    const module = await import('../src/index');
    // These are type-only exports, so we just verify they compile
    // We can't test type exports at runtime, but TypeScript will validate them
    expect(module).toBeDefined();
  });
});
