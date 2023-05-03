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
      className="bg-white border border-dark-8% shadow-sm rounded flex items-center text-dark-2 gap-2 px-2 py-2 hover:text-dark-1 cursor-pointer"
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
    <div className="truncate px-2 py-2 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="scale-75">
          <Icon name="flag" size="small" color="light" />
        </div>
        {kr.name}
      </div>

      <div className="flex items-center">
        <TargetGroup target={kr} />

        <div className="border-r border-dark-8% pr-2 w-24 flex mr-4">
          <KeyResultStatus keyResult={kr} />
        </div>

        <TargetOwner target={kr} />
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
      className="border-t border-b border-slate-700"
      data-test-id={objective.name}
    >
      <div className="flex flex-1 block items-center gap-2 justify-between px-2 py-2">
        <Link
          to={`/objectives/${objective.id}`}
          className="flex flex-1 items-center gap-2 font-semibold"
        >
          <Icon name="objectives" size="small" color="brand" />
          {objective.name}
        </Link>

        <div className="flex items-center">
          <GoalGroup goal={objective} />

          <KeyResultStatus keyResult={{ status: "pending" }} />

          <GoalOwner objective={objective} />
        </div>
      </div>

      <div className="border-t border-dark-8% divide-y divide-dark-8% flex flex-col">
        <KeyResultList
          objective={objective}
          editing={editing}
          startEditing={startEditing}
        />
      </div>
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
    <div className="flex flex-col gap-4" data-test-id="goalList">
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
      <div className="mb-4 text-center flex flex-col items-center">
        <div className="rounded-full bg-new-dark-2 text-6xl w-32 h-32 font-bold flex items-center justify-around mb-8">
          AI
        </div>

        <h1 className="font-bold text-5xl">Acme Inc.</h1>
        <div className="text-new-dark-3 text-xl max-w-xl">
          Bring the best user experience to customers through innovative
          hardware, software, and services.
        </div>
      </div>

      <div className="my-16 p-8 rounded-lg bg-new-dark-2">
        <div className="flex justify-around -mt-12 mb-12">
          <h1 className="font-semibold text-sm bg-slate-700 uppercase rounded py-1 px-3 prose max-w-xl">
            Exceptional customer service
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
    </>
  );
}
