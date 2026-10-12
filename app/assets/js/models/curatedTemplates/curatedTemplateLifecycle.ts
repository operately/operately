import Api from "@/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateGoalLifecycleQueries } from "../goals/goalLifecycle";
import { invalidateProjectLifecycleQueries } from "../projects/projectLifecycle";
import { invalidateKpiQueries } from "../kpis/kpiLifecycle";

export function useInstantiateTemplate() {
  const client = useQueryClient();
  return useMutation({
    ...Api.curated_templates.instantiateMutationOptions(),
    onSuccess: async (result) => {
      switch (result.resourceType) {
        case "goal":
          await invalidateGoalLifecycleQueries(client, result.resourceId);
          break;
        case "project":
          await invalidateProjectLifecycleQueries(client);
          break;
        case "kpi":
          await invalidateKpiQueries(client);
          break;
      }
    },
  });
}
