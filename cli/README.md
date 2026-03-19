# Operately CLI

Official command-line interface for the Operately external API.

[![npm version](https://img.shields.io/npm/v/@operately/operately-cli.svg)](https://www.npmjs.com/package/@operately/operately-cli)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Installation

```bash
npm install -g @operately/operately-cli
```

## Quick Start

```bash
# Login with your API token
operately auth login --token <your-token>

# Verify authentication
operately auth whoami

# Start using the CLI
operately people get_me
operately companies get_work_map 

# Verify available commands
operately --help
operately companies --help
```

## Features

- **202 API endpoints** - Full coverage of the Operately external API
- **Simple command structure** - Commands map directly to API endpoints
- **Flexible authentication** - Token profiles, environment variables, or per-command flags
- **Multiple output formats** - Pretty JSON, compact JSON, or file output
- **Built-in help** - Detailed help for every command

## Command Structure

Commands follow the API endpoint naming with namespace and endpoint:

```bash
operately <namespace> <endpoint_name> [flags]
```

Examples:

```bash
operately people get_me
operately projects list
operately goals create --name "Q2 Revenue Goal" --space-id s1
operately tasks update_status --task-id t1 --status-id completed
```

## Authentication

### Login (Recommended)

Save your token to a profile:

```bash
operately auth login --token <your-token>
```

For different environments:

```bash
# Production (default)
operately auth login --token op_live_xxx

# Staging
operately auth login --token op_staging_xxx --profile staging --base-url https://staging.operately.com

# Local development
operately auth login --token op_local_xxx --profile local --base-url http://localhost:4000
```

### Environment Variables

For CI/CD and automation:

```bash
export OPERATELY_API_TOKEN=op_live_xxx
export OPERATELY_BASE_URL=https://app.operately.com
operately get_me
```

### Per-Command Override

For one-off commands:

```bash
operately get_me --token <token> --base-url <url>
```

## Input Flags

Flags map to API input fields using kebab-case:

```bash
# Simple values
operately projects update_name --project-id p1 --name "New Name"

# Booleans
operately projects get --project-id p1 --include-space

# Nulls
operately goals update_due_date --goal-id g1 --due-date null

# Arrays (repeat the flag)
operately notifications subscribe --subscriber-ids id1 --subscriber-ids id2

# Nested objects (dot-index notation)
operately projects update_task_statuses \
  --task-statuses.0.id ts1 \
  --task-statuses.0.label "To Do" \
  --task-statuses.1.id ts2 \
  --task-statuses.1.label "Done"
```

## Output Options

```bash
# Pretty JSON (default)
operately get_me

# Compact JSON
operately get_me --compact

# Save to file
operately get_project --project-id p1 --output ./project.json

# Verbose mode (shows request details)
operately get_me --verbose
```

## Help System

```bash
# General help
operately help

# Command-specific help
operately help get_me
operately help projects edit_name
operately help goals update_target_value
```

## Common Commands

### Projects

```bash
# List all projects
operately projects list

# Get project details
operately projects get --project-id p1 --include-space

# Create a project
operately projects create --name "Q2 Roadmap" --space-id s1

# Update project name
operately projects update_name --project-id p1 --name "Q2 Product Roadmap"

# Create a milestone
operately projects create_milestone --project-id p1 --title "Launch" --due-date 2024-06-30
```

### Goals

```bash
# List goals
operately goals list

# Create a goal
operately goals create --name "Revenue Goal" --space-id s1

# Update goal target
operately goals update_target_value --goal-id g1 --target-value 100000

# Create a check-in
operately goal_check_ins create --goal-id g1 --status on_track --message "Making good progress"
```

### Tasks

```bash
# List tasks
operately tasks list

# Create a task
operately tasks create --name "Design mockups" --milestone-id m1

# Update task status
operately tasks update_status --task-id t1 --status-id completed

# Assign task
operately tasks update_assignee --task-id t1 --assignee-id u1
```

### Spaces

```bash
# List spaces
operately spaces list

# Create a space
operately spaces create --name "Engineering" --mission "Build great products"

# Add members
operately spaces add_members --space-id s1 --member-ids u1 --member-ids u2
```

## Exit Codes

- `0` - Success
- `2` - CLI usage/validation error
- `3` - Missing authentication token/config
- `4` - API 4xx error (client error)
- `5` - API 5xx/network/fatal error (server error)

## Available Commands

The CLI provides access to 202 API endpoints across the following namespaces:

- `comments` - Comment management
- `companies` - Company and organization settings
- `documents` - Document creation and management
- `files` - File operations
- `folders` - Folder organization
- `goal_check_ins` - Goal progress updates
- `goal_discussions` - Goal-related discussions
- `goals` - Goal management
- `links` - Link management
- `notifications` - Notification preferences
- `people` - User and team member management
- `project_check_ins` - Project status updates
- `project_discussions` - Project-related discussions
- `project_milestones` - Milestone management
- `projects` - Project management
- `reactions` - Reaction management
- `resource_hubs` - Resource hub operations
- `space_discussions` - Space-level discussions
- `spaces` - Space (team/department) management
- `tasks` - Task management

For a complete list of commands, see [docs/commands.md](docs/commands.md).

## Documentation

- [Usage Guide](docs/usage.md) - Detailed usage instructions
- [Authentication](docs/authentication.md) - Authentication setup and options
- [Commands Reference](docs/commands.md) - Complete command catalog

## API Token

To use the CLI, you need an API token from your Operately account. Generate one at:

**Settings → API Tokens**

## License

Apache-2.0

## Support

- [GitHub Issues](https://github.com/operately/operately/issues)
- [Documentation](https://operately.com/help/)
