# @fjell/lib-gcs

Google Cloud Storage persistence library for the Fjell framework.

## Overview

`@fjell/lib-gcs` is a Fjell persistence library that stores Items as JSON files in Google Cloud Storage buckets. It implements the full Fjell Operations interface with support for primary items, contained items, custom finders, actions, facets, and file attachments.

## ✨ Features

- ✅ **Full Operations Interface** - All CRUD operations, queries, finders, actions, and facets
- ✅ **Primary & Contained Items** - Support for hierarchical data structures (1-5 levels deep)
- ✅ **File Attachments** 🆕 - Store binary files (audio, video, images) alongside item metadata
- ✅ **Type-Safe** - Full TypeScript support with comprehensive type inference
- ✅ **Custom Business Logic** - Define finders, actions, and facets for domain-specific operations
- ✅ **Hybrid Mode** - Use with lib-firestore for metadata + GCS for files
- ✅ **Query Safety** - Built-in limits to prevent expensive operations on large datasets
- ✅ **Key Sharding** - Support for massive datasets (billions of objects)
- ✅ **Integration Ready** - Works seamlessly with the Fjell ecosystem

## 📦 Installation

```bash
npm install @fjell/lib-gcs @google-cloud/storage
```

## 🚀 Quick Start

```typescript
import { createPrimaryGCSLibrary } from '@fjell/lib-gcs';
import { Storage } from '@google-cloud/storage';
import { Item } from '@fjell/core';

interface User extends Item<'user'> {
  name: string;
  email: string;
}

// Initialize GCS
const storage = new Storage({
  projectId: 'my-project',
  keyFilename: '/path/to/credentials.json'
});

// Create library
const userLib = createPrimaryGCSLibrary<User, 'user'>(
  'user',           // Key type
  'users',          // Directory name in bucket
  'my-app-bucket',  // Bucket name
  storage
);

// Create a user
const user = await userLib.operations.create({
  name: 'Alice',
  email: 'alice@example.com'
});

// Get user by key
const retrieved = await userLib.operations.get({
  kt: 'user',
  pk: user.pk
});

// Update user
const updated = await userLib.operations.update(
  { kt: 'user', pk: user.pk },
  { name: 'Alice Smith' }
);

// List all users
const allUsers = await userLib.operations.all();

// Remove user
await userLib.operations.remove({ kt: 'user', pk: user.pk });
```

## 📚 Documentation

- **[Getting Started Guide](./docs/GETTING_STARTED.md)** - Step-by-step tutorial
- **[API Reference](./docs/API.md)** - Complete API documentation
- **[Storage Structure](./docs/STORAGE_STRUCTURE.md)** - How data is organized in GCS
- **[Advanced Usage](./docs/ADVANCED.md)** - Finders, actions, facets, optimization

## 📖 Examples

See the [examples/](./examples/) directory for complete, runnable examples:

- **[01-basic-primary-items.ts](./examples/01-basic-primary-items.ts)** - Basic CRUD operations
- **[02-contained-items.ts](./examples/02-contained-items.ts)** - Hierarchical data structures
- **[03-finders-and-actions.ts](./examples/03-finders-and-actions.ts)** - Custom business logic
- **[04-nested-hierarchy.ts](./examples/04-nested-hierarchy.ts)** - Deep nesting (3+ levels)
- **[05-file-attachments.ts](./examples/05-file-attachments.ts)** - Working with binary files

## ⚠️ Important Limitations

**GCS is Object Storage, NOT a Database:**
- No server-side querying or filtering
- Query operations (`all()`, `one()`, finders) download and filter in-memory
- **NOT suitable for large datasets or complex queries**

**Best Use Cases:**
- ✅ Small to medium datasets (<1000 items per type)
- ✅ File storage with key-based retrieval
- ✅ Items with large file attachments (audio, video, documents)
- ✅ Prototyping and development
- ✅ Hybrid architectures (Firestore for metadata + GCS for files)

**For Large Datasets:**
- Use `@fjell/lib-firestore` for native query support
- Enable key sharding for better performance
- Disable query operations (`querySafety.disableQueryOperations = true`)
- Consider hybrid architecture with external indexing

## 🎯 Key Concepts

### Storage Structure

Items are stored as JSON files with paths based on their keys:

```
Primary Item:
  gs://my-bucket/user/alice-123.json

Contained Item (1 level):
  gs://my-bucket/post/post-456/comment/comment-789.json

Contained Item (2 levels):
  gs://my-bucket/user/u-1/post/p-1/comment/c-1/reply/r-1.json
```

### File Attachments

Items can have associated binary files:

```
Item JSON:
  gs://my-bucket/recording/rec-123.json

File Attachments:
  gs://my-bucket/recording/rec-123/_files/master/0.wav
  gs://my-bucket/recording/rec-123/_files/final/output.mp3
  gs://my-bucket/recording/rec-123/_files/thumbnail/cover.jpg
```

## 🔧 Configuration Options

```typescript
interface Options {
  bucketName: string;
  basePath?: string;                    // Optional prefix for all paths
  mode?: 'full' | 'files-only';        // Full storage or files-only hybrid
  useJsonExtension?: boolean;           // Add .json to files (default: true)
  
  keySharding?: {                       // For massive datasets
    enabled?: boolean;
    levels?: number;                    // Default: 2
    charsPerLevel?: number;             // Default: 1
  };
  
  querySafety?: {                       // Prevent expensive operations
    maxScanFiles?: number;              // Default: 1000
    warnThreshold?: number;             // Default: 100
    disableQueryOperations?: boolean;   // Default: false
    downloadConcurrency?: number;       // Default: 10
  };
  
  files?: {                             // File attachment config
    directory?: string;                 // Default: '_files'
    maxFileSize?: number;               // No limit by default
    allowedContentTypes?: string[];     // All allowed by default
    includeMetadataInItem?: boolean;    // Default: true
    computeChecksums?: boolean;         // Default: true
  };
}
```

## 🤝 Contributing

This library is part of the Fjell project. See the main repository for contribution guidelines.

## 📄 License

Apache-2.0

## 🔗 Related Libraries

- **[@fjell/core](https://github.com/getfjell/core)** - Core types and interfaces
- **[@fjell/lib](https://github.com/getfjell/lib)** - Base library functionality  
- **[@fjell/lib-firestore](https://github.com/getfjell/lib-firestore)** - Firestore persistence
- **[@fjell/lib-sequelize](https://github.com/getfjell/lib-sequelize)** - SQL persistence
- **[@fjell/providers](https://github.com/getfjell/providers)** - Data providers with caching
- **[@fjell/registry](https://github.com/getfjell/registry)** - Service registry

## 📊 Status

**Version:** 4.4.9-dev.0  
**Status:** Development/Alpha  
**Test Coverage:** 95.88%  
**Tests:** 301 passing
