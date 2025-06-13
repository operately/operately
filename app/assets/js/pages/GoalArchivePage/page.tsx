import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as React from "react";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useLoadedData } from "./loader";

import { DimmedLink, PrimaryButton } from "turboui";

import { usePaths } from "@/routes/paths";
export function Page() {
  const paths = usePaths();
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={["Archiving ", goal.name!]}>
      <Paper.Root size="small">
        <Paper.Navigation items={[{ to: paths.goalPath(goal.id!), label: goal.name! }]} />

        <Paper.Body minHeight="none">
          <div className="text-content-accent text-3xl font-extrabold">Archive this goal?</div>
          <div className="text-content text font-medium mt-2">
            The goal will be kept for record keeping, but it won't be displayed on any space.
          </div>

          <div className="flex items-center gap-6 mt-8">
            <ArchiveButton goal={goal} />
            <DimmedLink to={paths.goalPath(goal.id!)}>Cancel</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ArchiveButton({ goal }) {
  const navigateToGoal = useNavigateTo(paths.goalPath(goal.id!));

  const [archive, { loading: loading }] = Goals.useArchiveGoal();

  const submit = async () => {
    await archive({ goalId: goal.id });
    navigateToGoal();
  };

  return (
    <PrimaryButton onClick={submit} testId="confirm-archive-goal" loading={loading}>
      Archive the Goal
    </PrimaryButton>
  );
}
