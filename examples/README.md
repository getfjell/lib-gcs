# Examples

Complete, runnable examples for @fjell/lib-gcs.

## Prerequisites

1. **Google Cloud Project** with billing enabled
2. **GCS Bucket** created
3. **Authentication** configured:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

## Running Examples

```bash
# Install dependencies
npm install

# Run an example
npx ts-node examples/01-basic-primary-items.ts
```

## Available Examples

### 01-basic-primary-items.ts
Basic CRUD operations with primary items (users).

**Demonstrates:**
- Creating a library
- Create, read, update, delete operations
- Listing all items

**Run:**
```bash
npx ts-node examples/01-basic-primary-items.ts
```

### 02-contained-items.ts
Working with hierarchical contained items (posts and comments).

**Demonstrates:**
- Creating contained libraries
- Location-based operations
- Listing items within specific locations

**Run:**
```bash
npx ts-node examples/02-contained-items.ts
```

### 03-finders-and-actions.ts
Custom business logic with finders and actions.

**Demonstrates:**
- Defining custom finders
- Defining custom actions
- Using facets for read-only operations

**Run:**
```bash
npx ts-node examples/03-finders-and-actions.ts
```

### 04-nested-hierarchy.ts
Deep nesting with 3-level hierarchy (posts → comments → replies).

**Demonstrates:**
- Multi-level contained items
- Navigation through hierarchies
- Complex queries

**Run:**
```bash
npx ts-node examples/04-nested-hierarchy.ts
```

### 05-file-attachments.ts
Storing and managing file attachments.

**Demonstrates:**
- Uploading files
- Downloading files
- Listing files by label
- Generating signed URLs
- File metadata management

**Run:**
```bash
npx ts-node examples/05-file-attachments.ts
```

## Configuration

All examples use the bucket: `fjell-lib-gcs-examples`

To use your own bucket, modify the bucket name in each example:

```typescript
const userLib = createPrimaryGCSLibrary<User, 'user'>(
  'user',
  'users',
  'YOUR-BUCKET-NAME',  // ← Change this
  storage
);
```

## Cleanup

After running examples, you may want to delete test data:

```bash
# Delete all files in the examples bucket
gsutil -m rm -r gs://fjell-lib-gcs-examples/**
```

## Troubleshooting

### "Bucket not found"
- Ensure the bucket exists: `gsutil ls`
- Create if needed: `gsutil mb gs://your-bucket-name`

### "Permission denied"
- Check service account has Storage Object Admin role
- Verify credentials file path is correct

### "Module not found"
- Run `npm install` in the lib-gcs directory
- Ensure all dependencies are installed

## Learn More

- [Getting Started Guide](../docs/GETTING_STARTED.md)
- [Storage Structure](../docs/STORAGE_STRUCTURE.md)
- [API Reference](../docs/API.md)
- [Advanced Usage](../docs/ADVANCED.md)

