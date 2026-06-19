import React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "turboui";
import { resourceHubNavigationPaths, resourceHubWithParentContext } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import { Form } from "./form";
import { useLoadedData } from "./loader";

export function Page() {
  const { document } = useLoadedData();
  const paths = usePaths();
  const navigationDocument = {
    ...document,
    resourceHub: resourceHubWithParentContext(document.resourceHub, {
      space: document.space,
      project: document.project,
      goal: document.goal,
    }),
  };

  return (
    <Pages.Page title="Edit Document">
      <Paper.Root>
        <ResourcePageNavigation
          resource={navigationDocument}
          paths={resourceHubNavigationPaths(paths)}
        />

        <Paper.Body>
          <Form document={document} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
