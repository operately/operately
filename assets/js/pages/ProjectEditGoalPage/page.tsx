import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Groups from "@/models/groups";

import { useLoadedData, useRefresh } from "./loader";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { FilledButton } from "@/components/Button";
import { createTestId } from "@/utils/testid";

export function Page() {
  const { project, goals } = useLoadedData();

  return (
    <Pages.Page title={["Edit Project Goal", project.name]}>
      <Paper.Root size="medium">
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <div className="text-content-accent text-3xl font-extrabold">Select a goal to connect</div>
          <div className="max-w-prose mt-2">
            By connecting a goal, you are marking that this project is contributing to the fulfillment of that goal.
          </div>

          <SelectableGoals goals={goals} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SelectableGoals({ goals }: { goals: Goals.Goal[] }) {
  const groups = Goals.groupBySpace(goals);

  return (
    <>
      {groups.map((group) => (
        <SelectableGoalGroup key={group.space.id} space={group.space} goals={group.goals} />
      ))}
    </>
  );
}

function SelectableGoalGroup({ space, goals }: { space: Groups.Group; goals: Goals.Goal[] }) {
  return (
    <div className="flex flex-col mt-12">
      <div className="uppercase text-content-primary text-xs font-bold mb-4">{space.name} Space</div>

      {goals.map((goal) => (
        <SelectableGoal key={goal.id} goal={goal} />
      ))}
    </div>
  );
}

function SelectableGoal({ goal }: { goal: Goals.Goal }) {
  const { project } = useLoadedData();
  const refresh = useRefresh();

  const testId = createTestId("select-goal", goal.name);

  const [connect, { loading }] = Goals.useConnectGoalToProjectMutation({
    onCompleted: () => refresh(),
  });

  const handleClick = async (): Promise<boolean> => {
    connect({
      variables: {
        goalId: goal.id,
        projectId: project.id,
      },
    });

    return true;
  };

  return (
    <div className="border-t last:border-b border-stroke-base py-3">
      <div className="flex items-center justify-between">
        <div className="text-content-primary">{goal.name}</div>
        <div className="">
          <FilledButton size="xs" testId={testId} loading={loading} onClick={handleClick}>
            Select
          </FilledButton>
        </div>
      </div>
    </div>
  );
}
