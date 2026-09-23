import { assertPresent } from "@/utils/assertions";
import { QueryClient } from "@tanstack/react-query";
import Api from "@/api";
import {
  collectResourceLinkRefs,
  type ResourceLinkRef,
  type ResourceLinkTitle,
  type ResourceLinkParseOptions,
} from "turboui/RichContent/resourceLinks";
import { idWithoutComments, isUUID } from "turboui/utils/ids";

const BATCH_SIZE = 100;

type Resolver = (content: unknown) => Promise<ResourceLinkTitle[]>;

/** Extract resource links, reuse cached titles, and fetch/cache the missing or stale ones in batches. */
export function createResourceLinkResolver(
  client: QueryClient,
  scope: ResourceLinkParseOptions,
  viewerId: string,
): Resolver {
  const getTitleFromCacheOrFetch = createCachedTitleLookup(client, viewerId);

  return async (content) => {
    const refs = extractResourceLinks(content, scope);
    const titles = await Promise.all(refs.map(getTitleFromCacheOrFetch));

    return titles.filter((title): title is ResourceLinkTitle => title !== null);
  };
}

/** Removes slug prefixes and rejects malformed IDs to keep GET request URLs bounded. */
function extractResourceLinks(content: unknown, scope: ResourceLinkParseOptions): ResourceLinkRef[] {
  return collectResourceLinkRefs(content, scope)
    .map((ref) => ({ ...ref, id: isUUID(ref.id) ? ref.id : (idWithoutComments(ref.id) ?? ref.id) }))
    .filter((ref) => isUUID(ref.id) || /^[a-zA-Z0-9]{1,22}$/.test(ref.id));
}

function createCachedTitleLookup(client: QueryClient, viewerId: string) {
  const api = createScopedResourceLinkApi(client);
  const fetchTitleInBatch = createBatchedTitleFetcher(api.fetchTitles);

  return (ref: ResourceLinkRef): Promise<ResourceLinkTitle | null> =>
    client.fetchQuery({
      queryKey: [...api.queryKeyFor([ref]), "resource", viewerId],
      // TanStack calls this only for missing/stale titles, then caches the result.
      // Concurrent lookups for the same resource share this promise.
      queryFn: () => fetchTitleInBatch(ref),
      // Titles stay fresh while cached; a page reload gets updated titles.
      staleTime: Infinity,
    });
}

interface PendingLookup {
  ref: ResourceLinkRef;
  resolve: (title: ResourceLinkTitle | null) => void;
  reject: (error: unknown) => void;
}

/** Combines cache misses from different readers into requests of at most 100 resources. */
function createBatchedTitleFetcher(fetchTitles: (refs: ResourceLinkRef[]) => Promise<ResourceLinkTitle[]>) {
  const queue: PendingLookup[] = [];
  let flushing = false;

  async function flushQueue() {
    // Drain one batch at a time, including lookups queued while a request was in flight.
    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_SIZE);

      try {
        const titles = await fetchTitles(batch.map(({ ref }) => ref));
        resolvePendingLookups(batch, titles);
      } catch (error) {
        // Reject failures so they can be retried; they must not be cached as missing titles.
        for (const lookup of batch) lookup.reject(error);
      }
    }

    flushing = false;
  }

  return (ref: ResourceLinkRef): Promise<ResourceLinkTitle | null> => {
    return new Promise((resolve, reject) => {
      queue.push({ ref, resolve, reject });

      if (!flushing) {
        flushing = true;
        // Give other readers in this turn a chance to join the same batch.
        setTimeout(() => void flushQueue(), 0);
      }
    });
  };
}

/** The API omits unavailable resources; resolve those lookups to null so they can also be cached. */
function resolvePendingLookups(batch: PendingLookup[], links: ResourceLinkTitle[]): void {
  const titlesByResource = new Map(links.map((link) => [`${link.type}:${link.id}`, link]));

  for (const lookup of batch) {
    const key = `${lookup.ref.type}:${lookup.ref.id}`;
    lookup.resolve(titlesByResource.get(key) ?? null);
  }
}

/** Keeps queued requests and cache keys tied to the company headers captured at creation. */
function createScopedResourceLinkApi(client: QueryClient) {
  const options = Api.rich_content.resolveLinksQueryOptions({ types: [], ids: [] });
  const queryFn = options.queryFn;
  assertPresent(queryFn, "Resource link query function is required");

  const [namespace, basePath, headers, path] = options.queryKey;
  const queryKeyFor = (refs: ResourceLinkRef[]) =>
    [
      namespace,
      basePath,
      headers,
      path,
      {
        types: refs.map((ref) => ref.type),
        ids: refs.map((ref) => ref.id),
      },
    ] as const;

  return {
    queryKeyFor,
    fetchTitles: async (refs: ResourceLinkRef[]): Promise<ResourceLinkTitle[]> => {
      const result = await queryFn({
        client,
        queryKey: queryKeyFor(refs),
        // A shared request must not be canceled by an individual lookup.
        signal: new AbortController().signal,
        meta: options.meta,
      });

      return result.links;
    },
  };
}

// Share batching queues; TanStack owns all cached titles.
const resolvers = new WeakMap<QueryClient, Map<string, Resolver>>();

/** Reuses a resolver so readers in the same scope share one batching queue. */
export function getResourceLinkResolver(
  client: QueryClient,
  scope: ResourceLinkParseOptions,
  viewerId: string,
): Resolver {
  const key = JSON.stringify([scope, viewerId, Api.rich_content.resolveLinksQueryKeyPrefix()]);
  let byScope = resolvers.get(client);

  if (!byScope) {
    byScope = new Map();
    resolvers.set(client, byScope);
  }

  let resolver = byScope.get(key);

  if (!resolver) {
    resolver = createResourceLinkResolver(client, scope, viewerId);
    byScope.set(key, resolver);
  }

  return resolver;
}
