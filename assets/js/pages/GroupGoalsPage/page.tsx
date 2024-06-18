import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { createPath } from "@/utils/paths";
import { useLoadedData } from "./loader";
import { GoalTree } from "@/features/goals/GoalTree";
import { FilledButton } from "@/components/Button";
import { SpacePageNavigation } from "@/components/SpacePageNavigation";

export function Page() {
  const { space } = useLoadedData();

  return (
    <Pages.Page title={space.name!}>
      <Paper.Root fluid>
        <Paper.Body minHeight="500px">
          <SpacePageNavigation space={space} activeTab="goals" />
          <Content />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Content() {
  const { space, goals, projects } = useLoadedData();
  const newGoalPath = createPath("spaces", space.id, "goals", "new");

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="font-extrabold text-3xl">Goals in {space.name}</div>
        <FilledButton type="primary" size="sm" linkTo={newGoalPath} testId="add-goal">
          Add Goal
        </FilledButton>
      </div>

      <GoalTree goals={goals} projects={projects} options={{ spaceId: space.id! }} />
    </>
  );
}
