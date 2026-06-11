---
name: help-docs
description: >-
  Discover help documentation work from operately git history. Use when the user
  asks to audit what needs documenting since a release, tag, or SHA, or to
  identify documentation gaps from code changes. Requires a baseline SHA or
  tag as input.
---

# Help Docs — Change Discovery

Scan git history since a baseline, identify user-facing product changes, and
infer how they work from source code.

This skill covers finding what needs documenting and how
the feature works in the UI.

For git commands, path watchlists, filter heuristics, code research guidance,
and what to capture per candidate, read [reference.md](reference.md).

## Input

**Required:** baseline SHA or tag (e.g. `v1.6.0`, `abc1234`).

If the user does not provide a baseline, ask before proceeding.

## Scope

- Work in the **operately** repo (this repo).
- Quote UI labels exactly from source; do not polish copy.
- Optionally cross-check the sibling `operately-website` repo for existing help
  pages when it is available on disk.

## Workflow

### 1. Resolve baseline

Validate the SHA or tag exists. Record the range `baseline..HEAD`, HEAD SHA,
and commit count.

### 2. Collect changes

List merge commits and PR titles in the range. Prefer PR titles over individual
commit messages — PR titles use the `feat:` / `fix:` / `chore:` / `docs:`
prefixes.

Use the git recipes in [reference.md](reference.md) to gather commits and diffs.

### 3. Filter to user-facing

Keep changes that affect what users see or do in the app. Drop internal-only
work (refactors, CI, tests-only, backend-only, migrations without UI impact).
See [reference.md — Filter heuristics](reference.md#filter-heuristics).

### 4. Cluster related commits

Group commits by feature area. Multiple PRs for one capability (e.g. billing
page + checkout + cancellation) become a single item.

### 5. Research each cluster in code

For each cluster, read the relevant source to infer behavior:

- `app/assets/js/pages/` — screens and navigation
- `app/assets/js/features/` — feature UI and flows
- `turboui/src/` — shared components
- `app/assets/js/routes/paths.tsx` — new or removed routes
- `app/test/features/` — user flows (for validation, not as doc content)
- `specs/` — product intent for major features

Extract entry points, UI labels, step order, permissions, and edge cases.
See [reference.md — Code research map](reference.md#code-research-map).

### 6. Classify and document each cluster

For each cluster, assign a doc action and capture the findings listed in
[reference.md — What to capture](reference.md#what-to-capture).

| Action | When |
| ------ | ---- |
| `new_page` | New user capability with no matching help page |
| `update_page` | Existing flow, labels, or navigation changed |
| `api_auto_sync` | External API surface changed — CI publishes to `/help/api/` |
| `skip` | Internal-only; no user-facing doc impact |

When `operately-website` is available, check `src/config/helpCenter.js` and
`src/content/docs/help/` to decide between `new_page` and `update_page`.

Also record excluded commits and why they were skipped.

## Definition of Done

Before finishing, verify:

- [ ] Baseline validated; range and commit count stated
- [ ] Internal-only changes listed with reasons
- [ ] Each candidate cites source commit SHAs and changed file paths
- [ ] UI labels quoted exactly from code
- [ ] Existing help pages referenced when the website repo is available
