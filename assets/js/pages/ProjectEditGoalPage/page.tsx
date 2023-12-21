import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Groups from "@/models/groups";
import * as Projects from "@/models/projects";

import { useLoadedData, useRefresh } from "./loader";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { FilledButton, GhostButton } from "@/components/Button";
import { createTestId } from "@/utils/testid";
import { createPath } from "@/utils/paths";
import { Link } from "@/components/Link";
import Avatar from "@/components/Avatar";
import { TextTooltip } from "@/components/Tooltip";

export function Page() {
  const { project, goals } = useLoadedData();

  return (
    <Pages.Page title={["Edit Project Goal", project.name]}>
      <Paper.Root size="medium">
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          {project.goal ? <ConnectedState project={project} goals={goals} /> : <ZeroState goals={goals} />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ZeroState({ goals }: { goals: Goals.Goal[] }) {
  return (
    <>
      <div className="text-content-accent font-extrabold text-3xl">Select a goal to connect</div>

      <div className="max-w-prose mt-2">
        Linking a goal indicates that this project contributes to achieving that goal.
      </div>

      <SelectableGoals goals={goals} />
    </>
  );
}

function ConnectedState({ project, goals }: { project: Projects.Project; goals: Goals.Goal[] }) {
  return (
    <>
      <SelectedGoal goal={project.goal!} />

      <Paper.DimmedSection>
        <div className="text-content-accent font-extrabold">Select a different goal to connect</div>

        <div className="max-w-prose mt-2">
          Linking a goal indicates that this project contributes to achieving that goal.
        </div>

        <SelectableGoals goals={goals} />
      </Paper.DimmedSection>
    </>
  );
}

function SelectableGoals({ goals }: { goals: Goals.Goal[] }) {
  const { project } = useLoadedData();

  const goalsWithoutConnected = goals.filter((goal) => goal.id !== project.goal?.id);
  const groups = Goals.groupBySpace(goalsWithoutConnected);

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

function SelectedGoal({ goal }: { goal: Goals.Goal }) {
  const { project } = useLoadedData();
  const refresh = useRefresh();

  const testId = createTestId("select-goal", goal.name);

  const [connect, { loading }] = Goals.useDisconnectGoalFromProjectMutation({
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

  const goalPath = createPath("goals", goal.id);

  return (
    <>
      <div className="uppercase text-content-primary text-xs font-bold mb-2">Connected Goal</div>

      <div className="flex items-start justify-between">
        <div>
          <div className="text-content-primary text-xl font-bold">
            <Link to={goalPath}>{goal.name}</Link>
          </div>

          <div className="mt-2">
            {goal.targets!.map((target) => (
              <div key={target!.id} className="flex items-center gap-1">
                <div className="text-ellipsis w-96">{target!.name}</div>
                <ProgressBar progress={target} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Avatar person={goal.champion!} />
          <Avatar person={goal.reviewer!} />
        </div>
      </div>

      <div className="flex mt-4">
        <GhostButton type="secondary" size="xs" onClick={handleClick} loading={loading} testId={testId}>
          Disconnect
        </GhostButton>
      </div>
    </>
  );
}

function ProgressBar({ target }: { target: Goals.Target }) {
  const progress = Math.floor(Math.random() * 100.0);

  let color = "";
  if (progress < 20) color = "bg-yellow-300";
  if (progress >= 40 && progress < 80) color = "bg-yellow-500";
  if (progress >= 70) color = "bg-green-600";

  return (
    <TextTooltip text={"hello"}>
      <div className="text-ellipsis w-20 bg-gray-200 relative h-3 overflow-hidden rounded-sm">
        <div className={"absolute top-0 left-0 h-full" + " " + color} style={{ width: `${progress}%` }} />
      </div>
    </TextTooltip>
  );
}
