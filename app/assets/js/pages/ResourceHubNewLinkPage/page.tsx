import React from "react";

import { Page as TurboUIPage } from "turboui";
import { usePaths } from "@/routes/paths";
import { Form } from "./form";
import { useLoadedData } from "./loader";
import { buildNewLinkPageNavigation } from "./navigation";

export function Page() {
  const { resourceHub, folder } = useLoadedData();
  const paths = usePaths();

  return (
    <TurboUIPage
      title="New Link"
      size="medium"
      navigation={buildNewLinkPageNavigation(resourceHub, folder, paths)}
      testId="resource-hub-new-link-page"
    >
      <div className="px-12 py-10">
        <Form />
      </div>
    </TurboUIPage>
  );
}
