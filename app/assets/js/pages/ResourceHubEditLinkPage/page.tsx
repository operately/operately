import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "turboui";
import { resourceHubNavigationPaths } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import { useLoadedData } from "./loader";
import { Form } from "./form";
import { buildNavigationLink } from "./navigation";

export function Page() {
  const { link } = useLoadedData();
  const paths = usePaths();
  const navigationLink = buildNavigationLink(link);

  return (
    <Pages.Page title="Edit Link">
      <Paper.Root>
        <ResourcePageNavigation
          resource={navigationLink}
          paths={resourceHubNavigationPaths(paths)}
        />

        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
