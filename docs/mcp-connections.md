# MCP Connections

Operately exposes a hosted remote MCP server so AI clients (ChatGPT, Claude, Cursor, Codex, and other OAuth-capable MCP hosts) can read and optionally write workspace data on your behalf.

User-facing product documentation lives in the Operately docs site (separate repo). This page covers scopes, authorization, and connection management for self-hosted operators and developers.

## OAuth scopes

MCP uses two OAuth scopes:

| Scope | Access |
| ----- | ------ |
| `mcp:read` | Read-only tools (search, fetch, lookups) |
| `mcp:write` | Create, update, delete, and archive content — including tools marked destructive in the catalog |

Destructive tools (for example archive or delete) require `mcp:write` only. There is no separate destructive scope.

### Default behavior

If a client omits the `scope` parameter during authorization, the grant receives **`mcp:read` only**. Clients that need write access must request `mcp:write` explicitly.

This matches the CLI split between read-only and write API tokens.

## Connecting a client

1. Add Operately as an MCP server in your AI client (remote / OAuth flow).
2. Sign in and approve the requested scopes on the Operately consent screen.
3. Select the company this connection should use (one company per grant).

Arbitrary MCP clients can onboard via **Client ID Metadata Documents (CIMD)** without a server-side allowlist entry. Known directory partners may also be pre-registered.

## Managing connections

Users can review and revoke active MCP grants:

**Account → Security → MCP Connections** (`/account/security/mcp-connections`)

The page lists each connected client, granted scopes, when the connection was created, and last use. Revoking a connection invalidates its tokens immediately; further `tools/call` requests return unauthorized.

## Security notes

- Each grant is bound to one company at connect time; tools do not accept `company_id` arguments.
- Write and destructive capabilities require an explicit `mcp:write` grant.
- Server-side rate limits apply to OAuth, CIMD metadata fetch, and tool calls.
- For architecture and tool development, see `specs/0012-operately-mcp.md` and `specs/0016-mcp-security-hardening.md`.
