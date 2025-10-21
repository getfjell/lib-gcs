# Changelog

All notable changes to @fjell/lib-gcs will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.4.0] - 2025-10-21

### Added

#### Core Features
- **Initial release** of @fjell/lib-gcs - Google Cloud Storage persistence library
- Full implementation of Fjell Operations interface
- Support for Primary Items (PriKey) with all CRUD operations
- Support for Contained Items (ComKey) with 1-5 level nesting
- Path-based storage using GCS object prefixes as directories

#### Operations
- `get(key)` - Retrieve items by exact key
- `create(item, options)` - Create new items with UUID generation
- `update(key, item, options)` - Update with merge strategies (deep/shallow/replace)
- `upsert(key, item, locations, options)` - Update or create
- `remove(key)` - Delete items
- `all(query, locations)` - List and filter items (with query safety limits)
- `one(query, locations)` - Get first matching item
- `find(finder, params, locations)` - Custom finder operations
- `findOne(finder, params, locations)` - Custom finder (single result)
- `action(key, action, params)` - Custom actions with affected keys
- `allAction(action, params, locations)` - Batch actions
- `facet(key, facet, params)` - Read-only computed views
- `allFacet(facet, params, locations)` - Aggregated facets

#### File Attachments (Unique to lib-gcs)
- Store binary files alongside item JSON
- Multiple labeled file collections per item (e.g., "master", "final", "thumbnail")
- `uploadFile()` - Upload files with size/type validation and checksums
- `downloadFile()` - Download file content
- `listFiles()` - List files by label
- `deleteFile()` - Delete files with metadata cleanup
- `getSignedUrl()` - Generate signed URLs for direct browser access
- File metadata stored in item JSON or managed externally

#### Advanced Features
- **Key Sharding** - Support for massive datasets (billions of objects)
- **Query Safety** - Configurable limits to prevent expensive operations
- **Hybrid Mode** - Files-only mode for use with lib-firestore metadata
- **Merge Strategies** - Deep, shallow, and replace merge for updates
- **Custom Business Logic** - Finders, actions, and facets
- **Registry Integration** - Full integration with @fjell/registry
- **Event System** - Automatic event emission for all operations
- **Hooks & Validation** - Pre/post hooks and validators
- **Error Handling** - Comprehensive GCS error mapping to Fjell error types

#### Developer Experience
- TypeScript support with full type inference
- Comprehensive test suite (316 tests, 95.88% coverage)
- MockStorage utility for fast unit tests
- Complete documentation and examples
- E2E test scenarios
- Validation at multiple levels

### Architecture

#### Core Components
- `PathBuilder` - Key-to-path conversion with sharding support
- `FileProcessor` - JSON serialization/deserialization
- `FileOperations` - File attachment operations
- `Operations` - Main CRUD and query operations
- `GCSLibrary` - Main library interface
- `GCSLibraryFactory` - Helper factory functions

#### Validation
- `itemValidator` - Item structure validation
- `configValidator` - Configuration and bucket validation
- `gcsErrorHandler` - GCS error mapping to Fjell errors

#### Testing Infrastructure
- MockStorage for unit tests
- Test fixtures (users, posts, comments)
- E2E blog scenario
- Edge case tests
- Performance tests

### Documentation
- Comprehensive README with quick start
- Getting Started guide
- Storage Structure explanation
- API reference
- Working examples (5 examples)
- Test coverage reports

### Performance
- Direct key access: O(1)
- Query operations: O(n) with configurable safety limits
- Default limits: 1000 max files, 100 warn threshold, 10 concurrent downloads
- Key sharding for massive scale

### Known Limitations
- GCS is object storage, not a database
- No server-side querying or filtering
- Query operations download and filter in-memory
- Not suitable for complex queries on large datasets
- Recommended for <1000 items per type without sharding

### Dependencies
- `@fjell/core`: ^4.4.51
- `@fjell/lib`: ^4.4.59
- `@fjell/logging`: ^4.4.50
- `@fjell/registry`: ^4.4.53
- `deepmerge`: ^4.3.1
- `uuid`: (for key generation)

### Peer Dependencies
- `@google-cloud/storage`: ^7.x

## [Unreleased]

### Planned
- Resumable uploads for large files
- Streaming support for massive result sets
- Batch operation optimizations
- Additional CLI tools
- Migration utilities

