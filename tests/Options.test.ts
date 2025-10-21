import { Item } from '@fjell/core';
import * as Library from '@fjell/lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Define a generic item type for testing purposes
interface MockItem extends Item<string, 'l1', 'l2', 'l3', 'l4', 'l5'> {
  id: string;
  name: string;
}

// Mock the @fjell/lib module
const mockLibCreateOptions = vi.fn();
vi.mock('@fjell/lib', () => ({
  createOptions: mockLibCreateOptions,
}));

describe('createOptions', () => {
  beforeEach(() => {
    // Clear mock history before each test
    mockLibCreateOptions.mockClear();
  });

  it('should call Library.createOptions with provided options and return its result', async () => {
    const { createOptions } = await import('../src/Options');
    const libOptions: Partial<MockItem> = {
      id: '123',
      name: 'Test Item'
    };
    const expectedOptionsOutput = { ...libOptions, someOtherProp: 'test' };
    mockLibCreateOptions.mockReturnValue(expectedOptionsOutput);

    const result: any = createOptions(libOptions as Library.Options<MockItem, string, 'l1', 'l2', 'l3', 'l4', 'l5'>);

    expect(mockLibCreateOptions).toHaveBeenCalledTimes(1);
    expect(mockLibCreateOptions).toHaveBeenCalledWith(libOptions);
    expect(result).toEqual(expectedOptionsOutput);
  });

  it('should call Library.createOptions with empty object if no options are provided', async () => {
    const { createOptions } = await import('../src/Options');
    const expectedOptionsOutput = { someOtherProp: 'defaultTest' };
    mockLibCreateOptions.mockReturnValue(expectedOptionsOutput);

    const result: any = createOptions();

    expect(mockLibCreateOptions).toHaveBeenCalledTimes(1);
    expect(mockLibCreateOptions).toHaveBeenCalledWith({});
    expect(result).toEqual(expectedOptionsOutput);
  });

  it('should preserve GCS-specific options', async () => {
    const { createOptions } = await import('../src/Options');
    const mockOutput: any = {
      bucketName: 'test-bucket',
      mode: 'full',
    };
    mockLibCreateOptions.mockReturnValue(mockOutput);

    const customOptions: any = {
      bucketName: 'test-bucket',
      mode: 'full',
    };
    const result: any = createOptions(customOptions);

    expect(result).toEqual(mockOutput);
  });
});

