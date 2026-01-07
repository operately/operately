import * as Api from "@/api";
import * as React from "react";

import { Paths, usePaths } from "@/routes/paths";
import { GlobalSearch } from "turboui";

type SearchParams = { query: string };

export function useGlobalSearchHandler(): (params: SearchParams) => Promise<GlobalSearch.SearchResult> {
  const paths = usePaths();

  return React.useCallback(
    async ({ query }: SearchParams) => {
      try {
        const result = await Api.globalSearch({ query });

        return {
          projects: prepareProjects(paths, result),
          goals: prepareGoals(paths, result),
          milestones: prepareMilestones(paths, result),
          tasks: prepareTasks(paths, result),
          people: preparePeople(paths, result),
        };
      } catch (error) {
        console.error("Global search failed:", error);
        return {};
      }
    },
    [paths],
  );
}

function prepareProjects(paths: Paths, result: Api.GlobalSearchResult): GlobalSearch.Project[] {
  return (
    result.projects?.map((project) => ({
      id: project.id!,
      name: project.name!,
      link: paths.projectPath(project.id!),
      champion: project.champion ?? null,
      space: project.space ?? null,
    })) || []
  );
}

function prepareGoals(paths: Paths, result: Api.GlobalSearchResult): GlobalSearch.Goal[] {
  return (
    result.goals?.map((goal) => ({
      id: goal.id!,
      name: goal.name!,
      link: paths.goalPath(goal.id!),
      champion: goal.champion ?? null,
      space: goal.space ?? null,
    })) || []
  );
}

function prepareMilestones(paths: Paths, result: Api.GlobalSearchResult): GlobalSearch.Milestone[] {
  return (
    result.milestones?.map((milestone) => ({
      id: milestone.id!,
      title: milestone.title!,
      link: paths.projectMilestonePath(milestone.id!),
      project: milestone.project ?? null,
      space: milestone.space ?? null,
    })) || []
  );
}

function preparePeople(paths: Paths, result: Api.GlobalSearchResult): GlobalSearch.Person[] {
  return (
    result.people?.map((person) => ({
      id: person.id!,
      fullName: person.fullName!,
      title: person.title || null,
      link: paths.profilePath(person.id!),
      avatarUrl: person.avatarUrl || null,
    })) || []
  );
}

function prepareTasks(paths: Paths, result: Api.GlobalSearchResult): GlobalSearch.Task[] {
  return (
    result.tasks?.map((task) => ({
      id: task.id,
      name: task.name,
      link: task.type === "project" ? paths.taskPath(task.id!) : paths.spaceKanbanPath(task.space?.id || "", { taskId: task.id }),
      project: task.project ?? null,
      space: task.type === "project" ? task.projectSpace : task.space,
    })) || []
  );
}
