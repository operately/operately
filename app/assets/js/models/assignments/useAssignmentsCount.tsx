import Api from "@/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAssignmentsCount as useAssignmentCountChangeSignal } from "@/signals";

export function useAssignmentsCount() {
  const client = useQueryClient();
  const { data } = useQuery(Api.people.getAssignmentsCountQueryOptions({}));
  const refresh = useCallback(() => {
    // Review can be cached while another page changes an assignment.
    void Promise.all([
      client.invalidateQueries({ queryKey: Api.people.getAssignmentsCountQueryKeyPrefix() }),
      client.invalidateQueries({ queryKey: Api.people.listAssignmentsQueryKeyPrefix() }),
    ]);
  }, [client]);

  useAssignmentCountChangeSignal(refresh);

  return [data?.count ?? 0, refresh] as const;
}
