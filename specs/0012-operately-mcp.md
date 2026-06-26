# Operately MCP for ChatGPT Apps and Claude Connectors

## Summary

Build a first-party hosted remote MCP server in the Operately backend for distribution through the ChatGPT app directory / Codex plugin flow and the Claude Connectors Directory.

This becomes Operately's third integration path:

- session-authenticated internal API for the web app
- token-authenticated external API for the CLI and scripts
- OAuth-authenticated MCP for ChatGPT and Claude

The MCP layer uses MCP wrapper modules over the existing Operately API handlers. MCP-specific auth, company resolution, tool definitions, and review hardening live in the MCP layer, while the existing `OperatelyWeb.Api` handlers remain the first execution source of truth for the initial MCP surface. Wrappers forward an authenticated request conn into those handlers and only do small MCP-specific input/output adaptation when necessary.

---

## Important Decisions

### 1. New auth mode: `:mcp_oauth`

Session cookies are wrong for remote hosts. CLI API tokens are too narrow because they are person/company scoped and do not fit the "connect once, use across contexts" UX. MCP should use delegated per-user OAuth and bind each MCP connection to one selected company during authorization.

### 2. Prepared request context

MCP request dispatch resolves company context before calling an MCP wrapper. By the time wrapper execution starts, `current_company` and `current_person` are already resolved and available in the request context.

### 3. Company selection happens at connect time, not in tool arguments

MCP tools should not ask the user or client for `company_id`. During first authorization, the user should either:

- have their only company selected automatically, or
- choose one company for this MCP connection

That selected company is persisted on the MCP grant and assigned onto the request before wrapper execution.

### 4. One OAuth connection is bound to one company

The MCP equivalent of a CLI profile is:

- one OAuth grant per connected ChatGPT / Claude account
- one selected company on that grant

If a user wants to use a different company, they reconnect and authorize that company. This keeps tool schemas simple and predictable across ChatGPT, Claude, and IDE MCP clients.

### 5. Curated MCP tools, not a full endpoint mirror

The public MCP surface should be small, legible, and reviewable. MCP tools are a curated subset built on top of shared Operately operations rather than a full mirror of the app API.

### 6. Read-first submission

Start with a high-quality read surface for search, lookup, and citations. Add write tools after auth, company resolution, and review posture are stable.

---

## High-Level Architecture

### New backend surface

- Add a hosted MCP endpoint, e.g. `/mcp`
- Add OAuth endpoints and metadata required for remote MCP auth
- Add an MCP tool catalog, registry, and dispatcher in the Phoenix app

### New persisted state

Add MCP grant storage that records:

- connected account
- provider / client identity
- granted scopes
- selected company
- token / refresh-token lineage and revocation state

Suggested modules:

- `Operately.Mcp.Grants`
- `Operately.Mcp.Grant`

### New MCP request pipeline

Suggested modules:

- `OperatelyWeb.Mcp`
- `OperatelyWeb.Mcp.Catalog`
- `OperatelyWeb.Mcp.Plugs.RequireMcpAuth`
- `OperatelyWeb.Mcp.Plugs.ResolveCompany`
- `OperatelyWeb.Mcp.Companies`
- `OperatelyWeb.Mcp.Executor`
- `OperatelyWeb.Mcp.Tools`
- `OperatelyWeb.Mcp.Resources`

### Shared business logic

Each MCP tool is implemented as a wrapper module that:

- declares MCP-facing metadata such as name, schemas, scopes, and company mode
- adapts MCP arguments into the inputs expected by an existing `OperatelyWeb.Api.*` or `OperatelyWeb.Api.Wrappers.*` handler
- forwards the authenticated request conn into that handler
- shapes handler results into MCP-friendly outputs only when needed

Wrappers execute with an authenticated request conn carrying:

- `current_account`
- `current_company`
- `current_person`
- auth mode / scope metadata

