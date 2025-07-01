import Api, { useCreateGoal } from "@/api";
import React from "react";

import { usePaths } from "@/routes/paths";
import { GoalAddPage, SpaceField } from "turboui";

import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router-dom";
import { GoalAddForm } from "turboui/src/GoalAddForm";
import { emptyLoader } from "../../components/Pages";
import { accessLevelAsNumber } from "../../models/goals";

export default { name: "GoalAddPage", loader: emptyLoader, Page } as PageModule;

function Page() {
  const save = useSaveGoal();
  const onSuccess = useOnSuccess();
  const spaceSearch = useSpaceSearch();

  return <GoalAddPage spaceSearch={spaceSearch} save={save} onSuccess={onSuccess} />;
}

function useSaveGoal(): (props: GoalAddForm.SaveProps) => Promise<{ id: string }> {
  const [create] = useCreateGoal();

  return (props: GoalAddForm.SaveProps) => {
    return create({
      name: props.name,
      spaceId: props.spaceId,
      anonymousAccessLevel: 0,
      companyAccessLevel: accessLevelAsNumber(props.accessLevels.company),
      spaceAccessLevel: accessLevelAsNumber(props.accessLevels.space),
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

function useSpaceSearch(): SpaceField.SearchSpaceFn {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<SpaceField.Space[]> => {
    const data = await Api.spaces.search({ query: query });

    return data.spaces.map((space) => ({
      id: space.id!,
      name: space.name!,
      link: paths.spacePath(space.id!),
    }));
  };
}
