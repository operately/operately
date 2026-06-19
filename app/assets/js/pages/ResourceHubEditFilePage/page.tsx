import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "turboui";
import { resourceHubNavigationPaths, resourceHubWithParentContext } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./form";

export function Page() {
  const { file } = useLoadedData();
  const paths = usePaths();
  const navigationFile = {
    ...file,
    resourceHub: resourceHubWithParentContext(file.resourceHub, {
      space: file.space,
      project: file.project,
      goal: file.goal,
    }),
  };

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