This keeps one shared execution path across the web app and MCP while allowing MCP-specific schemas, examples, and output contracts. If logic is later extracted below an API handler, both the handler and the MCP wrapper should use the extracted module, but that extraction is not a prerequisite for the first MCP tools.

---

## Company Resolution

Company context is resolved before wrapper execution. The selected company from the MCP grant is assigned into the authenticated request conn, and MCP tools never accept `company_id`.

Each MCP tool must declare one company mode in the tool registry:

- `none`: no company context and no `company_id`
- `authenticated`: use the company selected on the MCP grant
- `resource_derived`: the primary resource is identified by a resource-specific input such as `goal_id`, `project_id`, `task_id`, or URL

No company mode includes `company_id` in the MCP input schema.

Resolution order for authenticated MCP requests:

1. Load the selected company from the MCP grant
2. Load the matching `current_person` membership for that account and company
3. Assign `current_account`, `current_company`, and `current_person` onto the request conn before wrapper execution
4. If access has been revoked, return a structured auth / access error that requires reconnect or reauthorization

Notes:

- Wrappers receive company context through `conn.assigns` rather than a `company_id` input
- Tools such as `get_project(project_id)`, `get_space(space_id)`, and `get_goal(goal_id)` should use `resource_derived`
- Resource-specific tools should rely on the existing API handler they call to enforce resource access and cross-company rejection
- In the current runtime, `company_mode` is catalog metadata, not a separate executor dispatch policy
- Which tools are `none`, `authenticated`, or `resource_derived` must be declared explicitly in the MCP tool registry

---

## OAuth and Grant Model

### OAuth behavior

Use per-user OAuth for ChatGPT and Claude connections.

During authorization:

1. authenticate the user in Operately
2. load the companies they belong to
3. if there is exactly one company, select it automatically
4. if there are many companies, ask the user to choose the company for this MCP connection
5. persist that selection on the MCP grant

Switch companies by reconnecting / reauthorizing the MCP connection.

### Scope model

Define MCP scopes separately from CLI token modes. Suggested first split:

- `mcp:read`
- `mcp:write`

Later, this can expand into narrower scopes if needed, but the first version should stay simple.

### Client registration

PRs 1–4 accept only pre-registered OAuth clients configured on the Operately server:

- each supported client has an explicit `client_id`
- each supported redirect URI is pinned in config
- the server does not fetch remote client metadata documents during authorization

PR 5 adds Client ID Metadata Documents (CIMD) so arbitrary MCP clients can onboard without a server-side config entry, while keeping the `:mcp_oauth_clients` allowlist as the fast path for directory partners.

Resolution order after PR 5:

1. match `:mcp_oauth_clients` config
2. if `client_id` is a valid HTTPS metadata URL, fetch and validate the document
3. reject unknown clients

Dynamic Client Registration remains out of scope unless a later client ecosystem need justifies it.

---

## MCP Surface

### Phase 1: read-only tools

Start with a small set of high-signal tools backed by MCP wrappers over shared Operately operations:

- `get_current_company`
- `get_me`
- `list_people`
- `get_person`
- `list_spaces`
- `get_space`
- `list_projects`
- `get_project`
- `get_milestone`
- `list_milestone_tasks`
- `list_project_discussions`
- `get_project_discussion`
- `list_project_check_ins`
- `get_project_check_in`
- `list_goals`
- `list_goal_discussions`
- `list_goal_check_ins`
- `get_goal`
- `get_goal_check_in`
- `list_tasks`
- `get_task`
- `list_space_discussions`
- `list_task_statuses`
- `get_space_discussion`
- `list_docs_and_files`
- `get_document`
- `get_file`
- `get_link`
- `search`
- `fetch`

Notes:

