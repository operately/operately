import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { Form } from "./Form";

export function Page() {
  const { checkIn } = useLoadedData();

  return (
    <Pages.Page title={["Edit Project Check-In", checkIn.project!.name!]}>
      <Paper.Root>
        <Paper.Body>
          <Form checkIn={checkIn} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
