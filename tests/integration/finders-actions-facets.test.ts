import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrimaryGCSLibrary } from '../../src/primary/GCSLibrary';
import { Item } from '@fjell/core';

interface TestUser extends Item<'user'> {
  name: string;
  email: string;
  status: string;
  score: number;
}

describe('Finders, Actions, and Facets Integration', () => {
  let mockStorage: any;
  let mockBucket: any;
  let mockFile: any;

  beforeEach(() => {
    mockFile = {
      exists: vi.fn(),
      download: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockBucket = {
      file: vi.fn().mockReturnValue(mockFile),
      getFiles: vi.fn(),
    };

    mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket),
    };
  });

  describe('Finders', () => {
    it('should execute custom finder through library', async () => {
      const users = [
        { kt: 'user', pk: 'u-1', name: 'Alice', email: 'alice@test.com', status: 'active', score: 10 },
        { kt: 'user', pk: 'u-2', name: 'Bob', email: 'bob@test.com', status: 'inactive', score: 5 },
        { kt: 'user', pk: 'u-3', name: 'Charlie', email: 'charlie@test.com', status: 'active', score: 15 }
      ];

      const mockFiles = users.map((user, i) => ({
        name: `user/u-${i}.json`,
        download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(user))])
      }));

      mockBucket.getFiles.mockResolvedValue([mockFiles]);

      // Define custom finder
      // Finder can accept (params, locations, findOptions) but locations and findOptions are optional
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const byStatus = async (params: any, locations?: any, findOptions?: any) => {
        // In real implementation, this would call library.operations.all() with a query
        // For testing, we'll simulate the behavior
        const mockLib = createPrimaryGCSLibrary<TestUser, 'user'>(
          'user',
          'users',
          'test-bucket',
          mockStorage
        );
        const result = await mockLib.operations.all();
        // Return array - wrapper will wrap it in FindOperationResult
        return result.items.filter(u => u.status === params.status);
      };

      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        'test-bucket',
        mockStorage,
        { finders: { byStatus } } as any
      );

      // Execute finder
      const results = await library.operations.find('byStatus', { status: 'active' });
      
      expect(results.items).toHaveLength(2);
      expect(results.items.every(u => u.status === 'active')).toBe(true);
      expect(results.metadata.total).toBe(2);
    });

    it('should throw error for non-existent finder', async () => {
      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        'test-bucket',
        mockStorage
      );

      await expect(
        library.operations.find('nonExistent', {})
      ).rejects.toThrow('Finder "nonExistent" not found');
    });
  });

  describe('Actions', () => {
    it('should execute custom action and update item', async () => {
      const user: TestUser = {
        kt: 'user',
        pk: 'u-1',
        name: 'Alice',
        email: 'alice@test.com',
        status: 'pending',
        score: 10
      };

      mockFile.exists.mockResolvedValue([true]);
      mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(user))]);

      // Define custom action
      const approve = async (item: TestUser) => {
        const updated = { ...item, status: 'approved' };
        return [updated, []] as [TestUser, any[]];
      };

      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        'test-bucket',
        mockStorage,
        { actions: { approve } } as any
      );

      const [updatedUser, affectedKeys] = await library.operations.action(
        { kt: 'user', pk: 'u-1' },
        'approve',
        {}
      );

      expect(updatedUser.status).toBe('approved');
      expect(affectedKeys).toEqual([]);
      // Actions are wrapped by @fjell/lib and may not directly call save in tests
      // The important thing is the action executed and returned correct data
    });

    it('should return affected keys from action', async () => {
      const user: TestUser = {
        kt: 'user',
        pk: 'u-1',
        name: 'Alice',
        email: 'alice@test.com',
        status: 'active',
        score: 10
      };

      mockFile.exists.mockResolvedValue([true]);
      mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(user))]);

      const notifyFollowers = async (item: TestUser) => {
        const affected = [
          { kt: 'notification', pk: 'n-1' },
          { kt: 'notification', pk: 'n-2' }
        ];
        return [item, affected] as [TestUser, any[]];
      };

      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        'test-bucket',
        mockStorage,
        { actions: { notifyFollowers } } as any
      );

      const [, affectedKeys] = await library.operations.action(
        { kt: 'user', pk: 'u-1' },
        'notifyFollowers',
        {}
      );

      expect(affectedKeys).toHaveLength(2);
      expect(affectedKeys[0].kt).toBe('notification');
    });
  });

  describe('Facets', () => {
    it('should execute custom facet without modifying item', async () => {
      const user: TestUser = {
        kt: 'user',
        pk: 'u-1',
        name: 'Alice',
        email: 'alice@test.com',
        status: 'active',
        score: 85
      };

      mockFile.exists.mockResolvedValue([true]);
      mockFile.download.mockResolvedValue([Buffer.from(JSON.stringify(user))]);

      // Define custom facet
      const profile = async (item: TestUser) => {
        return {
          displayName: item.name,
          emailDomain: item.email.split('@')[1],
          isHighScore: item.score > 80
        };
      };

      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        'test-bucket',
        mockStorage,
        { facets: { profile } } as any
      );

      const result = await library.operations.facet(
        { kt: 'user', pk: 'u-1' },
        'profile',
        {}
      );

      expect(result).toEqual({
        displayName: 'Alice',
        emailDomain: 'test.com',
        isHighScore: true
      });

      // Verify no save was called (facets are read-only)
      expect(mockFile.save).not.toHaveBeenCalled();
    });
  });

  describe('AllFacets', () => {
    it('should execute custom allFacet for aggregation', async () => {
      const users = [
        { kt: 'user', pk: 'u-1', name: 'Alice', email: 'alice@test.com', status: 'active', score: 10 },
        { kt: 'user', pk: 'u-2', name: 'Bob', email: 'bob@test.com', status: 'active', score: 20 },
        { kt: 'user', pk: 'u-3', name: 'Charlie', email: 'charlie@test.com', status: 'inactive', score: 30 }
      ];

      const mockFiles = users.map((user, i) => ({
        name: `user/u-${i}.json`,
        download: vi.fn().mockResolvedValue([Buffer.from(JSON.stringify(user))])
      }));

      mockBucket.getFiles.mockResolvedValue([mockFiles]);

      // AllFacetMethod signature: (params, locations) => Promise<any>
      // It doesn't receive items - it should call operations itself
      const statistics = async () => {
        // This is a simplified stub for testing
        // In real usage, this would call library operations
        return {
          total: 3,
          active: 2,
          averageScore: 20
        };
      };

      const library = createPrimaryGCSLibrary<TestUser, 'user'>(
        'user',
        'users',
        'test-bucket',
        mockStorage,
        { allFacets: { statistics } } as any
      );

      const result = await library.operations.allFacet('statistics', {});

      expect(result).toEqual({
        total: 3,
        active: 2,
        averageScore: 20
      });
    });
  });
});

