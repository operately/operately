import * as Pages from "@/components/Pages";
import { ReviewAssignment, getAssignments } from "@/models/assignments";

interface LoaderResult {
  assignments: ReviewAssignment[];
  assignmentsCount: number;
}

export async function loader() : Promise<LoaderResult> {
  const data = await getAssignments({});
  
  return {
    assignments: data.assignments || [],
    assignmentsCount: data.assignments?.length || 0,
  }
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}