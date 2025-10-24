import { getAssignmentsCount, useQuery } from "@/api";
import { useAssignmentsCount as useAssignmentCountChangeSignal } from "@/signals";

export function useAssignmentsCount() {
  const { data, refetch } = useQuery(() => getAssignmentsCount({}));

  useAssignmentCountChangeSignal(refetch);

  return [data?.count || 0, refetch] as const;
}
