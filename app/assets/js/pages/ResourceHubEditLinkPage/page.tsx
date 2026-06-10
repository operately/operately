import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "turboui";
import { usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./form";

export function Page() {
  const { link } = useLoadedData();
  const paths = usePaths();

  return (
    <Pages.Page title="Edit Link">
      <Paper.Root>
        <ResourcePageNavigation
          resource={link}
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
