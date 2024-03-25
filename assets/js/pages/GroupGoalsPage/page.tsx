import React from "react";

import { GhostButton } from "@/components/Button";
import { GroupPageNavigation } from "@/components/GroupPageNavigation";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import { createPath } from "@/utils/paths";
import { useLoadedData, useTimeframeControles } from "./loader";
import { GoalTree } from "@/features/GoalTree";

export function Page() {
  const { group } = useLoadedData();

  return (
    <Pages.Page title={group.name}>
      <Paper.Root fluid>
        <Paper.Body minHeight="500px">
          <GroupPageNavigation group={group} activeTab="goals" />
          <Content />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Content() {
  const { group, goals } = useLoadedData();
  const [timeframe, next, prev] = useTimeframeControles();
  const newGoalPath = createPath("spaces", group.id, "goals", "new");

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="font-extrabold text-3xl">Goals in {group.name}</div>
        <GhostButton type="primary" size="sm" linkTo={newGoalPath} testId="add-goal">
          Add Goal
        </GhostButton>
      </div>

      <GoalTree goals={goals} timeframe={timeframe} nextTimeframe={next} prevTimeframe={prev} />
    </>
  );
}
