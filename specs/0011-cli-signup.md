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

The CLI creates a pending Google OAuth session, opens the browser, and polls the status endpoint until the user completes authentication in the browser. The browser callback (`AccountOauthController`) links the Google-authenticated account to the pending session. Once authenticated, the flow continues identically to the password flow.

**Backend endpoints used:** `cli_auth/start_google`, `cli_auth/status`, `cli_auth/create_token`

---

### Completed: Flow 4 - CLI Signup and Create Company (new user)

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

A new user signs up and creates a company. After email verification and account creation, the CLI attempts to create a company. On an **empty instance**, `create_company` succeeds and promotes the user to admin. On a **non-empty instance**, `create_company` returns `forbidden`; the CLI falls back to `companies/create` (requires backend support for bootstrap-token authorization or an alternative token mechanism). The flow then exchanges the bootstrap token for a permanent API token.

**Backend endpoints used:** `cli_auth/check_account`, `create_email_activation_code`, `cli_auth/signup`, `cli_auth/create_company`, `companies/create`, `cli_auth/status`, `cli_auth/create_token`

---

### Flow 5 - CLI Join via Invite

This flow mirrors the web "JoinPage" flow. The user has received a personal invitation token from a company admin (same token used by the web JoinPage at `/?token={invite_token}`).

```
cli: askChoice("What would you like to do?", [Create a new company, Join with invite])

cli: askBaseUrl()
cli: askProfile()

cli: askQuestion("Invite token:")

// Validate the invite token and show invitation details
cli: POST /invitations/get_invitation { token: inviteToken }
  -> { invite_link, member }
  // Displays: "You were invited by {author} to join {company}. Joining as {member_name} <{member_email}>"

cli: askQuestion("Email:")
cli: POST /cli_auth/check_account { email }
  -> { exists, has_password? }

// Determine available authentication methods
available_methods = []
if allow_login_with_email:
  available_methods.append("Password")
if allow_login_with_google:
  available_methods.append("Google")

cli: askChoice("How would you like to join?", available_methods)
```

**Branch A: User chooses "Password"**

```
// Branch A1: New account (exists == false)
if exists == false:
  cli: POST /create_email_activation_code { email }
  cli: askQuestion("Verification code sent to your email. Enter the code:")

  cli: askQuestion("Full name:")

  loop:
    cli: askPassword("Password (minimum 12 characters):")
    cli: askPassword("Confirm password:")

    if len(password) < 12:
      cli: display("Password must be at least 12 characters.")
      continue
    if password != confirm:
      cli: display("Passwords don't match. Please try again.")
      continue

    break

  cli: POST /cli_auth/signup { email, code, full_name, password }
    -> { status: "no_companies", companies: [], bootstrap_token }

  // Link the new account to the company using the invite token
  cli: POST /join_company { token: inviteToken, password, password_confirmation: password }
    -> { result: "Password successfully changed" }

  cli: GET /cli_auth/status { } with Bootstrap-Token
    -> { status: "authenticated", companies: [company] }

// Branch A2: Existing account with password (exists == true, has_password == true)
if exists == true and has_password == true:
  cli: askPassword("Password:")

  cli: POST /cli_auth/auth_password { email, password }
    -> { status: "authenticated", companies, bootstrap_token }

  // May not be linked to this company yet
  cli: POST /invitations/join_company_via_invite_link { token: inviteToken }
    -> { company }

  cli: GET /cli_auth/status { } with Bootstrap-Token
    -> { status: "authenticated", companies: [company] }

// Branch A3: Existing account without password (exists == true, has_password == false)
if exists == true and has_password == false:
  cli: display("Your account was created by invitation. Set a password to continue.")

  loop:
    cli: askPassword("New password (minimum 12 characters):")
    cli: askPassword("Confirm password:")

    if len(password) < 12:
      cli: display("Password must be at least 12 characters.")
      continue
    if password != confirm:
      cli: display("Passwords don't match. Please try again.")
      continue

    break

  cli: POST /join_company { token: inviteToken, password, password_confirmation: password }
    -> { result: "Password successfully changed" }

  cli: POST /cli_auth/auth_password { email, password }
    -> { status: "authenticated", companies, bootstrap_token }

// Common final step for all password branches
cli: askChoice("Select access mode:", [read-only, full-access])
cli: POST /cli_auth/create_token { company_id, read_only } with Bootstrap-Token
  -> { token, company }
cli: saveProfile(profile, token, baseUrl)
cli: display("Logged in as {userName}")
```

