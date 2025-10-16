import * as React from "react";
import * as Pages from "@/components/Pages";
import { ReviewAssignmentV2, getAssignmentsV2 } from "@/models/assignments";
import { PageModule } from "@/routes/types";
import { ReviewPageV2 } from "turboui";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

export default { name: "ReviewV2Page", loader, Page } as PageModule;

function Page() {
  const { assignments } = Pages.useLoadedData() as LoaderResult;

  return <ReviewPageV2 assignments={assignments} assignmentsCount={assignments.length} showUpcomingSection={false} />;
}

interface LoaderResult {
  assignments: ReviewAssignmentV2[];
}

async function loader({ params }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId });
  await redirectIfFeatureNotEnabled(params, { feature: "review_v2", path: paths.reviewPath() });

  return {
    assignments: await getAssignmentsV2({}).then((res) => res.assignments),
  };
}
