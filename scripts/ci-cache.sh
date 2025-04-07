#!/bin/bash

# Script for managing CI cache through SCP operations
# Required environment variables:
# - CI_CACHE_SERVER_IP: IP address of the cache server
# - CI_CACHE_SERVER_PORT: SSH port of the cache server
# - CI_CACHE_SSH_KEY_PATH: Path to the SSH private key file for authentication
# - CI_CACHE_USER: Username for SSH connection

set -e

# Validate required environment variables
check_required_env() {
    local missing_vars=false

    if [ -z "${CI_CACHE_SERVER_IP}" ]; then
        echo "Error: CI_CACHE_SERVER_IP environment variable is not set"
        missing_vars=true
    fi

    if [ -z "${CI_CACHE_SERVER_PORT}" ]; then
        echo "Error: CI_CACHE_SERVER_PORT environment variable is not set"
        missing_vars=true
    fi

    if [ -z "${CI_CACHE_SSH_KEY_PATH}" ]; then
        echo "Error: CI_CACHE_SSH_KEY_PATH environment variable is not set"
        missing_vars=true
    fi

    if [ ! -f "${CI_CACHE_SSH_KEY_PATH}" ]; then
        echo "Error: SSH key file specified by CI_CACHE_SSH_KEY_PATH does not exist"
        missing_vars=true
    fi

    if [ -z "${CI_CACHE_USER}" ]; then
        echo "Error: CI_CACHE_USER environment variable is not set"
        missing_vars=true
    fi

    if [ "$missing_vars" = true ]; then
        exit 1
    fi
}

# Set up cache directory in user's home
CACHE_BASE_DIR="/home/${CI_CACHE_USER}/cache"

# Common SCP options
SCP_OPTIONS="-i ${CI_CACHE_SSH_KEY_PATH} -P ${CI_CACHE_SERVER_PORT} -o StrictHostKeyChecking=no"

# Ensure SSH key has correct permissions
ensure_ssh_key_permissions() {
    chmod 600 "${CI_CACHE_SSH_KEY_PATH}"
}

# Execute command on remote server via SSH
execute_remote_command() {
    local command=$1
    ensure_ssh_key_permissions
    ssh -i "${CI_CACHE_SSH_KEY_PATH}" -p "${CI_CACHE_SERVER_PORT}" -o StrictHostKeyChecking=no \
        "${CI_CACHE_USER}@${CI_CACHE_SERVER_IP}" "$command"
}

# Transfer file to remote server via SCP
transfer_to_remote() {
    local source=$1
    local destination=$2
    scp ${SCP_OPTIONS} "$source" "${CI_CACHE_USER}@${CI_CACHE_SERVER_IP}:$destination"
}

# Push directory to cache
push_directory_to_cache() {
    local source_path=$1
    local cache_path=$2
    local temp_tar="/tmp/cache_archive_$$.tar.gz"
    local temp_remote_tar="${cache_path}.tar.gz.tmp.$$"

    echo "Creating tar archive of directory..."
    tar -czf "$temp_tar" -C "$(dirname "$source_path")" "$(basename "$source_path")"
    
    # Create destination directory and transfer the archive
    execute_remote_command "mkdir -p \"$(dirname ${cache_path})\""
    transfer_to_remote "$temp_tar" "$temp_remote_tar"
    
    # Extract archive on remote and cleanup
    execute_remote_command "rm -rf \"${cache_path}\"; \
        mkdir -p \"${cache_path}\"; \
        tar -xzf \"${temp_remote_tar}\" -C \"$(dirname ${cache_path})\"; \
        rm -f \"${temp_remote_tar}\""
    
    rm -f "$temp_tar"
}

