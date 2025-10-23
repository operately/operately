import * as Pages from "@/components/Pages";
import { ReviewAssignment, getAssignments } from "@/models/assignments";

interface LoaderResult {
  assignments: ReviewAssignment[];
  assignmentsCount: number;

  myWork: ReviewAssignment[];
  forReview: ReviewAssignment[];
}

export async function loader(): Promise<LoaderResult> {
  const data = await getAssignments({});

  const assignments = data.assignments || [];

  const myWork = assignments.filter((a) => a.type === "project" || a.type === "goal");
  const forReview = assignments.filter((a) => a.type === "check_in" || a.type === "goal_update");

  return {
    assignments: assignments,
    assignmentsCount: assignments.length,

    myWork,
    forReview,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
