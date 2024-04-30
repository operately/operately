import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId }),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();
  const goalPath = Paths.goalPath(goal.id);

  return (
    <Pages.Page title={["Edit", goal.name]}>
      <Paper.Root size="medium">
        <Paper.Navigation>
          <Paper.NavItem linkTo={goalPath}>{goal.name}</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="300px">
          <div className="text-content-accent text-2xl font-extrabold mb-8">Editing the Goal's Timeframe</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
