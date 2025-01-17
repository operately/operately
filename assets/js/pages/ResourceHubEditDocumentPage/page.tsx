import React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Form } from "./form";
import { useLoadedData } from "./loader";
import { ResourcePageNavigation } from "@/features/ResourceHub";

export function Page() {
  const { document } = useLoadedData();

  return (
    <Pages.Page title="Edit Document">
      <Paper.Root>
        <ResourcePageNavigation resource={document} />

        <Paper.Body>
          <Form document={document} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
