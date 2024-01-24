import type { Project, ProjectContributor } from "@/gql";
export type { Project, ProjectContributor } from "@/gql";

export { groupBySpace } from "./groupBySpace";
export { getProjects } from "./getProjects";
export { getProject } from "./getProject";

export function sortByName(projects: Project[]) {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}

export function sortContributorsByRole(contributors: ProjectContributor[]): ProjectContributor[] {
  return [...contributors].sort((a, b) => {
    if (a!.role === "champion") return -2;
    if (b!.role === "reviewer") return 1;

    return 0;
  });
}
