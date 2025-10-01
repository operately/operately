import React from "react";

import { PageModule } from "@/routes/types";
import { loader, useLoadedData } from "./loader";
import { ReviewPageV2 } from "turboui";

export default { name: "ReviewPageV2", loader, Page } as PageModule;

function Page() {
  const data = useLoadedData();
  const assignmentsCount = data.assignmentsCount ?? data.assignments?.length ?? 0;

  // TODO: map API assignments to ReviewPageV2 once the new design is integrated with the backend.
  return <ReviewPageV2 assignments={[]} assignmentsCount={assignmentsCount} />;
}
