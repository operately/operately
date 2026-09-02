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

  if (!data?.project) {
    throw new Error(`Project data is unavailable for project "${queryInput.id}"`);
  }

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
