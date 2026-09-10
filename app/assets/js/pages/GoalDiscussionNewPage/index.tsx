import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { loader, useLoadedData } from "./loader";
import { PageModule } from "@/routes/types";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { Form } from "./Form";

export default { name: "GoalDiscussionNewPage", loader, Page } as PageModule;

function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={["New Discussion", goal.name]}>
      <Paper.Root>
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body>
          <Form goal={goal} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
