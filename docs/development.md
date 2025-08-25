# Development Guide

This guide covers setting up the development environment, building, testing, and releasing the action.

## Setup

```bash
# Install dependencies
bun install

# Build the action
bun run build

# Package for distribution
bun run package
```

## Testing

```bash
# Run tests
bun run test

# Lint code
bun run lint

# Format code
bun run format
```

## Release Process

This project follows semantic versioning and uses automated release workflows.

### Making a Release

1. **Using the release script** (recommended):

   ```bash
   ./scripts/release.sh v1.2.0
   ```

2. **Manual process**:

   ```bash
   # Ensure you're on main branch with latest changes
   git checkout main
   git pull origin main

   # Run tests and build
   bun run test
   bun run prepare-release

   # Update version and create tag (use the release script instead)
   ./scripts/release.sh v1.2.0
   ```

### Release Workflow

The automated release process:

1. **CI/CD Pipeline**: All PRs are automatically tested with Bun
2. **Release Trigger**: Push a version tag (e.g., `v1.2.0`) to trigger the release
3. **Automated Tasks**:
   - Runs full test suite
   - Builds and packages the action
   - Updates major version tag (e.g., `v1` for `v1.2.0`)
   - Updates `release` branch to point to latest stable version
   - Creates GitHub release with auto-generated notes

### Version Referencing

Users can reference your action using:

- `@v1` - Latest v1.x.x release (recommended for most users)
- `@v1.2.0` - Specific version (for strict version control)
- `@release` - Always points to the latest stable release

### Dependency Management

- Dependabot automatically creates PRs for dependency updates
- Patch and minor updates are auto-merged after CI passes
- Major updates require manual review

## Contributing

We welcome contributions to improve the action! Please follow these guidelines:

1. **Fork and Clone**: Fork the repository and clone your fork locally
2. **Branch**: Create a feature branch from `main`
3. **Develop**: Make your changes following the existing code style
4. **Test**: Ensure all tests pass and add new tests for new features
5. **Document**: Update documentation as needed
6. **Pull Request**: Submit a PR with a clear description of your changes

### Code Style

- Use TypeScript for all new code
- Follow the existing formatting conventions
- Run `bun run lint` and `bun run format` before committing
- Write tests for new functionality
- Update documentation for user-facing changes

### Testing Strategy

- Unit tests for individual functions and classes
- Integration tests for end-to-end workflows
- Mock external dependencies (GitHub API, Telegraph API)
- Test both success and error scenarios
