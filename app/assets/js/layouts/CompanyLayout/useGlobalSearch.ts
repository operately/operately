import * as React from "react";
import * as Api from "@/api";

import { GlobalSearch } from "turboui";
import { usePaths } from "@/routes/paths";

type SearchParams = { query: string };

export function useGlobalSearchHandler(): (
  params: SearchParams
) => Promise<GlobalSearch.SearchResult> {
  const paths = usePaths();

  return React.useCallback(async ({ query }: SearchParams) => {
    try {
      const result = await Api.globalSearch({ query });

      return {
        projects:
          result.projects?.map(project => ({
            id: project.id!,
            name: project.name!,
            link: paths.projectPath(project.id!),
            champion: project.champion ? { fullName: project.champion.fullName! } : null,
            space: project.space ? { name: project.space.name! } : null,
          })) || [],
        goals:
          result.goals?.map(goal => ({
            id: goal.id!,
            name: goal.name!,
            link: paths.goalPath(goal.id!),
            champion: goal.champion ? { fullName: goal.champion.fullName! } : null,
            space: goal.space ? { name: goal.space.name! } : null,
          })) || [],
        tasks:
          result.tasks?.map(task => ({
            id: task.id!,
            name: task.name!,
            link: paths.taskPath(task.id!),
            milestone: task.milestone
              ? {
                  project: task.milestone.project
                    ? {
                        name: task.milestone.project.name!,
                        space: task.milestone.project.space
                          ? { name: task.milestone.project.space.name! }
                          : null,
                      }
                    : null,
                }
              : null,
          })) || [],
        people:
          result.people?.map(person => ({
            id: person.id!,
            fullName: person.fullName!,
            title: person.title || null,
            link: paths.profilePath(person.id!),
          })) || [],
      };
    } catch (error) {
      console.error("Global search failed:", error);
      return {};
    }
  }, [paths]);
}
