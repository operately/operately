# Operately CLI Usage

Use the Operately CLI to call Operately API endpoints directly from your terminal.

## Command Naming

- Root commands use the endpoint name directly:
  - `get_me`
- Namespaced commands use:
  - `<namespace> <endpoint_name>`
  - Example: `projects edit_name`

Command names are kept exactly as defined in the API.

`operately` and `op` are equivalent:

```bash
operately get_me
op projects edit_name --project-id p1 --name "New Name"
```

## Help and Discovery

General help:

```bash
operately help
```

Endpoint-specific help:

```bash
operately help get_me
operately help projects edit_name
operately help goals update_target_value
```

## Base Syntax

```bash
operately <endpoint_name> [flags]
operately <namespace> <endpoint_name> [flags]
```

Utility commands:

```bash
operately auth <login|status|whoami|logout> [flags]
operately version
operately help [command]
```

## Input Flags

Flags map directly to input field names using kebab-case:

- `project_id` -> `--project-id`
- `target_value` -> `--target-value`

### Booleans

```bash
--include-space
--include-space=true
```

### Nulls

Use literal `null`:

```bash
--due-date null
```

### Arrays

Repeat the same flag:

```bash
--subscriber-ids id1 --subscriber-ids id2
```

### Nested Objects / Lists

Use dot-index notation:

```bash
--task-statuses.0.id ts1
--task-statuses.0.label "To Do"
--task-statuses.1.id ts2
--task-statuses.1.label "Done"
```

## Request Behavior

- `query` endpoints send `GET`
- `mutation` endpoints send `POST` JSON body

## Global Flags

- `--token <token>`
- `--base-url <url>`
- `--profile <name>`
- `--compact`
- `--output <file>`
- `--verbose`

Examples:

```bash
operately get_me --compact
operately get_project --project-id p1 --output ./project.json
operately get_project --project-id p1 --verbose
```

## Output

- Default: pretty JSON to stdout
- `--compact`: compact JSON
- `--output <file>`: write JSON to file

## Exit Codes

- `0`: success
- `2`: CLI usage/validation error
- `3`: missing auth token/config
- `4`: API 4xx error
- `5`: API 5xx/network/fatal error

## Common Examples

```bash
# Root command
operately get_me

# Namespaced command
operately projects edit_name --project-id p1 --name "Q2 Plan"

# Nested input payload
operately goals update_target_value --goal-id g1 --target-value 42.5

# Mutation with auth override
operately projects edit_name --project-id p1 --name "Q2 Plan" --token opk_xxx
```
