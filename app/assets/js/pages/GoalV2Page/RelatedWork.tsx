import React from "react";

import { MiniWorkMap } from "turboui";

import { Spacer } from "@/components/Spacer";
import { SecondaryButton } from "turboui";

import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { DisableInEditMode, Title } from "./components";
import { useLoadedData } from "./loader";
import { useWorkItems } from "./useWorkItems";

export function RelatedWork() {
  const items = useWorkItems();
  const paths = usePaths();
  const { goal } = useLoadedData();

  assertPresent(goal.space, "space must be present in goal");

  const newGoalPath = paths.goalNewPath({ parentGoalId: goal.id! });
  const newProjectPath = paths.newProjectPath({ goalId: goal.id!, spaceId: goal.space.id! });

  return (
    <DisableInEditMode>
      <Title title="Related Work" />
      <Spacer size={2} />
      <MiniWorkMap items={items} />

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
