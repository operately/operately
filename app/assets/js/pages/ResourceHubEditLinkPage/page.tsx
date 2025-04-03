import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ResourcePageNavigation } from "@/features/ResourceHub";
import { useLoadedData } from "./loader";
import { Form } from "./form";

export function Page() {
  const { link } = useLoadedData();

  return (
    <Pages.Page title="Edit Link">
      <Paper.Root>
        <ResourcePageNavigation resource={link} />

        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
