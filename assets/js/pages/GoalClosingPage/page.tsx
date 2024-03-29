import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";

import { useLoadedData } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={"Closing " + goal.name}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/goals/${goal.id}`}>{goal.name}</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Mark this goal as complete?</div>
          <div className="text-content text font-medium mt-2">
            The goal will marked as complete and no longer be available for updates.
          </div>

          <div className="flex items-center gap-6 mt-8">
            <ArchiveButton goal={goal} />
            <DimmedLink to={`/goals/${goal.id}`}>Cancel</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ArchiveButton({ goal }) {
  const navigateToGoal = useNavigateTo(`/goals/${goal.id}`);

  const [close, { loading: loading }] = Goals.useCloseGoalMutation({
    variables: {
      goalId: goal.id,
    },
    onCompleted: () => navigateToGoal(),
  });

  return (
    <FilledButton onClick={close} testId="confirm-archive-goal" loading={loading}>
      Mark as Complete
    </FilledButton>
  );
}
