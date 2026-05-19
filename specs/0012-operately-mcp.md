# Operately MCP for ChatGPT Apps and Claude Connectors

## Summary

Build a first-party hosted remote MCP server in the Operately backend for distribution through the ChatGPT app directory / Codex plugin flow and the Claude Connectors Directory.

This becomes Operately's third integration path:

- session-authenticated internal API for the web app
- token-authenticated external API for the CLI and scripts
- OAuth-authenticated MCP for ChatGPT and Claude

The MCP layer should reuse the existing endpoint handlers in `OperatelyWeb.Api` as the business-logic source of truth. It should add MCP-specific auth, company resolution, tool definitions, and review hardening without changing existing endpoint signatures.

---

## Important Decisions

### 1. New auth mode: `:mcp_oauth`

Session cookies are wrong for remote hosts. CLI API tokens are too narrow because they are person/company scoped and do not fit the "connect once, use across contexts" UX. MCP should use delegated per-user OAuth and resolve company context at request time.

### 2. Existing endpoint signatures stay unchanged

No existing API endpoint should gain a `company_id` input. Company selection happens before endpoint dispatch. By the time a request reaches an existing handler, `current_company` and `current_person` are already assigned.

### 3. Company selection belongs in a plug / request context resolver

Company handling must be declared explicitly per MCP tool. Only tools marked as company-context tools may expose `company_id`, and that field is consumed by MCP-specific request plumbing, not by the existing API endpoints.

### 4. One OAuth connection may cover multiple companies

The MCP equivalent of CLI profiles is:

- one OAuth grant per connected ChatGPT / Claude account
- many allowed companies on that grant
- one default company on that grant

This avoids depending on the host product to support multiple simultaneous Operately connections.

### 5. Curated MCP tools, not a full endpoint mirror

The public MCP surface should be small, legible, and reviewable. Existing robust endpoints remain the implementation primitives, but they should not all become public MCP tools automatically.

### 6. Read-first submission

Start with a high-quality read surface for search, lookup, and citations. Add write tools after auth, company resolution, and review posture are stable.

---

## High-Level Architecture

### New backend surface

- Add a hosted MCP endpoint, e.g. `/mcp`
- Add OAuth endpoints and metadata required for remote MCP auth
- Add an MCP tool catalog and executor in the Phoenix app

### New persisted state

Add MCP grant storage that records:

- connected account
- provider / client identity
- granted scopes
- allowed companies
- default company
- token / refresh-token lineage and revocation state

Suggested modules:

- `Operately.Mcp.Grants`
- `Operately.Mcp.Grant`
- `Operately.Mcp.GrantCompany`

### New MCP request pipeline

Suggested modules:

- `OperatelyWeb.Mcp`
- `OperatelyWeb.Mcp.Plugs.RequireMcpAuth`
- `OperatelyWeb.Mcp.Plugs.ResolveCompany`
- `OperatelyWeb.Mcp.Companies`
- `OperatelyWeb.Mcp.Executor`
- `OperatelyWeb.Mcp.Tools`
- `OperatelyWeb.Mcp.Resources`

### Existing business logic reuse

The executor maps each MCP tool to one or more existing `OperatelyWeb.Api.*` handlers and calls them with a prepared `conn` carrying:

- `current_account`
- `current_company`
- `current_person`
- auth mode / scope metadata

This keeps one business-logic path instead of forking API behavior.

---

## Company Resolution

Company context is resolved before existing endpoint dispatch. The selected company is assigned on the connection, and any MCP-only selector fields are removed from the payload passed into the existing handler.

Each MCP tool must declare one company mode in the tool registry:

- `none`: no company context and no `company_id`
- `resource_derived`: company is inferred from the referenced resource and `company_id` is not accepted
- `optional`: `company_id` may be supplied, otherwise resolution falls back to the default / single allowed company
- `required`: `company_id` must be supplied

Only `optional` and `required` tools include `company_id` in their MCP input schema.

Resolution order for `optional` tools:

1. Explicit `company_id` in MCP tool arguments, if provided
2. Default company on the MCP grant
3. The only allowed company on the grant, if there is exactly one
4. Otherwise return a structured `company_required` error with eligible companies

Resolution order for `resource_derived` tools:

1. Derive company from the referenced resource
2. Verify the company is in the grant's allowed companies
3. Otherwise return a structured access / mismatch error

Notes:

- Existing endpoints do not receive a `company_id` field
- Existing handlers continue to rely on `current_company`
- Tools such as `get_project(project_id)`, `get_space(space_id)`, and `get_goal(goal_id)` should use `resource_derived`
- Tools using `resource_derived` should not accept `company_id` at all
- Which tools are `none`, `resource_derived`, `optional`, or `required` must be declared explicitly in the MCP tool registry

