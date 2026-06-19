import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { Form } from "./Form";
import { Navigation } from "./navigation";

export function Page() {
  const { checkIn } = useLoadedData();
  assertPresent(checkIn.project, "Check-in project must be defined");

  return (
    <Pages.Page title={["Edit Project Check-In", checkIn.project.name]}>
      <Paper.Root>
        <Navigation />

        <Paper.Body>
          <Form checkIn={checkIn} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
