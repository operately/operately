import Api from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/** Fetch fresh access-granting resources, including changes made by other users or tabs. */
export function useLoadCollaboratorResources() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const [spacesData, goalsData, projectsData] = await Promise.all([
      queryClient.fetchQuery({ ...Api.spaces.listQueryOptions({}), staleTime: 0 }),
      queryClient.fetchQuery({ ...Api.goals.listQueryOptions({ includeSpace: true }), staleTime: 0 }),
      queryClient.fetchQuery({ ...Api.projects.listQueryOptions({}), staleTime: 0 }),
    ]);

    return {
      spaces: spacesData.spaces ?? [],
      goals: goalsData.goals ?? [],
      projects: projectsData.projects ?? [],
    };
  }, [queryClient]);
}
