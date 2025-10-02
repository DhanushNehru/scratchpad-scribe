# CI Pipeline Documentation

## Overview
This repository includes a GitHub Actions CI pipeline that automatically validates code quality, type safety, and builds on every push and pull request to the `main` branch.

## Workflow Details

### Triggers
- **Push events** to the `main` branch
- **Pull requests** targeting the `main` branch

### Pipeline Steps
1. **Code Checkout** - Retrieves the latest code from the repository
2. **Node.js Setup** - Configures Node.js (18.x, 20.x, 22.x) with npm dependency caching
3. **Dependencies Installation** - Installs project dependencies using `npm ci`
4. **Linting** - Runs ESLint to check code quality and style consistency
5. **Type Checking** - Validates TypeScript types using `tsc --noEmit`
6. **Build** - Compiles the project to ensure it builds successfully
7. **Artifact Upload** - Saves build output for download and inspection

### Available Scripts
The following npm scripts are configured for the CI pipeline:

```json
{
  "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
  "type-check": "tsc --noEmit",
  "build": "vite build"
}
```

### Artifacts
- **Build files**: The compiled application is uploaded as an artifact named `build-files-{commit-sha}`
- **Retention**: Artifacts are kept for 7 days
- **Contents**: Optimized production build located in the `dist/` directory

## Configuration Files

### Workflow File
Located at `.github/workflows/ci.yml`

### Key Features
- **Multi-Node Support**: Tests across Node.js LTS versions (18.x, 20.x, 22.x)
- **Enhanced Caching**: Caches both npm and package-lock.json for optimal performance
- **Dependency Caching**: Speeds up subsequent runs with intelligent cache strategies
- **Parallel Jobs**: Runs tests across multiple Node.js versions simultaneously
- **Artifact Management**: Automatic upload of build results

## Future Enhancements

### Testing Framework
When a testing framework is added to the project, uncomment the following step in the workflow:

```yaml
- name: Run tests
  run: npm test
```

### Code Coverage
Integration with code coverage tools can be added:

```yaml
- name: Generate coverage report
  run: npm run coverage
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
```

### Performance Monitoring
Add build performance tracking:

```yaml
- name: Bundle Analysis
  run: npm run analyze
- name: Performance Budget Check
  run: npm run perf-budget
```

## Pipeline Optimizations

### Performance Enhancements
- **Enhanced Caching**: Uses `cache-dependency-path: package-lock.json` for more precise cache invalidation
- **Fast Installation**: `npm ci` ensures reproducible builds and faster installs than `npm install`
- **Parallel Execution**: Multiple Node.js versions tested simultaneously for faster feedback

### Reliability Improvements
- **Multi-Node Compatibility**: Tests across Node.js 18.x, 20.x, and 22.x to ensure broad compatibility
- **Deterministic Builds**: Uses exact dependency versions from package-lock.json
- **Build Artifacts**: Preserves build output with commit SHA for debugging and deployment

### Quality Assurance
- **Code Quality**: ESLint ensures consistent code style and catches potential issues
- **Type Safety**: TypeScript compilation validates type correctness
- **Build Verification**: Ensures the application builds successfully before deployment

## Troubleshooting

### Common Issues
1. **Lint failures**: Fix ESLint errors before pushing
2. **Type errors**: Resolve TypeScript compilation issues
3. **Build failures**: Ensure all dependencies are properly installed

### Local Testing
Before pushing, run the same checks locally:

```bash
npm run lint
npm run type-check
npm run build
```

## Maintenance
- **Dependencies**: Keep GitHub Actions up to date
- **Node.js Version**: Update when new LTS versions are released
- **Scripts**: Ensure npm scripts remain functional as the project evolves