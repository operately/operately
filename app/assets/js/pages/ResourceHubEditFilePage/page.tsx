import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "turboui";
import { resourceHubNavigationPaths } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./form";
import { buildNavigationFile } from "./navigation";

export function Page() {
  const { file } = useLoadedData();
  const paths = usePaths();
  const navigationFile = buildNavigationFile(file);

  return (
    <Pages.Page title="Edit File">
      <Paper.Root>
        <ResourcePageNavigation
          resource={navigationFile}
          paths={resourceHubNavigationPaths(paths)}
        />

        <Paper.Body>
          <Form file={file} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
