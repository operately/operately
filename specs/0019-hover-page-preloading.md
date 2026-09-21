# Hover Page Preloading

## Goal

Preload an internal page's loader data when a user hovers over its link for 150 ms. Apply this throughout the application, including Home, Work Map, menus, and rendered content, without per-page hover handlers or duplicate query definitions.

## Prerequisites

**Migrate all page and layout loaders to TanStack Query before implementing or enabling automatic preloading.**

- Loaders use generated query helpers and the shared query client; destination components read the same query keys and inputs.
- Remove legacy imperative API calls and `PageCache` usage from loaders. Migrate affected refresh and mutation paths to query invalidation.
- Audit loaders for speculative execution. Loading must not mark notifications read, record visits, mutate data, or trigger other user-visible actions. Move visit effects to actual navigation.
- Preserve account/company cache isolation and cache clearing when authentication changes.

## Loader audit and required fixes

The September 18, 2026 audit covered all 126 page modules, including enterprise pages, inline loaders, reused loaders, and model helpers:

- All 109 pages with data-fetching loaders use TanStack Query.
- The other 17 pages have empty or redirect-only loaders and need no fetching migration.
- No `PageCache` references remain in either frontend.
- The shared `app/assets/js/routes/companyLoader.tsx` now uses TanStack Query. It remains navigation-only, including authentication checks and active-company header changes; it is not exposed through `handle.dataLoader`.

Migration status and preloading boundaries:

| Surface | Finding | Decision |
| --- | --- | --- |
| Shared company loader | Migration complete: company details, space access counts, site messages, and billing access state use TanStack Query. | Layout consumers subscribe to the same cache entries, and affected refresh and mutation paths use query invalidation. The layout is already loaded for same-company navigation, so it is outside the initial preloading scope. |
| Company context | The shared company loader changes global API and socket headers during navigation only. | The preloader must skip cross-company links, including company cards in the lobby, and must not invoke the shared company loader. Generated queries bind requests to their cache-key headers. A preload may finish extra reads after a company switch; it must not mix response data between cache scopes. |
| `CompanyImportPage` | Header clearing now runs in `onNavigate`, before the data loader. Its requests still use the global API client. | Excluded with `preload: false`. Use an explicit account-level request and cache context before enabling this route. |
| `InviteTeamPage` | Its TanStack query wraps a get-or-create endpoint that can create an invitation link. | Excluded with `preload: false`. Future support requires separating reading an existing link from creating one. |
| `SetupPage` | Its browser redirect now runs in `onNavigate`; its data loader is empty. | Excluded with `preload: false`; normal navigation retains the redirect. |
| Billing and invitation checks | Loaders use `staleTime: 0` to enforce fresh checks, so a completed preload would not prevent another request on navigation. | Preserve freshness; these routes are excluded with `preload: false`. Do not relax permission, billing, capacity, or invitation-validity checks to enable preloading. |

The freshness exclusions cover `BillingPickCompanyPage`, `CompanyBillingPage`, `CompanyBillingPlanSelectionPage`, `CompanyBillingCancellationPage`, `JoinPage`, `InviteLinkJoinPage`, and `InviteLinkFullPage`.

Using TanStack alone does not make a loader safe for speculative execution. Verify side effects and request context separately before enabling a route.

## Implementation tasks

Implement these as two ordered PRs. Complete and merge preparation before enabling automatic preloading.

### Task 1 / PR 1: Prepare loaders for preloading

- [x] Separate page data fetching from navigation-only effects: authentication redirects, progress indicators, page timing, and import-page header clearing. Keep the shared company loader navigation-only. Preserve normal navigation behavior and API authorization.
- [x] Add the optional `preload` route option and store it in route `handle` metadata. Mark `InviteTeamPage`, `SetupPage`, and the billing/invitation routes listed above as excluded. Exclude `CompanyImportPage` until its request context is safe.
- [x] Audit eligible loaders and the backend endpoints they call for mutations and other user-visible side effects. Move visit effects to actual navigation or exclude the affected routes. Put substantial backend changes in separate follow-up PRs.
- [x] Test the separation of fetching and navigation effects, route exclusion metadata, and account/company cache isolation. Keep automatic preloading disabled in this PR.

Initial preparation validation: 152 focused JavaScript tests and 7 setup/login/company-settings browser tests passed, along with TypeScript, changed-code formatting, and dead-code checks. Automatic preloading remained disabled in preparation.

### Preparation audit findings

