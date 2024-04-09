import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { createPath } from "@/utils/paths";
import { useLoadedData } from "./loader";
import { GoalTree } from "@/features/goals/GoalTree";
import { FilledButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";

export function Page() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root fluid>
        <Paper.Body minHeight="500px">
          <GroupPageNavigation group={group} activeTab="goals" margins="-mx-12 -mt-10" />
          <Content />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Content() {
  const { group, goals, projects } = useLoadedData();
  const newGoalPath = createPath("spaces", group.id, "goals", "new");

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="font-extrabold text-3xl">Goals in {group.name}</div>
        <FilledButton type="primary" size="sm" linkTo={newGoalPath} testId="add-goal">
          Add Goal
        </FilledButton>
      </div>

      <GoalTree goals={goals} projects={projects} options={{ spaceId: group.id }} />
    </>
  );
}