- `get_current_company` should be served by an MCP wrapper over the existing company API handler
- Company-browsing tools such as `list_people`, `list_spaces`, `list_projects`, and `list_goals` should always operate on the authenticated company
- `list_tasks` should accept exactly one of `project_id` or `space_id`
- `list_docs_and_files` should accept exactly one of `space_id`, `project_id`, `goal_id`, or `folder_id`
- `get_project`, `get_goal`, and similar resource-specific lookups should be `resource_derived` tools and should not accept `company_id`
- No MCP tool should expose `company_id` in its schema
- `search` and `fetch` should be first-class MCP tools, not thin aliases
- Structured discussions and check-ins should be exposed through dedicated read-only tools rather than flattened into search results
- Resource-hub browsing should start with `list_docs_and_files` plus focused getters for documents, files, and links
- `fetch` should return citation-friendly content and canonical Operately URLs
- `fetch` should stay tool-first in the MVP and return inline content; MCP resources and `resource_link` blocks can be added later if they prove useful
- markdown support for project, goal, milestone, and space fetches should be served through existing API handlers plus shared `Operately.MD.*` renderers

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

## Protocol Compatibility

To maximize compatibility with ChatGPT, Claude, and IDE clients, the first release should explicitly target standard remote MCP behavior:

- implement Streamable HTTP as the primary transport
- implement OAuth-protected remote MCP discovery correctly, including Protected Resource Metadata and Authorization Server Metadata
- bind access tokens to the MCP server correctly, including resource indicators and audience validation
- support pre-registered OAuth clients in PRs 1–4; add Client ID Metadata Documents in PR 5
- validate the `Origin` header on Streamable HTTP requests
- honor protocol version negotiation and required MCP HTTP headers
- keep tool schemas strict and portable by using standards-compliant JSON Schema
- return structured tool output where possible, with text fallbacks for older or less capable clients

---

## Implementation Notes

### Tool descriptors and catalog

- Each tool descriptor should declare accurate MCP annotations where possible, especially `readOnlyHint`, `destructiveHint`, and `openWorldHint`
- The catalog should declare `securitySchemes` explicitly, even when the whole first-release server is OAuth-protected
- The catalog should stay machine-readable enough to generate discovery output, docs, fixtures, and future client helpers from one source of truth
- Keep examples close to wrapper definitions so usage guidance stays synchronized with implementation

### Tool responses

- Tool responses should prefer a three-part response shape:
  - `structuredContent` for machine-readable payloads
  - `content` for short human-readable summaries and compatibility with clients that rely on text blocks
  - `_meta` only for host-specific data that should not be treated as model-visible business output
- Tool responses should be normalized consistently so wrappers can return structured data without repeating serialization logic

### Auth and request context

- Bearer auth should be enforced at the transport layer before tool dispatch
- Host-provided request hints such as locale, user agent, user location, and anonymous session identifiers should be treated only as optional presentation or analytics hints, never as authorization context

### Shared execution across surfaces

- Keep one source of truth for high-level operations so the web app, CLI, MCP tools, docs, examples, and tests describe the same capabilities
- For the first MCP read surface, prefer existing `OperatelyWeb.Api` handlers and `OperatelyWeb.Api.Wrappers` modules as that source of truth
- If a capability later needs extraction below `OperatelyWeb.Api`, both the API handler and the MCP wrapper should use the extracted module, but that extraction is not required up front
- Prefer a curated MCP surface even when other Operately surfaces expose a broader command tree
- Shared operations should stay side-effect safe for in-process reuse across multiple surfaces
- Exclude long-running watch, poll, or stream flows from MCP unless they are redesigned as non-blocking MCP-native tools
- Operately's hosted remote MCP should remain a first-class backend surface, not a generic wrapper around the CLI

---

## Implementation Plan

### PR 1: MCP foundations (Implemented)

- Add router entries for MCP transport, OAuth, and auth-discovery metadata
- Add MCP grant tables and schemas
- Implement `:mcp_oauth` auth mode
- Implement `RequireMcpAuth`
- Implement `ResolveCompany`
- Add first-time company selection during OAuth authorization
- Add MCP-focused company context modules/endpoints
- Implement Streamable HTTP transport and required MCP/OAuth HTTP headers
- Validate `Origin` on Streamable HTTP requests
- Validate token audience and return spec-compliant auth discovery errors

