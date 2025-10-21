# Storage Structure in GCS

Understanding how @fjell/lib-gcs organizes data in Google Cloud Storage.

## Overview

Items are stored as JSON files with paths determined by their keys. The directory structure mirrors the hierarchical relationships between items.

## Primary Items

**Format:** `{basePath}/{directory}/{pk}.json`

**Example:**
```typescript
Item: { kt: 'user', pk: 'alice-123', name: 'Alice' }
Path: gs://my-bucket/users/alice-123.json
```

**With Base Path:**
```typescript
basePath: 'production'
Path: gs://my-bucket/production/users/alice-123.json
```

## Contained Items (1 Level)

**Format:** `{basePath}/{parentDir}/{parentKey}/{childDir}/{childKey}.json`

**Example:**
```typescript
Item: { 
  kt: 'comment', 
  pk: 'comment-456',
  loc: [{ kt: 'post', lk: 'post-123' }],
  text: 'Great post!'
}

Path: gs://my-bucket/post/post-123/comment/comment-456.json
```

## Contained Items (2 Levels)

**Format:** `{basePath}/{L2Dir}/{L2Key}/{L1Dir}/{L1Key}/{childDir}/{childKey}.json`

**Example:**
```typescript
Item: {
  kt: 'reply',
  pk: 'reply-789',
  loc: [
    { kt: 'comment', lk: 'comment-456' },
    { kt: 'post', lk: 'post-123' }
  ],
  text: 'Thanks!'
}

Path: gs://my-bucket/comment/comment-456/post/post-123/reply/reply-789.json
```

**Note:** Location keys are ordered from innermost to outermost (reverse of how they appear in the path).

## File Attachments

**Format:** `{itemPath}/_files/{label}/{filename}`

**Example:**
```typescript
Item: { 
  kt: 'recording', 
  pk: 'rec-123',
  files: {
    master: [{ name: '0.wav', size: 31457280, ... }],
    final: [{ name: 'output.mp3', size: 15728640, ... }]
  }
}

Paths:
- Item JSON:  gs://my-bucket/recording/rec-123.json
- Master:     gs://my-bucket/recording/rec-123/_files/master/0.wav
- Final:      gs://my-bucket/recording/rec-123/_files/final/output.mp3
```

## Key Sharding (Massive Datasets)

**Format (with sharding):** `{dir}/{shard1}/{shard2}/{pk}.json`

**Example:**
```typescript
Config: { keySharding: { enabled: true, levels: 2, charsPerLevel: 1 } }

Item: { kt: 'user', pk: 'abc123', name: 'Test' }
Path: gs://my-bucket/user/a/ab/abc123.json

Item: { kt: 'user', pk: '550e8400-...', name: 'Test' }
Path: gs://my-bucket/user/5/55/550e8400-e29b-41d4-a716-446655440000.json
```

**Benefits:**
- Distributes billions of objects across 676 prefixes (2 levels, 1 char each, alphabetic)
- Reduces GCS hotspots
- Improves listing performance
- Each shard has ~3M objects instead of 2B

**Trade-offs:**
- Makes `all()` operations much slower (must list all shards)
- Only enable if NOT using query operations

## File Format

Items are stored as pretty-printed JSON:

```json
{
  "kt": "user",
  "pk": "alice-123",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "status": "active",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

## Directory Listing

GCS uses prefixes to simulate directories:

```
Listing prefix: "post/post-123/comment/"
Results:
- post/post-123/comment/comment-1.json
- post/post-123/comment/comment-2.json
- post/post-123/comment/comment-3.json
```

## Best Practices

### 1. Use Meaningful Directory Names
```typescript
✅ Good: ['users', 'posts', 'comments']
❌ Bad:  ['u', 'p', 'c']
```

### 2. Use UUIDs for Primary Keys
```typescript
✅ Good: pk: '550e8400-e29b-41d4-a716-446655440000'
❌ Bad:  pk: '1', '2', '3' (sequential creates hotspots)
```

### 3. Organize by Environment
```typescript
Development: { basePath: 'dev' }
Staging:     { basePath: 'staging' }
Production:  { basePath: 'prod' }
```

### 4. Use Descriptive File Labels
```typescript
✅ Good: { master: [...], final: [...], thumbnail: [...] }
❌ Bad:  { f1: [...], f2: [...] }
```

### 5. Enable Sharding for Large Datasets
```typescript
// Only if you have millions+ of objects
{
  keySharding: { enabled: true, levels: 2, charsPerLevel: 1 }
}
```

## Performance Considerations

**Fast Operations (O(1)):**
- `get(key)` - Direct key access
- `create(item)` - Single file write
- `update(key, item)` - Single file read + write
- `remove(key)` - Single file delete

**Slow Operations (O(n)):**
- `all()` - Lists and downloads all files
- `one()` - Lists files until first match
- `find()` - Lists and filters all files

**Recommendation:**
- For <1000 items: All operations work fine
- For 1000-100K items: Use `get()`/`create()`/`update()` only
- For 100K+ items: Enable sharding, disable queries, consider hybrid mode

