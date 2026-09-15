# Hover Page Preloading

## Goal

Preload an internal page's loader data when a user hovers over its link for 150 ms. Apply this throughout the application, including Home, Work Map, menus, and rendered content, without per-page hover handlers or duplicate query definitions.

## Prerequisites

**Migrate all page and layout loaders to TanStack Query before implementing or enabling automatic preloading.**

- Loaders use generated query helpers and the shared query client; destination components read the same query keys and inputs.
- Remove legacy imperative API calls and `PageCache` usage from loaders. Migrate affected refresh and mutation paths to query invalidation.
- Audit loaders for speculative execution. Loading must not mark notifications read, record visits, mutate data, or trigger other user-visible actions. Move visit effects to actual navigation.
- Preserve account/company cache isolation and cache clearing when authentication changes.

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
- Invalidated data refreshes on navigation; authentication/company changes cannot reuse another context's data.
- Verify representative Home and Work Map links to spaces, projects, and goals, plus timer, route-matching, and cache-reuse tests.