# Push single file to cache
push_file_to_cache() {
    local source_path=$1
    local cache_path=$2
    local temp_tar="/tmp/cache_archive_$$.tar.gz"
    local temp_remote_tar="${cache_path}.tar.gz.tmp.$$"

    echo "Creating tar archive of file..."
    tar -czf "$temp_tar" -C "$(dirname "$source_path")" "$(basename "$source_path")"

    execute_remote_command "mkdir -p \"$(dirname ${cache_path})\""
    transfer_to_remote "$temp_tar" "$temp_remote_tar"
    execute_remote_command "mv \"${temp_remote_tar}\" \"${cache_path}.tar.gz\""

    rm -f "$temp_tar"
}

# Push files to cache
push_to_cache() {
    local source_path=$1
    local cache_path="${CACHE_BASE_DIR}/${2}"

    if [ ! -e "$source_path" ]; then
        echo "Error: Source path '$source_path' does not exist"
        exit 1
    fi

    echo "Pushing '$source_path' to cache as '$cache_path'..."
    if [ -d "$source_path" ]; then
        push_directory_to_cache "$source_path" "$cache_path"
    else
        push_file_to_cache "$source_path" "$cache_path"
    fi
    echo "Successfully pushed to cache with atomic replacement"
}

# Pull directory from cache
pull_directory_from_cache() {
    local cache_path=$1
    local destination_path=$2
    local temp_tar="/tmp/cache_archive_$$.tar.gz"

    echo "Creating remote tar archive..."
    ssh -i "${CI_CACHE_SSH_KEY_PATH}" -p "${CI_CACHE_SERVER_PORT}" -o StrictHostKeyChecking=no \
        "${CI_CACHE_USER}@${CI_CACHE_SERVER_IP}" \
        "cd \"$(dirname ${cache_path})\"; tar -czf - \"$(basename ${cache_path})\"" > "$temp_tar"
    
    echo "Extracting tar archive..."
    mkdir -p "$destination_path"
    tar -xzf "$temp_tar" -C "$(dirname "$destination_path")"
    rm -f "$temp_tar"
}

# Pull single file from cache
pull_file_from_cache() {
    local cache_path=$1
    local destination_path=$2
    local temp_tar="/tmp/cache_archive_$$.tar.gz"

    echo "Downloading cached file..."
    scp ${SCP_OPTIONS} "${CI_CACHE_USER}@${CI_CACHE_SERVER_IP}:${cache_path}" "$temp_tar"

    echo "Extracting file..."
    cp "$temp_tar" "$destination_path"
    rm -f "$temp_tar"
}

# Pull files from cache
pull_from_cache() {
    # Temporarily disable exit on error for this function
    set +e
    
    local cache_path="${CACHE_BASE_DIR}/${1}"
    local destination_path=$2

    echo "Pulling '$cache_path' from cache to '$destination_path'..."
    
    # Create local destination directory
    mkdir -p "$(dirname "${destination_path}")"

    # Check if remote path exists
    if execute_remote_command "test -e \"${cache_path}.tar.gz\""; then
        if execute_remote_command "test -d \"${cache_path}\""; then
            pull_directory_from_cache "$cache_path" "$destination_path"
            local pull_status=$?
        else
            pull_file_from_cache "$cache_path" "$destination_path"
            local pull_status=$?
        fi
        
        if [ $pull_status -eq 0 ]; then
            echo "Successfully pulled from cache"
            set -e  # Re-enable exit on error
            return 0
        else
            echo "Error: Failed to pull from cache"
            set -e  # Re-enable exit on error
            return 1
        fi
    else
        echo "Cache miss: Path '${cache_path}' not found in cache"
        set -e  # Re-enable exit on error
        return 0  # Return success on cache miss
    fi
}