- `pageRoute` exposes the original loader as `handle.dataLoader`, alongside `handle.auth` and `handle.preload`. Its router loader retains authentication redirects, progress indicators, timing, and the optional synchronous `PageModule.onNavigate` hook. The shared company route has no preload data loader; normal navigation continues to run `companyLoader`. Task 2 now invokes these data loaders through the shared hover/focus listener.
- Reviewed main and enterprise loaders, their model helpers, and the backend query paths for company/people administration, work maps, spaces, projects, goals, tasks, milestones, discussions, resources, notifications, account settings, transfers, and site administration. No additional mutating endpoints were found among eligible loaders. Notification read mutations already run in mounted-page effects; `UnreadNotificationsLoader` only reads notifications.
- The excluded billing overview endpoint also synchronizes provider state; the shared layout's `billing/get_access_state` reads the local projection and limits without that sync. `InviteTeamPage` remains the other known loader with a mutating endpoint.
- Query-header safety is implemented centrally in both generated API clients: query keys copy the current headers, and query functions read their base URL and headers from the effective query key. Existing layout scope overrides are honored. No loader arguments, generation counters, or company-change cancellation are required.
- An old preload may continue sequential reads after a company switch. Accept those extra reads: each query uses matching request headers and cache scope. Cross-company link preloading remains excluded.
- Task 2 separates generated cached-query transport from error effects. Navigation wrappers and active query observers (including cached optional errors on mount) report errors; speculation stays silent. Raw API calls and mutations retain their error handling. Successful login/logout clears the query cache, pending preload timers and deduplication entries, and disables preloading until the existing document reload. Late responses cannot restore previous-session cache entries.

### Task 2 / PR 2: Implement hover preloading

- [x] Add `preloadPage(href)` using existing route definitions and page data loaders. Do not invoke parent/layout loaders in the initial scope. Respect matched-route exclusions and deduplicate concurrent preloads by URL and authentication/company context.
- [x] Add the shared application-root hover/focus listener with the 150 ms delay, cancellation rules, nested/dynamic link handling, and `data-preload="false"` support.
- [x] Enforce link eligibility, keep cross-company preloading disabled, and handle preload errors and redirects silently without affecting normal navigation. Handle stale-client toast/reload behavior at caller boundaries and verify authentication isolation as identified in the preparation audit. Accept extra sequential reads after company switches while preserving matching request headers and cache keys.
- [x] Add concise agent guidance to the TanStack Query skill and its reference, with a minimal page/route example. Explain shared query inputs and cache keys for navigation and preloading, `emptyLoader` when no data is needed, synchronous navigation-only effects in `onNavigate`, and `pageRoute` options (`auth`, `preload`). Cover when to exclude a route with `preload: false`, the link-level `data-preload="false"` escape hatch, and why freshness checks and company context must be preserved. Distinguish `route.loader` from `handle.dataLoader` and keep the shared company loader navigation-only.
- [x] Verify all acceptance criteria below, including timer and route-matching tests, cache reuse during and after preloading, invalidation, and representative Home and Work Map navigation in end-to-end tests.

Task 2 validation: 86 focused JavaScript tests, 10 generator tests, and 14 browser tests passed. Browser coverage includes Home → space and Work Map → project/goal preloading with request reuse, plus existing Home, Work Map, login, and setup flows. TypeScript, Prettier, changed-test Elixir formatting, and dead-code checks passed.

## Interaction

- A shared application-root listener detects eligible anchors, including dynamically rendered links and their nested elements.
- Start a 150 ms timer on hover. Cancel it when the pointer leaves the link, navigation begins, or the listener unmounts. Moving between children of the same link does not restart it.
- Keyboard focus uses the same delay; blur cancels it. Touch-only interactions do not trigger hover preloading.
- After the delay, preload without navigation, visible loading indicators, toasts, or redirects. Failures remain silent; clicking retains normal navigation and error handling.
- Once requests have started, leaving the link does not cancel queries that navigation or another component may share.

## Eligible links

Preload same-origin HTTP(S) links matching application page routes. Skip:

- External URLs, downloads, non-page routes, and links targeting another browsing context.
- The current page and fragment-only navigation. Different search parameters remain eligible.
- Links with `data-preload="false"` and routes explicitly excluded from speculative loading.
- Cross-company links until destination company context can be established safely without changing the active page's context.

### Route and link exclusions

The optional `preload` flag on `pageRoute` is stored in the route's `handle`:

```tsx
pageRoute("invite-team", pages.InviteTeamPage, { preload: false });
pageRoute("/setup", pages.SetupPage, { auth: false, preload: false });
```

`preloadPage(href)` matches the existing route definitions and skips the destination if any matched route has `handle.preload === false`. Eligible routes allow preloading by default. This flag affects only speculative loading; normal navigation and its loaders remain unchanged.

Use route configuration when a page must always be excluded. For an individual link, the shared listener also respects the existing escape hatch:

