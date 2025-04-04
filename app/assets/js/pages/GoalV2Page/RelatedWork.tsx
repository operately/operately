import React from "react";

import { MinimalTree } from "@/features/goals/GoalTree";
import { Spacer } from "@/components/Spacer";
import { SecondaryButton } from "turboui";
import { Paths } from "@/routes/paths";

import { DisableInEditMode, Title } from "./components";
import { useLoadedData } from "./loader";
import { assertPresent } from "@/utils/assertions";

export function RelatedWork() {
  const { goal, goals, projects } = useLoadedData();

  assertPresent(goal.space, "space must be present in goal");

  const newGoalPath = Paths.goalNewPath({ parentGoalId: goal.id! });
  const newProjectPath = Paths.newProjectPath({ goalId: goal.id!, spaceId: goal.space.id! });

  return (
    <DisableInEditMode>
      <Title title="Related Work" />
      <Spacer size={2} />
      <MinimalTree
        goals={goals}
        projects={projects}
        options={{ goalId: goal.id! }}
        settingsNamespace={`goal-${goal.id}-subgoals`}
      />

      <div className="flex items-center gap-2 mt-6">
        <SecondaryButton linkTo={newGoalPath} size="xs">
          Add subgoal
        </SecondaryButton>
        <SecondaryButton linkTo={newProjectPath} size="xs">
          Start project
        </SecondaryButton>
      </div>
    </DisableInEditMode>
  );
}
