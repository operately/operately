# Product Release Announcements

## Summary

Announce each published product release inside the Operately web app for both cloud and self-hosted users.

When a new release post is published on [operately.com](https://operately.com/), signed-in users see a bottom-right toast. They can dismiss it (hidden until the next release) or read more in a modal that shows a truncated summary and a link to the full post.

Release copy is loaded from the official marketing RSS feed. The backend fetches and caches that feed. Dismissal is persisted per person in the database so it follows the user across browsers and devices.

## Problem

Cloud users receive code as soon as it lands on `main`. Self-hosted users receive tagged GitHub releases on their own schedule. Neither group currently sees an in-product announcement when a marketing release post goes live.

There is already a SaaS-admin **site message** banner. That is the wrong channel: it is operator-authored, cloud-oriented, and dismissed in `localStorage`. Release notes should come from the public website and work the same way on every deployment.

## Goals

- Show a toast for the latest published marketing release when the current person has not dismissed that release.
- Persist dismissal per person in the database. The same person does not see the same release again on another device.
- Show the toast again when a newer feed item appears (different release id).
- Load release data from the official RSS/Atom feed on operately.com via the backend, never from the browser.
- Truncate long posts in the modal: one normal paragraph, or two if both are short.
- Link out to the canonical release post.
- Fail closed: if the feed is unreachable or empty, show nothing.

## Non-goals

- Announcing every merge to `main`.
- Using GitHub `releases.atom` as the copy source.
- In-app changelog history or a “What’s new” page.
- Email or notification-inbox delivery of releases.
- Targeting specific companies or people.
- Auto-dismiss when the user opens the modal or the external post.
- Per-account dismissal across companies (a person record is company-scoped).

## Important decisions

### 1. Source of truth is the marketing feed, not app version

Cloud already runs `main`. The event to announce is “we published a release post,” identified by the feed item id (guid / canonical URL / version slug such as `v1.8`).

Do not key visibility off git SHA or the running app version. Self-hosted instances on an older build still see the latest published post (useful as an upgrade prompt).

### 2. Fetch RSS on the backend

The browser must not request operately.com directly (CORS, mixed content, per-client load, XML parsing).

The Elixir app fetches the feed with `Req`, parses the newest item into a small DTO, and caches it. The SPA receives JSON only.

### 3. Dismissal lives on the person, in preferences

Store `dismissed_product_release_id` on `people.preferences` (existing JSON embed). No new table or column.

Show the toast when `latest.id` is present and not equal to that field.

A person belongs to one company. Someone in two companies dismisses independently in each — acceptable.

### 4. Confirm the feed URL before implementation

Usual paths (`/rss.xml`, `/feed.xml`, `/releases/index.xml`) did not resolve at planning time. The implementation must pin a stable URL (config/env). If the marketing site has no feed yet, add one that emits release posts (title, date, html/text body, permalink, stable guid) before shipping the in-app UI.

## User experience

### Toast (bottom-right)

Appears on authenticated company pages after the layout has loaded, once the latest release is known and not dismissed.

Contains:

- A short title (feed title or “Operately vX.Y is here”)
- One-line supporting text if available
- **Read more** — opens the modal
- Dismiss control — persists the current release id and hides the toast

Do not show on login, signup, or other unauthenticated routes. Do not stack with multiple historical releases; only the latest item matters.

### Modal

Opened from **Read more**. Contains:

- Title and published date
- Truncated body (see below)
- Primary action: **Read the full post** (opens `item.url` in a new tab)
- Secondary: dismiss (same persistence as the toast)
- Close (X / overlay) does **not** dismiss; the toast remains until explicit dismiss

### Truncation

Work from paragraphs extracted from the feed body (strip boilerplate such as “Sign up for Operately” / “Self-host in 5 minutes” if those appear as trailing sections).

- If the first paragraph is “normal” length, show only that paragraph.
- If the first two paragraphs are both short, show both.
- Suggested threshold: a paragraph is short if it has fewer than ~280 characters.
- If the body is longer than what is shown, fade/ellipsis and rely on the full-post link.

Do not dump the entire RSS HTML into the modal.

## Architecture

```
operately.com RSS  →  Fetcher + ETS cache  →  API query
                                                ↓
                              Company layout (bridge)
                              - latest release
                              - me.dismissedProductReleaseId
                                                ↓
                         TurboUI toast + modal (pure)
                                                ↓
                              dismiss mutation → people.preferences
```

### Backend

- `Operately.ProductReleases.Fetcher` — HTTP GET, size/timeout limits, parse RSS 2.0 and Atom.
- `Operately.ProductReleases.Cache` — ETS, TTL on the order of 1–6 hours; keep the last successful payload on fetch failure.
- Config: feed URL (env), TTL, request timeout. Empty/missing URL disables the feature.
- DTO: `{id, title, url, published_at, paragraphs}` (plain text paragraphs, not raw HTML). Sanitize/strip HTML while parsing.

Self-hosted instances need outbound HTTPS to the feed host. If blocked, the cache stays empty and the UI stays hidden.

### API

- Query `getLatestProductRelease` — session-authenticated; returns the cached item or `null`. Do not include this in the external/CLI API.
- Mutation `dismissProductRelease` — `{ id }` required. Writes `preferences.dismissed_product_release_id` for `current_person` only. Validate presence and a reasonable max length. Storing the id the user actually saw avoids races if a newer item appears mid-session (they dismiss 1.8; 1.9 still shows).
- Expose `dismissed_product_release_id` on `:person` for the current user (`get_me` / person serializer at full level). Other people’s profiles omit or ignore it.

Optionally load the latest release in the company layout loader (same pattern as site messages) to avoid a extra waterfall. Dismissal still comes from the current person.

### Persistence

Add `dismissed_product_release_id` (string, optional) to `Operately.People.Preferences`.

Because preferences are an embed, this does not require a schema migration. Existing rows without the key treat it as `nil` (toast visible).

### Frontend

- **TurboUI:** `ProductReleaseToast` and `ProductReleaseModal` (or one `ProductReleaseAnnouncement` with both states). Props only: release fields, `onDismiss`, `onReadMore`, `onOpenPost`. Storybook stories for toast, short vs long body, dismissed/hidden.
- **Bridge:** company layout, next to `SiteMessageBanner`. Compare `latest.id` vs `me.dismissedProductReleaseId`. Call the dismiss mutation; optimistic hide on success.
- Reuse existing TurboUI `Modal`, buttons, and typography. Do not hand-roll a second modal primitive.

## Testing

- Fetcher: fixture XML (RSS and Atom); newest item; empty/malformed/oversized/non-200 → `nil` / error; HTML stripped to paragraphs.
- Cache: hit, miss, expiry, stale-on-failure.
- Query: returns DTO or null; requires session.
- Mutation: updates only the current person; does not change other people; validation.
- Preferences: missing key behaves as not dismissed.
- TurboUI: truncation cases (one long paragraph vs two short); dismiss callbacks.
- Feature test: toast visible, dismiss persists across reload, newer id shows again. Stub the fetcher; do not hit the live website in CI.

## Rollout

1. Confirm or add the marketing RSS feed; set the URL in config.
2. Backend fetcher, cache, preferences field, API.
3. TurboUI + layout bridge.
4. Ship to cloud and self-hosted together (same code path).

No data backfill. Users who have never dismissed see the current latest release once after deploy — expected.
