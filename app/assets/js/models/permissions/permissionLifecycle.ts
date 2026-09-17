import Api from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateGoalAccessQueries } from "@/models/goals/goalAccessLifecycle";
import { invalidateSpaceAccessQueries } from "@/models/spaces/spaceAccessLifecycle";
import { invalidateProjectLifecycleQueries } from "@/models/projects/projectLifecycle";

export function useGrantResourceAccess() {
  const client = useQueryClient();

  return useMutation({
    ...Api.companies.grantResourceAccessMutationOptions(),
    onSuccess: async (_result, { resources }) => {
      await Promise.all(
        resources.map(({ resourceType, resourceId }) => {
          switch (resourceType) {
            case "goal":
              return invalidateGoalAccessQueries(client, resourceId);
            case "space":
              return invalidateSpaceAccessQueries(client, resourceId);
            case "project":
              return Promise.all([
                invalidateProjectLifecycleQueries(client),
                client.invalidateQueries({ queryKey: Api.people.getBindedQueryKeyPrefix() }),
              ]);
          }
        }),
      );
    },
  });
}
