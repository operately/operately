import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "turboui";
import { usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./form";

export function Page() {
  const { file } = useLoadedData();
  const paths = usePaths();

  return (
    <Pages.Page title="Edit File">
      <Paper.Root>
        <ResourcePageNavigation
          resource={file}
          paths={{
            spacePath: paths.spacePath,
            resourceHubPath: paths.resourceHubPath,
            resourceHubFolderPath: paths.resourceHubFolderPath,
          }}
        />

        <Paper.Body>
          <Form file={file} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
