import * as React from "react";
import * as Pages from "@/components/Pages";
import { ReviewAssignmentV2, getAssignmentsV2 } from "@/models/assignments";
import { PageModule } from "@/routes/types";
import { ReviewPageV2 } from "turboui";

export default { name: "ReviewV2Page", loader, Page } as PageModule;

function Page() {
  const { assignments } = Pages.useLoadedData() as LoaderResult;

  return <ReviewPageV2 assignments={assignments} assignmentsCount={assignments.length} showUpcomingSection={false} />;
}

interface LoaderResult {
  assignments: ReviewAssignmentV2[];
}

async function loader(): Promise<LoaderResult> {
  return {
    assignments: await getAssignmentsV2({}).then((res) => res.assignments),
  };
}
