# TanStack Query reference

Skeletons and old→new mappings for [SKILL.md](SKILL.md).

## Canonical files

| Pattern | File |
| --- | --- |
| Single-query page loader | `app/assets/js/pages/ProjectPausePage/loader.tsx` |
| Multi-query page + `useRefresh` | `app/assets/js/pages/ProjectDiscussionPage/loader.tsx` |
| Optional parent fetch + `enabled` | `app/assets/js/pages/ProjectActivityPage/loader.tsx` |
| Several list queries + optional get | `app/assets/js/pages/ProjectAddPage/loader.tsx` |
| Lifecycle mutations | `app/assets/js/models/projects/projectLifecycle.ts` |
| Lifecycle Jest | `app/assets/js/models/projects/projectLifecycle.test.ts` |
| Non-prefetched `useQuery` | `app/assets/js/models/people/index.tsx` (`useGetMe`) |
| Shared client | `app/assets/js/api/queryClient.ts` |

Generated `*Query` / `*QueryOptions` / `*MutationOptions` names are in
`app/assets/js/api/index.tsx` next to each endpoint.

## Loader skeleton

```tsx
import Api, { Project } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";

export async function loader({ params }) {
  const queryInput = {
    id: params.projectID,
    includeSpace: true,
    includePermissions: true,
  };

  await Api.projects.getQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { project: Project } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.projects.getQueryOptions(queryInput));

  assertPresent(data?.project, `Project data is unavailable for project "${queryInput.id}"`);

  return { project: data.project };
}
```

## Optional query

Always call the hook. Prefetch only when the input exists. On prefetch
failure, return `null` so `enabled` stays false and the page can fall back.

```tsx
const { data: spaceData } = useLoadedQuery({
  ...Api.spaces.getQueryOptions(spaceInput ?? { id: "" }),
  enabled: spaceInput != null,
});
```

`useRefresh` should skip `invalidateQueries` for a null input.

## Mutation skeleton

```tsx
import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export async function invalidateProjectDiscussionQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: Api.projects.getDiscussionQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.projects.listDiscussionsQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKeyPrefix() }),
  ]);
}

export function useCreateProjectDiscussion() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.projects.createDiscussionMutationOptions(),
    onSuccess: () => {
      void invalidateProjectDiscussionQueries(queryClient);
    },
  });
}
```

Call site: `await createDiscussion.mutateAsync({ ... })`.

## Jest skeleton

```ts
it("invalidates discussion queries", async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const discussionKey = Api.projects.getDiscussionQueryKey({ id: "d1" });
  const unrelatedKey = Api.projects.listMilestonesQueryKey({ projectId: "p1" });

  queryClient.setQueryData(discussionKey, {});
  queryClient.setQueryData(unrelatedKey, {});

  await invalidateProjectDiscussionQueries(queryClient);

  expect(queryClient.getQueryState(discussionKey)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
});
```

Set `Api.default.setBasePath` / `setHeaders` in `beforeAll` like existing
lifecycle tests so keys include the company prefix.

## Old → new

| Old | New |
| --- | --- |
| `await Api.projects.get({ id })` in loader, `return { project }` | `await Api.projects.getQuery(queryInput)`, return `{ queryInput }`, `useLoadedQuery` |
| `Projects.getProject(...)` / `Goals.getGoal(...)` | `Api.projects.getQuery` / `Api.goals.getQuery` |
| `Pages.useRefresh()` | `useRefresh` that `invalidateQueries` |
| `const [save] = Api.projects.useCreate(); await save(input)` | `useMutation({ ...createMutationOptions(), onSuccess })` + `mutateAsync` |
| `PageCache.fetch({ fetchFn })` | TanStack prefetch; do not add new PageCache loaders |

`Api.projects.get` still exists for unmigrated callers and for typeahead-style
search functions. Do not use it in a page loader you are touching.

## Navigation and preloading

```tsx
// ExamplePage/loader.tsx
export async function loader({ params }) {
  const queryInput = { id: params.id, includePermissions: true };
  await Api.projects.getQuery(queryInput);
  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  return useLoadedQuery(Api.projects.getQueryOptions(queryInput));
}

// ExamplePage/index.tsx
export default { name: "ExamplePage", Page, loader } satisfies PageModule;

// routes/index.tsx: authentication and preloading default to true
pageRoute("projects/:id/example", pages.ExamplePage);
pageRoute("invite-team", pages.InviteTeamPage, { preload: false });
pageRoute("/setup", pages.SetupPage, { auth: false, preload: false });
```

Use `emptyLoader` from `@/components/Pages` for pages without data. A page may
export synchronous `onNavigate` alongside `Page` and `loader` for navigation-only
preparation, such as clearing company headers or redirecting the browser. Routes
requiring that preparation to fetch correctly must use `preload: false`.

`route.loader` is the navigation wrapper; `handle.dataLoader` is the original
page loader used by the preloader. Do not invoke `onNavigate`, authentication
redirects, or shared company/layout loaders during speculation. The preloader
skips excluded matched routes and cross-company links. For one link use
`<Link to={path} data-preload="false">...</Link>`.

Navigation reruns the same page loader and shares TanStack's pending/cached
queries. Preserve the query inputs, key scope, invalidation, and freshness rules.
Generated query functions send the headers captured in their effective cache key;
never temporarily switch global headers to preload another company.

Generated cached queries throw without toast/reload effects. Navigation errors
and enabled query observers (including cached optional errors on mount) report
centrally. Imperative cached queries without either boundary retain their local
error handling but do not trigger stale-client toast/reload effects. This accepted
tradeoff can delay detection until another qualifying request fails; do not add
per-action reporting wrappers. Raw API calls and mutations
retain their transport error handling. Successful login/logout clears the query
cache and disables preloading until the existing document reload.
