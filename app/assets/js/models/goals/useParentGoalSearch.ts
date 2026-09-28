import { useCallback } from "react";
import Api from "@/api";
import { usePaths } from "@/routes/paths";
import { useQuerySearch } from "@/models/search/useQuerySearch";
import { parseParentGoalForTurboUi } from ".";

export function useParentGoalSearch(context: { type: "goal" | "project"; id: string }) {
  const paths = usePaths();
  const search = useQuerySearch(
    ({ query }: { query: string }) =>
      context.type === "goal"
        ? Api.goals.searchParentGoalQueryOptions({ goalId: context.id, query: query.trim() })
        : Api.projects.searchParentGoalQueryOptions({ projectId: context.id, query: query.trim() }),
    { query: "" },
  );

  return useCallback(
    async (params: { query: string }) => {
      const { goals } = await search(params);
      return goals
        .map((goal) => parseParentGoalForTurboUi(paths, goal))
        .filter((goal): goal is NonNullable<typeof goal> => goal !== null);
    },
    [search, paths],
  );
}
