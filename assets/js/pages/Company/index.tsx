import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../graphql/Companies";

import { DashboardIcon, RowsIcon, GearIcon, ChevronDownIcon } from "@radix-ui/react-icons";

import { useApolloClient } from "@apollo/client";
import { useObjectives, listObjectives, createObjective, createKeyResult } from "../../graphql/Objectives";

import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import { GoalOwner, TargetOwner } from "./Champion";
import { GoalGroup, TargetGroup } from "./Group";

export async function ObjectiveListPageLoader(apolloClient: any) {
  await listObjectives(apolloClient, {});

  return {};
}

type ShowSignOptions = "always" | "onlyNegative";

function formatMetric(value, unit, showSign: ShowSignOptions = "onlyNegative") {
  let sign = "";

  let v = Math.abs(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  switch (showSign) {
    case "always":
      sign = value > 0 ? "+" : "-";
      break;
    case "onlyNegative":
      sign = value > 0 ? "" : "-";
      break;
  }

  if (unit === "percentage") {
    return sign + v + "%";
  }

  if (unit === "currency") {
    return sign + "$" + v;
  }

  if (unit === "duration") {
    return v + " mins";
  }

  return value;
}

export function KPIValues({ kpi }) {
  if (kpi.metrics.length === 0) {
    return <div className="text-center text-gray-500">No Data</div>;
  }

  let values = kpi.metrics.map((m) => m.value / 1000);
  let target = kpi.target / 1000;
  let diffs = values.map((v) => v - target);

  let bottom = Math.min(...diffs);
  let top = Math.max(...diffs);
  let range = top - bottom;

  let areaHeight = 32;
  let targetPos = areaHeight * (top / range);

  let bars: JSX.Element[] = [];
  for (let i = 0; i < values.length; i++) {
    let value = values[i];
    let diff = diffs[i];

    let height = (areaHeight * Math.abs(diff)) / (top - bottom);
    let margin = diff < 0 ? targetPos : targetPos - height;

    let color = "bg-green-500";
    if (kpi.targetDirection === "above" && value < target) {
      color = "bg-red-500";
    }
    if (kpi.targetDirection === "below" && value > target) {
      color = "bg-red-500";
    }

    bars.push(
      <div
        className={"w-1 " + color}
        style={{
          marginTop: margin + "px",
          height: height + "px",
        }}
      ></div>,
    );
  }

  let lastValue = "--";
  let lastChange = "--";

  if (values.length > 0) {
    lastValue = formatMetric(values[values.length - 1], kpi.unit);
  }

  if (values.length > 1) {
    let change = values[values.length - 1] - values[values.length - 2];
    lastChange = formatMetric(change, kpi.unit, "always");
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-30 relative h-8 flex gap-0.5 items-start">
        {bars}
        <div
          className="absolute -left-1 -right-1 border-t border-green-500 text-right"
          style={{
            marginTop: targetPos + "px",
          }}
        ></div>
      </div>

      <div className="text-right w-20">
        <div className="font-semibold">{lastValue}</div>
        <div className={"text-xs" + (lastChange[0] === "-" ? " text-red-500" : " text-green-500")}>{lastChange}</div>
      </div>
    </div>
  );
}

export function KPI({ kpi, clickable }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable) {
      navigate("/kpis/" + kpi.id);
    }
  };

  return (
    <div
      className={"flex flex-col border-t border-gray-600 group" + (clickable ? " cursor-pointer" : "")}
      onClick={handleClick}
    >
      <div className="py-2 flex items-center gap-1 justify-between">
        <div>
          <div className="font-bold">{kpi.name}</div>
          <div className="text-sm text-gray-400">
            target: {kpi.targetDirection} {formatMetric(kpi.target / 1000, kpi.unit)}
          </div>
        </div>

        <div className="flex items-center">
          <KPIValues kpi={kpi} />

          {clickable && (
            <div className="group-hover:opacity-100 opacity-0 transition-all w-0 group-hover:w-10 ml-4">
              <Icon name="arrow right" size="base" color="dark-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
    return <AddGoalForm onSubmit={handleSubmit} onCancel={() => setFormActive(false)} />;
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
      <div className={`flex items-center justify-between px-2 py-0.5 rounded gap-1`}>
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

      {editing && <AddKeyResult objectiveId={objective.id} onKeyResultAdded={() => null} />}
    </>
  );
}

function ObjectiveCard({ objective, editing, startEditing }) {
  return (
    <div className="border-t border-b border-slate-700" data-test-id={objective.name}>
      <div className="flex flex-1 block items-center gap-2 justify-between px-2 py-2">
        <Link to={`/objectives/${objective.id}`} className="flex flex-1 items-center gap-2 font-semibold">
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
        <KeyResultList objective={objective} editing={editing} startEditing={startEditing} />
      </div>
    </div>
  );
}

function ListOfObjectives({ objectives, editing, onGoalAdded, onGoalAddingActivation, startEditing }) {
  return (
    <div className="flex flex-col gap-4" data-test-id="goalList">
      {objectives.map((objective: any, i: number) => (
        <ObjectiveCard editing={objective.id === editing} key={i} objective={objective} startEditing={startEditing} />
      ))}

      <AddGoal onGoalAdded={onGoalAdded} onActivation={onGoalAddingActivation} />
    </div>
  );
}

function Tenet({ tenet }) {
  const navigate = useNavigate();

  return (
    <div
      className="p-4 rounded bg-new-dark-2 border border-new-dark-2 hover:border-brand-base transition cursor-pointer fadeIn"
      onClick={() => navigate("/tenets/" + tenet.id)}
    >
      <div className="text-center flex flex-col items-center">
        <h1 className="uppercase font-bold mb-2 -mt-8 bg-slate-700 px-3 py-1 rounded">{tenet.name}</h1>
      </div>

      <div className="mt-4 border-b border-gray-600">
        {tenet.kpis.map((kpi) => (
          <KPI key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="flex gap-4 items-center justify-between mt-4">
        <div className="flex gap-4 items-center">
          <div className="py-1 flex gap-2 items-center">
            <Icon name="objectives" size="small" color="light" />
            12 Goals
          </div>
          <div className="py-1 flex gap-2 items-center">
            <Icon name="my projects" size="small" color="light" />
            17 Projects
          </div>
        </div>
        <div className="py-1 flex gap-2 items-center">
          <Icon name="groups" size="small" color="light" />
          40 People
        </div>
      </div>
    </div>
  );
}

<div>12 Goals &middot; 17 Projects &middot; 40 people contributing</div>;

export function CompanyPage() {
  const companyId: string = window.appConfig.companyID;

  const navigate = useNavigate();
  const { data, loading, error } = useCompany(companyId);

  // const { t } = useTranslation();
  // const { loading, error, data } = useObjectives({});

  // const [editing, setEditing] = React.useState<string | null>(null);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="mt-24">Error: {error.message}</p>;

  const company = data.company;
  console.log(company);

  // const onGoalAdded = (id: string) => {
  //   setEditing(id);
  // };

  // const onGoalAddingActivation = () => {
  //   setEditing(null);
  // };

  // const startEditing = (goalId: string) => {
  //   setEditing(goalId);
  // };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="m-11 mt-24 relative">
        <div className="mb-4 text-center flex flex-col items-center">
          <div className="rounded-full bg-new-dark-2 text-6xl w-32 h-32 font-bold flex items-center text-center justify-around mb-8 border border-gray-700">
            {company.name
              .split(" ")
              .map((e) => e[0])
              .join("")}
          </div>

          <h1 className="font-bold text-5xl">{company.name}</h1>
          <div className="text-new-dark-3 text-xl max-w-xl mt-2">{company.mission}</div>

          <div className="mt-4 flex gap-4 justify-center">
            <button className="border border-gray-600 rounded px-4 py-1 hover:border-brand-base transition-all">
              Add Tenets
            </button>

            <button className="border border-gray-600 rounded px-4 py-1 hover:border-brand-base transition-all">
              Set Goals
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 gap-y-14 my-16">
          {company.tenets.map((tenet) => (
            <Tenet key={tenet.id} tenet={tenet} />
          ))}
        </div>

        <div className="flex gap-2 top-0 right-0 absolute ">
          <button className="border border-gray-700 p-1 rounded-lg text-sm flex items-center gap-2 px-2.5">
            Dashboard View <ChevronDownIcon />
          </button>

          <button className="border border-gray-700 p-1 w-8 h-8 rounded-full flex items-center justify-center">
            <GearIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
