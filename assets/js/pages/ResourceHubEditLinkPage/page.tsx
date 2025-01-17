import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { LinkPageNavigation } from "@/features/ResourceHub";
import { useLoadedData } from "./loader";
import { Form } from "./form";

export function Page() {
  const { link } = useLoadedData();

  return (
    <Pages.Page title="Edit Link">
      <Paper.Root>
        <LinkPageNavigation link={link} />

        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
