import React from "react";
import { useTranslation } from "react-i18next";

import { useApolloClient } from "@apollo/client";
import {
  useObjectives,
  listObjectives,
  createObjective,
  createKeyResult,
  setObjectiveOwner,
} from "../../graphql/Objectives";

import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import { GoalOwner, TargetOwner } from "./Champion";
import { GoalGroup, TargetGroup } from "./Group";

import { KPI } from "../Company";
import Avatar, { AvatarSize } from "../../components/Avatar";
import RelativeTime from "../../components/RelativeTime";

export async function ObjectiveListPageLoader(apolloClient: any) {
  await listObjectives(apolloClient, {});

  return {};
}

function AddGoalForm({ onSubmit, onCancel }) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(ref.current?.value);
    }

    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="border bg-white border-dark-8% shadow rounded flex items-center text-dark-2 gap-2 px-2 py-2">
      <Icon name="objectives" size="small" color="brand" />

      <input
        ref={ref}
        data-test-id="goalFormNameInput"
        className="flex-1 outline-0 text-dark-1"
        placeholder="Describe a goal you want to achieve&hellip;"
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

function AddKeyResultForm({ onSubmit, onCancel }) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      await onSubmit(ref.current?.value);

      if (ref.current) ref.current.value = "";
    }

    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="truncate px-2 py-2 flex justify-between items-center flex-1">
      <div className="flex items-center gap-2 flex-1">
        <div className="scale-75">
          <Icon name="flag" size="small" color="light" />
        </div>

        <input
          data-test-id="targetFormNameInput"
          ref={ref}
          className="flex-1 outline-0 text-dark-1"
          placeholder="Describe what needs to happen to reach this goal&hellip;"
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}

function AddGoal({ onGoalAdded, onActivation }) {
  const client = useApolloClient();
  const [formActive, setFormActive] = React.useState(false);

  const handleActivateForm = () => {
    onActivation();
    setFormActive(true);
  };

  const handleSubmit = async (name: string) => {
    const { data } = await createObjective(client, {
      input: { name: name },
    });

    onGoalAdded(data.createObjective.id);

    setFormActive(false);
  };

  const addGoalRow = (
    <div
      data-test-id="addGoalButton"
      className="border-t border-b border-gray-700 flex items-center text-dark-2 gap-2 px-2 py-2 hover:text-dark-1 cursor-pointer"
      onClick={handleActivateForm}
    >
      <Icon name="plus" size="small" color="dark-2" />
      <div>add goal</div>
    </div>
  );

  if (formActive) {
    return (
      <AddGoalForm
        onSubmit={handleSubmit}
        onCancel={() => setFormActive(false)}
      />
    );
  } else {
    return addGoalRow;
  }
}

function AddKeyResult({ objectiveId, onKeyResultAdded }) {
  const client = useApolloClient();

  const handleSubmit = async (name: string) => {
    await createKeyResult(client, {
      input: { name: name, objectiveId: objectiveId },
    });

    onKeyResultAdded();
  };

  return <AddKeyResultForm onSubmit={handleSubmit} onCancel={() => null} />;
}

function KeyResultStatus({ keyResult }) {
  let bgColor: string = "";

  switch (keyResult.status) {
    case "pending":
      bgColor = "border-stone-400";
      break;
  }

  return (
    <div className="w-24 flex mr-4">
      <div
        className={`flex items-center justify-between px-2 py-0.5 rounded gap-1`}
      >
        <div className={`rounded-full w-3 h-3 ${bgColor} border-2`} />
        {keyResult.status}
      </div>
    </div>
  );
}

function KeyResultRow({ kr }) {
  return (
    <div className="truncate py-2 border-t border-gray-700">
      <div className="flex items-center gap-2">
        <Avatar person={kr.owner} size={AvatarSize.Tiny} />
        {kr.name}
      </div>
    </div>
  );
}

function KeyResultList({ objective, editing, startEditing }) {
  if (!editing && objective.keyResults.length === 0) {
    return (
      <div className="flex gap-2 px-4 py-2 text-dark-2">
        No assigned targets
        <a
          data-test-id="addTargetsLink"
          onClick={() => startEditing(objective.id)}
          className="underline hover:text-dark-1 cursor-pointer"
        >
          add targets
        </a>
      </div>
    );
  }

  return (
    <>
      {objective.keyResults.map((kr, i: number) => (
        <KeyResultRow key={i} kr={kr} />
      ))}

      {editing && (
        <AddKeyResult
          objectiveId={objective.id}
          onKeyResultAdded={() => null}
        />
      )}
    </>
  );
}