```tsx
<Link to={path} data-preload="false">...</Link>
```

## Design

- Add a shared `preloadPage(href)` entry point in the routing layer.
- Resolve URLs using existing route definitions, preserving route parameters and search parameters, including selected tabs. Do not maintain a separate URL-to-loader registry.
- Reuse the destination page's data loader as the single source of query requirements. Do not invoke parent/layout loaders in the initial scope; the current company's layout is already loaded. Loading another company's layout is deferred along with cross-company preloading.
- Invoke data loaders separately from navigation wrappers that manage authentication redirects, progress indicators, and page timing. Existing API authorization remains enforced.
- Deduplicate concurrent preloads by destination URL (excluding fragments) and authentication/company context. TanStack Query deduplicates shared requests and reuses valid cached data.
- Navigation still runs its loaders. They reuse cached or pending queries and fetch missing or invalidated data. Keep existing freshness, invalidation, and garbage-collection behavior; do not add a second payload cache.
- Preload exactly the loader's requests. Queries started only after component mounting, rendering, and code-bundle preloading are outside this scope.

## Loader conventions

Page loaders remain read-only and use generated queries. Return their inputs and
reuse those inputs with `useLoadedQuery` so navigation and preloading share cache
keys. `route.loader` adds authentication, progress, and synchronous `onNavigate`;
`handle.dataLoader` exposes only the page loader. Use `emptyLoader` from
`@/components/Pages` when no data is needed. Keep header changes and browser
redirects in `onNavigate`, and exclude routes whose data needs that preparation.

```tsx
export async function loader({ params }) {
  const queryInput = { id: params.id, includePermissions: true };
  await Api.projects.getQuery(queryInput);
  return { queryInput }; // The mounted page uses the same QueryOptions input.
}

// auth and preload both default to true.
pageRoute("projects/:id/example", pages.ExamplePage);
pageRoute("invite-team", pages.InviteTeamPage, { preload: false });
```

Do not add toast/reload handling to page loaders. Normal navigation and active
query observers report centrally. Imperative cached queries without either boundary
keep their local error handling but do not trigger stale-client toast/reload effects.
This accepted tradeoff can delay detection until another qualifying request fails.
Preserve fresh checks and company scope rather than weakening them to enable preloading. Full examples are in the TanStack Query
skill and reference.

## Acceptance

- No request starts before 150 ms; leaving or blurring early prevents preloading.
- Nested link content, keyboard focus, and dynamically added links work without page-specific wiring.
- Clicking during or after preloading reuses requests/data without duplicate successful loader requests.
- URL parameters and selected tabs produce the same query inputs as normal navigation.
- Excluded links cause no preload; hover failures and redirects do not affect the current page.
- Route exclusions, including exclusions inherited from matched parent routes, prevent preloading while preserving normal navigation. Link-level exclusions work when hovering or focusing nested content.
- Preloading never changes the active API/socket company headers, creates invitation links, or triggers browser navigation. Excluded billing and invitation routes retain their fresh checks on navigation.
- Invalidated data refreshes on navigation; authentication/company changes cannot reuse another context's data.
- Verify representative Home and Work Map links to spaces, projects, and goals, plus timer, route-matching, and cache-reuse tests.

## Predictive preloading

Mounted Home and Space pages also declare likely destinations through small page hooks. A shared queue in `routes/preloading/` calls the same `preloadPage` service, preserving its route exclusions, company checks, silent failures, and TanStack cache reuse.

- Home queues company Work Map, My Work (the current person's profile), Review, and spaces whose member list includes the current person. The first-run Home redirect does not enqueue work.
- Space queues Goals & Projects and enabled Discussions, Docs & Files, Tasks, KPIs, and Templates tool landing pages. Resource hubs and discussion boards must exist before their links are queued.
- Process one destination loader at a time, starting after mount and continuing as soon as the previous loader finishes, without a fixed delay. A loader can still make several API requests.
- Hover/focus intent pauses the queue until the hover is canceled or its preload finishes. Completion notifications resume the queue without polling; hover and navigation never wait for the predictive queue.
- Navigation start, page cleanup, authentication changes, and root cleanup discard queued work. Check eligibility and company scope again before execution. Equivalent destination lists do not restart the queue on rerender.
- Already-started loaders may finish into the cache. This bounds speculative traffic but does not guarantee zero network/server contention. Do not cancel shared queries that navigation may be using.
- Only mounted page hooks enqueue work. Preloading a space from Home does not recursively preload that space's tools.

Validation covers queue timing/concurrency, hover priority, disposal, authentication/scope changes, StrictMode, stable rerenders, membership/tool selection, and browser navigation reusing automatically warmed Home and Space destinations.