---

## OAuth and Grant Model

### OAuth behavior

Use per-user OAuth for ChatGPT and Claude connections.

During authorization:

1. authenticate the user in Operately
2. show the companies they belong to
3. let them pick:
   - default company
   - additional allowed companies, if desired
4. persist that selection on the MCP grant

### Scope model

Define MCP scopes separately from CLI token modes. Suggested first split:

- `mcp:read`
- `mcp:write`

Later, this can expand into narrower scopes if needed, but the first version should stay simple.

---

## MCP Surface

### Phase 1: read-only tools

Start with a small set of high-signal tools backed by existing handlers:

- `list_companies`
- `get_current_company`
- `set_default_company`
- `get_me`
- `list_projects`
- `get_project`
- `list_goals`
- `get_goal`
- `list_tasks`
- `get_task`
- `search`
- `fetch`

Notes:

- `list_companies`, `get_current_company`, and `set_default_company` should be backed by MCP-specific modules/endpoints, not by changing the behavior of the existing `companies/list` endpoint
- `get_project`, `get_goal`, and similar resource-specific lookups should be `resource_derived` tools and should not accept `company_id`
- Company-browsing tools such as `list_projects`, `list_goals`, and `list_tasks` should have their company mode declared explicitly in the MCP tool registry
- `search` and `fetch` should be first-class MCP tools, not thin aliases
- `fetch` should return citation-friendly content and canonical Operately URLs
- project and goal markdown support can reuse existing markdown-capable endpoints

### Phase 2: write tools

Add a limited write surface after the read path is stable:

- create/update tasks
- create comments
- create project / goal updates
- selected project / goal mutations

Write tools must carry accurate review metadata and be easy for admins to restrict.

### Resources and prompts

Resources and prompts can be added after tools are working, but they are secondary to a strong tool surface for the first release.

Interactive app surfaces are explicitly out of scope for the first MCP implementation.

---

## Implementation Plan

### PR 1: MCP foundations

- Add router entries for MCP and OAuth
- Add MCP grant tables and schemas
- Implement `:mcp_oauth` auth mode
- Implement `RequireMcpAuth`
- Implement `ResolveCompany`
- Add MCP-focused company context modules/endpoints

Outcome: authenticated MCP requests can resolve an account and company before dispatch.

### PR 2: Internal executor and tool registry

- Add MCP tool registry
- Add executor that maps tools to existing handlers
- Build request/response normalization for MCP
- Strip MCP-only `company_id` fields before calling existing handlers
- Declare company mode per tool and generate MCP input schemas accordingly

Outcome: one MCP tool can invoke one existing endpoint handler without endpoint changes.

### PR 3: Read-only MVP

- Implement the initial read tool set
- Add `search` and `fetch`
- Add canonical URL generation
- Add integration tests for multi-company resolution and ambiguity

Outcome: a reviewable, useful read-only MCP suitable for custom connection testing in ChatGPT and Claude.

### PR 4: Write tool expansion

- Add limited write tools
- Add scope checks and tool-level permission metadata
- Add confirmation-safe behavior and clear failure modes

Outcome: a minimal but credible action surface without exposing the full endpoint catalog.

### PR 5: Submission hardening

- Privacy policy / support URLs / branding assets
- Reviewer test accounts and test companies
- Rate limiting, audit logging, and operational visibility
- Final validation in ChatGPT and Claude custom connector flows

Outcome: the MCP is ready for directory submission.

---

## Testing

Add tests at three layers:

- auth and grant tests
- company resolution tests
- tool-to-handler integration tests

Critical scenarios:

- one grant with one company
- one grant with many companies and a default
- explicit company override on `optional` and `required` tools
- ambiguous request with no company specified
- resource-specific tool that infers company correctly
- resource-specific tool rejects unexpected `company_id`
- `required` company tools fail when `company_id` is omitted
- grant scope blocks write tools
- existing endpoint handlers receive the same assigns shape they expect today

---

## Out of Scope

- changing existing endpoint signatures to accept company parameters
- exposing the full external API catalog as MCP tools
- making local `stdio` the primary integration path
- interactive app UI work for the first release

---

## Result

If implemented this way, Operately gets:

- one MCP surface suitable for both OpenAI and Anthropic distribution
- one new auth mode without disturbing the existing session and token flows
- multi-company support without pushing company parameters into existing endpoints
- reuse of the current robust, tested API handlers instead of rebuilding business logic
