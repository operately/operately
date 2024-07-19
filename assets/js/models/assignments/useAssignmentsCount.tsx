import { useGetAssignmentsCount } from "@/api";
import { useAssignmentsCount as useAssignmentCountChangeSignal } from "@/api/socket";


export function useAssignmentsCount() {
  const { data, refetch } = useGetAssignmentsCount({});
  
  useAssignmentCountChangeSignal(refetch);

  return data?.count || 0;
}
