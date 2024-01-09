import { Project } from ".";

import * as Groups from "@/models/groups";

export interface ProjectGroup {
  space: Groups.Group;
  projects: Project[];
}

export function groupBySpace(projects: Project[]): ProjectGroup[] {
  const groups: ProjectGroup[] = [];

  for (const project of projects) {
    const space = project.space;

    if (!groups.find((group) => group.space.id === space.id)) {
      groups.push({
        space,
        projects: [],
      });
    }

    groups.find((group) => group!.space!.id === space!.id)!.projects.push(project);
  }

  return groups;
}
