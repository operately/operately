import { ProjectContributor, useUpdateProjectContributor, getProjectContributor } from "@/api";

export type { ProjectContributor };
export { useAddProjectContributor, useAddProjectContributors } from "@/api";
export { useUpdateProjectContributor as useUpdateContributor, getProjectContributor as getContributor };

export function splitByRole(contributors: ProjectContributor[]) {
  const champion = contributors.find((c) => c.role === "champion")!;
  const reviewer = contributors.find((c) => c.role === "reviewer")!;
  const rest = contributors.filter((c) => c.role === "contributor");

  return { champion, reviewer, contributors: rest };
}
