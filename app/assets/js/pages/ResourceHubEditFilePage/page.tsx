import React from "react";

import { Page as TurboUIPage } from "turboui";
import { usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./form";
import { buildEditFilePageNavigation } from "./navigation";

export function Page() {
  const { file } = useLoadedData();
  const paths = usePaths();

  return (
    <TurboUIPage
      title="Edit File"
      size="medium"
      navigation={buildEditFilePageNavigation(file, paths)}
      testId="resource-hub-edit-file-page"
    >
      <div className="px-12 py-10">
        <Form file={file} />
      </div>
    </TurboUIPage>
  );
}
