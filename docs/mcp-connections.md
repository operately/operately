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

The unauthenticated MCP challenge and omitted `scope` parameter both request **`mcp:read` and `mcp:write`**. The consent screen selects **View and edit** by default. The person can choose **View only**, which grants `mcp:read` and leaves `mcp:write` off the token.

A client that explicitly requests `mcp:read` alone cannot be upgraded to write on that screen. The grant never includes a scope the client did not request.

## Connecting a client

The MCP Connections page includes setup steps for ChatGPT, Claude, Cursor, Codex CLI, Claude Code, and other compatible clients. Select a client to see its instructions and copy the server URL, command, or configuration. These values use the current installation's URL, including on self-hosted instances. The setup guides remain available for troubleshooting and additional clients.

1. Add Operately as an MCP server in your AI client (remote / OAuth flow).
2. Sign in and approve the requested scopes on the Operately consent screen.
3. Select the company this connection should use (one company per grant).

Arbitrary MCP clients can onboard via **Client ID Metadata Documents (CIMD)** without a server-side allowlist entry. Known directory partners may also be pre-registered.

When updating the in-app instructions, check the official [ChatGPT](https://developers.openai.com/api/docs/guides/custom-mcp-server), [Claude](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp), [Cursor](https://cursor.com/docs/mcp), and [Claude Code](https://code.claude.com/docs/en/mcp) guides, plus `codex mcp add --help` and `codex mcp login --help` for the CLI commands.

## Managing connections

Users can review and revoke active MCP grants:

**Account → Security → MCP Connections** (`/account/security/mcp-connections`)

The page lists each connected client, granted scopes, when the connection was created, and last use. Revoking a connection invalidates its tokens immediately; further `tools/call` requests return unauthorized.

## Security notes

- Each grant is bound to one company at connect time; tools do not accept `company_id` arguments.
- Write and destructive capabilities require an explicit `mcp:write` grant.
- Server-side rate limits apply to OAuth, CIMD metadata fetch, and tool calls.
- For architecture and tool development, see `specs/0012-operately-mcp.md` and `specs/0016-mcp-security-hardening.md`.

## Work management tools

MCP supports KPI management, discussion and check-in drafts/scheduling, check-in and retrospective editing, milestone discovery, and task reminders. Tool metadata describes inputs, examples, and edit restrictions.

Scheduled goal check-ins publish their saved snapshot without applying target, checklist, or due-date changes to the goal. Use immediate publication through `update_goal_check_in` when those changes must be applied.

## Collaboration tools

MCP supports inviting members and guests, resource access, notification read state, subscribing/unsubscribing, and profile preferences. Existing company roles and resource permissions apply. `get_space` includes enabled tools; `list_goal_access_members` lists direct goal access. Use `resource_id` and `resource_type` to subscribe or unsubscribe; the tools resolve the subscription list automatically.
