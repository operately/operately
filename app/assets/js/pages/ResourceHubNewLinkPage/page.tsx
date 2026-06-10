import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { NewResourcePageNavigation } from "turboui";
import { usePaths } from "@/routes/paths";
import { Form } from "./form";
import { useLoadedData } from "./loader";

export function Page() {
  const { resourceHub, folder } = useLoadedData();
  const paths = usePaths();

  return (
    <Pages.Page title="New Link">
      <Paper.Root>
        <NewResourcePageNavigation
          resourceHub={resourceHub}
          folder={folder}
          paths={{
            spacePath: paths.spacePath,
            resourceHubPath: paths.resourceHubPath,
            resourceHubFolderPath: paths.resourceHubFolderPath,
          }}
        />

        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