**Branch B: User chooses "Google"**

```
// Branch B: Google OAuth (works for both new and existing accounts)
cli: POST /cli_auth/start_google { }
  -> { status: "pending", bootstrap_token, login_url, poll_interval_ms }

cli: display("Please sign in via Google: {login_url}")
cli: openUrl(login_url) -> opens browser

// The browser handles Google auth + invite processing automatically.
// AccountOauthController processes the invite token after Google auth completes.

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

cli: askChoice("Select access mode:", [read-only, full-access])
cli: POST /cli_auth/create_token { company_id, read_only } with Bootstrap-Token
  -> { token, company }
cli: saveProfile(profile, token, baseUrl)
cli: display("Logged in as {userName}")
```

**How invite processing works with Google OAuth:**
The `CliLoginController` stores the `invite_token` in the browser session before redirecting to Google OAuth. When the `AccountOauthController` callback completes, it reads the invite token from the session and calls `InviteLinks.join_company_via_invite_link(account, invite_token)` to link the account to the company. The CLI polls `cli_auth/status` until the session becomes `authenticated` with the company.

**Backend endpoints used:**
- All branches: `invitations/get_invitation`, `cli_auth/check_account`, `cli_auth/create_token`
- Password branches: `create_email_activation_code`, `cli_auth/signup`, `cli_auth/auth_password`, `join_company`, `invitations/join_company_via_invite_link`, `cli_auth/status`
- Google branch: `cli_auth/start_google`, `cli_auth/status`

---

## Design Decisions

1. **Keep `CliAuthSession` for temporary bootstrap state.** All flows that need to create an API token go through `CliAuthSession`. Signup creates an authenticated session after account creation. Login creates an authenticated session after credential validation.
2. **Reuse email activation codes.** The CLI signup uses the same `EmailActivationCode` system as the web. No new email infrastructure is needed.
3. **Two company creation paths.** `cli_auth/create_company` is gated to empty instances (first company only). For non-empty instances, the CLI falls back to `create_company_on_non_empty`.
4. **Invite tokens are opaque to the CLI.** The CLI passes the invite token to the backend; the backend validates it and determines whether a company-wide or personal link is involved.
5. **Reuse existing invitation endpoints.** The CLI does not create new invitation-related mutations. It uses the existing `invitations/get_invitation`, `join_company`, and `invitations/join_company_via_invite_link` endpoints.
6. **Separation of account creation and company joining.** The `signup` endpoint only creates an account. Joining a company via invite is a separate step (via `join_company` for new accounts or `join_company_via_invite_link` for existing accounts). This mirrors the web flow.
7. **Google OAuth invite processing is browser-based.** The CLI starts a pending Google session and passes the invite token through the browser session. The browser handles authentication + invite processing. The CLI polls for completion.
8. **Password validation matches the web.** Minimum 12 characters, passwords must match. Invalid input loops with feedback until valid.
9. **Reorganize CLI auth code before adding signup.** This keeps the new code clean and provides a model for future auth flows.

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

Create a new account after email verification.

Inputs:
- `email` — string, required
- `code` — string, required (6-char activation code)
- `full_name` — string, required
- `password` — string, required (min 12 chars)

Outputs:
- `status` — `:cli_auth_status` (`:authenticated` or `:no_companies`)
- `companies` — list of `:company`
- `bootstrap_token` — string, present when `status == :authenticated`
- `message` — string, optional

Behavior:
1. Validate `allow_signup_with_email`.
2. Validate the activation code via `EmailActivationCode.get/2` and check expiry.
3. Call `Account.create/3` to create the account.
4. On an empty instance, response is `no_companies` (the CLI will then call `create_company`).
5. On a non-empty instance with no invite token, response is `no_companies` with a message.
6. On success, create an authenticated `CliAuthSession` and return the bootstrap token.

**Note:** This endpoint does NOT accept an `invite_token`. Invitation-based company joining is handled separately via `join_company` after account creation. This mirrors the web flow.

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

#### `POST /api/v2/cli_auth/create_company_on_non_empty`

Create a company on a non-empty instance. Requires an authenticated bootstrap session.

Inputs:
- `company_name` — string, required
- `title` — string, optional

Outputs:
- `company` — `:company`
- `person` — `:person`

Behavior:
1. Validate session is authenticated and not expired/consumed.
2. Call `CompanyAdding.run/2` with the account from the session.
3. Return the created company and person.

