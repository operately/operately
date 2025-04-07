# CI Cache Management System

The CI cache management system provides efficient caching capabilities for CI/CD pipelines through SCP operations. It supports caching files, directories, and Docker images to speed up build times and reduce resource usage.

## Setup Requirements

The system requires the following environment variables to be set:

- `CI_CACHE_SERVER_IP`: IP address of the cache server
- `CI_CACHE_SERVER_PORT`: SSH port of the cache server
- `CI_CACHE_SSH_KEY`: Path to the SSH private key for authentication
- `CI_CACHE_USER`: Username for SSH connection

## Basic Usage

### Caching Files and Directories

```bash
# Push local content to cache
./scripts/ci-cache.sh push <source_path> <cache_path>

# Pull content from cache
./scripts/ci-cache.sh pull <cache_path> <destination_path>
```

### Common Use Cases

#### Caching Node Modules

```bash
# Cache node_modules directory
./scripts/ci-cache.sh push ./node_modules node_modules
./scripts/ci-cache.sh pull node_modules ./node_modules

# Cache multiple project dependencies
./scripts/ci-cache.sh push ./app/node_modules app/node_modules
./scripts/ci-cache.sh push ./design/node_modules design/node_modules
```

### Docker Image Caching

```bash
# Save Docker image to cache
./scripts/ci-cache.sh save-docker-image postgres:15.3 /cache/postgres.tar.gz
./scripts/ci-cache.sh save-docker-image node:18 /cache/node.tar.gz

# Load Docker image from cache
./scripts/ci-cache.sh load-docker-image /cache/postgres.tar.gz
./scripts/ci-cache.sh load-docker-image /cache/node.tar.gz
```

## Best Practices

1. **Cache Key Strategy**

   - Use consistent and meaningful cache paths
   - Include version information in cache paths when relevant
   - Consider including hash of lock files for dependency caching

2. **Cache Invalidation**

   - Cache paths are overwritten when pushing new content
   - Consider using different cache paths when dependencies change significantly

3. **Large Files**
   - Docker images are automatically compressed when cached
   - For large directories, consider splitting into smaller, logical units

## Troubleshooting

1. **Cache Miss**

   - Verify cache path exists on the server
   - Check environment variables are correctly set
   - Ensure SSH key has proper permissions

2. **Permission Issues**

   - Verify SSH key permissions (should be 600)
   - Check user permissions on cache server
   - Ensure cache directory exists and is writable

3. **Network Issues**
   - Verify connectivity to cache server
   - Check if SSH port is accessible
   - Ensure firewall rules allow SSH connections

## Implementation Details

- Files and directories are transferred using SCP
- Directories are automatically tar-gzipped during transfer
- Docker images are saved and compressed using `docker save | gzip`
- All operations are atomic to prevent partial cache updates