Outcome: authenticated MCP requests can resolve an account and company before dispatch.

Status: implemented.

### PR 2A: Wrapper-driven tool registry foundation (Implemented)

- Add an MCP tool behavior and one wrapper module per MCP tool
- Keep concrete wrapper modules under `OperatelyWeb.Mcp.Tools`
- Keep catalog infrastructure such as `Definition`, `JsonSchema`, and `Registry` under `OperatelyWeb.Mcp.Catalog`
- Require each wrapper to declare MCP-facing metadata: `name`, `description`, `input_schema`, `output_schema`, `required_scopes`, and `company_mode`
- Keep optional MCP presentation metadata on wrappers as well: `title`, examples, annotations, `securitySchemes`, safety classification, and discovery metadata
- Generate the registry and `tools/list` descriptors dynamically from compiled wrapper modules instead of maintaining a separate hand-authored catalog
- Keep descriptor ordering deterministic and curated through wrapper metadata rather than module discovery order
- Enforce catalog invariants through tests over the full wrapper set rather than runtime validation inside the definition struct
- Keep the registry structured enough to power future CLI/MCP discovery and shared documentation

Outcome: Operately can describe MCP tools from the same wrapper modules that will later execute them.

Status: implemented.

### PR 2B: Wrapper runtime and first endpoint-backed execution path (Implemented)

- Add `tools/call` dispatch that resolves a wrapper module from the registry and invokes `call(conn, arguments)`
- Execute wrappers with the authenticated request conn and the MCP auth/company assigns already loaded
- Validate MCP inputs before wrapper execution
- Require callers to resolve a tool definition before execution
- For each implemented tool, delegate from the wrapper to an existing `OperatelyWeb.Api.*` or `OperatelyWeb.Api.Wrappers.*` handler and pass only the inputs relevant to MCP
- Allow wrappers to do small MCP-specific preprocessing or postprocessing when necessary, for example decoding external IDs or supplying defaults normally injected by TurboConnect
- Add one minimal end-to-end tool path to prove dispatch works through the wrapper runtime and existing API execution layer

Outcome: one MCP tool wrapper can invoke existing Operately API logic through the MCP runtime.

Status: implemented.

### PR 2C: MCP output contracts and discovery (Implemented)

- Keep `tools/list` as the machine-readable discovery surface generated from the wrapper registry
- Return both `structuredContent` and a JSON text fallback for successful structured tool results
- Normalize tool/business errors such as `not_found` and `internal_server_error` into tool-level `isError: true` results
- Keep runtime result `_meta` omitted in this phase
- Defer runtime `outputSchema` validation; schemas remain declaration-level contracts for now

Outcome: Operately has a stable MCP runtime contract for tool descriptors, execution, and structured responses without introducing a heavier result framework.

Status: implemented.

### PR 3: Read-only MVP (Implemented)

- Turn the remaining read wrappers live on top of existing `OperatelyWeb.Api.*` handlers:
  - `get_me`
  - `list_people`
  - `get_person`
  - `list_spaces`
  - `get_space`
  - `list_projects`
  - `get_project`
  - `get_milestone`
  - `list_milestone_tasks`
  - `list_project_discussions`
  - `get_project_discussion`
  - `list_project_check_ins`
  - `get_project_check_in`
  - `list_goals`
  - `list_goal_discussions`
  - `list_goal_check_ins`
  - `list_tasks`
  - `get_task`
  - `list_space_discussions`
  - `list_task_statuses`
  - `get_space_discussion`
  - `list_docs_and_files`
  - `get_document`
  - `get_file`
  - `get_link`
  - `search`
- Narrow `list_tasks` so it accepts exactly one of `project_id` or `space_id`
- Add first-class milestone tools instead of making milestone access fetch-only
- Add structured discussion and check-in tools for project, goal, and space flows
- Add resource-hub browsing plus focused getters for documents, files, and links
- Add canonical URL generation for fetched resources without exposing `company_id` in tool inputs
- Add the first live `fetch` tool for these URL families:
  - project
  - goal
  - milestone
  - space
