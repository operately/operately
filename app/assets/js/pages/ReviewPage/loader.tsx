import * as Pages from "@/components/Pages";
import { ReviewAssignment, getAssignments } from "@/models/assignments";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  assignments: ReviewAssignment[];
  assignmentsCount: number;

  myWork: ReviewAssignment[];
  forReview: ReviewAssignment[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId });
  await redirectIfFeatureEnabled(params, { feature: "review_v2", path: paths.reviewV2Path() });

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
