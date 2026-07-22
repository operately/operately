import React from "react";

import { Page as TurboUIPage } from "turboui";
import { usePaths } from "@/routes/paths";
import { Form } from "./form";
import { useLoadedData } from "./loader";
import { buildNewDocumentPageNavigation } from "./navigation";

export function Page() {
  const { resourceHub, folder } = useLoadedData();
  const paths = usePaths();

  return (
    <TurboUIPage
      title="New Document"
      size="medium"
      navigation={buildNewDocumentPageNavigation(resourceHub, folder, paths)}
      testId="resource-hub-new-document-page"
    >
      <div className="px-12 py-10">
        <Form />
      </div>
    </TurboUIPage>
  );
}