- Keep `fetch` inline-content based in this phase:
  - project, goal, milestone, and space fetches return markdown text content from existing API handlers
  - MCP resources and `resource_link` blocks remain deferred
- Add integration tests for company selection at auth time, cross-company resource rejection, and live tool execution through `tools/call`

Outcome: a reviewable, useful read-only MCP where the initial tool set executes end to end through existing Operately API handlers.

Status: implemented.

### PR 4: Safe write MCP tools (Implemented)

- Add exactly three live write tools on top of existing API handlers:
  - `create_comment`
  - `create_project_check_in`
  - `create_goal_check_in`
- Require `mcp:write` for those tools and expose write-oriented metadata in `tools/list`
- Keep MCP-authored content plain text / simple markdown and convert it into Operately rich content before calling the underlying handlers
- Keep notification fan-out off by default:
  - project check-ins use `post_as_draft: false`, `send_notifications_to_everyone: false`, `subscriber_ids: []`
  - goal check-ins use `due_date: nil`, `checklist: []`, `new_target_values: "[]"`, `post_as_draft: false`, `send_notifications_to_everyone: false`, `subscriber_ids: []`
- `create_comment` accepts:
  - `resource_id`
  - `parent_type`
- supported `parent_type` values:
  - `goal_check_in`
  - `project_check_in`
  - `goal_discussion`
  - `project_discussion`
  - `space_discussion`
  - `milestone`
  - `project_task`
  - `space_task`
  - `document`
  - `file`
  - `link`
- malformed IDs or unsupported `parent_type` values return invalid params
- well-formed but inaccessible or cross-company targets return tool-level not-found errors
- Keep write-tool failures confirmation-safe:
  - input-shaping failures stay protocol-level invalid params
  - permission and read-only-company rejections return tool-level `isError`
  - business not-found cases return tool-level `isError`
  - unexpected failures return safe generic tool-level errors
- Defer broader mutation surfaces:
  - task mutations
  - discussion creation and updates
  - close / reopen flows
  - document / file / link creation
  - destructive operations
  - long-running or polling flows

Outcome: a small, safe mutation surface that reuses the existing Operately APIs and remains easy for MCP clients to use.

Status: implemented.

### PR 5A: CIMD discovery and document parsing (Implemented)

- Add configuration for CIMD (fetch timeout, max response size, cache TTL)
- Advertise `client_id_metadata_document_supported: true` in authorization server metadata
- Add `Operately.Mcp.ClientMetadata.Document` to detect CIMD `client_id` URLs and parse/validate fetched JSON into `%ClientMetadata{}`
- Require `client_id`, `client_name`, and `redirect_uris` in metadata documents; require the document's `client_id` to exactly match its hosting URL
- Keep `token_endpoint_auth_method: "none"` as the only supported method in this phase; defer `private_key_jwt` / JWKS verification
- Add unit tests for document parsing and validation without outbound HTTP

Outcome: Operately can recognize and validate CIMD documents locally; clients can discover CIMD support via OAuth metadata.

Status: implemented.

### PR 5B: CIMD safe fetching and caching (Implemented)

- Add `Operately.Mcp.ClientMetadata.SafeUrl` for SSRF protections (block private/reserved IPs, restrict schemes and ports, require HTTPS)
- Add `Operately.Mcp.ClientMetadata.Fetcher` to fetch metadata documents over HTTPS with timeout, size limits, and no unsafe redirects
- Add `Operately.Mcp.ClientMetadata.Cache` with in-memory TTL caching; honor `Cache-Control: max-age` when present with a sane upper bound
- Add unit tests for SSRF blocking, fetch failures, oversized responses, and cache behavior

Outcome: Operately can safely retrieve and cache remote client metadata documents.

Status: implemented.

### PR 5C: CIMD authorization integration

