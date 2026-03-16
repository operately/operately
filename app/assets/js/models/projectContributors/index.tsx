import Api, { ProjectContributor } from "@/api";

export type { ProjectContributor };

export const getContributor = Api.projects.getContributor;
export const useUpdateContributor = Api.projects.useUpdateContributor;
export const useAddProjectContributor = Api.projects.useCreateContributor;
export const useAddProjectContributors = Api.projects.useCreateContributors;

export function splitByRole(contributors: ProjectContributor[]) {
  const champion = contributors.find((c) => c.role === "champion")!;
  const reviewer = contributors.find((c) => c.role === "reviewer")!;
  const rest = contributors.filter((c) => c.role === "contributor");

  return { champion, reviewer, contributors: rest };
}
