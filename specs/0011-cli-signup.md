# CLI Signup and Company Onboarding

## Summary

Extend the Operately CLI so users can sign up and get started without opening a browser. This covers two web-equivalent paths:

1. **Sign up and create a company** - for the first user on a self-hosted or fresh instance.
2. **Sign up and join a company via invitation** - for users invited to an existing company, whether or not they already have an account.

The existing CLI login flow (password, Google OAuth, token) remains unchanged. A new `operately auth signup` command is added alongside `operately auth login`.

---

## Flows

### Completed: Flow 1 - CLI Login with API Token

```
cli: askQuestion("API token:")
cli: callEndpoint(getMe, token) -> validates token
cli: saveProfile(profile, token, baseUrl)
cli: display("Logged in as {userName}")
```

User provides an existing API token directly. The CLI validates it by calling `people/get_me` and stores it in the profile config.

**Backend endpoints used:** `people/get_me` (external API)

---

### Completed: Flow 2 - CLI Login with Password

```
cli: askQuestion("Email:")
cli: askPassword("Password:")
cli: POST /cli_auth/auth_password { email, password }
  -> { status, companies[], bootstrap_token }

if status == "no_companies":
  error("No companies found. Please join or create a company first.")
  return

cli: selectCompany(companies)
cli: askChoice("Select access mode:", [read-only, full-access])
cli: POST /cli_auth/create_token { company_id, read_only } with Bootstrap-Token
  -> { token, company }
cli: saveProfile(profile, token, baseUrl)
cli: callEndpoint(getMe, token) -> display user name
cli: display("Logged in as {userName}")
```

User authenticates with existing email and password. The backend creates an authenticated `CliAuthSession`, returns a bootstrap token and eligible companies. The CLI selects a company, exchanges the bootstrap token for a permanent API token, and saves the profile.

**Backend endpoints used:** `cli_auth/auth_password`, `cli_auth/create_token`

---

### Completed: Flow 3 - CLI Login with Google OAuth

```
cli: POST /cli_auth/start_google { }
  -> { status: "pending", bootstrap_token, login_url, poll_interval_ms }

cli: display("Please sign in via Google: {login_url}")
cli: openUrl(login_url) -> opens browser

loop up to 120 attempts:
  sleep(poll_interval_ms)
  cli: GET /cli_auth/status { } with Bootstrap-Token
    -> { status, companies[], message? }

  if status == "authenticated":
    break
  if status == "expired":
    error("Session expired")
    return
  if status == "no_companies":
    error("No companies found")
    return

cli: selectCompany(companies)
cli: askChoice("Select access mode:", [read-only, full-access])
cli: POST /cli_auth/create_token { company_id, read_only } with Bootstrap-Token
  -> { token, company }
cli: saveProfile(profile, token, baseUrl)
cli: display("Logged in as {userName}")
```

The CLI creates a pending Google OAuth session, opens the browser, and polls the status endpoint until the user completes authentication in the browser. The browser callback (`CliLoginController`) links the Google-authenticated account to the pending session. Once authenticated, the flow continues identically to the password flow.

**Backend endpoints used:** `cli_auth/start_google`, `cli_auth/status`, `cli_auth/create_token`

---

### Flow 4 - CLI Signup and Create Company (new user)

```
cli: askChoice("What would you like to do?", [Create a new company, Join with invite])

cli: askQuestion("Email:")
cli: askBaseUrl()
cli: askProfile()

cli: POST /cli_auth/check_account { email }
  -> { exists: false }  // must not exist

cli: POST /create_email_activation_code { email }
cli: askQuestion("Verification code sent to your email. Enter the code:")

cli: askQuestion("Full name:")
cli: askPassword("Password:")

cli: POST /cli_auth/signup { email, code, full_name, password }
  -> { status: "no_companies", companies: [], bootstrap_token, message? }

cli: askQuestion("Company name:")
cli: POST /cli_auth/create_company { company_name } with Bootstrap-Token

// Empty instance
  -> { company, person }
cli: GET /cli_auth/status { } with Bootstrap-Token
  -> { status: "authenticated", companies: [company] }

// Non-empty instance (future PR)
  -> { error: :forbidden }
cli: POST /companies/create { company_name, title } with Bootstrap-Token
  -> { company }

cli: askChoice("Select access mode:", [read-only, full-access])
cli: POST /cli_auth/create_token { company_id, read_only } with Bootstrap-Token
  -> { token, company }
cli: saveProfile(profile, token, baseUrl)
cli: display("Logged in as {full_name}")
```

