import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { useLoadedData } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={["Archiving ", goal.name!]}>
      <Paper.Root size="small">
        <Paper.Navigation>
          <Paper.NavItem linkTo={Paths.goalPath(goal.id!)}>{goal.name}</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Archive this goal?</div>
          <div className="text-content text font-medium mt-2">
            The goal will be kept for record keeping, but it won't be displayed on any space.
          </div>

          <div className="flex items-center gap-6 mt-8">
            <ArchiveButton goal={goal} />
            <DimmedLink to={Paths.goalPath(goal.id!)}>Cancel</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ArchiveButton({ goal }) {
  const navigateToGoal = useNavigateTo(Paths.goalPath(goal.id!));

  const [archive, { loading: loading }] = Goals.useArchiveGoalMutation({
    variables: {
      goalId: goal.id,
    },
    onCompleted: () => navigateToGoal(),
  });

  return (
    <FilledButton onClick={archive} testId="confirm-archive-goal" loading={loading}>
      Archive the Goal
    </FilledButton>
  );
}
