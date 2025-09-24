import React from "react";

import { PageModule } from "@/routes/types";
import { loader, useLoadedData } from "./loader";
import { ReviewPage } from "turboui";

export default { name: "ReviewPage", loader, Page } as PageModule;

function Page() {
  const data = useLoadedData();

  return <ReviewPage {...data} />;
}