A new user signs up and creates a company. After email verification and account creation, the CLI attempts to create a company. On an **empty instance**, `create_company` succeeds and promotes the user to admin. On a **non-empty instance**, `create_company` returns `forbidden`; the CLI falls back to `companies/create` (requires backend support for bootstrap-token access or an alternative token mechanism). The flow then exchanges the bootstrap token for a permanent API token.

**Backend endpoints used:** `cli_auth/check_account`, `create_email_activation_code`, `cli_auth/signup`, `cli_auth/create_company`, `companies/create`, `cli_auth/status`, `cli_auth/create_token`

---

### Flow 5 - CLI Signup and Join via Invite (new user, no existing account)

```
cli: askChoice("What would you like to do?", [Create a new company, Join with invite])

cli: askBaseUrl()
cli: askProfile()

cli: askQuestion("Invite token:")
cli: askQuestion("Email:")

cli: POST /cli_auth/check_account { email }
  -> { exists: false }

cli: POST /create_email_activation_code { email }
cli: askQuestion("Verification code:")

cli: askQuestion("Full name:")
cli: askPassword("Password:")

cli: POST /cli_auth/signup { email, code, full_name, password, invite_token }
  -> { status: "authenticated", companies: [company], bootstrap_token }

cli: askChoice("Select access mode:", [read-only, full-access])
cli: POST /cli_auth/create_token { company_id, read_only } with Bootstrap-Token
  -> { token, company }
cli: saveProfile(profile, token, baseUrl)
cli: display("Logged in as {full_name}")
```

A new user joins a company via an invite token. The invite token is passed to the signup endpoint, which calls `CompanyJoiningViaInviteLink` to create/link the person, then returns the bootstrap token with the joined company.

**Backend endpoints used:** `cli_auth/check_account`, `create_email_activation_code`, `cli_auth/signup`, `cli_auth/create_token`

---

### Flow 6 - CLI Signup and Join via Invite (existing account with password)

```
cli: askChoice("What would you like to do?", [Create a new company, Join with invite])

cli: askBaseUrl()
cli: askProfile()

cli: askQuestion("Invite token:")
cli: askQuestion("Email:")

cli: POST /cli_auth/check_account { email }
  -> { exists: true, has_password: true }

cli: askPassword("Password:")

cli: POST /cli_auth/join_with_invite { email, password, invite_token }
  -> { status: "authenticated", companies: [company], bootstrap_token }

cli: askChoice("Select access mode:", [read-only, full-access])
cli: POST /cli_auth/create_token { company_id, read_only } with Bootstrap-Token
  -> { token, company }
cli: saveProfile(profile, token, baseUrl)
cli: display("Logged in as {userName}")
```

An existing user with a password joins a company via invite. The backend authenticates the account, processes the invite, and returns a bootstrap token.

**Backend endpoints used:** `cli_auth/check_account`, `cli_auth/join_with_invite`, `cli_auth/create_token`

---

### Flow 7 - CLI Signup and Join via Invite (existing account, no password yet)

```
cli: askChoice("What would you like to do?", [Create a new company, Join with invite])

cli: askBaseUrl()
cli: askProfile()

cli: askQuestion("Invite token:")
cli: askQuestion("Email:")

cli: POST /cli_auth/check_account { email }
  -> { exists: true, has_password: false }

cli: display("Your account was created by invitation. Set a password to continue.")
cli: askPassword("New password:")
cli: askPassword("Confirm password:")

if password != confirm:
  error("Passwords don't match")
  return

cli: POST /join_company { token: inviteToken, password, password_confirmation }
  -> { result: "Password successfully changed" }

cli: POST /cli_auth/join_with_invite { email, password, invite_token }
  -> { status: "authenticated", companies: [company], bootstrap_token }

cli: askChoice("Select access mode:", [read-only, full-access])
cli: POST /cli_auth/create_token { company_id, read_only } with Bootstrap-Token
  -> { token, company }
cli: saveProfile(profile, token, baseUrl)
cli: display("Logged in as {userName}")
```

