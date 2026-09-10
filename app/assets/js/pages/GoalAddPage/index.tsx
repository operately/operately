import React from "react";

import { Paths, usePaths } from "@/routes/paths";
import { GoalAddPage, SpaceField } from "turboui";

import { PageModule } from "@/routes/types";
import { loader, useLoadedData } from "./loader";
import { PageCache } from "@/routes/PageCache";
import { pageCacheKey as goalPageCacheKey } from "@/pages/GoalPage";
import { useNavigate } from "react-router";
import { GoalAddForm } from "turboui/src/GoalAddForm";
import { accessLevelAsNumber } from "../../models/goals";

import * as Goals from "@/models/goals";
import * as Spaces from "@/models/spaces";
import { useSpaceSearch } from "@/models/spaces";

export default { name: "GoalAddPage", loader, Page } as PageModule;

export interface UrlParams {
  parentGoalId?: string;
  spaceId?: string;
}

function Page() {
  const { space, parentGoal } = useLoadedData();

  const paths = usePaths();
  const save = useSaveGoal();
  const onSuccess = useOnSuccess();
  const spaceSearch = useSpaceSearch({ accessLevel: "edit_access" });

  return (
    <GoalAddPage
      spaceSearch={spaceSearch}
      save={save}
      onSuccess={onSuccess}
      space={prepareSpace(paths, space)}
      parentGoal={prepareParentGoal(paths, parentGoal)}
    />
  );
}

function useSaveGoal(): (props: GoalAddForm.SaveProps) => Promise<{ id: string }> {
  const { parentGoal } = useLoadedData();
  const create = Goals.useCreateGoal();

  return (props: GoalAddForm.SaveProps) => {
    return create
      .mutateAsync({
        name: props.name,
        spaceId: props.spaceId,
        anonymousAccessLevel: 0,
        companyAccessLevel: accessLevelAsNumber(props.accessLevels.company),
        spaceAccessLevel: accessLevelAsNumber(props.accessLevels.space),
        parentGoalId: parentGoal ? parentGoal.id : undefined,
      })
      .then((response) => {
        if (!response.goal) {
          throw new Error("Created goal is unavailable");
        }
        if (parentGoal) {
          // Keep the parent page fresh until GoalPage migrates from PageCache.
          PageCache.invalidate(goalPageCacheKey(parentGoal.id));
        }
        return { id: response.goal.id };
      });
  };
}

function useOnSuccess(): (id: string) => void {
  const paths = usePaths();
  const navigate = useNavigate();

  return (id: string) => {
    navigate(paths.goalPath(id));
  };
}

function prepareSpace(paths: Paths, space: Spaces.Space | null): SpaceField.Space | null {
  if (!space) return null;

  return {
    ...space,
    link: paths.spacePath(space.id),
  };
}

function prepareParentGoal(paths: Paths, goal: Goals.Goal | null): GoalAddForm.ParentGoal | null {
  return Goals.parseParentGoalForTurboUi(paths, goal);
}
