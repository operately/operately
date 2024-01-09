import type { Project } from "@/gql";
export type { Project } from "@/gql";

export { groupBySpace } from "./groupBySpace";
export { getProjects } from "./getProjects";
export { getProject } from "./getProject";

export function sortByName(projects: Project[]) {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name));
}
