import * as React from "react";
import { loader, useLoadedData } from "./loader";
import { PageModule } from "@/routes/types";
import { ReviewPage } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";

export default { name: "ReviewPage", loader, Page } as PageModule;

function Page() {
  const data = useLoadedData();
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
