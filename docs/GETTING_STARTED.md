# Getting Started with @fjell/lib-gcs

Complete guide to using the GCS persistence library with Fjell.

## Prerequisites

- Node.js 21 or later
- Google Cloud project with billing enabled
- GCS bucket created
- Service account with Storage permissions

## Step 1: Install Dependencies

```bash
npm install @fjell/lib-gcs @google-cloud/storage @fjell/core
```

## Step 2: Configure GCS Authentication

### Option A: Service Account Key File

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### Option B: Programmatic Configuration

```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: 'my-project-id',
  keyFilename: '/path/to/credentials.json'
});
```

### Option C: Default Credentials (Cloud Run, GCE, etc.)

```typescript
const storage = new Storage(); // Uses application default credentials
```

## Step 3: Create Your First Library

```typescript
import { createPrimaryGCSLibrary } from '@fjell/lib-gcs';
import { Storage } from '@google-cloud/storage';
import { Item } from '@fjell/core';

// Define your item type
interface User extends Item<'user'> {
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

// Initialize storage
const storage = new Storage({
  projectId: 'my-project'
});

// Create library
const userLib = createPrimaryGCSLibrary<User, 'user'>(
  'user',           // Key type
  'users',          // Directory in bucket
  'my-app-bucket',  // Bucket name
  storage           // Storage client
);
```

## Step 4: Perform CRUD Operations

### Create

```typescript
const user = await userLib.operations.create({
  name: 'Alice Johnson',
  email: 'alice@example.com',
  status: 'active'
});

console.log('Created user:', user.pk);
// Created user: <generated-uuid>
```

### Get

```typescript
const found = await userLib.operations.get({
  kt: 'user',
  pk: user.pk
});

console.log('Found:', found?.name);
// Found: Alice Johnson
```

### Update

```typescript
const updated = await userLib.operations.update(
  { kt: 'user', pk: user.pk },
  { status: 'inactive' }
);

console.log('Status:', updated.status);
// Status: inactive
```

### Upsert (Update or Create)

```typescript
const upserted = await userLib.operations.upsert(
  { kt: 'user', pk: 'user-123' },
  { name: 'Bob Smith', email: 'bob@example.com', status: 'active' }
);
```

### Remove

```typescript
const removed = await userLib.operations.remove({
  kt: 'user',
  pk: user.pk
});

console.log('Removed:', removed?.name);
// Removed: Alice Johnson
```

### List All

```typescript
const allUsers = await userLib.operations.all();
console.log(`Total users: ${allUsers.length}`);
```

### Query with Filters

```typescript
const activeUsers = await userLib.operations.all({
  filter: { status: 'active' },
  sort: [{ field: 'name', direction: 'asc' }],
  limit: 10,
  offset: 0
} as any);
```

## Step 5: Use Finders and Actions

### Define Custom Finders

```typescript
const userLib = createPrimaryGCSLibrary<User, 'user'>(
  'user',
  'users',
  'my-bucket',
  storage,
  {
    finders: {
      // Find users by email domain
      byDomain: async (params) => {
        const all = await userLib.operations.all();
        return all.filter(u => u.email.endsWith(`@${params.domain}`));
      },
      
      // Find active users
      active: async () => {
        const all = await userLib.operations.all();
        return all.filter(u => u.status === 'active');
      }
    }
  }
);

// Use finders
const gmailUsers = await userLib.operations.find('byDomain', { domain: 'gmail.com' });
const activeUsers = await userLib.operations.find('active', {});
```

### Define Custom Actions

```typescript
const userLib = createPrimaryGCSLibrary<User, 'user'>(
  'user',
  'users',
  'my-bucket',
  storage,
  {
    actions: {
      // Activate user
      activate: async (user) => {
        const updated = { ...user, status: 'active' as const };
        return [updated, []]; // [updated item, affected keys]
      },
      
      // Deactivate user
      deactivate: async (user) => {
        const updated = { ...user, status: 'inactive' as const };
        // Return affected keys for cache invalidation
        const affected = [{ kt: 'session', pk: user.pk }];
        return [updated, affected];
      }
    }
  }
);

// Use actions
const [activated, affectedKeys] = await userLib.operations.action(
  { kt: 'user', pk: 'user-123' },
  'activate',
  {}
);
```

### Define Custom Facets

```typescript
const userLib = createPrimaryGCSLibrary<User, 'user'>(
  'user',
  'users',
  'my-bucket',
  storage,
  {
    facets: {
      // Compute user statistics (read-only)
      stats: async (user) => {
        return {
          displayName: user.name,
          domain: user.email.split('@')[1],
          isActive: user.status === 'active'
        };
      }
    }
  }
);

// Use facets
const stats = await userLib.operations.facet(
  { kt: 'user', pk: 'user-123' },
  'stats',
  {}
);
```

## Step 6: Work with Contained Items

```typescript
import { createContainedGCSLibrary } from '@fjell/lib-gcs';

interface Comment extends Item<'comment', 'post'> {
  text: string;
  rating: number;
}

// Create contained library
const commentLib = createContainedGCSLibrary<Comment, 'comment', 'post'>(
  'comment',                    // Item key type
  'post',                       // Parent key type
  ['comments', 'posts'],        // Directory paths
  'my-app-bucket',
  storage
);

// Create comment in a specific post
const comment = await commentLib.operations.create(
  {
    text: 'Great post!',
    rating: 5
  },
  {
    locations: [{ kt: 'post', lk: 'post-123' }]
  }
);

// List all comments in a post
const postComments = await commentLib.operations.all(
  undefined,
  [{ kt: 'post', lk: 'post-123' }]
);

// Get specific comment
const retrieved = await commentLib.operations.get({
  kt: 'comment',
  pk: comment.pk,
  loc: [{ kt: 'post', lk: 'post-123' }]
});
```

## 🎯 Next Steps

- Read the [Storage Structure](./docs/STORAGE_STRUCTURE.md) to understand how data is organized
- Check [Advanced Usage](./docs/ADVANCED.md) for optimization tips
- Browse [Examples](./examples/) for complete code samples
- Review [API Reference](./docs/API.md) for all available methods

## 🆘 Getting Help

- Check the [examples/](./examples/) directory
- Review test files in [tests/](./tests/) for usage patterns
- See the main [Fjell documentation](https://github.com/getfjell)

## ⚡ Performance Tips

1. **Use exact keys when possible** - `get()` is O(1), `all()` is O(n)
2. **Enable query safety limits** - Prevent accidental expensive scans
3. **Consider key sharding** for massive datasets (billions of objects)
4. **Use hybrid mode** - Store queryable metadata in Firestore, files in GCS
5. **Disable query operations** if you only need key-based access

```typescript
const userLib = createPrimaryGCSLibrary<User, 'user'>(
  'user',
  'users',
  'my-bucket',
  storage,
  {
    querySafety: {
      maxScanFiles: 500,              // Lower limit
      disableQueryOperations: true     // Disable all()/one() entirely
    },
    keySharding: {
      enabled: true,                   // Enable sharding
      levels: 2,                       // user/a/ab/abc123.json
      charsPerLevel: 1
    }
  }
);
```

