import { useCreateGoal } from "@/api";
import React from "react";

import { Paths, usePaths } from "@/routes/paths";
import { GoalAddPage, SpaceField } from "turboui";

import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router-dom";
import { GoalAddForm } from "turboui/src/GoalAddForm";
import { accessLevelAsNumber } from "../../models/goals";

import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Spaces from "@/models/spaces";
import { useSpaceSearch } from "@/models/spaces";

export default { name: "GoalAddPage", loader, Page } as PageModule;

export interface UrlParams {
  parentGoalId?: string;
  spaceId?: string;
}

interface LoaderResult {
  space: Spaces.Space | null;
  parentGoal: Goals.Goal | null;
}

async function loader({ request }): Promise<LoaderResult> {
  const searchParams = new URL(request.url).searchParams;

  const parentGoalId = searchParams.get("parentGoalId") || undefined;
  const spaceID = searchParams.get("spaceId") || undefined;

  let data: LoaderResult = {
    space: null,
    parentGoal: null,
  };

  if (spaceID) {
    data.space = await Spaces.getSpace({ id: spaceID });
  }

  if (parentGoalId) {
    data.parentGoal = await Goals.getGoal({ id: parentGoalId }).then((data) => data.goal);
  }

  return data;
}

function Page() {
  const { space, parentGoal } = Pages.useLoadedData<LoaderResult>();

  const paths = usePaths();
  const save = useSaveGoal();
  const onSuccess = useOnSuccess();
  const spaceSearch = useSpaceSearch();

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
  const { parentGoal } = Pages.useLoadedData<LoaderResult>();
  const [create] = useCreateGoal();

  return (props: GoalAddForm.SaveProps) => {
    return create({
      name: props.name,
      spaceId: props.spaceId,
      anonymousAccessLevel: 0,
      companyAccessLevel: accessLevelAsNumber(props.accessLevels.company),
      spaceAccessLevel: accessLevelAsNumber(props.accessLevels.space),
      parentGoalId: parentGoal ? parentGoal.id : undefined,
    }).then((response) => {
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
