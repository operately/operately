import React from "react";
import { useNavigate } from "react-router-dom";

import * as Popover from "../../components/Popover";
import Icon from "../../components/Icon";

import { useSetGoalGroup, useSetTargetGroup } from "../../graphql/Objectives";

function Profile({ group, onUnassign, onChangeGroup }): JSX.Element {
  const navigate = useNavigate();
  const handleGoToGroup = () => navigate(`/groups/${group.id}`);

  return (
    <div>
      <div className="w-56 mb-2 flex flex-col items-center">
        <div className="w-full">
          <div className="font-semibold">{group.name}</div>
          <div className="text-sm text-dark-2">{group.mission}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Popover.Button
          data-test-id="goToGroup"
          children="Go to Group"
          onClick={handleGoToGroup}
        />
        <Popover.Button
          children="Unassign"
          data-test-id="unassignGroup"
          onClick={onUnassign}
        />
        <Popover.Button
          data-test-id="changeGroup"
          children="Change Group"
          onClick={onChangeGroup}
        />
      </div>
    </div>
  );
}

function Group({ group, dataTestID, setGroup }): JSX.Element {
  const onUnassign = async () => {
    await setGroup(null);
  };

  const onChangeGroup = () => {
    console.log("change group");
  };

  let content: JSX.Element = <div>not assigned</div>;

  if (group) {
    content = (
      <Profile
        group={group}
        onChangeGroup={onChangeGroup}
        onUnassign={onUnassign}
      />
    );
  }

  const title = group ? group.name : "Unassigned";

  return (
    <Popover.Root modal={true}>
      <Popover.Trigger className="outline-0" data-test-id={dataTestID}>
        <div className="pr-2 flex flex-row-reverse">
          <div
            className="text-dark-2 rounded px-1 py-0.5 gap-0.5 flex items-center"
            title={title}
          >
            <div className="scale-75">
              <Icon name="groups" size="small" color="dark-2" />
            </div>
            {group ? group.name : "not assigned"}
          </div>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          data-test-id="championSelect"
          align="start"
          side="left"
          sideOffset={10}
          className="w-60 bg-white p-2 gap-1 card-shadow border border-dark-8% rounded transition"
          children={content}
        />
      </Popover.Portal>
    </Popover.Root>
  );
}

export function TargetGroup({ target }): JSX.Element {
  const setTargetGroup = useSetTargetGroup(target.id);

  return (
    <Group
      group={target.group}
      dataTestID="targetGroup"
      setGroup={setTargetGroup}
    />
  );
}

export function GoalGroup({ goal }): JSX.Element {
  const setGoalGroup = useSetGoalGroup(goal.id);

  return (
    <Group group={goal.group} dataTestID="goalGroup" setGroup={setGoalGroup} />
  );
}
