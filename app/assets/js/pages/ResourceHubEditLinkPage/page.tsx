import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "turboui";
import { resourceHubNavigationPaths } from "@/models/resourceHubs";
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
          paths={resourceHubNavigationPaths(paths)}
        />

        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
