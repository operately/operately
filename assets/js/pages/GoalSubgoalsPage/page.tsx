import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Navigation } from "@/features/goals/GoalPageNavigation";
import { Header } from "@/features/goals/GoalPageHeader";
import { GoalTree } from "@/features/goals/GoalTree";

import { useLoadedData } from "./loader";

export function Page() {
  const { goal, goals, projects } = useLoadedData();

  return (
    <Pages.Page title={[goal.name]}>
      <Paper.Root fluid>
        <Navigation space={goal.space} />

        <Paper.Body minHeight="none">
          <Header goal={goal} activeTab="subgoals" />

          <div className="mt-4" />

          <GoalTree goals={goals} projects={projects} filters={{ parentGoalId: goal.id }} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
