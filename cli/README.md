# Operately CLI

Official command-line interface for the Operately external API.

[![npm version](https://img.shields.io/npm/v/@operately/operately-cli.svg)](https://www.npmjs.com/package/@operately/operately-cli)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Installation

```bash
npm install -g @operately/operately-cli
```

The package installs two equivalent binaries:

- `operately`
- `op`

Verify the installed version:

```bash
operately --version
# or
operately version
```

## Updating

```bash
npm update -g @operately/operately-cli
```

Or:

```bash
npm install -g @operately/operately-cli@latest
```

## Quick Start

```bash
# Save a token to the default profile
operately auth login --token <your-token>

# Verify authentication
operately auth whoami

# Explore the CLI
operately --help
operately projects --help
operately projects create --help

# Run API commands
operately people get_me
operately spaces list
operately companies get_work_map
```

## Current CLI Shape

The current bundled API catalog exposes **196 endpoint commands** across **12 namespaces**:

- `comments`
- `companies`
- `documents`
- `goals`
- `links`
- `notifications`
- `people`
- `projects`
- `reactions`
- `resource_hubs`
- `spaces`
- `tasks`

All API endpoint commands in the current catalog are namespaced. There are no root API commands such as `operately get_me`.

## Command Structure

API endpoint commands use this shape:

```bash
operately <namespace> <command> [flags]
```

Examples:

```bash
operately people get_me
operately projects list --include-space
operately projects get --id p1 --include-space
operately tasks list --project-id p1
```

Utility commands are separate from API endpoints:

```bash
operately auth <login|status|whoami|logout> [flags]
operately --version
operately help [namespace] [command]
```

## Help And Discovery

```bash
# General help
operately --help
operately help

# Namespace help
operately projects --help
operately help projects

# Command help
operately projects create --help
operately help projects create

# Auth help
operately auth --help
operately help auth login
```

## Authentication

The CLI resolves credentials in this order:

1. Per-command flags
2. Environment variables
3. Saved profile values

### Save A Profile

```bash
operately auth login --token <token>
operately auth status
operately auth whoami
```

Profiles are stored in `~/.operately/config.json`.

Use `--base-url` when talking to a non-default environment:

```bash
# Production
operately auth login --token op_live_xxx

# Staging
operately auth login --token op_staging_xxx --profile staging --base-url https://staging.operately.com

# Local development
operately auth login --token op_local_xxx --profile local --base-url http://localhost:4000
```

If no base URL is configured, the CLI defaults to:

```text
https://app.operately.com
```

### Environment Variables

```bash
export OPERATELY_API_TOKEN=op_live_xxx
export OPERATELY_BASE_URL=https://app.operately.com
export OPERATELY_PROFILE=default

operately people get_me
```

### Per-Command Overrides

```bash
operately people get_me --token <token>
operately people get_me --profile staging
operately people get_me --base-url https://staging.operately.com
```

## Flags And Input Encoding

Flags map from API field names to kebab-case:

```bash
# project_id -> --project-id
operately projects update_name --project-id p1 --name "New Name"
```

Booleans:

```bash
operately projects get --id p1 --include-space
operately projects get --id p1 --include-space=true
```

Nulls:

```bash
operately goals update_due_date --goal-id g1 --due-date null
```

Arrays:

```bash
operately notifications mark_many_as_read --ids n1 --ids n2
```

Nested objects and lists use dot-index notation:

```bash
operately projects update_task_statuses \
  --project-id p1 \
  --task-statuses.0.id todo \
  --task-statuses.0.label "To Do" \
  --task-statuses.0.color gray \
  --task-statuses.0.index 0 \
  --task-statuses.0.value todo \
  --task-statuses.0.closed false \
  --task-statuses.1.id done \
  --task-statuses.1.label "Done" \
  --task-statuses.1.color green \
  --task-statuses.1.index 1 \
  --task-statuses.1.value done \
  --task-statuses.1.closed true
```

Many fields shown as `<markdown>` in `--help` accept markdown text directly:

```bash
operately documents create \
  --resource-hub-id rh1 \
  --name "Guide" \
  --content "# Getting Started\n\nWelcome to the team."
```

Contextual dates let you pass either an exact day or a broader period.
For `year`, `quarter`, and `month` values, the CLI resolves the value to a real date:

- no suffix: use the end of the period
- `^`: use the start of the period
- `null`: clear the date

Examples:

- `2026-06-30` -> exact day
- `2026` -> December 31, 2026
- `2026^` -> January 1, 2026
- `2026/q2` -> June 30, 2026
- `2026/q2^` -> April 1, 2026
- `2026/06` -> June 30, 2026
- `2026/06^` -> June 1, 2026

Example command:

```bash
operately tasks create \
  --type project \
  --id p1 \
  --name "Design mockups" \
  --assignee-id null \
  --due-date 2026-06-30
```

## Output Options

For API endpoint commands:

```bash
# Pretty JSON (default)
operately people get_me

# Compact JSON
operately people get_me --compact

# Write JSON to a file
operately projects get --id p1 --output ./project.json

# Print request details while executing
operately people get_me --verbose
```

## Common Commands

```bash
# People
operately people get_me

# Companies
operately companies get_work_map

# Spaces
operately spaces list --include-members
operately spaces create --name "Engineering" --mission "Build great products" --company-permissions 10 --public-permissions 0

# Projects
operately projects list --include-space --include-milestones
operately projects get --id p1 --include-space
operately projects create \
  --space-id s1 \
  --name "Q2 Product Roadmap" \
  --anonymous-access-level 0 \
  --company-access-level 10 \
  --space-access-level 70

# Goals
operately goals list
operately goals create \
  --space-id s1 \
  --name "Revenue Goal" \
  --anonymous-access-level 0 \
  --company-access-level 10 \
  --space-access-level 70

# Tasks
operately tasks list --project-id p1
operately tasks create \
  --type project \
  --id p1 \
  --name "Design mockups" \
  --assignee-id null \
  --due-date 2026-06-30

# Resource hubs and documents
operately resource_hubs list_nodes --resource-hub-id rh1
operately documents create --resource-hub-id rh1 --name "Guide" --content "# Guide"
```

Many create and update commands have additional required fields. Use `--help` on the specific command before scripting it.

## Exit Codes

- `0` - Success
- `1` - `auth logout` had nothing to clear for the selected profile
- `2` - CLI usage, validation, or help error
- `3` - Missing authentication token/config
- `4` - API 4xx error, including authentication failures
- `5` - API 5xx, network, or fatal error

## Command Catalog

For the full generated command list, see [docs/commands.md](https://github.com/operately/operately/blob/main/cli/docs/commands.md).

## API Token

Generate an API token in Operately, then use it with:

```bash
operately auth login --token <your-token>
```

## License

Apache-2.0

## Support

- [GitHub Issues](https://github.com/operately/operately/issues)
