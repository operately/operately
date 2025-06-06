import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Paths } from "@/routes/paths";
import { ActiveSubitemsWarning } from "./ActiveSubitemsWarning";

import { useLoadedData } from "./loader";
import { Form } from "./Form";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={"Closing " + goal.name}>
      <Paper.Root>
        <Navigation />

        <Paper.Body minHeight="none">
          <PageTitle />
          <ActiveSubitemsWarning />
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  const { goal } = useLoadedData();

  return <Paper.Navigation items={[{ to: Paths.goalPath(goal.id!), label: goal.name! }]} />;
}

function PageTitle() {
  return <div className="mb-6 text-content-accent text-2xl font-extrabold">Review &amp; Close Goal</div>;
}
