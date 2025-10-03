import React from "react";
import { getAssignmentsCount, getAssignmentsCountV2, useQuery } from "@/api";
import { useAssignmentsCount as useAssignmentCountChangeSignal } from "@/signals";

export function useAssignmentsCount({ v2 }: { v2: boolean }) {
  const fetchFn = React.useCallback(() => {
    return v2 ? getAssignmentsCountV2({}) : getAssignmentsCount({});
  }, [v2]);

  const { data, refetch } = useQuery(fetchFn);

  useAssignmentCountChangeSignal(refetch);

  return [data?.count || 0, refetch] as const;
}
