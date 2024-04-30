import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Paper from "@/components/PaperContainer";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";

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

  return (
    <Pages.Page title={["Edit Timeframe", goal.name]}>
      <Paper.Root size="medium">
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body minHeight="300px">
          <div className="text-content-accent text-2xl font-extrabold mb-8">Editing the Goal's Timeframe</div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
