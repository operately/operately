import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useTenet } from "../../graphql/Tenets";

import {
  DashboardIcon,
  RowsIcon,
  GearIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";

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
      className="border-t border-b border-gray-700 flex items-center text-dark-2 gap-2 px-1 py-4 cursor-pointer"
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
  // if (!editing && objective.keyResults.length === 0) {
  //   return (
  //     <div className="flex gap-2 px-4 py-2 text-dark-2">
  //       No assigned targets
  //       <a
  //         data-test-id="addTargetsLink"
  //         onClick={() => startEditing(objective.id)}
  //         className="underline hover:text-dark-1 cursor-pointer"
  //       >
  //         add targets
  //       </a>
  //     </div>
  //   );
  // }
  // return (
  //   <>
  //     {objective.keyResults.map((kr, i: number) => (
  //       <KeyResultRow key={i} kr={kr} />
  //     ))}
  //     {editing && (
  //       <AddKeyResult
  //         objectiveId={objective.id}
  //         onKeyResultAdded={() => null}
  //       />
  //     )}
  //   </>
  // );
}

function ObjectiveCard({ objective, editing, startEditing }) {
  return (
    <div
      className="border-t border-gray-700 py-2 group pl-2"
      data-test-id={objective.name}
    >
      <div className="flex items-center gap-2 justify-between">
        <Link
          to={`/objectives/${objective.id}`}
          className="flex flex-1 items-center gap-2"
        >
          <div>
            <div className="truncate font-bold">{objective.name}</div>
            <div className="text-sm text-gray-400">
              Q2 2023 &middot; no ongoing projects
            </div>
          </div>
        </Link>

        <div className="w-36 mr-8 mt-1.5">
          <div className="text-left">
            <div className="w-full h-2 bg-gray-700 rounded mb-1 overflow-hidden">
              <div
                className="h-2 bg-brand-base"
                style={{
                  width: Math.floor(Math.random() * 100) + "%",
                }}
              >
                {" "}
              </div>
            </div>
            <div className="text-sm">1 of 20 steps done</div>
          </div>
        </div>

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
        //   <KeyResultList
        //     objective={objective}
        //     editing={editing}
        //     startEditing={startEditing}
        //   />
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
  const { id } = useParams();
  const { loading, error, data } = useTenet(id);

  const [editing, setEditing] = React.useState<string | null>(null);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="mt-40">Error: {error.message}</p>;

  const onGoalAdded = (id: string) => {
    setEditing(id);
  };

  const onGoalAddingActivation = () => {
    setEditing(null);
  };

  const startEditing = (goalId: string) => {
    setEditing(goalId);
  };

  const tenet = data.tenet;

  return (
    <>
      <div className="max-w-6xl mx-auto mb-4">
        <div className="m-11 mt-24 relative">
          <Link to="/company" className="font-bold underline mb-4">
            {tenet.company.name}
          </Link>

          <h1 className="font-bold text-3xl my-4">{tenet.name}</h1>

          <div className="text-new-dark-3 text-xl max-w-xl">
            {tenet.description}
          </div>

          <div className="mt-12 border-b border-gray-600">
            {tenet.kpis.map((kpi: any) => (
              <KPI key={kpi.id} kpi={kpi} clickable />
            ))}
          </div>

          <div className="flex gap-2 top-0 right-0 absolute">
            <button className="border border-gray-700 p-1 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700 transition">
              <GearIcon />
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="max-w-6xl mx-auto ">
          <div className="m-11 p-11 mt-20 bg-new-dark-2">
            <div className="flex items-center justify-around relative -mt-14 mb-12">
              <h1 className="uppercase font-bold bg-slate-700 px-3 py-1 rounded z-50">
                GOALS INFLUENCING THIS TENET
              </h1>
            </div>

            <ListOfObjectives
              objectives={tenet.objectives}
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
