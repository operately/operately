# CI Cache Management System

The CI cache management system provides efficient caching capabilities for CI/CD pipelines through SCP operations. It supports caching files, directories, and Docker images to speed up build times and reduce resource usage.

## Usage in CI Pipeline

Our CI pipeline utilizes caching for several key components:

### Elixir Dependencies

- `app/deps` - Compiled Elixir dependencies
- `app/_build` - Elixir build artifacts

### Frontend Dependencies

- `app/assets/node_modules` - Node.js modules for the frontend

### Docker Images

- Docker images are cached using `docker save` and compressed with gzip
- Cached at `docker/operately-app.tar.gz`

## Cache Operations

The cache system supports the following operations:

### Loading Cache

```bash
# Load Docker image cache
./scripts/ci-cache.sh load-docker-image docker/operately-app.tar.gz

# Load directory caches
./scripts/ci-cache.sh pull app/deps deps
./scripts/ci-cache.sh pull app/_build build
./scripts/ci-cache.sh pull app/assets/node_modules app/assets/node_modules
```

### Saving to Cache

```bash
# Save Docker image
./scripts/ci-cache.sh save-docker-image operately/operately:latest docker/operately-app.tar.gz

# Save directories
./scripts/ci-cache.sh push app/deps deps
./scripts/ci-cache.sh push app/_build build
./scripts/ci-cache.sh push app/assets/node_modules app/assets/node_modules
```

## Cache Invalidation

The cache is automatically invalidated when:

- Dependencies are updated (package.json, mix.exs changes)
- Build configuration changes
- New Docker base images are used

## Implementation Details

- Files and directories are transferred using SCP
- Directories are automatically tar-gzipped during transfer
- Docker images are saved and compressed using `docker save | gzip`
- All operations are atomic to prevent partial cache updates

## Environment Setup

The cache system requires the following environment variables:

- `CI_CACHE_SERVER_IP` - IP address of the cache server
- `CI_CACHE_SERVER_PORT` - SSH port of the cache server
- `CI_CACHE_SSH_KEY_PATH` - Path to the SSH private key file for authentication
- `CI_CACHE_USER` - Username for SSH connection

Note: Igor maintains the SSH keys on Semaphore. Contact him for any key-related issues or access requests.

## Best Practices

1. Always use relative paths when specifying cache locations
2. Verify cache hits/misses in CI logs
3. Keep cache sizes manageable by only caching necessary files
4. Use appropriate cache keys for different branches/environments
