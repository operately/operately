# Guest Accounts & Invitations

## Overview

This spec defines a multi‑step implementation plan to add guest accounts (external collaborators) and an invitation flow that lets company admins invite them, assign scoped access to specific Spaces/Goals/Projects, and let guests sign up or accept an invite. The work is intentionally split into small PRs so each change is shippable and safe.

## Goals

- Allow admins to invite **guest** people who are linked to a company but are not full members.
- Guests default to **no access bindings** and **no company space membership**.
- Admins can grant access to specific Spaces, Goals, and Projects at invite time.
- Guests can later be added to resources by Champions/Reviewers/Contributors/Space members (same assignment UI as for existing people).
- Add a **new access level** between comment and edit that enables creating child resources without letting guests edit the parent resource’s definition.
- Ship with tests for API endpoints, emails, feed events, and UI pages.

## Current state (facts from the codebase)

- Adding a company member happens through `AddCompanyMember` and `CompanyMemberAdding`:
  - `AddCompanyMember` sets `skip_invitation` using `People.account_used?/1`, which checks `accounts.first_login_at` to decide whether an invite link should be created.
  - `CompanyMemberAdding` creates or reuses an `Account`, inserts a `Person`, adds them to the company access group, and adds them to the company space/general space. It always inserts an invite link unless `skip_invitation` is `true`.
- The current person type enum is `[:human, :ai]`.
- Several associations and queries filter `Person.type == :human` (e.g., `Groups.Member`, `Projects.Contributor`, and Space queries), which would exclude guests from pickers and member lists.

## Target state

- A new `Person` type (e.g., `:guest`) distinguishes external collaborators from full members.
- Guests are created as people linked to the company and to an account (existing or newly created).
- Guests **are not** auto‑added to:
  - The company access group.
  - The company space (general space membership).
  - Any access contexts by default.
- Invite links are created **only** when the email has no active account (`People.account_used?/1 == false`).
- Access can be granted to resources at invite time:
  - **Goals:** Champion or Reviewer.
  - **Projects:** Champion, Reviewer, or Contributor.
  - **Spaces:** Space member.
- Guests can create milestones/tasks/check‑ins/discussions under a resource but cannot edit the resource definition itself. This requires a new access level between comment and edit.

## Implementation plan (PR‑sized steps)

### PR 1 — Goal access management UI + bindings

**Why:** Goals currently lack a dedicated access management page, so guest access cannot be added/edited/removed after invitation. This is a prerequisite for a usable guest flow.

**Changes**
- Add a Goal access management page similar to `ProjectContributorsPage`:
  - View all people with access to a goal.
  - Add/remove people from the goal.
  - Update access levels for existing people.
- Goals do **not** use contributors. Instead, create direct access bindings between a person’s access group and the goal’s access context.
- Reuse existing access‑level editing affordances from the project contributors UI where possible.

**Tests**
- UI tests for the new goal access page (listing, adding, editing, removing).
- API tests for the access management endpoints that back this page.
- Permission tests confirming goal access can be managed by authorized users only.

> If this is too large for a single PR, split into:
> 1) Goal access management API endpoints (plus tests).
> 2) Goal access management UI page (plus tests).

### PR 2 — Access level foundation: “contribute”

**Why:** The access model must support the guest’s ability to create child resources without granting edit permissions for the parent resource.

**Changes**
- Add a new access level constant (e.g., `contribute_access`) between `comment` and `edit` in `Operately.Access.Binding`.
- Update valid access levels and conversion helpers.
- Update resource permission modules (Goals, Projects, Spaces as needed) to allow creation actions at `contribute_access`, while keeping parent edits at `edit_access`.

**Tests**
- Add unit tests around the new access level and updated permission checks.

### PR 3 — Person type: guest

**Changes**
- Extend `Operately.People.Person` enum to include `:guest`.
- Update association filters and queries that currently hard‑code `type: :human` so guests can appear in pickers and resource member lists where appropriate (e.g., project contributors, space members).
- Keep `list_agents/1` and AI‑specific queries scoped to `:ai` only.

**Notes**
- This PR should not change behavior for existing human members.
- No data migration needed unless existing data must be reclassified.

**Tests**
- Update or add tests for list queries to ensure guest people appear where expected and are excluded where they should not (e.g., AI‑only lists).

### PR 4 — Guest invitation operation + API

**Changes**
- Add a dedicated operation (e.g., `GuestInviting`) modeled after `CompanyMemberAdding`, but:
  - It **does not** add the person to the company access group or company space.
  - It creates a `Person` with `type: :guest`.
  - It creates a personal invite link **only** when `People.account_used?/1` returns `false`.
- Add a new mutation (e.g., `inviteGuest`) to call this operation.
- Define a guest invitation activity event (content, notification, type, serializer, feed handler) for auditing and notifications.
- Add mailer(s) for guest invites:
  - If no account used: include invite link.
  - If account already used: send informational invite without link.

**Tests**
- Mutation tests for both branches (account used vs not used).
- Activity + notification tests.
- Email tests (content and presence/absence of invite link).

### PR 5 — Guest invite UI (admin flow)

**Changes**
- Create a new admin page or extend `CompanyAdminAddPeoplePage` to support guest invites.
- Add resource selection UI for Goals/Projects/Spaces with role selection (Champion/Reviewer/Contributor/Member as appropriate).
- Provide clear invite outcome messaging:
  - When invite link is generated, show the link and explain TTL.
  - When no invite link is generated, show confirmation and that the user has been invited.

**Tests**
- UI tests for the new page/flow (component or integration tests under `app/assets/js`).
- Mocked API tests for both invite outcomes.

### PR 6 — Resource access assignment on invite

**Changes**
- Use existing operations to attach the invited guest to resources based on the selection:
  - Goal champion/reviewer.
  - Project champion/reviewer/contributor.
  - Space member.
- Ensure access bindings created for guest assignments use the new `contribute_access` level where required.
- Ensure these assignments do not inadvertently add guest to the general company space.

**Tests**
- Operation tests for each resource type.
- Permission checks verifying guests can create child resources but cannot edit parent definitions.

### PR 7 — Invite acceptance and follow‑ups

**Changes**
- Ensure invite acceptance (`join_company_via_invite_link`) results in a guest `Person` if the invitation was for a guest.
- Update any post‑invite messaging, notifications, or UI display differences for guest accounts.
- Confirm guests appear in assignment pickers after acceptance.

**Tests**
- Invite acceptance tests for guest links.
- Regression tests for existing member invite flow.

## Data migrations

If any existing data must be updated (for example, backfilling person types or adjusting access levels on existing bindings), provide a data migration in `app/lib/operately/data` using minimal inline schemas per repository guidelines. If no existing data requires updates, no data migration is needed.

## Open questions

1. Should a guest be allowed to be promoted to a full member later (and if so, what data changes are required)?
2. When an email belongs to an existing person in the same company, should the invite fail, upgrade that person, or act as a no‑op with a notification?
3. Do guests appear in org‑wide people lists or only when they’re attached to resources?
