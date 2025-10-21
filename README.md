# @fjell/lib-gcs

Google Cloud Storage Library for Fjell - Store Items as JSON files in GCS buckets with support for file attachments.

## Status

🚧 **Development / Alpha** - This library is under active development and not yet ready for production use.

## Overview

`@fjell/lib-gcs` is a Fjell persistence library that stores Items as JSON files in Google Cloud Storage buckets. It implements the standard Fjell Operations interface, similar to `@fjell/lib-firestore` and `@fjell/lib-sequelize`.

### Core Concept

- **Storage Model**: Items are stored as JSON files in GCS buckets
- **Key Mapping**: Key types (kt) map to directory paths within the bucket
- **File Naming**: Primary keys (pk) become file names
- **Content**: Item data is serialized as JSON and stored in the file
- **File Attachments** 🆕: Items can have associated binary files (audio, video, images, documents) stored alongside the JSON

## Features

✅ **Standard Fjell Operations Interface**
- Full support for CRUD operations
- Primary and Contained items
- Finders, actions, and facets

✅ **File Attachments** (Unique to lib-gcs)
- Store large binary files alongside item metadata
- Organized in labeled subdirectories
- Perfect for audio, video, images, and documents

✅ **Hybrid Library Mode**
- Use with lib-firestore for metadata queries
- Store large files in GCS only (files-only mode)

## Installation

```bash
npm install @fjell/lib-gcs @google-cloud/storage
```

## Basic Usage

```typescript
import { createGCSLibrary } from '@fjell/lib-gcs';
import { Storage } from '@google-cloud/storage';

// Initialize GCS client
const storage = new Storage({
  projectId: 'my-project',
  keyFilename: '/path/to/credentials.json'
});

// Create a library for Users
const userLibrary = createGCSLibrary({
  kta: ['user'],
  storage,
  bucketName: 'my-app-bucket'
});

// Use standard Fjell operations
const user = await userLibrary.create({
  kt: 'user',
  pk: 'user-123',
  name: 'Alice'
});
```

## Important Limitations

**GCS is Object Storage, NOT a Database**
- No server-side querying, filtering, or indexing
- Query operations download and filter in-memory
- NOT suitable for large datasets or complex queries

**Best Use Cases:**
- ✅ Small to medium datasets (<1000 items per type)
- ✅ File storage with key-based retrieval
- ✅ Items with large file attachments
- ✅ Prototyping and development
- ✅ Hybrid architectures (Firestore metadata + GCS files)

**For Large Datasets:**
- Use `@fjell/lib-firestore` for native query support
- Consider hybrid architecture (GCS storage + Firestore indexing)

## File Attachments Example

```typescript
const recordingLibrary = createGCSLibrary({
  kta: ['recording', 'user'],
  storage,
  bucketName: 'my-recordings'
});

// Create recording with file metadata
const recording = await recordingLibrary.create({
  kt: 'recording',
  pk: 'rec-123',
  loc: [{ kt: 'user', lk: 'user-456' }],
  title: 'My Recording',
  files: {
    master: [{ name: '0.wav', size: 31457280 }]
  }
});

// Upload audio file
await recordingLibrary.files.uploadFile(
  { kt: 'recording', pk: 'rec-123', loc: [...] },
  'master',
  '0.wav',
  audioBuffer
);
```

## Documentation

Full documentation coming soon.

## License

Apache-2.0

## Contributing

This is part of the Fjell project. See the main repository for contribution guidelines.

