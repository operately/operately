import * as React from "react";
import * as Pages from "@/components/Pages";
import { ReviewAssignmentGroup, listAssignments } from "@/models/assignments";
import { PageModule } from "@/routes/types";
import { ReviewPage } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export default { name: "ReviewPage", loader, Page } as PageModule;

function Page() {
  const data = Pages.useLoadedData() as LoaderResult;
  const formattedTimePreferences = useFormattedTimePreferences();

  return (
    <ReviewPage
      dueSoon={data.dueSoon}
      needsReview={data.needsReview}
      upcoming={data.upcoming}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}

interface LoaderResult {
  dueSoon: ReviewAssignmentGroup[];
  needsReview: ReviewAssignmentGroup[];
  upcoming: ReviewAssignmentGroup[];
}

async function loader(): Promise<LoaderResult> {
  return await listAssignments({});
}