### Existing endpoints reused by CLI flows

#### `POST /api/v2/invitations/get_invitation`

Returns invitation details for a given token. Used by the CLI to show the user who invited them and which company they are joining.

Inputs:
- `token` — string, required

Outputs:
- `invite_link` — `:invite_link`
- `member` — `:person`

#### `POST /api/v2/join_company`

Sets a password for an invited user whose account was auto-created by an admin. Also links the account to the company and deactivates the personal invite link. Same endpoint used by the web JoinPage.

Inputs:
- `token` — string, required (personal invite token)
- `password` — string, required
- `password_confirmation` — string, required

Outputs:
- `result` — string

#### `POST /api/v2/invitations/join_company_via_invite_link`

Links an authenticated account to a company via a company-wide invite link.

Inputs:
- `token` — string, required

Outputs:
- `company` — `:company`, optional

**Note:** This endpoint requires an authenticated session (via `RequireAuthenticatedAccount`), so it is called after the user has authenticated via `auth_password`.

### Schema changes

No new tables. Existing tables used:
- `cli_auth_sessions` — temporary bootstrap sessions
- `email_activation_codes` — email verification
- `accounts`, `people`, `companies` — standard
- `invite_links` — invitation handling

### Authorization

1. `RequireAuthenticatedAccount` is skipped for `cli_auth/*` endpoints (except token creation). This allows unauthenticated users to check if an account exists, sign up, or authenticate.
2. `RequireCliAuthSession` validates the bootstrap token for `cli_auth/create_token`, `cli_auth/create_company`, and `cli_auth/create_company_on_non_empty`.
3. `invitations/join_company_via_invite_link` requires an authenticated account (not just a bootstrap token).
4. `join_company` (password first-time setup) is public — it validates the personal invite token internally.

### Code reorganization

Reorganize the CLI auth code before adding signup:

```
cli/src/auth/
  bootstrap.ts          <- extract bootstrap logic from commands.ts
  commands.ts           <- auth command dispatch (login, logout, status, signup)
  config.ts             <- profile config read/write
  index.ts              <- re-exports
  types.ts              <- shared auth types

  flows/
    login-google.ts     <- Google OAuth CLI flow
    login-password.ts   <- Password login flow
    login-token.ts      <- API token login flow
    signup-create-company.ts  <- Flow 4
    signup-join-invite.ts     <- Flow 5 (unified invite flow)

  shared/
    api.ts              <- API endpoint paths
    company-selection.ts
    errors.ts
    token-creation.ts   <- create token + save profile helper
```

### New command: `operately auth signup`

Add to the CLI parser and help text:

```
operately auth signup
```

The command entry point (`auth/commands.ts`) dispatches to the appropriate flow based on the user's choice (create company vs join via invite) and `check_account` response.

### Auth action enum update

Update `AUTH_ACTIONS` in `cli/src/auth/commands.ts` and help text generation in `cli/src/commands/help.ts` to include `signup` alongside `login`, `logout`, `status`, `whoami`.

---

## Implementation Steps

### PR 1: Reorganize CLI auth code (refactor only)

**Goal:** Extract bootstrap logic from `auth/commands.ts` into `auth/bootstrap.ts`.

**Changes:**
- Create `cli/src/auth/bootstrap.ts` with `executeAuthBootstrap`.
- Move `GoogleFlowState`, `runGoogleFlow`, `runPasswordFlow`, `runTokenFlow` into `auth/flows/`.
- Update `auth/commands.ts` to import from new locations.
- Add `CliConfig` and `RuntimeOptions` types to `auth/config.ts`.
- Update `auth/index.ts` re-exports.

**Tests:**
- Existing auth tests continue to pass.

---

### PR 2: Backend API for Flow 4 — `check_account`, `signup`, `create_company`

**Goal:** Enable new users to sign up and create the first company on an empty instance.

**Backend:**
- Add `OperatelyWeb.Api.CliAuth.CheckAccount` mutation.
- Add `OperatelyWeb.Api.CliAuth.Signup` mutation.
  - Uses `Operately.Operations.AccountSigningUp.run/5`.
  - Creates authenticated `CliAuthSession` after account creation.
  - Returns `no_companies` with bootstrap token on empty instance.
- Add `OperatelyWeb.Api.CliAuth.CreateCompany` mutation.
  - Validates bootstrap session.
  - Calls `CompanyAdding.run/2`.
  - Promotes to admin.
