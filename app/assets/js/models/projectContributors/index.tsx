import Api, { ProjectContributor, useUpdateProjectContributor, getProjectContributor } from "@/api";
import { Person } from "../people";

export type { ProjectContributor };
export { useUpdateProjectContributor as useUpdateContributor, getProjectContributor as getContributor };

export function splitByRole(contributors: ProjectContributor[]) {
  const champion = contributors.find((c) => c.role === "champion")!;
  const reviewer = contributors.find((c) => c.role === "reviewer")!;
  const rest = contributors.filter((c) => c.role === "contributor");

  return { champion, reviewer, contributors: rest };
}

interface UseContributorsSearch<T> {
  ignoredIds?: string[];
  projectId: string;
  transformResult?: (person: Person) => T;
}

interface ContributorsSearchParams {
  query?: string;
  ignoredIds?: string[];
}

type ContributorsSearchFn<T> = (callParams: ContributorsSearchParams) => Promise<T[]>;

const CONTRIBUTORS_CACHE_TTL = 10_000;

type ContributorsCacheEntry = {
  fetchedAt: number;
  data: Person[];
  promise: Promise<Person[]> | null;
};

const contributorsCache = new Map<string, ContributorsCacheEntry>();

function buildCacheKey(projectId: string, query: string | undefined, ignoredIds: string[]): string {
  const normalizedIgnoredIds = [...new Set(ignoredIds)].sort();

  return JSON.stringify({ projectId, query: query?.trim() || "", ignoredIds: normalizedIgnoredIds });
}

function isCacheEntryStale(entry: ContributorsCacheEntry): boolean {
  return Date.now() - entry.fetchedAt > CONTRIBUTORS_CACHE_TTL;
}

async function fetchContributors(
  projectId: string,
  query: string | undefined,
  ignoredIds: string[],
  cacheKey: string,
  existingEntry: ContributorsCacheEntry | undefined,
): Promise<Person[]> {
  if (existingEntry?.promise) {
    return existingEntry.promise;
  }

  const fetchPromise = Api.projects
    .getContributors({
      projectId,
      query: query?.trim(),
      ignoredIds,
    })
    .then((result) => {
      const people = (result.contributors || []).filter((person): person is Person => !!person);
      const updatedEntry: ContributorsCacheEntry = {
        fetchedAt: Date.now(),
        data: people,
        promise: null,
      };

      contributorsCache.set(cacheKey, updatedEntry);

      return people;
    })
    .catch((error) => {
      if (existingEntry) {
        contributorsCache.set(cacheKey, { ...existingEntry, promise: null });
      } else {
        contributorsCache.delete(cacheKey);
      }

      throw error;
    });

  if (existingEntry) {
    contributorsCache.set(cacheKey, { ...existingEntry, promise: fetchPromise });
  } else {
    contributorsCache.set(cacheKey, { fetchedAt: 0, data: [], promise: fetchPromise });
  }

  return fetchPromise;
}

export function usePersonFieldContributorsSearch<T>(hookParams: UseContributorsSearch<T>): ContributorsSearchFn<T> {
  const transform = hookParams.transformResult || ((person) => person as unknown as T);

  return async (callParams: ContributorsSearchParams): Promise<T[]> => {
    const ignoredIds = (hookParams.ignoredIds || []).concat(callParams.ignoredIds || []);
    const cacheKey = buildCacheKey(hookParams.projectId, callParams.query, ignoredIds);
    const cacheEntry = contributorsCache.get(cacheKey);

    if (cacheEntry && !isCacheEntryStale(cacheEntry) && !cacheEntry.promise) {
      return cacheEntry.data.map((person) => transform(person)) as T[];
    }

    const people = await fetchContributors(hookParams.projectId, callParams.query, ignoredIds, cacheKey, cacheEntry);

    return people.map((person) => transform(person)) as T[];
  };
}
