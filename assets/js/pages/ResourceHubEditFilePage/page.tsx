import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { FilePageNavigation } from "@/features/ResourceHub";
import { useLoadedData } from "./loader";
import { Form } from "./form";

export function Page() {
  const { file } = useLoadedData();

  return (
    <Pages.Page title="Edit File">
      <Paper.Root>
        <FilePageNavigation file={file} />

        <Paper.Body>
          <Form file={file} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
