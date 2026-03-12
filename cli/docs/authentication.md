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

Save a token to a profile, and optionally set the API base URL for that profile:

```bash
operately auth login --token <token> [--base-url <url>] [--profile <name>]
```

Use `--base-url` when your token should talk to a non-default environment (for example staging or local).

If you omit `--base-url`, the CLI uses the default production URL:

`https://app.operately.com`

Good pattern: one profile per environment.

- `default` profile -> production URL
- `staging` profile -> staging URL
- `local` profile -> localhost URL

Examples:

```bash
# Production profile (default base URL)
operately auth login --token op_live_xxx

# Staging profile (custom base URL)
operately auth login --token op_staging_xxx --profile staging --base-url https://staging.operately.com

# Local profile
operately auth login --token op_local_xxx --profile local --base-url http://localhost:4000
```

#### How Base URL Is Resolved

For each command, the CLI resolves the Base URL in this order:

1. `--base-url` passed on the command
2. `OPERATELY_BASE_URL` environment variable
3. Base URL saved in the selected profile
4. Default: `https://app.operately.com`

Profile selection also has an order (because profile affects step 3):

1. `--profile` passed on the command
2. `OPERATELY_PROFILE` environment variable
3. Current active profile
4. `default`

Practical examples:

```bash
# Uses https://app.operately.com (if no env/profile base URL is set)
operately get_me

# Uses saved staging profile base URL
operately get_me --profile staging

# Uses env var, even if profile has another URL
OPERATELY_BASE_URL=https://preview.operately.com operately get_me --profile staging

# Uses explicit flag (highest priority)
operately get_me --profile staging --base-url http://localhost:4000
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