An invited user whose account was auto-created by an admin but who never set a password. The CLI first sets the password via the existing `join_company` endpoint (same as the web invitation acceptance flow), then authenticates and joins via the invite.

**Backend endpoints used:** `cli_auth/check_account`, `join_company`, `cli_auth/join_with_invite`, `cli_auth/create_token`

---

## Design Decisions

1. **Keep `CliAuthSession` for temporary bootstrap state.** All flows that need to create an API token go through `CliAuthSession`. Signup creates an authenticated session after account creation. Login creates an authenticated session after credential validation.
2. **Reuse email activation codes.** The CLI signup uses the same `EmailActivationCode` system as the web. No new email infrastructure is needed.
3. **Two company creation paths.** `cli_auth/create_company` is gated to empty instances (first company only). For non-empty instances, the CLI will use the existing `companies/create` endpoint. Both paths require an authenticated user.
4. **Invite tokens are opaque to the CLI.** The CLI passes the invite token to the backend; the backend validates it and determines whether a company-wide or personal link is involved.
5. **Reorganize CLI auth code before adding signup.** This keeps the new code clean and provides a model for future auth flows.

---

## Backend Changes

### New API endpoints (internal namespace)

All under `/api/v2/cli_auth/` and wired into `OperatelyWeb.Api.CliAuth`.

#### `POST /api/v2/cli_auth/check_account`

Check whether an email already has an account on this instance.

Inputs:
- `email` — string, required

