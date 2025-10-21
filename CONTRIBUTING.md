# Contributing to @fjell/lib-gcs

Thank you for your interest in contributing to @fjell/lib-gcs!

## Development Setup

### Prerequisites
- Node.js 21 or later
- npm or yarn
- Git
- Google Cloud SDK (optional, for integration tests)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/getfjell/lib-gcs.git
cd lib-gcs
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Development Workflow

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes in the `src/` directory

3. Add tests in the `tests/` directory

4. Run linter:
```bash
npm run lint
```

5. Run tests:
```bash
npm test
```

6. Build to verify TypeScript compilation:
```bash
npm run build
```

## Running Tests

### Unit Tests (Fast)
```bash
npm test
```

### With Coverage
```bash
npm run coverage
```

### Watch Mode
```bash
npm run dev
```

### Specific Test File
```bash
npx vitest run tests/operations/get.test.ts
```

## Code Style

- Follow existing code patterns
- Use TypeScript strict mode
- Add JSDoc comments for public APIs
- Keep functions focused and testable
- Use descriptive variable names

### Linting
The project uses ESLint with the Fjell configuration:

```bash
npm run lint        # Check for issues
npm run lint --fix  # Auto-fix issues
```

### TypeScript
- All code must compile without errors
- Use proper types (avoid `any` except where necessary)
- Export types for public APIs

## Testing Guidelines

### Test Coverage
- Maintain >90% code coverage
- Write unit tests for all new functions
- Add integration tests for complex features
- Include edge case tests

### Test Structure
```typescript
import { describe, expect, it, beforeEach } from 'vitest';

describe('YourComponent', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Mocking
Use the MockStorage utility for fast unit tests:

```typescript
import { createMockStorage } from '../tests/mocks/storageMock';

const mockStorage = createMockStorage();
```

## Pull Request Process

1. **Update Tests** - All new code must have tests
2. **Update Documentation** - Document any new features
3. **Run Quality Checks** - Ensure lint, build, and test all pass
4. **Write Clear Commit Messages** - Describe what and why
5. **Submit PR** - Provide context and link related issues
6. **Code Review** - Address feedback promptly
7. **Squash Commits** - Clean up commit history before merge

### PR Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Linter passes
- [ ] Build succeeds
- [ ] All tests pass
- [ ] Coverage maintained >90%
- [ ] CHANGELOG updated (if applicable)

## Commit Message Format

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(operations): add streaming support for large datasets

fix(validation): handle edge case with empty pk

docs(readme): add hybrid mode usage example

test(files): add uploadFile edge cases
```

## Project Structure

```
lib-gcs/
├── src/              # Source code
│   ├── ops/          # Operations (get, create, update, etc.)
│   ├── ops/files/    # File operations
│   ├── errors/       # Error handling
│   ├── validation/   # Validators
│   ├── types/        # Type definitions
│   ├── primary/      # Primary item helpers
│   ├── contained/    # Contained item helpers
│   └── *.ts          # Core modules
├── tests/            # Test files
│   ├── operations/   # Operation tests
│   ├── files/        # File operation tests
│   ├── integration/  # Integration tests
│   ├── e2e/          # End-to-end tests
│   ├── registry/     # Registry tests
│   ├── validation/   # Validation tests
│   ├── fixtures/     # Test data
│   └── mocks/        # Mock utilities
├── docs/             # Documentation
├── examples/         # Code examples
└── dist/             # Build output (generated)
```

## Release Process

Releases are handled by maintainers:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Build distribution
5. Publish to npm

## Questions?

- Open an issue for bugs
- Start a discussion for feature ideas
- Join the Fjell community

## Code of Conduct

Be respectful, inclusive, and constructive.

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.

