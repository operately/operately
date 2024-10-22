import { useGetAssignmentsCount } from "@/api";
import { useAssignmentsCount as useAssignmentCountChangeSignal } from "@/signals";

export function useAssignmentsCount() {
  const { data, refetch } = useGetAssignmentsCount({});

  useAssignmentCountChangeSignal(refetch);

  return [data?.count || 0, refetch] as const;
}
