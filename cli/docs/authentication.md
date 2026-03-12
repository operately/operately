# Operately CLI Authentication

Use an API token to authenticate CLI commands.

## Recommended Setup

```bash
operately auth login --token <your-token>
operately auth status
operately auth whoami
```

`op` is equivalent to `operately`:

```bash
op auth login --token <your-token>
```

## Authentication Options

You can provide authentication in three ways:

1. Save it once with `auth login` (best for local use)
2. Use environment variables (best for CI/scripts)
3. Pass flags on a single command (best for temporary overrides)

When multiple options are used together, command flags win, then environment variables, then saved profile values.

## Auth Commands

### Login

Save a token (and optional base URL) to a profile:

```bash
operately auth login --token <token> [--base-url <url>] [--profile <name>]
```

Examples:

```bash
operately auth login --token op_live_xxx
operately auth login --token op_live_xxx --profile staging --base-url https://staging.operately.com
```

### Status

Check current authentication setup:

```bash
operately auth status [--profile <name>]
```

### Who Am I

Calls `get_me` using resolved auth options:

```bash
operately auth whoami [--profile <name>]
```

### Logout

Clears the stored token for a profile:

```bash
operately auth logout [--profile <name>]
```

## Environment Variables

Useful for automation and non-interactive environments:

- `OPERATELY_API_TOKEN`
- `OPERATELY_BASE_URL`
- `OPERATELY_PROFILE`

Example:

```bash
export OPERATELY_API_TOKEN=op_live_xxx
export OPERATELY_BASE_URL=https://app.operately.com
export OPERATELY_PROFILE=default
operately get_me
```

## Per-Command Overrides

Override token/profile/base URL for a single call:

```bash
operately get_me --token <token>
operately get_me --profile staging
operately get_me --base-url https://staging.operately.com
```

## Typical Flow

```bash
# 1) Login once
operately auth login --token <token>

# 2) Verify
operately auth whoami

# 3) Run API commands
operately get_me
operately projects search --name "Roadmap"
```
