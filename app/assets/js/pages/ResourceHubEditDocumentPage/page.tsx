import React from "react";

import { Page as TurboUIPage } from "turboui";
import { usePaths } from "@/routes/paths";
import { Form } from "./form";
import { useLoadedData } from "./loader";
import { buildEditDocumentPageNavigation } from "./navigation";

export function Page() {
  const { document } = useLoadedData();
  const paths = usePaths();

  return (
    <TurboUIPage
      title="Edit Document"
      size="medium"
      navigation={buildEditDocumentPageNavigation(document, paths)}
      testId="resource-hub-edit-document-page"
    >
      <div className="px-12 py-10">
        <Form document={document} />
      </div>
    </TurboUIPage>
  );
}
