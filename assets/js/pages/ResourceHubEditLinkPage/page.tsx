import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData } from "./loader";
import { Form } from "./form";

export function Page() {
  return (
    <Pages.Page title="Edit Link">
      <Paper.Root>
        <Navigation />
        <Paper.Body>
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { link } = useLoadedData();

  return (
    <Paper.Navigation>
      <Paper.NavLinkLink link={link} />
    </Paper.Navigation>
  );
}
