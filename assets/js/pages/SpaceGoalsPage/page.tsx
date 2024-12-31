import * as React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData } from "./loader";
import { GoalTree } from "@/features/goals/GoalTree";
import { Paths } from "@/routes/paths";
import { SpacePageNavigation } from "@/components/SpacePageNavigation";
import { AddGoalOrProjectButton } from "@/features/goals/AddGoalOrProjectButton";

export function Page() {
  const { space, goals, projects } = useLoadedData();

  return (
    <Pages.Page title={space.name!}>
      <Paper.Root size="large">
        <SpacePageNavigation space={space} />

        <Paper.Body minHeight="500px">
          <Header />
          <GoalTree goals={goals} projects={projects} options={{ spaceId: space.id! }} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header() {
  const { space } = useLoadedData();

  const newGoalPath = Paths.spaceNewGoalPath(space.id!);
  const newProjectPath = Paths.spaceNewProjectPath(space.id!);

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="font-extrabold text-3xl">Goals in {space.name}</div>
      <AddGoalOrProjectButton newGoalPath={newGoalPath} newProjectPath={newProjectPath} />
    </div>
  );
}
