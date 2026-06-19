import React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "turboui";
import { resourceHubNavigationPaths } from "@/models/resourceHubs";
import { usePaths } from "@/routes/paths";
import { Form } from "./form";
import { useLoadedData } from "./loader";
import { buildNavigationDocument } from "./navigation";

export function Page() {
  const { document } = useLoadedData();
  const paths = usePaths();
  const navigationDocument = buildNavigationDocument(document);

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
