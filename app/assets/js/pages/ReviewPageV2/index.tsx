import React from "react";

import { PageModule } from "@/routes/types";
import { loader, useLoadedData } from "./loader";
import { ReviewPageV2 } from "turboui";

export default { name: "ReviewPageV2", loader, Page } as PageModule;

function Page() {
  const data = useLoadedData();

  return <ReviewPageV2 {...data} />;
}
