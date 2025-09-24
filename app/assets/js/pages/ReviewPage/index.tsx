import React from "react";

import { PageModule } from "@/routes/types";
import { loader, useLoadedData } from "./loader";
import { ReviewPage } from "turboui";

export default { name: "ReviewPage", loader, Page } as PageModule;

function Page() {
  const { assignments, assignmentsCount, myWork, forReview } = useLoadedData();

  return (
    <ReviewPage assignments={assignments} assignmentsCount={assignmentsCount} myWork={myWork} forReview={forReview} />
  );
}