- Register in `OperatelyWeb.Api` and `OperatelyWeb.Api.Internal`.

**CLI:**
- No changes yet (CLI flow comes in PR 3).

**Tests:**
- Backend unit tests for `check_account`.
- Backend unit tests for `signup` (valid code, invalid code, expired code, email taken, signup disabled).
- Backend unit tests for `create_company` (valid, invalid session, expired session).
- End-to-end backend test: signup + create company on empty instance.

---

### PR 3: CLI Flow 4 — Signup and Create Company

**Goal:** Wire the CLI for signup + company creation.

- Add `auth/flows/signup-create-company.ts`.
- Update `auth/commands.ts` to route to this flow for `auth signup`.
- Update `auth/shared/api.ts` with new endpoint paths.
- Update `core/parser-types.ts` to include `signup` in `AuthAction`.
- Update `commands/help.ts` with `signup` help.

**Tests:**
- Unit tests for `signup-create-company.ts`.
- Integration test: simulate full signup + create company flow.

---

### PR 4: Backend + CLI — Company Creation on Non-Empty Instance

**Goal:** Allow newly signed-up users to create a company even when the instance already has one or more companies.

**Backend:**
- Add `OperatelyWeb.Api.CliAuth.CreateCompanyOnNonEmpty` mutation.
  - Accepts authenticated `CliAuthSession` and calls `Operately.Operations.CompanyAdding.run/2`.
- Register in `OperatelyWeb.Api` and `OperatelyWeb.Api.Internal`.

**CLI:**
- Update `auth/flows/signup-create-company.ts`:
  - After `signup` returns `no_companies`, call `cli_auth/create_company` as before.
  - If `create_company` returns 403 (companies already exist), call the new `create_company_on_non_empty` endpoint instead.

**Tests:**
- Backend unit test: creating a company on a non-empty instance with valid bootstrap token.
- Backend unit test: rejecting creation with invalid/expired bootstrap token.
- CLI unit test: simulating the 403 fallback path.

---

### PR 5: CLI Flow 5 — Join via Invite

**Goal:** Wire the CLI for a user to join a company via invitation, supporting both password and Google OAuth paths.

**Backend:**
No new backend endpoints needed. Reuses existing:
- `invitations/get_invitation` — validate invite token
- `cli_auth/check_account` — check account state
- `create_email_activation_code` — email verification
- `cli_auth/signup` — create new account
- `join_company` — set password + link account (personal invite)
- `cli_auth/auth_password` — authenticate existing account
- `invitations/join_company_via_invite_link` — link existing account to company (company-wide invite)
- `cli_auth/start_google` — initiate Google OAuth
- `cli_auth/status` — poll for Google auth completion
- `cli_auth/create_token` — exchange bootstrap for API token

**CLI:**
- Add `auth/flows/signup-join-invite.ts`.
- Update `auth/commands.ts` to route to this flow when "Join with invite" is selected.
- The flow:
  1. Ask for invite token.
  2. Call `invitations/get_invitation` to validate and show invitation details.
  3. Ask for email, call `check_account`.
  4. Show available auth methods (password, Google) based on instance config.
  5. **Password path:**
     - New account: email verification → full name → password (loop with validation) → `signup` → `join_company`
     - Existing + password: `auth_password` → `join_company_via_invite_link`
     - Existing + no password: password prompt (loop) → `join_company` → `auth_password`
  6. **Google path:**
     - Call `start_google` → open browser → poll `status` until authenticated.
     - The browser handles both Google auth and invite processing.
  7. Exchange bootstrap token for permanent API token.

**Tests:**
- Unit tests for `signup-join-invite.ts` covering all branches.
- Integration tests for password path (new account, existing with password, existing without password).
- Integration test for Google OAuth path.

---

### PR 6: End-to-end tests and polish

**Goal:** Verify all flows work together.

- Integration tests covering all signup paths (create company, join via invite with password, join via invite with Google).
- Error handling edge cases (network errors, server errors, invalid inputs, expired sessions).
- Documentation updates.

---

## Rollout Considerations

- This feature is additive; existing `auth login` flows are unchanged.
- Self-hosted instances with `allow_signup_with_email: true` will support this immediately.
- SaaS instances may need to disable `auth signup` if they want browser-only onboarding.
- The CLI signup experience should match the web signup experience as closely as possible to avoid confusion.
