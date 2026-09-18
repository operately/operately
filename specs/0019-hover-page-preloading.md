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
- The shared `app/assets/js/routes/companyLoader.tsx` remains unmigrated, so the prerequisites are not yet satisfied.

Required work before enabling preloading:

| Surface | Finding | Decision |
| --- | --- | --- |
| Shared company loader | Directly fetches company details, space access counts, site messages, and billing access state. | Use TanStack queries, subscribe layout consumers to the same cache entries, and replace affected router refreshes with query invalidation. |
| Company context | The company loader changes global API and socket headers. | Separate active-company changes from data fetching. Change active context only during navigation; initially skip cross-company preloads. |
| `CompanyImportPage` | Its loader clears global API and socket headers. | Move header clearing to actual navigation. Use an explicit account-level request and cache context for its data without changing the active page's context. Do not enable preloading for this route until that separation is complete. |
| `InviteTeamPage` | Its TanStack query wraps a get-or-create endpoint that can create an invitation link. | Exclude the route initially. Future support requires separating reading an existing link from creating one. |
| `SetupPage` | Its loader assigns `window.location.href` and fetches no data. | Exclude the route; execute its browser redirect only during actual navigation. |
| Billing and invitation checks | Loaders use `staleTime: 0` to enforce fresh checks, so a completed preload would not prevent another request on navigation. | Preserve freshness and exclude these routes initially. Do not relax permission, billing, capacity, or invitation-validity checks to enable preloading. |

The freshness exclusions cover `BillingPickCompanyPage`, `CompanyBillingPage`, `CompanyBillingPlanSelectionPage`, `CompanyBillingCancellationPage`, `JoinPage`, `InviteLinkJoinPage`, and `InviteLinkFullPage`.

Using TanStack alone does not make a loader safe for speculative execution. Verify side effects and request context separately before enabling a route.

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

Add an optional `preload` flag to the existing `pageRoute` options and store it in the route's `handle`:

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
- Reuse the destination's data loader as the single source of query requirements. Include required parent/layout data loaders when their inputs change.
- Invoke data loaders separately from navigation wrappers that manage authentication redirects, progress indicators, and page timing. Existing API authorization remains enforced.
- Deduplicate concurrent preloads by destination URL (excluding fragments) and authentication/company context. TanStack Query deduplicates shared requests and reuses valid cached data.
- Navigation still runs its loaders. They reuse cached or pending queries and fetch missing or invalidated data. Keep existing freshness, invalidation, and garbage-collection behavior; do not add a second payload cache.
- Preload exactly the loader's requests. Queries started only after component mounting, rendering, and code-bundle preloading are outside this scope.

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
