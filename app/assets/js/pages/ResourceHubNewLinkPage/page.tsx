import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { NewResourcePageNavigation } from "@/features/ResourceHub";
import { Form } from "./form";
import { useLoadedData } from "./loader";

export function Page() {
  const { resourceHub, folder } = useLoadedData();

  return (
    <Pages.Page title="New Link">
      <Paper.Root>
        <NewResourcePageNavigation resourceHub={resourceHub} folder={folder} />

        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