Outputs:
- `exists` — boolean
- `has_password` — boolean (false if account exists but was auto-created by an admin invitation and hasn't set a password yet)

#### `POST /api/v2/cli_auth/signup`

Create a new account after email verification. Optionally accepts an invite token to join a company immediately.

Inputs:
- `email` — string, required
- `code` — string, required (6-char activation code)
- `full_name` — string, required
- `password` — string, required (min 12 chars)
- `invite_token` — string, optional

Outputs:
- `status` — `:cli_auth_status` (`:authenticated` or `:no_companies`)
- `companies` — list of `:company`
- `bootstrap_token` — string, present when `status == :authenticated`
- `message` — string, optional

Behavior:
1. Validate `allow_signup_with_email`.
2. Validate the activation code via `EmailActivationCode.get/2` and check expiry.
3. Call `Account.create/3` to create the account.
4. If `invite_token` is present, call `CompanyJoiningViaInviteLink.run/2`. On success, eligible companies are derived from the joined company. On failure, the account is still created but the response includes an error message and empty companies list.
5. If no `invite_token` and this is the first company on the instance, the response is `no_companies` (the CLI will then call `create_company`).
6. If no `invite_token` and companies already exist, the response is `no_companies` with a message.
7. On success, create an authenticated `CliAuthSession` and return the bootstrap token.

#### `POST /api/v2/cli_auth/create_company`

Create the first company on an empty instance. Only callable when the instance has zero companies. Requires an authenticated bootstrap session.

Inputs:
- `company_name` — string, required
- `title` — string, optional

Outputs:
- `company` — `:company`
- `person` — `:person`

Behavior:
1. Validate session is authenticated and not expired/consumed.
2. Validate `Operately.Companies.count_companies() == 0`.
3. Call `CompanyAdding.run/2` with the account from the session.
4. Call `Account.promote_to_admin/1`.
5. Re-fetch eligible companies for the account (should now be exactly one).

**Note:** For creating a company on a non-empty instance, the existing `POST /api/v2/companies/create` endpoint is used instead. This requires a future PR to support bootstrap-token authorization or an alternative authentication mechanism for newly signed-up users before they have a permanent API token.

#### `POST /api/v2/cli_auth/join_with_invite`

For existing accounts to join a company via an invite token. Returns a bootstrap token.

Inputs:
- `email` — string, required
- `password` — string, required
- `invite_token` — string, required

Outputs:
- `status` — `:cli_auth_status`
- `companies` — list of `:company`
- `bootstrap_token` — string, optional
- `message` — string, optional

Behavior:
1. Authenticate the account via `get_account_by_email_and_password/2`.
2. Call `CompanyJoiningViaInviteLink.run/2` with the account and invite token.
3. On success, create an authenticated `CliAuthSession` and return the bootstrap token + companies.
4. On invite failure, return `no_companies` with an error message.

### Schema changes

No new tables. Existing tables used:
- `cli_auth_sessions` — temporary bootstrap sessions
- `email_activation_codes` — email verification
- `accounts`, `people`, `companies` — standard
- `invite_links` — invitation handling

### Authorization

- `check_account` — public (no auth)
- `signup` — public, gated by `allow_signup_with_email`
- `create_company` — requires authenticated `CliAuthSession`, gated by zero companies
- `join_with_invite` — public (uses password authentication)

---

## CLI Changes

### Code reorganization

Before adding signup, split the monolithic auth files into a domain-based structure:

```
cli/src/
  index.ts                          # Entry point
  version.ts
  auth/
    index.ts                        # Re-exports executeAuthCommand
    commands.ts                     # Auth command router (login, signup, status, whoami, logout)
    config.ts                       # Config read/write/profile management (moved from core/config.ts)
    types.ts                        # AuthAction, SignupPath, etc.
    flows/
      login-password.ts             # Password login flow (extracted from auth-bootstrap.ts)
      login-google.ts               # Google OAuth login flow (extracted from auth-bootstrap.ts)
      login-token.ts                # Token login flow (extracted from auth-bootstrap.ts)
      signup-create-company.ts      # New: Flow 4
      signup-join-invite-new.ts     # New: Flow 5
      signup-join-invite-existing.ts # New: Flow 6
      signup-join-invite-passwordless.ts # New: Flow 7
    shared/
      api.ts                        # Internal API paths + helpers
      company-selection.ts          # Interactive company picker
      token-creation.ts             # Bootstrap -> API token + profile save
      errors.ts                     # Error handling helpers
  commands/
    executor.ts                     # Endpoint command execution
    help-handler.ts                 # Help routing
    help.ts                         # Help text printing
    registry.ts                     # Endpoint registry
  core/
    command-routing.ts              # Command parsing (non-auth)
    config.ts                       # Re-export from auth/config.ts
    flags.ts                        # Flag parsing
    http.ts                         # External API HTTP client
    input-coercion.ts               # Type coercion
    internal-api.ts                 # Internal API HTTP client
    markdown-to-tiptap.ts           # Markdown conversion
    output.ts                       # Console output helpers
    parser-types.ts                 # ParsedCommand types
    parser.ts                       # Main command parser
    paths.ts                        # API path constants
    prompts.ts                      # Interactive prompts
  types/
    catalog.ts
```

`commands/auth.ts` and `commands/auth-bootstrap.ts` are deleted. `commands/help.ts` is updated to include `signup` in auth help.

**Migration rules:**
- Do not change behavior of existing flows during reorganization.
- Move `config.ts` from `core/` to `auth/` because it is auth-profile-specific, but re-export from `core/` for backward compatibility with `executor.ts`.
- Keep `core/prompts.ts`, `core/http.ts`, `core/internal-api.ts` as-is; `auth/shared/` re-exports and wraps where needed.
- The `BootstrapDeps` interface is split: each flow file exports only the deps it needs, using smaller, focused interfaces.

### New command: `operately auth signup`

```
operately auth signup [--base-url <url>] [--profile <name>]
```

Interactive flow:

1. **Select path:**
   ```
   What would you like to do?
   1. Create a new company
   2. Join a company with an invite
   ```

2. **Collect base URL and profile** (same as login flow).

3. **Path A: Create a new company** (Flow 4)
   - Enter email.
   - Call `check_account`. If `exists == true`, show error: "An account already exists for this email. Use `operately auth login` instead."
   - Call `create_email_activation_code`.
   - Prompt: "A verification code was sent to your email. Enter the code:"
   - Enter full name.
   - Enter password (hidden).
   - Call `signup` (with code, email, full_name, password).
   - If `status == no_companies` (expected for empty instance):
     - Enter company name.
     - Call `create_company` (with bootstrap token).
   - Select access mode (read-only / full access).
   - Call `create_token`.
   - Save profile. Done.

4. **Path B: Join a company with an invite**
   - Enter invite token.
   - Enter email.
   - Call `check_account`.
   - If `exists == false` (Flow 5 - new user):
     - Call `create_email_activation_code`.
     - Prompt for code.
     - Enter full name.
     - Enter password.
     - Call `signup` (with invite_token).
   - If `exists == true` and `has_password == true` (Flow 6 - existing user with password):
     - Enter password.
     - Call `join_with_invite`.
   - If `exists == true` and `has_password == false` (Flow 7 - invited user who hasn't set password):
     - Explain: "Your account was created by an invitation but you haven't set a password yet."
     - Enter new password (hidden).
     - Enter password confirmation (hidden).
     - Call `join_company` to set the first password.
     - Then call `join_with_invite`.
   - Select company (if multiple) and access mode.
   - Call `create_token`.
   - Save profile. Done.

### Auth action enum update

```typescript
export const AUTH_ACTIONS = ["login", "signup", "status", "whoami", "logout"] as const;
```

Update `command-routing.ts`, `parser-types.ts`, `help.ts`, and `help-handler.ts` to recognize `signup`.

---

## Implementation Steps

Each step is a shippable PR. Flows are implemented in order of simplicity, building on code from previous PRs.

### Completed: PR 1: Reorganize CLI auth code (refactor only)

**Goal:** Split monolithic auth files into the `auth/` directory structure without changing behavior.

- Create `cli/src/auth/` directory with subdirectories `flows/` and `shared/`.
- Move config logic from `core/config.ts` to `auth/config.ts`; re-export from `core/config.ts` for backward compatibility.
- Extract password login flow to `auth/flows/login-password.ts`.
- Extract Google login flow to `auth/flows/login-google.ts`.
- Extract token login flow to `auth/flows/login-token.ts`.
- Extract shared helpers (company selection, token creation, error handling) to `auth/shared/`.
- Create `auth/commands.ts` with the `executeAuthCommand` router.
- Update `index.ts` to import from `auth/commands.ts`.
- Update `commands/help.ts` and `commands/help-handler.ts` for new imports.
- Delete `commands/auth.ts` and `commands/auth-bootstrap.ts`.
- Ensure all existing tests pass without modification.

**Tests:**
- Existing CLI unit tests must pass.
- Add a unit test for the new router in `auth/commands.ts` ensuring all auth actions dispatch correctly.

---

### Completed: PR 2: Backend API for Flow 4 — `check_account`, `signup`, `create_company`

**Goal:** Enable new users to sign up and create the first company on an empty instance.

- Add `OperatelyWeb.Api.CliAuth.CheckAccount` mutation.
- Add `OperatelyWeb.Api.CliAuth.Signup` mutation.
- Add `OperatelyWeb.Api.CliAuth.CreateCompany` mutation.
- Register all three in `OperatelyWeb.Api` under `namespace(:cli_auth)`.
- Register as public in `OperatelyWeb.Api.Internal`.
- `create_company` requires an authenticated `CliAuthSession` (same plug as `create_token`).
- Gate `create_company` on `Operately.Companies.count_companies() == 0`.

**Tests:**
- Unit tests for `CheckAccount` (exists, not exists, has_password variations).
- Unit tests for `Signup` (valid code, invalid code, expired code, with invite, without invite, duplicate email).
- Unit tests for `CreateCompany` (success on empty instance, forbidden when companies exist, unauthorized with invalid session).
- Feature test: signup -> create_company end-to-end.

---

### Completed: PR 3: CLI Flow 4 — Signup and Create Company

**Goal:** Wire the CLI to the new backend APIs for the "create company" path.

- Add `auth/flows/signup-create-company.ts`.
- Update `auth/commands.ts` to handle `signup` action and route to the create-company flow when selected.
- Update help text for `auth signup`.

**Tests:**
- Unit tests for `signup-create-company.ts` flow with mocked API calls.
- Integration test: simulate full `operately auth signup` -> create company flow.

**Note:** PR 3 only implements the empty-instance path (`cli_auth/create_company`). The non-empty instance fallback (`companies/create`) is deferred to a future PR.

---

### Completed: PR 4: Backend + CLI — Company Creation on Non-Empty Instance

**Goal:** Allow newly signed-up users to create a company even when the instance already has one or more companies.

**Backend:**
- Add `OperatelyWeb.Api.CliAuth.CreateCompanyOnNonEmpty` mutation (or extend `RequireCliAuthSession` to cover `companies/create`).
- The endpoint must accept an authenticated `CliAuthSession` (bootstrap token) and call `Operately.Operations.CompanyAdding.run/2`.
- Register in `OperatelyWeb.Api` and `OperatelyWeb.Api.Internal`.

**CLI:**
- Update `auth/flows/signup-create-company.ts`:
  - After `signup` returns `no_companies`, call `cli_auth/create_company` as before.
  - If `create_company` returns 403 (companies already exist), call the new non-empty instance endpoint instead of showing an error.
  - Skip the `cli_auth/status` poll for the non-empty path (the creation response includes the company).

**Tests:**
- Backend unit test: creating a company on a non-empty instance with a valid bootstrap token.
- Backend unit test: rejecting creation with an invalid/expired bootstrap token.
- CLI unit test: simulating the 403 fallback path.

---

### PR 5: Backend API for Flow 5 — `join_with_invite`

**Goal:** Enable new users to sign up and join a company via invite token.

- Add `OperatelyWeb.Api.CliAuth.JoinWithInvite` mutation.
- Register in API and Internal modules.
- Update `Signup` to accept `invite_token` and call `CompanyJoiningViaInviteLink` when present.

**Tests:**
- Unit tests for `JoinWithInvite` (valid invite + existing account, invalid invite, wrong password).
- Unit tests for `Signup` with invite_token (success, invalid token, expired token).
- Feature test: signup with invite token end-to-end.

---

### PR 6: CLI Flow 5 — Signup and Join via Invite (new user)

**Goal:** Wire the CLI for invite-based signup with a new account.

- Add `auth/flows/signup-join-invite-new.ts`.
- Update `auth/commands.ts` to route to this flow when "Join with invite" is selected and `check_account` returns `exists: false`.

**Tests:**
- Unit tests for `signup-join-invite-new.ts`.
- Integration test: simulate full invite-based signup with new account.

---

### PR 7: CLI Flow 6 — Join via Invite (existing account with password)

**Goal:** Wire the CLI for existing users with passwords to join via invite.

- Add `auth/flows/signup-join-invite-existing.ts`.
- Update `auth/commands.ts` to route to this flow when "Join with invite" is selected and `check_account` returns `exists: true, has_password: true`.

**Tests:**
- Unit tests for `signup-join-invite-existing.ts`.
- Integration test: existing account joins via invite.

---

### PR 8: CLI Flow 7 — Join via Invite (existing account, no password yet)

**Goal:** Wire the CLI for invited users who need to set a password first.

- Add `auth/flows/signup-join-invite-passwordless.ts`.
- This flow calls the existing `join_company` endpoint first (to set the password), then `join_with_invite`.
- Update `auth/commands.ts` to route to this flow when `check_account` returns `exists: true, has_password: false`.

**Tests:**
- Unit tests for `signup-join-invite-passwordless.ts`.
- Integration test: passwordless invited user joins via CLI.

---

### PR 9: End-to-end tests and polish

**Goal:** Ensure all signup flows work against a real backend.

- Add feature tests for:
  - CLI signup + create company on empty instance (Flow 4).
  - CLI signup + create company on non-empty instance (Flow 4 extended).
  - CLI signup + join via company-wide invite link (Flow 5).
  - CLI signup + join via personal invite link (Flow 5).
  - CLI signup with existing account + join via invite (Flow 6).
  - CLI signup with passwordless account + join via invite (Flow 7).
- Verify help text is accurate.
- Verify error messages are user-friendly.
- Verify no regression in existing `auth login` flows (Flows 1-3).

---

## Rollout Considerations

- **Self-hosted instances:** This is the primary target. Fresh self-hosted installs can now be fully onboarded via CLI.
- **Operately Cloud:** Signup is still available via web. The CLI signup respects the same `allow_signup_with_email` flag.
- **Email delivery required:** Signup requires email delivery to be configured (same as web). If not configured, the CLI shows the same error message as the web.
- **Invite links:** Company admins generate invite links in the web UI. Those links/tokens can be shared with users to join via CLI.
- **Security:** Activation codes expire in 5 minutes. Bootstrap tokens expire in 10 minutes. Both use the existing secure token generation.
