import * as api from "@/api";

export type ProjectContributor = api.ProjectContributor;

export function splitByRole(contributors: ProjectContributor[]) {
  const champion = contributors.find((c) => c.role === "champion")!;
  const reviewer = contributors.find((c) => c.role === "reviewer")!;
  const rest = contributors.filter((c) => c.role === "contributor");

  return { champion, reviewer, contributors: rest };
}

export const getContributor = api.getProjectContributor;
export const useUpdateContributor = api.useUpdateProjectContributor;
