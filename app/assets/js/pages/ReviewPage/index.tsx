import * as React from "react";
import * as Pages from "@/components/Pages";
import { ReviewAssignment, getAssignments } from "@/models/assignments";
import { PageModule } from "@/routes/types";
import { ReviewPage } from "turboui";

export default { name: "ReviewPage", loader, Page } as PageModule;

function Page() {
  const { assignments } = Pages.useLoadedData() as LoaderResult;

  return <ReviewPage assignments={assignments} assignmentsCount={assignments.length} showUpcomingSection={false} />;
}

interface LoaderResult {
  assignments: ReviewAssignment[];
}

async function loader(): Promise<LoaderResult> {
  return {
    assignments: await getAssignments({}).then((res) => res.assignments),
  };
}
