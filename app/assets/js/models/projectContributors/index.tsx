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

export function usePersonFieldContributorsSearch<T>(hookParams: UseContributorsSearch<T>): ContributorsSearchFn<T> {
  const transform = hookParams.transformResult || ((person) => person as unknown as T);

  return async (callParams: ContributorsSearchParams): Promise<T[]> => {
    const ignoredIds = (hookParams.ignoredIds || []).concat(callParams.ignoredIds || []);

    const result = await Api.projects.getContributors({
      projectId: hookParams.projectId,
      query: callParams.query?.trim(),
      ignoredIds,
    });

    const people = result.contributors || [];

    return people.filter((person): person is Person => !!person).map((person) => transform(person)) as T[];
  };
}
