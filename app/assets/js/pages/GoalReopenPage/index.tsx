import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { PageModule } from "@/routes/types";
import * as React from "react";

import { Form } from "./Form";
import { loader, useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export default { name: "GoalReopenPage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={"Reopen " + goal.name}>
      <Paper.Root>
        <Paper.Navigation items={[{ to: paths.goalPath(goal.id), label: goal.name }]} />

        <Paper.Body>
          <Title />
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  return <div className="text-content-accent text-3xl font-extrabold">Reopening Goal</div>;
}
