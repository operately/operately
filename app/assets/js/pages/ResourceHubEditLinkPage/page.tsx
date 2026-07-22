import React from "react";

import { Page as TurboUIPage } from "turboui";
import { usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./form";
import { buildEditLinkPageNavigation } from "./navigation";

export function Page() {
  const { link } = useLoadedData();
  const paths = usePaths();

  return (
    <TurboUIPage
      title="Edit Link"
      size="medium"
      navigation={buildEditLinkPageNavigation(link, paths)}
      testId="resource-hub-edit-link-page"
    >
      <div className="px-12 py-10">
        <Form />
      </div>
    </TurboUIPage>
  );
}
