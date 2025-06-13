import React from "react";

import { MiniWorkMap } from "turboui";

import { Spacer } from "@/components/Spacer";
import { DeprecatedPaths } from "@/routes/paths";
import { SecondaryButton } from "turboui";

import { assertPresent } from "@/utils/assertions";
import { DisableInEditMode, Title } from "./components";
import { useLoadedData } from "./loader";
import { useWorkItems } from "./useWorkItems";

export function RelatedWork() {
  const { goal } = useLoadedData();
  const items = useWorkItems();

  assertPresent(goal.space, "space must be present in goal");

  const newGoalPath = DeprecatedPaths.goalNewPath({ parentGoalId: goal.id! });
  const newProjectPath = DeprecatedPaths.newProjectPath({ goalId: goal.id!, spaceId: goal.space.id! });

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