function ObjectiveCard({ objective, editing, startEditing }) {
  return (
    <div
      className="border-t border-gray-700 py-2 group"
      data-test-id={objective.name}
    >
      <div className="flex items-center gap-2 justify-between">
        <Icon name="expand" size="base" color="dark-2" />
        <Link
          to={`/objectives/${objective.id}`}
          className="flex flex-1 items-center gap-2"
        >
          <div>
            <div className="truncate font-bold">{objective.name}</div>
            <div className="text-sm">
              Q3 2023 &middot; In Progress for {Math.floor(Math.random() * 60)}{" "}
              days &middot; 5 ongoing projects
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {objective.owner && (
            <div className="text-right">
              <div className="font-bold">{objective.owner.fullName}</div>
              <div className="text-xs">{objective.owner.title}</div>
            </div>
          )}
          <GoalOwner objective={objective} />
        </div>

        <div className="group-hover:opacity-100 opacity-0 transition-all w-0 group-hover:w-10">
          <Icon name="arrow right" size="base" color="dark-2" />
        </div>
      </div>

      {
        // <div className="">
        // <KeyResultList
        //   objective={objective}
        //   editing={editing}
        //   startEditing={startEditing}
        // />
        // </div>
        // <div className="flex items-center"></div>
        // <div className="flex items-center gap-2">
        //   <GoalOwner objective={objective} />
        //   {objective.owner && (
        //     <div>
        //       <div className="font-bold">{objective.owner.fullName}</div>
        //     </div>
        //   )}
        // </div>
      }
    </div>
  );
}

function ListOfObjectives({
  objectives,
  editing,
  onGoalAdded,
  onGoalAddingActivation,
  startEditing,
}) {
  return (
    <div className="gap-4" data-test-id="goalList">
      {objectives.map((objective: any, i: number) => (
        <ObjectiveCard
          editing={objective.id === editing}
          key={i}
          objective={objective}
          startEditing={startEditing}
        />
      ))}

      <AddGoal
        onGoalAdded={onGoalAdded}
        onActivation={onGoalAddingActivation}
      />
    </div>
  );
}

export function ObjectiveListPage() {
  const { t } = useTranslation();
  const { loading, error, data } = useObjectives({});

  const [editing, setEditing] = React.useState<string | null>(null);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const onGoalAdded = (id: string) => {
    setEditing(id);
  };

  const onGoalAddingActivation = () => {
    setEditing(null);
  };

  const startEditing = (goalId: string) => {
    setEditing(goalId);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto mb-4">
        <div className="m-11 mt-24">
          <Link to="/company" className="font-bold underline mb-4">
            Acme Inc.
          </Link>

          <h1 className="font-bold text-3xl my-4">
            Exceptional customer service
          </h1>

          <div className="text-new-dark-3 text-xl max-w-xl">
            By consistently delivering exceptional customer service, our company
            will foster a loyal customer base that will not only continue to
            return but will also recommend the business to others.
          </div>

          <div className="mt-12 border-b border-gray-600">
            <KPI
              name="Monthly Recurring Revenue"
              lastValue="$45.2M"
              lastChange="+$1.2M"
            />
            <KPI
              name="Customer Acquisition Cost"
              lastValue="$701.2"
              lastChange="-$16.2"
            />
            <KPI
              name="Customer Lifetime Value"
              lastValue="$42.001"
              lastChange="+$8.2"
            />
          </div>
        </div>
      </div>

      <div className="bg-new-dark-1">
        <div className="max-w-7xl mx-auto bg-new-dark-2">
          <div className="p-11 mt-20">
            <div className="flex items-center justify-around relative -mt-14 mb-12">
              <h1 className="uppercase font-bold bg-slate-700 px-3 py-1 rounded z-50">
                GOALS INFLUENCING THIS TENET
              </h1>
            </div>

            <ListOfObjectives
              objectives={data.objectives}
              editing={editing}
              onGoalAdded={onGoalAdded}
              onGoalAddingActivation={onGoalAddingActivation}
              startEditing={startEditing}
            />
          </div>
        </div>
      </div>
    </>
  );
}
