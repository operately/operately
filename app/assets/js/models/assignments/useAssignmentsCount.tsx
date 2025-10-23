import { getAssignmentsCountV2, useQuery } from "@/api";
import { useAssignmentsCount as useAssignmentCountChangeSignal } from "@/signals";

export function useAssignmentsCount() {
  const { data, refetch } = useQuery(() => getAssignmentsCountV2({}));

  useAssignmentCountChangeSignal(refetch);

  return [data?.count || 0, refetch] as const;
}