# Save Docker image to cache
# Example usage:
#   ./ci-cache.sh save-docker-image postgres:15.3 /cache/postgres.tar.gz  # Cache PostgreSQL (400MB+)
#   ./ci-cache.sh save-docker-image node:18 /cache/node.tar.gz          # Cache Node.js (1GB+)
#   ./ci-cache.sh save-docker-image myapp:latest /cache/myapp.tar.gz    # Cache custom app image
save_docker_image() {
    local image_name=$1
    local cache_path="${CACHE_BASE_DIR}/${2}"
    local temp_file="/tmp/${image_name//\//_}.tar.gz"

    echo "Saving Docker image '$image_name' to cache..."
    
    # Check if image exists
    if ! docker image inspect "$image_name" >/dev/null 2>&1; then
        echo "Error: Docker image '$image_name' does not exist"
        exit 1
    fi

    # Save and compress the image
    echo "Exporting and compressing image..."
    docker save "$image_name" | gzip > "$temp_file"

    # Push to cache
    push_to_cache "$temp_file" "$cache_path"

    # Clean up temporary file
    rm -f "$temp_file"
}

# Load Docker image from cache
# Example usage:
#   ./ci-cache.sh load-docker-image /cache/postgres.tar.gz  # Restore PostgreSQL image
#   ./ci-cache.sh load-docker-image /cache/node.tar.gz      # Restore Node.js image
#   ./ci-cache.sh load-docker-image /cache/myapp.tar.gz     # Restore custom app image
load_docker_image() {
    local cache_path="${CACHE_BASE_DIR}/${1}"
    local temp_file="/tmp/docker_image_$$.tar.gz"

    echo "Loading Docker image from cache..."

    # Pull from cache to temporary file
    if pull_from_cache "$cache_path" "$temp_file"; then
        echo "Loading image into Docker..."
        docker load < "$temp_file"
        rm -f "$temp_file"
        echo "Successfully loaded Docker image"
        return 0
    else
        rm -f "$temp_file"
        return 1
    fi
}

# Display usage information
show_usage() {
    echo "Usage: $0 <command> <args...>"
    echo ""
    echo "Commands:"
    echo "  push <source_path> <cache_path>    Push local file/directory to cache"
    echo "  pull <cache_path> <destination_path>    Pull file/directory from cache"
    echo "  save-docker-image <image_name> <cache_path>    Save Docker image to cache (e.g., postgres:15.3, node:18)"
    echo "  load-docker-image <cache_path>    Load Docker image from cache"
    echo ""
    echo "Examples:"
    echo "  # Cache node_modules directory"
    echo "  $0 push ./node_modules node_modules    # Save node_modules to cache"
    echo "  $0 pull node_modules ./node_modules    # Restore node_modules from cache"
    echo ""
    echo "  # Cache multiple Node.js project dependencies"
    echo "  $0 push ./app/node_modules app/node_modules       # Cache main app dependencies"
    echo "  $0 push ./design/node_modules design/node_modules # Cache design module dependencies"
    echo "  $0 pull app/node_modules ./app/node_modules       # Restore main app dependencies"
    echo "  $0 pull design/node_modules ./design/node_modules # Restore design module dependencies"
    echo ""
    echo "Environment variables:"
    echo "  CI_CACHE_SERVER_IP    IP address of the cache server (required)"
    echo "  CI_CACHE_SERVER_PORT  SSH port of the cache server (required)"
    echo "  CI_CACHE_SSH_KEY      Path to the SSH private key (required)"
    echo "  CI_CACHE_USER         SSH username (required)"
    exit 1
}

# Main script execution
check_required_env

case $1 in
    push)
        if [ $# -ne 3 ]; then
            show_usage
        fi
        push_to_cache "$2" "$3"
        ;;
    pull)
        if [ $# -ne 3 ]; then
            show_usage
        fi
        pull_from_cache "$2" "$3"
        ;;
    save-docker-image)
        if [ $# -ne 3 ]; then
            show_usage
        fi
        save_docker_image "$2" "$3"
        ;;
    load-docker-image)
        if [ $# -ne 2 ]; then
            show_usage
        fi
        load_docker_image "$2"
        ;;
    *)
        show_usage
        ;;
esac
