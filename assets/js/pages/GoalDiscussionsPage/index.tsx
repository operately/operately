import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";
import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { FilledButton } from "@/components/Button";

interface LoaderResult {
  goal: Goals.Goal;
}

export const loader = async function ({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId }),
  };
};

export const Page = function () {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root size="large">
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="discussions" />

          <div className="flex items-start my-4">
            <FilledButton size="xxs" linkTo={Paths.newGoalDiscussionPath(goal.id)}>
              New Discussion
            </FilledButton>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
};