- Extend `Operately.Mcp.ClientMetadata.resolve/1` resolution order: config allowlist → cached/fetched CIMD document → `invalid_client`
- Keep `validate_redirect_uri/2` as exact-match against registered `redirect_uris` for both allowlisted and CIMD clients
- Map fetch/parse failures to existing OAuth `invalid_client` responses without leaking internals; log details server-side
- Add OAuth and MCP integration tests for a CIMD client completing authorize → token → `tools/list`
- Add regression tests for redirect-uri mismatch, document `client_id` mismatch, and allowlist precedence over CIMD

Outcome: arbitrary standards-compliant MCP clients can complete OAuth and call tools without a server-side config entry.

Status: implemented.

### PR 5D: CIMD operational guardrails

- Add rate limiting for metadata fetches and OAuth endpoints (per IP and per `client_id` URL)
- Add structured logging and basic metrics for CIMD fetch outcomes, cache hit rate, and invalid-client rate
- Validate against at least one real URL-based MCP client before production rollout
- Keep known directory clients in `:mcp_oauth_clients` as overrides

Outcome: CIMD runs in production without opening an unbounded SSRF or abuse surface.

Defer unless needed:

- Dynamic Client Registration (RFC 7591)
- DB-persisted metadata cache
- confidential-client auth methods beyond `none`

### PR 6: Submission hardening

- Privacy policy / support URLs / branding assets
- Reviewer test accounts and test companies
- Rate limiting, audit logging, and operational visibility beyond CIMD-specific guardrails
- Other remote-MCP security hardening
- Final validation in ChatGPT, Claude, and at least one generic MCP client / IDE

Outcome: the MCP is ready for directory submission.

---

## Testing

Add tests at three layers:

- auth and grant tests
- company resolution tests
- wrapper registry tests
- tool-wrapper integration tests

Critical scenarios:

- one grant with one company that is auto-selected
- one grant with many companies where the user selects one during authorization
- authenticated-company tools never require company selectors
- tool descriptors expose the expected annotations, `securitySchemes`, and `outputSchema`
- wrapper discovery stays synchronized with the compiled wrapper set
- resource-specific wrapper forwards the authenticated conn into the intended existing API handler
- resource-specific tool rejects resources from another company through existing endpoint behavior
- structured outputs, text content, and `_meta` are separated correctly
- `fetch` returns canonical URLs plus inline markdown content for the supported resource families
- discovery output stays synchronized with the actual wrapper registry
- ambiguous auto-detection paths fail with structured disambiguation instead of guessing
- grant remains usable across normal refresh-token rotation
- revoked membership or revoked grant fails safely
- grant scope blocks write tools
- protocol-version and auth-discovery behavior match the MCP spec
- 401 responses advertise auth metadata correctly and tokens for other audiences are rejected
- MCP wrappers receive `current_account`, `current_company`, `current_person`, and auth metadata on `conn.assigns`
- existing API handlers called by wrappers behave consistently when invoked through MCP
- authorization server metadata advertises `client_id_metadata_document_supported`
- CIMD clients with valid metadata documents complete OAuth and MCP tool discovery without an allowlist entry
- allowlisted clients still resolve through config alongside CIMD resolution
- CIMD metadata fetch blocks SSRF targets and rejects redirect URIs not listed in the fetched document
- CIMD cache respects TTL and does not serve stale metadata past expiry

---

## Out of Scope

- API handler inputs that carry MCP company selection
- selecting or switching companies via MCP tool arguments
- exposing the full external API catalog as MCP tools
- making local `stdio` the primary integration path
- interactive app UI work for the first release

---

## Result

If implemented this way, Operately gets:

- one MCP surface suitable for both OpenAI and Anthropic distribution
- one new auth mode alongside the session and token flows
- one-company-per-connection UX with request-time company context
- MCP wrapper reuse of existing Operately API handlers and the shared modules those handlers already depend on
- standards-based open client onboarding through Client ID Metadata Documents, with a curated allowlist override for directory partners
