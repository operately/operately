import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { NewResourcePageNavigation } from "turboui";
import { resourceHubNavigationPaths } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import { Form } from "./form";
import { useLoadedData } from "./loader";
import { buildNavigationResourceHub } from "./navigation";

export function Page() {
  const { resourceHub, folder } = useLoadedData();
  const paths = usePaths();
  const navigationResourceHub = buildNavigationResourceHub(resourceHub);

  return (
    <Pages.Page title="New Document">
      <Paper.Root>
        <NewResourcePageNavigation
          resourceHub={navigationResourceHub}
          folder={folder}
          paths={resourceHubNavigationPaths(paths)}
        />

        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
