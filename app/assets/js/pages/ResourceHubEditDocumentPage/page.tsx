import React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "turboui";
import { usePaths } from "@/routes/paths";
import { Form } from "./form";
import { useLoadedData } from "./loader";

export function Page() {
  const { document } = useLoadedData();
  const paths = usePaths();

  return (
    <Pages.Page title="Edit Document">
      <Paper.Root>
        <ResourcePageNavigation
          resource={document}
          paths={{
            spacePath: paths.spacePath,
            resourceHubPath: paths.resourceHubPath,
            resourceHubFolderPath: paths.resourceHubFolderPath,
          }}
        />

        <Paper.Body>
          <Form document={document} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
